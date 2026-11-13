"""Derive administrative districts from existing assembly / parliament geography.

Districts are not a separate hardcoded UI list. They are resolved from the
assembly and parliament records already in Mongo / JSON, using official
Andhra Pradesh and Telangana AC-to-district relationships, and parliament
grouping for other states that only have electoral geography.
"""
from __future__ import annotations

import re
from typing import Any, Dict, Iterable, List, Optional, Tuple

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

TS_DISTRICT_KEYWORDS = (
    ("adilabad", "Adilabad"),
    ("asifabad", "Kumuram Bheem"),
    ("sirpur", "Kumuram Bheem"),
    ("mancherial", "Mancherial"),
    ("bellampalli", "Mancherial"),
    ("ramagundam", "Peddapalli"),
    ("khanapur", "Nirmal"),
    ("nirmal", "Nirmal"),
    ("boath", "Adilabad"),
    ("mudhole", "Nirmal"),
    ("nizamabad", "Nizamabad"),
    ("armur", "Nizamabad"),
    ("balkonda", "Nizamabad"),
    ("bodhan", "Nizamabad"),
    ("jukkal", "Kamareddy"),
    ("banswada", "Kamareddy"),
    ("yellareddy", "Kamareddy"),
    ("kamareddy", "Kamareddy"),
    ("karimnagar", "Karimnagar"),
    ("choppadandi", "Karimnagar"),
    ("vemulawada", "Rajanna Sircilla"),
    ("sircilla", "Rajanna Sircilla"),
    ("peddapalli", "Peddapalli"),
    ("manthani", "Peddapalli"),
    ("sultanabad", "Peddapalli"),
    ("jagitial", "Jagtial"),
    ("jagtial", "Jagtial"),
    ("koratla", "Jagtial"),
    ("dharamapuri", "Jagtial"),
    ("dharmapuri", "Jagtial"),
    ("metpalli", "Jagtial"),
    ("hyderabad", "Hyderabad"),
    ("musheerabad", "Hyderabad"),
    ("malakpet", "Hyderabad"),
    ("amberpet", "Hyderabad"),
    ("khairatabad", "Hyderabad"),
    ("jubilee hills", "Hyderabad"),
    ("sanathnagar", "Hyderabad"),
    ("nampally", "Hyderabad"),
    ("karwan", "Hyderabad"),
    ("goshamahal", "Hyderabad"),
    ("charminar", "Hyderabad"),
    ("chandrayangutta", "Hyderabad"),
    ("yakutpura", "Hyderabad"),
    ("bahadurpura", "Hyderabad"),
    ("secunderabad", "Hyderabad"),
    ("cantonment", "Hyderabad"),
    ("medchal", "Medchal-Malkajgiri"),
    ("malkajgiri", "Medchal-Malkajgiri"),
    ("quthbullapur", "Medchal-Malkajgiri"),
    ("kukatpally", "Medchal-Malkajgiri"),
    ("uppal", "Medchal-Malkajgiri"),
    ("lb nagar", "Rangareddy"),
    ("maheshwaram", "Rangareddy"),
    ("rajendranagar", "Rangareddy"),
    ("serilingampally", "Rangareddy"),
    ("checella", "Rangareddy"),
    ("vikarabad", "Vikarabad"),
    ("pargi", "Vikarabad"),
    ("tandur", "Vikarabad"),
    ("warangal", "Warangal"),
    ("hanamkonda", "Hanamkonda"),
    ("parkal", "Hanamkonda"),
    ("mahabubabad", "Mahabubabad"),
    ("dornakal", "Mahabubabad"),
    ("bhupalpalle", "Jayashankar"),
    ("mulug", "Mulugu"),
    ("pinapaka", "Bhadradri Kothagudem"),
    ("yellandu", "Bhadradri Kothagudem"),
    ("kothagudem", "Bhadradri Kothagudem"),
    ("aswaraopeta", "Bhadradri Kothagudem"),
    ("bhadrachalam", "Bhadradri Kothagudem"),
    ("khammam", "Khammam"),
    ("palair", "Khammam"),
    ("madhira", "Khammam"),
    ("wyra", "Khammam"),
    ("sathupalli", "Khammam"),
    ("narsampet", "Warangal"),
    ("mahbubnagar", "Mahabubnagar"),
    ("mahabubnagar", "Mahabubnagar"),
    ("jadcherla", "Mahabubnagar"),
    ("devarkadra", "Mahabubnagar"),
    ("makthal", "Narayanpet"),
    ("wanaparthy", "Wanaparthy"),
    ("gadwal", "Jogulamba Gadwal"),
    ("alampur", "Jogulamba Gadwal"),
    ("nagarkurnool", "Nagarkurnool"),
    ("achampet", "Nagarkurnool"),
    ("kalwakurthy", "Nagarkurnool"),
    ("shadnagar", "Rangareddy"),
    ("kollapur", "Nagarkurnool"),
    ("nalgonda", "Nalgonda"),
    ("munugode", "Nalgonda"),
    ("nakrekal", "Nalgonda"),
    ("miryalaguda", "Nalgonda"),
    ("huzurnagar", "Suryapet"),
    ("kodad", "Suryapet"),
    ("suryapet", "Suryapet"),
    ("tungaturthi", "Suryapet"),
    ("alatthi", "Yadadri Bhuvanagiri"),
    ("bhongir", "Yadadri Bhuvanagiri"),
    ("alair", "Yadadri Bhuvanagiri"),
    ("jangaon", "Jangaon"),
    ("ghapur", "Jangaon"),
    ("palakurthi", "Jangaon"),
    ("siddipet", "Siddipet"),
    ("dubbak", "Siddipet"),
    ("gajwel", "Siddipet"),
    ("medak", "Medak"),
    ("narayankhed", "Sangareddy"),
    ("andole", "Sangareddy"),
    ("zahirabad", "Sangareddy"),
    ("sangareddy", "Sangareddy"),
    ("patancheru", "Sangareddy"),
    ("dubbak", "Siddipet"),
)


