"""Authoritative officer ticket status transitions, copy, and audit helpers."""
from __future__ import annotations

from typing import Any, Dict, Optional, Tuple

OFFICER_STATUSES = ("IN_PROGRESS", "RESOLVED", "REJECTED")

ALLOWED_TRANSITIONS = {
    "NEW": ["IN_PROGRESS", "RESOLVED", "REJECTED", "ASSIGNED", "ACKNOWLEDGED", "ASSIGNED_TO_DEPARTMENT"],
    "ASSIGNED": ["IN_PROGRESS", "RESOLVED", "REJECTED", "ACKNOWLEDGED"],
    "ASSIGNED_TO_DEPARTMENT": ["IN_PROGRESS", "RESOLVED", "REJECTED", "ACKNOWLEDGED"],
    "ACKNOWLEDGED": ["IN_PROGRESS", "RESOLVED", "REJECTED"],
    "IN_PROGRESS": ["RESOLVED", "REJECTED", "IN_PROGRESS"],
    "RESOLVED": ["RESOLVED"],
    "REJECTED": ["REJECTED"],
}

EVENT_BY_STATUS = {
    "IN_PROGRESS": "TICKET_STARTED",
    "RESOLVED": "TICKET_RESOLVED",
    "REJECTED": "TICKET_REJECTED",
}


def normalize_status(value: Optional[str]) -> str:
    return (value or "").strip().upper()


def validate_officer_status(new_status: str) -> Optional[str]:
    if new_status not in OFFICER_STATUSES:
        return (
            f"Invalid officer status action '{new_status}'. "
            "Allowed officer statuses: IN_PROGRESS, RESOLVED, REJECTED."
        )
    return None


def validate_transition(current_status: str, new_status: str) -> Optional[str]:
    if current_status == "CLOSED":
        return "Ticket is permanently CLOSED and cannot be modified by Department Officers."
    valid_next = ALLOWED_TRANSITIONS.get(current_status, list(OFFICER_STATUSES))
    if new_status not in valid_next:
        return f"Invalid status transition from '{current_status}' to '{new_status}'."
    return None


def volunteer_notification_copy(ticket_number: str, new_status: str, remarks: str) -> Tuple[str, str]:
    if new_status == "IN_PROGRESS":
        return (
            "Department Started Work",
            f"The concerned department has started work on ticket {ticket_number}.",
        )
    if new_status == "RESOLVED":
        extra = f" Remarks: {remarks}" if remarks else ""
        return (
            "Ticket Resolved",
            f"The concerned department has marked ticket {ticket_number} as resolved.{extra}",
        )
    extra = f" Reason: {remarks}" if remarks else ""
    return (
        "Ticket Rejected",
        f"The concerned department has rejected ticket {ticket_number}.{extra}",
    )


def sanitize_template_text(value: Any, limit: int = 60) -> str:
    """Meta rejects newlines and empty named/positional template parameters."""
    text = " ".join(str(value or "").replace("\r", " ").replace("\n", " ").replace("\t", " ").split())
    text = text.replace("{{", "").replace("}}", "")
    return (text or "-")[:limit]


def complainant_status_detail(new_status: str, remarks: str) -> str:
    """Fourth body parameter for complainant_status_update_v1 (Meta 60-char named params)."""
    notes = sanitize_template_text(remarks, 60)
    if notes == "-":
        notes = ""
    if new_status == "IN_PROGRESS":
        return notes or "The concerned department has started working on the issue."
    if new_status == "RESOLVED":
        return notes or "The concerned department has reported that the issue is resolved."
    if new_status == "REJECTED":
        return notes or "The concerned department has not accepted the issue."
    return notes or "There is an update on your complaint."


def complainant_template_parameters(
    complainant_name: str,
    ticket_number: str,
    new_status: str,
    remarks: str,
) -> list:
    name = sanitize_template_text(complainant_name or "Citizen")
    if name == "-":
        name = "Citizen"
    ticket = sanitize_template_text((ticket_number or "ticket").replace("#", "") or "ticket")
    status_label = sanitize_template_text(normalize_status(new_status).replace("_", " ") or "UPDATED")
    return [
        name,
        ticket,
        status_label,
        sanitize_template_text(complainant_status_detail(new_status, remarks)),
    ]


