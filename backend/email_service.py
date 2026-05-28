"""Resend email service (settings-driven, no hardcoded keys)."""
from typing import Optional
import resend

from db import get_db
from models import BusinessSettings, EmailLog


async def get_settings() -> BusinessSettings:
    db = get_db()
    doc = await db.business_settings.find_one({"id": "singleton"})
    if not doc:
        settings = BusinessSettings(id="singleton")
        await db.business_settings.insert_one(settings.to_mongo())
        return settings
    return BusinessSettings.from_mongo(doc)


async def send_email(
    to: str,
    subject: str,
    body: str,
    html: Optional[str] = None,
    related_ticket_id: Optional[str] = None,
    related_invoice_id: Optional[str] = None,
) -> dict:
    """Send an email via Resend if api key configured; otherwise log as 'mocked'."""
    db = get_db()
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
        await db.email_logs.insert_one(log.to_mongo())
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
        await db.email_logs.insert_one(log.to_mongo())
        return {"status": "sent", "id": log.id, "resend_id": result.get("id") if isinstance(result, dict) else str(result)}
    except Exception as e:
        log.status = "failed"
        log.error = str(e)[:500]
        await db.email_logs.insert_one(log.to_mongo())
        return {"status": "failed", "id": log.id, "error": str(e)}
