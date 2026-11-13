"""Resolve current administrative districts from the district master + assembly map.

Dropdowns always show the latest district names for the selected state (AP 26,
TS 33, and current lists for every other state/UT). Assembly seats are linked
onto those districts; missing ACs do not hide a district.
"""
from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple

from .district_master import CURRENT_DISTRICTS, NAME_ALIASES, TS_DISTRICT_BY_NAME

# Official 2022 Andhra Pradesh districts keyed by assembly name in assemblies.json.
AP_DISTRICT_BY_NAME = {
    "ichchapuram": "Srikakulam",
    "palasa": "Srikakulam",
    "tekkali": "Srikakulam",
    "pathapatnam": "Srikakulam",
    "srikakulam": "Srikakulam",
    "amadalavalasa": "Srikakulam",
    "narasannapeta": "Srikakulam",
    "etcherla": "Srikakulam",
    "rajam": "Vizianagaram",
    "kurupam": "Parvathipuram Manyam",
    "parvathipuram": "Parvathipuram Manyam",
    "salur": "Parvathipuram Manyam",
    "palakonda": "Parvathipuram Manyam",
    "bobbili": "Vizianagaram",
    "cheepurupalli": "Vizianagaram",
    "gajapathinagaram": "Vizianagaram",
    "nellimarla": "Vizianagaram",
    "vizianagaram": "Vizianagaram",
    "srungavarapukota": "Vizianagaram",
    "bheemili": "Visakhapatnam",
    "visakhapatnam east": "Visakhapatnam",
    "visakhapatnam south": "Visakhapatnam",
    "visakhapatnam north": "Visakhapatnam",
    "visakhapatnam west": "Visakhapatnam",
    "gajuwaka": "Visakhapatnam",
    "pendurthi": "Visakhapatnam",
    "chodavaram": "Anakapalli",
    "madugula": "Anakapalli",
    "anakapalli": "Anakapalli",
    "elamanchili": "Anakapalli",
    "payakaraopet": "Anakapalli",
    "narsipatnam": "Anakapalli",
    "araku valley": "Alluri Sitharama Raju",
    "paderu": "Alluri Sitharama Raju",
    "rampachodavaram": "Alluri Sitharama Raju",
    "tuni": "Kakinada",
    "prathipadu": "Kakinada",
    "pithapuram": "Kakinada",
    "kakinada rural": "Kakinada",
    "peddapuram": "Kakinada",
    "kakinada city": "Kakinada",
    "anaparthy (east)": "East Godavari",
    "anaparthy": "East Godavari",
    "rajanagaram": "East Godavari",
    "rajahmundry city": "East Godavari",
    "rajahmundry rural": "East Godavari",
    "kovvur": "East Godavari",
    "nidadavole": "East Godavari",
    "gopalapuram": "East Godavari",
    "ramachandrapuram": "Dr. B.R. Ambedkar Konaseema",
    "mummidivaram": "Dr. B.R. Ambedkar Konaseema",
    "amalapuram": "Dr. B.R. Ambedkar Konaseema",
    "razole": "Dr. B.R. Ambedkar Konaseema",
    "gannavaram (amalapuram)": "Dr. B.R. Ambedkar Konaseema",
    "kothapeta": "Dr. B.R. Ambedkar Konaseema",
    "mandapeta": "Dr. B.R. Ambedkar Konaseema",
    "achanta": "West Godavari",
    "palakollu": "West Godavari",
    "narasapuram": "West Godavari",
    "bhimavaram": "West Godavari",
    "undi": "West Godavari",
    "tanuku": "West Godavari",
    "tadepalligudem": "West Godavari",
    "unguturu": "Eluru",
    "denduluru": "Eluru",
    "eluru": "Eluru",
    "polavaram": "Eluru",
    "nuzvid": "Eluru",
    "chintalapudi": "Eluru",
    "kaikalur": "Eluru",
    "gannavaram": "Krishna",
    "gudivada": "Krishna",
    "pedana": "Krishna",
    "machilipatnam": "Krishna",
    "avanigadda": "Krishna",
    "pamarru": "Krishna",
    "penamaluru": "Krishna",
    "vijayawada west": "NTR",
    "vijayawada central": "NTR",
    "vijayawada east": "NTR",
    "mylavaram": "NTR",
    "nandigama": "NTR",
    "jaggayyapeta": "NTR",
    "tiruvuru": "NTR",
    "tadikonda": "Guntur",
    "mangalagiri": "Guntur",
    "ponnuru": "Guntur",
    "tenali": "Guntur",
    "prathipadu (guntur)": "Guntur",
    "guntur west": "Guntur",
    "guntur east": "Guntur",
    "vemuru": "Bapatla",
    "repalle": "Bapatla",
    "bapatla (north)": "Bapatla",
    "bapatla": "Bapatla",
    "parchur": "Bapatla",
    "addanki": "Bapatla",
    "chirala": "Bapatla",
    "chilakaluripet": "Palnadu",
    "narasaraopet": "Palnadu",
    "sattenapalle": "Palnadu",
    "vinukonda": "Palnadu",
    "gurajala": "Palnadu",
    "macherla": "Palnadu",
    "yerragondapalem": "Prakasam",
    "darsi": "Prakasam",
    "santhanuthalapadu": "Prakasam",
    "ongole": "Prakasam",
    "singarayakonda": "Prakasam",
    "kondapi": "Prakasam",
    "markapuram": "Prakasam",
    "giddalur": "Prakasam",
    "kanigiri": "Prakasam",
    "kandukur": "Prakasam",
    "kavali": "SPSR Nellore",
    "kavali (south)": "SPSR Nellore",
    "atmakur": "SPSR Nellore",
    "kovur": "SPSR Nellore",
    "nellore city": "SPSR Nellore",
    "nellore rural": "SPSR Nellore",
    "sarvepalli": "Tirupati",
    "gudur": "Tirupati",
    "sullurpeta": "Tirupati",
    "venkatagiri": "Tirupati",
    "chandragiri": "Tirupati",
    "tirupati": "Tirupati",
    "srikalahasti": "Tirupati",
    "badvel": "YSR Kadapa",
    "pulivendla": "YSR Kadapa",
    "kamalapuram": "YSR Kadapa",
    "jammalamadugu": "YSR Kadapa",
    "proddatur": "YSR Kadapa",
    "mydukur": "YSR Kadapa",
    "kadapa": "YSR Kadapa",
    "rajampet": "Annamayya",
    "rayachoti": "Annamayya",
    "kodur": "Annamayya",
    "thamballapalle": "Annamayya",
    "pileru": "Annamayya",
    "madanapalle": "Annamayya",
    "punganur": "Annamayya",
    "udayagiri": "SPSR Nellore",
    "allagadda": "Nandyal",
    "srisailam": "Nandyal",
    "nandikotkur": "Nandyal",
    "panyam": "Nandyal",
    "nandyal": "Nandyal",
    "banaganapalle": "Nandyal",
    "dhone": "Nandyal",
    "pattikonda": "Kurnool",
    "kodumur": "Kurnool",
    "yemmiganur": "Kurnool",
    "mantralayam": "Kurnool",
    "adoni": "Kurnool",
    "alur": "Kurnool",
    "kurnool": "Kurnool",
    "rayadurg": "Anantapur",
    "uravakonda": "Anantapur",
    "guntakal": "Anantapur",
    "tadipatri": "Anantapur",
    "singanamala": "Anantapur",
    "anantapur urban": "Anantapur",
    "kalyandurg": "Anantapur",
    "raptadu": "Sri Sathya Sai",
    "madakasira": "Sri Sathya Sai",
    "hindupur": "Sri Sathya Sai",
    "penukonda": "Sri Sathya Sai",
    "puttaparthi": "Sri Sathya Sai",
    "dharmavaram": "Sri Sathya Sai",
    "kadiri": "Sri Sathya Sai",
    "nagari": "Chittoor",
    "gangadhara nellore": "Chittoor",
    "chittoor": "Chittoor",
    "puthalapattu": "Chittoor",
    "palamaner": "Chittoor",
    "kuppam": "Chittoor",
    "santhipuram": "Chittoor",
}

