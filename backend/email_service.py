"""Resend email service (settings-driven, no hardcoded keys)."""
from typing import Optional
import resend

from db import get_db
from models import BusinessSettings, EmailLog


async def get_settings() -> BusinessSettings:
    sb = await get_db()
    result = await sb.table("business_settings").select("*").eq("id", "singleton").execute()
    if not result.data:
        settings = BusinessSettings(id="singleton")
        await sb.table("business_settings").insert(settings.to_db()).execute()
        return settings
    return BusinessSettings.from_db(result.data[0])


async def send_email(
    to: str,
    subject: str,
    body: str,
    html: Optional[str] = None,
    related_ticket_id: Optional[str] = None,
    related_invoice_id: Optional[str] = None,
) -> dict:
    """Send an email via Resend if api key configured; otherwise log as 'mocked'."""
    sb = await get_db()
    settings = await get_settings()
    log = EmailLog(
        to=to,
        subject=subject,
        body=body,
        status="queued",
        related_ticket_id=related_ticket_id,
        related_invoice_id=related_invoice_id,
    )

    if not settings.resend_api_key or not settings.resend_sender_email:
        log.status = "mocked"
        log.error = "Resend API key or sender not configured in admin settings."
        await sb.table("email_logs").insert(log.to_db()).execute()
        return {"status": "mocked", "id": log.id, "message": log.error}

    try:
        resend.api_key = settings.resend_api_key
        params = {
            "from": settings.resend_sender_email,
            "to": [to],
            "subject": subject,
            "html": html or body.replace("\n", "<br/>"),
            "text": body,
        }
        result = resend.Emails.send(params)
        log.status = "sent"
        await sb.table("email_logs").insert(log.to_db()).execute()
        return {"status": "sent", "id": log.id, "resend_id": result.get("id") if isinstance(result, dict) else str(result)}
    except Exception as e:
        log.status = "failed"
        log.error = str(e)[:500]
        await sb.table("email_logs").insert(log.to_db()).execute()
        return {"status": "failed", "id": log.id, "error": str(e)}
