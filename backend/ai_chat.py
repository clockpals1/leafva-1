"""AI chat helper using Emergent universal LLM key."""
import os
import json
import re
from typing import Optional

from emergentintegrations.llm.chat import LlmChat, UserMessage

EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")
DEFAULT_PROVIDER = os.environ.get("LLM_PROVIDER", "anthropic")
DEFAULT_MODEL = os.environ.get("LLM_MODEL", "claude-sonnet-4-5-20250929")

INTAKE_MARKER_RE = re.compile(r"\[INTAKE_COMPLETE:\s*(\{.*?\})\s*\]", re.DOTALL)


def _build_context_prompt(messages: list, new_user_message: str) -> str:
    """Render full conversation history into a single prompt for stateless instance."""
    if not messages:
        return new_user_message
    lines = []
    for m in messages:
        role = "User" if m.get("role") == "user" else "Assistant"
        lines.append(f"{role}: {m.get('content', '')}")
    history = "\n".join(lines)
    return (
        f"Conversation so far:\n{history}\n\n"
        f"User just said: {new_user_message}\n\n"
        f"Reply now as the LEAFVA assistant."
    )


async def chat_reply(
    session_id: str,
    history: list,
    user_text: str,
    system_prompt: str,
    provider: str = DEFAULT_PROVIDER,
    model: str = DEFAULT_MODEL,
) -> str:
    if not EMERGENT_LLM_KEY:
        return "AI is currently offline. Please email hello@leafva.com so our team can assist you."
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=session_id,
        system_message=system_prompt,
    ).with_model(provider, model)
    composed = _build_context_prompt(history, user_text)
    try:
        reply = await chat.send_message(UserMessage(text=composed))
        return str(reply).strip()
    except Exception as e:
        return f"AI is temporarily unavailable: {str(e)[:120]}. Please try again shortly."


def extract_intake(text: str) -> Optional[dict]:
    """Parse [INTAKE_COMPLETE: {...}] marker from assistant reply."""
    m = INTAKE_MARKER_RE.search(text)
    if not m:
        return None
    try:
        data = json.loads(m.group(1))
        required = ["category", "urgency", "details", "name", "email"]
        if all(data.get(k) for k in required):
            return data
    except Exception:
        return None
    return None


def strip_intake_marker(text: str) -> str:
    return INTAKE_MARKER_RE.sub("", text).strip()


async def compose_email(
    context: str,
    tone: str,
    purpose: str,
    recipient_name: str,
    provider: str = DEFAULT_PROVIDER,
    model: str = DEFAULT_MODEL,
) -> dict:
    """Use LLM to draft a subject + body for a transactional email."""
    sys = (
        "You are an email writing assistant for LEAFVA, a premium IT services company. "
        "Write polished, concise, professional emails. Output strictly as JSON with keys "
        '"subject" and "body". The body should be plain text with paragraph breaks. '
        "Sign off as 'The LEAFVA Team'."
    )
    prompt = (
        f"Purpose: {purpose}\n"
        f"Tone: {tone}\n"
        f"Recipient name: {recipient_name or 'Customer'}\n"
        f"Context to base the email on:\n{context}\n\n"
        "Return JSON only."
    )
    if not EMERGENT_LLM_KEY:
        return {
            "subject": "Update from LEAFVA",
            "body": f"Hello {recipient_name or 'there'},\n\n{context}\n\nBest regards,\nThe LEAFVA Team",
        }
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"compose-{os.urandom(4).hex()}",
        system_message=sys,
    ).with_model(provider, model)
    try:
        raw = await chat.send_message(UserMessage(text=prompt))
        raw = str(raw).strip()
        # extract JSON block
        m = re.search(r"\{.*\}", raw, re.DOTALL)
        if m:
            data = json.loads(m.group(0))
            return {
                "subject": data.get("subject", "Update from LEAFVA"),
                "body": data.get("body", raw),
            }
        return {"subject": "Update from LEAFVA", "body": raw}
    except Exception as e:
        return {
            "subject": "Update from LEAFVA",
            "body": f"Hello {recipient_name or 'there'},\n\n{context}\n\n(AI compose error: {e})\n\nBest regards,\nThe LEAFVA Team",
        }
