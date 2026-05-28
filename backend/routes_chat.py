"""Public chat endpoints (no auth)."""
from fastapi import APIRouter, HTTPException

from db import get_db, utcnow_iso
from models import (
    ChatMessage,
    ChatMessageIn,
    ChatMessageOut,
    ChatSession,
    Ticket,
)
from ai_chat import chat_reply, extract_intake, strip_intake_marker
from email_service import get_settings, send_email

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("/start", response_model=ChatSession)
async def start_chat():
    """Create a new chat session with a greeting."""
    db = get_db()
    settings = await get_settings()
    greeting = (
        "Welcome to LEAFVA — IT Intelligence, Powered by Nature and Technology. "
        "Tell me what you need today, and I will route it to the right team."
    )
    session = ChatSession(messages=[ChatMessage(role="assistant", content=greeting)])
    await db.chat_sessions.insert_one(session.to_mongo())
    return session


@router.get("/session/{session_id}", response_model=ChatSession)
async def get_session(session_id: str):
    db = get_db()
    doc = await db.chat_sessions.find_one({"id": session_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Session not found")
    return ChatSession.from_mongo(doc)


@router.post("/message", response_model=ChatMessageOut)
async def post_message(payload: ChatMessageIn):
    db = get_db()
    settings = await get_settings()

    # Get or create session
    session: ChatSession
    if payload.session_id:
        doc = await db.chat_sessions.find_one({"id": payload.session_id})
        if not doc:
            raise HTTPException(status_code=404, detail="Session not found")
        session = ChatSession.from_mongo(doc)
    else:
        session = ChatSession()

    # Append user msg
    session.messages.append(ChatMessage(role="user", content=payload.message))

    # Get AI reply
    history = [{"role": m.role, "content": m.content} for m in session.messages[:-1]]
    raw_reply = await chat_reply(
        session_id=session.id,
        history=history,
        user_text=payload.message,
        system_prompt=settings.ai_system_prompt,
        provider=settings.ai_provider,
        model=settings.ai_model,
    )

    intake = extract_intake(raw_reply)
    clean_reply = strip_intake_marker(raw_reply)
    session.messages.append(ChatMessage(role="assistant", content=clean_reply))
    session.updated_at = utcnow_iso()

    ticket_id = session.ticket_id
    if intake and not session.intake_complete:
        # Create a ticket
        ticket = Ticket(
            name=intake.get("name", ""),
            email=intake.get("email", ""),
            phone=intake.get("phone", ""),
            category=intake.get("category", "IT Support"),
            urgency=intake.get("urgency", "medium").lower() if isinstance(intake.get("urgency"), str) else "medium",
            details=intake.get("details", ""),
            chat_session_id=session.id,
        )
        # Normalize urgency
        if ticket.urgency not in ("low", "medium", "high", "emergency"):
            ticket.urgency = "medium"
        await db.tickets.insert_one(ticket.to_mongo())
        ticket_id = ticket.id
        session.ticket_id = ticket_id
        session.intake_complete = True
        session.intake_data = intake

        # Try sending confirmation email + notification
        confirm_body = (
            f"Hello {ticket.name},\n\n"
            f"Thank you for reaching out to LEAFVA. We have received your request and "
            f"opened ticket {ticket.code}.\n\n"
            f"Category: {ticket.category}\n"
            f"Urgency: {ticket.urgency}\n"
            f"Details: {ticket.details}\n\n"
            f"A LEAFVA specialist will follow up with you shortly.\n\n"
            f"— The LEAFVA Team"
        )
        await send_email(
            to=ticket.email,
            subject=f"LEAFVA Ticket {ticket.code} confirmed",
            body=confirm_body,
            related_ticket_id=ticket.id,
        )
        if settings.resend_notify_email:
            notify_body = (
                f"New ticket {ticket.code}\n"
                f"From: {ticket.name} <{ticket.email}> {ticket.phone or ''}\n"
                f"Category: {ticket.category} | Urgency: {ticket.urgency}\n\n"
                f"{ticket.details}"
            )
            await send_email(
                to=settings.resend_notify_email,
                subject=f"[LEAFVA] New {ticket.urgency.upper()} ticket {ticket.code}",
                body=notify_body,
                related_ticket_id=ticket.id,
            )

    # Persist updated session
    await db.chat_sessions.update_one(
        {"id": session.id},
        {"$set": session.to_mongo()},
        upsert=True,
    )

    return ChatMessageOut(
        session_id=session.id,
        reply=clean_reply,
        intake_complete=session.intake_complete,
        ticket_id=ticket_id,
    )
