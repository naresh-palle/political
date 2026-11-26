import asyncio
import inspect
from datetime import datetime, timedelta, timezone

import pytest
from fastapi import APIRouter, HTTPException

from backend.services.party_command import (
    DEFAULT_GAP_RULES,
    calendar_status,
    can_access_party,
    member_summary,
    merge_gap_rules,
    party_aliases,
    party_capabilities,
)

SUPER = {"id": "usr-admin", "name": "Admin", "email": "admin", "isPlatformAdmin": True, "primaryRole": "SUPER_ADMIN"}
TDP_PRES = {"id": "usr-tdp-president", "name": "TDP President", "email": "tdp-president", "roleId": "PARTY_PRESIDENT", "primaryRole": "PARTY_PRESIDENT", "commandPartyId": "TDP", "status": "ACTIVE"}
TDP_ANALYST = {"id": "usr-tdp-analyst", "name": "TDP Analyst", "email": "tdp-analyst", "roleId": "PARTY_ANALYST", "primaryRole": "PARTY_ANALYST", "commandPartyId": "TDP", "status": "ACTIVE"}
YSRCP_PRES = {"id": "usr-ysrcp-president", "name": "YSRCP President", "email": "ysrcp-president", "roleId": "PARTY_PRESIDENT", "primaryRole": "PARTY_PRESIDENT", "commandPartyId": "YSRCP", "status": "ACTIVE"}
SMA = {"id": "usr-sma", "name": "SM A", "email": "sma", "primaryRole": "SM_A", "roleId": "SM_A"}
ACTORS = {a["id"]: a for a in (SUPER, TDP_PRES, TDP_ANALYST, YSRCP_PRES, SMA)}

PARTIES = {
    "TDP": {"id": "TDP", "name": "Telugu Desam Party", "abbreviation": "TDP", "primaryColor": "#FFD200"},
    "YSRCP": {"id": "YSRCP", "name": "Yuvajana Sramika Rythu Congress Party", "abbreviation": "YSRCP", "primaryColor": "#15803D"},
    "TMC": {"id": "TMC", "name": "All India Trinamool Congress", "abbreviation": "AITC", "primaryColor": "#16A34A"},
}


def _run(coro):
    return asyncio.run(coro)


def _iso(days_ago: float = 0) -> str:
    return (datetime.now(timezone.utc) - timedelta(days=days_ago)).isoformat()


@pytest.fixture()
def routes(monkeypatch):
    from backend.services import party_api, pi_api
    from backend.services.political_intelligence import load_sample_into_memory, reset_memory

    reset_memory()
    load_sample_into_memory()

    async def fake_actor(user_id):
        if user_id in ACTORS:
            return ACTORS[user_id]
        raise HTTPException(status_code=401, detail="Unknown user")

    async def fake_geo():
        return {
            "assemblies": {"AP-AC-139": {"id": "AP-AC-139", "name": "Banaganapalle"}},
            "parliaments": {"AP-PC-17": {"id": "AP-PC-17", "name": "Nandyal"}},
            "parties": PARTIES,
        }

    async def fake_districts(_state=None):
        return [{"id": "AP-DIST-NANDYAL", "name": "Nandyal"}], []

    async def fake_create_user(doc, password):
        return doc

    async def fake_update_user(user_id, changes):
        return None

    monkeypatch.setattr(pi_api, "_load_actor", fake_actor)
    monkeypatch.setattr(pi_api, "_geo_lookups", fake_geo)
    monkeypatch.setattr(pi_api, "_resolved_districts", fake_districts)
    monkeypatch.setattr(pi_api, "_pi_mongo_db", lambda srv: None)
    monkeypatch.setattr(pi_api, "_audit_nowait", lambda *a, **k: None)
    monkeypatch.setattr(party_api, "_create_party_user", fake_create_user)
    monkeypatch.setattr(party_api, "_update_party_user", fake_update_user)
    pi_api._invalidate_collection_cache()
    party_api._reset_world_cache()
    party_api._REFRESH_JOBS.clear()

    router = APIRouter()
    party_api.register_party_routes(router)
    table = {}
    for route in router.routes:
        for method in getattr(route, "methods", None) or []:
            table[(method, route.path)] = route.endpoint
    yield table
    pi_api._invalidate_collection_cache()
    party_api._reset_world_cache()
    party_api._REFRESH_JOBS.clear()
    reset_memory()


def _call(routes, method, path, **kwargs):
    return _run(routes[(method, path)](**kwargs))


def _forbidden(fn):
    with pytest.raises(HTTPException) as exc:
        _run(fn)
    assert exc.value.status_code == 403
    return exc.value


def _tdp_member_ids(routes, user=TDP_PRES["id"]):
    data = _call(routes, "GET", "/party/{party_id}/members", party_id="TDP", userId=user)
    return [m["id"] for m in data["items"]]


