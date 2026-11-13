"""Political Intelligence data collection: formulas, URL identity, RBAC, sample seed.

New Mongo collections (do not duplicate geography / parties / elected_representatives):
- districts, assembly_district_map
- constituency_statistics, constituency_statistics_history
- political_persons, political_person_roles
- social_media_accounts, social_media_snapshots
- data_verification_history, data_import_batches
- constituency_contacts, constituency_contact_history
"""
from __future__ import annotations

import csv
import hashlib
import io
import math
import re
import uuid
from copy import deepcopy
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Iterable, List, Optional, Tuple
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse

PLATFORMS = ("facebook", "instagram", "x", "youtube")
ACCOUNT_STATUSES = ("PENDING", "VERIFIED", "NEEDS_RECHECK", "REJECTED", "NO_ACCOUNT", "INACTIVE")
PERSON_ROLES = (
    "MLA",
    "LOK_SABHA_MP",
    "RAJYA_SABHA_MP",
    "MLC",
    "MINISTER",
    "CHIEF_MINISTER",
    "DEPUTY_CHIEF_MINISTER",
    "CABINET_MINISTER",
    "MINISTER_OF_STATE",
    "FORMER_MLA",
    "FORMER_MP",
    "FORMER_MLC",
    "PROSPECTIVE_CANDIDATE",
    "PARTY_LEADER",
    "PARTY_PRESIDENT",
    "OTHER",
)
ENGAGEMENT_FORMULA_VERSION = {
    "facebook": "facebook_er_v1",
    "instagram": "instagram_er_v1",
    "x": "x_er_v1",
    "youtube": "youtube_vtr_v1",
}
SOCIAL_SCORE_VERSION = "social_score_v1"
SAMPLE_TAG = "SAMPLE"

MEMORY: Dict[str, Any] = {
    "districts": {},
    "assembly_district_map": {},
    "constituency_statistics": {},
    "constituency_statistics_history": [],
    "political_persons": {},
    "political_person_roles": {},
    "social_media_accounts": {},
    "social_media_snapshots": [],
    "data_verification_history": [],
    "data_import_batches": [],
    "constituency_contacts": {},
    "constituency_contact_history": [],
}


def reset_memory() -> None:
    for key, value in MEMORY.items():
        if isinstance(value, dict):
            value.clear()
        else:
            MEMORY[key] = []


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def new_id(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4().hex[:10]}"


def parse_iso(ts: Optional[str]) -> Optional[datetime]:
    if not ts:
        return None
    try:
        parsed = datetime.fromisoformat(str(ts).replace("Z", "+00:00"))
    except Exception:
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed


def normalize_name(name: str) -> str:
    return re.sub(r"\s+", " ", (name or "").strip().lower())


def normalize_profile_url(url: str, platform: str = "") -> str:
    raw = (url or "").strip()
    if not raw:
        return ""
    if not re.match(r"^https?://", raw, flags=re.I):
        raw = "https://" + raw
    parsed = urlparse(raw)
    host = (parsed.netloc or "").lower()
    if host.startswith("www."):
        host = host[4:]
    if host in {"twitter.com", "mobile.twitter.com", "t.co"}:
        host = "x.com"
    if host in {"m.facebook.com", "web.facebook.com", "fb.com"}:
        host = "facebook.com"
    if host in {"instagr.am"}:
        host = "instagram.com"
    if host in {"youtu.be", "m.youtube.com"}:
        host = "youtube.com"
    path = re.sub(r"/+", "/", parsed.path or "").rstrip("/")
    query = parse_qs(parsed.query or "")
    keep = {}
    if host == "facebook.com" and "id" in query:
        keep["id"] = query["id"][0]
    if host == "youtube.com" and path in {"/watch", "/playlist"}:
        for key in ("v", "list"):
            if key in query:
                keep[key] = query[key][0]
    cleaned = urlunparse(("https", host, path, "", urlencode(keep), ""))
    return cleaned.lower()


