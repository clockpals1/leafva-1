"""AI chat helper using Groq (open-source models via OpenAI-compatible API)."""
import os
import json
import re
from typing import Optional

from openai import AsyncOpenAI

GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
DEFAULT_MODEL = os.environ.get("LLM_MODEL", "llama-3.3-70b-versatile")

INTAKE_MARKER_RE = re.compile(r"\[INTAKE_COMPLETE:\s*(\{.*?\})\s*\]", re.DOTALL)


def _get_client() -> AsyncOpenAI:
    return AsyncOpenAI(
        api_key=GROQ_API_KEY,
        base_url="https://api.groq.com/openai/v1",
    )


async def chat_reply(
    session_id: str,
    history: list,
    user_text: str,
    system_prompt: str,
    provider: str = "groq",
    model: str = DEFAULT_MODEL,
) -> str:
    if not GROQ_API_KEY:
        return "AI is currently offline. Please email hello@leafva.com so our team can assist you."

    messages = [{"role": "system", "content": system_prompt}]
    for m in history:
        messages.append({"role": m.get("role", "user"), "content": m.get("content", "")})
    messages.append({"role": "user", "content": user_text})

    try:
        client = _get_client()
        response = await client.chat.completions.create(
            model=model,
            messages=messages,
            max_tokens=1024,
            temperature=0.7,
        )
        return response.choices[0].message.content.strip()
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
    provider: str = "groq",
    model: str = DEFAULT_MODEL,
) -> dict:
    """Use LLM to draft a subject + body for a transactional email."""
    if not GROQ_API_KEY:
        return {
            "subject": "Update from LEAFVA",
            "body": f"Hello {recipient_name or 'there'},\n\n{context}\n\nBest regards,\nThe LEAFVA Team",
        }

    sys_prompt = (
        "You are an email writing assistant for LEAFVA, a premium IT services company. "
        "Write polished, concise, professional emails. Output strictly as JSON with keys "
        '"subject" and "body". The body should be plain text with paragraph breaks. '
        "Sign off as 'The LEAFVA Team'."
    )
    user_prompt = (
        f"Purpose: {purpose}\n"
        f"Tone: {tone}\n"
        f"Recipient name: {recipient_name or 'Customer'}\n"
        f"Context to base the email on:\n{context}\n\n"
        "Return JSON only."
    )

    try:
        client = _get_client()
        response = await client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": sys_prompt},
                {"role": "user", "content": user_prompt},
            ],
            max_tokens=1024,
            temperature=0.5,
        )
        raw = response.choices[0].message.content.strip()
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