# ---------- pure rules ----------

def test_capabilities_pin_party_roles_to_their_party():
    pres = party_capabilities(TDP_PRES)
    assert pres["partyId"] == "TDP" and pres["edit"] and pres["export"] and not pres["compare"]
    analyst = party_capabilities(TDP_ANALYST)
    assert analyst["view"] and analyst["export"] and analyst["research"] and not analyst["edit"]
    sup = party_capabilities(SUPER)
    assert sup["isSuper"] and sup["compare"] and sup["manageAdmins"] and sup["partyId"] is None
    assert not party_capabilities(SMA)["view"]
    assert not party_capabilities({**TDP_PRES, "status": "INACTIVE"})["view"]
    assert not party_capabilities({**TDP_PRES, "commandPartyId": ""})["view"]
    assert can_access_party(pres, "tdp") and not can_access_party(pres, "YSRCP")
    assert can_access_party(sup, "YSRCP")


def test_party_aliases_cover_abbreviations():
    assert party_aliases("TMC", PARTIES.values()) == {"TMC", "AITC"}
    assert party_aliases("AITC", PARTIES.values()) == {"TMC", "AITC"}


def test_gap_rules_merge_ignores_bad_values():
    assert merge_gap_rules(None) == DEFAULT_GAP_RULES
    assert merge_gap_rules({"inactiveDays": "10", "weeklyPostTarget": "x", "staleHours": 0})["inactiveDays"] == 10
    assert merge_gap_rules({"weeklyPostTarget": "x"})["weeklyPostTarget"] == 3


def _summary(**overrides):
    base = dict(
        roles=[{"politicalRole": "MLA"}],
        accounts=[],
        snapshots=[],
        posts=[],
        contact={"email": "m@example.com", "phone": "+91 90000 00001", "photoUrl": "https://example.com/a.jpg"},
        research=[{"createdAt": _iso(1)}],
        calendar=[],
        member_ids=["pp-1"],
        rules=dict(DEFAULT_GAP_RULES),
    )
    base.update(overrides)
    person = {"id": "pp-1", "name": "Member One", "partyId": "TDP", "assemblyConstituencyId": "AP-AC-139", "verificationStatus": "VERIFIED"}
    return member_summary(person, **base)


def test_member_summary_flags_every_gap_type():
    calendar = [{"id": "cal-1", "title": "Rally", "createdAt": _iso(5), "dueAt": _iso(1), "assignAll": True, "platforms": ["facebook"]}]
    accounts = [{"id": "a1", "platform": "facebook", "verificationStatus": "PENDING", "followers": 100, "dataCollectionDate": _iso(5)}]
    summary = _summary(accounts=accounts, contact={}, research=[], calendar=calendar)
    assert set(summary["gapTypes"]) == {
        "MISSING_ACCOUNT", "UNVERIFIED_ACCOUNT", "INACTIVE", "MISSED_CAMPAIGN_POST", "INCOMPLETE_PROFILE", "STALE_DATA", "NO_RESEARCH",
    }
    assert summary["missingFields"] == ["Email", "Phone", "Photo"]
    assert summary["completeness"] == round(100 * (2 + 1) / 9)
    assert summary["platforms"]["instagram"]["status"] == "MISSING"


def test_member_summary_posts_drive_activity():
    accounts = [{"id": f"a-{p}", "platform": p, "verificationStatus": "VERIFIED", "followers": 10, "engagementPercent": 2.0, "dataCollectionDate": _iso(0)} for p in ("facebook", "instagram", "x", "youtube")]
    posts = [{"id": "p1", "personId": "pp-1", "platform": "facebook", "publishedAt": _iso(1)}]
    summary = _summary(accounts=accounts, posts=posts)
    assert summary["postsThisWeek"] == 1
    assert "INACTIVE" not in summary["gapTypes"]
    assert "LOW_POSTING" in summary["gapTypes"]
    assert summary["completeness"] == 100
    posts += [{"id": f"p{i}", "personId": "pp-1", "platform": "x", "publishedAt": _iso(2)} for i in range(2, 5)]
    assert _summary(accounts=accounts, posts=posts)["gapTypes"] == []
    old = [{"id": "p9", "personId": "pp-1", "platform": "x", "publishedAt": _iso(12)}]
    stale = _summary(accounts=accounts, posts=old)
    assert any(g["type"] == "INACTIVE" and g["detail"] == "Last post 12 days ago" for g in stale["gaps"])


def test_member_summary_estimates_week_from_30_day_counts():
    accounts = [{"id": "a1", "platform": "facebook", "verificationStatus": "VERIFIED", "postsLast30Days": 30, "dataCollectionDate": _iso(0)}]
    summary = _summary(accounts=accounts)
    assert summary["postsThisWeek"] == 7 and summary["postsEstimated"] is True
    assert "INACTIVE" not in summary["gapTypes"]


