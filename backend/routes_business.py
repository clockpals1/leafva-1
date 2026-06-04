"""Admin-protected business routes: tickets, clients, projects, invoices, etc."""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException

from db import get_db, utcnow_iso
from auth import require_admin
from models import (
    AdminUser,
    Ticket, TicketUpdate, TicketCreate,
    Client, ClientCreate,
    Project, ProjectCreate,
    Invoice, InvoiceCreate, InvoiceLine,
    Payment, PaymentCreate,
    BookkeepingEntry, BookkeepingCreate,
    Employee, EmployeeCreate,
    PurchaseOrder, PurchaseOrderCreate, POLine,
    EmailLog, EmailSendRequest, EmailComposeRequest, EmailComposeResponse,
    BusinessSettings, SettingsUpdate,
)
from ai_chat import compose_email
from email_service import get_settings, send_email

router = APIRouter(prefix="/api", tags=["admin"])


# ---------- Helpers ----------
async def _list_collection(name: str, model_cls, limit: int = 500):
    sb = await get_db()
    result = await sb.table(name).select("*").order("created_at", desc=True).limit(limit).execute()
    return [model_cls(**d) for d in result.data]


# ---------- Dashboard ----------
@router.get("/analytics/dashboard")
async def dashboard(_: AdminUser = Depends(require_admin)):
    sb = await get_db()
    tickets_all = await sb.table("tickets").select("*", count="exact").execute()
    tickets_total = tickets_all.count or 0
    open_r = await sb.table("tickets").select("*", count="exact").in_("status", ["new", "in_progress", "waiting"]).execute()
    open_tickets = open_r.count or 0
    emerg_r = await sb.table("tickets").select("*", count="exact").eq("urgency", "emergency").neq("status", "closed").execute()
    emergency = emerg_r.count or 0
    clients_r = await sb.table("clients").select("*", count="exact").execute()
    clients_total = clients_r.count or 0
    inv_all = await sb.table("invoices").select("*", count="exact").execute()
    invoices_total = inv_all.count or 0
    paid_r = await sb.table("invoices").select("total").eq("status", "paid").execute()
    paid_invoices = len(paid_r.data)
    revenue = sum(float(r.get("total", 0) or 0) for r in paid_r.data)
    recent_r = await sb.table("tickets").select("*").order("created_at", desc=True).limit(5).execute()
    return {
        "tickets_total": tickets_total,
        "open_tickets": open_tickets,
        "emergency_tickets": emergency,
        "clients_total": clients_total,
        "invoices_total": invoices_total,
        "paid_invoices": paid_invoices,
        "revenue": round(revenue, 2),
        "recent_tickets": recent_r.data,
    }


# ---------- Settings ----------
@router.get("/settings")
async def get_settings_route(_: AdminUser = Depends(require_admin)):
    s = await get_settings()
    return s.model_dump()


@router.put("/settings")
async def update_settings(payload: SettingsUpdate, _: AdminUser = Depends(require_admin)):
    sb = await get_db()
    s = await get_settings()
    data = payload.model_dump(exclude_none=True)
    for k, v in data.items():
        setattr(s, k, v)
    s.updated_at = utcnow_iso()
    await sb.table("business_settings").upsert(s.to_db()).execute()
    return s.model_dump()


@router.get("/settings/public")
async def public_settings():
    """Subset of settings exposed publicly (no secrets)."""
    s = await get_settings()
    return {
        "company_name": s.company_name,
        "tagline": s.tagline,
        "ontario_reg_number": s.ontario_reg_number,
        "business_number": s.business_number,
        "address": s.address,
        "phone": s.phone,
        "contact_email": s.contact_email,
    }


# ---------- Tickets ----------
@router.get("/tickets", response_model=List[Ticket])
async def list_tickets(status: Optional[str] = None, _: AdminUser = Depends(require_admin)):
    sb = await get_db()
    q = sb.table("tickets").select("*").order("created_at", desc=True).limit(500)
    if status:
        q = q.eq("status", status)
    result = await q.execute()
    return [Ticket(**d) for d in result.data]


@router.post("/tickets", response_model=Ticket)
async def create_ticket(payload: TicketCreate, _: AdminUser = Depends(require_admin)):
    sb = await get_db()
    t = Ticket(**payload.model_dump())
    await sb.table("tickets").insert(t.to_db()).execute()
    return t


