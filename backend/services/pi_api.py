"""Political Intelligence HTTP routes. Registered onto the existing FastAPI api_router."""
from __future__ import annotations

import csv
import io
from copy import deepcopy
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from fastapi import HTTPException, Query
from fastapi.responses import PlainTextResponse

from .geo_districts import build_district_catalog
from .political_intelligence import (
    ACCOUNT_STATUSES,
    MEMORY,
    PERSON_ROLES,
    PLATFORMS,
    SAMPLE_TAG,
    account_identity_key,
    actor_capabilities,
    calculate_engagement,
    csv_template,
    in_scope,
    load_sample_into_memory,
    memory_get,
    memory_list,
    memory_upsert,
    new_id,
    normalize_name,
    normalize_profile_url,
    now_iso,
    parse_csv,
    sample_seed_documents,
    snapshot_growth,
    social_score,
)


def _srv():
    try:
        from backend import server as srv
        return srv
    except Exception:
        import server as srv  # type: ignore
        return srv


COLLECTIONS = {
    "districts": "districts",
    "assembly_district_map": "assembly_district_map",
    "constituency_statistics": "constituency_statistics",
    "constituency_statistics_history": "constituency_statistics_history",
    "political_persons": "political_persons",
    "political_person_roles": "political_person_roles",
    "social_media_accounts": "social_media_accounts",
    "social_media_snapshots": "social_media_snapshots",
    "data_verification_history": "data_verification_history",
    "data_import_batches": "data_import_batches",
    "constituency_contacts": "constituency_contacts",
    "constituency_contact_history": "constituency_contact_history",
}


async def _list(collection: str) -> List[Dict[str, Any]]:
    srv = _srv()
    mem = memory_list(collection)
    if getattr(srv, "_mongo_circuit_open", True):
        return mem
    try:
        col = getattr(srv.db, COLLECTIONS[collection], None)
        if col is None:
            return mem
        docs = await srv.mongo_wait(col.find({}, {"_id": 0}).to_list(2000), timeout=3.0, fallback=None, tag=f"pi_{collection}")
        if not docs:
            return mem
        by_id = {d.get("id") or d.get("key"): d for d in docs if d.get("id") or d.get("key")}
        for item in mem:
            by_id.setdefault(item.get("id") or item.get("key"), item)
        return list(by_id.values())
    except Exception:
        return mem


async def _get(collection: str, key: str) -> Optional[Dict[str, Any]]:
    mem = memory_get(collection, key)
    srv = _srv()
    if getattr(srv, "_mongo_circuit_open", True):
        return mem
    try:
        col = getattr(srv.db, COLLECTIONS[collection], None)
        if col is None:
            return mem
        doc = await srv.mongo_wait(col.find_one({"id": key}, {"_id": 0}), timeout=2.0, fallback=None, tag="pi_get")
        return doc or mem
    except Exception:
        return mem


async def _save(collection: str, key: str, doc: Dict[str, Any]) -> Dict[str, Any]:
    stored = memory_upsert(collection, key, doc)
    srv = _srv()
    if getattr(srv, "_mongo_circuit_open", True):
        return stored
    try:
        col = getattr(srv.db, COLLECTIONS[collection], None)
        if col is None:
            return stored
        await srv.mongo_write(col.update_one({"id": key}, {"$set": stored}, upsert=True), timeout=4.0, tag="pi_save")
    except Exception as e:
        try:
            srv.log_mongo_notice("pi_save", e)
        except Exception:
            pass
    return stored


async def _append(collection: str, doc: Dict[str, Any]) -> Dict[str, Any]:
    stored = deepcopy(doc)
    MEMORY[collection].insert(0, deepcopy(stored))
    srv = _srv()
    if getattr(srv, "_mongo_circuit_open", True):
        return stored
    try:
        col = getattr(srv.db, COLLECTIONS[collection], None)
        if col is None:
            return stored
        await srv.mongo_write(col.insert_one(dict(stored)), timeout=4.0, tag="pi_append")
    except Exception as e:
        try:
            srv.log_mongo_notice("pi_append", e)
        except Exception:
            pass
    return stored


async def _load_actor(user_id: Optional[str]) -> Dict[str, Any]:
    srv = _srv()
    if not user_id:
        raise HTTPException(status_code=401, detail="userId is required")
    user = None
    try:
        user = await srv.mongo_wait(srv.db.users.find_one({"id": user_id}, {"passwordHash": 0, "demoPassword": 0, "_id": 0}), timeout=2.0, fallback=None, tag="pi_actor")
    except Exception:
        user = None
    if not user:
        for item in srv.load_json_fallback("users.json"):
            if item.get("id") == user_id or str(item.get("email") or "").lower() == user_id.lower():
                user = item
                break
    if not user:
        raise HTTPException(status_code=401, detail="Unknown user")
    return user


def _require(caps: Dict[str, Any], action: str) -> None:
    if not caps.get(action):
        raise HTTPException(status_code=403, detail=f"Forbidden: {action} is not allowed for this role.")


async def _audit(actor: Dict[str, Any], action: str, target: str, metadata: Optional[dict] = None) -> None:
    srv = _srv()
    try:
        await srv.record_audit_log(actor.get("id"), actor.get("name"), action, target, None, metadata or {})
    except Exception:
        pass


async def _geo_lookups() -> Dict[str, Any]:
    srv = _srv()
    assemblies = await srv.mongo_wait(srv.db.assembly_constituencies.find({}, {"_id": 0}).to_list(5000), timeout=5.0, fallback=None, tag="pi_acs") or srv.load_json_fallback("assemblies.json")
    parliaments = await srv.mongo_wait(srv.db.parliament_constituencies.find({}, {"_id": 0}).to_list(1000), timeout=4.0, fallback=None, tag="pi_pcs") or srv.load_json_fallback("parliaments.json")
    parties = await srv.mongo_wait(srv.db.political_parties.find({}, {"_id": 0}).to_list(100), timeout=3.0, fallback=None, tag="pi_parties") or srv.load_json_fallback("political_parties.json")
    return {
        "assemblies": {a.get("id"): a for a in assemblies if a.get("id")},
        "parliaments": {p.get("id"): p for p in parliaments if p.get("id")},
        "parties": {p.get("id"): p for p in parties if p.get("id")},
        "assembly_rows": [a for a in assemblies if a.get("id")],
        "parliament_rows": [p for p in parliaments if p.get("id")],
    }