# Keep SAMPLE / earlier PI ids stable for Kadapa, Kurnool, Nandyal.
DISTRICT_ID_SLUGS = {
    "YSR Kadapa": "YSR",
    "Kurnool": "KURNOOL",
    "Nandyal": "NANDYAL",
}

def _norm(value: Optional[str]) -> str:
    return re.sub(r"\s+", " ", (value or "").strip().lower())


def district_id_for(state_id: str, district_name: str) -> str:
    slug = DISTRICT_ID_SLUGS.get(district_name)
    if not slug:
        slug = re.sub(r"[^A-Z0-9]+", "-", (district_name or "UNKNOWN").upper()).strip("-")
    return f"{(state_id or 'NA').upper()}-DIST-{slug}"


def canonical_district_name(state_id: str, raw: Optional[str]) -> Optional[str]:
    needle = _norm(raw)
    if not needle:
        return None
    official_names = CURRENT_DISTRICTS.get((state_id or "").upper(), [])
    aliased = NAME_ALIASES.get(needle)
    if aliased and aliased in official_names:
        return aliased
    for official in official_names:
        official_n = _norm(official)
        if official_n == needle:
            return official
    return None


def district_name_for_assembly(ac: Dict[str, Any], parliament: Optional[Dict[str, Any]] = None) -> Optional[str]:
    state = str(ac.get("stateId") or "").upper()
    name = _norm(ac.get("name"))
    if state == "AP" and name in AP_DISTRICT_BY_NAME:
        return AP_DISTRICT_BY_NAME[name]
    if state == "TS" and name in TS_DISTRICT_BY_NAME:
        return TS_DISTRICT_BY_NAME[name]
    matched = canonical_district_name(state, ac.get("name"))
    if matched:
        return matched
    return canonical_district_name(state, (parliament or {}).get("name"))


