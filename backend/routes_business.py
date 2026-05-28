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
    db = get_db()
    docs = await db[name].find({}, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return [model_cls(**d) for d in docs]


# ---------- Dashboard ----------
@router.get("/analytics/dashboard")
async def dashboard(_: AdminUser = Depends(require_admin)):
    db = get_db()
    tickets_total = await db.tickets.count_documents({})
    open_tickets = await db.tickets.count_documents({"status": {"$in": ["new", "in_progress", "waiting"]}})
    emergency = await db.tickets.count_documents({"urgency": "emergency", "status": {"$ne": "closed"}})
    clients_total = await db.clients.count_documents({})
    invoices_total = await db.invoices.count_documents({})
    paid_invoices = await db.invoices.count_documents({"status": "paid"})
    # Revenue (sum of paid invoice totals)
    revenue_cursor = db.invoices.aggregate([
        {"$match": {"status": "paid"}},
        {"$group": {"_id": None, "sum": {"$sum": "$total"}}},
    ])
    revenue = 0.0
    async for r in revenue_cursor:
        revenue = r.get("sum", 0) or 0
    recent_tickets = await db.tickets.find({}, {"_id": 0}).sort("created_at", -1).to_list(5)
    return {
        "tickets_total": tickets_total,
        "open_tickets": open_tickets,
        "emergency_tickets": emergency,
        "clients_total": clients_total,
        "invoices_total": invoices_total,
        "paid_invoices": paid_invoices,
        "revenue": revenue,
        "recent_tickets": recent_tickets,
    }


# ---------- Settings ----------
@router.get("/settings")
async def get_settings_route(_: AdminUser = Depends(require_admin)):
    s = await get_settings()
    return s.model_dump()


@router.put("/settings")
async def update_settings(payload: SettingsUpdate, _: AdminUser = Depends(require_admin)):
    db = get_db()
    s = await get_settings()
    data = payload.model_dump(exclude_none=True)
    for k, v in data.items():
        setattr(s, k, v)
    s.updated_at = utcnow_iso()
    await db.business_settings.update_one({"id": "singleton"}, {"$set": s.to_mongo()}, upsert=True)
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
    db = get_db()
    q = {}
    if status:
        q["status"] = status
    docs = await db.tickets.find(q, {"_id": 0}).sort("created_at", -1).to_list(500)
    return [Ticket(**d) for d in docs]


@router.post("/tickets", response_model=Ticket)
async def create_ticket(payload: TicketCreate, _: AdminUser = Depends(require_admin)):
    db = get_db()
    t = Ticket(**payload.model_dump())
    await db.tickets.insert_one(t.to_mongo())
    return t


@router.get("/tickets/{ticket_id}", response_model=Ticket)
async def get_ticket(ticket_id: str, _: AdminUser = Depends(require_admin)):
    db = get_db()
    doc = await db.tickets.find_one({"id": ticket_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return Ticket(**doc)


@router.put("/tickets/{ticket_id}", response_model=Ticket)
async def update_ticket(ticket_id: str, payload: TicketUpdate, _: AdminUser = Depends(require_admin)):
    db = get_db()
    doc = await db.tickets.find_one({"id": ticket_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Ticket not found")
    update = payload.model_dump(exclude_none=True)
    update["updated_at"] = utcnow_iso()
    await db.tickets.update_one({"id": ticket_id}, {"$set": update})
    doc.update(update)
    return Ticket(**doc)


@router.delete("/tickets/{ticket_id}")
async def delete_ticket(ticket_id: str, _: AdminUser = Depends(require_admin)):
    db = get_db()
    res = await db.tickets.delete_one({"id": ticket_id})
    return {"deleted": res.deleted_count}


# ---------- Clients ----------
@router.get("/clients", response_model=List[Client])
async def list_clients(_: AdminUser = Depends(require_admin)):
    return await _list_collection("clients", Client)


@router.post("/clients", response_model=Client)
async def create_client(payload: ClientCreate, _: AdminUser = Depends(require_admin)):
    db = get_db()
    c = Client(**payload.model_dump())
    await db.clients.insert_one(c.to_mongo())
    return c


@router.put("/clients/{cid}", response_model=Client)
async def update_client(cid: str, payload: ClientCreate, _: AdminUser = Depends(require_admin)):
    db = get_db()
    doc = await db.clients.find_one({"id": cid}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Client not found")
    update = payload.model_dump()
    update["updated_at"] = utcnow_iso()
    await db.clients.update_one({"id": cid}, {"$set": update})
    doc.update(update)
    return Client(**doc)


@router.delete("/clients/{cid}")
async def delete_client(cid: str, _: AdminUser = Depends(require_admin)):
    db = get_db()
    res = await db.clients.delete_one({"id": cid})
    return {"deleted": res.deleted_count}


# ---------- Projects ----------
@router.get("/projects", response_model=List[Project])
async def list_projects(_: AdminUser = Depends(require_admin)):
    return await _list_collection("projects", Project)


@router.post("/projects", response_model=Project)
async def create_project(payload: ProjectCreate, _: AdminUser = Depends(require_admin)):
    db = get_db()
    p = Project(**payload.model_dump())
    await db.projects.insert_one(p.to_mongo())
    return p


@router.put("/projects/{pid}", response_model=Project)
async def update_project(pid: str, payload: ProjectCreate, _: AdminUser = Depends(require_admin)):
    db = get_db()
    doc = await db.projects.find_one({"id": pid}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Project not found")
    update = payload.model_dump()
    update["updated_at"] = utcnow_iso()
    await db.projects.update_one({"id": pid}, {"$set": update})
    doc.update(update)
    return Project(**doc)


@router.delete("/projects/{pid}")
async def delete_project(pid: str, _: AdminUser = Depends(require_admin)):
    db = get_db()
    res = await db.projects.delete_one({"id": pid})
    return {"deleted": res.deleted_count}


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
    db = get_db()
    data = _compute_invoice(payload.model_dump())
    inv = Invoice(**data)
    await db.invoices.insert_one(inv.to_mongo())
    return inv


@router.put("/invoices/{iid}", response_model=Invoice)
async def update_invoice(iid: str, payload: InvoiceCreate, _: AdminUser = Depends(require_admin)):
    db = get_db()
    doc = await db.invoices.find_one({"id": iid}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Invoice not found")
    data = _compute_invoice(payload.model_dump())
    data["updated_at"] = utcnow_iso()
    await db.invoices.update_one({"id": iid}, {"$set": data})
    doc.update(data)
    return Invoice(**doc)


@router.delete("/invoices/{iid}")
async def delete_invoice(iid: str, _: AdminUser = Depends(require_admin)):
    db = get_db()
    res = await db.invoices.delete_one({"id": iid})
    return {"deleted": res.deleted_count}


# ---------- Payments ----------
@router.get("/payments", response_model=List[Payment])
async def list_payments(_: AdminUser = Depends(require_admin)):
    return await _list_collection("payments", Payment)


@router.post("/payments", response_model=Payment)
async def create_payment(payload: PaymentCreate, _: AdminUser = Depends(require_admin)):
    db = get_db()
    p = Payment(**payload.model_dump())
    await db.payments.insert_one(p.to_mongo())
    # If invoice attached, mark paid if amount covers total
    if p.invoice_id:
        inv = await db.invoices.find_one({"id": p.invoice_id}, {"_id": 0})
        if inv and p.amount >= float(inv.get("total", 0)) - 0.01:
            await db.invoices.update_one({"id": p.invoice_id}, {"$set": {"status": "paid", "updated_at": utcnow_iso()}})
    return p


@router.delete("/payments/{pid}")
async def delete_payment(pid: str, _: AdminUser = Depends(require_admin)):
    db = get_db()
    res = await db.payments.delete_one({"id": pid})
    return {"deleted": res.deleted_count}


# ---------- Bookkeeping ----------
@router.get("/bookkeeping", response_model=List[BookkeepingEntry])
async def list_bookkeeping(_: AdminUser = Depends(require_admin)):
    return await _list_collection("bookkeeping", BookkeepingEntry)


@router.post("/bookkeeping", response_model=BookkeepingEntry)
async def create_bookkeeping(payload: BookkeepingCreate, _: AdminUser = Depends(require_admin)):
    db = get_db()
    data = payload.model_dump()
    if not data.get("date"):
        data["date"] = utcnow_iso()
    entry = BookkeepingEntry(**data)
    await db.bookkeeping.insert_one(entry.to_mongo())
    return entry


@router.delete("/bookkeeping/{bid}")
async def delete_bookkeeping(bid: str, _: AdminUser = Depends(require_admin)):
    db = get_db()
    res = await db.bookkeeping.delete_one({"id": bid})
    return {"deleted": res.deleted_count}


@router.get("/bookkeeping/summary")
async def bookkeeping_summary(_: AdminUser = Depends(require_admin)):
    db = get_db()
    income = 0.0
    expense = 0.0
    async for e in db.bookkeeping.find({}, {"_id": 0}):
        if e.get("type") == "income":
            income += float(e.get("amount", 0))
        else:
            expense += float(e.get("amount", 0))
    return {"income": round(income, 2), "expense": round(expense, 2), "net": round(income - expense, 2)}


# ---------- Payroll ----------
@router.get("/employees", response_model=List[Employee])
async def list_employees(_: AdminUser = Depends(require_admin)):
    return await _list_collection("employees", Employee)


@router.post("/employees", response_model=Employee)
async def create_employee(payload: EmployeeCreate, _: AdminUser = Depends(require_admin)):
    db = get_db()
    e = Employee(**payload.model_dump())
    await db.employees.insert_one(e.to_mongo())
    return e


@router.put("/employees/{eid}", response_model=Employee)
async def update_employee(eid: str, payload: EmployeeCreate, _: AdminUser = Depends(require_admin)):
    db = get_db()
    doc = await db.employees.find_one({"id": eid}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Employee not found")
    update = payload.model_dump()
    update["updated_at"] = utcnow_iso()
    await db.employees.update_one({"id": eid}, {"$set": update})
    doc.update(update)
    return Employee(**doc)


@router.delete("/employees/{eid}")
async def delete_employee(eid: str, _: AdminUser = Depends(require_admin)):
    db = get_db()
    res = await db.employees.delete_one({"id": eid})
    return {"deleted": res.deleted_count}


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
    db = get_db()
    data = _compute_po(payload.model_dump())
    po = PurchaseOrder(**data)
    await db.purchase_orders.insert_one(po.to_mongo())
    return po


@router.put("/purchase-orders/{poid}", response_model=PurchaseOrder)
async def update_po(poid: str, payload: PurchaseOrderCreate, _: AdminUser = Depends(require_admin)):
    db = get_db()
    doc = await db.purchase_orders.find_one({"id": poid}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "PO not found")
    data = _compute_po(payload.model_dump())
    data["updated_at"] = utcnow_iso()
    await db.purchase_orders.update_one({"id": poid}, {"$set": data})
    doc.update(data)
    return PurchaseOrder(**doc)


@router.delete("/purchase-orders/{poid}")
async def delete_po(poid: str, _: AdminUser = Depends(require_admin)):
    db = get_db()
    res = await db.purchase_orders.delete_one({"id": poid})
    return {"deleted": res.deleted_count}


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
    db = get_db()
    docs = await db.email_logs.find({}, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return [EmailLog(**d) for d in docs]


# ---------- Chat sessions (admin view) ----------
@router.get("/chat/sessions")
async def list_chat_sessions(limit: int = 50, _: AdminUser = Depends(require_admin)):
    db = get_db()
    docs = await db.chat_sessions.find({}, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return docs
