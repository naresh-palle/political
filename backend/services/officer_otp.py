"""Officer portal WhatsApp OTP: generate, hash, cooldown, and verify.

Plain codes are never stored. Responses must never include the OTP.
"""
from __future__ import annotations

import hashlib
import hmac
import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Tuple

OTP_TTL_SECONDS = int(os.environ.get("OFFICER_OTP_TTL_SECONDS", "300") or "300")
OTP_COOLDOWN_SECONDS = int(os.environ.get("OFFICER_OTP_COOLDOWN_SECONDS", "45") or "45")
OTP_MAX_ATTEMPTS = int(os.environ.get("OFFICER_OTP_MAX_ATTEMPTS", "5") or "5")

IN_MEMORY_OFFICER_OTPS: Dict[str, Dict[str, Any]] = {}


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def normalize_phone(phone: str) -> str:
    digits = "".join(ch for ch in (phone or "") if ch.isdigit())
    if len(digits) >= 12 and digits.startswith("91"):
        return digits[-12:]
    if len(digits) == 10:
        return f"91{digits}"
    if len(digits) > 10:
        return digits[-10:] if len(digits) < 12 else digits[-12:]
    return digits


def last4(phone: str) -> str:
    digits = "".join(ch for ch in (phone or "") if ch.isdigit())
    if len(digits) < 4:
        return "****"
    return digits[-4:]


def challenge_key(phone: str, issue_id: str) -> str:
    return f"{normalize_phone(phone)}:{(issue_id or '').strip() or '_'}"


def otp_pepper() -> str:
    return (
        os.environ.get("OFFICER_OTP_PEPPER")
        or os.environ.get("OTP_PEPPER")
        or os.environ.get("WHATSAPP_ACCESS_TOKEN")
        or "leaders-lens-officer-otp"
    )


def generate_otp() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


def hash_otp(phone: str, issue_id: str, otp: str) -> str:
    msg = f"{normalize_phone(phone)}|{(issue_id or '').strip()}|{otp}".encode("utf-8")
    return hmac.new(otp_pepper().encode("utf-8"), msg, hashlib.sha256).hexdigest()


def otp_matches(phone: str, issue_id: str, otp: str, stored_hash: Optional[str]) -> bool:
    if not stored_hash or not otp:
        return False
    candidate = hash_otp(phone, issue_id, otp)
    return hmac.compare_digest(candidate, stored_hash)


def parse_iso(ts: Optional[str]) -> Optional[datetime]:
    if not ts:
        return None
    try:
        parsed = datetime.fromisoformat(str(ts).replace("Z", "+00:00"))
    except Exception:
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed


def build_challenge(phone: str, issue_id: str, otp: str) -> Dict[str, Any]:
    now = now_utc()
    return {
        "phone": normalize_phone(phone),
        "issueId": (issue_id or "").strip(),
        "otpHash": hash_otp(phone, issue_id, otp),
        "createdAt": now.isoformat(),
        "expiresAt": (now + timedelta(seconds=OTP_TTL_SECONDS)).isoformat(),
        "lastSentAt": now.isoformat(),
        "attempts": 0,
        "consumed": False,
    }


def cooldown_remaining(challenge: Optional[Dict[str, Any]]) -> int:
    if not challenge:
        return 0
    last = parse_iso(challenge.get("lastSentAt") or challenge.get("createdAt"))
    if not last:
        return 0
    remaining = OTP_COOLDOWN_SECONDS - (now_utc() - last).total_seconds()
    return int(remaining) if remaining > 0 else 0


def evaluate_verify(
    challenge: Optional[Dict[str, Any]],
    phone: str,
    issue_id: str,
    otp: str,
) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
    code = (otp or "").strip()
    if not challenge:
        return False, "No verification code is pending for this number. Request a new code.", None
    if challenge.get("consumed"):
        return False, "This code was already used. Request a new code.", dict(challenge)

    expires = parse_iso(challenge.get("expiresAt"))
    if expires and now_utc() > expires:
        updated = dict(challenge)
        updated["consumed"] = True
        return False, "This code has expired. Request a new code.", updated

    attempts = int(challenge.get("attempts") or 0)
    if attempts >= OTP_MAX_ATTEMPTS:
        return False, "Too many incorrect attempts. Request a new code.", dict(challenge)

    if not code.isdigit() or len(code) != 6:
        updated = dict(challenge)
        updated["attempts"] = attempts + 1
        return False, "Enter the 6-digit code from WhatsApp.", updated

    if not otp_matches(phone, issue_id, code, challenge.get("otpHash")):
        updated = dict(challenge)
        updated["attempts"] = attempts + 1
        if updated["attempts"] >= OTP_MAX_ATTEMPTS:
            return False, "Too many incorrect attempts. Request a new code.", updated
        return False, "Incorrect verification code. Try again.", updated

    updated = dict(challenge)
    updated["consumed"] = True
    return True, "WhatsApp identity verified.", updated
