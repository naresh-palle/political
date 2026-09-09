from unittest.mock import AsyncMock, MagicMock

from backend.services.officer_status_workflow import validate_officer_status


class _Cursor:
    def __init__(self, docs):
        self.docs = docs

    def sort(self, *args, **kwargs):
        return self

    async def to_list(self, length=None):
        return list(self.docs)


def _issue(volunteer_id="vol-a", status="ASSIGNED"):
    return {
        "id": "iss-e2e-1",
        "status": status,
        "assignedVolunteerId": volunteer_id,
        "createdBy": volunteer_id,
        "createdByRole": "VOLUNTEER",
        "assignedVolunteerName": "Volunteer A",
        "reporterPhone": "9876543210",
        "reportedBy": "Complaint Person A",
        "assignedOfficialName": "Officer A",
        "department": "R&B",
        "title": "Pothole",
    }


def test_officer_status_creates_volunteer_notification_and_audit(monkeypatch):
    import asyncio
    from backend import server as srv

    srv.IN_MEMORY_FIELD_ISSUES.clear()
    srv.IN_MEMORY_NOTIFICATIONS.clear()
    srv.IN_MEMORY_ISSUE_HISTORY.clear()
    srv.IN_MEMORY_NOTIFICATION_AUDITS.clear()
    srv.IN_MEMORY_STATUS_IDEMPOTENCY.clear()

    issue = _issue()

    mock_issues = MagicMock()
    mock_issues.find_one = AsyncMock(return_value=dict(issue))
    mock_issues.update_one = AsyncMock(return_value=MagicMock(matched_count=1, upserted_id=None))
    mock_issues.find = MagicMock(return_value=_Cursor([issue]))

    mock_col = MagicMock()
    mock_col.insert_one = AsyncMock(return_value=None)
    mock_col.find = MagicMock(return_value=_Cursor([]))
    mock_col.find_one = AsyncMock(return_value=None)

    class _DB:
        field_issues = mock_issues
        issue_history = mock_col
        work_updates = mock_col
        notifications = mock_col
        field_notifications = mock_col
        notification_audits = mock_col

    monkeypatch.setattr(srv, "db", _DB())

    async def fake_wa(payload):
        assert payload.get("messageKind") == "COMPLAINANT_STATUS"
        assert payload.get("templateName") == "complainant_status_update_v1"
        assert payload.get("recipientPhone") in ("9876543210", "919876543210")
        return {
            "success": False,
            "status": "FAILED",
            "errorCode": "MISSING_CREDENTIALS",
            "errorMessage": "not configured",
            "providerMessageId": None,
        }

    monkeypatch.setattr(srv.whatsapp_client, "send_whatsapp_notification", fake_wa)

    result = asyncio.run(
        srv.update_field_issue_status(
            "iss-e2e-1",
            {
                "status": "IN_PROGRESS",
                "remarks": "Work started at site.",
                "assignedVolunteerId": "vol-hacker",
                "reporterPhone": "1111111111",
            },
        )
    )

    assert result["ticket"]["status"] == "IN_PROGRESS"
    assert result["volunteerNotification"]["status"] == "CREATED"
    assert result["volunteerNotification"]["resourceId"] == "iss-e2e-1"
    assert result["complainantNotification"]["status"] == "FAILED"
    assert srv.IN_MEMORY_NOTIFICATIONS[0]["recipientUserId"] == "vol-a"
    assert srv.IN_MEMORY_NOTIFICATIONS[0]["resourceType"] == "ISSUE"
    assert srv.IN_MEMORY_FIELD_ISSUES["iss-e2e-1"]["status"] == "IN_PROGRESS"
    assert srv.IN_MEMORY_ISSUE_HISTORY[0]["previousStatus"] == "ASSIGNED"


