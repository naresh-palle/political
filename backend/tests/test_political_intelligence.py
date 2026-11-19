import asyncio
import sys
import time

from backend.services.political_intelligence import (
    PERSON_ROLES,
    account_identity_key,
    actor_capabilities,
    aggregate_account_metrics,
    calculate_engagement,
    load_sample_into_memory,
    normalize_profile_url,
    parse_csv,
    profile_url_platform_error,
    profile_username,
    reset_memory,
    snapshot_growth,
    social_score,
)


def test_no_account_identity_is_per_person():
    assert account_identity_key("youtube", "https://none.invalid/a/youtube", "", person_id="pp-1", no_account=True) != account_identity_key(
        "youtube", "https://none.invalid/b/youtube", "", person_id="pp-2", no_account=True
    )
    assert "CONTESTED_CANDIDATE" in PERSON_ROLES


def test_normalize_profile_url_and_identity():
    assert normalize_profile_url("WWW.Facebook.com/Sample.Rao.BNG/", "facebook") == "https://facebook.com/sample.rao.bng"
    assert normalize_profile_url("https://twitter.com/sample_rao_bng", "x") == "https://x.com/sample_rao_bng"
    assert account_identity_key("facebook", "https://facebook.com/a", "Handle") == account_identity_key("facebook", "https://www.facebook.com/a/", "handle")
    assert profile_username("https://facebook.com/Sample.Rao.BNG/", "facebook") == "sample.rao.bng"
    assert profile_username("https://www.instagram.com/kadapa.leader/", "instagram") == "kadapa.leader"
    assert profile_username("https://x.com/tdp_official", "x") == "tdp_official"
    assert profile_username("https://youtube.com/@kadapa-tv", "youtube") == "kadapa-tv"
    assert profile_username("https://none.invalid/abc/facebook", "facebook") == ""


def test_profile_url_must_match_platform():
    assert profile_url_platform_error("https://twitter.com/sample_rao", "facebook")
    assert "X / Twitter" in (profile_url_platform_error("https://x.com/sample_rao", "facebook") or "")
    assert profile_url_platform_error("https://instagram.com/sample_rao", "facebook")
    assert profile_url_platform_error("https://facebook.com/sample.rao", "instagram")
    assert profile_url_platform_error("https://youtube.com/@sample", "x")
    assert profile_url_platform_error("https://x.com/sample_rao", "youtube")
    assert profile_url_platform_error("https://linkedin.com/in/sample", "facebook")
    assert not profile_url_platform_error("https://facebook.com/sample.rao", "facebook")
    assert not profile_url_platform_error("https://fb.com/sample.rao", "facebook")
    assert not profile_url_platform_error("https://twitter.com/sample_rao", "x")
    assert not profile_url_platform_error("https://www.instagram.com/sample.rao/", "instagram")
    assert not profile_url_platform_error("https://youtu.be/abcd123", "youtube")
    assert not profile_url_platform_error("@nandyal_mla", "facebook")


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


def test_aggregate_account_metrics_uses_only_given_accounts():
    facebook = {"id": "a-fb", "platform": "facebook", "followers": 5000, "engagementPercent": 4, "postsLast30Days": 10, "growth30": 2}
    instagram = {"id": "a-ig", "platform": "instagram", "followers": 800, "engagementPercent": 8, "postsLast30Days": 4, "growth30": 20}
    none = {"id": "a-yt", "platform": "youtube", "followers": 9000, "verificationStatus": "NO_ACCOUNT", "noAccount": True}
    all_platforms = aggregate_account_metrics([facebook, instagram, none])
    ig_only = aggregate_account_metrics([instagram])
    assert all_platforms["followers"] == 5800
    assert ig_only["followers"] == 800
    assert ig_only["growth30"] == 20
    assert ig_only["engagementPercent"] == 8


def test_volunteer_cannot_verify():
    caps = actor_capabilities({"id": "vol-1", "primaryRole": "VOLUNTEER", "name": "Volunteer1"})
    assert caps["view"] is False
    assert caps["create"] is False
    assert caps["verify"] is False
    director = actor_capabilities({"id": "usr-demo-director", "primaryRole": "DIRECTOR", "name": "Manager1"})
    assert director["view"] is False
    assert director["create"] is False
    admin = actor_capabilities({"id": "adm", "email": "admin", "isPlatformAdmin": True})
    assert admin["view"] is True
    assert admin["create"] is True
    assert admin["update"] is True
    assert admin["delete"] is True
    assert admin["verify"] is True
    sma = actor_capabilities({"id": "usr-sma", "name": "SM A", "primaryRole": "SM_A", "email": "sma"})
    assert sma["view"] is True
    assert sma["create"] is True
    assert sma["delete"] is False
    assert sma["verify"] is False
    assert sma["isSmA"] is True
    smm = actor_capabilities({"id": "usr-smm", "name": "SM M", "primaryRole": "SM_M", "email": "smm"})
    assert smm["view"] is True
    assert smm["create"] is False
    assert smm["delete"] is True
    assert smm["verify"] is True
    assert smm["isSmM"] is True


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
    director = {"id": "usr-manager", "name": "Manager", "primaryRole": "DIRECTOR", "stateId": "AP", "assemblyConstituencyId": "AP-AC-139"}
    sm_a = {"id": "usr-sma", "name": "SM A", "email": "sma", "primaryRole": "SM_A", "roleId": "SM_A"}
    sm_m = {"id": "usr-smm", "name": "SM M", "email": "smm", "primaryRole": "SM_M", "roleId": "SM_M"}
    admin = {"id": "usr-admin", "name": "Admin", "email": "admin", "isPlatformAdmin": True, "primaryRole": "SUPER_ADMIN"}

    async def fake_actor(user_id):
        if user_id == director["id"]:
            return director
        if user_id == sm_a["id"]:
            return sm_a
        if user_id == sm_m["id"]:
            return sm_m
        return admin

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
            userId=sm_a["id"],
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
            userId=sm_a["id"],
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
            userId=sm_a["id"],
        )
    )
    assert first["engagementPercent"] == 6.0
    assert first.get("otp") is None
    try:
        _run(
            posts["/pi/social-accounts"](
                {
                    "personId": leader["id"],
                    "platform": "instagram",
                    "profileUrl": "https://instagram.com/sample.rao.bng",
                    "followers": 100,
                },
                userId=director["id"],
            )
        )
        raise AssertionError("director should not write PI records")
    except Exception as exc:
        assert getattr(exc, "status_code", None) == 403
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
            userId=sm_a["id"],
        )
    )
    snaps = _run(gets["/pi/social-accounts/{account_id}/snapshots"](first["id"], userId=sm_a["id"]))
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
                userId=sm_a["id"],
            )
        )
        raise AssertionError("Facebook URL must not save as Instagram")
    except Exception as exc:
        assert getattr(exc, "status_code", None) == 400
        assert "Facebook" in str(exc)
    try:
        _run(
            posts["/pi/social-accounts"](
                {
                    "personId": leader["id"],
                    "platform": "facebook",
                    "profileUrl": "https://twitter.com/sample_rao_bng",
                },
                userId=sm_a["id"],
            )
        )
        raise AssertionError("Twitter URL must not save as Facebook")
    except Exception as exc:
        assert getattr(exc, "status_code", None) == 400
        assert "Twitter" in str(exc) or "X" in str(exc)

    try:
        _run(posts["/pi/verification/{record_type}/{record_id}"]("social", first["id"], {"status": "VERIFIED", "remarks": "ok"}, userId=sm_a["id"]))
        raise AssertionError("SM A should not verify records")
    except Exception as exc:
        assert getattr(exc, "status_code", None) == 403
    verified = _run(posts["/pi/verification/{record_type}/{record_id}"]("social", first["id"], {"status": "VERIFIED", "remarks": "ok"}, userId=sm_m["id"]))
    assert verified["verificationStatus"] == "VERIFIED"
    history = _run(gets["/pi/verification/{record_id}/history"](first["id"], userId=admin["id"]))
    assert history and history[0]["previousStatus"] != history[0]["newStatus"]

    deletes = {route.path: route.endpoint for route in router.routes if getattr(route, "methods", None) and "DELETE" in route.methods}
    try:
        _run(deletes["/pi/leaders/{person_id}"](leader["id"], userId=sm_a["id"]))
        raise AssertionError("SM A should not delete leaders")
    except Exception as exc:
        assert getattr(exc, "status_code", None) == 403
    removed = _run(deletes["/pi/leaders/{person_id}"](leader["id"], userId=admin["id"]))
    assert removed["success"] is True
    leftover = [row for row in memory_list("political_persons") if row.get("id") == leader["id"]]
    assert leftover == []


