import asyncio

from backend.services.political_intelligence import (
    account_identity_key,
    actor_capabilities,
    calculate_engagement,
    load_sample_into_memory,
    normalize_profile_url,
    parse_csv,
    reset_memory,
    snapshot_growth,
    social_score,
)


def test_normalize_profile_url_and_identity():
    assert normalize_profile_url("WWW.Facebook.com/Sample.Rao.BNG/", "facebook") == "https://facebook.com/sample.rao.bng"
    assert normalize_profile_url("https://twitter.com/sample_rao_bng", "x") == "https://x.com/sample_rao_bng"
    assert account_identity_key("facebook", "https://facebook.com/a", "Handle") == account_identity_key("facebook", "https://www.facebook.com/a/", "handle")


def test_engagement_missing_is_not_zero():
    value, version = calculate_engagement("facebook", None, 10, 2, None)
    assert value is None
    assert version == "facebook_er_v1"
    value, _ = calculate_engagement("facebook", 1000, 50, 10, None)
    assert value == 6.0
    value, version = calculate_engagement("youtube", 2000, None, None, 400)
    assert version == "youtube_vtr_v1"
    assert value == 20.0


def test_snapshot_growth_and_social_score_skip_missing():
    snaps = [
        {"collectionDate": "2026-08-01T00:00:00+00:00", "followers": 1000},
        {"collectionDate": "2026-09-01T00:00:00+00:00", "followers": 1200},
    ]
    growth = snapshot_growth(snaps, 30)
    assert growth == 20.0
    row = {"followers": 100, "engagementPercent": None, "growth30": 10, "postsLast30Days": None}
    cohort = [row, {"followers": 200, "engagementPercent": 5, "growth30": 20, "postsLast30Days": 8}]
    score, meta = social_score(row, cohort)
    assert score is not None
    assert "engagement" not in meta["parts"]
    assert "posts30" not in meta["parts"]


def test_volunteer_cannot_verify():
    caps = actor_capabilities({"id": "vol-1", "primaryRole": "VOLUNTEER", "name": "Volunteer1"})
    assert caps["create"] is True
    assert caps["verify"] is False
    admin = actor_capabilities({"id": "adm", "email": "admin@leaderslens.ai", "isPlatformAdmin": True})
    assert admin["verify"] is True


def test_sample_seed_is_labeled():
    reset_memory()
    count = load_sample_into_memory()
    assert count > 10
    from backend.services.political_intelligence import memory_list

    for person in memory_list("political_persons"):
        assert person.get("isSample") is True
        assert "Sample" in person.get("name")


def _run(coro):
    return asyncio.run(coro)


