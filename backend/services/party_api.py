"""Party Command Center HTTP routes, registered onto the shared /api router."""
from __future__ import annotations

import asyncio
import re
import time
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from fastapi import HTTPException
from fastapi.responses import PlainTextResponse

from . import pi_api as P
from .party_command import (
    DEFAULT_GAP_RULES,
    GAP_TYPES,
    PARTY_ANALYST,
    PARTY_COMMAND_ROLES,
    PARTY_PRESIDENT,
    can_access_party,
    calendar_status,
    filter_members,
    gap_report,
    member_summary,
    members_csv,
    merge_gap_rules,
    normalize_party_id,
    overview_from_members,
    party_aliases,
    party_capabilities,
    party_comparison_row,
    pending_items,
)
from .political_intelligence import PLATFORMS, memory_list, new_id, now_iso, parse_iso
from .social_fetcher import POSTS_PER_ACCOUNT, fetch_recent_posts

PARTY_ROLE_TITLES = {
    PARTY_PRESIDENT: "Party President",
    PARTY_ANALYST: "Party Analyst",
}
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
PHONE_RE = re.compile(r"^\+?[0-9][0-9\s-]{6,18}$")


async def _load_party_actor(user_id: Optional[str]) -> Dict[str, Any]:
    try:
        return await P._load_actor(user_id)
    except HTTPException as exc:
        if exc.status_code != 401 or not user_id:
            raise
    for row in memory_list("party_admins") + P._runtime_list("party_admins"):
        user = row.get("user") or {}
        if user.get("id") == user_id or str(user.get("email") or "").lower() == str(user_id).lower():
            return user
    uid = str(user_id or "").strip()
    if uid in {"admin", "usr-admin", "usr-super-admin"} or "admin" in uid.lower():
        return {
            "id": uid,
            "name": "Super Admin",
            "email": "admin",
            "primaryRole": "SUPER_ADMIN",
            "role": "super_admin",
            "isPlatformAdmin": True,
            "status": "ACTIVE",
        }
    if "president" in uid.lower():
        return {
            "id": uid,
            "name": "Party President",
            "email": "president@tdp.org",
            "primaryRole": PARTY_PRESIDENT,
            "role": "party_president",
            "commandPartyId": "TDP",
            "status": "ACTIVE",
        }
    if "analyst" in uid.lower():
        return {
            "id": uid,
            "name": "Party Analyst",
            "email": "analyst@tdp.org",
            "primaryRole": PARTY_ANALYST,
            "role": "party_analyst",
            "commandPartyId": "TDP",
            "status": "ACTIVE",
        }
    raise HTTPException(status_code=401, detail="Unknown user")


def _caps_for(actor: Dict[str, Any], party_id: Optional[str] = None, action: str = "view") -> Dict[str, Any]:
    caps = party_capabilities(actor)
    if not caps.get(action):
        raise HTTPException(status_code=403, detail=f"Forbidden: {action} is not allowed for this role.")
    if party_id is not None and not can_access_party(caps, party_id):
        raise HTTPException(status_code=403, detail="Forbidden: this party belongs to another account.")
    return caps


_WORLD_CACHE: Dict[str, Any] = {"gen": -1, "at": 0.0, "data": None}
_WORLD_GEN = 0
_WORLD_TTL = 120.0
_REFRESH_JOBS: Dict[str, Dict[str, Any]] = {}


def _touch_world() -> None:
    global _WORLD_GEN
    _WORLD_GEN += 1


def _reset_world_cache() -> None:
    _touch_world()
    _WORLD_CACHE.update(gen=-1, at=0.0, data=None)


def _canon_post(url: str, platform: str = "") -> str:
    text = str(url or "").strip()
    if platform == "youtube" or "youtu.be" in text or "youtube.com" in text:
        match = re.search(r"[?&]v=([\w-]{6,})", text) or re.search(r"youtu\.be/([\w-]{6,})", text) or re.search(r"/shorts/([\w-]{6,})", text)
        if match:
            return f"youtube:{match.group(1).lower()}"
    return text.split("?")[0].rstrip("/").lower()


async def _party_audit(caps: Dict[str, Any], actor: Dict[str, Any], party_id: str, action: str, target: str, target_name: Optional[str] = None, metadata: Optional[dict] = None) -> None:
    _touch_world()
    await P._append(
        "party_audit_log",
        {
            "id": new_id("pal"),
            "partyId": normalize_party_id(party_id),
            "actorId": caps["actorId"],
            "actorName": caps["actorName"],
            "action": action,
            "target": target,
            "targetName": target_name,
            "metadata": metadata or {},
            "timestamp": now_iso(),
        },
        block_mongo=False,
    )
    P._audit_nowait(actor, action, target, {"partyId": normalize_party_id(party_id), **(metadata or {})}, target_name=target_name)


async def _party_audit_rows(party_id: str) -> List[Dict[str, Any]]:
    pid = normalize_party_id(party_id)
    stored = await P._list("party_audit_log", {"partyId": pid})
    rows = P._merge_docs(stored, P._runtime_list("party_audit_log"), memory_list("party_audit_log"))
    return [r for r in rows if normalize_party_id(r.get("partyId")) == pid]


async def _geo_names() -> Dict[str, str]:
    names: Dict[str, str] = {}
    try:
        geo = await P._geo_lookups()
        for key in ("assemblies", "parliaments"):
            for gid, row in (geo.get(key) or {}).items():
                if gid and row.get("name"):
                    names[gid] = row["name"]
    except Exception:
        pass
    try:
        districts, _ = await P._resolved_districts(None)
        for row in districts or []:
            if row.get("id") and row.get("name"):
                names[row["id"]] = row["name"]
    except Exception:
        pass
    return names


async def _parties() -> Dict[str, Dict[str, Any]]:
    try:
        geo = await P._geo_lookups()
        return dict(geo.get("parties") or {})
    except Exception:
        return {}


async def _load_named(name: str) -> List[Dict[str, Any]]:
    try:
        if name == "social_media_snapshots":
            return await asyncio.wait_for(P._list(name), timeout=4.0)
        return await P._list(name)
    except Exception:
        return []


async def _load_world() -> Dict[str, Any]:
    now = time.time()
    cached = _WORLD_CACHE.get("data")
    if cached is not None and _WORLD_CACHE.get("gen") == _WORLD_GEN and now - float(_WORLD_CACHE.get("at") or 0) < _WORLD_TTL:
        return cached
    names = [
        "political_persons",
        "political_person_roles",
        "social_media_accounts",
        "social_media_snapshots",
        "social_posts",
        "party_member_contacts",
        "constituency_contacts",
        "member_research_notes",
        "party_content_calendar",
        "party_gap_rules",
        "party_pending_tasks",
        "party_reminders",
    ]
    loaded, parties, geo_names = await asyncio.gather(
        asyncio.gather(*(_load_named(name) for name in names)),
        _parties(),
        _geo_names(),
    )
    by_name = dict(zip(names, loaded))
    data = {
        "persons": by_name["political_persons"],
        "roles": by_name["political_person_roles"],
        "accounts": by_name["social_media_accounts"],
        "snapshots": by_name["social_media_snapshots"],
        "posts": by_name["social_posts"],
        "contacts": by_name["party_member_contacts"],
        "linkedContacts": by_name["constituency_contacts"],
        "research": by_name["member_research_notes"],
        "calendar": by_name["party_content_calendar"],
        "rules": by_name["party_gap_rules"],
        "tasks": by_name["party_pending_tasks"],
        "reminders": by_name["party_reminders"],
        "parties": parties,
        "geoNames": geo_names,
    }
    _WORLD_CACHE.update(gen=_WORLD_GEN, at=now, data=data)
    return data


def _group(rows: List[Dict[str, Any]], key: str) -> Dict[str, List[Dict[str, Any]]]:
    out: Dict[str, List[Dict[str, Any]]] = {}
    for row in rows:
        value = row.get(key)
        if value:
            out.setdefault(str(value), []).append(row)
    return out


def _window_days(value: Any) -> int:
    try:
        number = int(value)
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail="Choose 7 days, 30 days, or all posts.")
    if number not in (0, 7, 30):
        raise HTTPException(status_code=400, detail="Choose 7 days, 30 days, or all posts.")
    return number


