"""Stripe payment service for LEAFVA invoices (direct stripe-python)."""
import os
import asyncio
from typing import Optional

import stripe

from db import get_db, utcnow_iso, new_uuid

STRIPE_API_KEY = os.environ.get("STRIPE_API_KEY", "")
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "")


async def create_invoice_checkout(
    invoice_id: str,
    host_url: str,
    origin_url: str,
) -> dict:
    """Create a Stripe checkout session for an invoice. Returns {url, session_id}."""
    sb = await get_db()
    result = await sb.table("invoices").select("*").eq("id", invoice_id).execute()
    inv = result.data[0] if result.data else None
    if not inv:
        raise ValueError("Invoice not found")
    amount = float(inv.get("total", 0))
    if amount <= 0:
        raise ValueError("Invoice total is zero — nothing to charge.")

    success_url = f"{origin_url.rstrip('/')}/pay/success?session_id={{CHECKOUT_SESSION_ID}}&invoice={invoice_id}"
    cancel_url = f"{origin_url.rstrip('/')}/pay/cancel?invoice={invoice_id}"

    metadata = {
        "invoice_id": invoice_id,
        "invoice_number": inv.get("number", ""),
        "client_email": inv.get("client_email", "") or "",
        "client_name": inv.get("client_name", "") or "",
    }

    stripe.api_key = STRIPE_API_KEY
    session = await asyncio.to_thread(
        stripe.checkout.Session.create,
        payment_method_types=["card"],
        line_items=[{
            "price_data": {
                "currency": "cad",
                "product_data": {"name": f"Invoice {inv.get('number', invoice_id)}"},
                "unit_amount": int(round(amount, 2) * 100),
            },
            "quantity": 1,
        }],
        mode="payment",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata=metadata,
    )

    txn = {
        "id": new_uuid(),
        "session_id": session.id,
        "invoice_id": invoice_id,
        "invoice_number": inv.get("number", ""),
        "amount": round(amount, 2),
        "currency": "cad",
        "status": "initiated",
        "payment_status": "pending",
        "checkout_url": session.url,
        "created_at": utcnow_iso(),
        "updated_at": utcnow_iso(),
    }
    await sb.table("payment_transactions").insert(txn).execute()

    return {"url": session.url, "session_id": session.id}


async def poll_checkout_status(session_id: str, host_url: str) -> dict:
    """Get checkout status from Stripe and update local record & invoice (idempotent)."""
    sb = await get_db()
    stripe.api_key = STRIPE_API_KEY

    session = await asyncio.to_thread(stripe.checkout.Session.retrieve, session_id)

    txn_result = await sb.table("payment_transactions").select("*").eq("session_id", session_id).execute()
    txn = txn_result.data[0] if txn_result.data else None

    if not txn:
        return {
            "status": session.status,
            "payment_status": session.payment_status,
            "amount_total": session.amount_total,
            "currency": session.currency,
            "invoice_id": None,
        }

    already_paid = txn.get("payment_status") == "paid"
    await sb.table("payment_transactions").update({
        "status": session.status,
        "payment_status": session.payment_status,
        "updated_at": utcnow_iso(),
    }).eq("session_id", session_id).execute()

    invoice_id = txn.get("invoice_id")
    if session.payment_status == "paid" and not already_paid and invoice_id:
        await sb.table("invoices").update({
            "status": "paid",
            "updated_at": utcnow_iso(),
        }).eq("id", invoice_id).execute()

        payment_doc = {
            "id": new_uuid(),
            "invoice_id": invoice_id,
            "client_id": None,
            "amount": float(session.amount_total) / 100.0 if session.amount_total else txn.get("amount", 0),
            "method": "stripe",
            "reference": session_id,
            "received_at": utcnow_iso(),
            "notes": f"Stripe checkout {session_id}",
            "created_at": utcnow_iso(),
            "updated_at": utcnow_iso(),
        }
        await sb.table("payments").insert(payment_doc).execute()

    return {
        "status": session.status,
        "payment_status": session.payment_status,
        "amount_total": session.amount_total,
        "currency": session.currency,
        "invoice_id": invoice_id,
    }


async def handle_stripe_webhook(body: bytes, signature: Optional[str], host_url: str) -> dict:
    sb = await get_db()
    stripe.api_key = STRIPE_API_KEY

    try:
        event = await asyncio.to_thread(
            stripe.Webhook.construct_event,
            body,
            signature or "",
            STRIPE_WEBHOOK_SECRET,
        )
    except stripe.error.SignatureVerificationError:
        raise ValueError("Invalid webhook signature")

    session_id = None
    payment_status = None
    event_type = event["type"]

    if event_type in ("checkout.session.completed", "checkout.session.async_payment_succeeded"):
        session_obj = event["data"]["object"]
        session_id = session_obj.get("id")
        payment_status = session_obj.get("payment_status")

    if session_id:
        txn_result = await sb.table("payment_transactions").select("*").eq("session_id", session_id).execute()
        txn = txn_result.data[0] if txn_result.data else None
        if txn:
            already_paid = txn.get("payment_status") == "paid"
            await sb.table("payment_transactions").update({
                "payment_status": payment_status,
                "status": "complete" if payment_status == "paid" else txn.get("status"),
                "updated_at": utcnow_iso(),
            }).eq("session_id", session_id).execute()
            if payment_status == "paid" and not already_paid and txn.get("invoice_id"):
                await sb.table("invoices").update({
                    "status": "paid",
                    "updated_at": utcnow_iso(),
                }).eq("id", txn["invoice_id"]).execute()

    return {"received": True, "event_type": event_type}