def test_leader_nested_accounts_save_in_one_request(monkeypatch):
    from backend.services import pi_api
    from backend.services.political_intelligence import memory_list, reset_memory

    reset_memory()
    sm_a = {"id": "usr-sma", "name": "SM A", "email": "sma", "primaryRole": "SM_A", "roleId": "SM_A"}

    async def fake_actor(user_id):
        return sm_a

    monkeypatch.setattr(pi_api, "_load_actor", fake_actor)
    monkeypatch.setattr(pi_api, "_geo_lookups", lambda: _async_geo())
    monkeypatch.setattr(pi_api, "_audit", lambda *a, **k: _async_ok())

    from fastapi import APIRouter

    from backend.services.pi_api import register_pi_routes

    router = APIRouter()
    register_pi_routes(router)
    posts = {route.path: route.endpoint for route in router.routes if getattr(route, "methods", None) and "POST" in route.methods}

    leader = _run(
        posts["/pi/leaders"](
            {
                "name": "Fast Save Rao",
                "partyId": "TDP",
                "assemblyConstituencyId": "AP-AC-139",
                "stateId": "AP",
                "politicalRole": "MLA",
                "accounts": [
                    {"platform": "facebook", "profileUrl": "https://facebook.com/fast.save.rao", "followers": 1200},
                    {"platform": "instagram", "verificationStatus": "NO_ACCOUNT"},
                ],
            },
            userId=sm_a["id"],
        )
    )
    assert leader["id"]
    assert {row.get("platform") for row in leader.get("accounts") or []} == {"facebook", "instagram"}
    facebook = next(row for row in leader["accounts"] if row["platform"] == "facebook")
    assert facebook["followers"] == 1200
    instagram = next(row for row in leader["accounts"] if row["platform"] == "instagram")
    assert instagram["verificationStatus"] == "NO_ACCOUNT"
    stored = [row for row in memory_list("social_media_accounts") if row.get("personId") == leader["id"]]
    assert len(stored) == 2


def test_two_leaders_can_mark_youtube_as_no_account(monkeypatch):
    from backend.services import pi_api
    from backend.services.political_intelligence import memory_list, reset_memory

    reset_memory()
    sm_a = {"id": "usr-sma", "name": "SM A", "email": "sma", "primaryRole": "SM_A", "roleId": "SM_A"}

    async def fake_actor(user_id):
        return sm_a

    monkeypatch.setattr(pi_api, "_load_actor", fake_actor)
    monkeypatch.setattr(pi_api, "_geo_lookups", lambda: _async_geo())
    monkeypatch.setattr(pi_api, "_audit", lambda *a, **k: _async_ok())

    from fastapi import APIRouter

    from backend.services.pi_api import register_pi_routes

    router = APIRouter()
    register_pi_routes(router)
    posts = {route.path: route.endpoint for route in router.routes if getattr(route, "methods", None) and "POST" in route.methods}

    first = _run(
        posts["/pi/leaders"](
            {
                "name": "Leader One",
                "partyId": "TDP",
                "assemblyConstituencyId": "AP-AC-139",
                "stateId": "AP",
                "politicalRole": "MLA",
                "roles": [{"politicalRole": "MLA"}, {"politicalRole": "CONTESTED_CANDIDATE"}],
                "accounts": [
                    {"platform": "facebook", "profileUrl": "https://facebook.com/leader.one", "followers": 10},
                    {"platform": "youtube", "verificationStatus": "NO_ACCOUNT"},
                ],
            },
            userId=sm_a["id"],
        )
    )
    second = _run(
        posts["/pi/leaders"](
            {
                    "name": "Anantha Venkata Rami Reddy",
                    "partyId": "TDP",
                "assemblyConstituencyId": "AP-AC-139",
                "stateId": "AP",
                "politicalRole": "CONTESTED_CANDIDATE",
                "accounts": [
                    {"platform": "facebook", "profileUrl": "https://facebook.com/leader.one", "followers": 11},
                    {"platform": "instagram", "profileUrl": "https://instagram.com/anantha.reddy", "followers": 8},
                    {"platform": "x", "profileUrl": "https://x.com/anantha_reddy", "followers": 4},
                    {"platform": "youtube", "verificationStatus": "NO_ACCOUNT"},
                ],
            },
            userId=sm_a["id"],
        )
    )
    assert first["id"] != second["id"]
    assert {row["politicalRole"] for row in first["roles"]} >= {"MLA", "CONTESTED_CANDIDATE"}
    assert len(second["accounts"]) >= 3
    assert any(row.get("platform") == "youtube" for row in second["accounts"])
    assert second.get("accountErrors")
    assert "Facebook" in (second["accountErrors"][0]["detail"] if second["accountErrors"] else "")
    youtube_rows = [row for row in memory_list("social_media_accounts") if row.get("platform") == "youtube"]
    assert len(youtube_rows) >= 2