def test_complainant_131030_returns_ticket_whatsapp_link(monkeypatch):
    import asyncio
    from backend import server as srv

    srv.IN_MEMORY_FIELD_ISSUES.clear()
    srv.IN_MEMORY_NOTIFICATIONS.clear()
    srv.IN_MEMORY_ISSUE_HISTORY.clear()
    srv.IN_MEMORY_NOTIFICATION_AUDITS.clear()
    srv.IN_MEMORY_STATUS_IDEMPOTENCY.clear()

    issue = _issue()
    mock_issues = MagicMock()
    mock_issues.find_one = AsyncMock(return_value=dict(issue))
    mock_issues.update_one = AsyncMock(return_value=MagicMock(matched_count=1, upserted_id=None))
    mock_col = MagicMock()
    mock_col.insert_one = AsyncMock(return_value=None)
    mock_col.find = MagicMock(return_value=_Cursor([]))
    mock_col.find_one = AsyncMock(return_value=None)

    class _DB:
        field_issues = mock_issues
        issue_history = mock_col
        work_updates = mock_col
        notifications = mock_col
        field_notifications = mock_col
        notification_audits = mock_col

    monkeypatch.setattr(srv, "db", _DB())

    async def fake_wa(payload):
        assert payload.get("recipientPhone") in ("9876543210", "919876543210")
        return {
            "success": False,
            "status": "FAILED",
            "errorCode": "131030",
            "errorMessage": "allowed list",
            "providerMessageId": None,
        }

    monkeypatch.setattr(srv.whatsapp_client, "send_whatsapp_notification", fake_wa)
    result = asyncio.run(
        srv.update_field_issue_status("iss-e2e-1", {"status": "IN_PROGRESS", "remarks": "Work started at site."})
    )
    notify = result["complainantNotification"]
    assert notify["status"] == "FAILED"
    assert notify["errorCode"] == "131030"
    assert notify["phoneSource"] == "TICKET"
    assert notify["clickToChatUrl"].startswith("https://wa.me/919876543210")
    assert "directory" in result["message"].lower() or "ticket" in result["message"].lower()


def test_assign_notify_does_not_overwrite_in_progress(monkeypatch):
    import asyncio
    from backend import server as srv

    srv.IN_MEMORY_FIELD_ISSUES["iss-e2e-1"] = {
        **_issue(status="IN_PROGRESS"),
        "lastStatusRemarks": "on site",
    }

    mock_issues = MagicMock()
    mock_issues.find_one = AsyncMock(return_value=_issue(status="IN_PROGRESS"))
    mock_issues.update_one = AsyncMock(return_value=MagicMock(matched_count=1))

    class _DB:
        field_issues = mock_issues
        users = MagicMock()
        notification_audits = MagicMock()

    _DB.users.find_one = AsyncMock(return_value=None)
    _DB.notification_audits.insert_one = AsyncMock(return_value=None)
    monkeypatch.setattr(srv, "db", _DB())
    monkeypatch.setattr(
        srv.whatsapp_client,
        "send_whatsapp_notification",
        AsyncMock(return_value={"success": True, "status": "SENT"}),
    )

    result = asyncio.run(
        srv.assign_and_notify_whatsapp("iss-e2e-1", {"assignedDeptName": "R&B", "assignedOfficialName": "Officer A"})
    )
    assert result["issue"]["status"] == "IN_PROGRESS"
    args = mock_issues.update_one.await_args
    assert args[0][1]["$set"].get("status") != "ASSIGNED"


def test_assign_notify_reopens_rejected(monkeypatch):
    import asyncio
    from backend import server as srv

    rejected = {
        **_issue(status="REJECTED"),
        "lastStatusRemarks": "Out of scope",
    }
    srv.IN_MEMORY_FIELD_ISSUES["iss-e2e-1"] = dict(rejected)

    mock_issues = MagicMock()
    mock_issues.find_one = AsyncMock(return_value=dict(rejected))
    mock_issues.update_one = AsyncMock(return_value=MagicMock(matched_count=1))

    class _DB:
        field_issues = mock_issues
        users = MagicMock()
        notification_audits = MagicMock()

    _DB.users.find_one = AsyncMock(return_value=None)
    _DB.notification_audits.insert_one = AsyncMock(return_value=None)
    monkeypatch.setattr(srv, "db", _DB())
    monkeypatch.setattr(
        srv.whatsapp_client,
        "send_whatsapp_notification",
        AsyncMock(return_value={"success": True, "status": "SENT"}),
    )

    result = asyncio.run(
        srv.assign_and_notify_whatsapp(
            "iss-e2e-1",
            {"assignedDeptName": "R&B", "assignedOfficialName": "Officer A"},
        )
    )
    assert result["issue"]["status"] == "ASSIGNED"
    args = mock_issues.update_one.await_args
    assert args[0][1]["$set"].get("status") == "ASSIGNED"