def complainant_whatsapp_text(
    complainant_name: str,
    ticket_number: str,
    new_status: str,
    remarks: str,
) -> str:
    name = complainant_name or "Citizen"
    if new_status == "IN_PROGRESS":
        return (
            f"Hello {name},\n\n"
            "There is an update on your complaint.\n\n"
            f"Ticket: {ticket_number}\n\n"
            "Status: IN PROGRESS\n\n"
            "The concerned department has started working on the issue.\n\n"
            "Thank you,\nLeaderLens"
        )
    if new_status == "RESOLVED":
        return (
            f"Hello {name},\n\n"
            "There is an update on your complaint.\n\n"
            f"Ticket: {ticket_number}\n\n"
            "Status: RESOLVED\n\n"
            "The concerned department has reported that the issue has been resolved.\n\n"
            f"Resolution:\n{remarks}\n\n"
            "Thank you,\nLeaderLens"
        )
    return (
        f"Hello {name},\n\n"
        "There is an update on your complaint.\n\n"
        f"Ticket: {ticket_number}\n\n"
        "Status: REJECTED\n\n"
        "The concerned department has not accepted the issue for processing.\n\n"
        f"Reason:\n{remarks}\n\n"
        "Thank you,\nLeaderLens"
    )


def mask_phone(phone: str) -> str:
    digits = "".join(ch for ch in (phone or "") if ch.isdigit())
    if len(digits) < 4:
        return "***"
    return f"{digits[:-4]}****{digits[-4:]}" if len(digits) > 4 else f"****{digits}"


def first_phone(*values: Any) -> str:
    for value in values:
        if not value:
            continue
        digits = "".join(ch for ch in str(value) if ch.isdigit())
        if len(digits) >= 10:
            return digits
    return ""


def complainant_phone_from_issue(issue: Dict[str, Any], payload: Optional[Dict[str, Any]] = None) -> str:
    payload = payload or {}
    nested = payload.get("ticket") if isinstance(payload.get("ticket"), dict) else {}
    return first_phone(
        issue.get("reporterPhone"),
        issue.get("citizenPhone"),
        issue.get("contactPhone"),
        issue.get("phone"),
        issue.get("mobile"),
        issue.get("reporterMobile"),
        nested.get("reporterPhone"),
        nested.get("citizenPhone"),
        payload.get("reporterPhone"),
        payload.get("citizenPhone"),
    )


def volunteer_recipient_ids(issue: Dict[str, Any]) -> list:
    ids: list = []
    assigned = issue.get("assignedVolunteerId")
    created = issue.get("createdBy")
    created_role = (issue.get("createdByRole") or "VOLUNTEER").upper()
    if assigned and str(assigned) != "system":
        ids.append(str(assigned))
    if created and created_role == "VOLUNTEER" and str(created) != "system" and str(created) not in ids:
        ids.append(str(created))
    return ids


def volunteer_phone_from_issue(issue: Dict[str, Any]) -> str:
    return first_phone(
        issue.get("assignedVolunteerPhone"),
        issue.get("volunteerPhone"),
        issue.get("createdByPhone"),
    )


OFFICER_LOCKED_STATUSES = frozenset({"IN_PROGRESS", "RESOLVED", "REJECTED", "COMPLETED", "CLOSED"})
WEAKER_THAN_OFFICER = frozenset(
    {"NEW", "ASSIGNED", "ACKNOWLEDGED", "ASSIGNED_TO_DEPARTMENT", "OPEN", "OPEN_UNASSIGNED", ""}
)


def is_officer_locked_status(status: Optional[str]) -> bool:
    return normalize_status(status) in OFFICER_LOCKED_STATUSES


def should_preserve_progress_status(current_status: Optional[str], incoming_status: Optional[str]) -> bool:
    """Do not let assign-notify, seed JSON, or stale Mongo overwrite officer work."""
    current = normalize_status(current_status)
    incoming = normalize_status(incoming_status)
    if current not in OFFICER_LOCKED_STATUSES:
        return False
    if incoming in OFFICER_LOCKED_STATUSES:
        return False
    return incoming in WEAKER_THAN_OFFICER or incoming not in OFFICER_LOCKED_STATUSES


ASSIGNMENT_STATUSES = frozenset({"ASSIGNED", "ACKNOWLEDGED", "ASSIGNED_TO_DEPARTMENT"})


def assignment_reopens_rejected(current_status: Optional[str], incoming_status: Optional[str]) -> bool:
    """Volunteer resend after officer rejection may reopen the ticket to ASSIGNED."""
    return (
        normalize_status(current_status) == "REJECTED"
        and normalize_status(incoming_status) in ASSIGNMENT_STATUSES
    )