def test_verified_and_rejected_queue_is_final(monkeypatch):
    from backend.services import pi_api
    from backend.services.political_intelligence import reset_memory, memory_list

    reset_memory()
    sm_a = {"id": "usr-sma", "name": "SM A", "email": "sma", "primaryRole": "SM_A", "roleId": "SM_A"}
    sm_m = {"id": "usr-smm", "name": "SM M", "email": "smm", "primaryRole": "SM_M", "roleId": "SM_M"}

    async def fake_actor(user_id):
        return sm_a if user_id == sm_a["id"] else sm_m

    monkeypatch.setattr(pi_api, "_load_actor", fake_actor)
    monkeypatch.setattr(pi_api, "_geo_lookups", lambda: _async_geo())
    monkeypatch.setattr(pi_api, "_audit", lambda *a, **k: _async_ok())

    from fastapi import APIRouter

    from backend.services.pi_api import register_pi_routes

    router = APIRouter()
    register_pi_routes(router)
    posts = {route.path: route.endpoint for route in router.routes if getattr(route, "methods", None) and "POST" in route.methods}
    gets = {route.path: route.endpoint for route in router.routes if getattr(route, "methods", None) and "GET" in route.methods}

    leader = _run(
        posts["/pi/leaders"](
            {
                "name": "Queue Lock Rao",
                "partyId": "TDP",
                "assemblyConstituencyId": "AP-AC-139",
                "stateId": "AP",
                "politicalRole": "MLA",
            },
            userId=sm_a["id"],
        )
    )
    keep = _run(
        posts["/pi/social-accounts"](
            {
                "personId": leader["id"],
                "platform": "facebook",
                "profileUrl": "https://facebook.com/queue.lock.keep",
                "followers": 11,
            },
            userId=sm_a["id"],
        )
    )
    drop = _run(
        posts["/pi/social-accounts"](
            {
                "personId": leader["id"],
                "platform": "instagram",
                "profileUrl": "https://instagram.com/queue.lock.drop",
                "followers": 7,
            },
            userId=sm_a["id"],
        )
    )

    pending = _run(gets["/pi/verification-queue"](userId=sm_m["id"], status="PENDING"))
    assert {row["id"] for row in pending} >= {keep["id"], drop["id"]}
    geo_rows = [row for row in pending if row["id"] in {keep["id"], drop["id"]}]
    assert geo_rows
    assert all(row.get("districtName") and row.get("assemblyName") and row.get("platform") for row in geo_rows)

    verified = _run(posts["/pi/verification/{record_type}/{record_id}"]("social", keep["id"], {"status": "VERIFIED"}, userId=sm_m["id"]))
    assert verified["verificationStatus"] == "VERIFIED"
    again = _run(posts["/pi/verification/{record_type}/{record_id}"]("social", keep["id"], {"status": "VERIFIED"}, userId=sm_m["id"]))
    assert again["verificationStatus"] == "VERIFIED"
    try:
        _run(posts["/pi/verification/{record_type}/{record_id}"]("social", keep["id"], {"status": "REJECTED", "remarks": "too late"}, userId=sm_m["id"]))
        raise AssertionError("verified accounts must not be rejected")
    except Exception as exc:
        assert getattr(exc, "status_code", None) == 409

    try:
        _run(posts["/pi/verification/{record_type}/{record_id}"]("social", drop["id"], {"status": "REJECTED"}, userId=sm_m["id"]))
        raise AssertionError("reject must require remarks")
    except Exception as exc:
        assert getattr(exc, "status_code", None) == 400
    rejected = _run(
        posts["/pi/verification/{record_type}/{record_id}"]("social", drop["id"], {"status": "REJECTED", "remarks": "wrong handle"}, userId=sm_m["id"])
    )
    assert rejected["verificationStatus"] == "REJECTED"
    try:
        _run(posts["/pi/verification/{record_type}/{record_id}"]("social", drop["id"], {"status": "VERIFIED"}, userId=sm_m["id"]))
        raise AssertionError("rejected accounts must stay rejected")
    except Exception as exc:
        assert getattr(exc, "status_code", None) == 409

    pending_after = _run(gets["/pi/verification-queue"](userId=sm_m["id"], status="PENDING"))
    verified_rows = _run(gets["/pi/verification-queue"](userId=sm_m["id"], status="VERIFIED"))
    rejected_rows = _run(gets["/pi/verification-queue"](userId=sm_m["id"], status="REJECTED"))
    assert keep["id"] not in {row["id"] for row in pending_after}
    assert drop["id"] not in {row["id"] for row in pending_after}
    assert any(row["id"] == keep["id"] and row["verificationStatus"] == "VERIFIED" for row in verified_rows)
    assert any(row["id"] == drop["id"] and row["verificationStatus"] == "REJECTED" for row in rejected_rows)
    stored = {row["id"]: row for row in memory_list("social_media_accounts")}
    assert stored[keep["id"]]["verificationStatus"] == "VERIFIED"
    assert stored[drop["id"]]["verificationStatus"] == "REJECTED"