def account_identity_key(platform: str, url: str, identifier: str = "") -> str:
    ident = (identifier or "").strip().lower().lstrip("@")
    normalized = normalize_profile_url(url, platform)
    if ident:
        return f"{(platform or '').lower()}|{ident}"
    return f"{(platform or '').lower()}|{normalized}"


def calculate_engagement(
    platform: str,
    followers: Optional[float],
    avg_likes: Optional[float],
    avg_comments: Optional[float],
    avg_views: Optional[float],
) -> Tuple[Optional[float], str]:
    plat = (platform or "").lower()
    version = ENGAGEMENT_FORMULA_VERSION.get(plat, "generic_er_v1")
    if plat == "youtube":
        if avg_views is None or followers is None or followers <= 0:
            return None, version
        return round((avg_views / followers) * 100.0, 4), version
    if followers is None or followers <= 0:
        return None, version
    if avg_likes is None and avg_comments is None:
        return None, version
    likes = 0.0 if avg_likes is None else float(avg_likes)
    comments = 0.0 if avg_comments is None else float(avg_comments)
    if avg_likes is None or avg_comments is None:
        # Partial metrics: still compute on present parts but do not invent zeros for the missing side in storage.
        present = likes if avg_likes is not None else comments
        return round((present / followers) * 100.0, 4), version
    return round(((likes + comments) / followers) * 100.0, 4), version


def snapshot_growth(snapshots: List[Dict[str, Any]], days: int) -> Optional[float]:
    dated = []
    for snap in snapshots:
        collected = parse_iso(snap.get("collectionDate") or snap.get("createdAt"))
        followers = snap.get("followers")
        if collected is None or followers is None:
            continue
        dated.append((collected, float(followers)))
    if len(dated) < 2:
        return None
    dated.sort(key=lambda item: item[0])
    latest_time, latest_val = dated[-1]
    target = latest_time - timedelta(days=days)
    prior = None
    for collected, value in dated:
        if collected <= target:
            prior = (collected, value)
        else:
            break
    if prior is None:
        prior = dated[0]
        if prior[0] == latest_time:
            return None
    old_val = prior[1]
    if old_val <= 0:
        return None
    return round(((latest_val - old_val) / old_val) * 100.0, 4)


def _rank_score(values: List[Optional[float]], value: Optional[float]) -> Optional[float]:
    present = [v for v in values if v is not None]
    if value is None or not present:
        return None
    if max(present) == min(present):
        return 50.0
    return (value - min(present)) / (max(present) - min(present)) * 100.0


def social_score(row: Dict[str, Any], cohort: List[Dict[str, Any]]) -> Tuple[Optional[float], Dict[str, Any]]:
    weights = {"followers": 0.4, "engagement": 0.3, "growth30": 0.2, "posts30": 0.1}
    keys = {
        "followers": [c.get("followers") for c in cohort],
        "engagement": [c.get("engagementPercent") for c in cohort],
        "growth30": [c.get("growth30") for c in cohort],
        "posts30": [c.get("postsLast30Days") for c in cohort],
    }
    row_values = {
        "followers": row.get("followers"),
        "engagement": row.get("engagementPercent"),
        "growth30": row.get("growth30"),
        "posts30": row.get("postsLast30Days"),
    }
    parts = {}
    used = 0.0
    total = 0.0
    for metric, weight in weights.items():
        score = _rank_score(keys[metric], row_values[metric])
        if score is None:
            continue
        parts[metric] = round(score, 2)
        total += score * weight
        used += weight
    if used <= 0:
        return None, {"version": SOCIAL_SCORE_VERSION, "weights": weights, "parts": parts, "note": "Insufficient metrics; missing values were excluded, not treated as zero."}
    return round(total / used, 2), {"version": SOCIAL_SCORE_VERSION, "weights": weights, "parts": parts, "reweighted": True}