def test_volunteer_assignment_saves_department_without_mongo(monkeypatch):
    import asyncio
    from backend import server as srv

    srv.IN_MEMORY_FIELD_ISSUES.clear()
    srv.IN_MEMORY_FIELD_ISSUES["iss-e2e-1"] = _issue(status="NEW")
    monkeypatch.setattr(srv, "_mongo_circuit_open", True)
    monkeypatch.setattr(srv, "db", srv._OfflineDB())

    result = asyncio.run(
        srv.update_field_issue_status(
            "iss-e2e-1",
            {
                "status": "ASSIGNED",
                "department": "1. Panchayat Raj – Engineering Department",
                "assignedOfficialName": "Dept Officer",
                "assignedOfficialPhone": "9885044003",
                "remarks": "Department assigned",
            },
        )
    )
    assert result["ticket"]["status"] == "ASSIGNED"
    assert "Panchayat Raj" in result["ticket"]["department"]
    assert result["ticket"]["assignedOfficialName"] == "Dept Officer"
    assert srv.IN_MEMORY_FIELD_ISSUES["iss-e2e-1"]["status"] == "ASSIGNED"


def test_volunteer_status_assignment_reopens_rejected(monkeypatch):
    import asyncio
    from backend import server as srv

    srv.IN_MEMORY_FIELD_ISSUES.clear()
    srv.IN_MEMORY_FIELD_ISSUES["iss-e2e-1"] = {
        **_issue(status="REJECTED"),
        "lastStatusRemarks": "Out of jurisdiction",
    }
    monkeypatch.setattr(srv, "_mongo_circuit_open", True)
    monkeypatch.setattr(srv, "db", srv._OfflineDB())

    result = asyncio.run(
        srv.update_field_issue_status(
            "iss-e2e-1",
            {
                "status": "ASSIGNED",
                "department": "R&B",
                "assignedOfficialName": "Officer A",
                "remarks": "Resent to officer after rejection",
            },
        )
    )
    assert result["ticket"]["status"] == "ASSIGNED"
    assert srv.IN_MEMORY_FIELD_ISSUES["iss-e2e-1"]["status"] == "ASSIGNED"


def test_rejected_without_reason_is_422():
    import asyncio
    from fastapi import HTTPException
    from backend import server as srv

    srv.IN_MEMORY_FIELD_ISSUES["iss-e2e-1"] = _issue(status="ASSIGNED")

    async def run():
        await srv.update_field_issue_status("iss-e2e-1", {"status": "REJECTED", "remarks": ""})

    try:
        asyncio.run(run())
        assert False, "expected HTTPException"
    except HTTPException as exc:
        assert exc.status_code == 422


def test_resolved_and_rejected_propagate(monkeypatch):
    import asyncio
    from backend import server as srv

    srv.IN_MEMORY_FIELD_ISSUES.clear()
    srv.IN_MEMORY_NOTIFICATIONS.clear()
    srv.IN_MEMORY_ISSUE_HISTORY.clear()
    srv.IN_MEMORY_STATUS_IDEMPOTENCY.clear()

    mock_issues = MagicMock()
    mock_issues.find_one = AsyncMock(return_value=_issue(status="IN_PROGRESS"))
    mock_issues.update_one = AsyncMock(return_value=MagicMock(matched_count=1, upserted_id=None))
    mock_col = MagicMock()
    mock_col.insert_one = AsyncMock(return_value=None)
    mock_col.find = MagicMock(return_value=_Cursor([]))
    mock_col.find_one = AsyncMock(return_value=None)

    class _DB:
        field_issues = mock_issues
        issue_history = mock_col
        work_updates = mock_col
        notifications = mock_col
        field_notifications = mock_col
        notification_audits = mock_col

    monkeypatch.setattr(srv, "db", _DB())
    monkeypatch.setattr(
        srv.whatsapp_client,
        "send_whatsapp_notification",
        AsyncMock(return_value={"success": True, "status": "SENT", "providerMessageId": "wamid.1"}),
    )
    resolved = asyncio.run(
        srv.update_field_issue_status("iss-e2e-1", {"status": "RESOLVED", "remarks": "Work finished."})
    )
    assert resolved["ticket"]["status"] == "RESOLVED"
    assert resolved["complainantNotification"]["status"] == "SENT"
    assert "Ticket Resolved" in srv.IN_MEMORY_NOTIFICATIONS[0]["title"]

    srv.IN_MEMORY_STATUS_IDEMPOTENCY.clear()
    srv.IN_MEMORY_FIELD_ISSUES.clear()
    if getattr(srv, "RUNTIME_FIELD_ISSUES_PATH", None) and srv.RUNTIME_FIELD_ISSUES_PATH.exists():
        srv.RUNTIME_FIELD_ISSUES_PATH.unlink()
    mock_issues.find_one = AsyncMock(return_value=_issue(status="IN_PROGRESS"))
    rejected = asyncio.run(
        srv.update_field_issue_status("iss-e2e-1", {"status": "REJECTED", "remarks": "Out of jurisdiction."})
    )
    assert rejected["ticket"]["status"] == "REJECTED"
    assert "Ticket Rejected" in srv.IN_MEMORY_NOTIFICATIONS[0]["title"]
    assert validate_officer_status("CLOSED") is not None