def test_calendar_hashtag_and_link_mark_published():
    now = datetime.now(timezone.utc)
    item = {"id": "cal-1", "createdAt": _iso(3), "dueAt": _iso(-2), "assignedPersonIds": ["a", "b"], "hashtag": "#Rally", "platforms": ["instagram"]}
    posts = [
        {"id": "p1", "personId": "a", "platform": "instagram", "text": "Join the #rally today", "publishedAt": _iso(1)},
        {"id": "p2", "personId": "b", "platform": "facebook", "text": "#rally", "publishedAt": _iso(1)},
    ]
    state = calendar_status(item, ["a", "b", "c"], posts, now)
    assert state["status"] == "PLANNED" and state["publishedCount"] == 1 and state["pendingPersonIds"] == ["b"]
    posts.append({"id": "p3", "personId": "b", "platform": "facebook", "calendarId": "cal-1", "publishedAt": _iso(0)})
    assert calendar_status(item, ["a", "b"], posts, now)["status"] == "PUBLISHED"
    overdue = {**item, "dueAt": _iso(1)}
    state = calendar_status(overdue, ["a", "b"], posts[:2], now)
    assert state["status"] == "MISSED" and state["missedPersonIds"] == ["b"]


# ---------- routes ----------

def test_every_party_route_blocks_other_parties_and_non_party_roles(routes):
    tdp_ids = _tdp_member_ids(routes)
    person = tdp_ids[0]
    party_paths = sorted({path for (_m, path) in routes if "{party_id}" in path})
    assert len(party_paths) >= 14
    for (method, path), fn in routes.items():
        if "{party_id}" not in path:
            continue
        params = inspect.signature(fn).parameters
        for user in (YSRCP_PRES["id"], SMA["id"]):
            kwargs = {"party_id": "TDP", "userId": user}
            if "person_id" in params:
                kwargs["person_id"] = person
            for key in ("note_id", "post_id", "item_id"):
                if key in params:
                    kwargs[key] = "x"
            if "payload" in params:
                kwargs["payload"] = {}
            for name, param in params.items():
                if name not in kwargs and param.default is inspect.Parameter.empty:
                    kwargs[name] = None
            _forbidden(fn(**kwargs))
    for path in ("/party/compare", "/party/admins"):
        _forbidden(routes[("GET", path)](userId=TDP_PRES["id"]))
    _forbidden(routes[("POST", "/party/admins")](payload={}, userId=TDP_PRES["id"]))


def test_unknown_user_is_rejected(routes):
    with pytest.raises(HTTPException) as exc:
        _call(routes, "GET", "/party/meta", userId="nobody")
    assert exc.value.status_code == 401


def test_meta_scopes_party_list(routes):
    meta = _call(routes, "GET", "/party/meta", userId=TDP_PRES["id"])
    assert [p["id"] for p in meta["parties"]] == ["TDP"] and meta["defaultPartyId"] == "TDP"
    assert meta["capabilities"]["edit"] is True
    sup = _call(routes, "GET", "/party/meta", userId=SUPER["id"])
    assert {p["id"] for p in sup["parties"]} == set(PARTIES)


def test_overview_members_and_isolation(routes):
    tdp = _call(routes, "GET", "/party/{party_id}/overview", party_id="TDP", userId=TDP_PRES["id"])
    ysr = _call(routes, "GET", "/party/{party_id}/overview", party_id="YSRCP", userId=YSRCP_PRES["id"])
    assert tdp["totals"]["members"] == 9 and ysr["totals"]["members"] == 2
    assert tdp["totals"]["verifiedAccounts"] > 0
    assert len(tdp["mostActive"]) == 5 and len(tdp["leastActive"]) == 4
    assert not {m["id"] for m in tdp["mostActive"]} & {m["id"] for m in tdp["leastActive"]}
    assert tdp["filters"]["districts"] and tdp["filters"]["roles"]
    members = _call(routes, "GET", "/party/{party_id}/members", party_id="TDP", userId=TDP_PRES["id"])
    assert members["total"] == 9 and all(m["partyId"] == "TDP" for m in members["items"])
    first = members["items"][0]
    assert set(first["platforms"]) == {"facebook", "instagram", "x", "youtube"}
    narrowed = _call(routes, "GET", "/party/{party_id}/members", party_id="TDP", userId=TDP_PRES["id"], q=first["name"][:6])
    assert any(m["id"] == first["id"] for m in narrowed["items"])
    by_ac = _call(routes, "GET", "/party/{party_id}/members", party_id="TDP", userId=TDP_PRES["id"], assemblyConstituencyId="AP-AC-139")
    assert by_ac["items"] and all(m["assemblyConstituencyId"] == "AP-AC-139" for m in by_ac["items"])
    sup = _call(routes, "GET", "/party/{party_id}/members", party_id="YSRCP", userId=SUPER["id"])
    assert sup["total"] == 2
    incomplete = _call(routes, "GET", "/party/{party_id}/members", party_id="TDP", userId=TDP_PRES["id"], gap="INCOMPLETE_PROFILE")
    assert incomplete["total"] == tdp["totals"]["incompleteProfiles"]
    assert all("INCOMPLETE_PROFILE" in m["gapTypes"] for m in incomplete["items"])


