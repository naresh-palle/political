import os
import logging
import json
from typing import Dict, Any, Optional
from datetime import datetime, timezone

try:
    import httpx
except ImportError:
    httpx = None

try:
    import requests
except ImportError:
    requests = None

logger = logging.getLogger(__name__)

class WhatsAppMessageBuilder:
    """
    Dynamic Leader-Specific WhatsApp Message Builder for LeaderLens.
    Generates Meta-compliant template parameters and context-aware notifications
    without hardcoding leader, constituency, department, or officer.
    """
    
    @staticmethod
    def resolve_leader_name(leader_data: Optional[Dict[str, Any]]) -> str:
        if not leader_data:
            return "the constituency administration"
        
        name = leader_data.get("name") or leader_data.get("leaderName") or leader_data.get("clientName")
        designation = leader_data.get("designation") or leader_data.get("roleTitle")
        
        if name and name.strip():
            if designation and ("MLA" in designation or "MP" in designation or "Minister" in designation):
                return f"{name.strip()}"
            return name.strip()
        
        return "the constituency administration"

    @staticmethod
    def build_ticket_notification_payload(
        ticket: Dict[str, Any],
        leader: Optional[Dict[str, Any]],
        officer: Dict[str, Any],
        department: Dict[str, Any],
        geography: Optional[Dict[str, Any]] = None,
        volunteer: Optional[Dict[str, Any]] = None,
        base_portal_url: str = "https://leaderslensconsulting.com"
    ) -> Dict[str, Any]:
        officer_name = officer.get("name", "Department Officer")
        officer_designation = officer.get("designation", department.get("name", "Department"))
        officer_phone = officer.get("phone", "").replace(" ", "").replace("-", "")
        
        leader_name = WhatsAppMessageBuilder.resolve_leader_name(leader)
        
        ac_name = ticket.get("assemblyConstituencyName") or (geography.get("acName") if geography else "Constituency Area")
        mandal_name = ticket.get("mandalName") or (geography.get("mandalName") if geography else "")
        village_name = ticket.get("villageName") or (geography.get("villageName") if geography else "")
        
        location_str = f"{village_name}, {mandal_name}".strip(", ").strip()
        if not location_str:
            location_str = ticket.get("placeName") or "Constituency Jurisdiction"
            
        ticket_id = ticket.get("id", "LL-TICKET")
        ticket_number = f"#{ticket_id}" if not ticket_id.startswith("#") else ticket_id
        issue_title = ticket.get("title", "Public Grievance / Requirement")
        priority = (ticket.get("priority") or "MEDIUM").upper()
        dept_name = department.get("name") or ticket.get("category") or "Public Service"
        
        secure_link = f"{base_portal_url}/#/officer-portal?ticket={ticket_id}"
        
        text_message = (
            f"Hello {officer_name},\n\n"
            f"A new issue has been raised from {leader_name}'s constituency.\n\n"
            f"Reported on behalf of:\n{leader_name}\n\n"
            f"Constituency:\n{ac_name}\n\n"
            f"Issue:\n{issue_title}\n\n"
            f"Location:\n{location_str}\n\n"
            f"Department:\n{dept_name}\n\n"
            f"Priority:\n{priority}\n\n"
            f"Ticket:\n{ticket_number}\n\n"
            f"Please review and take necessary action.\n\n"
            f"Update Ticket:\n{secure_link}\n\n"
            f"Thank you,\nLeaderLens"
        )
        
        template_variables = {
            "1": officer_name,
            "2": leader_name,
            "3": ac_name,
            "4": issue_title,
            "5": location_str,
            "6": dept_name,
            "7": priority,
            "8": ticket_number,
            "9": secure_link
        }
        
        return {
            "recipientPhone": officer_phone,
            "officerName": officer_name,
            "officerDesignation": officer_designation,
            "leaderName": leader_name,
            "acName": ac_name,
            "mandalName": mandal_name or "Banaganapalle",
            "deptName": dept_name,
            "ticketNumber": ticket_number,
            "rawTicketId": ticket_id.replace("#", ""),
            "reporterPhone": ticket.get("reporterPhone") or ticket.get("citizenPhone"),
            "textMessage": text_message,
            "templateVariables": template_variables,
            "secureTicketLink": secure_link
        }


