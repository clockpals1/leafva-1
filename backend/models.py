"""Pydantic models for LEAFVA."""
from typing import List, Optional, Literal
from pydantic import BaseModel, Field, EmailStr
from db import BaseDocument, utcnow_iso, new_uuid


# ---------- Auth ----------
class AdminUser(BaseDocument):
    email: str
    name: str = "Admin"
    password_hash: str
    role: str = "admin"


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


# ---------- Settings ----------
class BusinessSettings(BaseDocument):
    company_name: str = "LEAFVA"
    tagline: str = "IT Intelligence, Powered by Nature and Technology"
    ontario_reg_number: str = "Ontario Reg. #XXXXXXXXX"
    business_number: str = ""
    address: str = "Ontario, Canada"
    phone: str = "+1 (000) 000-0000"
    contact_email: str = "hello@leafva.com"
    # Resend
    resend_api_key: str = ""
    resend_sender_email: str = "noreply@leafva.com"
    resend_notify_email: str = "support@leafva.com"
    # AI
    ai_provider: str = "anthropic"
    ai_model: str = "claude-sonnet-4-5-20250929"
    ai_system_prompt: str = (
        "You are the LEAFVA AI Assistant — a premium, professional intake agent for "
        "LEAFVA, an Ontario-registered IT services company. You handle leads with "
        "warmth, clarity, and corporate polish. Greet new visitors with: "
        "'Welcome to LEAFVA. Tell me what you need.' Then guide them through: "
        "(1) Service category — IT Support, AI Services, Networking & Cable Run, "
        "Application Design, System Administration, or Subcontracted Technical Services. "
        "(2) Urgency — low, medium, high, or emergency. "
        "(3) Technical details — describe the system, device, issue, or project goal. "
        "(4) Contact info — full name, email, and phone (only when ready to file the ticket). "
        "Keep replies concise (1–3 sentences). Show empathy on emergencies. "
        "Briefly mention our AI disclaimer when first collecting personal data. "
        "When you have all required fields, end your final message with the exact marker on a new line: "
        "[INTAKE_COMPLETE: {\"category\":\"...\",\"urgency\":\"...\",\"details\":\"...\","
        "\"name\":\"...\",\"email\":\"...\",\"phone\":\"...\"}] — values must be strings."
    )


class SettingsUpdate(BaseModel):
    company_name: Optional[str] = None
    tagline: Optional[str] = None
    ontario_reg_number: Optional[str] = None
    business_number: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    contact_email: Optional[str] = None
    resend_api_key: Optional[str] = None
    resend_sender_email: Optional[str] = None
    resend_notify_email: Optional[str] = None
    ai_provider: Optional[str] = None
    ai_model: Optional[str] = None
    ai_system_prompt: Optional[str] = None


# ---------- Chat ----------
class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str
    ts: str = Field(default_factory=utcnow_iso)


class ChatSession(BaseDocument):
    visitor_id: Optional[str] = None
    messages: List[ChatMessage] = Field(default_factory=list)
    intake_complete: bool = False
    intake_data: Optional[dict] = None
    ticket_id: Optional[str] = None


class ChatMessageIn(BaseModel):
    session_id: Optional[str] = None
    message: str


class ChatMessageOut(BaseModel):
    session_id: str
    reply: str
    intake_complete: bool
    ticket_id: Optional[str] = None


# ---------- Tickets ----------
class Ticket(BaseDocument):
    code: str = Field(default_factory=lambda: f"TCK-{new_uuid()[:8].upper()}")
    name: str
    email: str
    phone: Optional[str] = ""
    category: str = "IT Support"
    urgency: Literal["low", "medium", "high", "emergency"] = "medium"
    details: str = ""
    status: Literal["new", "in_progress", "waiting", "resolved", "closed"] = "new"
    assignee: Optional[str] = ""
    source: str = "ai_chat"
    notes: List[dict] = Field(default_factory=list)
    chat_session_id: Optional[str] = None


class TicketUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    category: Optional[str] = None
    urgency: Optional[str] = None
    details: Optional[str] = None
    status: Optional[str] = None
    assignee: Optional[str] = None


class TicketCreate(BaseModel):
    name: str
    email: str
    phone: Optional[str] = ""
    category: str = "IT Support"
    urgency: str = "medium"
    details: str = ""


# ---------- Clients (CRM) ----------
class Client(BaseDocument):
    name: str
    company: Optional[str] = ""
    email: str
    phone: Optional[str] = ""
    address: Optional[str] = ""
    notes: Optional[str] = ""
    tags: List[str] = Field(default_factory=list)
    status: Literal["lead", "active", "inactive"] = "lead"