def test_contact_edit_validation_audit_and_roles(routes):
    person = _tdp_member_ids(routes)[0]
    _forbidden(routes[("PUT", "/party/{party_id}/members/{person_id}/contact")](party_id="TDP", person_id=person, payload={"email": "a@b.co"}, userId=TDP_ANALYST["id"]))
    with pytest.raises(HTTPException) as exc:
        _call(routes, "PUT", "/party/{party_id}/members/{person_id}/contact", party_id="TDP", person_id=person, payload={"email": "bad"}, userId=TDP_PRES["id"])
    assert exc.value.status_code == 400
    saved = _call(
        routes, "PUT", "/party/{party_id}/members/{person_id}/contact", party_id="TDP", person_id=person,
        payload={"email": "Member1@Example.com", "phone": "+91 90000 00001", "photoUrl": "https://example.com/p.jpg", "consent": True},
        userId=TDP_PRES["id"],
    )
    assert saved["email"] == "member1@example.com" and saved["consentAt"]
    detail = _call(routes, "GET", "/party/{party_id}/members/{person_id}", party_id="TDP", person_id=person, userId=TDP_ANALYST["id"])
    assert detail["details"]["email"] == "member1@example.com" and detail["details"]["consent"] is True
    assert "Email" not in detail["member"]["missingFields"]
    audit = _call(routes, "GET", "/party/{party_id}/audit", party_id="TDP", userId=TDP_PRES["id"])
    actions = [r["action"] for r in audit["items"]]
    assert "PARTY_CONTACT_UPDATE" in actions and "PARTY_CONTACT_VIEW" in actions
    assert any(h["action"] == "PARTY_CONTACT_UPDATE" for h in detail["history"])
    ysr = _call(routes, "GET", "/party/{party_id}/audit", party_id="YSRCP", userId=YSRCP_PRES["id"])
    assert ysr["items"] == []
    with pytest.raises(HTTPException) as exc:
        _call(routes, "GET", "/party/{party_id}/members/{person_id}", party_id="YSRCP", person_id=person, userId=YSRCP_PRES["id"])
    assert exc.value.status_code == 404


def test_research_notes_by_analyst_and_delete_rules(routes):
    person = _tdp_member_ids(routes)[0]
    note = _call(
        routes, "POST", "/party/{party_id}/members/{person_id}/research", party_id="TDP", person_id=person,
        payload={"title": "Local issue", "body": "Water supply complaints", "tags": ["local issues"], "sources": ["https://news.example.com/a"], "attachments": [{"url": "https://files.example.com/a.pdf", "name": "a.pdf"}, {"url": "javascript:x"}]},
        userId=TDP_ANALYST["id"],
    )
    assert note["authorName"] == "TDP Analyst" and len(note["attachments"]) == 1
    listed = _call(routes, "GET", "/party/{party_id}/members/{person_id}/research", party_id="TDP", person_id=person, userId=TDP_PRES["id"])
    assert listed["items"][0]["id"] == note["id"]
    member = next(m for m in _call(routes, "GET", "/party/{party_id}/members", party_id="TDP", userId=TDP_PRES["id"])["items"] if m["id"] == person)
    assert "NO_RESEARCH" not in member["gapTypes"]
    other = _call(routes, "POST", "/party/{party_id}/members/{person_id}/research", party_id="TDP", person_id=person, payload={"title": "T", "body": "B"}, userId=TDP_PRES["id"])
    _forbidden(routes[("DELETE", "/party/{party_id}/research/{note_id}")](party_id="TDP", note_id=other["id"], userId=TDP_ANALYST["id"]))
    assert _call(routes, "DELETE", "/party/{party_id}/research/{note_id}", party_id="TDP", note_id=note["id"], userId=TDP_ANALYST["id"])["success"]
    with pytest.raises(HTTPException) as exc:
        _call(routes, "POST", "/party/{party_id}/members/{person_id}/research", party_id="TDP", person_id=person, payload={"title": ""}, userId=TDP_PRES["id"])
    assert exc.value.status_code == 400