def actor_capabilities(actor: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    actor = actor or {}
    role = str(actor.get("primaryRole") or actor.get("roleId") or actor.get("role") or "").upper()
    email = str(actor.get("email") or "").lower()
    is_super = bool(actor.get("isPlatformAdmin")) or role == "SUPER_ADMIN" or email == "admin@leaderslens.ai"
    is_pa = bool(actor.get("isPoliticalAdmin")) or role in {"POLITICAL_ADMIN", "ADMIN"}
    is_dir = role in {"DIRECTOR", "CAMPAIGN_MANAGER", "PARTY_ADMIN"}
    is_vol = role in {"VOLUNTEER"}
    staff = is_super or is_pa or is_dir
    return {
        "view": True,
        "create": staff or is_vol,
        "update": staff or is_vol,
        "submit": staff or is_vol,
        "verify": staff,
        "import": staff,
        "export": staff,
        "isSuper": is_super,
        "scopeStateId": None if is_super else (actor.get("stateId") or "AP"),
        "scopeAssemblyId": None if (is_super or is_pa) else actor.get("assemblyConstituencyId"),
        "actorId": actor.get("id") or actor.get("email") or "anonymous",
        "actorName": actor.get("name") or "Unknown user",
    }


def in_scope(caps: Dict[str, Any], state_id: Optional[str] = None, assembly_id: Optional[str] = None) -> bool:
    if caps.get("isSuper"):
        return True
    if caps.get("scopeAssemblyId") and assembly_id and str(assembly_id) != str(caps["scopeAssemblyId"]):
        if str(assembly_id) not in {"BNG-AC"} or str(caps["scopeAssemblyId"]) not in {"BNG-AC", "AP-AC-139"}:
            if {str(assembly_id), str(caps["scopeAssemblyId"])} != {"BNG-AC", "AP-AC-139"}:
                return False
    if caps.get("scopeStateId") and state_id and str(state_id).upper() != str(caps["scopeStateId"]).upper():
        return False
    return True


def memory_upsert(collection: str, key: str, doc: Dict[str, Any]) -> Dict[str, Any]:
    stored = deepcopy(doc)
    bucket = MEMORY[collection]
    if isinstance(bucket, dict):
        bucket[key] = stored
    else:
        MEMORY[collection] = [item for item in bucket if item.get("id") != stored.get("id")]
        MEMORY[collection].insert(0, stored)
    return deepcopy(stored)


def memory_get(collection: str, key: str) -> Optional[Dict[str, Any]]:
    bucket = MEMORY[collection]
    if isinstance(bucket, dict):
        doc = bucket.get(key)
        return deepcopy(doc) if doc else None
    for item in bucket:
        if item.get("id") == key or item.get("key") == key:
            return deepcopy(item)
    return None


def memory_list(collection: str) -> List[Dict[str, Any]]:
    bucket = MEMORY[collection]
    if isinstance(bucket, dict):
        return [deepcopy(v) for v in bucket.values()]
    return [deepcopy(v) for v in bucket]


def parse_csv(text: str) -> List[Dict[str, str]]:
    reader = csv.DictReader(io.StringIO(text or ""))
    return [{k.strip(): (v or "").strip() for k, v in row.items() if k} for row in reader]


def csv_template() -> str:
    headers = [
        "recordType",
        "stateId",
        "districtId",
        "parliamentConstituencyId",
        "assemblyConstituencyId",
        "totalVoters",
        "ruralPercent",
        "estimatedFacebookUsers",
        "estimatedInstagramUsers",
        "estimatedXUsers",
        "estimatedYouTubeUsers",
        "dataCollectionDate",
        "dataSource",
        "remarks",
        "leaderName",
        "partyId",
        "politicalRole",
        "currentFormerStatus",
        "platform",
        "profileUrl",
        "accountIdentifier",
        "followers",
        "postsLast30Days",
        "avgLikesLast10",
        "avgCommentsLast10",
        "avgViewsLast10",
    ]
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(headers)
    writer.writerow(
        [
            "constituency",
            "AP",
            "AP-DIST-NANDYAL",
            "AP-PC-17",
            "AP-AC-139",
            "234100",
            "62",
            "48000",
            "22000",
            "9000",
            "15000",
            "2026-11-01",
            "FIELD_SURVEY",
            "Sample row — estimates only",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
        ]
    )
    writer.writerow(
        [
            "social",
            "AP",
            "AP-DIST-NANDYAL",
            "AP-PC-17",
            "AP-AC-139",
            "",
            "",
            "",
            "",
            "",
            "",
            "2026-11-01",
            "MANUAL",
            "Sample social row",
            "A. Rao (Sample)",
            "TDP",
            "MLA",
            "CURRENT",
            "facebook",
            "https://facebook.com/sample.rao.bng",
            "sample.rao.bng",
            "12500",
            "18",
            "210",
            "34",
            "",
        ]
    )
    return buf.getvalue()


def sample_seed_documents() -> Dict[str, List[Dict[str, Any]]]:
    """Fictional SAMPLE records only. Never overwrite non-sample production ids."""
    collected = "2026-11-01T10:00:00+00:00"
    earlier = "2026-08-03T10:00:00+00:00"
    kadapa_acs = [
        ("AP-AC-124", "AP-PC-21", "Badvel"),
        ("AP-AC-126", "AP-PC-21", "Pulivendla"),
        ("AP-AC-127", "AP-PC-21", "Kamalapuram"),
        ("AP-AC-128", "AP-PC-21", "Jammalamadugu"),
        ("AP-AC-129", "AP-PC-21", "Proddatur"),
        ("AP-AC-131", "AP-PC-21", "Mydukur"),
        ("AP-AC-132", "AP-PC-21", "Kadapa"),
    ]
    kurnool_acs = [
        ("AP-AC-141", "AP-PC-18", "Pattikonda"),
        ("AP-AC-142", "AP-PC-18", "Kodumur"),
        ("AP-AC-143", "AP-PC-18", "Yemmiganur"),
        ("AP-AC-144", "AP-PC-18", "Mantralayam"),
        ("AP-AC-145", "AP-PC-18", "Adoni"),
        ("AP-AC-146", "AP-PC-18", "Alur"),
        ("AP-AC-147", "AP-PC-18", "Kurnool"),
    ]
    nandyal_acs = [
        ("AP-AC-138", "AP-PC-17", "Nandyal"),
        ("AP-AC-139", "AP-PC-17", "Banaganapalle"),
        ("AP-AC-140", "AP-PC-17", "Dhone"),
    ]
    districts = [
        {"id": "AP-DIST-YSR", "stateId": "AP", "name": "YSR Kadapa", "code": "YSR", "isActive": True, "isSample": True},
        {"id": "AP-DIST-KURNOOL", "stateId": "AP", "name": "Kurnool", "code": "KNL", "isActive": True, "isSample": True},
        {"id": "AP-DIST-NANDYAL", "stateId": "AP", "name": "Nandyal", "code": "NDL", "isActive": True, "isSample": True},
    ]
    maps = []
    for ac_id, pc_id, _name in kadapa_acs:
        maps.append({"id": f"map-{ac_id}", "stateId": "AP", "districtId": "AP-DIST-YSR", "parliamentConstituencyId": pc_id, "assemblyConstituencyId": ac_id, "isSample": True})
    for ac_id, pc_id, _name in kurnool_acs:
        maps.append({"id": f"map-{ac_id}", "stateId": "AP", "districtId": "AP-DIST-KURNOOL", "parliamentConstituencyId": pc_id, "assemblyConstituencyId": ac_id, "isSample": True})
    for ac_id, pc_id, _name in nandyal_acs:
        maps.append({"id": f"map-{ac_id}", "stateId": "AP", "districtId": "AP-DIST-NANDYAL", "parliamentConstituencyId": pc_id, "assemblyConstituencyId": ac_id, "isSample": True})

    stats = []
    for idx, (ac_id, pc_id, name) in enumerate(kadapa_acs + nandyal_acs + kurnool_acs[:5]):
        district_id = "AP-DIST-YSR" if ac_id.startswith("AP-AC-12") or ac_id in {item[0] for item in kadapa_acs} else ("AP-DIST-NANDYAL" if ac_id in {item[0] for item in nandyal_acs} else "AP-DIST-KURNOOL")
        stats.append(
            {
                "id": f"cstat-{ac_id}",
                "stateId": "AP",
                "districtId": district_id,
                "parliamentConstituencyId": pc_id,
                "assemblyConstituencyId": ac_id,
                "assemblyName": name,
                "totalVoters": 210000 + idx * 2500,
                "ruralPercent": 58 + (idx % 7),
                "estimatedFacebookUsers": 40000 + idx * 800,
                "estimatedInstagramUsers": 18000 + idx * 400,
                "estimatedXUsers": 7000 + idx * 120,
                "estimatedYouTubeUsers": 12000 + idx * 250,
                "estimatesFlag": True,
                "dataCollectionDate": collected,
                "dataSource": "SAMPLE_SURVEY",
                "remarks": f"{SAMPLE_TAG} fictional constituency statistics for {name}.",
                "verificationStatus": "VERIFIED" if idx % 3 else "PENDING",
                "enteredBy": "usr-demo-director",
                "enteredByName": "Manager1",
                "isSample": True,
                "updatedAt": collected,
            }
        )

    persons = [
        {
            "id": "pp-sample-rao",
            "name": "A. Rao (Sample)",
            "normalizedName": normalize_name("A. Rao (Sample)"),
            "partyId": "TDP",
            "stateId": "AP",
            "districtId": "AP-DIST-NANDYAL",
            "parliamentConstituencyId": "AP-PC-17",
            "assemblyConstituencyId": "AP-AC-139",
            "contactId": "cnt-pi-sample-rao",
            "verificationStatus": "VERIFIED",
            "dataSource": "SAMPLE",
            "remarks": f"{SAMPLE_TAG} fictional sitting MLA for Banaganapalle.",
            "enteredBy": "usr-demo-director",
            "enteredByName": "Manager1",
            "isSample": True,
        },
        {
            "id": "pp-sample-naidu",
            "name": "K. Naidu (Sample)",
            "normalizedName": normalize_name("K. Naidu (Sample)"),
            "partyId": "YSRCP",
            "stateId": "AP",
            "districtId": "AP-DIST-NANDYAL",
            "parliamentConstituencyId": "AP-PC-17",
            "assemblyConstituencyId": "AP-AC-139",
            "contactId": "cnt-pi-sample-naidu",
            "verificationStatus": "NEEDS_RECHECK",
            "dataSource": "SAMPLE",
            "remarks": f"{SAMPLE_TAG} fictional opposition leader.",
            "enteredBy": "usr-demo-volunteer",
            "enteredByName": "Volunteer1",
            "isSample": True,
        },
        {
            "id": "pp-sample-reddy",
            "name": "M. Reddy (Sample)",
            "normalizedName": normalize_name("M. Reddy (Sample)"),
            "partyId": "YSRCP",
            "stateId": "AP",
            "districtId": "AP-DIST-YSR",
            "parliamentConstituencyId": "AP-PC-21",
            "assemblyConstituencyId": "AP-AC-132",
            "contactId": "cnt-pi-sample-reddy",
            "verificationStatus": "PENDING",
            "dataSource": "SAMPLE",
            "remarks": f"{SAMPLE_TAG} fictional Kadapa leader.",
            "enteredBy": "usr-demo-director",
            "enteredByName": "Manager1",
            "isSample": True,
        },
        {
            "id": "pp-sample-patel",
            "name": "S. Patel (Sample)",
            "normalizedName": normalize_name("S. Patel (Sample)"),
            "partyId": "TDP",
            "stateId": "AP",
            "districtId": "AP-DIST-KURNOOL",
            "parliamentConstituencyId": "AP-PC-18",
            "assemblyConstituencyId": "AP-AC-147",
            "contactId": "cnt-pi-sample-patel",
            "verificationStatus": "VERIFIED",
            "dataSource": "SAMPLE",
            "remarks": f"{SAMPLE_TAG} fictional Kurnool leader.",
            "enteredBy": "usr-demo-admin",
            "enteredByName": "B. C. Janardhan Reddy (MLA)",
            "isSample": True,
        },
    ]
    roles = [
        {"id": "pr-sample-rao-mla", "personId": "pp-sample-rao", "politicalRole": "MLA", "status": "CURRENT", "electionYear": 2024, "partyId": "TDP", "assemblyConstituencyId": "AP-AC-139", "isSample": True},
        {"id": "pr-sample-rao-mos", "personId": "pp-sample-rao", "politicalRole": "MINISTER_OF_STATE", "status": "CURRENT", "electionYear": 2024, "partyId": "TDP", "assemblyConstituencyId": "AP-AC-139", "isSample": True},
        {"id": "pr-sample-naidu", "personId": "pp-sample-naidu", "politicalRole": "FORMER_MLA", "status": "FORMER", "electionYear": 2019, "partyId": "YSRCP", "assemblyConstituencyId": "AP-AC-139", "isSample": True},
        {"id": "pr-sample-reddy", "personId": "pp-sample-reddy", "politicalRole": "PARTY_LEADER", "status": "CURRENT", "electionYear": None, "partyId": "YSRCP", "assemblyConstituencyId": "AP-AC-132", "isSample": True},
        {"id": "pr-sample-patel", "personId": "pp-sample-patel", "politicalRole": "MLA", "status": "CURRENT", "electionYear": 2024, "partyId": "TDP", "assemblyConstituencyId": "AP-AC-147", "isSample": True},
    ]

    def _account(aid, person, platform, url, ident, followers, posts, likes, comments, views, status):
        eng, formula = calculate_engagement(platform, followers, likes, comments, views)
        return {
            "id": aid,
            "personId": person,
            "platform": platform,
            "profileUrl": url,
            "normalizedUrl": normalize_profile_url(url, platform),
            "accountIdentifier": ident,
            "identityKey": account_identity_key(platform, url, ident),
            "followers": followers,
            "postsLast30Days": posts,
            "avgLikesLast10": likes,
            "avgCommentsLast10": comments,
            "avgViewsLast10": views,
            "engagementPercent": eng,
            "engagementFormulaVersion": formula,
            "verificationStatus": status,
            "dataCollectionDate": collected,
            "dataSource": "SAMPLE",
            "remarks": f"{SAMPLE_TAG} fictional {platform} account.",
            "enteredBy": "usr-demo-director",
            "enteredByName": "Manager1",
            "isSample": True,
            "noAccount": status == "NO_ACCOUNT",
        }

    accounts = [
        _account("sma-rao-fb", "pp-sample-rao", "facebook", "https://facebook.com/sample.rao.bng", "sample.rao.bng", 18400, 22, 310, 48, None, "VERIFIED"),
        _account("sma-rao-ig", "pp-sample-rao", "instagram", "https://instagram.com/sample.rao.bng", "sample.rao.bng", 9200, 30, 420, 61, None, "VERIFIED"),
        _account("sma-rao-x", "pp-sample-rao", "x", "https://x.com/sample_rao_bng", "sample_rao_bng", 4100, 40, 55, 12, None, "PENDING"),
        _account("sma-rao-yt", "pp-sample-rao", "youtube", "https://youtube.com/@sample.rao.bng", "sample.rao.bng", 7300, 8, None, None, 2100, "VERIFIED"),
        _account("sma-naidu-fb", "pp-sample-naidu", "facebook", "https://facebook.com/sample.naidu.bng", "sample.naidu.bng", 12100, 9, 140, 22, None, "NEEDS_RECHECK"),
        _account("sma-naidu-ig", "pp-sample-naidu", "instagram", "https://instagram.com/sample.naidu.bng", "sample.naidu.bng", None, None, None, None, None, "NO_ACCOUNT"),
        _account("sma-reddy-fb", "pp-sample-reddy", "facebook", "https://facebook.com/sample.reddy.kdp", "sample.reddy.kdp", 26000, 14, 510, 80, None, "PENDING"),
        _account("sma-patel-fb", "pp-sample-patel", "facebook", "https://facebook.com/sample.patel.knl", "sample.patel.knl", 15200, 16, 190, 27, None, "VERIFIED"),
        _account("sma-patel-yt", "pp-sample-patel", "youtube", "https://youtube.com/@sample.patel.knl", "sample.patel.knl", 5400, 4, None, None, 980, "INACTIVE"),
    ]
    snapshots = []
    for acc in accounts:
        if acc.get("noAccount") or acc.get("followers") is None:
            continue
        early_followers = max(100, int(acc["followers"] * 0.82))
        for when, followers in ((earlier, early_followers), (collected, acc["followers"])):
            eng, formula = calculate_engagement(acc["platform"], followers, acc.get("avgLikesLast10"), acc.get("avgCommentsLast10"), acc.get("avgViewsLast10"))
            snapshots.append(
                {
                    "id": f"snap-{acc['id']}-{when[:10]}",
                    "accountId": acc["id"],
                    "personId": acc["personId"],
                    "platform": acc["platform"],
                    "followers": followers,
                    "postsLast30Days": acc.get("postsLast30Days"),
                    "avgLikesLast10": acc.get("avgLikesLast10"),
                    "avgCommentsLast10": acc.get("avgCommentsLast10"),
                    "avgViewsLast10": acc.get("avgViewsLast10"),
                    "engagementPercent": eng,
                    "engagementFormulaVersion": formula,
                    "collectionDate": when,
                    "collectedBy": "usr-demo-director",
                    "dataSource": "SAMPLE",
                    "verificationStatus": acc["verificationStatus"],
                    "isSample": True,
                }
            )

    contacts = []
    history = []
    for person in persons:
        contacts.append(
            {
                "id": person["contactId"],
                "name": person["name"],
                "phone": "",
                "category": "INFLUENCER",
                "designation": "Political leader (sample)",
                "politicalPersonId": person["id"],
                "partyId": person["partyId"],
                "assemblyConstituencyId": person["assemblyConstituencyId"],
                "source": "POLITICAL_INTELLIGENCE",
                "isSample": True,
                "notes": f"{SAMPLE_TAG} linked from Political Intelligence.",
            }
        )
        history.append(
            {
                "id": f"ch-{person['contactId']}",
                "contactId": person["contactId"],
                "action": "LINKED_FROM_PI",
                "actorUserId": "usr-demo-director",
                "timestamp": collected,
                "metadata": {"personId": person["id"]},
                "isSample": True,
            }
        )

    return {
        "districts": districts,
        "assembly_district_map": maps,
        "constituency_statistics": stats,
        "political_persons": persons,
        "political_person_roles": roles,
        "social_media_accounts": accounts,
        "social_media_snapshots": snapshots,
        "constituency_contacts": contacts,
        "constituency_contact_history": history,
    }


def load_sample_into_memory() -> int:
    payload = sample_seed_documents()
    count = 0
    key_field = {
        "districts": "id",
        "assembly_district_map": "id",
        "constituency_statistics": "id",
        "political_persons": "id",
        "political_person_roles": "id",
        "social_media_accounts": "id",
        "constituency_contacts": "id",
    }
    for collection, rows in payload.items():
        if collection in {"social_media_snapshots", "constituency_contact_history"}:
            MEMORY[collection] = [row for row in MEMORY[collection] if not row.get("isSample")]
            MEMORY[collection].extend(deepcopy(rows))
            count += len(rows)
            continue
        field = key_field.get(collection, "id")
        for row in rows:
            memory_upsert(collection, row[field], row)
            count += 1
    return count
