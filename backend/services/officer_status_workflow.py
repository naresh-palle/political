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


def ticket_display_number(issue: Dict[str, Any]) -> str:
    raw = issue.get("ticketNumber") or issue.get("id") or "LL-TICKET"
    raw = str(raw)
    if raw.startswith("LL-") or raw.startswith("#"):
        return raw if raw.startswith("#") or raw.startswith("LL-") else f"#{raw}"
    if raw.startswith("iss-"):
        return f"LL-{raw.replace('iss-', '')}"
    return f"#{raw}"
