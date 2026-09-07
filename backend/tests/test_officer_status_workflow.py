from backend.services.officer_status_workflow import (
    complainant_whatsapp_text,
    mask_phone,
    normalize_status,
    should_preserve_progress_status,
    ticket_display_number,
    validate_officer_status,
    validate_transition,
    volunteer_notification_copy,
)


def test_officer_statuses_only():
    assert validate_officer_status("IN_PROGRESS") is None
    assert validate_officer_status("CLOSED") is not None


def test_rejection_transition_from_assigned():
    assert validate_transition("ASSIGNED", "IN_PROGRESS") is None
    assert validate_transition("ASSIGNED_TO_DEPARTMENT", "REJECTED") is None
    assert validate_transition("CLOSED", "IN_PROGRESS") is not None


def test_volunteer_copy():
    title, msg = volunteer_notification_copy("LL-1002", "IN_PROGRESS", "on site")
    assert title == "Department Started Work"
    assert "LL-1002" in msg


def test_whatsapp_copy_contains_status():
    text = complainant_whatsapp_text("Rama", "LL-9", "RESOLVED", "Fixed")
    assert "RESOLVED" in text
    assert "Fixed" in text
    rejected = complainant_whatsapp_text("Rama", "LL-9", "REJECTED", "Out of scope")
    assert "REJECTED" in rejected
    assert "Out of scope" in rejected


def test_mask_phone():
    assert mask_phone("919876543210").endswith("3210")
    assert "987654" not in mask_phone("919876543210") or "****" in mask_phone("919876543210")


def test_volunteer_recipient_ids_include_creator():
    from backend.services.officer_status_workflow import volunteer_recipient_ids

    ids = volunteer_recipient_ids(
        {
            "assignedVolunteerId": "usr-demo-volunteer",
            "createdBy": "vol-real",
            "createdByRole": "VOLUNTEER",
        }
    )
    assert "usr-demo-volunteer" in ids
    assert "vol-real" in ids


def test_complainant_phone_prefers_ticket_fields():
    from backend.services.officer_status_workflow import complainant_phone_from_issue

    phone = complainant_phone_from_issue(
        {"reporterPhone": "", "citizenPhone": "9876543210"},
        {"reporterPhone": "1111111111"},
    )
    assert phone.endswith("3210")


def test_ticket_number():
    assert ticket_display_number({"id": "iss-ab12"}).startswith("LL-")
    assert normalize_status(" in_progress ") == "IN_PROGRESS"


def test_preserve_progress_from_assignment_writes():
    assert should_preserve_progress_status("IN_PROGRESS", "ASSIGNED") is True
    assert should_preserve_progress_status("RESOLVED", "ASSIGNED") is True
    assert should_preserve_progress_status("ASSIGNED", "ASSIGNED") is False
    assert should_preserve_progress_status("IN_PROGRESS", "RESOLVED") is False
