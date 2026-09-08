from backend.services.officer_status_workflow import (
    complainant_whatsapp_text,
    mask_phone,
    normalize_status,
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


def test_complainant_template_parameters_match_status_update_v1():
    from backend.services.officer_status_workflow import complainant_template_parameters

    params = complainant_template_parameters("Rama", "LL-9", "IN_PROGRESS", "")
    assert params[0] == "Rama"
    assert params[1] == "LL-9"
    assert params[2] == "IN PROGRESS"
    assert "started working" in params[3].lower()
    resolved = complainant_template_parameters("Rama", "#iss-1", "RESOLVED", "Drain cleared at Ward 4")
    assert resolved[1] == "iss-1"
    assert resolved[2] == "RESOLVED"
    assert "Drain cleared" in resolved[3]


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


def test_preserve_in_progress_against_open():
    from backend.services.officer_status_workflow import merge_issue_docs, should_preserve_progress_status

    assert should_preserve_progress_status("IN_PROGRESS", "NEW")
    assert should_preserve_progress_status("IN_PROGRESS", "ASSIGNED")
    assert not should_preserve_progress_status("IN_PROGRESS", "RESOLVED")
    merged = merge_issue_docs(
        {"id": "iss-1", "status": "IN_PROGRESS", "lastStatusRemarks": "on site"},
        {"id": "iss-1", "status": "NEW", "title": "seed"},
    )
    assert merged["status"] == "IN_PROGRESS"
    assert merged["lastStatusRemarks"] == "on site"
    assert merged["title"] == "seed"
    assigned = merge_issue_docs(
        {
            "id": "iss-2",
            "status": "ASSIGNED",
            "assignedVolunteerId": "usr-demo-volunteer",
            "department": "R&B",
        },
        {"id": "iss-2", "status": "NEW"},
    )
    assert assigned["status"] == "ASSIGNED"
    assert assigned["assignedVolunteerId"] == "usr-demo-volunteer"
    assert assigned["department"] == "R&B"
    assert ticket_display_number({"id": "iss-ab12"}).startswith("LL-")
    assert normalize_status(" in_progress ") == "IN_PROGRESS"


def test_assignment_reopens_rejected():
    from backend.services.officer_status_workflow import assignment_reopens_rejected, should_preserve_progress_status

    assert assignment_reopens_rejected("REJECTED", "ASSIGNED")
    assert not assignment_reopens_rejected("IN_PROGRESS", "ASSIGNED")
    assert should_preserve_progress_status("REJECTED", "ASSIGNED")
    assert should_preserve_progress_status("IN_PROGRESS", "ASSIGNED")


def test_merge_keeps_officer_remarks_when_assignment_overlay_has_text():
    from backend.services.officer_status_workflow import merge_issue_docs

    merged = merge_issue_docs(
        {
            "id": "iss-1",
            "status": "IN_PROGRESS",
            "lastStatusRemarks": "crew on site",
            "lastStatusUpdateAt": "2026-09-07T10:00:00Z",
        },
        {
            "id": "iss-1",
            "status": "ASSIGNED",
            "lastStatusRemarks": "Department assigned to R&B",
            "title": "Pothole",
        },
    )
    assert merged["status"] == "IN_PROGRESS"
    assert merged["lastStatusRemarks"] == "crew on site"
    assert merged["title"] == "Pothole"


def test_complainant_template_request_uses_status_update_v1():
    from backend.services.whatsapp_service import WhatsAppCloudApiClient

    client = WhatsAppCloudApiClient()
    body = client._complainant_status_request_body(
        "919876543210",
        {
            "complainantName": "Rama",
            "ticketNumber": "LL-9",
            "newStatus": "RESOLVED",
            "remarks": "Fixed at site",
        },
        shape="body",
    )
    assert body["template"]["name"] == "complainant_status_update_v1"
    params = body["template"]["components"][0]["parameters"]
    assert [p["text"] for p in params] == ["Rama", "LL-9", "RESOLVED", "Fixed at site"]
    assert client.complainant_template_name == "complainant_status_update_v1"


def test_runtime_persist_prevents_seed_assigned_from_winning(tmp_path, monkeypatch):
    from backend import server as srv

    runtime_path = tmp_path / ".runtime_field_issues.json"
    monkeypatch.setattr(srv, "RUNTIME_FIELD_ISSUES_PATH", runtime_path)
    srv.persist_field_issue(
        {
            "id": "iss-ll-sec-open-01",
            "status": "IN_PROGRESS",
            "lastStatusRemarks": "Cleaning started at Ward 4",
            "lastStatusUpdateAt": "2026-09-07T16:00:00Z",
        }
    )
    loaded = srv.load_json_fallback("field_issues.json")
    found = next((i for i in loaded if i.get("id") == "iss-ll-sec-open-01"), None)
    assert found is not None
    assert found["status"] == "IN_PROGRESS"
    assert found["lastStatusRemarks"] == "Cleaning started at Ward 4"