def empty_district(state_id: str, name: str) -> Dict[str, Any]:
    return {
        "id": district_id_for(state_id, name),
        "name": name,
        "stateId": state_id,
        "isActive": True,
        "source": "CURRENT_ADMIN_DISTRICT_MASTER",
        "assemblyConstituencyIds": [],
        "parliamentConstituencyIds": [],
    }


def master_district_docs(state_id: Optional[str] = None) -> List[Dict[str, Any]]:
    wanted = (state_id or "").upper()
    rows = []
    for code, names in CURRENT_DISTRICTS.items():
        if wanted and code != wanted:
            continue
        for name in names:
            rows.append(empty_district(code, name))
    rows.sort(key=lambda r: (r.get("stateId") or "", r.get("name") or ""))
    return rows


def build_district_catalog(
    assemblies: Iterable[Dict[str, Any]],
    parliaments: Optional[Iterable[Dict[str, Any]]] = None,
    state_id: Optional[str] = None,
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    pc_by_id = {p.get("id"): p for p in (parliaments or []) if p.get("id")}
    districts = {row["id"]: row for row in master_district_docs(state_id)}
    maps: List[Dict[str, Any]] = []
    wanted = (state_id or "").upper()
    for ac in assemblies:
        if not ac.get("id"):
            continue
        ac_state = str(ac.get("stateId") or "").upper()
        if wanted and ac_state != wanted:
            continue
        pc = pc_by_id.get(ac.get("parliamentConstituencyId")) or {}
        d_name = district_name_for_assembly(ac, pc)
        if not d_name:
            continue
        d_id = district_id_for(ac_state or "NA", d_name)
        bucket = districts.get(d_id)
        if not bucket:
            # Never invent districts from parliament/AC names; master list is the source.
            continue
        if ac["id"] not in bucket["assemblyConstituencyIds"]:
            bucket["assemblyConstituencyIds"].append(ac["id"])
        pc_id = ac.get("parliamentConstituencyId")
        if pc_id and pc_id not in bucket["parliamentConstituencyIds"]:
            bucket["parliamentConstituencyIds"].append(pc_id)
        maps.append(
            {
                "id": f"map-{ac['id']}",
                "stateId": ac_state,
                "districtId": d_id,
                "districtName": d_name,
                "parliamentConstituencyId": pc_id,
                "assemblyConstituencyId": ac["id"],
                "assemblyName": ac.get("name"),
            }
        )
    rows = sorted(districts.values(), key=lambda r: (r.get("stateId") or "", r.get("name") or ""))
    return rows, maps


def dump_district_json() -> List[Dict[str, Any]]:
    backend_data = Path(__file__).resolve().parents[1] / "data"
    assemblies: List[Dict[str, Any]] = []
    parliaments: List[Dict[str, Any]] = []
    ac_path = backend_data / "assemblies.json"
    pc_path = backend_data / "parliaments.json"
    if ac_path.exists():
        assemblies = json.loads(ac_path.read_text(encoding="utf-8"))
    if pc_path.exists():
        parliaments = json.loads(pc_path.read_text(encoding="utf-8"))
    docs, _maps = build_district_catalog(assemblies, parliaments)
    payload = json.dumps(docs, indent=2, ensure_ascii=False) + "\n"
    dests = [
        backend_data / "districts.json",
        Path(__file__).resolve().parents[2] / "frontend" / "public" / "data" / "geography" / "districts.json",
        Path(__file__).resolve().parents[2] / "data" / "geography" / "districts.json",
    ]
    for dest in dests:
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(payload, encoding="utf-8")
    return docs