def test_pi_api_create_leader_account_snapshot_and_self_verify(monkeypatch):
    from backend.services import pi_api
    from backend.services.political_intelligence import reset_memory, memory_list

    reset_memory()
    director = {"id": "usr-demo-director", "name": "Manager1", "primaryRole": "DIRECTOR", "stateId": "AP", "assemblyConstituencyId": "AP-AC-139"}
    admin = {"id": "usr-admin", "name": "Naresh Palle", "email": "admin@leaderslens.ai", "isPlatformAdmin": True, "primaryRole": "SUPER_ADMIN"}

    async def fake_actor(user_id):
        return director if user_id == director["id"] else admin

    monkeypatch.setattr(pi_api, "_load_actor", fake_actor)
    monkeypatch.setattr(pi_api, "_geo_lookups", lambda: _async_geo())
    monkeypatch.setattr(pi_api, "_audit", lambda *a, **k: _async_ok())

    from backend.services.pi_api import register_pi_routes
    from fastapi import APIRouter

    router = APIRouter()
    register_pi_routes(router)
    posts = {route.path: route.endpoint for route in router.routes if getattr(route, "methods", None) and "POST" in route.methods}
    gets = {route.path: route.endpoint for route in router.routes if getattr(route, "methods", None) and "GET" in route.methods}

    leader = _run(
        posts["/pi/leaders"](
            {
                "name": "A. Rao (Sample)",
                "partyId": "TDP",
                "assemblyConstituencyId": "AP-AC-139",
                "stateId": "AP",
                "politicalRole": "MLA",
            },
            userId=director["id"],
        )
    )
    assert leader["id"]
    assert leader["contactId"]
    again = _run(
        posts["/pi/leaders"](
            {
                "name": "A. Rao (Sample)",
                "partyId": "TDP",
                "assemblyConstituencyId": "AP-AC-139",
                "stateId": "AP",
                "politicalRole": "MLA",
            },
            userId=director["id"],
        )
    )
    assert again["id"] == leader["id"]

    first = _run(
        posts["/pi/social-accounts"](
            {
                "personId": leader["id"],
                "platform": "facebook",
                "profileUrl": "https://facebook.com/sample.rao.bng",
                "followers": 1000,
                "avgLikesLast10": 50,
                "avgCommentsLast10": 10,
            },
            userId=director["id"],
        )
    )
    assert first["engagementPercent"] == 6.0
    assert first.get("otp") is None
    _run(
        posts["/pi/social-accounts"](
            {
                "id": first["id"],
                "personId": leader["id"],
                "platform": "facebook",
                "profileUrl": "https://facebook.com/sample.rao.bng",
                "followers": 1500,
                "avgLikesLast10": 50,
                "avgCommentsLast10": 10,
            },
            userId=director["id"],
        )
    )
    snaps = _run(gets["/pi/social-accounts/{account_id}/snapshots"](first["id"], userId=director["id"]))
    assert len(snaps) >= 2
    assert {s["followers"] for s in snaps} >= {1000, 1500}

    try:
        _run(
            posts["/pi/social-accounts"](
                {
                    "personId": leader["id"],
                    "platform": "instagram",
                    "profileUrl": "https://www.facebook.com/sample.rao.bng/",
                },
                userId=director["id"],
            )
        )
        raise AssertionError("duplicate URL should fail")
    except Exception as exc:
        assert getattr(exc, "status_code", None) == 409 or "Duplicate" in str(exc)

    try:
        _run(posts["/pi/verification/{record_type}/{record_id}"]("social", first["id"], {"status": "VERIFIED"}, userId=director["id"]))
        raise AssertionError("self verify should fail")
    except Exception as exc:
        assert getattr(exc, "status_code", None) == 403

    verified = _run(posts["/pi/verification/{record_type}/{record_id}"]("social", first["id"], {"status": "VERIFIED", "remarks": "ok"}, userId=admin["id"]))
    assert verified["verificationStatus"] == "VERIFIED"
    history = _run(gets["/pi/verification/{record_id}/history"](first["id"], userId=admin["id"]))
    assert history and history[0]["previousStatus"] != history[0]["newStatus"]


def _async_geo():
    async def _inner():
        return {
            "assemblies": {"AP-AC-139": {"id": "AP-AC-139", "name": "Banaganapalle", "parliamentConstituencyId": "AP-PC-17", "stateId": "AP"}},
            "parliaments": {"AP-PC-17": {"id": "AP-PC-17", "name": "Nandyal"}},
            "parties": {"TDP": {"id": "TDP", "name": "Telugu Desam Party", "abbreviation": "TDP", "primaryColor": "#FFD200"}},
        }
    return _inner()


def _async_ok():
    async def _inner(*args, **kwargs):
        return None
    return _inner()


def test_import_rejects_invalid_rows(monkeypatch):
    from backend.services import pi_api
    from backend.services.political_intelligence import reset_memory

    reset_memory()
    admin = {"id": "usr-admin", "name": "Naresh", "email": "admin@leaderslens.ai", "isPlatformAdmin": True, "primaryRole": "SUPER_ADMIN"}

    async def fake_actor(user_id):
        return admin

    monkeypatch.setattr(pi_api, "_load_actor", fake_actor)
    monkeypatch.setattr(pi_api, "_geo_lookups", lambda: _async_geo())
    from fastapi import APIRouter

    router = APIRouter()
    pi_api.register_pi_routes(router)
    posts = {route.path: route.endpoint for route in router.routes if getattr(route, "methods", None) and "POST" in route.methods}
    csv_text = "recordType,assemblyConstituencyId,platform,profileUrl,followers\nsocial,NO-SUCH-AC,myspace,not-a-url,abc\n"
    preview = asyncio.run(posts["/pi/import/preview"]({"csv": csv_text}, userId=admin["id"]))
    assert preview["invalidRows"] >= 1
    assert preview["importedRows"] if False else preview["totalRows"] == 1