class ClientCreate(BaseModel):
    name: str
    company: Optional[str] = ""
    email: str
    phone: Optional[str] = ""
    address: Optional[str] = ""
    notes: Optional[str] = ""
    tags: List[str] = Field(default_factory=list)
    status: str = "lead"


# ---------- Projects ----------
class Project(BaseDocument):
    name: str
    client_id: Optional[str] = None
    description: str = ""
    status: Literal["planning", "active", "on_hold", "completed"] = "planning"
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    budget: float = 0.0


class ProjectCreate(BaseModel):
    name: str
    client_id: Optional[str] = None
    description: str = ""
    status: str = "planning"
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    budget: float = 0.0


# ---------- Invoices ----------
class InvoiceLine(BaseModel):
    description: str
    qty: float = 1
    rate: float = 0
    amount: float = 0


class Invoice(BaseDocument):
    number: str = Field(default_factory=lambda: f"INV-{new_uuid()[:8].upper()}")
    client_id: Optional[str] = None
    client_name: str = ""
    client_email: str = ""
    issue_date: str = Field(default_factory=utcnow_iso)
    due_date: Optional[str] = None
    lines: List[InvoiceLine] = Field(default_factory=list)
    subtotal: float = 0
    tax_rate: float = 13.0
    tax: float = 0
    total: float = 0
    status: Literal["draft", "sent", "paid", "overdue", "void"] = "draft"
    notes: str = ""


class InvoiceCreate(BaseModel):
    client_id: Optional[str] = None
    client_name: str = ""
    client_email: str = ""
    due_date: Optional[str] = None
    lines: List[InvoiceLine] = Field(default_factory=list)
    tax_rate: float = 13.0
    notes: str = ""
    status: str = "draft"


# ---------- Payments ----------
class Payment(BaseDocument):
    invoice_id: Optional[str] = None
    client_id: Optional[str] = None
    amount: float
    method: str = "bank_transfer"
    reference: str = ""
    received_at: str = Field(default_factory=utcnow_iso)
    notes: str = ""


class PaymentCreate(BaseModel):
    invoice_id: Optional[str] = None
    client_id: Optional[str] = None
    amount: float
    method: str = "bank_transfer"
    reference: str = ""
    notes: str = ""


# ---------- Bookkeeping ----------
class BookkeepingEntry(BaseDocument):
    date: str = Field(default_factory=utcnow_iso)
    type: Literal["income", "expense"] = "expense"
    category: str = "general"
    amount: float
    description: str = ""
    reference: str = ""


class BookkeepingCreate(BaseModel):
    type: str = "expense"
    category: str = "general"
    amount: float
    description: str = ""
    reference: str = ""
    date: Optional[str] = None


# ---------- Payroll / Staff ----------
class Employee(BaseDocument):
    name: str
    email: str
    role: str = "Technician"
    salary: float = 0
    status: Literal["active", "on_leave", "terminated"] = "active"
    hire_date: Optional[str] = None


class EmployeeCreate(BaseModel):
    name: str
    email: str
    role: str = "Technician"
    salary: float = 0
    status: str = "active"
    hire_date: Optional[str] = None


# ---------- Purchase Orders ----------
class POLine(BaseModel):
    description: str
    qty: float = 1
    unit_price: float = 0
    amount: float = 0


class PurchaseOrder(BaseDocument):
    number: str = Field(default_factory=lambda: f"PO-{new_uuid()[:8].upper()}")
    vendor: str = ""
    vendor_email: str = ""
    lines: List[POLine] = Field(default_factory=list)
    total: float = 0
    status: Literal["draft", "issued", "received", "cancelled"] = "draft"
    notes: str = ""


class PurchaseOrderCreate(BaseModel):
    vendor: str = ""
    vendor_email: str = ""
    lines: List[POLine] = Field(default_factory=list)
    status: str = "draft"
    notes: str = ""


# ---------- Email log + composer ----------
class EmailLog(BaseDocument):
    to: str
    subject: str
    body: str
    status: Literal["queued", "sent", "failed", "mocked"] = "queued"
    error: str = ""
    related_ticket_id: Optional[str] = None
    related_invoice_id: Optional[str] = None


class EmailSendRequest(BaseModel):
    to: str
    subject: str
    body: str
    related_ticket_id: Optional[str] = None
    related_invoice_id: Optional[str] = None


class EmailComposeRequest(BaseModel):
    context: str
    tone: str = "professional"
    purpose: str = "ticket_followup"
    recipient_name: Optional[str] = ""


class EmailComposeResponse(BaseModel):
    subject: str
    body: str
