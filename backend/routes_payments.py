"""Stripe payment routes."""
from fastapi import APIRouter, Depends, HTTPException, Request, Header
from pydantic import BaseModel
from typing import Optional

from auth import require_admin
from models import AdminUser
from stripe_service import (
    create_invoice_checkout,
    poll_checkout_status,
    handle_stripe_webhook,
)

router = APIRouter(prefix="/api", tags=["payments"])


class CheckoutLinkRequest(BaseModel):
    origin_url: str


@router.post("/invoices/{invoice_id}/payment-link")
async def invoice_payment_link(
    invoice_id: str,
    payload: CheckoutLinkRequest,
    request: Request,
    _: AdminUser = Depends(require_admin),
):
    host_url = str(request.base_url)
    try:
        result = await create_invoice_checkout(invoice_id, host_url, payload.origin_url)
        return result
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        raise HTTPException(500, f"Stripe error: {e}")


@router.get("/payments/checkout/status/{session_id}")
async def checkout_status(session_id: str, request: Request):
    """Public endpoint — the success page (no auth) polls this to detect completion."""
    host_url = str(request.base_url)
    try:
        return await poll_checkout_status(session_id, host_url)
    except Exception as e:
        raise HTTPException(500, f"Stripe error: {e}")


@router.post("/webhook/stripe")
async def stripe_webhook(request: Request, stripe_signature: Optional[str] = Header(None)):
    body = await request.body()
    host_url = str(request.base_url)
    try:
        return await handle_stripe_webhook(body, stripe_signature, host_url)
    except Exception as e:
        raise HTTPException(400, f"Webhook error: {e}")
