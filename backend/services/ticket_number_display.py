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


CATALOG_OPEN_PREFIX = "iss-ll-sec-open-"
_CATALOG_OPEN_RE = re.compile(r"^iss-ll-sec-open-(\d+)$", re.I)
_CATALOG_ISSUE_RE = re.compile(r"^iss-ll-sec-[a-z]+-\d+$", re.I)
_GENERATED_HEX_ID_RE = re.compile(r"^iss-[0-9a-f]+$", re.I)


def is_generated_hex_issue_id(issue_id: Any) -> bool:
    """Timestamp/uuid hex ids like iss-1a0867aef1e. Empty counts as generated."""
    text = str(issue_id or "").strip()
    if not text:
        return True
    return bool(_GENERATED_HEX_ID_RE.fullmatch(text))


def is_catalog_issue_id(issue_id: Any) -> bool:
    return bool(_CATALOG_ISSUE_RE.fullmatch(str(issue_id or "").strip()))


def _issue_id_from_item(item: Any) -> str:
    if isinstance(item, dict):
        return str(item.get("id") or "").strip()
    return str(item or "").strip()


def next_catalog_open_sequence(existing: Optional[list] = None) -> int:
    highest = 0
    for item in existing or []:
        match = _CATALOG_OPEN_RE.fullmatch(_issue_id_from_item(item))
        if match:
            highest = max(highest, int(match.group(1)))
    return highest + 1


def allocate_catalog_issue_id(existing: Optional[list] = None, candidate: Any = None) -> str:
    """Next seed-style id: iss-ll-sec-open-03 after open-01/open-02. Drops hex timestamps."""
    existing_ids = {raw for raw in (_issue_id_from_item(item) for item in existing or []) if raw}
    text = str(candidate or "").strip()
    if text and not is_generated_hex_issue_id(text) and text not in existing_ids:
        return text
    seq = next_catalog_open_sequence(existing)
    while True:
        issue_id = f"{CATALOG_OPEN_PREFIX}{seq:02d}"
        if issue_id not in existing_ids:
            return issue_id
        seq += 1


def whatsapp_ticket_ref(issue: Optional[Dict[str, Any]]) -> str:
    """Public ticket string for Meta templates. Catalog id, never a hex timestamp."""
    if not issue:
        return "ticket"
    issue_id = str(issue.get("id") or "").strip()
    if is_catalog_issue_id(issue_id):
        return issue_id
    label = strip_ticket_number_parens(issue.get("ticketLabel") or issue.get("ticketNumber"))
    if is_catalog_issue_id(label):
        return label
    if label:
        return label
    if issue_id and not is_generated_hex_issue_id(issue_id):
        return issue_id
    return issue_id or "ticket"