def test_posts_update_activity_and_validate(routes):
    person = _tdp_member_ids(routes)[0]
    add = routes[("POST", "/party/{party_id}/members/{person_id}/posts")]
    _forbidden(add(party_id="TDP", person_id=person, payload={}, userId=TDP_ANALYST["id"]))
    for bad in (
        {"platform": "tiktok", "url": "https://x.com/a/status/1", "publishedAt": _iso(1)},
        {"platform": "facebook", "url": "https://instagram.com/p/abc", "publishedAt": _iso(1)},
        {"platform": "facebook", "url": "https://facebook.com/a/posts/1"},
        {"platform": "facebook", "url": "https://facebook.com/a/posts/1", "publishedAt": _iso(-3)},
    ):
        with pytest.raises(HTTPException) as exc:
            _run(add(party_id="TDP", person_id=person, payload=bad, userId=TDP_PRES["id"]))
        assert exc.value.status_code == 400
    post = _run(add(party_id="TDP", person_id=person, payload={"platform": "facebook", "url": "https://facebook.com/sample/posts/1", "text": "Roads", "publishedAt": _iso(1), "likes": "120", "views": 900}, userId=TDP_PRES["id"]))
    assert post["likes"] == 120 and post["accountId"]
    with pytest.raises(HTTPException) as exc:
        _run(add(party_id="TDP", person_id=person, payload={"platform": "facebook", "url": "https://facebook.com/sample/posts/1/", "publishedAt": _iso(1)}, userId=TDP_PRES["id"]))
    assert exc.value.status_code == 409
    posts = _call(routes, "GET", "/party/{party_id}/members/{person_id}/posts", party_id="TDP", person_id=person, userId=TDP_ANALYST["id"])
    assert [p["id"] for p in posts["items"]] == [post["id"]]
    member = next(m for m in _call(routes, "GET", "/party/{party_id}/members", party_id="TDP", userId=TDP_PRES["id"])["items"] if m["id"] == person)
    assert member["lastPostAt"] and member["postsThisWeek"] == 1 and member["postsEstimated"] is False
    _forbidden(routes[("DELETE", "/party/{party_id}/posts/{post_id}")](party_id="TDP", post_id=post["id"], userId=YSRCP_PRES["id"]))
    assert _call(routes, "DELETE", "/party/{party_id}/posts/{post_id}", party_id="TDP", post_id=post["id"], userId=TDP_PRES["id"])["success"]


def test_calendar_pending_and_missed(routes):
    ids = _tdp_member_ids(routes)
    a, b = ids[0], ids[1]
    _forbidden(routes[("POST", "/party/{party_id}/calendar")](party_id="TDP", payload={"title": "x", "dueAt": _iso(-1)}, userId=TDP_ANALYST["id"]))
    item = _call(routes, "POST", "/party/{party_id}/calendar", party_id="TDP", payload={"title": "Welfare drive", "dueAt": _iso(-2), "assignedPersonIds": [a, b, "pp-not-in-party"], "hashtag": "WelfareDrive", "platforms": ["facebook"]}, userId=TDP_PRES["id"])
    assert item["assignedPersonIds"] == [a, b] and item["hashtag"] == "#WelfareDrive"
    pending = _call(routes, "GET", "/party/{party_id}/pending", party_id="TDP", userId=TDP_PRES["id"], kind="CAMPAIGN")
    assert {i["personId"] for i in pending["items"]} == {a, b}
    _call(routes, "POST", "/party/{party_id}/members/{person_id}/posts", party_id="TDP", person_id=a, payload={"platform": "facebook", "url": "https://facebook.com/a/posts/77", "text": "Proud of the #welfaredrive", "publishedAt": _iso(0)}, userId=TDP_PRES["id"])
    cal = _call(routes, "GET", "/party/{party_id}/calendar", party_id="TDP", userId=TDP_ANALYST["id"])["items"][0]
    assert cal["publishedCount"] == 1 and cal["status"] == "PLANNED"
    pending = _call(routes, "GET", "/party/{party_id}/pending", party_id="TDP", userId=TDP_PRES["id"], kind="CAMPAIGN")
    assert [i["personId"] for i in pending["items"]] == [b]
    _call(routes, "PATCH", "/party/{party_id}/calendar/{item_id}", party_id="TDP", item_id=item["id"], payload={"dueAt": _iso(1)}, userId=TDP_PRES["id"])
    gaps = _call(routes, "GET", "/party/{party_id}/gaps", party_id="TDP", userId=TDP_PRES["id"])
    missed = next(g for g in gaps["groups"] if g["type"] == "MISSED_CAMPAIGN_POST")
    assert [m["id"] for m in missed["members"]] == [b]
    assert len(gaps["groups"]) == 8
    _call(routes, "PATCH", "/party/{party_id}/calendar/{item_id}", party_id="TDP", item_id=item["id"], payload={"markPublished": [b]}, userId=TDP_PRES["id"])
    cal = _call(routes, "GET", "/party/{party_id}/calendar", party_id="TDP", userId=TDP_PRES["id"])["items"][0]
    assert cal["status"] == "PUBLISHED"
    _call(routes, "PATCH", "/party/{party_id}/calendar/{item_id}", party_id="TDP", item_id=item["id"], payload={"status": "CANCELLED"}, userId=TDP_PRES["id"])
    assert _call(routes, "GET", "/party/{party_id}/calendar", party_id="TDP", userId=TDP_PRES["id"])["items"][0]["status"] == "CANCELLED"


