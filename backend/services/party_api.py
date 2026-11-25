"""Party Command Center HTTP routes, registered onto the shared /api router."""
from __future__ import annotations

import re
import uuid
from datetime import datetime, timezone
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
    raise HTTPException(status_code=401, detail="Unknown user")


def _caps_for(actor: Dict[str, Any], party_id: Optional[str] = None, action: str = "view") -> Dict[str, Any]:
    caps = party_capabilities(actor)
    if not caps.get(action):
        raise HTTPException(status_code=403, detail=f"Forbidden: {action} is not allowed for this role.")
    if party_id is not None and not can_access_party(caps, party_id):
        raise HTTPException(status_code=403, detail="Forbidden: this party belongs to another account.")
    return caps


async def _party_audit(caps: Dict[str, Any], actor: Dict[str, Any], party_id: str, action: str, target: str, target_name: Optional[str] = None, metadata: Optional[dict] = None) -> None:
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


async def _load_world() -> Dict[str, Any]:
    persons = await P._list("political_persons")
    return {
        "persons": persons,
        "roles": await P._list("political_person_roles"),
        "accounts": await P._list("social_media_accounts"),
        "snapshots": await P._list("social_media_snapshots"),
        "posts": await P._list("social_posts"),
        "contacts": await P._list("party_member_contacts"),
        "linkedContacts": await P._list("constituency_contacts"),
        "research": await P._list("member_research_notes"),
        "calendar": await P._list("party_content_calendar"),
        "rules": await P._list("party_gap_rules"),
        "tasks": await P._list("party_pending_tasks"),
        "parties": await _parties(),
        "geoNames": await _geo_names(),
    }


def _group(rows: List[Dict[str, Any]], key: str) -> Dict[str, List[Dict[str, Any]]]:
    out: Dict[str, List[Dict[str, Any]]] = {}
    for row in rows:
        value = row.get(key)
        if value:
            out.setdefault(str(value), []).append(row)
    return out


def _party_members(world: Dict[str, Any], party_id: str) -> Dict[str, Any]:
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
    }


def _member_or_404(bundle: Dict[str, Any], person_id: str) -> Dict[str, Any]:
    member = next((m for m in bundle["members"] if m["id"] == person_id), None)
    if not member:
        raise HTTPException(status_code=404, detail="This member is not in this party.")
    return member


def _filters(districtId, assemblyConstituencyId, role, platform, q, gap=None):
    return {"district_id": districtId, "assembly_id": assemblyConstituencyId, "role": role, "platform": platform, "q": q, "gap": gap}


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
        districtId: Optional[str] = None,
        assemblyConstituencyId: Optional[str] = None,
        role: Optional[str] = None,
        platform: Optional[str] = None,
    ):
        actor = await _load_party_actor(userId)
        _caps_for(actor, party_id)
        bundle = _party_members(await _load_world(), party_id)
        members = filter_members(bundle["members"], **_filters(districtId, assemblyConstituencyId, role, platform, None))
        districts = sorted({(m["districtId"], m["districtName"] or m["districtId"]) for m in bundle["members"] if m.get("districtId")}, key=lambda d: d[1])
        assemblies = sorted({(m["assemblyConstituencyId"], m["assemblyConstituencyName"] or m["assemblyConstituencyId"], m.get("districtId") or "") for m in bundle["members"] if m.get("assemblyConstituencyId")}, key=lambda a: a[1])
        roles = sorted({r for m in bundle["members"] for r in m.get("roles") or []})
        return {
            "party": bundle["party"],
            "rules": bundle["rules"],
            **overview_from_members(members),
            "filters": {
                "districts": [{"id": d[0], "name": d[1]} for d in districts],
                "assemblies": [{"id": a[0], "name": a[1], "districtId": a[2]} for a in assemblies],
                "roles": roles,
                "platforms": list(PLATFORMS),
            },
        }

    @api_router.get("/party/{party_id}/members")
    async def party_members(
        party_id: str,
        userId: Optional[str] = None,
        districtId: Optional[str] = None,
        assemblyConstituencyId: Optional[str] = None,
        role: Optional[str] = None,
        platform: Optional[str] = None,
        q: Optional[str] = None,
        gap: Optional[str] = None,
        format: Optional[str] = None,
        skip: int = 0,
        limit: int = 500,
    ):
        actor = await _load_party_actor(userId)
        caps = _caps_for(actor, party_id)
        bundle = _party_members(await _load_world(), party_id)
        members = filter_members(bundle["members"], **_filters(districtId, assemblyConstituencyId, role, platform, q, gap))
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
        return {"total": len(members), "items": page}

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
        _caps_for(actor, party_id)
        bundle = _party_members(await _load_world(), party_id)
        _member_or_404(bundle, person_id)
        posts = [p for p in bundle["posts"] if p.get("personId") == person_id and (not platform or str(p.get("platform")).lower() == platform.lower())]
        posts.sort(key=lambda p: str(p.get("publishedAt") or ""), reverse=True)
        return {"items": posts[: max(1, min(limit, 200))]}

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
        districtId: Optional[str] = None,
        assemblyConstituencyId: Optional[str] = None,
        role: Optional[str] = None,
        format: Optional[str] = None,
    ):
        actor = await _load_party_actor(userId)
        caps = _caps_for(actor, party_id)
        bundle = _party_members(await _load_world(), party_id)
        members = filter_members(bundle["members"], **_filters(districtId, assemblyConstituencyId, role, None, None))
        groups = gap_report(members)
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
        names = {m["id"]: m["name"] for m in bundle["members"]}
        now = datetime.now(timezone.utc)
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
                "assignees": [{"id": pid, "name": names.get(pid), "published": bool(state["published"].get(pid))} for pid in state["assignees"]],
            })
        return {"items": items}

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

    @api_router.get("/party/{party_id}/audit")
    async def party_audit_log(party_id: str, userId: Optional[str] = None, limit: int = 200):
        actor = await _load_party_actor(userId)
        _caps_for(actor, party_id, "edit")
        pid = normalize_party_id(party_id)
        rows = await _party_audit_rows(pid)
        rows.sort(key=lambda r: str(r.get("timestamp") or ""), reverse=True)
        return {"items": rows[: max(1, min(limit, 1000))]}
