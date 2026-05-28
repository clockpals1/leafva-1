# LEAFVA — Product Requirements Document

## Original Problem Statement
Build a cutting-edge, AI-driven business website and backend system for **LEAFVA**, an Ontario-registered IT services company. The brand should feel premium, sharp, and corporate-grade (Tesla-like) with a natural leaf-inspired aesthetic — greens, natural beams, gold accents. The site is interactive, dynamic, and modern. **The AI bot replaces the traditional contact form** and manages user intake, lead qualification, ticketing, email follow-ups, and client communication automatically.

## Architecture
- **Frontend:** React 19 + React Router 7 + Tailwind + Framer Motion + Sonner + Lucide icons. Custom design tokens (`#0A0A0A` bg, `#0B4A2D` deep forest green, `#D4AF37` gold, `#EAE0C8` natural beam). Fonts: **Outfit** (headings) + **Manrope** (body) + **JetBrains Mono** (mono).
- **Backend:** FastAPI + Motor (Mongo) + JWT auth + bcrypt + `emergentintegrations` LlmChat + `resend` SDK.
- **AI:** Claude Sonnet 4.5 (`claude-sonnet-4-5-20250929`) via Emergent Universal LLM Key.
- **Email:** Resend SDK — API key stored in admin Settings (NOT env). Falls back to `mocked` log when key absent.
- **DB:** MongoDB (collections: `admin_users`, `business_settings`, `chat_sessions`, `tickets`, `clients`, `projects`, `invoices`, `payments`, `bookkeeping`, `employees`, `purchase_orders`, `email_logs`).

## User Personas
1. **Visitor / Lead** — lands on marketing site, chats with AI to file an intake.
2. **LEAFVA Admin** — operates the entire business (tickets, CRM, invoices, payroll, etc.) through admin dashboard.

## Core Requirements (Static)
1. Premium animated public website with brand identity.
2. AI chatbot intake replacing all forms — multi-turn lead qualification.
3. Self-managed admin dashboard with: Tickets, Clients (CRM), Projects, Invoices, Payments, Bookkeeping, Payroll, Purchase Orders, AI Email Composer, Settings.
4. JWT-secured admin area.
5. Resend integration configurable from admin Settings (no env hardcoding).
6. Legal pages (Privacy, Terms, AI Disclaimer, Cookies) — PIPEDA/GDPR-aligned.

## Implementation Log
### 2026-02-28 — MVP Build (v1.0)
- Brand & design tokens applied (forest green / gold / dark / beam).
- Public site: Home (hero + 6 services + AI band + CTA), About, Services, Assistant (full-page chat), Contact (chat + direct contact), Legal (4 docs).
- Animated leaf+circuit SVG logo (inline, hover-rotate, gold-stroked).
- Chat dock available on every public page (except dedicated chat pages).
- AI chatbot uses Claude Sonnet 4.5, multi-turn, server-side history, parses `[INTAKE_COMPLETE: {json}]` marker → auto-creates ticket → triggers confirmation + internal notification emails (mocked when Resend not configured).
- Admin dashboard with sidebar layout: Dashboard (KPIs), Tickets (drawer + AI email reply), Clients, Projects, Invoices (line items, tax, auto-total), Payments (auto-marks invoice paid), Bookkeeping (income/expense ledger + summary), Payroll, Purchase Orders, AI Email Composer (compose+send+log), Settings (business info, Resend keys, AI provider/model/prompt — secrets masked).
- Default admin seeded on startup: `admin@leafva.com` / `LeafvaAdmin@2026`.
- Testing: 22/22 backend pytest + 100% critical frontend flows (iteration_1.json).

## Backlog
### P0 — None outstanding
### P1 — Polish & SEO
- Per-route `<title>` tags via react-helmet-async (currently single global title).
- Email templates (HTML branded layouts for ticket confirmation, invoice, follow-up).
- File/document storage for tickets and projects (object storage).
- PDF invoice export.

### P2 — Depth across modules
- Time tracking + billable hours linked to invoices.
- Recurring invoices.
- Two-factor admin login.
- Multi-admin role-based permissions.
- Reporting dashboards (P&L, AR aging, ticket SLA).
- Client portal (clients log in to see their own tickets/invoices).
- Knowledge base / RAG integration for AI assistant.
- Real-time notifications (websocket) when new tickets arrive.

### P3 — Growth
- Subdomain client onboarding flows.
- Stripe payment links on invoices.
- Slack / Teams ticket notifications.

## Credentials
See `/app/memory/test_credentials.md`.
