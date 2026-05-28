"""Stripe payment service for LEAFVA invoices."""
import os
from typing import Optional
from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout,
    CheckoutSessionRequest,
)

from db import get_db, utcnow_iso, new_uuid

STRIPE_API_KEY = os.environ.get("STRIPE_API_KEY", "")


def _client(host_url: str) -> StripeCheckout:
    webhook_url = f"{host_url.rstrip('/')}/api/webhook/stripe"
    return StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)


async def create_invoice_checkout(
    invoice_id: str,
    host_url: str,
    origin_url: str,
) -> dict:
    """Create a Stripe checkout session for an invoice. Returns {url, session_id}."""
    db = get_db()
    inv = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
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

    req = CheckoutSessionRequest(
        amount=round(amount, 2),
        currency="cad",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata=metadata,
    )
    client = _client(host_url)
    session = await client.create_checkout_session(req)

    # Persist transaction
    txn = {
        "id": new_uuid(),
        "session_id": session.session_id,
        "invoice_id": invoice_id,
        "invoice_number": inv.get("number", ""),
        "amount": round(amount, 2),
        "currency": "cad",
        "status": "initiated",
        "payment_status": "pending",
        "metadata": metadata,
        "checkout_url": session.url,
        "created_at": utcnow_iso(),
        "updated_at": utcnow_iso(),
    }
    await db.payment_transactions.insert_one(txn)

    return {"url": session.url, "session_id": session.session_id}


async def poll_checkout_status(session_id: str, host_url: str) -> dict:
    """Get checkout status from Stripe and update local record & invoice (idempotent)."""
    db = get_db()
    client = _client(host_url)
    status = await client.get_checkout_status(session_id)

    txn = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if not txn:
        return {
            "status": status.status,
            "payment_status": status.payment_status,
            "amount_total": status.amount_total,
            "currency": status.currency,
            "invoice_id": None,
        }

    already_paid = txn.get("payment_status") == "paid"
    update = {
        "status": status.status,
        "payment_status": status.payment_status,
        "updated_at": utcnow_iso(),
    }
    await db.payment_transactions.update_one({"session_id": session_id}, {"$set": update})

    # Mark invoice paid only once
    invoice_id = txn.get("invoice_id")
    if status.payment_status == "paid" and not already_paid and invoice_id:
        await db.invoices.update_one(
            {"id": invoice_id},
            {"$set": {"status": "paid", "updated_at": utcnow_iso()}},
        )
        # Log a payment record
        payment_doc = {
            "id": new_uuid(),
            "invoice_id": invoice_id,
            "client_id": None,
            "amount": float(status.amount_total) / 100.0 if status.amount_total else txn.get("amount", 0),
            "method": "stripe",
            "reference": session_id,
            "received_at": utcnow_iso(),
            "notes": f"Stripe checkout {session_id}",
            "created_at": utcnow_iso(),
            "updated_at": utcnow_iso(),
        }
        await db.payments.insert_one(payment_doc)

    return {
        "status": status.status,
        "payment_status": status.payment_status,
        "amount_total": status.amount_total,
        "currency": status.currency,
        "invoice_id": invoice_id,
    }


async def handle_stripe_webhook(body: bytes, signature: Optional[str], host_url: str) -> dict:
    db = get_db()
    client = _client(host_url)
    event = await client.handle_webhook(body, signature)

    if event.session_id:
        txn = await db.payment_transactions.find_one({"session_id": event.session_id}, {"_id": 0})
        if txn:
            already_paid = txn.get("payment_status") == "paid"
            await db.payment_transactions.update_one(
                {"session_id": event.session_id},
                {"$set": {
                    "payment_status": event.payment_status,
                    "status": "complete" if event.payment_status == "paid" else txn.get("status"),
                    "updated_at": utcnow_iso(),
                }},
            )
            if event.payment_status == "paid" and not already_paid and txn.get("invoice_id"):
                await db.invoices.update_one(
                    {"id": txn["invoice_id"]},
                    {"$set": {"status": "paid", "updated_at": utcnow_iso()}},
                )
    return {"received": True, "event_type": event.event_type}