def test_volunteer_b_does_not_receive_volunteer_a_notification(monkeypatch):
    import asyncio
    from backend import server as srv

    srv.IN_MEMORY_FIELD_ISSUES.clear()
    srv.IN_MEMORY_NOTIFICATIONS.clear()
    srv.IN_MEMORY_ISSUE_HISTORY.clear()
    srv.IN_MEMORY_NOTIFICATION_AUDITS.clear()
    srv.IN_MEMORY_STATUS_IDEMPOTENCY.clear()

    issue = _issue(volunteer_id="vol-a")
    mock_issues = MagicMock()
    mock_issues.find_one = AsyncMock(return_value=dict(issue))
    mock_issues.update_one = AsyncMock(return_value=MagicMock(matched_count=1, upserted_id=None))
    mock_col = MagicMock()
    mock_col.insert_one = AsyncMock(return_value=None)
    mock_col.find = MagicMock(return_value=_Cursor([]))
    mock_col.find_one = AsyncMock(return_value=None)

    class _DB:
        field_issues = mock_issues
        issue_history = mock_col
        work_updates = mock_col
        notifications = mock_col
        field_notifications = mock_col
        notification_audits = mock_col

    monkeypatch.setattr(srv, "db", _DB())
    monkeypatch.setattr(
        srv.whatsapp_client,
        "send_whatsapp_notification",
        AsyncMock(return_value={"success": False, "status": "FAILED", "errorCode": "MISSING_CREDENTIALS"}),
    )
    asyncio.run(
        srv.update_field_issue_status("iss-e2e-1", {"status": "IN_PROGRESS", "remarks": "started"})
    )
    recipients = {n.get("recipientUserId") for n in srv.IN_MEMORY_NOTIFICATIONS}
    assert "vol-a" in recipients
    assert "vol-b" not in recipients


def test_status_notifies_created_by_when_assignee_is_demo(monkeypatch):
    import asyncio
    from backend import server as srv

    srv.IN_MEMORY_FIELD_ISSUES.clear()
    srv.IN_MEMORY_NOTIFICATIONS.clear()
    srv.IN_MEMORY_ISSUE_HISTORY.clear()
    srv.IN_MEMORY_NOTIFICATION_AUDITS.clear()
    srv.IN_MEMORY_STATUS_IDEMPOTENCY.clear()

    issue = _issue(volunteer_id="usr-demo-volunteer")
    issue["createdBy"] = "vol-real"
    issue["createdByRole"] = "VOLUNTEER"
    mock_issues = MagicMock()
    mock_issues.find_one = AsyncMock(return_value=dict(issue))
    mock_issues.update_one = AsyncMock(return_value=MagicMock(matched_count=1, upserted_id=None))
    mock_col = MagicMock()
    mock_col.insert_one = AsyncMock(return_value=None)
    mock_col.find = MagicMock(return_value=_Cursor([]))
    mock_col.find_one = AsyncMock(return_value=None)

    class _DB:
        field_issues = mock_issues
        issue_history = mock_col
        work_updates = mock_col
        notifications = mock_col
        field_notifications = mock_col
        notification_audits = mock_col

    monkeypatch.setattr(srv, "db", _DB())
    monkeypatch.setattr(
        srv.whatsapp_client,
        "send_whatsapp_notification",
        AsyncMock(return_value={"success": False, "status": "FAILED", "errorCode": "MISSING_CREDENTIALS"}),
    )
    asyncio.run(srv.update_field_issue_status("iss-e2e-1", {"status": "IN_PROGRESS", "remarks": "started"}))
    recipients = {n.get("recipientUserId") for n in srv.IN_MEMORY_NOTIFICATIONS}
    assert "vol-real" in recipients
    assert "vol-b" not in recipients