def test_smm_deletes_social_account_and_writes_audit(monkeypatch):
    from backend.services import pi_api
    from backend.services.political_intelligence import reset_memory, memory_list

    reset_memory()
    sm_a = {"id": "usr-sma", "name": "SM A", "email": "sma", "primaryRole": "SM_A", "roleId": "SM_A"}
    sm_m = {"id": "usr-smm", "name": "SM M", "email": "smm", "primaryRole": "SM_M", "roleId": "SM_M"}
    audits = []

    async def fake_actor(user_id):
        return sm_a if user_id == sm_a["id"] else sm_m

    async def capture_audit(actor, action, target, metadata=None, target_name=None):
        audits.append({"action": action, "target": target, "metadata": metadata or {}, "target_name": target_name})

    monkeypatch.setattr(pi_api, "_load_actor", fake_actor)
    monkeypatch.setattr(pi_api, "_geo_lookups", lambda: _async_geo())
    monkeypatch.setattr(pi_api, "_audit", capture_audit)
    monkeypatch.setattr(pi_api, "_audit_nowait", lambda actor, action, target, metadata=None, target_name=None: audits.append({"action": action, "target": target, "metadata": metadata or {}, "target_name": target_name}))

    from backend.services.pi_api import register_pi_routes
    from fastapi import APIRouter

    router = APIRouter()
    register_pi_routes(router)
    posts = {route.path: route.endpoint for route in router.routes if getattr(route, "methods", None) and "POST" in route.methods}
    deletes = {route.path: route.endpoint for route in router.routes if getattr(route, "methods", None) and "DELETE" in route.methods}

    leader = _run(
        posts["/pi/leaders"](
            {
                "name": "Delete Me Rao",
                "partyId": "TDP",
                "assemblyConstituencyId": "AP-AC-139",
                "stateId": "AP",
                "politicalRole": "MLA",
            },
            userId=sm_a["id"],
        )
    )
    account = _run(
        posts["/pi/social-accounts"](
            {
                "personId": leader["id"],
                "platform": "instagram",
                "profileUrl": "https://instagram.com/delete.me.rao",
                "followers": 9,
            },
            userId=sm_a["id"],
        )
    )
    try:
        _run(deletes["/pi/social-accounts/{account_id}"](account["id"], userId=sm_a["id"]))
        raise AssertionError("SM A must not delete social accounts")
    except Exception as exc:
        assert getattr(exc, "status_code", None) == 403

    removed = _run(deletes["/pi/social-accounts/{account_id}"](account["id"], userId=sm_m["id"]))
    assert removed["success"] is True
    assert account["id"] not in {row["id"] for row in memory_list("social_media_accounts")}
    social_deletes = [row for row in audits if row["action"] == "PI_SOCIAL_DELETE"]
    assert social_deletes
    assert social_deletes[-1]["target"] == account["id"]
    assert social_deletes[-1]["metadata"].get("platform") == "instagram"
    assert any(row["action"] == "PI_SOCIAL_UPSERT" for row in audits)


def test_verified_social_account_cannot_be_deleted(monkeypatch):
    from backend.services import pi_api
    from backend.services.political_intelligence import reset_memory, memory_list

    reset_memory()
    sm_a = {"id": "usr-sma", "name": "SM A", "email": "sma", "primaryRole": "SM_A", "roleId": "SM_A"}
    sm_m = {"id": "usr-smm", "name": "SM M", "email": "smm", "primaryRole": "SM_M", "roleId": "SM_M"}

    async def fake_actor(user_id):
        return sm_a if user_id == sm_a["id"] else sm_m

    monkeypatch.setattr(pi_api, "_load_actor", fake_actor)
    monkeypatch.setattr(pi_api, "_geo_lookups", lambda: _async_geo())
    monkeypatch.setattr(pi_api, "_audit", lambda *a, **k: _async_ok())

    from backend.services.pi_api import register_pi_routes
    from fastapi import APIRouter

    router = APIRouter()
    register_pi_routes(router)
    posts = {route.path: route.endpoint for route in router.routes if getattr(route, "methods", None) and "POST" in route.methods}
    deletes = {route.path: route.endpoint for route in router.routes if getattr(route, "methods", None) and "DELETE" in route.methods}

    leader = _run(
        posts["/pi/leaders"](
            {
                "name": "Keep Verified Rao",
                "partyId": "TDP",
                "assemblyConstituencyId": "AP-AC-139",
                "stateId": "AP",
                "politicalRole": "MLA",
            },
            userId=sm_a["id"],
        )
    )
    account = _run(
        posts["/pi/social-accounts"](
            {
                "personId": leader["id"],
                "platform": "facebook",
                "profileUrl": "https://facebook.com/keep.verified.rao",
                "followers": 12,
            },
            userId=sm_a["id"],
        )
    )
    verified = _run(posts["/pi/verification/{record_type}/{record_id}"]("social", account["id"], {"status": "VERIFIED"}, userId=sm_m["id"]))
    assert verified["verificationStatus"] == "VERIFIED"
    try:
        _run(deletes["/pi/social-accounts/{account_id}"](account["id"], userId=sm_m["id"]))
        raise AssertionError("verified accounts must not be deleted")
    except Exception as exc:
        assert getattr(exc, "status_code", None) == 409
    assert any(row["id"] == account["id"] for row in memory_list("social_media_accounts"))


def test_pending_leader_can_be_deleted_verified_cannot(monkeypatch):
    from backend.services import pi_api
    from backend.services.political_intelligence import reset_memory, memory_list

    reset_memory()
    sm_a = {"id": "usr-sma", "name": "SM A", "email": "sma", "primaryRole": "SM_A", "roleId": "SM_A"}
    sm_m = {"id": "usr-smm", "name": "SM M", "email": "smm", "primaryRole": "SM_M", "roleId": "SM_M"}

    async def fake_actor(user_id):
        return sm_a if user_id == sm_a["id"] else sm_m

    monkeypatch.setattr(pi_api, "_load_actor", fake_actor)
    monkeypatch.setattr(pi_api, "_geo_lookups", lambda: _async_geo())
    monkeypatch.setattr(pi_api, "_audit", lambda *a, **k: _async_ok())

    from backend.services.pi_api import register_pi_routes
    from fastapi import APIRouter

    router = APIRouter()
    register_pi_routes(router)
    posts = {route.path: route.endpoint for route in router.routes if getattr(route, "methods", None) and "POST" in route.methods}
    deletes = {route.path: route.endpoint for route in router.routes if getattr(route, "methods", None) and "DELETE" in route.methods}

    pending = _run(
        posts["/pi/leaders"](
            {
                "name": "Pending Delete Rao",
                "partyId": "TDP",
                "assemblyConstituencyId": "AP-AC-139",
                "stateId": "AP",
                "politicalRole": "MLA",
            },
            userId=sm_a["id"],
        )
    )
    locked = _run(
        posts["/pi/leaders"](
            {
                "name": "Verified Delete Rao",
                "partyId": "TDP",
                "assemblyConstituencyId": "AP-AC-139",
                "stateId": "AP",
                "politicalRole": "MLA",
            },
            userId=sm_a["id"],
        )
    )
    verified = _run(posts["/pi/verification/{record_type}/{record_id}"]("leader", locked["id"], {"status": "VERIFIED"}, userId=sm_m["id"]))
    assert verified["verificationStatus"] == "VERIFIED"

    removed = _run(deletes["/pi/leaders/{person_id}"](pending["id"], userId=sm_m["id"]))
    assert removed["success"] is True
    assert pending["id"] not in {row["id"] for row in memory_list("political_persons")}

    try:
        _run(deletes["/pi/leaders/{person_id}"](locked["id"], userId=sm_m["id"]))
        raise AssertionError("verified leaders must not be deleted")
    except Exception as exc:
        assert getattr(exc, "status_code", None) == 409
    assert any(row["id"] == locked["id"] for row in memory_list("political_persons"))