def test_pending_assign_and_done(routes):
    pending = _call(routes, "GET", "/party/{party_id}/pending", party_id="TDP", userId=TDP_PRES["id"])
    assert pending["total"] > 0 and set(pending["counts"]) == {"ACCOUNT", "REVIEW", "CAMPAIGN"}
    item = pending["items"][0]
    _forbidden(routes[("PATCH", "/party/{party_id}/pending/{item_id:path}")](party_id="TDP", item_id=item["id"], payload={"status": "DONE"}, userId=TDP_ANALYST["id"]))
    saved = _call(routes, "PATCH", "/party/{party_id}/pending/{item_id:path}", party_id="TDP", item_id=item["id"], payload={"assigneeName": "Meera"}, userId=TDP_PRES["id"])
    assert saved["assigneeName"] == "Meera" and saved["status"] == "OPEN"
    again = _call(routes, "GET", "/party/{party_id}/pending", party_id="TDP", userId=TDP_PRES["id"])
    assert next(i for i in again["items"] if i["id"] == item["id"])["assigneeName"] == "Meera"
    _call(routes, "PATCH", "/party/{party_id}/pending/{item_id:path}", party_id="TDP", item_id=item["id"], payload={"status": "DONE"}, userId=TDP_PRES["id"])
    after = _call(routes, "GET", "/party/{party_id}/pending", party_id="TDP", userId=TDP_PRES["id"])
    assert item["id"] not in {i["id"] for i in after["items"]} and after["total"] == pending["total"] - 1
    with_done = _call(routes, "GET", "/party/{party_id}/pending", party_id="TDP", userId=TDP_PRES["id"], includeDone=True)
    assert next(i for i in with_done["items"] if i["id"] == item["id"])["status"] == "DONE"
    with pytest.raises(HTTPException) as exc:
        _call(routes, "PATCH", "/party/{party_id}/pending/{item_id:path}", party_id="TDP", item_id="acc:missing", payload={}, userId=TDP_PRES["id"])
    assert exc.value.status_code == 404


def test_gap_rules_change_results(routes):
    _forbidden(routes[("PUT", "/party/{party_id}/gap-rules")](party_id="TDP", payload={}, userId=TDP_ANALYST["id"]))
    with pytest.raises(HTTPException):
        _call(routes, "PUT", "/party/{party_id}/gap-rules", party_id="TDP", payload={"inactiveDays": 0}, userId=TDP_PRES["id"])
    before = _call(routes, "GET", "/party/{party_id}/gaps", party_id="TDP", userId=TDP_PRES["id"])
    low_before = next(g for g in before["groups"] if g["type"] == "LOW_POSTING")["count"]
    saved = _call(routes, "PUT", "/party/{party_id}/gap-rules", party_id="TDP", payload={"inactiveDays": 10, "weeklyPostTarget": 50, "staleHours": 48, "researchDays": 30}, userId=TDP_PRES["id"])
    assert saved["rules"]["weeklyPostTarget"] == 50
    after = _call(routes, "GET", "/party/{party_id}/gaps", party_id="TDP", userId=TDP_PRES["id"])
    assert next(g for g in after["groups"] if g["type"] == "LOW_POSTING")["count"] >= low_before
    assert after["rules"]["inactiveDays"] == 10
    ysr = _call(routes, "GET", "/party/{party_id}/gap-rules", party_id="YSRCP", userId=YSRCP_PRES["id"])
    assert ysr["rules"] == DEFAULT_GAP_RULES


def test_exports_are_csv_and_logged(routes):
    resp = _call(routes, "GET", "/party/{party_id}/members", party_id="TDP", userId=TDP_ANALYST["id"], format="csv")
    text = resp.body.decode()
    assert text.splitlines()[0].startswith("Name,Roles,District,Constituency,Email,Phone,Facebook")
    assert len(text.strip().splitlines()) == 10
    assert "attachment" in resp.headers["content-disposition"]
    gaps = _call(routes, "GET", "/party/{party_id}/gaps", party_id="TDP", userId=TDP_PRES["id"], format="csv")
    assert gaps.body.decode().startswith("Gap,Member")
    actions = [r["action"] for r in _call(routes, "GET", "/party/{party_id}/audit", party_id="TDP", userId=SUPER["id"])["items"]]
    assert "PARTY_MEMBERS_EXPORT" in actions and "PARTY_GAPS_EXPORT" in actions


