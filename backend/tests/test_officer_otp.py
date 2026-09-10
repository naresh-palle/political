import asyncio
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock

from backend.services.officer_otp import (
    IN_MEMORY_OFFICER_OTPS,
    build_challenge,
    challenge_key,
    evaluate_verify,
    hash_otp,
    normalize_phone,
)


def test_normalize_phone_prefixes_india():
    assert normalize_phone("9876543210") == "919876543210"
    assert normalize_phone("+91 98765 43210") == "919876543210"


def test_hash_otp_is_not_plaintext():
    digest = hash_otp("9876543210", "iss-1", "123456")
    assert digest != "123456"
    assert len(digest) == 64
    assert digest == hash_otp("9876543210", "iss-1", "123456")
    assert digest != hash_otp("9876543210", "iss-1", "654321")


def test_verify_wrong_expired_and_reuse():
    phone = "9876543210"
    issue_id = "iss-otp-1"
    otp = "123456"
    challenge = build_challenge(phone, issue_id, otp)

    ok, msg, updated = evaluate_verify(challenge, phone, issue_id, "000000")
    assert ok is False
    assert "Incorrect" in msg
    assert updated["attempts"] == 1
    assert updated["consumed"] is False

    expired = dict(challenge)
    expired["expiresAt"] = (datetime.now(timezone.utc) - timedelta(minutes=6)).isoformat()
    ok, msg, updated = evaluate_verify(expired, phone, issue_id, otp)
    assert ok is False
    assert "expired" in msg.lower()

    ok, msg, used = evaluate_verify(challenge, phone, issue_id, otp)
    assert ok is True
    assert used["consumed"] is True
    ok, msg, _ = evaluate_verify(used, phone, issue_id, otp)
    assert ok is False
    assert "already used" in msg.lower()


def test_authentication_otp_template_body():
    from backend.services.whatsapp_service import WhatsAppCloudApiClient

    client = WhatsAppCloudApiClient()
    body = client._authentication_otp_request_body(
        "919876543210",
        {"otpCode": "123456", "templateName": "officer_verification_otp", "templateLanguage": "en"},
    )
    assert body["type"] == "template"
    assert body["template"]["name"] == "officer_verification_otp"
    assert body["template"]["components"][0]["parameters"][0]["text"] == "123456"
    assert body["template"]["components"][1]["sub_type"] == "url"


def test_authentication_otp_retries_language_then_drops_button(monkeypatch):
    from backend.services.whatsapp_service import WhatsAppCloudApiClient

    client = WhatsAppCloudApiClient()
    client.enabled = True
    client.phone_number_id = "1"
    client.access_token = "token"
    client.otp_template_name = "officer_verification_otp"
    client.otp_template_lang = "en"
    calls = []

    async def fake_post(body):
        calls.append(body)
        if len(calls) < 3:
            return {
                "status_code": 400,
                "res_json": {"error": {"code": 132012, "message": "Parameter format does not match template"}},
                "error_msg_fallback": "",
            }
        return {
            "status_code": 200,
            "res_json": {"messages": [{"id": "wamid.otp"}]},
            "error_msg_fallback": "",
        }

    monkeypatch.setattr(client, "_post_graph", fake_post)
    result = asyncio.run(
        client.send_whatsapp_notification(
            {
                "recipientPhone": "9876543210",
                "messageKind": "AUTHENTICATION_OTP",
                "otpCode": "123456",
                "issueId": "iss-otp-1",
            }
        )
    )
    assert result["status"] == "SENT"
    assert result.get("messageContent") is None
    assert "123456" not in str(result)
    assert calls[0]["template"]["language"]["code"] == "en"
    assert len(calls[0]["template"]["components"]) == 2
    assert calls[1]["template"]["language"]["code"] == "en_US"
    assert calls[2]["template"]["language"]["code"] == "en_US"
    assert len(calls[2]["template"]["components"]) == 1


def _mock_otp_db():
    store = {}

    class _Col:
        async def find_one(self, query, *args, **kwargs):
            return dict(store[query["key"]]) if query.get("key") in store else None

        async def update_one(self, query, update, upsert=False):
            key = query["key"]
            doc = dict(store.get(key) or {})
            doc.update(update.get("$set") or {})
            store[key] = doc
            return MagicMock(matched_count=1, upserted_id=None)

        async def delete_one(self, query):
            store.pop(query.get("key"), None)
            return MagicMock(deleted_count=1)

    class _DB:
        officer_otp_challenges = _Col()
        field_issues = MagicMock()
        field_issues.find_one = AsyncMock(return_value=None)

    return _DB(), store