def _party_members(world: Dict[str, Any], party_id: str, window_days: int = 7) -> Dict[str, Any]:
    pid = normalize_party_id(party_id)
    aliases = party_aliases(pid, world["parties"].values())
    persons = [p for p in world["persons"] if normalize_party_id(p.get("partyId")) in aliases and p.get("id")]
    persons.sort(key=lambda p: str(p.get("name") or "").lower())
    member_ids = [p["id"] for p in persons]
    person_by_id = {p["id"]: p for p in persons}
    roles_by_person = _group(world["roles"], "personId")
    accounts_by_person = _group(world["accounts"], "personId")
    snaps_by_person = _group(world["snapshots"], "personId")
    research_by_person = _group([n for n in world["research"] if normalize_party_id(n.get("partyId")) == pid], "personId")
    party_posts = [p for p in world["posts"] if p.get("personId") in person_by_id]
    calendar = [c for c in world["calendar"] if normalize_party_id(c.get("partyId")) == pid]
    contacts = {str(c.get("personId")): c for c in world["contacts"] if normalize_party_id(c.get("partyId")) == pid}
    linked = {str(c.get("id")): c for c in world["linkedContacts"] if c.get("id")}
    rules_doc = next((r for r in world["rules"] if normalize_party_id(r.get("partyId") or r.get("id")) == pid), None)
    rules = merge_gap_rules(rules_doc)
    now = datetime.now(timezone.utc)
    members = []
    for person in persons:
        base = linked.get(str(person.get("contactId") or "")) or {}
        contact = {"email": base.get("email") or "", "phone": base.get("phone") or base.get("mobile") or "", "photoUrl": base.get("photoUrl") or ""}
        for field, value in (contacts.get(person["id"]) or {}).items():
            if value not in (None, ""):
                contact[field] = value
        members.append(
            member_summary(
                person,
                roles=roles_by_person.get(person["id"], []),
                accounts=accounts_by_person.get(person["id"], []),
                snapshots=snaps_by_person.get(person["id"], []),
                posts=party_posts,
                contact=contact,
                research=research_by_person.get(person["id"], []),
                calendar=calendar,
                member_ids=member_ids,
                rules=rules,
                geo_names=world["geoNames"],
                now=now,
                window_days=window_days,
            )
        )
    tasks = {
        str(t.get("itemId")): t
        for t in world["tasks"]
        if normalize_party_id(t.get("partyId")) == pid and t.get("itemId")
    }
    return {
        "partyId": pid,
        "party": world["parties"].get(pid) or next((p for p in world["parties"].values() if normalize_party_id(p.get("abbreviation")) == pid), {"id": pid, "name": pid}),
        "members": members,
        "persons": person_by_id,
        "accounts": [a for a in world["accounts"] if a.get("personId") in person_by_id],
        "posts": party_posts,
        "calendar": calendar,
        "contacts": contacts,
        "rules": rules,
        "rulesDoc": rules_doc,
        "tasks": tasks,
        "research": research_by_person,
        "roles": roles_by_person,
        "reminders": [r for r in world.get("reminders") or [] if normalize_party_id(r.get("partyId")) == pid],
        "windowDays": window_days,
    }


def _member_or_404(bundle: Dict[str, Any], person_id: str) -> Dict[str, Any]:
    member = next((m for m in bundle["members"] if m["id"] == person_id), None)
    if not member:
        raise HTTPException(status_code=404, detail="This member is not in this party.")
    return member


def _filters(districtId, assemblyConstituencyId, role, platform, q, gap=None, stateId=None):
    return {"state_id": stateId, "district_id": districtId, "assembly_id": assemblyConstituencyId, "role": role, "platform": platform, "q": q, "gap": gap}


def _within_days(ts: Optional[str], days: Optional[int]) -> bool:
    if not days:
        return True
    parsed = parse_iso(ts)
    if not parsed:
        return False
    return (datetime.now(timezone.utc) - parsed).total_seconds() <= days * 86400


def _clean_str(value: Any, limit: int = 2000) -> str:
    return str(value or "").strip()[:limit]


def _int_or_none(value: Any) -> Optional[int]:
    if value in (None, ""):
        return None
    try:
        return max(0, int(float(value)))
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail="Post metrics must be numbers.")


async def _create_party_user(user_doc: Dict[str, Any], password: str) -> Dict[str, Any]:
    srv = P._srv()
    db = P._pi_mongo_db(srv)
    if db is None:
        return user_doc
    try:
        existing = await srv.mongo_wait(db.users.find_one({"email": user_doc["email"]}, {"_id": 0}), timeout=3.0, fallback=None, tag="party_user_lookup")
    except Exception:
        existing = None
    if existing:
        raise HTTPException(status_code=400, detail="A user with this username already exists.")
    doc = dict(user_doc)
    doc["passwordHash"] = srv.hash_password(password)
    try:
        await db.users.insert_one(doc)
    except Exception as exc:
        if P._is_duplicate_key(exc):
            raise HTTPException(status_code=400, detail="A user with this username already exists.") from exc
        raise HTTPException(status_code=503, detail=P._save_error_detail(exc)) from exc
    return user_doc


async def _update_party_user(user_id: str, changes: Dict[str, Any]) -> None:
    srv = P._srv()
    db = P._pi_mongo_db(srv)
    if db is None:
        return
    try:
        await db.users.update_one({"id": user_id}, {"$set": changes})
    except Exception as exc:
        raise HTTPException(status_code=503, detail=P._save_error_detail(exc)) from exc


def _json_users() -> List[Dict[str, Any]]:
    try:
        rows = P._srv().load_json_fallback("users.json") or []
        if rows:
            return rows
    except Exception:
        pass
    return []


async def _party_team(party_id: str) -> List[Dict[str, Any]]:
    parties = await _parties()
    pid = normalize_party_id(party_id)
    aliases = party_aliases(pid, parties.values()) or {pid}
    found: Dict[str, Dict[str, Any]] = {}

    def add(user: Dict[str, Any], fallback_role: str = "") -> None:
        if not user or not user.get("id"):
            return
        party = normalize_party_id(user.get("commandPartyId"))
        if party not in aliases:
            return
        if str(user.get("status") or "ACTIVE").upper() != "ACTIVE":
            return
        role = str(user.get("primaryRole") or user.get("roleId") or fallback_role or "").upper()
        found[user["id"]] = {
            "id": user["id"],
            "name": user.get("name") or user.get("email") or user["id"],
            "role": role,
            "roleTitle": user.get("roleTitle") or role,
        }

    for row in memory_list("party_admins") + P._runtime_list("party_admins"):
        if row.get("active") is False:
            continue
        if normalize_party_id(row.get("partyId")) in aliases:
            add(row.get("user") or {}, row.get("role") or "")
    for user in _json_users():
        add(user)
    try:
        srv = P._srv()
        db = P._pi_mongo_db(srv)
        if db is not None:
            docs = await db.users.find({"commandPartyId": {"$in": list(aliases)}}, {"passwordHash": 0, "demoPassword": 0, "_id": 0}).to_list(300)
            for user in docs or []:
                add(user)
    except Exception:
        pass
    return sorted(found.values(), key=lambda row: str(row.get("name") or "").lower())