def test_compare_is_super_only_and_public(routes):
    data = _call(routes, "GET", "/party/compare", userId=SUPER["id"])
    ids = [r["partyId"] for r in data["parties"]]
    assert set(ids) == {"TDP", "YSRCP"}
    row = data["parties"][0]
    assert set(row) == {"partyId", "name", "abbreviation", "color", "members", "followers", "postsPerWeek", "avgEngagement", "verifiedPercent"}
    _forbidden(routes[("GET", "/party/compare")](userId=TDP_ANALYST["id"]))


def test_super_admin_creates_and_deactivates_party_accounts(routes):
    create = routes[("POST", "/party/admins")]
    with pytest.raises(HTTPException) as exc:
        _run(create(payload={"name": "X", "username": "x", "password": "short", "partyId": "TDP"}, userId=SUPER["id"]))
    assert exc.value.status_code == 400
    with pytest.raises(HTTPException) as exc:
        _run(create(payload={"name": "X", "username": "x", "password": "longenough1", "partyId": "NOPE"}, userId=SUPER["id"]))
    assert exc.value.status_code == 400
    record = _run(create(payload={"name": "BJP Analyst", "username": "BJP-Analyst", "password": "Analyst@2026", "partyId": "tmc", "role": "PARTY_ANALYST"}, userId=SUPER["id"]))
    assert record["partyId"] == "TMC" and record["user"]["email"] == "bjp-analyst" and record["user"]["commandPartyId"] == "TMC"
    with pytest.raises(HTTPException):
        _run(create(payload={"name": "Dup", "username": "bjp-analyst", "password": "Analyst@2026", "partyId": "TDP"}, userId=SUPER["id"]))
    listed = _call(routes, "GET", "/party/admins", userId=SUPER["id"])["items"]
    assert listed[0]["user"]["email"] == "bjp-analyst" and "passwordHash" not in listed[0]["user"]
    meta = _call(routes, "GET", "/party/meta", userId=record["id"])
    assert meta["defaultPartyId"] == "TMC" and meta["capabilities"]["edit"] is False
    _call(routes, "PATCH", "/party/admins/{admin_id}", admin_id=record["id"], payload={"active": False}, userId=SUPER["id"])
    with pytest.raises(HTTPException) as exc:
        _call(routes, "GET", "/party/meta", userId=record["id"])
    assert exc.value.status_code == 403


def test_window_days_changes_the_count_and_not_the_weekly_gap():
    accounts = [{"id": "a1", "platform": "facebook", "verificationStatus": "VERIFIED", "postsLast30Days": 30, "dataCollectionDate": _iso(0)}]
    week = _summary(accounts=accounts)
    month = _summary(accounts=accounts, window_days=30)
    assert week["postsThisWeek"] == 7 and week["postsInWindow"] == 7
    assert month["postsThisWeek"] == 7 and month["postsInWindow"] == 30
    assert month["windowDays"] == 30
    posts = [{"id": "old", "personId": "pp-1", "publishedAt": _iso(20)}, {"id": "new", "personId": "pp-1", "publishedAt": _iso(1)}]
    scoped = _summary(accounts=accounts, posts=posts, window_days=7)
    assert scoped["postsThisWeek"] == 1 and scoped["postsInWindow"] == 1
    assert _summary(accounts=accounts, posts=posts, window_days=30)["postsInWindow"] == 2
    assert _summary(accounts=accounts, posts=posts, window_days=0)["postsInWindow"] == 2


def test_refresh_saves_real_post_shape_and_does_not_duplicate(routes, monkeypatch):
    import backend.services.party_api as party_api

    async def fake_fetch(platform, url, limit=9):
        if platform != "youtube":
            return {"success": False, "platform": platform, "posts": [], "detail": "Add RAPIDAPI_KEY on the server to fetch posts from this platform."}
        return {
            "success": True,
            "platform": "youtube",
            "posts": [{
                "platform": "youtube",
                "url": "https://www.youtube.com/watch?v=abc12345678",
                "text": "Health camp",
                "publishedAt": _iso(1),
                "thumbnailUrl": "https://i.ytimg.com/vi/abc12345678/hqdefault.jpg",
                "views": 42,
                "likes": None,
                "comments": None,
                "shares": None,
                "externalId": "abc12345678",
            }],
        }

    monkeypatch.setattr(party_api, "fetch_recent_posts", fake_fetch)
    first = _call(routes, "POST", "/party/{party_id}/posts/refresh", party_id="TDP", userId=TDP_PRES["id"], payload={"wait": True, "force": True})
    assert first["status"] == "DONE" and first["saved"] >= 1
    assert any("RAPIDAPI_KEY" in note for note in first["notes"])
    second = _call(routes, "POST", "/party/{party_id}/posts/refresh", party_id="TDP", userId=TDP_PRES["id"], payload={"wait": True, "force": True})
    assert second["saved"] == 0 and second["updated"] >= 1
    members = _call(routes, "GET", "/party/{party_id}/members", party_id="TDP", userId=TDP_PRES["id"])["items"]
    posted = [m for m in members if m["lastPostAt"]]
    assert posted and all(m["postsEstimated"] is False for m in posted)
    person = posted[0]["id"]
    detail = _call(routes, "GET", "/party/{party_id}/members/{person_id}", party_id="TDP", person_id=person, userId=TDP_PRES["id"])
    saved = detail["posts"][0]
    assert saved["thumbnailUrl"].endswith("hqdefault.jpg") and saved["views"] == 42 and saved["text"] == "Health camp"