def _mask_phone(phone: str) -> str:
    digits = "".join(ch for ch in (phone or "") if ch.isdigit())
    if len(digits) <= 4:
        return "****"
    return f"{digits[:-4]}****{digits[-4:]}"


def _safe_provider_error(res_json: Dict[str, Any], fallback: str = "") -> Dict[str, Any]:
    error = (res_json or {}).get("error") or {}
    message = error.get("message") or fallback or "Unknown Meta Cloud API error"
    if isinstance(message, str):
        lowered = message.lower()
        for secret_hint in ("bearer ", "eaa", "access token", "authorization"):
            if secret_hint in lowered:
                message = "Meta Cloud API rejected the request."
                break
    return {
        "errorCode": str(error.get("code") or error.get("error_subcode") or "META_ERROR"),
        "errorMessage": message,
        "errorType": error.get("type"),
        "fbtrace_id": error.get("fbtrace_id"),
    }


class WhatsAppCloudApiClient:
    """
    Client for Meta WhatsApp Business Cloud API.
    Sends template or text messages and records truthful provider outcomes.
    """
    def __init__(self):
        self.enabled = os.environ.get("WHATSAPP_ENABLED", "true").lower() == "true"
        self.phone_number_id = os.environ.get("WHATSAPP_PHONE_NUMBER_ID", "")
        self.access_token = os.environ.get("WHATSAPP_ACCESS_TOKEN", "")
        self.business_account_id = os.environ.get("WHATSAPP_BUSINESS_ACCOUNT_ID", "")
        self.api_version = os.environ.get("WHATSAPP_API_VERSION", "v25.0")
        self.template_name = os.environ.get("WHATSAPP_TEMPLATE_NAME", "officer_ticket_alert_v1")
        self.complainant_template_name = os.environ.get(
            "WHATSAPP_COMPLAINANT_TEMPLATE_NAME",
            os.environ.get("WHATSAPP_STATUS_TEMPLATE_NAME", "complainant_status_update_v1"),
        )

    def _graph_url(self) -> str:
        return f"https://graph.facebook.com/{self.api_version}/{self.phone_number_id}/messages"

    async def _post_graph(self, request_body: Dict[str, Any]) -> Dict[str, Any]:
        url = self._graph_url()
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }
        status_code = 500
        res_json: Dict[str, Any] = {}
        error_msg_fallback = ""
        if httpx is not None:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(url, headers=headers, json=request_body)
                try:
                    res_json = res.json()
                except Exception:
                    res_json = {}
                status_code = res.status_code
                error_msg_fallback = (res.text or "")[:800]
        elif requests is not None:
            res = requests.post(url, headers=headers, json=request_body, timeout=10.0)
            try:
                res_json = res.json()
            except Exception:
                res_json = {}
            status_code = res.status_code
            error_msg_fallback = (res.text or "")[:800]
        else:
            import urllib.request
            req = urllib.request.Request(
                url,
                data=json.dumps(request_body).encode("utf-8"),
                headers=headers,
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=10.0) as response:
                res_json = json.loads(response.read().decode("utf-8"))
                status_code = response.status
        return {
            "status_code": status_code,
            "res_json": res_json if isinstance(res_json, dict) else {},
            "error_msg_fallback": error_msg_fallback,
        }

    def _template_request_body(self, phone: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        if self.template_name.strip().lower() == "hello_world":
            return {
                "messaging_product": "whatsapp",
                "recipient_type": "individual",
                "to": phone,
                "type": "template",
                "template": {
                    "name": "hello_world",
                    "language": {"code": "en_US"}
                }
            }
        if self.template_name.strip().lower() == "officer_ticket_alert_v1":
            clean_ticket_id = (payload.get("rawTicketId") or payload.get("ticketNumber") or "ticket").replace("#", "")
            officer_name = payload.get("officerName", "Department Officer")
            leader_name = payload.get("leaderName") or "the constituency administration"
            dept_name = payload.get("deptName", "Assigned Department")
            mandal_name = payload.get("mandalName") or payload.get("location") or "Constituency"
            return {
                "messaging_product": "whatsapp",
                "recipient_type": "individual",
                "to": phone,
                "type": "template",
                "template": {
                    "name": "officer_ticket_alert_v1",
                    "language": {"code": "en"},
                    "components": [
                        {"type": "header", "parameters": [{"type": "text", "text": leader_name}]},
                        {
                            "type": "body",
                            "parameters": [
                                {"type": "text", "text": officer_name},
                                {"type": "text", "text": clean_ticket_id},
                                {"type": "text", "text": dept_name},
                                {"type": "text", "text": mandal_name}
                            ]
                        },
                        {
                            "type": "button",
                            "sub_type": "url",
                            "index": "0",
                            "parameters": [{"type": "text", "text": clean_ticket_id}]
                        }
                    ]
                }
            }
        params = [{"type": "text", "text": str(v)} for v in payload.get("templateVariables", {}).values()]
        components = []
        if params:
            components.append({"type": "body", "parameters": params})
        return {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": phone,
            "type": "template",
            "template": {
                "name": self.template_name,
                "language": {"code": "en_US"},
                "components": components
            }
        }

    def _complainant_status_request_body(self, phone: str, payload: Dict[str, Any], shape: str = "body") -> Dict[str, Any]:
        """Active Meta template complainant_status_update_v1: name, ticket, status, detail."""
        try:
            from backend.services.officer_status_workflow import complainant_template_parameters
        except ImportError:
            from services.officer_status_workflow import complainant_template_parameters

        template_name = (
            payload.get("templateName")
            or self.complainant_template_name
            or "complainant_status_update_v1"
        )
        name, ticket, status_label, details = complainant_template_parameters(
            payload.get("complainantName") or payload.get("officerName") or "Citizen",
            payload.get("ticketNumber") or payload.get("rawTicketId") or "ticket",
            payload.get("newStatus") or payload.get("statusLabel") or "UPDATED",
            payload.get("remarks") or payload.get("statusDetail") or "",
        )
        body_params = [
            {"type": "text", "text": name},
            {"type": "text", "text": ticket},
            {"type": "text", "text": status_label},
            {"type": "text", "text": details},
        ]
        if shape == "officer_like":
            components = [
                {"type": "header", "parameters": [{"type": "text", "text": (payload.get("leaderName") or "LeaderLens")[:60]}]},
                {"type": "body", "parameters": body_params},
                {
                    "type": "button",
                    "sub_type": "url",
                    "index": "0",
                    "parameters": [{"type": "text", "text": ticket}],
                },
            ]
        else:
            components = [{"type": "body", "parameters": body_params}]
        return {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": phone,
            "type": "template",
            "template": {
                "name": template_name,
                "language": {"code": "en"},
                "components": components,
            },
        }

    async def send_whatsapp_notification(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        phone = payload.get("recipientPhone", "").replace("+", "").replace(" ", "").replace("-", "")
        if len(phone) == 10:
            phone = f"91{phone}"

        correlation_id = payload.get("correlationId") or f"wa-{int(datetime.now(timezone.utc).timestamp())}"
        event = payload.get("event") or payload.get("eventType") or "WHATSAPP_DISPATCH"
        ticket_ref = payload.get("rawTicketId") or payload.get("ticketNumber") or payload.get("issueId")
        message_kind = (payload.get("messageKind") or "TEMPLATE").upper()
        template_for_log = payload.get("templateName") or (
            self.complainant_template_name if message_kind in ("COMPLAINANT_STATUS", "STATUS_TEMPLATE")
            else ("status_update_text" if message_kind == "TEXT" else self.template_name)
        )
        masked = _mask_phone(phone)
        sent_at = datetime.now(timezone.utc).isoformat()

        def _fail(code: str, message: str, http_status: Optional[int] = None) -> Dict[str, Any]:
            logger.warning(
                "[WhatsApp] event=%s ticket=%s recipient=%s template=%s correlation=%s metaHttp=%s result=FAILED errorCode=%s error=%s ts=%s",
                event, ticket_ref, masked, template_for_log, correlation_id, http_status, code, message, sent_at,
            )
            return {
                "success": False,
                "status": "FAILED",
                "errorCode": code,
                "errorMessage": message,
                "providerMessageId": None,
                "sentAt": sent_at,
                "correlationId": correlation_id,
                "recipientPhone": phone,
                "metaHttpStatus": http_status,
                "messageContent": payload.get("textMessage"),
                "apiVersion": self.api_version,
            }

        if not phone or len("".join(ch for ch in phone if ch.isdigit())) < 10:
            return _fail("INVALID_PHONE", "Recipient phone number is missing or invalid.")

        if not self.enabled:
            return _fail("WHATSAPP_DISABLED", "WhatsApp Cloud API is disabled (WHATSAPP_ENABLED=false).")

        if not self.phone_number_id or not self.access_token:
            return _fail(
                "MISSING_CREDENTIALS",
                "WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_ACCESS_TOKEN is not configured on the backend.",
            )

        if message_kind == "TEXT" and payload.get("textMessage"):
            request_body = {
                "messaging_product": "whatsapp",
                "recipient_type": "individual",
                "to": phone,
                "type": "text",
                "text": {"preview_url": False, "body": payload.get("textMessage")},
            }
        elif message_kind in ("COMPLAINANT_STATUS", "STATUS_TEMPLATE"):
            shape = payload.get("templateShape") or "body"
            request_body = self._complainant_status_request_body(phone, payload, shape=shape)
            template_for_log = (
                payload.get("templateName")
                or self.complainant_template_name
                or "complainant_status_update_v1"
            )
        else:
            request_body = self._template_request_body(phone, payload)

        try:
            posted = await self._post_graph(request_body)
            status_code = posted["status_code"]
            res_json = posted["res_json"]
            error_msg_fallback = posted["error_msg_fallback"]

            if status_code == 200 and "messages" in res_json:
                msg_id = res_json["messages"][0].get("id")
                logger.info(
                    "[WhatsApp] event=%s ticket=%s recipient=%s template=%s correlation=%s metaHttp=%s result=SENT providerMessageId=%s ts=%s",
                    event, ticket_ref, masked, template_for_log, correlation_id, status_code, msg_id, sent_at,
                )
                return {
                    "success": True,
                    "status": "SENT",
                    "providerMessageId": msg_id,
                    "sentAt": sent_at,
                    "recipientPhone": phone,
                    "messageContent": payload.get("textMessage"),
                    "correlationId": correlation_id,
                    "metaHttpStatus": status_code,
                    "apiVersion": self.api_version,
                    "templateName": template_for_log,
                }

            # Session text is rejected outside the 24h window; use the approved citizen template.
            if message_kind == "TEXT":
                dedicated = (self.complainant_template_name or "").strip()
                if dedicated and dedicated.lower() not in ("officer_ticket_alert_v1", "hello_world"):
                    logger.warning(
                        "[WhatsApp] text failed ticket=%s metaHttp=%s; retrying complainant template %s",
                        ticket_ref, status_code, dedicated,
                    )
                    retry_payload = dict(payload)
                    retry_payload["messageKind"] = "COMPLAINANT_STATUS"
                    retry_payload["templateName"] = dedicated
                    return await self.send_whatsapp_notification(retry_payload)
                return _fail(
                    "NEEDS_COMPLAINANT_TEMPLATE",
                    "Complainant WhatsApp needs an approved Meta template for citizens. The officer ticket template cannot be used for the complaint person.",
                    http_status=status_code,
                )

            # complainant_status_update_v1 may be body-only or cloned from the officer template.
            if message_kind in ("COMPLAINANT_STATUS", "STATUS_TEMPLATE") and not payload.get("templateShapeRetried"):
                err_code = str(((res_json or {}).get("error") or {}).get("code") or "")
                if status_code == 400 or err_code in ("132000", "132012", "132001"):
                    next_shape = "officer_like" if (payload.get("templateShape") or "body") == "body" else "body"
                    logger.warning(
                        "[WhatsApp] complainant template shape retry ticket=%s metaHttp=%s shape=%s",
                        ticket_ref, status_code, next_shape,
                    )
                    retry_payload = dict(payload)
                    retry_payload["messageKind"] = "COMPLAINANT_STATUS"
                    retry_payload["templateShape"] = next_shape
                    retry_payload["templateShapeRetried"] = True
                    return await self.send_whatsapp_notification(retry_payload)

            safe = _safe_provider_error(res_json, error_msg_fallback)
            return _fail(safe["errorCode"], safe["errorMessage"], http_status=status_code)
        except Exception as e:
            logger.error("[WhatsApp] connection failure event=%s ticket=%s correlation=%s error=%s", event, ticket_ref, correlation_id, e)
            return _fail("HTTP_CONNECTION_ERROR", "Unable to reach Meta Cloud API.")