async def _resolved_districts(state_id: Optional[str] = None) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    geo = await _geo_lookups()
    derived, maps = build_district_catalog(geo.get("assembly_rows") or geo["assemblies"].values(), geo.get("parliament_rows") or geo["parliaments"].values(), state_id)
    stored = await _list("districts")
    stored_maps = await _list("assembly_district_map")
    by_id = {d.get("id"): d for d in derived if d.get("id")}
    for row in stored:
        if state_id and str(row.get("stateId") or "").upper() != str(state_id).upper():
            continue
        existing = by_id.get(row.get("id"))
        if existing:
            existing["name"] = existing.get("name") or row.get("name")
        else:
            by_id[row.get("id")] = {
                **row,
                "assemblyConstituencyIds": list(row.get("assemblyConstituencyIds") or []),
                "parliamentConstituencyIds": list(row.get("parliamentConstituencyIds") or []),
            }
    map_by_ac = {m.get("assemblyConstituencyId"): m for m in maps if m.get("assemblyConstituencyId")}
    for item in stored_maps:
        ac_id = item.get("assemblyConstituencyId")
        if not ac_id:
            continue
        if state_id and str(item.get("stateId") or "").upper() != str(state_id).upper():
            continue
        map_by_ac[ac_id] = item
        d_id = item.get("districtId")
        if d_id and d_id in by_id and ac_id not in by_id[d_id]["assemblyConstituencyIds"]:
            by_id[d_id]["assemblyConstituencyIds"].append(ac_id)
        pc_id = item.get("parliamentConstituencyId")
        if d_id and d_id in by_id and pc_id and pc_id not in by_id[d_id]["parliamentConstituencyIds"]:
            by_id[d_id]["parliamentConstituencyIds"].append(pc_id)
    rows = sorted(by_id.values(), key=lambda r: (r.get("name") or ""))
    return rows, list(map_by_ac.values())