def test_intelligence_ranks_follow_selected_platform(monkeypatch):
    from backend.services import pi_api
    from backend.services.political_intelligence import reset_memory

    reset_memory()
    sm_a = {"id": "usr-sma", "name": "SM A", "email": "sma", "primaryRole": "SM_A", "roleId": "SM_A"}
    sm_m = {"id": "usr-smm", "name": "SM M", "email": "smm", "primaryRole": "SM_M", "roleId": "SM_M"}

    async def fake_actor(user_id):
        return sm_a if user_id == sm_a["id"] else sm_m

    monkeypatch.setattr(pi_api, "_load_actor", fake_actor)
    monkeypatch.setattr(pi_api, "_geo_lookups", lambda: _async_geo())
    monkeypatch.setattr(pi_api, "_audit", lambda *a, **k: _async_ok())

    from fastapi import APIRouter

    from backend.services.pi_api import register_pi_routes

    router = APIRouter()
    register_pi_routes(router)
    posts = {route.path: route.endpoint for route in router.routes if getattr(route, "methods", None) and "POST" in route.methods}
    gets = {route.path: route.endpoint for route in router.routes if getattr(route, "methods", None) and "GET" in route.methods}

    alpha = _run(
        posts["/pi/leaders"](
            {
                "name": "Alpha Rao",
                "partyId": "TDP",
                "assemblyConstituencyId": "AP-AC-139",
                "stateId": "AP",
                "politicalRole": "MLA",
                "accounts": [
                    {"platform": "facebook", "profileUrl": "https://facebook.com/alpha.rao", "followers": 9000},
                    {"platform": "instagram", "profileUrl": "https://instagram.com/alpha.rao", "followers": 100},
                ],
            },
            userId=sm_a["id"],
        )
    )
    beta = _run(
        posts["/pi/leaders"](
            {
                "name": "Beta Reddy",
                "partyId": "TDP",
                "assemblyConstituencyId": "AP-AC-139",
                "stateId": "AP",
                "politicalRole": "MLA",
                "leaderKind": "LEADER_2",
                "accounts": [
                    {"platform": "facebook", "profileUrl": "https://facebook.com/beta.reddy", "followers": 100},
                    {"platform": "instagram", "profileUrl": "https://instagram.com/beta.reddy", "followers": 9000},
                ],
            },
            userId=sm_a["id"],
        )
    )

    all_intel = _run(
        gets["/pi/intelligence"](
            userId=sm_m["id"],
            stateId="AP",
            districtId=None,
            parliamentConstituencyId=None,
            assemblyConstituencyId=None,
            platform=None,
            partyId=None,
            rankBy="followers",
        )
    )
    ig_intel = _run(
        gets["/pi/intelligence"](
            userId=sm_m["id"],
            stateId="AP",
            districtId=None,
            parliamentConstituencyId=None,
            assemblyConstituencyId=None,
            platform="instagram",
            partyId=None,
            rankBy="followers",
        )
    )
    all_by_id = {row["id"]: row for row in all_intel["leaders"]}
    ig_by_id = {row["id"]: row for row in ig_intel["leaders"]}
    assert all_by_id[alpha["id"]]["rankInConstituency"] < all_by_id[beta["id"]]["rankInConstituency"]
    assert ig_intel["rankPlatform"] == "instagram"
    assert ig_by_id[alpha["id"]]["followers"] == 100
    assert ig_by_id[beta["id"]]["followers"] == 9000
    assert ig_by_id[beta["id"]]["rankInConstituency"] < ig_by_id[alpha["id"]]["rankInConstituency"]
    assert ig_by_id[alpha["id"]]["platforms"]["instagram"]["followers"] == 100
    assert all_by_id[alpha["id"]]["followers"] == 9100


def test_history_append_does_not_block_when_mongo_hangs(monkeypatch):
    from backend.services import pi_api
    from backend.services.political_intelligence import reset_memory

    reset_memory()

    class HangCol:
        async def insert_one(self, *args, **kwargs):
            await asyncio.sleep(30)
            return None

    class HangDb:
        constituency_contact_history = HangCol()

    class HangSrv:
        _mongo_circuit_open = False
        db = HangDb()

        def log_mongo_notice(self, *args, **kwargs):
            return None

    monkeypatch.setattr(pi_api, "_srv", lambda: HangSrv())
    monkeypatch.setattr(pi_api, "_pi_mongo_db", lambda srv: HangDb())
    started = time.perf_counter()
    stored = _run(pi_api._append("constituency_contact_history", {"id": "ch-fast", "action": "TEST"}, block_mongo=False))
    elapsed = time.perf_counter() - started
    assert stored["id"] == "ch-fast"
    assert elapsed < 1.0


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


def test_parse_csv_strips_bom_and_aliases_headers():
    text = (
        "\ufeffRecord type,State Id,assemblyConstituencyId,Leader Name,platform,Profile URL,followers\n"
        "social,AP,AP-AC-139,A. Rao,facebook,https://facebook.com/sample.rao.bng,12500\n"
        ",,,,,,\n"
    )
    rows = parse_csv(text)
    assert len(rows) == 1
    assert rows[0]["recordType"] == "social"
    assert rows[0]["stateId"] == "AP"
    assert rows[0]["leaderName"] == "A. Rao"
    assert rows[0]["profileUrl"] == "https://facebook.com/sample.rao.bng"
    assert rows[0]["followers"] == "12500"