def test_constituency_update_preserves_history_and_links_contact(monkeypatch):
    from backend.services import pi_api
    from backend.services.political_intelligence import reset_memory, memory_list

    reset_memory()
    admin = {"id": "usr-admin", "name": "Naresh", "email": "admin@leaderslens.ai", "isPlatformAdmin": True, "primaryRole": "SUPER_ADMIN"}

    async def fake_actor(user_id):
        return admin

    monkeypatch.setattr(pi_api, "_load_actor", fake_actor)
    monkeypatch.setattr(pi_api, "_geo_lookups", lambda: _async_geo())
    monkeypatch.setattr(pi_api, "_audit", lambda *a, **k: _async_ok())

    from fastapi import APIRouter

    router = APIRouter()
    pi_api.register_pi_routes(router)
    posts = {route.path: route.endpoint for route in router.routes if getattr(route, "methods", None) and "POST" in route.methods}
    gets = {route.path: route.endpoint for route in router.routes if getattr(route, "methods", None) and "GET" in route.methods}

    first = _run(
        posts["/pi/constituencies"](
            {
                "stateId": "AP",
                "districtId": "AP-DIST-NANDYAL",
                "parliamentConstituencyId": "AP-PC-17",
                "assemblyConstituencyId": "AP-AC-139",
                "assemblyName": "Banaganapalle",
                "totalVoters": 1000,
                "estimatedFacebookUsers": 200,
            },
            userId=admin["id"],
        )
    )
    second = _run(
        posts["/pi/constituencies"](
            {
                "stateId": "AP",
                "assemblyConstituencyId": "AP-AC-139",
                "totalVoters": 1200,
                "estimatedFacebookUsers": 250,
            },
            userId=admin["id"],
        )
    )
    assert first["id"] == second["id"]
    assert second["totalVoters"] == 1200
    history = memory_list("constituency_statistics_history")
    assert history and history[0]["previous"]["totalVoters"] == 1000

    leader = _run(
        posts["/pi/leaders"](
            {
                "name": "K. Naidu (Sample)",
                "partyId": "TDP",
                "assemblyConstituencyId": "AP-AC-139",
                "stateId": "AP",
                "politicalRole": "MLA",
            },
            userId=admin["id"],
        )
    )
    contacts = _run(gets["/pi/contacts"](userId=admin["id"]))
    assert any(c.get("id") == leader["contactId"] for c in contacts)
    dash = _run(gets["/pi/dashboard"](userId=admin["id"], stateId="AP"))
    assert dash["constituenciesEntered"] >= 1
    assert dash["totalLeaders"] >= 1
    intel = _run(gets["/pi/intelligence"](userId=admin["id"], stateId="AP", districtId=None, parliamentConstituencyId=None, assemblyConstituencyId=None, platform=None, partyId=None, rankBy="followers"))
    assert intel["audienceEstimates"]["facebook"] == 250
    assert intel["socialScoreDisclaimer"]


def test_ap_districts_cascade_from_existing_geography():
    import json
    from pathlib import Path

    from backend.services.geo_districts import AP_DISTRICT_BY_NAME, _norm, build_district_catalog

    root = Path(__file__).resolve().parents[1]
    acs = json.loads((root / "data" / "assemblies.json").read_text())
    pcs = json.loads((root / "data" / "parliaments.json").read_text())
    districts, maps = build_district_catalog(acs, pcs, "AP")
    assert len(districts) >= 20
    nandyal = next(d for d in districts if d["name"] == "Nandyal")
    assert "AP-AC-139" in nandyal["assemblyConstituencyIds"]
    assert "AP-PC-17" in nandyal["parliamentConstituencyIds"]
    kurnool = next(d for d in districts if d["name"] == "Kurnool")
    assert "AP-AC-147" in kurnool["assemblyConstituencyIds"]
    kadapa = next(d for d in districts if d["name"] == "YSR Kadapa")
    assert "AP-AC-132" in kadapa["assemblyConstituencyIds"]
    missing = [_norm(a["name"]) for a in acs if a.get("stateId") == "AP" and _norm(a.get("name")) not in AP_DISTRICT_BY_NAME]
    assert missing == []
    banaga = next(m for m in maps if m["assemblyConstituencyId"] == "AP-AC-139")
    assert banaga["districtName"] == "Nandyal"
    assert banaga["parliamentConstituencyId"] == "AP-PC-17"
    ts_districts, _ = build_district_catalog(acs, pcs, "TS")
    assert len(ts_districts) >= 5
