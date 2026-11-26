"""Party Command Center: per-party member monitoring (contacts, research, posts, pending, gaps).

Pure functions only; HTTP routes live in party_api.py.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Iterable, List, Optional

from .political_intelligence import PLATFORMS, PLATFORM_LABELS, parse_iso

PARTY_PRESIDENT = "PARTY_PRESIDENT"
PARTY_ANALYST = "PARTY_ANALYST"
PARTY_COMMAND_ROLES = (PARTY_PRESIDENT, PARTY_ANALYST)

DEFAULT_GAP_RULES: Dict[str, Any] = {
    "inactiveDays": 7,
    "weeklyPostTarget": 3,
    "staleHours": 48,
    "researchDays": 30,
}

GAP_TYPES = (
    ("MISSING_ACCOUNT", "Missing account"),
    ("UNVERIFIED_ACCOUNT", "Unverified account"),
    ("INACTIVE", "Inactive"),
    ("LOW_POSTING", "Low posting"),
    ("MISSED_CAMPAIGN_POST", "Missed campaign post"),
    ("INCOMPLETE_PROFILE", "Incomplete profile"),
    ("STALE_DATA", "Stale data"),
    ("NO_RESEARCH", "No research"),
)

UNVERIFIED_STATUSES = {"PENDING", "NEEDS_RECHECK", "REJECTED"}
PENDING_ACCOUNT_STATUSES = {"PENDING", "NEEDS_RECHECK"}
PROFILE_FIELDS = (
    ("email", "Email"),
    ("phone", "Phone"),
    ("photoUrl", "Photo"),
    ("constituency", "Constituency"),
    ("role", "Role"),
)


def _role_key(actor: Optional[Dict[str, Any]]) -> str:
    actor = actor or {}
    return str(actor.get("primaryRole") or actor.get("roleId") or actor.get("role") or "").upper().replace("-", "_").replace(" ", "_")


def normalize_party_id(value: Any) -> str:
    return str(value or "").strip().upper()


def party_capabilities(actor: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    """Who may see which party. Super Admin sees all; party roles are pinned to commandPartyId."""
    actor = actor or {}
    role = _role_key(actor)
    email = str(actor.get("email") or "").strip().lower()
    is_super = bool(actor.get("isPlatformAdmin")) or role == "SUPER_ADMIN" or email in {"admin", "admin@leaderslens.ai"}
    is_president = role == PARTY_PRESIDENT
    is_analyst = role == PARTY_ANALYST
    active = str(actor.get("status") or "ACTIVE").upper() == "ACTIVE"
    party_id = normalize_party_id(actor.get("commandPartyId"))
    has_party_role = (is_president or is_analyst) and active and bool(party_id)
    return {
        "isSuper": is_super,
        "isPresident": has_party_role and is_president,
        "isAnalyst": has_party_role and is_analyst,
        "partyId": None if is_super else (party_id if has_party_role else None),
        "view": is_super or has_party_role,
        "edit": is_super or (has_party_role and is_president),
        "export": is_super or has_party_role,
        "research": is_super or has_party_role,
        "compare": is_super,
        "manageAdmins": is_super,
        "actorId": actor.get("id") or actor.get("email") or "anonymous",
        "actorName": actor.get("name") or "Unknown user",
    }


def can_access_party(caps: Dict[str, Any], party_id: str) -> bool:
    if not caps.get("view"):
        return False
    if caps.get("isSuper"):
        return True
    return normalize_party_id(party_id) == normalize_party_id(caps.get("partyId"))


def party_aliases(party_id: str, parties: Iterable[Dict[str, Any]]) -> set:
    """A party can be stored by id or abbreviation (TMC / AITC)."""
    pid = normalize_party_id(party_id)
    out = {pid}
    for party in parties or []:
        ids = {normalize_party_id(party.get("id")), normalize_party_id(party.get("abbreviation")), normalize_party_id(party.get("shortName"))}
        ids.discard("")
        if pid in ids:
            out |= ids
    return out


def merge_gap_rules(stored: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    rules = dict(DEFAULT_GAP_RULES)
    for key, default in DEFAULT_GAP_RULES.items():
        value = (stored or {}).get(key)
        if value in (None, ""):
            continue
        try:
            number = int(float(value))
        except (TypeError, ValueError):
            continue
        if number > 0:
            rules[key] = number
    return rules


def _age_days(ts: Optional[str], now: datetime) -> Optional[float]:
    parsed = parse_iso(ts)
    if not parsed:
        return None
    return (now - parsed).total_seconds() / 86400.0


def _latest(values: Iterable[Optional[str]]) -> Optional[str]:
    best = None
    best_dt = None
    for value in values:
        parsed = parse_iso(value)
        if parsed and (best_dt is None or parsed > best_dt):
            best, best_dt = value, parsed
    return best


def _role_names(person: Dict[str, Any], roles: List[Dict[str, Any]]) -> List[str]:
    names = [str(r.get("politicalRole") or "").strip() for r in roles if r.get("politicalRole")]
    if not names and person.get("politicalRole"):
        names = [part.strip() for part in str(person["politicalRole"]).split(",") if part.strip()]
    if not names and isinstance(person.get("roles"), list):
        names = [str(r).strip() for r in person["roles"] if isinstance(r, str) and r.strip()]
    if not names and person.get("representativeType"):
        names = [str(person["representativeType"]).upper()]
    seen: List[str] = []
    for name in names:
        if name not in seen:
            seen.append(name)
    return seen


def calendar_item_published_by(item: Dict[str, Any], person_id: str, posts: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """A member counts as published once a post links this item, or carries its hashtag on a planned platform."""
    manual = (item.get("publishedPersonIds") or {})
    if isinstance(manual, dict) and manual.get(person_id):
        return {"source": "MANUAL", "at": manual.get(person_id)}
    tag = str(item.get("hashtag") or "").strip().lower()
    platforms = {str(p).lower() for p in (item.get("platforms") or [])}
    start = parse_iso(item.get("createdAt"))
    for post in posts:
        if post.get("personId") != person_id:
            continue
        if post.get("calendarId") == item.get("id"):
            return {"source": "POST", "at": post.get("publishedAt"), "postId": post.get("id")}
        if not tag:
            continue
        if platforms and str(post.get("platform") or "").lower() not in platforms:
            continue
        published = parse_iso(post.get("publishedAt"))
        if start and published and published < start - timedelta(days=1):
            continue
        if tag in str(post.get("text") or "").lower():
            return {"source": "HASHTAG", "at": post.get("publishedAt"), "postId": post.get("id")}
    return None


def calendar_assignees(item: Dict[str, Any], member_ids: List[str]) -> List[str]:
    assigned = [pid for pid in (item.get("assignedPersonIds") or []) if pid]
    if not assigned or item.get("assignAll"):
        return list(member_ids)
    member_set = set(member_ids)
    return [pid for pid in assigned if pid in member_set]


def calendar_status(item: Dict[str, Any], member_ids: List[str], posts: List[Dict[str, Any]], now: datetime) -> Dict[str, Any]:
    assignees = calendar_assignees(item, member_ids)
    published = {pid: calendar_item_published_by(item, pid, posts) for pid in assignees}
    done = [pid for pid, hit in published.items() if hit]
    due = parse_iso(item.get("dueAt"))
    overdue = bool(due and now > due)
    if assignees and len(done) == len(assignees):
        status = "PUBLISHED"
    elif overdue:
        status = "MISSED"
    else:
        status = "PLANNED"
    return {
        "status": status,
        "assignedCount": len(assignees),
        "publishedCount": len(done),
        "assignees": assignees,
        "published": {pid: hit for pid, hit in published.items() if hit},
        "missedPersonIds": [pid for pid in assignees if not published.get(pid)] if overdue else [],
        "pendingPersonIds": [pid for pid in assignees if not published.get(pid)] if not overdue else [],
    }


def member_summary(
    person: Dict[str, Any],
    *,
    roles: List[Dict[str, Any]],
    accounts: List[Dict[str, Any]],
    snapshots: List[Dict[str, Any]],
    posts: List[Dict[str, Any]],
    contact: Optional[Dict[str, Any]],
    research: List[Dict[str, Any]],
    calendar: List[Dict[str, Any]],
    member_ids: List[str],
    rules: Dict[str, Any],
    geo_names: Optional[Dict[str, str]] = None,
    now: Optional[datetime] = None,
    window_days: int = 7,
) -> Dict[str, Any]:
    now = now or datetime.now(timezone.utc)
    geo_names = geo_names or {}
    pid = person.get("id")
    contact = contact or {}
    role_names = _role_names(person, roles)
    ac_id = person.get("assemblyConstituencyId") or ""
    ac_name = geo_names.get(ac_id) or person.get("assemblyConstituencyName") or ""
    district_id = person.get("districtId") or ""

    by_platform: Dict[str, Dict[str, Any]] = {}
    for account in accounts:
        platform = str(account.get("platform") or "").lower()
        if platform in PLATFORMS and platform not in by_platform:
            by_platform[platform] = account
    platform_status: Dict[str, Dict[str, Any]] = {}
    missing_platforms: List[str] = []
    unverified_platforms: List[str] = []
    for platform in PLATFORMS:
        account = by_platform.get(platform)
        if not account:
            platform_status[platform] = {"status": "MISSING", "accountId": None, "profileUrl": None, "followers": None}
            missing_platforms.append(platform)
            continue
        status = "NO_ACCOUNT" if account.get("noAccount") else str(account.get("verificationStatus") or "PENDING").upper()
        platform_status[platform] = {
            "status": status,
            "accountId": account.get("id"),
            "profileUrl": None if account.get("noAccount") else account.get("profileUrl"),
            "followers": account.get("followers"),
            "engagementPercent": account.get("engagementPercent"),
        }
        if status in UNVERIFIED_STATUSES:
            unverified_platforms.append(platform)

    live_accounts = [a for a in accounts if not a.get("noAccount")]
    followers_total = sum(float(a.get("followers") or 0) for a in live_accounts)
    engagements = [float(a["engagementPercent"]) for a in live_accounts if a.get("engagementPercent") not in (None, "")]
    engagement = round(sum(engagements) / len(engagements), 2) if engagements else None

    member_posts = sorted(
        [p for p in posts if p.get("personId") == pid],
        key=lambda p: parse_iso(p.get("publishedAt")) or datetime.min.replace(tzinfo=timezone.utc),
        reverse=True,
    )
    last_post_at = member_posts[0].get("publishedAt") if member_posts else None
    monthly = sum(int(float(a.get("postsLast30Days") or 0)) for a in live_accounts)

    def _count_since(days: int) -> int:
        if days <= 0:
            return len(member_posts)
        start = now - timedelta(days=days)
        return sum(1 for p in member_posts if (parse_iso(p.get("publishedAt")) or datetime.min.replace(tzinfo=timezone.utc)) >= start)

    if member_posts:
        posts_this_week = _count_since(7)
        posts_estimated = False
    else:
        posts_this_week = int(round(monthly * 7 / 30.0))
        posts_estimated = monthly > 0

    try:
        window_days = int(window_days)
    except (TypeError, ValueError):
        window_days = 7
    if member_posts:
        posts_in_window = _count_since(window_days)
        posts_in_window_estimated = False
    elif window_days <= 0 or window_days >= 30:
        posts_in_window = monthly
        posts_in_window_estimated = monthly > 0
    else:
        posts_in_window = int(round(monthly * window_days / 30.0))
        posts_in_window_estimated = monthly > 0

    last_post_age = _age_days(last_post_at, now)
    inactive = (last_post_age is not None and last_post_age > rules["inactiveDays"]) or (last_post_at is None and posts_this_week == 0)
    low_posting = not inactive and posts_this_week < rules["weeklyPostTarget"]

    data_dates: List[Optional[str]] = []
    for account in live_accounts:
        data_dates += [account.get("lastAutoFetchedAt"), account.get("dataCollectionDate"), account.get("updatedAt")]
    for snap in snapshots:
        data_dates += [snap.get("collectionDate"), snap.get("timestamp")]
    last_data_at = _latest(data_dates)
    data_age = _age_days(last_data_at, now)
    stale = bool(live_accounts) and (data_age is None or data_age * 24 > rules["staleHours"])

    last_research_at = _latest(n.get("createdAt") for n in research)
    research_age = _age_days(last_research_at, now)
    no_research = research_age is None or research_age > rules["researchDays"]

    profile_values = {
        "email": contact.get("email") or "",
        "phone": contact.get("phone") or "",
        "photoUrl": contact.get("photoUrl") or person.get("photoUrl") or person.get("profilePhotoUrl") or "",
        "constituency": ac_name or ac_id,
        "role": ", ".join(role_names),
    }
    missing_fields = [label for key, label in PROFILE_FIELDS if not str(profile_values.get(key) or "").strip()]
    covered_platforms = sum(1 for platform in PLATFORMS if platform_status[platform]["status"] != "MISSING")
    checks_total = len(PROFILE_FIELDS) + len(PLATFORMS)
    checks_passed = (len(PROFILE_FIELDS) - len(missing_fields)) + covered_platforms
    completeness = int(round(100.0 * checks_passed / checks_total))

    missed_campaign: List[Dict[str, Any]] = []
    pending_campaign: List[Dict[str, Any]] = []
    for item in calendar:
        if item.get("status") == "CANCELLED":
            continue
        state = calendar_status(item, member_ids, posts, now)
        if pid in state["missedPersonIds"]:
            missed_campaign.append({"id": item.get("id"), "title": item.get("title"), "dueAt": item.get("dueAt")})
        elif pid in state["pendingPersonIds"]:
            pending_campaign.append({"id": item.get("id"), "title": item.get("title"), "dueAt": item.get("dueAt")})

    gaps: List[Dict[str, Any]] = []
    if missing_platforms:
        gaps.append({"type": "MISSING_ACCOUNT", "detail": "No link for " + ", ".join(PLATFORM_LABELS[p] for p in missing_platforms)})
    if unverified_platforms:
        gaps.append({"type": "UNVERIFIED_ACCOUNT", "detail": "Not verified: " + ", ".join(PLATFORM_LABELS[p] for p in unverified_platforms)})
    if inactive:
        detail = f"Last post {int(last_post_age)} days ago" if last_post_age is not None else "No posts recorded"
        gaps.append({"type": "INACTIVE", "detail": detail})
    if low_posting:
        gaps.append({"type": "LOW_POSTING", "detail": f"{posts_this_week} posts this week (target {rules['weeklyPostTarget']})"})
    if missed_campaign:
        gaps.append({"type": "MISSED_CAMPAIGN_POST", "detail": "Missed: " + ", ".join(str(m.get("title") or "campaign post") for m in missed_campaign)})
    if missing_fields:
        gaps.append({"type": "INCOMPLETE_PROFILE", "detail": "Missing " + ", ".join(missing_fields)})
    if stale:
        detail = f"Data is {int(data_age * 24)} hours old" if data_age is not None else "No collection date recorded"
        gaps.append({"type": "STALE_DATA", "detail": detail})
    if no_research:
        detail = f"Last note {int(research_age)} days ago" if research_age is not None else "No research notes yet"
        gaps.append({"type": "NO_RESEARCH", "detail": detail})

    return {
        "id": pid,
        "name": person.get("name"),
        "partyId": person.get("partyId"),
        "roles": role_names,
        "representativeType": person.get("representativeType"),
        "stateId": person.get("stateId"),
        "districtId": district_id,
        "districtName": geo_names.get(district_id) or "",
        "assemblyConstituencyId": ac_id,
        "assemblyConstituencyName": ac_name,
        "parliamentConstituencyId": person.get("parliamentConstituencyId"),
        "verificationStatus": str(person.get("verificationStatus") or "PENDING").upper(),
        "email": profile_values["email"],
        "phone": profile_values["phone"],
        "photoUrl": profile_values["photoUrl"],
        "platforms": platform_status,
        "followersTotal": followers_total,
        "engagementPercent": engagement,
        "lastPostAt": last_post_at,
        "postsThisWeek": posts_this_week,
        "postsEstimated": posts_estimated,
        "postsInWindow": posts_in_window,
        "postsInWindowEstimated": posts_in_window_estimated,
        "windowDays": window_days,
        "lastDataAt": last_data_at,
        "lastResearchAt": last_research_at,
        "completeness": completeness,
        "missingFields": missing_fields,
        "pendingCampaign": pending_campaign,
        "missedCampaign": missed_campaign,
        "gaps": gaps,
        "gapTypes": [g["type"] for g in gaps],
    }


def overview_from_members(members: List[Dict[str, Any]], *, limit: int = 5) -> Dict[str, Any]:
    verified = 0
    pending = 0
    for member in members:
        for state in (member.get("platforms") or {}).values():
            if state.get("status") == "VERIFIED":
                verified += 1
            elif state.get("status") in PENDING_ACCOUNT_STATUSES:
                pending += 1

    def activity_key(member: Dict[str, Any]):
        posts = member.get("postsInWindow")
        if posts is None:
            posts = member.get("postsThisWeek") or 0
        return (posts or 0, member.get("engagementPercent") or 0.0, member.get("followersTotal") or 0.0)

    ranked = sorted(members, key=activity_key, reverse=True)
    most = ranked[:limit]
    most_ids = {m.get("id") for m in most}
    least = [m for m in sorted(members, key=activity_key) if m.get("id") not in most_ids][:limit]

    def brief(member: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "id": member.get("id"),
            "name": member.get("name"),
            "roles": member.get("roles"),
            "assemblyConstituencyName": member.get("assemblyConstituencyName") or member.get("assemblyConstituencyId"),
            "photoUrl": member.get("photoUrl"),
            "postsThisWeek": member.get("postsThisWeek"),
            "postsInWindow": member.get("postsInWindow", member.get("postsThisWeek")),
            "postsEstimated": member.get("postsInWindowEstimated", member.get("postsEstimated")),
            "windowDays": member.get("windowDays", 7),
            "engagementPercent": member.get("engagementPercent"),
        }

    return {
        "totals": {
            "members": len(members),
            "verifiedAccounts": verified,
            "pendingAccounts": pending,
            "inactive": sum(1 for m in members if "INACTIVE" in m.get("gapTypes", [])),
            "incompleteProfiles": sum(1 for m in members if "INCOMPLETE_PROFILE" in m.get("gapTypes", [])),
        },
        "mostActive": [brief(m) for m in most],
        "leastActive": [brief(m) for m in least],
    }


def gap_report(members: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    groups = []
    for gap_type, label in GAP_TYPES:
        rows = []
        for member in members:
            hit = next((g for g in member.get("gaps", []) if g["type"] == gap_type), None)
            if hit:
                rows.append({
                    "id": member.get("id"),
                    "name": member.get("name"),
                    "roles": member.get("roles"),
                    "assemblyConstituencyName": member.get("assemblyConstituencyName") or member.get("assemblyConstituencyId"),
                    "districtName": member.get("districtName"),
                    "photoUrl": member.get("photoUrl"),
                    "detail": hit["detail"],
                })
        groups.append({"type": gap_type, "label": label, "count": len(rows), "members": rows})
    return groups


def pending_items(
    members: List[Dict[str, Any]],
    *,
    persons: Dict[str, Dict[str, Any]],
    accounts: List[Dict[str, Any]],
    calendar: List[Dict[str, Any]],
    posts: List[Dict[str, Any]],
    tasks: Dict[str, Dict[str, Any]],
    now: Optional[datetime] = None,
) -> List[Dict[str, Any]]:
    now = now or datetime.now(timezone.utc)
    member_by_id = {m["id"]: m for m in members}
    items: List[Dict[str, Any]] = []

    def add(item_id: str, kind: str, label: str, person_id: str, since: Optional[str], extra: Optional[Dict[str, Any]] = None):
        member = member_by_id.get(person_id) or {}
        age = _age_days(since, now)
        task = tasks.get(item_id) or {}
        items.append({
            "id": item_id,
            "kind": kind,
            "label": label,
            "personId": person_id,
            "memberName": member.get("name"),
            "assemblyConstituencyName": member.get("assemblyConstituencyName") or member.get("assemblyConstituencyId"),
            "photoUrl": member.get("photoUrl"),
            "since": since,
            "ageDays": None if age is None else max(0, int(age)),
            "assigneeName": task.get("assigneeName"),
            "status": task.get("status") or "OPEN",
            "closedAt": task.get("closedAt"),
            **(extra or {}),
        })

    for account in accounts:
        pid = account.get("personId")
        if pid not in member_by_id or account.get("noAccount"):
            continue
        status = str(account.get("verificationStatus") or "PENDING").upper()
        if status in PENDING_ACCOUNT_STATUSES:
            platform = PLATFORM_LABELS.get(str(account.get("platform") or "").lower(), account.get("platform"))
            label = f"Account pending - {platform}" if status == "PENDING" else f"Account needs recheck - {platform}"
            add(f"acc:{account.get('id')}", "ACCOUNT", label, pid, account.get("updatedAt") or account.get("dataCollectionDate"), {"platform": account.get("platform")})

    for pid in member_by_id:
        person = persons.get(pid) or {}
        if str(person.get("verificationStatus") or "PENDING").upper() == "PENDING":
            add(f"rev:{pid}", "REVIEW", "Awaiting SMM review", pid, person.get("updatedAt") or person.get("createdAt"))

    member_ids = list(member_by_id.keys())
    for item in calendar:
        if item.get("status") == "CANCELLED":
            continue
        state = calendar_status(item, member_ids, posts, now)
        if state["status"] == "PUBLISHED":
            continue
        due = parse_iso(item.get("dueAt"))
        for pid in state["pendingPersonIds"] + state["missedPersonIds"]:
            if due and due.date() == now.date():
                label = "Campaign post due today"
            elif due and due < now:
                label = "Campaign post overdue"
            else:
                label = "Campaign post planned"
            add(f"cal:{item.get('id')}:{pid}", "CAMPAIGN", label, pid, item.get("createdAt"), {"calendarId": item.get("id"), "title": item.get("title"), "dueAt": item.get("dueAt")})

    items.sort(key=lambda i: (i["status"] != "OPEN", -(i["ageDays"] or 0)))
    return items


def party_comparison_row(party: Dict[str, Any], members: List[Dict[str, Any]]) -> Dict[str, Any]:
    total_accounts = 0
    verified = 0
    for member in members:
        for state in (member.get("platforms") or {}).values():
            if state.get("status") in {"MISSING", "NO_ACCOUNT"}:
                continue
            total_accounts += 1
            if state.get("status") == "VERIFIED":
                verified += 1
    engagements = [m["engagementPercent"] for m in members if m.get("engagementPercent") is not None]
    return {
        "partyId": party.get("id"),
        "name": party.get("name") or party.get("id"),
        "abbreviation": party.get("abbreviation") or party.get("id"),
        "color": party.get("primaryColor") or party.get("color") or "#C99436",
        "members": len(members),
        "followers": sum(m.get("followersTotal") or 0 for m in members),
        "postsPerWeek": sum(m.get("postsThisWeek") or 0 for m in members),
        "avgEngagement": round(sum(engagements) / len(engagements), 2) if engagements else None,
        "verifiedPercent": round(100.0 * verified / total_accounts, 1) if total_accounts else None,
    }


def filter_members(
    members: List[Dict[str, Any]],
    *,
    state_id: Optional[str] = None,
    district_id: Optional[str] = None,
    assembly_id: Optional[str] = None,
    role: Optional[str] = None,
    platform: Optional[str] = None,
    q: Optional[str] = None,
    gap: Optional[str] = None,
) -> List[Dict[str, Any]]:
    out = members
    if state_id and state_id.strip().upper() not in ("", "ALL"):
        st = state_id.strip().upper()
        out = [
            m for m in out
            if str(m.get("stateId") or "").strip().upper() == st
            or str(m.get("districtId") or "").startswith(f"{st}-")
            or str(m.get("assemblyConstituencyId") or "").startswith(f"{st}-")
        ]
    if gap:
        out = [m for m in out if gap.upper() in (m.get("gapTypes") or [])]
    if district_id:
        out = [m for m in out if m.get("districtId") == district_id]
    if assembly_id:
        out = [m for m in out if m.get("assemblyConstituencyId") == assembly_id]
    if role:
        needle = role.upper()
        out = [m for m in out if any(needle == str(r).upper() or needle in str(r).upper() for r in m.get("roles") or [])]
    if platform:
        plat = platform.lower()
        out = [m for m in out if (m.get("platforms") or {}).get(plat, {}).get("status") not in (None, "MISSING")]
    if q:
        needle = q.strip().lower()
        out = [
            m for m in out
            if needle in str(m.get("name") or "").lower()
            or needle in str(m.get("email") or "").lower()
            or needle in str(m.get("phone") or "").lower()
            or needle in str(m.get("assemblyConstituencyName") or m.get("assemblyConstituencyId") or "").lower()
        ]
    return out


def members_csv(members: List[Dict[str, Any]]) -> str:
    import csv
    import io

    buf = io.StringIO()
    writer = csv.writer(buf)
    header = ["Name", "Roles", "District", "Constituency", "Email", "Phone"]
    header += [PLATFORM_LABELS[p] for p in PLATFORMS]
    header += ["Last post", "Posts this week", "Engagement %", "Followers", "Profile %", "Gaps", "Posts in window"]
    writer.writerow(header)
    for m in members:
        row = [
            m.get("name") or "",
            ", ".join(m.get("roles") or []),
            m.get("districtName") or m.get("districtId") or "",
            m.get("assemblyConstituencyName") or m.get("assemblyConstituencyId") or "",
            m.get("email") or "",
            m.get("phone") or "",
        ]
        row += [(m.get("platforms") or {}).get(p, {}).get("status", "MISSING") for p in PLATFORMS]
        row += [
            m.get("lastPostAt") or "",
            m.get("postsThisWeek") or 0,
            "" if m.get("engagementPercent") is None else m.get("engagementPercent"),
            int(m.get("followersTotal") or 0),
            m.get("completeness") or 0,
            "; ".join(g["detail"] for g in m.get("gaps") or []),
            m.get("postsInWindow") if m.get("postsInWindow") is not None else "",
        ]
        writer.writerow(row)
    return buf.getvalue()