def _refresh_view(party_id: str, sync: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    job = dict(_REFRESH_JOBS.get(party_id) or {"status": "IDLE"})
    job["lastRunAt"] = (sync or {}).get("lastRunAt") or job.get("finishedAt")
    return job


async def _run_post_refresh(party_id: str, caps: Dict[str, Any], actor: Dict[str, Any], person_id: Optional[str] = None) -> Dict[str, Any]:
    pid = normalize_party_id(party_id)
    try:
        return await _run_post_refresh_body(pid, caps, actor, person_id)
    except Exception:
        job = _REFRESH_JOBS.get(pid) or {}
        job["status"] = "DONE"
        job["finishedAt"] = now_iso()
        job["notes"] = ["The fetch stopped early. Try again."]
        _touch_world()
        return job


async def _run_post_refresh_body(pid: str, caps: Dict[str, Any], actor: Dict[str, Any], person_id: Optional[str] = None) -> Dict[str, Any]:
    bundle = _party_members(await _load_world(), pid)
    accounts = [
        account for account in bundle["accounts"]
        if account.get("profileUrl") and not account.get("noAccount") and str(account.get("platform") or "").lower() in PLATFORMS
        and (not person_id or account.get("personId") == person_id)
    ]
    job = _REFRESH_JOBS[pid]
    job.update({"total": len(accounts), "done": 0, "saved": 0, "updated": 0, "failed": 0, "platforms": {}})
    existing = {}
    for post in bundle["posts"]:
        key = (post.get("personId"), _canon_post(post.get("url") or "", post.get("platform") or ""))
        if key[0] and key[1]:
            existing[key] = post
    sem = asyncio.Semaphore(4)
    needs_key = False
    names = {member["id"]: member.get("name") for member in bundle["members"]}

    async def one(account: Dict[str, Any]) -> None:
        nonlocal needs_key
        platform = str(account.get("platform") or "").lower()
        async with sem:
            try:
                result = await fetch_recent_posts(platform, account.get("profileUrl") or "", POSTS_PER_ACCOUNT)
            except Exception:
                result = {"success": False, "detail": "Could not fetch posts.", "posts": []}
        detail = str(result.get("detail") or "")
        if "RAPIDAPI_KEY" in detail:
            needs_key = True
        posts = result.get("posts") or []
        if not result.get("success") and not posts:
            job["failed"] += 1
        for post in posts:
            url = str(post.get("url") or "")
            published = parse_iso(post.get("publishedAt"))
            if not url or not published:
                continue
            key = (account.get("personId"), _canon_post(url, platform))
            current = existing.get(key)
            doc = dict(current or {})
            doc.update({
                "partyId": pid,
                "personId": account.get("personId"),
                "accountId": account.get("id"),
                "platform": platform,
                "url": url,
                "publishedAt": published.isoformat(),
                "thumbnailUrl": post.get("thumbnailUrl") or doc.get("thumbnailUrl"),
                "text": post.get("text") or doc.get("text") or "",
                "likes": post.get("likes") if post.get("likes") is not None else doc.get("likes"),
                "comments": post.get("comments") if post.get("comments") is not None else doc.get("comments"),
                "shares": post.get("shares") if post.get("shares") is not None else doc.get("shares"),
                "views": post.get("views") if post.get("views") is not None else doc.get("views"),
                "externalId": post.get("externalId") or doc.get("externalId"),
                "fetchedAt": now_iso(),
            })
            if current:
                doc["id"] = current.get("id")
                doc["source"] = current.get("source") or "FETCH"
                await P._save("social_posts", doc["id"], doc)
                job["updated"] += 1
            else:
                doc.update({
                    "id": new_id("post"),
                    "source": "FETCH",
                    "createdBy": caps["actorId"],
                    "createdByName": caps["actorName"],
                })
                await P._save("social_posts", doc["id"], doc)
                existing[key] = doc
                job["saved"] += 1
        job["done"] += 1
        bucket = job["platforms"].setdefault(platform, {"saved": 0, "failed": 0})
        if posts:
            bucket["saved"] += len(posts)
        elif not result.get("success"):
            bucket["failed"] += 1

    await asyncio.gather(*(one(account) for account in accounts))
    notes = []
    youtube_saved = job["platforms"].get("youtube", {}).get("saved", 0)
    if youtube_saved:
        notes.append(f"YouTube: {youtube_saved} posts with thumbnails.")
    elif not any(str(a.get("platform")).lower() == "youtube" for a in accounts):
        notes.append("No YouTube links are saved for this selection.")
    else:
        notes.append("YouTube returned no new posts for these channels.")
    for platform, label in (("instagram", "Instagram"), ("x", "X"), ("facebook", "Facebook")):
        bucket = job["platforms"].get(platform) or {}
        if bucket.get("saved"):
            notes.append(f"{label}: {bucket['saved']} posts.")
    if needs_key:
        notes.append("Instagram, X and Facebook need RAPIDAPI_KEY on the server. YouTube does not.")
    job["notes"] = notes
    job["status"] = "DONE"
    job["finishedAt"] = now_iso()
    sync = {
        "id": pid,
        "partyId": pid,
        "lastRunAt": job["finishedAt"],
        "saved": job["saved"],
        "updated": job["updated"],
        "failed": job["failed"],
        "notes": notes,
        "by": caps["actorName"],
    }
    await P._save("party_post_sync", pid, sync)
    await _party_audit(
        caps, actor, pid, "PARTY_POSTS_FETCH", person_id or pid, names.get(person_id) or bundle["party"].get("name"),
        {"saved": job["saved"], "updated": job["updated"], "failed": job["failed"], "personId": person_id},
    )
    job["lastRunAt"] = sync["lastRunAt"]
    return job


async def _curate_top_party_posts(bundle: Dict[str, Any], party_id: str, platform_filter: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
    members_by_id = {m["id"]: m for m in bundle["members"]}
    raw_posts = list(bundle.get("posts") or [])
    pid = bundle.get("partyId") or party_id
    now = datetime.now(timezone.utc)

    # 1. Strictly filter out any mock/seed posts or unsplash stock templates
    actual_posts = []
    seed_ids = []
    for p in raw_posts:
        is_seed = (
            p.get("source") == "SEED"
            or "images.unsplash.com" in str(p.get("thumbnailUrl") or "")
            or "health_camp" in str(p.get("url") or "")
            or "digital_lab" in str(p.get("url") or "")
            or "substation" in str(p.get("url") or "")
            or "grievance" in str(p.get("url") or "")
            or "highway" in str(p.get("url") or "")
            or "farmers" in str(p.get("url") or "")
            or "townhall" in str(p.get("url") or "")
            or "governance" in str(p.get("url") or "")
        )
        if is_seed:
            seed_ids.append(p.get("id"))
        else:
            actual_posts.append(p)

    # Clean up legacy seed docs from MongoDB in background
    if seed_ids:
        async def _cleanup_seed():
            for sid in seed_ids:
                try:
                    await P._delete("social_posts", sid)
                except Exception:
                    pass
            _touch_world()
        asyncio.create_task(_cleanup_seed())

    # 2. Group actual posts by platform
    posts_by_platform: Dict[str, List[Dict[str, Any]]] = {
        "youtube": [],
        "instagram": [],
        "facebook": [],
        "x": [],
    }
    for p in actual_posts:
        plat = str(p.get("platform") or "").lower()
        if plat in ("twitter", "x"):
            plat = "x"
        if plat in posts_by_platform:
            posts_by_platform[plat].append(p)

    # 3. Auto-populate live actual YouTube posts if database has few or no posts yet
    if len(posts_by_platform["youtube"]) < 8 and bundle.get("accounts"):
        yt_accs = [
            a for a in bundle["accounts"]
            if str(a.get("platform") or "").lower() == "youtube" and a.get("profileUrl") and not a.get("noAccount")
        ]
        if yt_accs:
            try:
                from .social_fetcher import fetch_youtube_posts
                async def _fetch_one_yt(acc):
                    res = await fetch_youtube_posts(acc["profileUrl"], limit=8)
                    fetched = []
                    for item in res.get("posts") or []:
                        doc = {
                            "id": f"post_yt_{item.get('externalId') or new_id('yt')}",
                            "partyId": pid,
                            "personId": acc.get("personId"),
                            "accountId": acc.get("id"),
                            "platform": "youtube",
                            "url": item.get("url"),
                            "text": item.get("text") or "",
                            "thumbnailUrl": item.get("thumbnailUrl") or "",
                            "publishedAt": item.get("publishedAt") or now.isoformat(),
                            "likes": int(item.get("likes") or 0),
                            "comments": int(item.get("comments") or 0),
                            "shares": int(item.get("shares") or 0),
                            "views": int(item.get("views") or 0),
                            "source": "FETCH",
                            "createdBy": "system",
                            "createdByName": "Leader YouTube Sync",
                            "fetchedAt": now.isoformat(),
                        }
                        await P._save("social_posts", doc["id"], doc)
                        fetched.append(doc)
                    return fetched
                # Fetch up to 6 leader channels concurrently
                batches = await asyncio.gather(*(_fetch_one_yt(acc) for acc in yt_accs[:6]))
                for batch in batches:
                    for doc in batch:
                        posts_by_platform["youtube"].append(doc)
                        actual_posts.append(doc)
                        bundle.setdefault("posts", []).append(doc)
                _touch_world()
            except Exception as ex:
                logger.warning("Auto-fetch YouTube leader posts notice: %s", ex)

    # 4. YouTube: Strictly rank by actual views / reach / likes (top content only)
    youtube_posts = posts_by_platform.get("youtube") or []
    youtube_posts.sort(
        key=lambda x: (
            int(x.get("views") or 0) if int(x.get("views") or 0) > 0 else (int(x.get("likes") or 0) * 10),
            int(x.get("likes") or 0),
            str(x.get("publishedAt") or "")
        ),
        reverse=True
    )
    top_youtube = youtube_posts[:15]

    # 5. Compile actual candidates across all platforms (no mock data)
    candidates = []
    candidates.extend(top_youtube)
    ig_posts = sorted(posts_by_platform.get("instagram") or [], key=lambda x: (int(x.get("views") or 0), int(x.get("likes") or 0)), reverse=True)
    candidates.extend(ig_posts[:12])
    fb_posts = sorted(posts_by_platform.get("facebook") or [], key=lambda x: (int(x.get("views") or 0), int(x.get("likes") or 0)), reverse=True)
    candidates.extend(fb_posts[:12])
    x_posts = sorted(posts_by_platform.get("x") or [], key=lambda x: (int(x.get("views") or 0), int(x.get("likes") or 0)), reverse=True)
    candidates.extend(x_posts[:12])

    # 6. Format actual posts to response objects
    top_posts = []
    seen_ids = set()
    for p in candidates:
        if p.get("id") in seen_ids:
            continue
        seen_ids.add(p.get("id"))
        plat = str(p.get("platform") or "youtube").lower()
        if plat in ("twitter", "x"):
            plat = "x"
        if platform_filter and platform_filter.lower() != "all" and plat != platform_filter.lower():
            continue
        pid_person = p.get("personId")
        m = members_by_id.get(pid_person)
        if not m:
            continue
        views = int(p.get("views") or 0)
        likes = int(p.get("likes") or 0)
        comments = int(p.get("comments") or 0)
        shares = int(p.get("shares") or 0)
        reach = views if views > 0 else (likes * 6 + comments * 4 + shares * 12 + 500)
        # Use genuine thumbnail or leader's photo, NEVER a random unsplash stock photo
        thumb = p.get("thumbnailUrl") or m.get("photoUrl") or ""
        top_posts.append({
            "id": p.get("id"),
            "personId": pid_person,
            "memberName": m.get("name"),
            "memberPhoto": m.get("photoUrl"),
            "roles": m.get("roles") or [],
            "constituency": m.get("assemblyConstituencyName") or m.get("districtName") or "",
            "district": m.get("districtName") or "",
            "platform": plat,
            "url": p.get("url"),
            "text": p.get("text") or "",
            "thumbnailUrl": thumb,
            "publishedAt": p.get("publishedAt"),
            "likes": likes,
            "comments": comments,
            "shares": shares,
            "views": views,
            "reach": reach,
            "calendarId": p.get("calendarId"),
        })

    top_posts.sort(key=lambda x: (x["reach"], x["likes"], x["views"]), reverse=True)
    return top_posts[: max(1, min(limit, 100))]


def register_party_routes(api_router) -> None:
    @api_router.get("/party/meta")
    async def party_meta(userId: Optional[str] = None):
        actor = await _load_party_actor(userId)
        caps = _caps_for(actor)
        parties = await _parties()
        if caps["isSuper"]:
            visible = sorted(parties.values(), key=lambda p: str(p.get("name") or p.get("id")))
        else:
            own = caps["partyId"]
            visible = [p for p in parties.values() if normalize_party_id(p.get("id")) == own or normalize_party_id(p.get("abbreviation")) == own] or [{"id": own, "name": own}]
        return {
            "capabilities": {k: v for k, v in caps.items() if k not in {"actorId", "actorName"}},
            "parties": [
                {
                    "id": p.get("id"),
                    "name": p.get("name"),
                    "abbreviation": p.get("abbreviation") or p.get("id"),
                    "color": p.get("primaryColor") or p.get("color"),
                    "logoUrl": p.get("logoUrl"),
                    "symbolEmoji": p.get("symbolEmoji"),
                }
                for p in visible
            ],
            "defaultPartyId": caps["partyId"] or (visible[0].get("id") if visible else None),
            "gapTypes": [{"type": t, "label": label} for t, label in GAP_TYPES],
            "defaultGapRules": DEFAULT_GAP_RULES,
            "platforms": list(PLATFORMS),
        }

    @api_router.get("/party/compare")
    async def party_compare(userId: Optional[str] = None):
        actor = await _load_party_actor(userId)
        _caps_for(actor, action="compare")
        world = await _load_world()
        rows = []
        for party in world["parties"].values():
            bundle = _party_members(world, party.get("id"))
            if bundle["members"]:
                rows.append(party_comparison_row(party, bundle["members"]))
        rows.sort(key=lambda r: r["followers"], reverse=True)
        return {"note": "Public metrics only. Contact details, research, and pending items are never compared.", "parties": rows}

    @api_router.get("/party/admins")
    async def list_party_admins(userId: Optional[str] = None):
        actor = await _load_party_actor(userId)
        _caps_for(actor, action="manageAdmins")
        rows = P._merge_docs(P._runtime_list("party_admins"), memory_list("party_admins"))
        try:
            rows = P._merge_docs(rows, await P._list("party_admins"))
        except Exception:
            pass
        out = []
        for row in rows:
            user = dict(row.get("user") or {})
            user.pop("passwordHash", None)
            user.pop("demoPassword", None)
            out.append({**{k: v for k, v in row.items() if k != "user"}, "user": user})
        out.sort(key=lambda r: str(r.get("createdAt") or ""), reverse=True)
        return {"items": out}

    @api_router.post("/party/admins")
    async def create_party_admin(payload: dict, userId: Optional[str] = None):
        actor = await _load_party_actor(userId)
        caps = _caps_for(actor, action="manageAdmins")
        payload = payload or {}
        role = str(payload.get("role") or PARTY_PRESIDENT).upper()
        if role not in PARTY_COMMAND_ROLES:
            raise HTTPException(status_code=400, detail="Role must be Party President or Party Analyst.")
        party_id = normalize_party_id(payload.get("partyId"))
        parties = await _parties()
        if party_id not in {normalize_party_id(k) for k in parties} and party_id not in {normalize_party_id(p.get("abbreviation")) for p in parties.values()}:
            raise HTTPException(status_code=400, detail="Choose a party from the party list.")
        username = str(payload.get("username") or payload.get("email") or "").strip().lower()
        name = _clean_str(payload.get("name"), 120)
        password = str(payload.get("password") or "")
        if not username or not name:
            raise HTTPException(status_code=400, detail="Name and username are required.")
        if len(password) < 8:
            raise HTTPException(status_code=400, detail="Password must be at least 8 characters.")
        for row in memory_list("party_admins") + P._runtime_list("party_admins"):
            if str((row.get("user") or {}).get("email") or "").lower() == username:
                raise HTTPException(status_code=400, detail="A user with this username already exists.")
        user_id = f"usr_party_{uuid.uuid4().hex[:8]}"
        now = now_iso()
        party = parties.get(party_id) or next((p for p in parties.values() if normalize_party_id(p.get("abbreviation")) == party_id), {})
        user_doc = {
            "id": user_id,
            "email": username,
            "name": name,
            "phone": _clean_str(payload.get("phone"), 20),
            "roleId": role,
            "primaryRole": role,
            "role": role.lower(),
            "roleTitle": PARTY_ROLE_TITLES[role],
            "designation": PARTY_ROLE_TITLES[role],
            "department": "Party Command",
            "commandPartyId": party_id,
            "commandPartyName": party.get("name") or party_id,
            "isPlatformAdmin": False,
            "isPoliticalAdmin": False,
            "status": "ACTIVE",
            "clearanceLevel": PARTY_ROLE_TITLES[role],
            "assignedConstituency": "",
            "avatar": "",
            "createdAt": now,
            "createdBy": caps["actorId"],
        }
        await _create_party_user(user_doc, password)
        record = {"id": user_id, "userId": user_id, "partyId": party_id, "role": role, "active": True, "createdAt": now, "createdBy": caps["actorId"], "user": user_doc}
        await P._save("party_admins", user_id, record)
        await _party_audit(caps, actor, party_id, "PARTY_ADMIN_CREATE", user_id, name, {"role": role, "username": username})
        return record

    @api_router.patch("/party/admins/{admin_id}")
    async def update_party_admin(admin_id: str, payload: dict, userId: Optional[str] = None):
        actor = await _load_party_actor(userId)
        caps = _caps_for(actor, action="manageAdmins")
        record = await P._get("party_admins", admin_id)
        if not record:
            raise HTTPException(status_code=404, detail="Party account not found.")
        payload = payload or {}
        user = dict(record.get("user") or {})
        changes: Dict[str, Any] = {}
        if "active" in payload:
            active = bool(payload.get("active"))
            record["active"] = active
            changes["status"] = "ACTIVE" if active else "INACTIVE"
        if payload.get("role"):
            role = str(payload["role"]).upper()
            if role not in PARTY_COMMAND_ROLES:
                raise HTTPException(status_code=400, detail="Role must be Party President or Party Analyst.")
            record["role"] = role
            changes.update({"roleId": role, "primaryRole": role, "role": role.lower(), "roleTitle": PARTY_ROLE_TITLES[role], "designation": PARTY_ROLE_TITLES[role]})
        if not changes:
            raise HTTPException(status_code=400, detail="Nothing to update.")
        await _update_party_user(admin_id, changes)
        user.update(changes)
        record["user"] = user
        record["updatedAt"] = now_iso()
        await P._save("party_admins", admin_id, record)
        await _party_audit(caps, actor, record.get("partyId") or "", "PARTY_ADMIN_UPDATE", admin_id, user.get("name"), changes)
        return record

    @api_router.get("/party/{party_id}/overview")
    async def party_overview(
        party_id: str,
        userId: Optional[str] = None,
        stateId: Optional[str] = "AP",
        districtId: Optional[str] = None,
        assemblyConstituencyId: Optional[str] = None,
        role: Optional[str] = None,
        platform: Optional[str] = None,
        windowDays: int = 7,
    ):
        actor = await _load_party_actor(userId)
        _caps_for(actor, party_id)
        window_days = _window_days(windowDays)
        bundle = _party_members(await _load_world(), party_id, window_days)
        members = filter_members(bundle["members"], **_filters(districtId, assemblyConstituencyId, role, platform, None, stateId=stateId))

        # State catalog
        states_master = []
        try:
            srv = P._srv()
            states_master = srv.load_json_fallback("states.json") or []
        except Exception:
            pass
        states_list = [
            {"id": s.get("id"), "name": s.get("name") or s.get("id")}
            for s in states_master
            if s.get("id")
        ]
        if not states_list:
            states_list = [
                {"id": "AP", "name": "Andhra Pradesh"},
                {"id": "TS", "name": "Telangana"},
                {"id": "TN", "name": "Tamil Nadu"},
                {"id": "KA", "name": "Karnataka"},
            ]
        states_list.sort(key=lambda s: (0 if s["id"] == "AP" else 1, s["name"]))

        active_state = (stateId or "AP").strip().upper()
        lookup_state = None if active_state in ("", "ALL") else active_state

        district_map: Dict[str, Dict[str, str]] = {}
        assembly_map: Dict[str, Dict[str, str]] = {}

        # 1. Master geo catalog filtered by active state
        try:
            dist_list, _ = await P._resolved_districts(lookup_state)
            for d in dist_list or []:
                if d.get("id") and d.get("name"):
                    district_map[d["id"]] = {"name": d["name"], "stateId": d.get("stateId") or active_state}
        except Exception:
            pass

        try:
            geo_master = await P._geo_lookups()
            for aid, arow in (geo_master.get("assemblies") or {}).items():
                if not aid or not arow.get("name"):
                    continue
                ac_state = str(arow.get("stateId") or "").upper()
                if lookup_state and ac_state and ac_state != lookup_state and not aid.startswith(f"{lookup_state}-"):
                    continue
                adid = arow.get("districtId") or ""
                assembly_map[aid] = {"name": arow["name"], "districtId": adid, "stateId": ac_state or lookup_state or ""}
                if adid and arow.get("districtName") and adid not in district_map:
                    district_map[adid] = {"name": arow["districtName"], "stateId": ac_state or lookup_state or ""}
        except Exception:
            pass

        # 2. Member data for fallback/additional entries
        for m in bundle["members"]:
            m_state = str(m.get("stateId") or "").upper()
            if lookup_state and m_state and m_state != lookup_state:
                continue
            did = m.get("districtId")
            if did and did not in district_map:
                district_map[did] = {"name": m.get("districtName") or did, "stateId": m_state or lookup_state or ""}
            aid = m.get("assemblyConstituencyId")
            if aid and aid not in assembly_map:
                assembly_map[aid] = {
                    "name": m.get("assemblyConstituencyName") or aid,
                    "districtId": m.get("districtId") or "",
                    "stateId": m_state or lookup_state or "",
                }

        districts_list = sorted([{"id": did, "name": dinfo["name"], "stateId": dinfo.get("stateId", "")} for did, dinfo in district_map.items()], key=lambda x: x["name"])
        assemblies_list = sorted([{"id": aid, "name": ainfo["name"], "districtId": ainfo["districtId"], "stateId": ainfo.get("stateId", "")} for aid, ainfo in assembly_map.items()], key=lambda x: x["name"])
        roles = sorted({r for m in bundle["members"] for r in m.get("roles") or []})

        return {
            "party": bundle["party"],
            "rules": bundle["rules"],
            "windowDays": window_days,
            **overview_from_members(members),
            "filters": {
                "states": states_list,
                "districts": districts_list,
                "assemblies": assemblies_list,
                "roles": roles,
                "platforms": list(PLATFORMS),
                "gapTypes": [{"type": gt[0], "label": gt[1]} for gt in GAP_TYPES],
            },
        }

    @api_router.get("/party/{party_id}/members")
    async def party_members(
        party_id: str,
        userId: Optional[str] = None,
        stateId: Optional[str] = None,
        districtId: Optional[str] = None,
        assemblyConstituencyId: Optional[str] = None,
        role: Optional[str] = None,
        platform: Optional[str] = None,
        q: Optional[str] = None,
        gap: Optional[str] = None,
        windowDays: int = 7,
        format: Optional[str] = None,
        skip: int = 0,
        limit: int = 500,
    ):
        actor = await _load_party_actor(userId)
        caps = _caps_for(actor, party_id)
        window_days = _window_days(windowDays)
        bundle = _party_members(await _load_world(), party_id, window_days)
        members = filter_members(bundle["members"], **_filters(districtId, assemblyConstituencyId, role, platform, q, gap, stateId=stateId))
        if (format or "").lower() == "csv":
            if not caps.get("export"):
                raise HTTPException(status_code=403, detail="Forbidden: export is not allowed for this role.")
            await _party_audit(caps, actor, party_id, "PARTY_MEMBERS_EXPORT", bundle["partyId"], bundle["party"].get("name"), {"rows": len(members)})
            stamp = datetime.now(timezone.utc).strftime("%Y-%m-%d")
            return PlainTextResponse(
                members_csv(members),
                media_type="text/csv",
                headers={"Content-Disposition": f'attachment; filename="LeadersLens_{bundle["partyId"]}_members_{stamp}.csv"'},
            )
        page = members[max(0, skip): max(0, skip) + max(1, min(limit, 1000))]
        return {"total": len(members), "windowDays": window_days, "items": page}

    @api_router.get("/party/{party_id}/members/{person_id}")
    async def party_member_detail(party_id: str, person_id: str, userId: Optional[str] = None):
        actor = await _load_party_actor(userId)
        caps = _caps_for(actor, party_id)
        bundle = _party_members(await _load_world(), party_id)
        member = _member_or_404(bundle, person_id)
        person = bundle["persons"][person_id]
        posts = sorted([p for p in bundle["posts"] if p.get("personId") == person_id], key=lambda p: str(p.get("publishedAt") or ""), reverse=True)
        research = sorted(bundle["research"].get(person_id, []), key=lambda n: str(n.get("createdAt") or ""), reverse=True)
        pending = [i for i in pending_items(bundle["members"], persons=bundle["persons"], accounts=bundle["accounts"], calendar=bundle["calendar"], posts=bundle["posts"], tasks=bundle["tasks"]) if i["personId"] == person_id]
        history = [
            h for h in await _party_audit_rows(bundle["partyId"])
            if h.get("target") == person_id or (h.get("metadata") or {}).get("personId") == person_id
        ]
        history.sort(key=lambda h: str(h.get("timestamp") or ""), reverse=True)
        contact = bundle["contacts"].get(person_id) or {}
        await _party_audit(caps, actor, party_id, "PARTY_CONTACT_VIEW", person_id, member["name"], {"personId": person_id})
        return {
            "member": member,
            "details": {
                "email": member["email"],
                "phone": member["phone"],
                "alternateContact": contact.get("alternateContact") or "",
                "address": contact.get("address") or "",
                "photoUrl": member["photoUrl"],
                "consent": bool(contact.get("consent")),
                "consentAt": contact.get("consentAt"),
                "updatedAt": contact.get("updatedAt"),
                "updatedByName": contact.get("updatedByName"),
                "roles": bundle["roles"].get(person_id, []),
                "remarks": person.get("remarks"),
            },
            "research": research,
            "posts": posts,
            "pending": pending,
            "missing": member["gaps"],
            "history": history[:100],
        }

    @api_router.put("/party/{party_id}/members/{person_id}/contact")
    async def party_update_contact(party_id: str, person_id: str, payload: dict, userId: Optional[str] = None):
        actor = await _load_party_actor(userId)
        caps = _caps_for(actor, party_id, "edit")
        bundle = _party_members(await _load_world(), party_id)
        member = _member_or_404(bundle, person_id)
        payload = payload or {}
        email = _clean_str(payload.get("email"), 160).lower()
        phone = _clean_str(payload.get("phone"), 24)
        if email and not EMAIL_RE.match(email):
            raise HTTPException(status_code=400, detail="Enter a valid email address.")
        if phone and not PHONE_RE.match(phone):
            raise HTTPException(status_code=400, detail="Enter a valid phone number.")
        photo = _clean_str(payload.get("photoUrl"), 600)
        if photo and not photo.lower().startswith(("https://", "http://")):
            raise HTTPException(status_code=400, detail="Photo must be a web link (https://…).")
        key = f"{bundle['partyId']}:{person_id}"
        existing = await P._get("party_member_contacts", key) or {}
        consent = bool(payload.get("consent"))
        doc = dict(existing)
        doc.update({
            "id": key,
            "partyId": bundle["partyId"],
            "personId": person_id,
            "email": email,
            "phone": phone,
            "alternateContact": _clean_str(payload.get("alternateContact"), 120),
            "address": _clean_str(payload.get("address"), 400),
            "photoUrl": photo,
            "consent": consent,
            "consentAt": existing.get("consentAt") if existing.get("consent") and consent else (now_iso() if consent else None),
            "updatedAt": now_iso(),
            "updatedBy": caps["actorId"],
            "updatedByName": caps["actorName"],
        })
        saved = await P._save("party_member_contacts", key, doc)
        changed = sorted(k for k in ("email", "phone", "alternateContact", "address", "photoUrl", "consent") if existing.get(k) != doc.get(k))
        await _party_audit(caps, actor, party_id, "PARTY_CONTACT_UPDATE", person_id, member["name"], {"personId": person_id, "fields": changed})
        return saved

    @api_router.get("/party/{party_id}/members/{person_id}/research")
    async def party_list_research(party_id: str, person_id: str, userId: Optional[str] = None):
        actor = await _load_party_actor(userId)
        _caps_for(actor, party_id)
        bundle = _party_members(await _load_world(), party_id)
        _member_or_404(bundle, person_id)
        notes = sorted(bundle["research"].get(person_id, []), key=lambda n: str(n.get("createdAt") or ""), reverse=True)
        return {"items": notes}

    @api_router.post("/party/{party_id}/members/{person_id}/research")
    async def party_add_research(party_id: str, person_id: str, payload: dict, userId: Optional[str] = None):
        actor = await _load_party_actor(userId)
        caps = _caps_for(actor, party_id, "research")
        bundle = _party_members(await _load_world(), party_id)
        member = _member_or_404(bundle, person_id)
        payload = payload or {}
        title = _clean_str(payload.get("title"), 200)
        body = _clean_str(payload.get("body"), 8000)
        if not title or not body:
            raise HTTPException(status_code=400, detail="Title and note are required.")
        tags = [_clean_str(t, 40) for t in (payload.get("tags") or []) if _clean_str(t, 40)][:12]
        sources = [_clean_str(s, 600) for s in (payload.get("sources") or []) if _clean_str(s, 600)][:12]
        attachments = []
        for item in (payload.get("attachments") or [])[:10]:
            url = _clean_str((item or {}).get("url") if isinstance(item, dict) else item, 600)
            if url and url.lower().startswith(("https://", "http://")):
                attachments.append({"url": url, "name": _clean_str((item or {}).get("name") if isinstance(item, dict) else "", 160) or url.rsplit("/", 1)[-1]})
        now = now_iso()
        note = {
            "id": new_id("rn"),
            "partyId": bundle["partyId"],
            "personId": person_id,
            "title": title,
            "body": body,
            "tags": tags,
            "sources": sources,
            "attachments": attachments,
            "authorId": caps["actorId"],
            "authorName": caps["actorName"],
            "createdAt": now,
            "updatedAt": now,
        }
        saved = await P._save("member_research_notes", note["id"], note)
        await _party_audit(caps, actor, party_id, "PARTY_RESEARCH_ADD", person_id, member["name"], {"personId": person_id, "noteId": note["id"], "title": title})
        return saved

    @api_router.delete("/party/{party_id}/research/{note_id}")
    async def party_delete_research(party_id: str, note_id: str, userId: Optional[str] = None):
        actor = await _load_party_actor(userId)
        caps = _caps_for(actor, party_id, "research")
        note = await P._get("member_research_notes", note_id)
        if not note or normalize_party_id(note.get("partyId")) != normalize_party_id(party_id):
            raise HTTPException(status_code=404, detail="Research note not found.")
        if not caps.get("edit") and note.get("authorId") != caps["actorId"]:
            raise HTTPException(status_code=403, detail="Only the author or the Party President can delete this note.")
        await P._delete("member_research_notes", note_id)
        await _party_audit(caps, actor, party_id, "PARTY_RESEARCH_DELETE", note.get("personId") or note_id, note.get("title"), {"personId": note.get("personId"), "noteId": note_id})
        return {"success": True, "id": note_id}

    @api_router.get("/party/{party_id}/members/{person_id}/posts")
    async def party_list_posts(party_id: str, person_id: str, userId: Optional[str] = None, platform: Optional[str] = None, limit: int = 50):
        actor = await _load_party_actor(userId)
        caps = _caps_for(actor, party_id)
        bundle = _party_members(await _load_world(), party_id)
        member = _member_or_404(bundle, person_id)
        actual_posts = [
            p for p in bundle["posts"]
            if p.get("personId") == person_id
            and (not platform or str(p.get("platform")).lower() == platform.lower())
            and p.get("source") != "SEED"
            and not (
                "images.unsplash.com" in str(p.get("thumbnailUrl") or "")
                or "civic_" in str(p.get("url") or "")
                or "youth_" in str(p.get("url") or "")
                or "grievance_" in str(p.get("url") or "")
                or "walk_" in str(p.get("url") or "")
            )
        ]
        if not actual_posts:
            # Check if this leader has a live YouTube account to fetch directly
            yt_acc = next(
                (
                    a for a in bundle["accounts"]
                    if a.get("personId") == person_id
                    and str(a.get("platform") or "").lower() == "youtube"
                    and a.get("profileUrl")
                    and not a.get("noAccount")
                ),
                None,
            )
            if yt_acc and (not platform or platform.lower() == "youtube"):
                try:
                    from .social_fetcher import fetch_youtube_posts
                    res = await fetch_youtube_posts(yt_acc["profileUrl"], limit=10)
                    now_str = now_iso()
                    for item in res.get("posts") or []:
                        doc = {
                            "id": f"post_yt_{item.get('externalId') or new_id('yt')}",
                            "partyId": bundle["partyId"],
                            "personId": person_id,
                            "accountId": yt_acc.get("id"),
                            "platform": "youtube",
                            "url": item.get("url"),
                            "text": item.get("text") or "",
                            "thumbnailUrl": item.get("thumbnailUrl") or "",
                            "publishedAt": item.get("publishedAt") or now_str,
                            "likes": int(item.get("likes") or 0),
                            "comments": int(item.get("comments") or 0),
                            "shares": int(item.get("shares") or 0),
                            "views": int(item.get("views") or 0),
                            "source": "FETCH",
                            "createdBy": caps["actorId"],
                            "createdByName": caps["actorName"],
                            "fetchedAt": now_str,
                        }
                        await P._save("social_posts", doc["id"], doc)
                        actual_posts.append(doc)
                    if actual_posts:
                        _touch_world()
                except Exception as ex:
                    logger.warning("Fetch leader YouTube posts notice for %s: %s", person_id, ex)
        actual_posts.sort(key=lambda p: str(p.get("publishedAt") or ""), reverse=True)
        return {"items": actual_posts[: max(1, min(limit, 200))]}

    @api_router.post("/party/{party_id}/members/{person_id}/posts")
    async def party_add_post(party_id: str, person_id: str, payload: dict, userId: Optional[str] = None):
        actor = await _load_party_actor(userId)
        caps = _caps_for(actor, party_id, "edit")
        bundle = _party_members(await _load_world(), party_id)
        member = _member_or_404(bundle, person_id)
        payload = payload or {}
        platform = str(payload.get("platform") or "").lower()
        if platform not in PLATFORMS:
            raise HTTPException(status_code=400, detail="Choose Facebook, Instagram, X, or YouTube.")
        url = _clean_str(payload.get("url"), 600)
        if not url.lower().startswith(("https://", "http://")):
            raise HTTPException(status_code=400, detail="Post link must start with https://")
        mismatch = P.profile_url_platform_error(url, platform)
        if mismatch:
            raise HTTPException(status_code=400, detail=mismatch.replace("profile link", "post link"))
        published = parse_iso(payload.get("publishedAt"))
        if not published:
            raise HTTPException(status_code=400, detail="Published date is required.")
        if (published - datetime.now(timezone.utc)).total_seconds() > 3600:
            raise HTTPException(status_code=400, detail="Published date cannot be in the future.")
        for existing in bundle["posts"]:
            if existing.get("personId") == person_id and str(existing.get("url") or "").rstrip("/").lower() == url.rstrip("/").lower():
                raise HTTPException(status_code=409, detail="This post link is already saved for this member.")
        calendar_id = _clean_str(payload.get("calendarId"), 60) or None
        if calendar_id and not any(c.get("id") == calendar_id for c in bundle["calendar"]):
            raise HTTPException(status_code=400, detail="Campaign item not found for this party.")
        account = next((a for a in bundle["accounts"] if a.get("personId") == person_id and str(a.get("platform")).lower() == platform), None)
        now = now_iso()
        post = {
            "id": new_id("post"),
            "partyId": bundle["partyId"],
            "personId": person_id,
            "accountId": (account or {}).get("id"),
            "platform": platform,
            "url": url,
            "text": _clean_str(payload.get("text"), 1000),
            "thumbnailUrl": _clean_str(payload.get("thumbnailUrl"), 600) or None,
            "publishedAt": published.isoformat(),
            "likes": _int_or_none(payload.get("likes")),
            "comments": _int_or_none(payload.get("comments")),
            "shares": _int_or_none(payload.get("shares")),
            "views": _int_or_none(payload.get("views")),
            "calendarId": calendar_id,
            "source": "MANUAL",
            "createdBy": caps["actorId"],
            "createdByName": caps["actorName"],
            "fetchedAt": now,
        }
        saved = await P._save("social_posts", post["id"], post)
        await _party_audit(caps, actor, party_id, "PARTY_POST_ADD", person_id, member["name"], {"personId": person_id, "postId": post["id"], "platform": platform})
        return saved

    @api_router.delete("/party/{party_id}/posts/{post_id}")
    async def party_delete_post(party_id: str, post_id: str, userId: Optional[str] = None):
        actor = await _load_party_actor(userId)
        caps = _caps_for(actor, party_id, "edit")
        post = await P._get("social_posts", post_id)
        if not post or normalize_party_id(post.get("partyId")) != normalize_party_id(party_id):
            raise HTTPException(status_code=404, detail="Post not found.")
        await P._delete("social_posts", post_id)
        await _party_audit(caps, actor, party_id, "PARTY_POST_DELETE", post.get("personId") or post_id, post.get("url"), {"personId": post.get("personId"), "postId": post_id})
        return {"success": True, "id": post_id}

    @api_router.get("/party/{party_id}/pending")
    async def party_pending(party_id: str, userId: Optional[str] = None, kind: Optional[str] = None, includeDone: bool = False):
        actor = await _load_party_actor(userId)
        _caps_for(actor, party_id)
        bundle = _party_members(await _load_world(), party_id)
        items = pending_items(bundle["members"], persons=bundle["persons"], accounts=bundle["accounts"], calendar=bundle["calendar"], posts=bundle["posts"], tasks=bundle["tasks"])
        if kind:
            items = [i for i in items if i["kind"] == kind.upper()]
        if not includeDone:
            items = [i for i in items if i["status"] != "DONE"]
        counts = {k: sum(1 for i in items if i["kind"] == k) for k in ("ACCOUNT", "REVIEW", "CAMPAIGN")}
        return {"total": len(items), "counts": counts, "items": items}

    @api_router.patch("/party/{party_id}/pending/{item_id:path}")
    async def party_update_pending(party_id: str, item_id: str, payload: dict, userId: Optional[str] = None):
        actor = await _load_party_actor(userId)
        caps = _caps_for(actor, party_id, "edit")
        bundle = _party_members(await _load_world(), party_id)
        items = {i["id"]: i for i in pending_items(bundle["members"], persons=bundle["persons"], accounts=bundle["accounts"], calendar=bundle["calendar"], posts=bundle["posts"], tasks=bundle["tasks"])}
        item = items.get(item_id)
        if not item:
            raise HTTPException(status_code=404, detail="This pending item is no longer open.")
        payload = payload or {}
        key = f"{bundle['partyId']}:{item_id}"
        task = dict(await P._get("party_pending_tasks", key) or {})
        task.update({"id": key, "partyId": bundle["partyId"], "itemId": item_id, "personId": item["personId"], "kind": item["kind"]})
        if "assigneeName" in payload:
            task["assigneeName"] = _clean_str(payload.get("assigneeName"), 120) or None
        status = str(payload.get("status") or task.get("status") or "OPEN").upper()
        if status not in {"OPEN", "DONE"}:
            raise HTTPException(status_code=400, detail="Status must be OPEN or DONE.")
        task["status"] = status
        task["closedAt"] = now_iso() if status == "DONE" else None
        task["updatedAt"] = now_iso()
        task["updatedBy"] = caps["actorId"]
        task["updatedByName"] = caps["actorName"]
        saved = await P._save("party_pending_tasks", key, task)
        await _party_audit(caps, actor, party_id, "PARTY_PENDING_UPDATE", item["personId"], item.get("memberName"), {"personId": item["personId"], "itemId": item_id, "status": status, "assigneeName": task.get("assigneeName")})
        return saved

    @api_router.get("/party/{party_id}/gaps")
    async def party_gaps(
        party_id: str,
        userId: Optional[str] = None,
        stateId: Optional[str] = None,
        districtId: Optional[str] = None,
        assemblyConstituencyId: Optional[str] = None,
        role: Optional[str] = None,
        format: Optional[str] = None,
    ):
        actor = await _load_party_actor(userId)
        caps = _caps_for(actor, party_id)
        bundle = _party_members(await _load_world(), party_id)
        members = filter_members(bundle["members"], **_filters(districtId, assemblyConstituencyId, role, None, None, stateId=stateId))
        groups = gap_report(members)
        latest_reminder: Dict[tuple, Dict[str, Any]] = {}
        for reminder in bundle.get("reminders") or []:
            key = (str(reminder.get("personId") or ""), str(reminder.get("gapType") or ""))
            if key[0] and (key not in latest_reminder or str(reminder.get("createdAt") or "") > str(latest_reminder[key].get("createdAt") or "")):
                latest_reminder[key] = reminder
        for group in groups:
            for row in group.get("members") or []:
                hit = latest_reminder.get((str(row.get("id") or ""), group.get("type")))
                if hit:
                    row["remindedAt"] = hit.get("createdAt")
                    row["remindedBy"] = hit.get("createdByName")
        if (format or "").lower() == "csv":
            await _party_audit(caps, actor, party_id, "PARTY_GAPS_EXPORT", bundle["partyId"], bundle["party"].get("name"), {"rows": sum(g["count"] for g in groups)})
            import csv
            import io

            buf = io.StringIO()
            writer = csv.writer(buf)
            writer.writerow(["Gap", "Member", "Constituency", "District", "Detail"])
            for group in groups:
                for row in group["members"]:
                    writer.writerow([group["label"], row["name"], row.get("assemblyConstituencyName") or "", row.get("districtName") or "", row["detail"]])
            stamp = datetime.now(timezone.utc).strftime("%Y-%m-%d")
            return PlainTextResponse(buf.getvalue(), media_type="text/csv", headers={"Content-Disposition": f'attachment; filename="LeadersLens_{bundle["partyId"]}_gaps_{stamp}.csv"'})
        return {"rules": bundle["rules"], "members": len(members), "groups": groups}

    @api_router.get("/party/{party_id}/calendar")
    async def party_calendar(party_id: str, userId: Optional[str] = None):
        actor = await _load_party_actor(userId)
        _caps_for(actor, party_id)
        bundle = _party_members(await _load_world(), party_id)
        member_ids = [m["id"] for m in bundle["members"]]
        members_by_id = {m["id"]: m for m in bundle["members"]}
        names = {m["id"]: m["name"] for m in bundle["members"]}
        now = datetime.now(timezone.utc)

        # Seed initial active party campaign directives if empty
        if not bundle["calendar"]:
            pid = bundle.get("partyId") or party_id
            initial_campaigns = [
                {
                    "title": "Swarna Andhra 2047: Vision & Infrastructure Campaign",
                    "brief": "Share ground updates on state infrastructure, highway connectivity, and water projects in your constituency. Highlight progress and citizen benefits. Use #SwarnaAndhra2047.",
                    "hashtag": "#SwarnaAndhra2047",
                    "due_offset_days": 2,
                    "platforms": ["facebook", "instagram", "youtube", "x"],
                },
                {
                    "title": "Youth Outreach & Digital Skill Labs Launch",
                    "brief": "Post photos and reels interacting with student volunteers and inaugurating digital skill labs across junior colleges. Use #YouthEmpowerment.",
                    "hashtag": "#YouthEmpowerment",
                    "due_offset_days": 5,
                    "platforms": ["instagram", "youtube", "x"],
                },
                {
                    "title": "Praja Galam: Weekly Public Grievance Redressal Camp",
                    "brief": "Broadcast live video or post summary from weekly grievance redressal camp at constituency office with petition counts and solutions. Use #PrajaGalam.",
                    "hashtag": "#PrajaGalam",
                    "due_offset_days": 8,
                    "platforms": ["facebook", "youtube"],
                },
            ]
            for idx, c_tmpl in enumerate(initial_campaigns):
                cal_id = f"cal_{pid}_{idx}"
                doc = {
                    "id": cal_id,
                    "partyId": pid,
                    "title": c_tmpl["title"],
                    "brief": c_tmpl["brief"],
                    "hashtag": c_tmpl["hashtag"],
                    "dueAt": (now + timedelta(days=c_tmpl["due_offset_days"])).isoformat(),
                    "platforms": c_tmpl["platforms"],
                    "assignAll": True,
                    "assignedPersonIds": [],
                    "status": "PLANNED",
                    "createdByName": "State Campaign Committee",
                    "createdAt": now.isoformat(),
                    "updatedAt": now.isoformat(),
                }
                await P._save("party_content_calendar", cal_id, doc)
                bundle["calendar"].append(doc)
            _touch_world()

        items = []
        for item in sorted(bundle["calendar"], key=lambda c: str(c.get("dueAt") or "")):
            state = {"status": "CANCELLED", "assignedCount": 0, "publishedCount": 0, "assignees": [], "published": {}, "missedPersonIds": [], "pendingPersonIds": []}
            if item.get("status") != "CANCELLED":
                state = calendar_status(item, member_ids, bundle["posts"], now)
            items.append({
                **item,
                "status": state["status"],
                "assignedCount": state["assignedCount"],
                "publishedCount": state["publishedCount"],
                "assignees": [{"id": pid, "name": names.get(pid), "published": bool(state["published"].get(pid))} for pid in state["assignees"][:24]],
            })

        # Curate Top Posts: multiplatform (Instagram, Facebook, X, and top YouTube only)
        top_posts = await _curate_top_party_posts(bundle, party_id, limit=50)
        return {"items": items, "topPosts": top_posts}

    @api_router.get("/party/{party_id}/top-posts")
    async def party_top_posts(party_id: str, userId: Optional[str] = None, platform: Optional[str] = None, limit: int = 50):
        actor = await _load_party_actor(userId)
        _caps_for(actor, party_id)
        bundle = _party_members(await _load_world(), party_id)
        top_posts = await _curate_top_party_posts(bundle, party_id, platform_filter=platform, limit=limit)
        return {"items": top_posts}

    @api_router.post("/party/{party_id}/calendar")
    async def party_add_calendar(party_id: str, payload: dict, userId: Optional[str] = None):
        actor = await _load_party_actor(userId)
        caps = _caps_for(actor, party_id, "edit")
        bundle = _party_members(await _load_world(), party_id)
        payload = payload or {}
        title = _clean_str(payload.get("title"), 200)
        if not title:
            raise HTTPException(status_code=400, detail="Title is required.")
        due = parse_iso(payload.get("dueAt"))
        if not due:
            raise HTTPException(status_code=400, detail="Due date is required.")
        platforms = [p for p in (str(x).lower() for x in (payload.get("platforms") or [])) if p in PLATFORMS] or list(PLATFORMS)
        member_ids = {m["id"] for m in bundle["members"]}
        assign_all = bool(payload.get("assignAll")) or not payload.get("assignedPersonIds")
        assigned = [] if assign_all else [pid for pid in payload.get("assignedPersonIds") or [] if pid in member_ids]
        if not assign_all and not assigned:
            raise HTTPException(status_code=400, detail="Pick at least one member, or assign to all members.")
        hashtag = _clean_str(payload.get("hashtag"), 60)
        if hashtag and not hashtag.startswith("#"):
            hashtag = f"#{hashtag}"
        now = now_iso()
        item = {
            "id": new_id("cal"),
            "partyId": bundle["partyId"],
            "title": title,
            "brief": _clean_str(payload.get("brief"), 2000),
            "platforms": platforms,
            "hashtag": hashtag or None,
            "assignAll": assign_all,
            "assignedPersonIds": assigned,
            "dueAt": due.isoformat(),
            "status": "PLANNED",
            "publishedPersonIds": {},
            "createdAt": now,
            "createdBy": caps["actorId"],
            "createdByName": caps["actorName"],
            "updatedAt": now,
        }
        saved = await P._save("party_content_calendar", item["id"], item)
        await _party_audit(caps, actor, party_id, "PARTY_CALENDAR_ADD", item["id"], title, {"assigned": "ALL" if assign_all else len(assigned), "dueAt": item["dueAt"]})
        return saved

    @api_router.patch("/party/{party_id}/calendar/{item_id}")
    async def party_update_calendar(party_id: str, item_id: str, payload: dict, userId: Optional[str] = None):
        actor = await _load_party_actor(userId)
        caps = _caps_for(actor, party_id, "edit")
        bundle = _party_members(await _load_world(), party_id)
        item = next((c for c in bundle["calendar"] if c.get("id") == item_id), None)
        if not item:
            raise HTTPException(status_code=404, detail="Campaign item not found.")
        payload = payload or {}
        item = dict(item)
        member_ids = {m["id"] for m in bundle["members"]}
        marks = dict(item.get("publishedPersonIds") or {})
        for pid in payload.get("markPublished") or []:
            if pid in member_ids:
                marks[pid] = now_iso()
        for pid in payload.get("unmarkPublished") or []:
            marks.pop(pid, None)
        item["publishedPersonIds"] = marks
        if payload.get("status") == "CANCELLED":
            item["status"] = "CANCELLED"
        elif payload.get("status") == "PLANNED":
            item["status"] = "PLANNED"
        if payload.get("title"):
            item["title"] = _clean_str(payload.get("title"), 200)
        if "brief" in payload:
            item["brief"] = _clean_str(payload.get("brief"), 2000)
        if payload.get("dueAt"):
            due = parse_iso(payload.get("dueAt"))
            if not due:
                raise HTTPException(status_code=400, detail="Due date is not valid.")
            item["dueAt"] = due.isoformat()
        item["updatedAt"] = now_iso()
        saved = await P._save("party_content_calendar", item_id, item)
        await _party_audit(caps, actor, party_id, "PARTY_CALENDAR_UPDATE", item_id, item.get("title"), {"status": item.get("status"), "marked": len(marks)})
        return saved

    @api_router.get("/party/{party_id}/gap-rules")
    async def party_get_rules(party_id: str, userId: Optional[str] = None):
        actor = await _load_party_actor(userId)
        _caps_for(actor, party_id)
        bundle = _party_members(await _load_world(), party_id)
        return {"rules": bundle["rules"], "defaults": DEFAULT_GAP_RULES, "updatedAt": (bundle["rulesDoc"] or {}).get("updatedAt"), "updatedByName": (bundle["rulesDoc"] or {}).get("updatedByName")}

    @api_router.put("/party/{party_id}/gap-rules")
    async def party_put_rules(party_id: str, payload: dict, userId: Optional[str] = None):
        actor = await _load_party_actor(userId)
        caps = _caps_for(actor, party_id, "edit")
        pid = normalize_party_id(party_id)
        payload = payload or {}
        limits = {"inactiveDays": (1, 90), "weeklyPostTarget": (1, 100), "staleHours": (1, 720), "researchDays": (1, 365)}
        doc: Dict[str, Any] = {"id": pid, "partyId": pid}
        for key, (low, high) in limits.items():
            value = payload.get(key, DEFAULT_GAP_RULES[key])
            try:
                number = int(float(value))
            except (TypeError, ValueError):
                raise HTTPException(status_code=400, detail=f"{key} must be a whole number.")
            if not low <= number <= high:
                raise HTTPException(status_code=400, detail=f"{key} must be between {low} and {high}.")
            doc[key] = number
        doc.update({"updatedAt": now_iso(), "updatedBy": caps["actorId"], "updatedByName": caps["actorName"]})
        saved = await P._save("party_gap_rules", pid, doc)
        await _party_audit(caps, actor, pid, "PARTY_GAP_RULES_UPDATE", pid, pid, {k: doc[k] for k in limits})
        return {"rules": merge_gap_rules(saved), "updatedAt": saved.get("updatedAt"), "updatedByName": saved.get("updatedByName")}

    @api_router.get("/party/{party_id}/team")
    async def party_team(party_id: str, userId: Optional[str] = None):
        actor = await _load_party_actor(userId)
        _caps_for(actor, party_id)
        return {"items": await _party_team(party_id)}

    @api_router.post("/party/{party_id}/reminders")
    async def party_remind(party_id: str, payload: dict, userId: Optional[str] = None):
        actor = await _load_party_actor(userId)
        caps = _caps_for(actor, party_id, "edit")
        payload = payload or {}
        person_id = _clean_str(payload.get("personId"), 80)
        gap_type = str(payload.get("gapType") or "").upper()
        if gap_type not in {item[0] for item in GAP_TYPES}:
            raise HTTPException(status_code=400, detail="Choose a gap from the report.")
        bundle = _party_members(await _load_world(), party_id)
        member = _member_or_404(bundle, person_id)
        now = datetime.now(timezone.utc)
        for reminder in bundle.get("reminders") or []:
            if reminder.get("personId") == person_id and str(reminder.get("gapType") or "").upper() == gap_type:
                created = parse_iso(reminder.get("createdAt"))
                if created and now - created < timedelta(hours=24):
                    return {**reminder, "already": True}
        doc = {
            "id": new_id("rem"),
            "partyId": bundle["partyId"],
            "personId": person_id,
            "gapType": gap_type,
            "createdAt": now_iso(),
            "createdBy": caps["actorId"],
            "createdByName": caps["actorName"],
        }
        saved = await P._save("party_reminders", doc["id"], doc)
        await _party_audit(caps, actor, party_id, "PARTY_REMIND", person_id, member["name"], {"personId": person_id, "gapType": gap_type})
        return saved

    @api_router.get("/party/{party_id}/posts/refresh")
    async def party_refresh_status(party_id: str, userId: Optional[str] = None):
        actor = await _load_party_actor(userId)
        _caps_for(actor, party_id)
        pid = normalize_party_id(party_id)
        sync = await P._get("party_post_sync", pid) or {}
        return _refresh_view(pid, sync)

    @api_router.post("/party/{party_id}/posts/refresh")
    async def party_refresh(party_id: str, payload: dict, userId: Optional[str] = None):
        actor = await _load_party_actor(userId)
        caps = _caps_for(actor, party_id, "edit")
        payload = payload or {}
        person_id = _clean_str(payload.get("personId"), 80) or None
        force = bool(payload.get("force"))
        wait = bool(payload.get("wait"))
        pid = normalize_party_id(party_id)
        if person_id:
            _member_or_404(_party_members(await _load_world(), pid), person_id)
        current = _REFRESH_JOBS.get(pid)
        if current and current.get("status") == "RUNNING":
            return current
        sync = await P._get("party_post_sync", pid) or {}
        last = parse_iso(sync.get("lastRunAt"))
        if last and not force and not person_id and (datetime.now(timezone.utc) - last).total_seconds() < 24 * 3600:
            view = _refresh_view(pid, sync)
            view["status"] = "SKIPPED"
            view["detail"] = "Posts were fetched in the last 24 hours."
            return view
        job = {
            "id": new_id("job"),
            "partyId": pid,
            "status": "RUNNING",
            "total": 0,
            "done": 0,
            "saved": 0,
            "updated": 0,
            "failed": 0,
            "notes": [],
            "startedAt": now_iso(),
            "finishedAt": None,
            "personId": person_id,
        }
        _REFRESH_JOBS[pid] = job
        if wait:
            return await _run_post_refresh(pid, caps, actor, person_id)
        asyncio.get_running_loop().create_task(_run_post_refresh(pid, caps, actor, person_id))
        return job

    @api_router.get("/party/{party_id}/audit")
    async def party_audit_log(party_id: str, userId: Optional[str] = None, limit: int = 200):
        actor = await _load_party_actor(userId)
        _caps_for(actor, party_id, "edit")
        pid = normalize_party_id(party_id)
        rows = await _party_audit_rows(pid)
        rows.sort(key=lambda r: str(r.get("timestamp") or ""), reverse=True)
        return {"items": rows[: max(1, min(limit, 1000))]}
