"""Display-only ticket number formatting. Stored ticketNumber/id stay unchanged."""
from __future__ import annotations

import re
from datetime import datetime, timezone
from typing import Any, Dict, Optional

_PARENS_SUFFIX = re.compile(r"\s*\([^)]*\)\s*$")
_AC_CODE = re.compile(r"\(AC[-\s]?(\d+)\)", re.I)
_PC_CODE = re.compile(r"\(PC[-\s]?(\d+)\)", re.I)
_TRAILING_GEO = re.compile(r"\s+(Assembly|Constituency|AC|PC)\s*$", re.I)


def strip_ticket_number_parens(value: Any) -> str:
    return _PARENS_SUFFIX.sub("", str(value or "")).strip()


def constituency_short_name(issue: Optional[Dict[str, Any]]) -> str:
    if not issue:
        return ""
    raw = str(issue.get("assemblyConstituencyName") or issue.get("parliamentConstituencyName") or "").strip()
    if not raw:
        return ""
    name = _PARENS_SUFFIX.sub("", raw).strip()
    name = _TRAILING_GEO.sub("", name).strip()
    return name


def geo_code_from_issue(issue: Optional[Dict[str, Any]]) -> str:
    if not issue:
        return ""
    ac_match = _AC_CODE.search(str(issue.get("assemblyConstituencyName") or ""))
    if ac_match:
        return f"AC{int(ac_match.group(1)):03d}"
    pc_match = _PC_CODE.search(str(issue.get("parliamentConstituencyName") or ""))
    if pc_match:
        return f"PC{int(pc_match.group(1)):02d}"
    return ""


def office_code_from_issue(issue: Optional[Dict[str, Any]]) -> str:
    if not issue:
        return "MLA"
    if issue.get("assemblyConstituencyId"):
        return "MLA"
    if issue.get("parliamentConstituencyId"):
        return "MP"
    return "MLA"


def raw_ticket_number(issue: Optional[Dict[str, Any]]) -> str:
    if not issue:
        return "LL-TICKET"
    stored = strip_ticket_number_parens(issue.get("ticketNumber"))
    if stored:
        return stored
    raw = str(issue.get("id") or "LL-TICKET")
    if raw.startswith("LL-") or raw.startswith("#"):
        return raw
    if raw.startswith("iss-"):
        return f"LL-{raw.replace('iss-', '', 1)}"
    return f"#{raw}"


def format_ticket_display(issue: Optional[Dict[str, Any]]) -> str:
    raw = raw_ticket_number(issue)
    place = constituency_short_name(issue)
    if place:
        return f"{raw} ({place})"
    return raw


INITIAL_TICKET_SEQUENCE = 1
_SEQ_SUFFIX = re.compile(r"-(\d{6})$")


def ticket_year_code(issue: Optional[Dict[str, Any]]) -> str:
    year_source = (issue or {}).get("reportedDate") or (issue or {}).get("createdAt") or datetime.now(timezone.utc).isoformat()
    try:
        year = datetime.fromisoformat(str(year_source).replace("Z", "+00:00")).year
    except Exception:
        year = datetime.now(timezone.utc).year
    return str(year)[-2:]


def ticket_number_prefix(issue: Optional[Dict[str, Any]]) -> str:
    geo = geo_code_from_issue(issue)
    if not geo:
        return ""
    return f"LL-{office_code_from_issue(issue)}-{geo}-{ticket_year_code(issue)}-"


def parse_ticket_sequence(ticket_number: Any) -> Optional[int]:
    raw = strip_ticket_number_parens(ticket_number)
    match = _SEQ_SUFFIX.search(raw)
    if not match:
        return None
    return int(match.group(1))


def next_ticket_sequence(existing_numbers: Optional[list], issue: Dict[str, Any]) -> int:
    prefix = ticket_number_prefix(issue)
    highest = INITIAL_TICKET_SEQUENCE - 1
    for item in existing_numbers or []:
        raw = strip_ticket_number_parens(item.get("ticketNumber") if isinstance(item, dict) else item)
        if prefix and not raw.startswith(prefix):
            continue
        seq = parse_ticket_sequence(raw)
        if seq is not None and seq > highest:
            highest = seq
    return highest + 1


def allocate_ticket_number(
    issue: Dict[str, Any],
    sequence: Optional[int] = None,
    existing_numbers: Optional[list] = None,
) -> str:
    stored = strip_ticket_number_parens(issue.get("ticketNumber"))
    if stored and sequence is None and existing_numbers is None:
        return stored
    geo = geo_code_from_issue(issue)
    if not geo:
        return stored or raw_ticket_number({**issue, "ticketNumber": ""})
    if sequence is None:
        sequence = next_ticket_sequence(existing_numbers, issue)
    return f"LL-{office_code_from_issue(issue)}-{geo}-{ticket_year_code(issue)}-{int(sequence):06d}"
