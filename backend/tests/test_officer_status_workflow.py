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


def test_officer_dropdown_skips_current_status():
    from backend.services.officer_status_workflow import next_officer_statuses

    assert next_officer_statuses("ASSIGNED") == ["IN_PROGRESS", "RESOLVED", "REJECTED"]
    assert next_officer_statuses("IN_PROGRESS") == ["RESOLVED", "REJECTED"]
    assert next_officer_statuses("RESOLVED") == []
    assert next_officer_statuses("REJECTED") == []
    assert validate_transition("IN_PROGRESS", "IN_PROGRESS") is not None
    assert validate_transition("IN_PROGRESS", "RESOLVED") is None
    assert validate_transition("RESOLVED", "REJECTED") is not None
    assert validate_transition("RESOLVED", "RESOLVED") is not None


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
    nested = complainant_phone_from_issue(
        {"reporterPhone": ""},
        {"ticket": {"reporterPhone": "+91 98765 43003"}},
    )
    assert nested.endswith("43003")


def test_complainant_click_to_chat_uses_ticket_phone_not_directory():
    from backend.services.officer_status_workflow import complainant_click_to_chat_url

    url = complainant_click_to_chat_url("9876543210", "Hello citizen")
    assert url.startswith("https://wa.me/919876543210?text=")
    assert "Hello" in url


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


def test_issue_from_client_payload_ignores_target_status():
    from backend.services.officer_status_workflow import issue_from_client_payload

    issue = issue_from_client_payload(
        "iss-1a081309359",
        {
            "status": "IN_PROGRESS",
            "remarks": "Started",
            "title": "Broken street light on Ward 2",
            "reportedBy": "K. Rao",
        },
    )
    assert issue["id"] == "iss-1a081309359"
    assert issue["status"] == "ASSIGNED"
    assert issue["title"] == "Broken street light on Ward 2"
    assert "remarks" not in issue


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
    assert body["template"]["language"]["code"] == "en"
    params = body["template"]["components"][0]["parameters"]
    assert [p["parameter_name"] for p in params] == ["name", "ticket", "status", "detail"]
    assert [p["text"] for p in params] == ["Rama", "LL-9", "RESOLVED", "Fixed at site"]
    assert client.complainant_template_name == "complainant_status_update_v1"


def test_complainant_template_positional_omits_parameter_name():
    from backend.services.whatsapp_service import WhatsAppCloudApiClient

    client = WhatsAppCloudApiClient()
    body = client._complainant_status_request_body(
        "919876543210",
        {
            "complainantName": "Rama",
            "ticketNumber": "LL-9",
            "newStatus": "IN_PROGRESS",
            "remarks": "Started\non site",
        },
        shape="body",
        param_style="positional",
        language="en_US",
    )
    params = body["template"]["components"][0]["parameters"]
    assert "parameter_name" not in params[0]
    assert params[3]["text"] == "Started on site"
    assert body["template"]["language"]["code"] == "en_US"


def test_complainant_template_retries_positional_after_named_reject(monkeypatch):
    import asyncio
    from backend.services.whatsapp_service import WhatsAppCloudApiClient

    client = WhatsAppCloudApiClient()
    client.enabled = True
    client.phone_number_id = "1"
    client.access_token = "token"
    calls = []

    async def fake_post(body):
        calls.append(body)
        if len(calls) == 1:
            return {
                "status_code": 400,
                "res_json": {"error": {"code": 132018, "message": "Named parameter missing"}},
                "error_msg_fallback": "",
            }
        return {
            "status_code": 200,
            "res_json": {"messages": [{"id": "wamid.ok"}]},
            "error_msg_fallback": "",
        }

    monkeypatch.setattr(client, "_post_graph", fake_post)
    result = asyncio.run(
        client.send_whatsapp_notification(
            {
                "recipientPhone": "9876543210",
                "messageKind": "COMPLAINANT_STATUS",
                "templateName": "complainant_status_update_v1",
                "complainantName": "Rama",
                "ticketNumber": "LL-9",
                "newStatus": "RESOLVED",
                "remarks": "Fixed",
            }
        )
    )
    assert result["status"] == "SENT"
    assert calls[0]["template"]["components"][0]["parameters"][0].get("parameter_name") == "name"
    assert "parameter_name" not in calls[1]["template"]["components"][0]["parameters"][0]


def test_whatsapp_auth_error_does_not_retry_template_shapes(monkeypatch):
    import asyncio
    from backend.services.whatsapp_service import WhatsAppCloudApiClient

    client = WhatsAppCloudApiClient()
    client.enabled = True
    client.phone_number_id = "1326513833874482"
    client.access_token = "expired-token"
    calls = []

    async def fake_post(body):
        calls.append(body)
        return {
            "status_code": 401,
            "res_json": {"error": {"code": 190, "message": "Authentication Error", "type": "OAuthException"}},
            "error_msg_fallback": "Authentication Error",
        }

    monkeypatch.setattr(client, "_post_graph", fake_post)
    result = asyncio.run(
        client.send_whatsapp_notification(
            {
                "recipientPhone": "7893015454",
                "messageKind": "COMPLAINANT_STATUS",
                "templateName": "complainant_status_update_v1",
                "complainantName": "Citizen",
                "ticketNumber": "LL-1a081309359",
                "newStatus": "RESOLVED",
                "remarks": "Work completed",
            }
        )
    )
    assert len(calls) == 1
    assert result["status"] == "FAILED"
    assert result["errorCode"] == "190"
    assert result["metaHttpStatus"] == 401
    assert "WHATSAPP_ACCESS_TOKEN" in result["errorMessage"]


def test_whatsapp_131030_does_not_retry_and_skips_allowed_list(monkeypatch):
    import asyncio
    from backend.services.whatsapp_service import WhatsAppCloudApiClient, META_RECIPIENT_LIST_MESSAGE

    client = WhatsAppCloudApiClient()
    client.enabled = True
    client.phone_number_id = "1"
    client.access_token = "token"
    calls = []

    async def fake_post(body):
        calls.append(body)
        return {
            "status_code": 400,
            "res_json": {
                "error": {
                    "code": 131030,
                    "message": "(#131030) Recipient phone number not in allowed list",
                }
            },
            "error_msg_fallback": "Recipient phone number not in allowed list",
        }

    monkeypatch.setattr(client, "_post_graph", fake_post)
    result = asyncio.run(
        client.send_whatsapp_notification(
            {
                "recipientPhone": "7893015454",
                "messageKind": "COMPLAINANT_STATUS",
                "templateName": "complainant_status_update_v1",
                "complainantName": "Walk-in Citizen",
                "ticketNumber": "LL-walkin-1",
                "newStatus": "RESOLVED",
                "remarks": "Work completed",
            }
        )
    )
    assert len(calls) == 1
    assert result["status"] == "FAILED"
    assert result["errorCode"] == "131030"
    assert result["errorMessage"] == META_RECIPIENT_LIST_MESSAGE
    assert "Contact Database" in result["errorMessage"]


def test_clean_meta_secret_strips_bearer_and_quotes():
    from backend.services.whatsapp_service import _clean_meta_secret

    assert _clean_meta_secret('Bearer EAAG123') == "EAAG123"
    assert _clean_meta_secret('"EAAG123"') == "EAAG123"


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