STATUS_RANK = {
    "NEW": 1,
    "OPEN": 1,
    "PENDING": 1,
    "UNRESOLVED": 1,
    "ASSIGNED": 2,
    "ACKNOWLEDGED": 2,
    "ASSIGNED_TO_DEPARTMENT": 2,
    "IN_PROGRESS": 3,
    "OVERDUE": 3,
    "RESOLVED": 4,
    "COMPLETED": 4,
    "REJECTED": 4,
    "CLOSED": 5,
}
IDENTITY_FIELDS = (
    "assignedVolunteerId",
    "assignedVolunteerName",
    "assignedVolunteerPhone",
    "assignedDepartment",
    "assignedOfficialName",
    "assignedOfficialPhone",
    "department",
    "departmentContactId",
    "completedDepartment",
    "completedByPerson",
    "createdBy",
    "createdByRole",
    "createdByPhone",
    "directorId",
    "directorName",
    "reporterPhone",
    "reportedBy",
    "reporterType",
    "reporterDesignation",
    "title",
    "description",
    "category",
    "priority",
    "issueType",
    "mandalId",
    "mandalName",
    "villageId",
    "villageName",
    "placeName",
    "stateId",
    "assemblyConstituencyId",
    "assemblyConstituencyName",
    "ticketNumber",
)


def _has_value(value: Any) -> bool:
    if value is None:
        return False
    if isinstance(value, str) and not value.strip():
        return False
    if isinstance(value, (list, dict)) and len(value) == 0:
        return False
    return True


def issue_from_client_payload(issue_id: str, payload: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Hydrate a ticket when Mongo/JSON never stored a volunteer-created id."""
    payload = payload or {}
    nested = payload.get("ticket") if isinstance(payload.get("ticket"), dict) else {}
    merged = {**nested}
    for key, value in payload.items():
        if key in {"ticket", "status", "newStatus", "remarks", "rejectionReason", "notes", "proofUrl", "proofFiles"}:
            continue
        if _has_value(value):
            merged[key] = value
    issue: Dict[str, Any] = {"id": issue_id, "status": "ASSIGNED"}
    for key in IDENTITY_FIELDS:
        if _has_value(merged.get(key)):
            issue[key] = merged[key]
    for key in (
        "citizenPhone",
        "citizenGender",
        "citizenAge",
        "schemeSubDetail",
        "initialRemarks",
        "dueDate",
        "reportedDate",
        "attachments",
        "assignedAt",
    ):
        if _has_value(merged.get(key)):
            issue[key] = merged[key]
    if not issue.get("title"):
        issue["title"] = f"Grievance Ticket #{issue_id}"
    return issue


def apply_assignment_fields(issue: Dict[str, Any], payload: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    payload = payload or {}
    updated = dict(issue)
    mapping = {
        "assignedVolunteerId": payload.get("assignedVolunteerId"),
        "assignedVolunteerName": payload.get("assignedVolunteerName"),
        "assignedVolunteerPhone": payload.get("assignedVolunteerPhone"),
        "assignedDepartment": payload.get("assignedDepartment") or payload.get("department"),
        "department": payload.get("department") or payload.get("assignedDepartment"),
        "assignedOfficialName": payload.get("assignedOfficialName"),
        "assignedOfficialPhone": payload.get("assignedOfficialPhone"),
        "departmentContactId": payload.get("departmentContactId"),
    }
    for key, value in mapping.items():
        if _has_value(value):
            updated[key] = value
    return updated


def merge_issue_docs(base: Optional[Dict[str, Any]], overlay: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    """Merge tickets without dropping assignment data or reverting officer work."""
    if not base:
        return dict(overlay or {})
    if not overlay:
        return dict(base)
    merged = {**base, **overlay}
    for key in IDENTITY_FIELDS:
        if not _has_value(overlay.get(key)) and _has_value(base.get(key)):
            merged[key] = base.get(key)
    base_atts = base.get("attachments") if isinstance(base.get("attachments"), list) else []
    over_atts = overlay.get("attachments") if isinstance(overlay.get("attachments"), list) else []
    if base_atts or over_atts:
        merged["attachments"] = list(dict.fromkeys([*base_atts, *over_atts]))
    base_st = normalize_status(base.get("status"))
    over_st = normalize_status(overlay.get("status"))
    if STATUS_RANK.get(base_st, 0) > STATUS_RANK.get(over_st, 0) or should_preserve_progress_status(base_st, over_st):
        merged["status"] = base.get("status")
        for key in ("lastStatusRemarks", "lastStatusUpdateAt", "lastStatusProof"):
            if _has_value(base.get(key)):
                merged[key] = base.get(key)
    return merged


def ticket_display_number(issue: Dict[str, Any]) -> str:
    raw = issue.get("ticketNumber") or issue.get("id") or "LL-TICKET"
    raw = str(raw)
    if raw.startswith("LL-") or raw.startswith("#"):
        return raw if raw.startswith("#") or raw.startswith("LL-") else f"#{raw}"
    if raw.startswith("iss-"):
        return f"LL-{raw.replace('iss-', '')}"
    return f"#{raw}"