def _norm(value: Optional[str]) -> str:
    return re.sub(r"\s+", " ", (value or "").strip().lower())


def district_id_for(state_id: str, district_name: str) -> str:
    slug = DISTRICT_ID_SLUGS.get(district_name)
    if not slug:
        slug = re.sub(r"[^A-Z0-9]+", "-", (district_name or "UNKNOWN").upper()).strip("-")
    return f"{(state_id or 'NA').upper()}-DIST-{slug}"


def district_name_for_assembly(ac: Dict[str, Any], parliament: Optional[Dict[str, Any]] = None) -> str:
    state = str(ac.get("stateId") or "").upper()
    name = _norm(ac.get("name"))
    if state == "AP":
        if name in AP_DISTRICT_BY_NAME:
            return AP_DISTRICT_BY_NAME[name]
    if state == "TS":
        for needle, district in TS_DISTRICT_KEYWORDS:
            if needle in name:
                return district
    if parliament and parliament.get("name"):
        return str(parliament.get("name"))
    return str(ac.get("name") or "Unknown")


def build_district_catalog(
    assemblies: Iterable[Dict[str, Any]],
    parliaments: Optional[Iterable[Dict[str, Any]]] = None,
    state_id: Optional[str] = None,
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    pc_by_id = {p.get("id"): p for p in (parliaments or []) if p.get("id")}
    districts: Dict[str, Dict[str, Any]] = {}
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
        d_id = district_id_for(ac_state or "NA", d_name)
        bucket = districts.setdefault(
            d_id,
            {
                "id": d_id,
                "name": d_name,
                "stateId": ac_state,
                "isActive": True,
                "assemblyConstituencyIds": [],
                "parliamentConstituencyIds": [],
            },
        )
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