def test_import_rejects_invalid_rows(monkeypatch):
    from backend.services import pi_api
    from backend.services.political_intelligence import reset_memory

    reset_memory()
    admin = {"id": "usr-admin", "name": "Naresh", "email": "admin", "isPlatformAdmin": True, "primaryRole": "SUPER_ADMIN"}

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
    admin = {"id": "usr-admin", "name": "Naresh", "email": "admin", "isPlatformAdmin": True, "primaryRole": "SUPER_ADMIN"}

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
                "enteredByName": "Ravi",
                "dataCollectionDate": "2026-11-15",
            },
            userId=admin["id"],
        )
    )
    assert first["enteredByName"] == "Ravi"
    assert str(first["dataCollectionDate"]).startswith("2026-11-15")
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
    none_account = _run(
        posts["/pi/social-accounts"](
            {
                "personId": leader["id"],
                "platform": "youtube",
                "verificationStatus": "NO_ACCOUNT",
            },
            userId=admin["id"],
        )
    )
    assert none_account["verificationStatus"] == "NO_ACCOUNT"
    assert none_account.get("noAccount") is True
    listed = _run(gets["/pi/constituencies"](userId=admin["id"], stateId="AP"))
    row = next(item for item in listed["items"] if item.get("assemblyConstituencyId") == "AP-AC-139")
    assert row["enteredByName"] == "Ravi"
    assert row["leaderCount"] == 1
    contacts = _run(gets["/pi/contacts"](userId=admin["id"]))
    assert any(c.get("id") == leader["contactId"] for c in contacts)
    dash = _run(gets["/pi/dashboard"](userId=admin["id"], stateId="AP", districtId=None))
    assert dash["constituenciesEntered"] >= 1
    assert dash["totalLeaders"] >= 1
    recent = dash.get("recentCollections") or []
    assert any(row.get("recordType") == "constituency" and row.get("assemblyConstituencyId") == "AP-AC-139" for row in recent)
    assert any(row.get("recordType") == "leader" for row in recent)
    nandyal = _run(gets["/pi/dashboard"](userId=admin["id"], stateId="AP", districtId="AP-DIST-NANDYAL"))
    assert any(row.get("districtId") == "AP-DIST-NANDYAL" for row in (nandyal.get("recentCollections") or []))
    assert nandyal.get("lastDataCollectionDate")
    assert any(row.get("id") == "AP-DIST-NANDYAL" for row in (nandyal.get("districts") or []))
    assert all(
        row.get("districtId") == "AP-DIST-NANDYAL" or row.get("assemblyConstituencyId") == "AP-AC-139"
        for row in (nandyal.get("recentCollections") or [])
    )
    kurnool = _run(gets["/pi/dashboard"](userId=admin["id"], stateId="AP", districtId="AP-DIST-KURNOOL"))
    assert not any(row.get("assemblyConstituencyId") == "AP-AC-139" for row in (kurnool.get("recentCollections") or []))
    assert any(row.get("id") == "AP-DIST-KURNOOL" for row in (kurnool.get("districts") or []))
    other = _run(gets["/pi/dashboard"](userId=admin["id"], stateId="TS", districtId=None))
    assert other["constituenciesEntered"] == 0
    assert not any(row.get("assemblyConstituencyId") == "AP-AC-139" for row in (other.get("recentCollections") or []))
    intel = _run(gets["/pi/intelligence"](userId=admin["id"], stateId="AP", districtId=None, parliamentConstituencyId=None, assemblyConstituencyId=None, platform=None, partyId=None, rankBy="followers"))
    assert intel["audienceEstimates"]["facebook"] == 250
    assert intel["socialScoreDisclaimer"]
    assert isinstance(intel.get("constituencyCards"), list)
    assert intel["constituencyCards"]
    card = next(c for c in intel["constituencyCards"] if c.get("assemblyConstituencyId") == "AP-AC-139")
    assert card.get("mlaName")
    assert "reachPercent" in card
    leader = next(l for l in intel["leaders"] if l.get("assemblyConstituencyId") == "AP-AC-139")
    assert leader.get("platforms")
    assert leader.get("leaderKind")


def test_ap_districts_cascade_from_existing_geography():
    import json
    from pathlib import Path

    from backend.services.geo_districts import AP_DISTRICT_BY_NAME, _norm, build_district_catalog

    root = Path(__file__).resolve().parents[1]
    acs = json.loads((root / "data" / "assemblies.json").read_text())
    pcs = json.loads((root / "data" / "parliaments.json").read_text())
    districts, maps = build_district_catalog(acs, pcs, "AP")
    from backend.services.district_master import CURRENT_DISTRICTS, TS_DISTRICT_BY_NAME
    ap_names = {d["name"] for d in districts}
    assert ap_names == set(CURRENT_DISTRICTS["AP"])
    assert not {"Araku", "Amalapuram", "Hindupur", "Bhongir"} & ap_names
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
    ts_districts, ts_maps = build_district_catalog(acs, pcs, "TS")
    ts_names = {d["name"] for d in ts_districts}
    assert ts_names == set(CURRENT_DISTRICTS["TS"])
    assert {"Siddipet", "Jagtial", "Hanumakonda", "Narayanpet", "Mulugu"} <= ts_names
    siddipet = next(d for d in ts_districts if d["name"] == "Siddipet")
    assert siddipet["assemblyConstituencyIds"]
    jagtial = next(d for d in ts_districts if d["name"] == "Jagtial")
    assert jagtial["assemblyConstituencyIds"]
    assert len(CURRENT_DISTRICTS["AP"]) == 26
    assert len(CURRENT_DISTRICTS["TS"]) == 33
    ts_missing = [_norm(a["name"]) for a in acs if a.get("stateId") == "TS" and _norm(a.get("name")) not in TS_DISTRICT_BY_NAME]
    assert ts_missing == []
    assert any(m["districtName"] == "Siddipet" for m in ts_maps)