def test_send_otp_does_not_echo_code_and_stores_hash(monkeypatch):
    from backend import server as srv

    IN_MEMORY_OFFICER_OTPS.clear()
    srv.IN_MEMORY_OFFICER_OTPS.clear()
    mock_db, store = _mock_otp_db()
    monkeypatch.setattr(srv, "db", mock_db)
    monkeypatch.setattr(srv, "generate_otp", lambda: "123456")

    captured = {}

    async def fake_wa(payload):
        captured["payload"] = dict(payload)
        return {"success": True, "status": "SENT", "providerMessageId": "wamid.1"}

    monkeypatch.setattr(srv.whatsapp_client, "send_whatsapp_notification", fake_wa)

    sent = asyncio.run(srv.send_whatsapp_otp({"phone": "9876543210", "issueId": "iss-otp-1"}))
    assert sent["success"] is True
    assert "otp" not in sent
    assert "123456" not in str(sent)
    assert sent["expiresIn"] == 300
    assert captured["payload"]["messageKind"] == "AUTHENTICATION_OTP"
    assert captured["payload"]["otpCode"] == "123456"

    key = challenge_key("9876543210", "iss-otp-1")
    stored = srv.IN_MEMORY_OFFICER_OTPS[key]
    assert stored["otpHash"] == hash_otp("9876543210", "iss-otp-1", "123456")
    assert "123456" not in str(stored)
    assert stored["otpHash"] != "123456"


def test_verify_otp_wrong_then_correct_then_reuse(monkeypatch):
    from backend import server as srv

    IN_MEMORY_OFFICER_OTPS.clear()
    srv.IN_MEMORY_OFFICER_OTPS.clear()
    mock_db, _store = _mock_otp_db()
    monkeypatch.setattr(srv, "db", mock_db)
    monkeypatch.setattr(srv, "generate_otp", lambda: "123456")

    async def fake_wa(payload):
        return {"success": True, "status": "SENT"}

    monkeypatch.setattr(srv.whatsapp_client, "send_whatsapp_notification", fake_wa)
    asyncio.run(srv.send_whatsapp_otp({"phone": "9876543210", "issueId": "iss-otp-1"}))

    wrong = asyncio.run(
        srv.verify_whatsapp_otp({"phone": "9876543210", "issueId": "iss-otp-1", "otp": "000000"})
    )
    assert wrong["success"] is False
    assert "Incorrect" in wrong["message"]

    ok = asyncio.run(
        srv.verify_whatsapp_otp({"phone": "9876543210", "issueId": "iss-otp-1", "otp": "123456"})
    )
    assert ok["success"] is True
    assert "otp" not in ok

    reuse = asyncio.run(
        srv.verify_whatsapp_otp({"phone": "9876543210", "issueId": "iss-otp-1", "otp": "123456"})
    )
    assert reuse["success"] is False
    assert "already used" in reuse["message"].lower()


def test_send_otp_fails_closed_when_meta_fails(monkeypatch):
    from backend import server as srv

    IN_MEMORY_OFFICER_OTPS.clear()
    srv.IN_MEMORY_OFFICER_OTPS.clear()
    mock_db, store = _mock_otp_db()
    monkeypatch.setattr(srv, "db", mock_db)
    monkeypatch.setattr(srv, "generate_otp", lambda: "123456")

    async def fake_wa(payload):
        return {
            "success": False,
            "status": "FAILED",
            "errorCode": "132001",
            "errorMessage": "Template does not exist",
        }

    monkeypatch.setattr(srv.whatsapp_client, "send_whatsapp_notification", fake_wa)
    sent = asyncio.run(srv.send_whatsapp_otp({"phone": "9876543210", "issueId": "iss-otp-1"}))
    assert sent["success"] is False
    assert "otp" not in sent
    assert "123456" not in str(sent)
    assert not srv.IN_MEMORY_OFFICER_OTPS
    assert not store

    verify = asyncio.run(
        srv.verify_whatsapp_otp({"phone": "9876543210", "issueId": "iss-otp-1", "otp": "123456"})
    )
    assert verify["success"] is False
