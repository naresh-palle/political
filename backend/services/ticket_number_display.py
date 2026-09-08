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


def allocate_ticket_number(issue: Dict[str, Any], sequence: Optional[int] = None) -> str:
    existing = strip_ticket_number_parens(issue.get("ticketNumber"))
    if existing:
        return existing
    geo = geo_code_from_issue(issue)
    if not geo:
        return raw_ticket_number(issue)
    year_source = issue.get("reportedDate") or issue.get("createdAt") or datetime.now(timezone.utc).isoformat()
    try:
        year = str(datetime.fromisoformat(str(year_source).replace("Z", "+00:00")).year)[-2:]
    except Exception:
        year = str(datetime.now(timezone.utc).year)[-2:]
    if sequence is None:
        sequence = int(datetime.now(timezone.utc).timestamp() * 1000) % 1_000_000
    return f"LL-{office_code_from_issue(issue)}-{geo}-{year}-{int(sequence):06d}"