@router.get("/tickets/{ticket_id}", response_model=Ticket)
async def get_ticket(ticket_id: str, _: AdminUser = Depends(require_admin)):
    sb = await get_db()
    result = await sb.table("tickets").select("*").eq("id", ticket_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return Ticket(**result.data[0])


@router.put("/tickets/{ticket_id}", response_model=Ticket)
async def update_ticket(ticket_id: str, payload: TicketUpdate, _: AdminUser = Depends(require_admin)):
    sb = await get_db()
    result = await sb.table("tickets").select("*").eq("id", ticket_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Ticket not found")
    doc = result.data[0]
    update = payload.model_dump(exclude_none=True)
    update["updated_at"] = utcnow_iso()
    await sb.table("tickets").update(update).eq("id", ticket_id).execute()
    doc.update(update)
    return Ticket(**doc)


@router.delete("/tickets/{ticket_id}")
async def delete_ticket(ticket_id: str, _: AdminUser = Depends(require_admin)):
    sb = await get_db()
    await sb.table("tickets").delete().eq("id", ticket_id).execute()
    return {"deleted": 1}


# ---------- Clients ----------
@router.get("/clients", response_model=List[Client])
async def list_clients(_: AdminUser = Depends(require_admin)):
    return await _list_collection("clients", Client)


@router.post("/clients", response_model=Client)
async def create_client(payload: ClientCreate, _: AdminUser = Depends(require_admin)):
    sb = await get_db()
    c = Client(**payload.model_dump())
    await sb.table("clients").insert(c.to_db()).execute()
    return c


@router.put("/clients/{cid}", response_model=Client)
async def update_client(cid: str, payload: ClientCreate, _: AdminUser = Depends(require_admin)):
    sb = await get_db()
    result = await sb.table("clients").select("*").eq("id", cid).execute()
    if not result.data:
        raise HTTPException(404, "Client not found")
    doc = result.data[0]
    update = payload.model_dump()
    update["updated_at"] = utcnow_iso()
    await sb.table("clients").update(update).eq("id", cid).execute()
    doc.update(update)
    return Client(**doc)


@router.delete("/clients/{cid}")
async def delete_client(cid: str, _: AdminUser = Depends(require_admin)):
    sb = await get_db()
    await sb.table("clients").delete().eq("id", cid).execute()
    return {"deleted": 1}


# ---------- Projects ----------
@router.get("/projects", response_model=List[Project])
async def list_projects(_: AdminUser = Depends(require_admin)):
    return await _list_collection("projects", Project)


@router.post("/projects", response_model=Project)
async def create_project(payload: ProjectCreate, _: AdminUser = Depends(require_admin)):
    sb = await get_db()
    p = Project(**payload.model_dump())
    await sb.table("projects").insert(p.to_db()).execute()
    return p


@router.put("/projects/{pid}", response_model=Project)
async def update_project(pid: str, payload: ProjectCreate, _: AdminUser = Depends(require_admin)):
    sb = await get_db()
    result = await sb.table("projects").select("*").eq("id", pid).execute()
    if not result.data:
        raise HTTPException(404, "Project not found")
    doc = result.data[0]
    update = payload.model_dump()
    update["updated_at"] = utcnow_iso()
    await sb.table("projects").update(update).eq("id", pid).execute()
    doc.update(update)
    return Project(**doc)


@router.delete("/projects/{pid}")
async def delete_project(pid: str, _: AdminUser = Depends(require_admin)):
    sb = await get_db()
    await sb.table("projects").delete().eq("id", pid).execute()
    return {"deleted": 1}


# ---------- Invoices ----------
def _compute_invoice(payload_dict: dict) -> dict:
    lines_raw = payload_dict.get("lines", []) or []
    lines = []
    subtotal = 0.0
    for ln in lines_raw:
        if isinstance(ln, InvoiceLine):
            ln = ln.model_dump()
        qty = float(ln.get("qty", 1) or 0)
        rate = float(ln.get("rate", 0) or 0)
        amount = round(qty * rate, 2)
        ln["qty"] = qty
        ln["rate"] = rate
        ln["amount"] = amount
        subtotal += amount
        lines.append(ln)
    tax_rate = float(payload_dict.get("tax_rate", 13.0) or 0)
    tax = round(subtotal * tax_rate / 100, 2)
    total = round(subtotal + tax, 2)
    payload_dict["lines"] = lines
    payload_dict["subtotal"] = round(subtotal, 2)
    payload_dict["tax"] = tax
    payload_dict["total"] = total
    return payload_dict


@router.get("/invoices", response_model=List[Invoice])
async def list_invoices(_: AdminUser = Depends(require_admin)):
    return await _list_collection("invoices", Invoice)


@router.post("/invoices", response_model=Invoice)
async def create_invoice(payload: InvoiceCreate, _: AdminUser = Depends(require_admin)):
    sb = await get_db()
    data = _compute_invoice(payload.model_dump())
    inv = Invoice(**data)
    await sb.table("invoices").insert(inv.to_db()).execute()
    return inv


@router.put("/invoices/{iid}", response_model=Invoice)
async def update_invoice(iid: str, payload: InvoiceCreate, _: AdminUser = Depends(require_admin)):
    sb = await get_db()
    result = await sb.table("invoices").select("*").eq("id", iid).execute()
    if not result.data:
        raise HTTPException(404, "Invoice not found")
    doc = result.data[0]
    data = _compute_invoice(payload.model_dump())
    data["updated_at"] = utcnow_iso()
    await sb.table("invoices").update(data).eq("id", iid).execute()
    doc.update(data)
    return Invoice(**doc)


@router.delete("/invoices/{iid}")
async def delete_invoice(iid: str, _: AdminUser = Depends(require_admin)):
    sb = await get_db()
    await sb.table("invoices").delete().eq("id", iid).execute()
    return {"deleted": 1}


# ---------- Payments ----------
@router.get("/payments", response_model=List[Payment])
async def list_payments(_: AdminUser = Depends(require_admin)):
    return await _list_collection("payments", Payment)


@router.post("/payments", response_model=Payment)
async def create_payment(payload: PaymentCreate, _: AdminUser = Depends(require_admin)):
    sb = await get_db()
    p = Payment(**payload.model_dump())
    await sb.table("payments").insert(p.to_db()).execute()
    if p.invoice_id:
        inv_r = await sb.table("invoices").select("total").eq("id", p.invoice_id).execute()
        if inv_r.data and p.amount >= float(inv_r.data[0].get("total", 0)) - 0.01:
            await sb.table("invoices").update({"status": "paid", "updated_at": utcnow_iso()}).eq("id", p.invoice_id).execute()
    return p


@router.delete("/payments/{pid}")
async def delete_payment(pid: str, _: AdminUser = Depends(require_admin)):
    sb = await get_db()
    await sb.table("payments").delete().eq("id", pid).execute()
    return {"deleted": 1}


# ---------- Bookkeeping ----------
@router.get("/bookkeeping", response_model=List[BookkeepingEntry])
async def list_bookkeeping(_: AdminUser = Depends(require_admin)):
    return await _list_collection("bookkeeping", BookkeepingEntry)


@router.post("/bookkeeping", response_model=BookkeepingEntry)
async def create_bookkeeping(payload: BookkeepingCreate, _: AdminUser = Depends(require_admin)):
    sb = await get_db()
    data = payload.model_dump()
    if not data.get("date"):
        data["date"] = utcnow_iso()
    entry = BookkeepingEntry(**data)
    await sb.table("bookkeeping").insert(entry.to_db()).execute()
    return entry


@router.delete("/bookkeeping/{bid}")
async def delete_bookkeeping(bid: str, _: AdminUser = Depends(require_admin)):
    sb = await get_db()
    await sb.table("bookkeeping").delete().eq("id", bid).execute()
    return {"deleted": 1}


@router.get("/bookkeeping/summary")
async def bookkeeping_summary(_: AdminUser = Depends(require_admin)):
    sb = await get_db()
    result = await sb.table("bookkeeping").select("type,amount").execute()
    income = sum(float(e.get("amount", 0)) for e in result.data if e.get("type") == "income")
    expense = sum(float(e.get("amount", 0)) for e in result.data if e.get("type") != "income")
    return {"income": round(income, 2), "expense": round(expense, 2), "net": round(income - expense, 2)}


# ---------- Payroll ----------
@router.get("/employees", response_model=List[Employee])
async def list_employees(_: AdminUser = Depends(require_admin)):
    return await _list_collection("employees", Employee)


@router.post("/employees", response_model=Employee)
async def create_employee(payload: EmployeeCreate, _: AdminUser = Depends(require_admin)):
    sb = await get_db()
    e = Employee(**payload.model_dump())
    await sb.table("employees").insert(e.to_db()).execute()
    return e


@router.put("/employees/{eid}", response_model=Employee)
async def update_employee(eid: str, payload: EmployeeCreate, _: AdminUser = Depends(require_admin)):
    sb = await get_db()
    result = await sb.table("employees").select("*").eq("id", eid).execute()
    if not result.data:
        raise HTTPException(404, "Employee not found")
    doc = result.data[0]
    update = payload.model_dump()
    update["updated_at"] = utcnow_iso()
    await sb.table("employees").update(update).eq("id", eid).execute()
    doc.update(update)
    return Employee(**doc)


@router.delete("/employees/{eid}")
async def delete_employee(eid: str, _: AdminUser = Depends(require_admin)):
    sb = await get_db()
    await sb.table("employees").delete().eq("id", eid).execute()
    return {"deleted": 1}


# ---------- Purchase Orders ----------
def _compute_po(payload_dict: dict) -> dict:
    lines = payload_dict.get("lines", []) or []
    total = 0.0
    out = []
    for ln in lines:
        if isinstance(ln, POLine):
            ln = ln.model_dump()
        qty = float(ln.get("qty", 1) or 0)
        price = float(ln.get("unit_price", 0) or 0)
        amt = round(qty * price, 2)
        ln["qty"] = qty
        ln["unit_price"] = price
        ln["amount"] = amt
        total += amt
        out.append(ln)
    payload_dict["lines"] = out
    payload_dict["total"] = round(total, 2)
    return payload_dict


@router.get("/purchase-orders", response_model=List[PurchaseOrder])
async def list_pos(_: AdminUser = Depends(require_admin)):
    return await _list_collection("purchase_orders", PurchaseOrder)


@router.post("/purchase-orders", response_model=PurchaseOrder)
async def create_po(payload: PurchaseOrderCreate, _: AdminUser = Depends(require_admin)):
    sb = await get_db()
    data = _compute_po(payload.model_dump())
    po = PurchaseOrder(**data)
    await sb.table("purchase_orders").insert(po.to_db()).execute()
    return po


@router.put("/purchase-orders/{poid}", response_model=PurchaseOrder)
async def update_po(poid: str, payload: PurchaseOrderCreate, _: AdminUser = Depends(require_admin)):
    sb = await get_db()
    result = await sb.table("purchase_orders").select("*").eq("id", poid).execute()
    if not result.data:
        raise HTTPException(404, "PO not found")
    doc = result.data[0]
    data = _compute_po(payload.model_dump())
    data["updated_at"] = utcnow_iso()
    await sb.table("purchase_orders").update(data).eq("id", poid).execute()
    doc.update(data)
    return PurchaseOrder(**doc)


@router.delete("/purchase-orders/{poid}")
async def delete_po(poid: str, _: AdminUser = Depends(require_admin)):
    sb = await get_db()
    await sb.table("purchase_orders").delete().eq("id", poid).execute()
    return {"deleted": 1}


# ---------- Email composer + sender + logs ----------
@router.post("/email/compose", response_model=EmailComposeResponse)
async def email_compose(payload: EmailComposeRequest, _: AdminUser = Depends(require_admin)):
    s = await get_settings()
    result = await compose_email(
        context=payload.context,
        tone=payload.tone,
        purpose=payload.purpose,
        recipient_name=payload.recipient_name or "",
        provider=s.ai_provider,
        model=s.ai_model,
        api_key=s.groq_api_key,
    )
    return EmailComposeResponse(**result)


@router.post("/email/send")
async def email_send(payload: EmailSendRequest, _: AdminUser = Depends(require_admin)):
    result = await send_email(
        to=payload.to,
        subject=payload.subject,
        body=payload.body,
        related_ticket_id=payload.related_ticket_id,
        related_invoice_id=payload.related_invoice_id,
    )
    return result


@router.get("/email/logs", response_model=List[EmailLog])
async def email_logs(limit: int = 50, _: AdminUser = Depends(require_admin)):
    sb = await get_db()
    result = await sb.table("email_logs").select("*").order("created_at", desc=True).limit(limit).execute()
    return [EmailLog(**d) for d in result.data]


# ---------- Chat sessions (admin view) ----------
@router.get("/chat/sessions")
async def list_chat_sessions(limit: int = 50, _: AdminUser = Depends(require_admin)):
    sb = await get_db()
    result = await sb.table("chat_sessions").select("*").order("created_at", desc=True).limit(limit).execute()
    return result.data