def register_pi_routes(api_router) -> None:
    @api_router.get("/geography/districts")
    async def get_districts(stateId: Optional[str] = None, userId: Optional[str] = None):
        rows, _maps = await _resolved_districts(stateId)
        return rows

    @api_router.get("/geography/districts/{district_id}/assemblies")
    async def get_district_assemblies(district_id: str, userId: Optional[str] = None):
        rows, maps = await _resolved_districts()
        district = next((d for d in rows if d.get("id") == district_id), None)
        geo = await _geo_lookups()
        ac_ids = []
        if district:
            ac_ids = list(district.get("assemblyConstituencyIds") or [])
        if not ac_ids:
            ac_ids = [m.get("assemblyConstituencyId") for m in maps if m.get("districtId") == district_id]
        out = []
        for ac_id in ac_ids:
            ac = geo["assemblies"].get(ac_id) or {"id": ac_id, "name": ac_id}
            out.append({**ac, "districtId": district_id})
        out.sort(key=lambda a: (a.get("number") or 0, a.get("name") or ""))
        return out

    @api_router.get("/pi/meta")
    async def pi_meta():
        return {
            "platforms": list(PLATFORMS),
            "accountStatuses": list(ACCOUNT_STATUSES),
            "politicalRoles": list(PERSON_ROLES),
            "engagementFormulas": {
                "facebook": "(avg likes + avg comments) / followers × 100 — facebook_er_v1",
                "instagram": "(avg likes + avg comments) / followers × 100 — instagram_er_v1",
                "x": "(avg likes + avg comments) / followers × 100 — x_er_v1",
                "youtube": "avg views / subscribers × 100 — youtube_vtr_v1",
            },
            "socialScore": "social_score_v1: 40% relative followers, 30% engagement, 20% 30-day growth, 10% posting. Missing metrics are excluded and remaining weights are reweighted. Not an official election or popularity score.",
        }

    @api_router.get("/pi/dashboard")
    async def pi_dashboard(userId: Optional[str] = None, stateId: Optional[str] = None):
        actor = await _load_actor(userId)
        caps = actor_capabilities(actor)
        _require(caps, "view")
        stats = [s for s in await _list("constituency_statistics") if in_scope(caps, s.get("stateId"), s.get("assemblyConstituencyId"))]
        if stateId:
            stats = [s for s in stats if str(s.get("stateId") or "").upper() == stateId.upper()]
        maps = await _list("assembly_district_map")
        if stateId:
            maps = [m for m in maps if str(m.get("stateId") or "").upper() == stateId.upper()]
        persons = [p for p in await _list("political_persons") if in_scope(caps, p.get("stateId"), p.get("assemblyConstituencyId"))]
        accounts = await _list("social_media_accounts")
        person_ids = {p.get("id") for p in persons}
        accounts = [a for a in accounts if a.get("personId") in person_ids]
        verified = [a for a in accounts if a.get("verificationStatus") == "VERIFIED"]
        pending = [a for a in accounts if a.get("verificationStatus") == "PENDING"]
        recheck = [a for a in accounts if a.get("verificationStatus") == "NEEDS_RECHECK"]
        total_ac = len({m.get("assemblyConstituencyId") for m in maps}) or len({s.get("assemblyConstituencyId") for s in stats})
        entered = len({s.get("assemblyConstituencyId") for s in stats})
        last_dates = [s.get("dataCollectionDate") or s.get("updatedAt") for s in stats if s.get("dataCollectionDate") or s.get("updatedAt")]
        last_dates.sort()
        districts = await _district_progress_rows(caps, stateId)
        return {
            "totalConstituencies": total_ac,
            "constituenciesEntered": entered,
            "totalLeaders": len(persons),
            "totalSocialAccounts": len(accounts),
            "verifiedAccounts": len(verified),
            "pendingVerification": len(pending),
            "needsRecheck": len(recheck),
            "verificationPercent": round((len(verified) / len(accounts)) * 100, 1) if accounts else None,
            "lastDataCollectionDate": last_dates[-1] if last_dates else None,
            "districts": districts,
        }

    async def _district_progress_rows(caps, state_id=None):
        districts, maps = await _resolved_districts(state_id)
        stats = await _list("constituency_statistics")
        persons = await _list("political_persons")
        accounts = await _list("social_media_accounts")
        person_by_id = {p.get("id"): p for p in persons}
        rows = []
        for district in districts:
            ac_ids = list(district.get("assemblyConstituencyIds") or [m.get("assemblyConstituencyId") for m in maps if m.get("districtId") == district.get("id")])
            entered_ids = [s.get("assemblyConstituencyId") for s in stats if s.get("districtId") == district.get("id") or s.get("assemblyConstituencyId") in ac_ids]
            d_persons = [p for p in persons if p.get("districtId") == district.get("id") or p.get("assemblyConstituencyId") in ac_ids]
            d_accounts = [a for a in accounts if person_by_id.get(a.get("personId"), {}).get("districtId") == district.get("id") or person_by_id.get(a.get("personId"), {}).get("assemblyConstituencyId") in ac_ids]
            verified = [a for a in d_accounts if a.get("verificationStatus") == "VERIFIED"]
            recheck = [a for a in d_accounts if a.get("verificationStatus") == "NEEDS_RECHECK"]
            dates = [s.get("updatedAt") or s.get("dataCollectionDate") for s in stats if s.get("assemblyConstituencyId") in ac_ids]
            dates = [d for d in dates if d]
            dates.sort()
            total = len(set(ac_ids))
            entered = len(set(entered_ids))
            rows.append(
                {
                    "id": district.get("id"),
                    "name": district.get("name"),
                    "stateId": district.get("stateId"),
                    "totalConstituencies": total,
                    "constituenciesEntered": entered,
                    "constituenciesPending": max(total - entered, 0),
                    "totalLeaders": len(d_persons),
                    "totalAccounts": len(d_accounts),
                    "verifiedAccounts": len(verified),
                    "needsRecheck": len(recheck),
                    "verificationPercent": round((len(verified) / len(d_accounts)) * 100, 1) if d_accounts else None,
                    "lastUpdated": dates[-1] if dates else None,
                }
            )
        rows.sort(key=lambda r: r.get("name") or "")
        return rows

    @api_router.get("/pi/districts/progress")
    async def pi_district_progress(userId: Optional[str] = None, stateId: Optional[str] = None):
        actor = await _load_actor(userId)
        caps = actor_capabilities(actor)
        _require(caps, "view")
        return await _district_progress_rows(caps, stateId)

    @api_router.get("/pi/districts/{district_id}")
    async def pi_district_detail(district_id: str, userId: Optional[str] = None):
        actor = await _load_actor(userId)
        caps = actor_capabilities(actor)
        _require(caps, "view")
        districts, maps = await _resolved_districts()
        district = next((d for d in districts if d.get("id") == district_id), None) or await _get("districts", district_id)
        if not district:
            raise HTTPException(status_code=404, detail="District not found")
        maps = [m for m in maps if m.get("districtId") == district_id]
        if not maps and district.get("assemblyConstituencyIds"):
            maps = [{"assemblyConstituencyId": ac_id, "parliamentConstituencyId": None, "districtId": district_id} for ac_id in district["assemblyConstituencyIds"]]
        stats_by_ac = {s.get("assemblyConstituencyId"): s for s in await _list("constituency_statistics")}
        ac_ids = {m.get("assemblyConstituencyId") for m in maps}
        persons = [
            p
            for p in await _list("political_persons")
            if p.get("districtId") == district_id or p.get("assemblyConstituencyId") in ac_ids
        ]
        accounts = await _list("social_media_accounts")
        geo = await _geo_lookups()
        constituencies = []
        for item in maps:
            ac_id = item.get("assemblyConstituencyId")
            ac = geo["assemblies"].get(ac_id) or {}
            ac_persons = [p for p in persons if p.get("assemblyConstituencyId") == ac_id]
            ac_accounts = [a for a in accounts if any(a.get("personId") == p.get("id") for p in ac_persons)]
            stat = stats_by_ac.get(ac_id)
            constituencies.append(
                {
                    "assemblyConstituencyId": ac_id,
                    "name": ac.get("name") or ac_id,
                    "parliamentConstituencyId": item.get("parliamentConstituencyId") or ac.get("parliamentConstituencyId"),
                    "entered": bool(stat),
                    "verificationStatus": (stat or {}).get("verificationStatus"),
                    "leaders": len(ac_persons),
                    "accounts": len(ac_accounts),
                    "lastCollectionDate": (stat or {}).get("dataCollectionDate"),
                }
            )
        return {"district": district, "constituencies": constituencies, "leaders": persons}

    @api_router.get("/pi/constituencies")
    async def list_constituencies(
        userId: Optional[str] = None,
        stateId: Optional[str] = None,
        districtId: Optional[str] = None,
        q: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ):
        actor = await _load_actor(userId)
        caps = actor_capabilities(actor)
        _require(caps, "view")
        rows = await _list("constituency_statistics")
        if stateId:
            rows = [r for r in rows if str(r.get("stateId") or "").upper() == stateId.upper()]
        if districtId:
            rows = [r for r in rows if r.get("districtId") == districtId]
        rows = [r for r in rows if in_scope(caps, r.get("stateId"), r.get("assemblyConstituencyId"))]
        if q:
            needle = q.lower()
            rows = [r for r in rows if needle in str(r.get("assemblyName") or "").lower() or needle in str(r.get("assemblyConstituencyId") or "").lower()]
        total = len(rows)
        rows = rows[skip : skip + max(1, min(limit, 200))]
        return {"total": total, "items": rows}

    @api_router.post("/pi/constituencies")
    async def upsert_constituency(payload: dict, userId: Optional[str] = None):
        actor = await _load_actor(userId)
        caps = actor_capabilities(actor)
        _require(caps, "create")
        payload = payload or {}
        ac_id = str(payload.get("assemblyConstituencyId") or "").strip()
        if not ac_id:
            raise HTTPException(status_code=400, detail="assemblyConstituencyId is required")
        if not in_scope(caps, payload.get("stateId"), ac_id):
            raise HTTPException(status_code=403, detail="Out of geography scope")
        existing = None
        for row in await _list("constituency_statistics"):
            if row.get("assemblyConstituencyId") == ac_id:
                existing = row
                break
        now = now_iso()
        doc = dict(existing or {})
        previous = deepcopy(doc) if existing else None
        doc.update(
            {
                "id": (existing or {}).get("id") or f"cstat-{ac_id}",
                "stateId": payload.get("stateId") or doc.get("stateId") or "AP",
                "districtId": payload.get("districtId") or doc.get("districtId"),
                "parliamentConstituencyId": payload.get("parliamentConstituencyId") or doc.get("parliamentConstituencyId"),
                "assemblyConstituencyId": ac_id,
                "assemblyName": payload.get("assemblyName") or doc.get("assemblyName"),
                "totalVoters": payload.get("totalVoters") if payload.get("totalVoters") not in ("", None) else doc.get("totalVoters"),
                "ruralPercent": payload.get("ruralPercent") if payload.get("ruralPercent") not in ("", None) else doc.get("ruralPercent"),
                "estimatedFacebookUsers": payload.get("estimatedFacebookUsers") if payload.get("estimatedFacebookUsers") not in ("", None) else doc.get("estimatedFacebookUsers"),
                "estimatedInstagramUsers": payload.get("estimatedInstagramUsers") if payload.get("estimatedInstagramUsers") not in ("", None) else doc.get("estimatedInstagramUsers"),
                "estimatedXUsers": payload.get("estimatedXUsers") if payload.get("estimatedXUsers") not in ("", None) else doc.get("estimatedXUsers"),
                "estimatedYouTubeUsers": payload.get("estimatedYouTubeUsers") if payload.get("estimatedYouTubeUsers") not in ("", None) else doc.get("estimatedYouTubeUsers"),
                "estimatesFlag": True,
                "dataCollectionDate": payload.get("dataCollectionDate") or now,
                "dataSource": payload.get("dataSource") or "MANUAL",
                "remarks": payload.get("remarks") or doc.get("remarks"),
                "verificationStatus": payload.get("verificationStatus") or doc.get("verificationStatus") or "PENDING",
                "enteredBy": (existing or {}).get("enteredBy") or caps["actorId"],
                "enteredByName": (existing or {}).get("enteredByName") or caps["actorName"],
                "updatedBy": caps["actorId"],
                "updatedAt": now,
                "isSample": bool(doc.get("isSample")),
            }
        )
        if previous:
            await _append(
                "constituency_statistics_history",
                {"id": new_id("cstat-hist"), "assemblyConstituencyId": ac_id, "previous": previous, "changedAt": now, "changedBy": caps["actorId"]},
            )
        saved = await _save("constituency_statistics", doc["id"], doc)
        await _audit(actor, "PI_CONSTITUENCY_UPSERT", ac_id, {"id": doc["id"]})
        return saved

    @api_router.get("/pi/leaders")
    async def list_leaders(
        userId: Optional[str] = None,
        assemblyConstituencyId: Optional[str] = None,
        districtId: Optional[str] = None,
        partyId: Optional[str] = None,
        q: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ):
        actor = await _load_actor(userId)
        caps = actor_capabilities(actor)
        _require(caps, "view")
        rows = await _list("political_persons")
        roles = await _list("political_person_roles")
        if assemblyConstituencyId:
            rows = [r for r in rows if r.get("assemblyConstituencyId") == assemblyConstituencyId]
        if districtId:
            ac_ids = {m.get("assemblyConstituencyId") for m in await _list("assembly_district_map") if m.get("districtId") == districtId}
            rows = [r for r in rows if r.get("districtId") == districtId or r.get("assemblyConstituencyId") in ac_ids]
        if partyId:
            rows = [r for r in rows if str(r.get("partyId") or "").upper() == partyId.upper()]
        rows = [r for r in rows if in_scope(caps, r.get("stateId"), r.get("assemblyConstituencyId"))]
        if q:
            needle = q.lower()
            rows = [r for r in rows if needle in str(r.get("name") or "").lower()]
        for row in rows:
            row["roles"] = [rl for rl in roles if rl.get("personId") == row.get("id")]
        total = len(rows)
        return {"total": total, "items": rows[skip : skip + max(1, min(limit, 200))]}

    @api_router.post("/pi/leaders")
    async def upsert_leader(payload: dict, userId: Optional[str] = None):
        actor = await _load_actor(userId)
        caps = actor_capabilities(actor)
        _require(caps, "create")
        payload = payload or {}
        name = str(payload.get("name") or "").strip()
        ac_id = str(payload.get("assemblyConstituencyId") or "").strip()
        party_id = str(payload.get("partyId") or "").strip().upper()
        if not name or not ac_id or not party_id:
            raise HTTPException(status_code=400, detail="name, assemblyConstituencyId and partyId are required")
        if not in_scope(caps, payload.get("stateId"), ac_id):
            raise HTTPException(status_code=403, detail="Out of geography scope")
        geo = await _geo_lookups()
        if party_id not in geo["parties"] and party_id not in {p.get("abbreviation", "").upper() for p in geo["parties"].values()}:
            raise HTTPException(status_code=400, detail="Political party must be selected from the party master")
        existing = None
        if payload.get("id"):
            existing = await _get("political_persons", payload["id"])
        if not existing:
            needle = normalize_name(name)
            for row in await _list("political_persons"):
                if row.get("normalizedName") == needle and row.get("assemblyConstituencyId") == ac_id:
                    existing = row
                    break
        now = now_iso()
        person_id = (existing or {}).get("id") or payload.get("id") or new_id("pp")
        doc = dict(existing or {})
        doc.update(
            {
                "id": person_id,
                "name": name,
                "normalizedName": normalize_name(name),
                "partyId": party_id,
                "stateId": payload.get("stateId") or doc.get("stateId") or "AP",
                "districtId": payload.get("districtId") or doc.get("districtId"),
                "parliamentConstituencyId": payload.get("parliamentConstituencyId") or doc.get("parliamentConstituencyId"),
                "assemblyConstituencyId": ac_id,
                "dataSource": payload.get("dataSource") or doc.get("dataSource") or "MANUAL",
                "verificationStatus": payload.get("verificationStatus") or doc.get("verificationStatus") or "PENDING",
                "remarks": payload.get("remarks") if payload.get("remarks") is not None else doc.get("remarks"),
                "enteredBy": (existing or {}).get("enteredBy") or caps["actorId"],
                "enteredByName": (existing or {}).get("enteredByName") or caps["actorName"],
                "updatedAt": now,
                "isSample": bool(doc.get("isSample")),
            }
        )
        contact = await _upsert_linked_contact(doc, caps)
        doc["contactId"] = contact.get("id")
        saved = await _save("political_persons", person_id, doc)
        roles_in = payload.get("roles") if isinstance(payload.get("roles"), list) else None
        if payload.get("politicalRole"):
            roles_in = [{"politicalRole": payload.get("politicalRole"), "status": payload.get("currentFormerStatus") or "CURRENT", "electionYear": payload.get("electionYear"), "partyId": party_id, "assemblyConstituencyId": ac_id}]
        if roles_in:
            existing_roles = [r for r in await _list("political_person_roles") if r.get("personId") == person_id]
            for role in roles_in:
                match = next((r for r in existing_roles if r.get("politicalRole") == role.get("politicalRole") and r.get("assemblyConstituencyId") == (role.get("assemblyConstituencyId") or ac_id)), None)
                role_doc = dict(match or {})
                role_doc.update(
                    {
                        "id": role_doc.get("id") or new_id("pr"),
                        "personId": person_id,
                        "politicalRole": role.get("politicalRole") or "OTHER",
                        "status": role.get("status") or "CURRENT",
                        "electionYear": role.get("electionYear"),
                        "partyId": role.get("partyId") or party_id,
                        "assemblyConstituencyId": role.get("assemblyConstituencyId") or ac_id,
                        "parliamentConstituencyId": payload.get("parliamentConstituencyId"),
                    }
                )
                await _save("political_person_roles", role_doc["id"], role_doc)
        saved["roles"] = [r for r in await _list("political_person_roles") if r.get("personId") == person_id]
        await _audit(actor, "PI_LEADER_UPSERT", person_id, {"name": name, "partyId": party_id})
        return saved

    async def _upsert_linked_contact(person: Dict[str, Any], caps: Dict[str, Any]) -> Dict[str, Any]:
        existing = None
        if person.get("contactId"):
            existing = await _get("constituency_contacts", person["contactId"])
        if not existing:
            needle = normalize_name(person.get("name") or "")
            for row in await _list("constituency_contacts"):
                if normalize_name(row.get("name") or "") == needle and row.get("assemblyConstituencyId") == person.get("assemblyConstituencyId"):
                    existing = row
                    break
        now = now_iso()
        contact_id = (existing or {}).get("id") or new_id("cnt-pi")
        previous = deepcopy(existing) if existing else None
        doc = dict(existing or {})
        doc.update(
            {
                "id": contact_id,
                "name": person.get("name"),
                "category": doc.get("category") or "INFLUENCER",
                "designation": doc.get("designation") or "Political leader",
                "politicalPersonId": person.get("id"),
                "partyId": person.get("partyId"),
                "assemblyConstituencyId": person.get("assemblyConstituencyId"),
                "source": doc.get("source") or "POLITICAL_INTELLIGENCE",
                "updatedAt": now,
            }
        )
        if previous and previous.get("name") != doc.get("name"):
            await _append(
                "constituency_contact_history",
                {"id": new_id("ch"), "contactId": contact_id, "action": "NAME_UPDATED", "previous": previous.get("name"), "next": doc.get("name"), "actorUserId": caps["actorId"], "timestamp": now},
            )
        elif not previous:
            await _append(
                "constituency_contact_history",
                {"id": new_id("ch"), "contactId": contact_id, "action": "CREATED_FROM_PI", "actorUserId": caps["actorId"], "timestamp": now, "metadata": {"personId": person.get("id")}},
            )
        return await _save("constituency_contacts", contact_id, doc)

    @api_router.get("/pi/social-accounts")
    async def list_accounts(
        userId: Optional[str] = None,
        personId: Optional[str] = None,
        assemblyConstituencyId: Optional[str] = None,
        platform: Optional[str] = None,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ):
        actor = await _load_actor(userId)
        caps = actor_capabilities(actor)
        _require(caps, "view")
        persons = {p.get("id"): p for p in await _list("political_persons")}
        rows = await _list("social_media_accounts")
        if personId:
            rows = [r for r in rows if r.get("personId") == personId]
        if platform:
            rows = [r for r in rows if r.get("platform") == platform.lower()]
        if status:
            rows = [r for r in rows if r.get("verificationStatus") == status.upper()]
        if assemblyConstituencyId:
            rows = [r for r in rows if persons.get(r.get("personId"), {}).get("assemblyConstituencyId") == assemblyConstituencyId]
        rows = [r for r in rows if in_scope(caps, persons.get(r.get("personId"), {}).get("stateId"), persons.get(r.get("personId"), {}).get("assemblyConstituencyId"))]
        snapshots = await _list("social_media_snapshots")
        for row in rows:
            person = persons.get(row.get("personId")) or {}
            row["leaderName"] = person.get("name")
            row["partyId"] = person.get("partyId")
            related = [s for s in snapshots if s.get("accountId") == row.get("id")]
            row["growth7"] = snapshot_growth(related, 7)
            row["growth30"] = snapshot_growth(related, 30)
            row["growth90"] = snapshot_growth(related, 90)
        total = len(rows)
        return {"total": total, "items": rows[skip : skip + max(1, min(limit, 200))]}

    @api_router.post("/pi/social-accounts")
    async def upsert_account(payload: dict, userId: Optional[str] = None):
        actor = await _load_actor(userId)
        caps = actor_capabilities(actor)
        _require(caps, "create")
        payload = payload or {}
        person_id = str(payload.get("personId") or "").strip()
        platform = str(payload.get("platform") or "").strip().lower()
        url = str(payload.get("profileUrl") or "").strip()
        if not person_id or platform not in PLATFORMS:
            raise HTTPException(status_code=400, detail="personId and a supported platform are required")
        person = await _get("political_persons", person_id)
        if not person:
            raise HTTPException(status_code=404, detail="Leader not found")
        if not in_scope(caps, person.get("stateId"), person.get("assemblyConstituencyId")):
            raise HTTPException(status_code=403, detail="Out of geography scope")
        status = str(payload.get("verificationStatus") or "PENDING").upper()
        if status not in ACCOUNT_STATUSES:
            status = "PENDING"
        if status == "NO_ACCOUNT":
            url = url or f"https://none.invalid/{person_id}/{platform}"
        if not url and status != "NO_ACCOUNT":
            raise HTTPException(status_code=400, detail="profileUrl is required")
        ident = str(payload.get("accountIdentifier") or "").strip()
        identity = account_identity_key(platform, url, ident)
        existing = None
        if payload.get("id"):
            existing = await _get("social_media_accounts", payload["id"])
        for row in await _list("social_media_accounts"):
            if row.get("id") == (existing or {}).get("id"):
                continue
            if row.get("identityKey") == identity or (url and row.get("normalizedUrl") == normalize_profile_url(url, platform) and status != "NO_ACCOUNT"):
                raise HTTPException(status_code=409, detail="Duplicate profile URL or account identifier")
        followers = payload.get("followers")
        if followers == "" or followers is None:
            followers = None
        else:
            followers = float(followers)
        likes = payload.get("avgLikesLast10")
        comments = payload.get("avgCommentsLast10")
        views = payload.get("avgViewsLast10")
        posts = payload.get("postsLast30Days")
        likes = None if likes in ("", None) else float(likes)
        comments = None if comments in ("", None) else float(comments)
        views = None if views in ("", None) else float(views)
        posts = None if posts in ("", None) else int(float(posts))
        eng, formula = calculate_engagement(platform, followers, likes, comments, views)
        now = now_iso()
        account_id = (existing or {}).get("id") or new_id("sma")
        doc = dict(existing or {})
        doc.update(
            {
                "id": account_id,
                "personId": person_id,
                "platform": platform,
                "profileUrl": url,
                "normalizedUrl": normalize_profile_url(url, platform),
                "accountIdentifier": ident,
                "identityKey": identity,
                "followers": followers,
                "postsLast30Days": posts,
                "avgLikesLast10": likes,
                "avgCommentsLast10": comments,
                "avgViewsLast10": views,
                "engagementPercent": eng,
                "engagementFormulaVersion": formula,
                "verificationStatus": status,
                "dataCollectionDate": payload.get("dataCollectionDate") or now,
                "dataSource": payload.get("dataSource") or "MANUAL",
                "remarks": payload.get("remarks"),
                "enteredBy": (existing or {}).get("enteredBy") or caps["actorId"],
                "enteredByName": (existing or {}).get("enteredByName") or caps["actorName"],
                "updatedAt": now,
                "noAccount": status == "NO_ACCOUNT",
                "partyId": person.get("partyId"),
            }
        )
        saved = await _save("social_media_accounts", account_id, doc)
        if followers is not None or likes is not None or comments is not None or views is not None:
            await _append(
                "social_media_snapshots",
                {
                    "id": new_id("snap"),
                    "accountId": account_id,
                    "personId": person_id,
                    "platform": platform,
                    "followers": followers,
                    "postsLast30Days": posts,
                    "avgLikesLast10": likes,
                    "avgCommentsLast10": comments,
                    "avgViewsLast10": views,
                    "engagementPercent": eng,
                    "engagementFormulaVersion": formula,
                    "collectionDate": doc["dataCollectionDate"],
                    "collectedBy": caps["actorId"],
                    "dataSource": doc["dataSource"],
                    "verificationStatus": status,
                },
            )
        await _append(
            "constituency_contact_history",
            {"id": new_id("ch"), "contactId": person.get("contactId"), "action": "SOCIAL_ACCOUNT_UPSERT", "actorUserId": caps["actorId"], "timestamp": now, "metadata": {"accountId": account_id, "platform": platform}},
        )
        await _audit(actor, "PI_SOCIAL_UPSERT", account_id, {"platform": platform, "personId": person_id})
        return saved

    @api_router.get("/pi/social-accounts/{account_id}/snapshots")
    async def list_snapshots(account_id: str, userId: Optional[str] = None):
        actor = await _load_actor(userId)
        caps = actor_capabilities(actor)
        _require(caps, "view")
        rows = [s for s in await _list("social_media_snapshots") if s.get("accountId") == account_id]
        rows.sort(key=lambda s: s.get("collectionDate") or "", reverse=True)
        return rows

    @api_router.get("/pi/verification-queue")
    async def verification_queue(userId: Optional[str] = None, status: Optional[str] = "PENDING"):
        actor = await _load_actor(userId)
        caps = actor_capabilities(actor)
        _require(caps, "view")
        persons = {p.get("id"): p for p in await _list("political_persons")}
        rows = []
        wanted = (status or "PENDING").upper()
        for acc in await _list("social_media_accounts"):
            if acc.get("verificationStatus") != wanted:
                continue
            person = persons.get(acc.get("personId")) or {}
            if not in_scope(caps, person.get("stateId"), person.get("assemblyConstituencyId")):
                continue
            rows.append({**acc, "leaderName": person.get("name"), "partyId": person.get("partyId"), "assemblyConstituencyId": person.get("assemblyConstituencyId")})
        return rows

    @api_router.post("/pi/verification/{record_type}/{record_id}")
    async def verify_record(record_type: str, record_id: str, payload: dict, userId: Optional[str] = None):
        actor = await _load_actor(userId)
        caps = actor_capabilities(actor)
        _require(caps, "verify")
        payload = payload or {}
        new_status = str(payload.get("status") or "").upper()
        if new_status not in {"VERIFIED", "NEEDS_RECHECK", "REJECTED"}:
            raise HTTPException(status_code=400, detail="status must be VERIFIED, NEEDS_RECHECK or REJECTED")
        collection = {"social": "social_media_accounts", "leader": "political_persons", "constituency": "constituency_statistics"}.get(record_type)
        if not collection:
            raise HTTPException(status_code=400, detail="record_type must be social, leader or constituency")
        doc = await _get(collection, record_id)
        if not doc:
            raise HTTPException(status_code=404, detail="Record not found")
        if doc.get("enteredBy") == caps["actorId"] and not caps.get("isSuper"):
            raise HTTPException(status_code=403, detail="Independent verification required: you cannot verify your own submission")
        previous = doc.get("verificationStatus")
        now = now_iso()
        doc["verificationStatus"] = new_status
        doc["verifiedBy"] = caps["actorId"]
        doc["verifiedByName"] = caps["actorName"]
        doc["verifiedAt"] = now
        doc["reviewRemarks"] = payload.get("remarks") or ""
        saved = await _save(collection, record_id, doc)
        await _append(
            "data_verification_history",
            {
                "id": new_id("vh"),
                "recordType": record_type,
                "recordId": record_id,
                "enteredBy": doc.get("enteredBy"),
                "enteredDate": doc.get("updatedAt") or doc.get("dataCollectionDate"),
                "reviewedBy": caps["actorId"],
                "reviewedByName": caps["actorName"],
                "reviewedDate": now,
                "previousStatus": previous,
                "newStatus": new_status,
                "reviewRemarks": payload.get("remarks") or "",
            },
        )
        await _audit(actor, "PI_VERIFY", record_id, {"from": previous, "to": new_status, "type": record_type})
        return saved

    @api_router.get("/pi/verification/{record_id}/history")
    async def verification_history(record_id: str, userId: Optional[str] = None):
        actor = await _load_actor(userId)
        caps = actor_capabilities(actor)
        _require(caps, "view")
        return [h for h in await _list("data_verification_history") if h.get("recordId") == record_id]

    @api_router.get("/pi/intelligence")
    async def intelligence(
        userId: Optional[str] = None,
        stateId: Optional[str] = None,
        districtId: Optional[str] = None,
        parliamentConstituencyId: Optional[str] = None,
        assemblyConstituencyId: Optional[str] = None,
        platform: Optional[str] = None,
        partyId: Optional[str] = None,
        rankBy: Optional[str] = "followers",
    ):
        actor = await _load_actor(userId)
        caps = actor_capabilities(actor)
        _require(caps, "view")
        geo = await _geo_lookups()
        persons = await _list("political_persons")
        accounts = await _list("social_media_accounts")
        snapshots = await _list("social_media_snapshots")
        stats = await _list("constituency_statistics")
        if stateId:
            persons = [p for p in persons if str(p.get("stateId") or "").upper() == stateId.upper()]
            stats = [s for s in stats if str(s.get("stateId") or "").upper() == stateId.upper()]
        if districtId:
            ac_ids = {m.get("assemblyConstituencyId") for m in await _list("assembly_district_map") if m.get("districtId") == districtId}
            persons = [p for p in persons if p.get("districtId") == districtId or p.get("assemblyConstituencyId") in ac_ids]
            stats = [s for s in stats if s.get("districtId") == districtId or s.get("assemblyConstituencyId") in ac_ids]
        if parliamentConstituencyId:
            persons = [p for p in persons if p.get("parliamentConstituencyId") == parliamentConstituencyId]
        if assemblyConstituencyId:
            persons = [p for p in persons if p.get("assemblyConstituencyId") == assemblyConstituencyId]
            stats = [s for s in stats if s.get("assemblyConstituencyId") == assemblyConstituencyId]
        if partyId:
            persons = [p for p in persons if str(p.get("partyId") or "").upper() == partyId.upper()]
        persons = [p for p in persons if in_scope(caps, p.get("stateId"), p.get("assemblyConstituencyId"))]
        person_ids = {p.get("id") for p in persons}
        if platform:
            accounts = [a for a in accounts if a.get("platform") == platform.lower()]
        accounts = [a for a in accounts if a.get("personId") in person_ids]
        audience = {"facebook": 0, "instagram": 0, "x": 0, "youtube": 0, "confidence": "Estimated"}
        for stat in stats:
            for key, plat in (("estimatedFacebookUsers", "facebook"), ("estimatedInstagramUsers", "instagram"), ("estimatedXUsers", "x"), ("estimatedYouTubeUsers", "youtube")):
                val = stat.get(key)
                if val is not None:
                    audience[plat] += int(val)
        leaders = []
        for person in persons:
            party = geo["parties"].get(person.get("partyId")) or {}
            person_accounts = [a for a in accounts if a.get("personId") == person.get("id") and not a.get("noAccount")]
            combined = None
            engagements = []
            posts = []
            growths = []
            for acc in person_accounts:
                related = [s for s in snapshots if s.get("accountId") == acc.get("id")]
                g30 = snapshot_growth(related, 30)
                g90 = snapshot_growth(related, 90)
                acc["growth30"] = g30
                acc["growth90"] = g90
                if acc.get("followers") is not None:
                    combined = (combined or 0) + acc["followers"]
                if acc.get("engagementPercent") is not None:
                    engagements.append(acc["engagementPercent"])
                if acc.get("postsLast30Days") is not None:
                    posts.append(acc["postsLast30Days"])
                if g30 is not None:
                    growths.append(g30)
            leaders.append(
                {
                    "id": person.get("id"),
                    "name": person.get("name"),
                    "partyId": person.get("partyId"),
                    "partyName": party.get("name") or person.get("partyId"),
                    "partyColor": party.get("primaryColor") or "#D4A24C",
                    "assemblyConstituencyId": person.get("assemblyConstituencyId"),
                    "districtId": person.get("districtId"),
                    "parliamentConstituencyId": person.get("parliamentConstituencyId"),
                    "stateId": person.get("stateId"),
                    "followers": combined,
                    "engagementPercent": round(sum(engagements) / len(engagements), 4) if engagements else None,
                    "postsLast30Days": sum(posts) if posts else None,
                    "growth30": round(sum(growths) / len(growths), 4) if growths else None,
                    "accounts": person_accounts,
                    "verificationStatus": person.get("verificationStatus"),
                }
            )
        for row in leaders:
            score, meta = social_score(row, leaders)
            row["socialScore"] = score
            row["socialScoreMeta"] = meta
        rank_key = {"followers": "followers", "engagement": "engagementPercent", "growth": "growth30", "socialScore": "socialScore"}.get(rankBy or "followers", "followers")

        def _rank(items, key):
            sortable = [i for i in items if i.get(key) is not None]
            sortable.sort(key=lambda i: i.get(key) or 0, reverse=True)
            order = {i.get("id"): idx + 1 for idx, i in enumerate(sortable)}
            return order

        all_ids_state = _rank(leaders, rank_key)
        for row in leaders:
            row["rankInView"] = all_ids_state.get(row["id"])
            row["rankInDistrict"] = _rank([l for l in leaders if l.get("districtId") == row.get("districtId")], rank_key).get(row["id"])
            row["rankInParliament"] = _rank([l for l in leaders if l.get("parliamentConstituencyId") == row.get("parliamentConstituencyId")], rank_key).get(row["id"])
            row["rankInParty"] = _rank([l for l in leaders if l.get("partyId") == row.get("partyId")], rank_key).get(row["id"])
            row["rankInState"] = _rank([l for l in leaders if l.get("stateId") == row.get("stateId")], rank_key).get(row["id"])
            row["rankInConstituency"] = _rank([l for l in leaders if l.get("assemblyConstituencyId") == row.get("assemblyConstituencyId")], rank_key).get(row["id"])
        leaders.sort(key=lambda r: (r.get(rank_key) is None, -(r.get(rank_key) or 0)))
        party_compare = {}
        for row in leaders:
            bucket = party_compare.setdefault(row.get("partyId") or "UNKNOWN", {"partyId": row.get("partyId"), "partyName": row.get("partyName"), "partyColor": row.get("partyColor"), "leaders": 0, "followers": 0, "accounts": 0})
            bucket["leaders"] += 1
            if row.get("followers") is not None:
                bucket["followers"] += row["followers"]
            bucket["accounts"] += len(row.get("accounts") or [])
        platform_compare = {}
        for acc in accounts:
            if acc.get("noAccount"):
                continue
            bucket = platform_compare.setdefault(acc.get("platform"), {"platform": acc.get("platform"), "accounts": 0, "followers": 0})
            bucket["accounts"] += 1
            if acc.get("followers") is not None:
                bucket["followers"] += acc["followers"]
        biggest_gap = None
        if len(leaders) >= 2 and leaders[0].get("followers") is not None and leaders[1].get("followers") is not None:
            biggest_gap = {
                "leader": leaders[0].get("name"),
                "opponent": leaders[1].get("name"),
                "followersDelta": leaders[0]["followers"] - leaders[1]["followers"],
            }
        return {
            "audienceEstimates": audience,
            "leaders": leaders,
            "partyCompare": list(party_compare.values()),
            "platformCompare": list(platform_compare.values()),
            "biggestGap": biggest_gap,
            "rankBy": rank_key,
            "socialScoreDisclaimer": "Social Score is an internal relative index among the filtered leaders. Missing metrics are skipped, never treated as zero. It is not an official election or popularity score.",
        }

    @api_router.get("/pi/import/template")
    async def download_template(userId: Optional[str] = None):
        actor = await _load_actor(userId)
        caps = actor_capabilities(actor)
        _require(caps, "export")
        return PlainTextResponse(csv_template(), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=leaderlens-pi-template.csv"})

    @api_router.post("/pi/import/preview")
    async def import_preview(payload: dict, userId: Optional[str] = None):
        actor = await _load_actor(userId)
        caps = actor_capabilities(actor)
        _require(caps, "import")
        text = payload.get("csv") or payload.get("text") or ""
        rows = parse_csv(text)
        geo = await _geo_lookups()
        existing_stats = {s.get("assemblyConstituencyId") for s in await _list("constituency_statistics")}
        existing_urls = {a.get("normalizedUrl") for a in await _list("social_media_accounts")}
        valid, invalid, duplicates = [], [], []
        for idx, row in enumerate(rows, start=2):
            errors = []
            record_type = (row.get("recordType") or "constituency").lower()
            ac = row.get("assemblyConstituencyId")
            if ac and ac not in geo["assemblies"] and ac != "BNG-AC":
                errors.append("Unknown assemblyConstituencyId")
            if record_type == "social":
                if (row.get("platform") or "").lower() not in PLATFORMS:
                    errors.append("Invalid platform")
                url = normalize_profile_url(row.get("profileUrl") or "", row.get("platform") or "")
                if url and url in existing_urls:
                    duplicates.append({"line": idx, "row": row, "reason": "Duplicate profile URL"})
                    continue
                for field in ("followers", "postsLast30Days", "avgLikesLast10", "avgCommentsLast10", "avgViewsLast10"):
                    if row.get(field) and not _is_number(row.get(field)):
                        errors.append(f"Invalid number: {field}")
            elif record_type == "constituency":
                if ac in existing_stats:
                    duplicates.append({"line": idx, "row": row, "reason": "Constituency already entered (will update on confirm)"})
            else:
                if not row.get("leaderName"):
                    errors.append("leaderName required")
                if row.get("partyId") and row.get("partyId").upper() not in geo["parties"]:
                    errors.append("Unknown partyId")
            if errors:
                invalid.append({"line": idx, "row": row, "errors": errors})
            else:
                valid.append({"line": idx, "row": row})
        return {
            "totalRows": len(rows),
            "validRows": len(valid),
            "invalidRows": len(invalid),
            "duplicateRows": len(duplicates),
            "valid": valid[:200],
            "invalid": invalid[:200],
            "duplicates": duplicates[:200],
        }

    @api_router.post("/pi/import/confirm")
    async def import_confirm(payload: dict, userId: Optional[str] = None):
        actor = await _load_actor(userId)
        caps = actor_capabilities(actor)
        _require(caps, "import")
        preview = await import_preview(payload, userId=userId)
        imported, rejected = 0, 0
        for item in preview.get("valid") or []:
            row = item["row"]
            record_type = (row.get("recordType") or "constituency").lower()
            try:
                if record_type == "constituency":
                    await upsert_constituency(row, userId=userId)
                elif record_type == "leader":
                    await upsert_leader(
                        {
                            "name": row.get("leaderName"),
                            "partyId": row.get("partyId"),
                            "assemblyConstituencyId": row.get("assemblyConstituencyId"),
                            "stateId": row.get("stateId"),
                            "districtId": row.get("districtId"),
                            "parliamentConstituencyId": row.get("parliamentConstituencyId"),
                            "politicalRole": row.get("politicalRole"),
                            "currentFormerStatus": row.get("currentFormerStatus"),
                            "dataSource": row.get("dataSource") or "CSV_IMPORT",
                            "remarks": row.get("remarks"),
                        },
                        userId=userId,
                    )
                else:
                    leaders = await list_leaders(userId=userId, assemblyConstituencyId=row.get("assemblyConstituencyId"), q=row.get("leaderName"))
                    person = next((p for p in leaders.get("items") or [] if normalize_name(p.get("name")) == normalize_name(row.get("leaderName") or "")), None)
                    if not person:
                        person = await upsert_leader(
                            {
                                "name": row.get("leaderName"),
                                "partyId": row.get("partyId"),
                                "assemblyConstituencyId": row.get("assemblyConstituencyId"),
                                "stateId": row.get("stateId"),
                                "politicalRole": row.get("politicalRole") or "OTHER",
                                "dataSource": "CSV_IMPORT",
                            },
                            userId=userId,
                        )
                    await upsert_account(
                        {
                            "personId": person.get("id"),
                            "platform": row.get("platform"),
                            "profileUrl": row.get("profileUrl"),
                            "accountIdentifier": row.get("accountIdentifier"),
                            "followers": row.get("followers") or None,
                            "postsLast30Days": row.get("postsLast30Days") or None,
                            "avgLikesLast10": row.get("avgLikesLast10") or None,
                            "avgCommentsLast10": row.get("avgCommentsLast10") or None,
                            "avgViewsLast10": row.get("avgViewsLast10") or None,
                            "dataSource": "CSV_IMPORT",
                            "dataCollectionDate": row.get("dataCollectionDate"),
                            "remarks": row.get("remarks"),
                        },
                        userId=userId,
                    )
                imported += 1
            except Exception:
                rejected += 1
        rejected += preview.get("invalidRows") or 0
        batch = {
            "id": new_id("imp"),
            "createdAt": now_iso(),
            "createdBy": caps["actorId"],
            "totalRows": preview.get("totalRows"),
            "validRows": preview.get("validRows"),
            "invalidRows": preview.get("invalidRows"),
            "duplicateRows": preview.get("duplicateRows"),
            "importedRows": imported,
            "rejectedRows": rejected,
            "source": "CSV",
        }
        await _save("data_import_batches", batch["id"], batch)
        await _audit(actor, "PI_IMPORT", batch["id"], batch)
        return batch

    @api_router.get("/pi/import/batches")
    async def import_batches(userId: Optional[str] = None):
        actor = await _load_actor(userId)
        caps = actor_capabilities(actor)
        _require(caps, "export")
        return await _list("data_import_batches")

    @api_router.get("/pi/contacts")
    async def list_pi_contacts(userId: Optional[str] = None):
        actor = await _load_actor(userId)
        caps = actor_capabilities(actor)
        _require(caps, "view")
        return await _list("constituency_contacts")

    @api_router.post("/pi/contacts")
    async def upsert_pi_contact(payload: dict, userId: Optional[str] = None):
        actor = await _load_actor(userId)
        caps = actor_capabilities(actor)
        _require(caps, "update")
        payload = payload or {}
        contact_id = payload.get("id") or new_id("cnt")
        existing = await _get("constituency_contacts", contact_id)
        previous = deepcopy(existing) if existing else None
        doc = dict(existing or {})
        doc.update({k: v for k, v in payload.items() if v is not None})
        doc["id"] = contact_id
        doc["updatedAt"] = now_iso()
        saved = await _save("constituency_contacts", contact_id, doc)
        await _append(
            "constituency_contact_history",
            {"id": new_id("ch"), "contactId": contact_id, "action": "UPSERT", "previous": previous, "next": saved, "actorUserId": caps["actorId"], "timestamp": now_iso()},
        )
        return saved

    @api_router.get("/pi/contacts/{contact_id}/history")
    async def contact_history(contact_id: str, userId: Optional[str] = None):
        actor = await _load_actor(userId)
        caps = actor_capabilities(actor)
        _require(caps, "view")
        return [h for h in await _list("constituency_contact_history") if h.get("contactId") == contact_id]

    @api_router.post("/pi/seed-sample")
    async def seed_sample(userId: Optional[str] = None, confirm: str = ""):
        actor = await _load_actor(userId)
        caps = actor_capabilities(actor)
        if not caps.get("isSuper"):
            raise HTTPException(status_code=403, detail="Sample seed is Super Admin only")
        if confirm != "SAMPLE":
            raise HTTPException(status_code=400, detail="Pass confirm=SAMPLE")
        count = await _persist_sample()
        await _audit(actor, "PI_SAMPLE_SEED", "sample", {"count": count})
        return {"success": True, "upserted": count, "note": "SAMPLE records only. Production ids were not deleted."}

    @api_router.post("/pi/reset-sample")
    async def reset_sample(userId: Optional[str] = None, confirm: str = ""):
        actor = await _load_actor(userId)
        caps = actor_capabilities(actor)
        if not caps.get("isSuper"):
            raise HTTPException(status_code=403, detail="Sample reset is Super Admin only")
        if confirm != "RESET_SAMPLE":
            raise HTTPException(status_code=400, detail="Pass confirm=RESET_SAMPLE")
        removed = 0
        for collection in COLLECTIONS:
            rows = await _list(collection)
            keep = []
            for row in rows:
                if row.get("isSample"):
                    removed += 1
                    continue
                keep.append(row)
            if collection in MEMORY and isinstance(MEMORY[collection], dict):
                MEMORY[collection] = {item["id"]: item for item in keep if item.get("id")}
            else:
                MEMORY[collection] = keep
        return {"success": True, "removed": removed}


async def _persist_sample() -> int:
    load_sample_into_memory()
    payload = sample_seed_documents()
    count = 0
    mapping = {
        "districts": "districts",
        "assembly_district_map": "assembly_district_map",
        "constituency_statistics": "constituency_statistics",
        "political_persons": "political_persons",
        "political_person_roles": "political_person_roles",
        "social_media_accounts": "social_media_accounts",
        "social_media_snapshots": "social_media_snapshots",
        "constituency_contacts": "constituency_contacts",
        "constituency_contact_history": "constituency_contact_history",
    }
    for collection, rows in payload.items():
        for row in rows:
            key = row.get("id")
            if collection in {"social_media_snapshots", "constituency_contact_history"}:
                await _append(mapping[collection], row)
            else:
                await _save(mapping[collection], key, row)
            count += 1
    return count


def _is_number(value: str) -> bool:
    try:
        float(value)
        return True
    except Exception:
        return False