def test_ap_and_ts_unique_assembly_ids_match_official_totals():
    import json
    from collections import Counter
    from pathlib import Path

    from backend.services.geo_districts import AP_DISTRICT_BY_NAME, build_district_catalog, _norm
    from backend.services.district_master import TS_DISTRICT_BY_NAME

    root = Path(__file__).resolve().parents[1]
    acs = json.loads((root / "data" / "assemblies.json").read_text())
    pcs = json.loads((root / "data" / "parliaments.json").read_text())
    states = {s["id"]: s for s in json.loads((root / "data" / "states.json").read_text())}

    ap = [a for a in acs if a.get("stateId") == "AP"]
    ts = [a for a in acs if a.get("stateId") == "TS"]
    ap_ids = [a["id"] for a in ap]
    ts_ids = [a["id"] for a in ts]
    assert len(ap) == states["AP"]["totalAssemblyConstituencies"] == 175
    assert len(set(ap_ids)) == 175
    assert {k: v for k, v in Counter(ap_ids).items() if v > 1} == {}
    assert len(ts) == states["TS"]["totalAssemblyConstituencies"] == 119
    assert len(set(ts_ids)) == 119
    assert {k: v for k, v in Counter(ts_ids).items() if v > 1} == {}

    palakonda = next(a for a in ap if _norm(a.get("name")) == "palakonda")
    rayachoti = next(a for a in ap if _norm(a.get("name")) == "rayachoti")
    assert palakonda["id"] != rayachoti["id"]
    jukkal = next(a for a in ts if _norm(a.get("name")) == "jukkal")
    armur = next(a for a in ts if _norm(a.get("name")) == "armur")
    assert jukkal["id"] != armur["id"]

    ap_names = {_norm(a.get("name")) for a in ap}
    for required in ("palakonda", "jaggampeta", "pedakurapadu", "udayagiri", "sathyavedu"):
        assert required in ap_names
    assert "santhipuram" not in ap_names
    assert AP_DISTRICT_BY_NAME["palakonda"] == "Parvathipuram Manyam"
    assert AP_DISTRICT_BY_NAME["jaggampeta"] == "Kakinada"
    assert AP_DISTRICT_BY_NAME["pedakurapadu"] == "Palnadu"
    assert AP_DISTRICT_BY_NAME["udayagiri"] == "SPSR Nellore"
    assert AP_DISTRICT_BY_NAME["sathyavedu"] == "Tirupati"
    assert TS_DISTRICT_BY_NAME["jukkal"] == "Kamareddy"

    ap_docs, ap_maps = build_district_catalog(acs, pcs, "AP")
    ts_docs, ts_maps = build_district_catalog(acs, pcs, "TS")
    assert len({m["assemblyConstituencyId"] for m in ap_maps}) == 175
    assert len({m["assemblyConstituencyId"] for m in ts_maps}) == 119
    manyam = next(d for d in ap_docs if d["name"] == "Parvathipuram Manyam")
    assert palakonda["id"] in manyam["assemblyConstituencyIds"]
    assert rayachoti["id"] not in manyam["assemblyConstituencyIds"]


def test_prefer_packaged_assemblies_when_mongo_collapses_ids():
    import json
    from pathlib import Path

    from backend.services.geo_districts import prefer_packaged_assemblies

    root = Path(__file__).resolve().parents[1]
    packaged = json.loads((root / "data" / "assemblies.json").read_text())
    collapsed = [
        {**row, "id": "AP-AC-130"} if row.get("stateId") == "AP" and row.get("name") == "Palakonda" else row
        for row in packaged
        if row.get("stateId") == "AP"
    ]
    restored = prefer_packaged_assemblies(collapsed, packaged, "AP")
    assert len({row["id"] for row in restored}) == 175
    assert any(row.get("name") == "Palakonda" and row.get("id") != "AP-AC-130" for row in restored)


def test_live_cutover_does_not_wipe_pi_when_marker_read_fails(monkeypatch):
    import backend.server as srv

    class BoomSettings:
        async def find_one(self, *args, **kwargs):
            raise TimeoutError("mongo timeout")

        async def replace_one(self, *args, **kwargs):
            raise AssertionError("must not write cutover marker after a failed read")

    class BoomPersons:
        async def count_documents(self, *args, **kwargs):
            raise AssertionError("must not inspect PI after a failed marker read")

        async def delete_many(self, *args, **kwargs):
            raise AssertionError("must not wipe political_persons")

    class BoomDb:
        system_settings = BoomSettings()
        political_persons = BoomPersons()
        users = BoomPersons()

    monkeypatch.setattr(srv, "db", BoomDb())
    _run(srv.apply_live_cutover())


def test_live_cutover_does_not_wipe_existing_pi(monkeypatch):
    import backend.server as srv

    replaced = {}

    class Settings:
        async def find_one(self, *args, **kwargs):
            return None

        async def replace_one(self, query, doc, upsert=False):
            replaced["doc"] = doc
            return None

    class Persons:
        async def count_documents(self, *args, **kwargs):
            return 12

        async def delete_many(self, *args, **kwargs):
            raise AssertionError("must not wipe existing PI leaders")

    class Users:
        async def delete_many(self, *args, **kwargs):
            raise AssertionError("must not reset users when PI data exists")

        async def insert_one(self, *args, **kwargs):
            raise AssertionError("must not insert users when PI data exists")

    class Db:
        system_settings = Settings()
        political_persons = Persons()
        users = Users()

    monkeypatch.setattr(srv, "db", Db())
    _run(srv.apply_live_cutover())
    assert replaced["doc"]["skippedWipe"] is True


def test_pi_list_keeps_memory_when_mongo_times_out(monkeypatch):
    from backend.services import pi_api
    from backend.services.political_intelligence import memory_upsert, reset_memory

    reset_memory()
    memory_upsert("political_persons", "pp-keep", {"id": "pp-keep", "name": "Kept Leader", "assemblyConstituencyId": "AP-AC-1"})

    class FakeCol:
        def find(self, *args, **kwargs):
            return self

        def to_list(self, *args, **kwargs):
            return self

    class FakeDb:
        political_persons = FakeCol()

    class FakeSrv:
        _mongo_circuit_open = False
        db = FakeDb()

        async def mongo_wait(self, awaitable, timeout=2.5, fallback=None, tag="mongo"):
            return fallback

    monkeypatch.setattr(pi_api, "_srv", lambda: FakeSrv())
    pi_api._PI_MONGO_PING.update(ok=None, at=0.0, error=None)
    rows = _run(pi_api._list("political_persons"))
    assert any(row.get("id") == "pp-keep" for row in rows)


def test_srv_prefers_live_mongo_module(monkeypatch):
    from types import SimpleNamespace

    from backend.services import pi_api

    dead = SimpleNamespace(_mongo_circuit_open=True, _live_mongo_client="dead-client", db="dead-db", mongo_write=True)
    live = SimpleNamespace(_mongo_circuit_open=False, _live_mongo_client="live-client", db="live-db", mongo_write=True)
    monkeypatch.setitem(sys.modules, "server", live)
    monkeypatch.setitem(sys.modules, "backend.server", dead)
    assert pi_api._srv() is live