def test_create_field_issue_persists_without_nameerror(monkeypatch):
    import asyncio
    from backend import server as srv

    srv.IN_MEMORY_FIELD_ISSUES.clear()
    monkeypatch.setattr(srv, "_mongo_circuit_open", True)
    monkeypatch.setattr(srv, "db", srv._OfflineDB())
    monkeypatch.setattr(srv, "load_runtime_field_issues", lambda: [])

    created = asyncio.run(
        srv.create_field_issue(
            {
                "id": "iss-1a081309359",
                "title": "Broken street light on Ward 2",
                "description": "Pole 14 has been dark for a week.",
                "assignedVolunteerId": "usr-demo-volunteer",
                "reportedBy": "K. Rao",
                "reporterPhone": "9876543210",
            }
        )
    )
    assert created["id"] == "iss-ll-sec-open-03"
    assert created["ticketNumber"] == "LL-MLA-AC140-26-000008"
    assert created["title"] == "Broken street light on Ward 2"
    assert "1a081309359" not in created["id"]
    assert srv.IN_MEMORY_FIELD_ISSUES["iss-ll-sec-open-03"]["title"] == "Broken street light on Ward 2"


def test_create_field_issue_without_client_id_uses_catalog(monkeypatch):
    import asyncio
    from backend import server as srv

    srv.IN_MEMORY_FIELD_ISSUES.clear()
    monkeypatch.setattr(srv, "_mongo_circuit_open", True)
    monkeypatch.setattr(srv, "db", srv._OfflineDB())
    monkeypatch.setattr(srv, "load_runtime_field_issues", lambda: [])

    created = asyncio.run(
        srv.create_field_issue(
            {
                "title": "Drain overflow near bus stand",
                "description": "Storm water backing into shops.",
            }
        )
    )
    assert created["id"] == "iss-ll-sec-open-03"
    assert created["ticketNumber"].startswith("LL-MLA-AC140-")


def test_officer_status_upserts_unknown_ticket(monkeypatch):
    import asyncio
    from backend import server as srv

    srv.IN_MEMORY_FIELD_ISSUES.clear()
    srv.IN_MEMORY_NOTIFICATIONS.clear()
    srv.IN_MEMORY_ISSUE_HISTORY.clear()
    srv.IN_MEMORY_STATUS_IDEMPOTENCY.clear()
    monkeypatch.setattr(srv, "_mongo_circuit_open", True)
    monkeypatch.setattr(srv, "db", srv._OfflineDB())
    monkeypatch.setattr(
        srv.whatsapp_client,
        "send_whatsapp_notification",
        AsyncMock(return_value={"success": True, "status": "SENT", "providerMessageId": "wamid.1"}),
    )

    result = asyncio.run(
        srv.update_field_issue_status(
            "iss-1a081309359",
            {
                "status": "IN_PROGRESS",
                "remarks": "Inspected the site; crew mobilizing.",
                "title": "Broken street light on Ward 2",
                "reportedBy": "K. Rao",
                "reporterPhone": "9876543210",
                "assignedVolunteerId": "usr-demo-volunteer",
            },
        )
    )
    assert result["ticket"]["status"] == "IN_PROGRESS"
    assert result["ticket"]["id"] == "iss-1a081309359"
    assert result["issue"]["lastStatusRemarks"] == "Inspected the site; crew mobilizing."
    assert srv.IN_MEMORY_FIELD_ISSUES["iss-1a081309359"]["status"] == "IN_PROGRESS"