def test_remind_and_team_are_party_scoped(routes):
    gaps = _call(routes, "GET", "/party/{party_id}/gaps", party_id="TDP", userId=TDP_PRES["id"])
    group = next(g for g in gaps["groups"] if g["members"])
    person = group["members"][0]["id"]
    saved = _call(routes, "POST", "/party/{party_id}/reminders", party_id="TDP", userId=TDP_PRES["id"], payload={"personId": person, "gapType": group["type"]})
    assert saved["gapType"] == group["type"] and not saved.get("already")
    again = _call(routes, "POST", "/party/{party_id}/reminders", party_id="TDP", userId=TDP_PRES["id"], payload={"personId": person, "gapType": group["type"]})
    assert again.get("already") is True
    refreshed = _call(routes, "GET", "/party/{party_id}/gaps", party_id="TDP", userId=TDP_PRES["id"])
    row = next(m for g in refreshed["groups"] if g["type"] == group["type"] for m in g["members"] if m["id"] == person)
    assert row["remindedBy"] == "TDP President" and row["remindedAt"]
    team = _call(routes, "GET", "/party/{party_id}/team", party_id="TDP", userId=TDP_PRES["id"])["items"]
    assert any(item["name"] == "TDP President" for item in team)
    assert all(item["role"] in {"PARTY_PRESIDENT", "PARTY_ANALYST"} for item in team)
    assert not any(item["name"] == "YSRCP President" for item in team)


def test_state_wise_filtering_and_multiplatform_calendar(routes):
    # 1. State filtering cascade in overview
    tdp_ap = _call(routes, "GET", "/party/{party_id}/overview", party_id="TDP", userId=TDP_PRES["id"], stateId="AP")
    assert "states" in tdp_ap["filters"]
    assert any(s["id"] == "AP" for s in tdp_ap["filters"]["states"])
    # AP is first state option
    assert tdp_ap["filters"]["states"][0]["id"] == "AP"
    # Districts list returned for AP
    assert tdp_ap["filters"]["districts"]
    assert all("AP" in d["id"] or d.get("stateId") == "AP" for d in tdp_ap["filters"]["districts"])

    # 2. Multi-platform posts in Content Calendar & Top Posts showcase
    members = _call(routes, "GET", "/party/{party_id}/members", party_id="TDP", userId=TDP_PRES["id"])["items"]
    m_id = members[0]["id"]
    for plat in ["youtube", "instagram", "facebook", "x"]:
        _call(
            routes,
            "POST",
            "/party/{party_id}/members/{person_id}/posts",
            party_id="TDP",
            person_id=m_id,
            userId=TDP_PRES["id"],
            payload={
                "platform": plat,
                "url": f"https://{plat}.com/update_{plat}_1",
                "text": f"Real constituency initiative on {plat}",
                "publishedAt": _iso(1),
                "thumbnailUrl": f"https://img.test/{plat}.jpg",
                "likes": 400,
                "views": 2000,
            },
        )

    cal = _call(routes, "GET", "/party/{party_id}/calendar", party_id="TDP", userId=TDP_PRES["id"])
    top = cal.get("topPosts") or []
    assert len(top) > 0
    platforms = {p["platform"] for p in top}
    # Verify Instagram, Facebook, X, and YouTube are all present
    assert "instagram" in platforms
    assert "facebook" in platforms
    assert "x" in platforms
    assert "youtube" in platforms
    # Check top post structure has thumbnail, reach, likes, views
    sample = top[0]
    assert sample["thumbnailUrl"]
    assert sample["reach"] > 0
    assert sample["url"]

    # 3. Top posts platform filtering
    x_posts = _call(routes, "GET", "/party/{party_id}/top-posts", party_id="TDP", userId=TDP_PRES["id"], platform="x")
    assert len(x_posts["items"]) > 0
    assert all(p["platform"] == "x" for p in x_posts["items"])

    ig_posts = _call(routes, "GET", "/party/{party_id}/top-posts", party_id="TDP", userId=TDP_PRES["id"], platform="instagram")
    assert len(ig_posts["items"]) > 0
    assert all(p["platform"] == "instagram" for p in ig_posts["items"])