def test_pi_save_uses_live_client_when_circuit_open(monkeypatch):
    from backend.services import pi_api
    from backend.services.political_intelligence import reset_memory

    reset_memory()
    writes = []

    class FakeCol:
        async def update_one(self, *args, **kwargs):
            writes.append(args)
            return None

    class FakeLiveDb(dict):
        def __getitem__(self, name):
            return self

        def __getattr__(self, name):
            return FakeCol()

    class FakeSrv:
        _mongo_circuit_open = True
        _live_mongo_client = FakeLiveDb()
        db_name = "political_intelligence"
        db = object()

        def log_mongo_notice(self, *args, **kwargs):
            return None

    monkeypatch.setattr(pi_api, "_srv", lambda: FakeSrv())
    pi_api._PI_MONGO_PING.update(ok=None, at=0.0, error=None)
    saved = _run(pi_api._save("political_persons", "pp-1", {"id": "pp-1", "name": "Live Save"}))
    assert saved["id"] == "pp-1"
    assert writes, "expected a Mongo upsert through the live client"


def test_pi_append_does_not_block_leader_save(monkeypatch):
    from fastapi import HTTPException

    from backend.services import pi_api
    from backend.services.political_intelligence import reset_memory

    reset_memory()

    class BoomCol:
        async def insert_one(self, *args, **kwargs):
            raise RuntimeError("history insert failed")

        async def update_one(self, *args, **kwargs):
            raise RuntimeError("contact upsert failed")

    class FakeLiveDb:
        def __getitem__(self, name):
            return self

        def __getattr__(self, name):
            return BoomCol()

    class FakeSrv:
        _mongo_circuit_open = False
        _live_mongo_client = FakeLiveDb()
        db_name = "political_intelligence"
        db = FakeLiveDb()

        def log_mongo_notice(self, *args, **kwargs):
            return None

    monkeypatch.setattr(pi_api, "_srv", lambda: FakeSrv())
    pi_api._PI_MONGO_PING.update(ok=None, at=0.0, error=None)
    history = _run(pi_api._append("constituency_contact_history", {"id": "ch-1", "action": "CREATED_FROM_PI"}))
    assert history["id"] == "ch-1"
    contact = _run(pi_api._save("constituency_contacts", "cnt-1", {"id": "cnt-1", "name": "Leader"}))
    assert contact["id"] == "cnt-1"
    try:
        _run(pi_api._save("political_persons", "pp-boom", {"id": "pp-boom", "name": "Boom"}))
        assert False, "critical save should still surface a 503"
    except HTTPException as exc:
        assert exc.status_code == 503
        assert "RuntimeError" in str(exc.detail)


def test_pi_save_error_explains_missing_atlas_hostname():
    from backend.services.pi_api import _save_error_detail

    err = Exception("The DNS query name does not exist: _mongodb._tcp.cluster0.5fdvfhs.mongodb.net.")
    detail = _save_error_detail(err)
    assert "MONGO_URL" in detail
    assert "Atlas" in detail
    assert "5fdvfhs" not in detail


def test_pi_save_error_explains_atlas_ssl_allowlist():
    from backend.services.pi_api import _save_error_detail

    err = Exception(
        "SSL handshake failed: ac-n3rrv9i-shard-00-02.5fdvfhs.mongodb.net:27017: "
        "[SSL: TLSV1_ALERT_INTERNAL_ERROR] tlsv1 alert internal error"
    )
    detail = _save_error_detail(err)
    assert "Network Access" in detail
    assert "0.0.0.0/0" in detail


def test_pi_save_error_explains_atlas_bad_auth():
    from backend.services.pi_api import _save_error_detail

    err = Exception("bad auth : authentication failed, full error: {'ok': 0, 'code': 8000, 'codeName': 'AtlasError'}")
    detail = _save_error_detail(err)
    assert "Database Access" in detail
    assert "password" in detail.lower()
    assert "MONGO_URL" in detail


def test_pi_save_error_explains_atlas_write_timeout():
    from backend.services.pi_api import _save_error_detail

    detail = _save_error_detail(TimeoutError())
    assert "did not finish the write" in detail
    assert "Database Access" in detail


def test_pi_save_fails_fast_when_mongo_ping_fails(monkeypatch):
    from fastapi import HTTPException

    from backend.services import pi_api
    from backend.services.political_intelligence import reset_memory

    reset_memory()
    writes = []

    class FakeCol:
        async def update_one(self, *args, **kwargs):
            writes.append(args)
            return None

    class FakeLiveDb:
        def __getitem__(self, name):
            return self

        def __getattr__(self, name):
            return FakeCol()

        async def command(self, *args, **kwargs):
            raise TimeoutError()

    class FakeSrv:
        _mongo_circuit_open = False
        _live_mongo_client = FakeLiveDb()
        db_name = "political_intelligence"
        db = FakeLiveDb()

        def log_mongo_notice(self, *args, **kwargs):
            return None

    monkeypatch.setattr(pi_api, "_srv", lambda: FakeSrv())
    pi_api._PI_MONGO_PING.update(ok=None, at=0.0, error=None)
    try:
        _run(pi_api._save("political_persons", "pp-ping", {"id": "pp-ping", "name": "Ping Fail"}))
        assert False, "critical save should 503 when ping fails"
    except HTTPException as exc:
        assert exc.status_code == 503
        assert "did not finish the write" in str(exc.detail)
    assert not writes


def test_startup_seed_does_not_block_render_listen(monkeypatch):
    import time
    from types import SimpleNamespace

    from backend import server as srv

    async def hang(*args, **kwargs):
        await asyncio.sleep(30)

    monkeypatch.setattr(srv, "_mongo_circuit_open", False)
    monkeypatch.setattr(srv, "db", SimpleNamespace(command=hang, states=SimpleNamespace(count_documents=hang)))

    async def run():
        t0 = time.time()
        await srv.startup_db_seed()
        elapsed = time.time() - t0
        await asyncio.sleep(0)
        for task in list(asyncio.all_tasks()):
            if task is not asyncio.current_task() and not task.done():
                task.cancel()
        return elapsed

    elapsed = _run(run())
    assert elapsed < 1.0, f"startup blocked listen for {elapsed:.2f}s"
