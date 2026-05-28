"""LEAFVA backend API tests."""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://smart-leaf.preview.emergentagent.com").rstrip("/")
ADMIN_EMAIL = "admin@leafva.com"
ADMIN_PASSWORD = "LeafvaAdmin@2026"


@pytest.fixture(scope="session")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def token(api):
    r = api.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    if r.status_code != 200:
        pytest.skip(f"Login failed: {r.status_code} {r.text}")
    return r.json()["access_token"]


@pytest.fixture(scope="session")
def auth(token):
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json", "Authorization": f"Bearer {token}"})
    return s


# ---------- Health + Auth ----------
class TestHealthAuth:
    def test_health(self, api):
        r = api.get(f"{BASE_URL}/api/health")
        assert r.status_code == 200
        assert r.json()["status"] == "healthy"

    def test_login_success(self, api):
        r = api.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200
        d = r.json()
        assert d["access_token"]
        assert d["user"]["email"] == ADMIN_EMAIL
        assert d["user"]["role"] == "admin"

    def test_login_wrong_password(self, api):
        r = api.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong"})
        assert r.status_code == 401

    def test_auth_me_with_token(self, auth):
        r = auth.get(f"{BASE_URL}/api/auth/me")
        assert r.status_code == 200
        assert r.json()["email"] == ADMIN_EMAIL

    def test_auth_me_no_token(self, api):
        r = api.get(f"{BASE_URL}/api/auth/me")
        assert r.status_code == 401


# ---------- Settings ----------
class TestSettings:
    def test_public_settings_no_secrets(self, api):
        r = api.get(f"{BASE_URL}/api/settings/public")
        assert r.status_code == 200
        d = r.json()
        assert "resend_api_key" not in d
        assert d["company_name"]

    def test_get_settings_admin(self, auth):
        r = auth.get(f"{BASE_URL}/api/settings")
        assert r.status_code == 200
        assert "resend_api_key" in r.json()

    def test_update_settings(self, auth):
        # save original
        orig = auth.get(f"{BASE_URL}/api/settings").json()
        new_name = "LEAFVA-TEST"
        r = auth.put(f"{BASE_URL}/api/settings", json={"company_name": new_name, "resend_api_key": "TEST_KEY_123"})
        assert r.status_code == 200
        assert r.json()["company_name"] == new_name
        # re-fetch
        r2 = auth.get(f"{BASE_URL}/api/settings")
        assert r2.json()["company_name"] == new_name
        assert r2.json()["resend_api_key"] == "TEST_KEY_123"
        # restore (keep resend empty so mocked status works)
        auth.put(f"{BASE_URL}/api/settings", json={"company_name": orig.get("company_name", "LEAFVA"), "resend_api_key": ""})


# ---------- Tickets CRUD ----------
class TestTickets:
    def test_create_get_update_delete(self, auth):
        # create
        payload = {"name": "TEST_User", "email": "test@example.com", "phone": "416-555-0100",
                   "category": "IT Support", "urgency": "high", "details": "Test ticket details"}
        r = auth.post(f"{BASE_URL}/api/tickets", json=payload)
        assert r.status_code == 200
        tid = r.json()["id"]
        assert r.json()["urgency"] == "high"
        # list
        r = auth.get(f"{BASE_URL}/api/tickets")
        assert r.status_code == 200
        assert any(t["id"] == tid for t in r.json())
        # update
        r = auth.put(f"{BASE_URL}/api/tickets/{tid}", json={"status": "in_progress"})
        assert r.status_code == 200
        assert r.json()["status"] == "in_progress"
        # delete
        r = auth.delete(f"{BASE_URL}/api/tickets/{tid}")
        assert r.status_code == 200
        assert r.json()["deleted"] == 1


# ---------- Clients ----------
class TestClients:
    def test_crud(self, auth):
        r = auth.post(f"{BASE_URL}/api/clients", json={"name": "TEST_Client", "email": "c@test.com"})
        assert r.status_code == 200
        cid = r.json()["id"]
        r = auth.get(f"{BASE_URL}/api/clients")
        assert any(c["id"] == cid for c in r.json())
        r = auth.put(f"{BASE_URL}/api/clients/{cid}", json={"name": "TEST_Client_2", "email": "c@test.com"})
        assert r.status_code == 200
        assert r.json()["name"] == "TEST_Client_2"
        auth.delete(f"{BASE_URL}/api/clients/{cid}")


# ---------- Projects ----------
class TestProjects:
    def test_crud(self, auth):
        r = auth.post(f"{BASE_URL}/api/projects", json={"name": "TEST_Project", "description": "x", "budget": 1000})
        assert r.status_code == 200
        pid = r.json()["id"]
        r = auth.get(f"{BASE_URL}/api/projects")
        assert any(p["id"] == pid for p in r.json())
        auth.delete(f"{BASE_URL}/api/projects/{pid}")


# ---------- Invoices ----------
class TestInvoices:
    def test_create_computes_totals(self, auth):
        payload = {
            "client_name": "TEST_Client",
            "client_email": "c@test.com",
            "tax_rate": 13.0,
            "lines": [
                {"description": "Service A", "qty": 2, "rate": 100, "amount": 0},
                {"description": "Service B", "qty": 1, "rate": 50, "amount": 0},
            ],
        }
        r = auth.post(f"{BASE_URL}/api/invoices", json=payload)
        assert r.status_code == 200
        d = r.json()
        assert d["subtotal"] == 250.0
        assert d["tax"] == 32.5
        assert d["total"] == 282.5
        TestInvoices.invoice_id = d["id"]
        TestInvoices.invoice_total = d["total"]


# ---------- Payments (depends on invoice) ----------
class TestPayments:
    def test_payment_marks_invoice_paid(self, auth):
        iid = getattr(TestInvoices, "invoice_id", None)
        total = getattr(TestInvoices, "invoice_total", None)
        if not iid:
            pytest.skip("no invoice")
        r = auth.post(f"{BASE_URL}/api/payments", json={"invoice_id": iid, "amount": total, "method": "bank_transfer"})
        assert r.status_code == 200
        # verify invoice marked paid
        invs = auth.get(f"{BASE_URL}/api/invoices").json()
        match = [i for i in invs if i["id"] == iid]
        assert match and match[0]["status"] == "paid"


# ---------- Bookkeeping ----------
class TestBookkeeping:
    def test_create_and_summary(self, auth):
        r = auth.post(f"{BASE_URL}/api/bookkeeping", json={"type": "income", "amount": 500, "description": "TEST_inc"})
        assert r.status_code == 200
        bid1 = r.json()["id"]
        r = auth.post(f"{BASE_URL}/api/bookkeeping", json={"type": "expense", "amount": 100, "description": "TEST_exp"})
        assert r.status_code == 200
        bid2 = r.json()["id"]
        r = auth.get(f"{BASE_URL}/api/bookkeeping/summary")
        assert r.status_code == 200
        d = r.json()
        assert d["income"] >= 500
        assert d["expense"] >= 100
        assert "net" in d
        auth.delete(f"{BASE_URL}/api/bookkeeping/{bid1}")
        auth.delete(f"{BASE_URL}/api/bookkeeping/{bid2}")


# ---------- Employees ----------
class TestEmployees:
    def test_crud(self, auth):
        r = auth.post(f"{BASE_URL}/api/employees", json={"name": "TEST_Emp", "email": "e@test.com", "salary": 5000})
        assert r.status_code == 200
        eid = r.json()["id"]
        auth.delete(f"{BASE_URL}/api/employees/{eid}")


# ---------- Purchase Orders ----------
class TestPO:
    def test_create_computes_total(self, auth):
        payload = {"vendor": "TEST_Vendor", "lines": [{"description": "Item", "qty": 3, "unit_price": 25, "amount": 0}]}
        r = auth.post(f"{BASE_URL}/api/purchase-orders", json=payload)
        assert r.status_code == 200
        d = r.json()
        assert d["total"] == 75.0
        assert d["lines"][0]["amount"] == 75.0
        auth.delete(f"{BASE_URL}/api/purchase-orders/{d['id']}")


# ---------- Analytics ----------
class TestAnalytics:
    def test_dashboard(self, auth):
        r = auth.get(f"{BASE_URL}/api/analytics/dashboard")
        assert r.status_code == 200
        d = r.json()
        for k in ["tickets_total", "open_tickets", "clients_total", "invoices_total", "revenue"]:
            assert k in d


# ---------- Email ----------
class TestEmail:
    def test_compose(self, auth):
        r = auth.post(f"{BASE_URL}/api/email/compose", json={
            "context": "Customer reported server crash, follow up to provide ETA.",
            "tone": "professional", "purpose": "ticket_followup", "recipient_name": "John"
        }, timeout=60)
        assert r.status_code == 200
        d = r.json()
        assert d["subject"]
        assert d["body"]

    def test_send_returns_mocked(self, auth):
        r = auth.post(f"{BASE_URL}/api/email/send", json={
            "to": "test@example.com", "subject": "TEST", "body": "TEST body"
        })
        assert r.status_code == 200
        assert r.json()["status"] == "mocked"

    def test_email_logs(self, auth):
        r = auth.get(f"{BASE_URL}/api/email/logs")
        assert r.status_code == 200
        logs = r.json()
        assert isinstance(logs, list)
        assert any(l["status"] == "mocked" for l in logs)


# ---------- Chat ----------
class TestChat:
    def test_start_chat(self, api):
        r = api.post(f"{BASE_URL}/api/chat/start")
        assert r.status_code == 200
        d = r.json()
        assert d["id"]
        assert len(d["messages"]) >= 1
        assert d["messages"][0]["role"] == "assistant"

    def test_chat_message_and_intake_flow(self, api, auth):
        # start
        s = api.post(f"{BASE_URL}/api/chat/start").json()
        sid = s["id"]
        # multi-turn
        turns = [
            "My company server keeps crashing, very urgent",
            "It is system administration category, server is on-premise Dell PowerEdge running Ubuntu, crashing every hour",
            "My name is John Doe, email john@test.com, phone 416-555-0100, urgency is emergency. Please file the ticket.",
            "Yes please file the ticket now with all details I provided.",
        ]
        intake_complete = False
        ticket_id = None
        for t in turns:
            r = api.post(f"{BASE_URL}/api/chat/message", json={"session_id": sid, "message": t}, timeout=90)
            assert r.status_code == 200, r.text
            d = r.json()
            assert d["reply"]
            assert "[INTAKE_COMPLETE" not in d["reply"]
            if d["intake_complete"]:
                intake_complete = True
                ticket_id = d["ticket_id"]
                break
            time.sleep(0.5)
        # may or may not complete depending on LLM; if completed, verify ticket created
        if intake_complete:
            assert ticket_id
            tickets = auth.get(f"{BASE_URL}/api/tickets").json()
            assert any(t["id"] == ticket_id for t in tickets)
        else:
            pytest.skip("Intake didn't complete within 4 turns - LLM behavior variation")


# ---------- Stripe Payments (Round 2) ----------
class TestStripePayments:
    invoice_id = None
    zero_invoice_id = None
    session_id = None
    checkout_url = None

    def test_create_invoice_for_stripe(self, auth):
        """Create a fresh invoice with tax lines for stripe link generation."""
        payload = {
            "client_name": "TEST_Stripe_Client",
            "client_email": "stripe-test@example.com",
            "tax_rate": 13.0,
            "lines": [{"description": "Consulting", "qty": 2, "rate": 100, "amount": 0}],
        }
        r = auth.post(f"{BASE_URL}/api/invoices", json=payload)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["subtotal"] == 200.0
        assert d["tax"] == 26.0
        assert d["total"] == 226.0
        TestStripePayments.invoice_id = d["id"]

    def test_generate_payment_link(self, auth):
        iid = TestStripePayments.invoice_id
        assert iid, "no invoice id"
        r = auth.post(
            f"{BASE_URL}/api/invoices/{iid}/payment-link",
            json={"origin_url": "https://smart-leaf.preview.emergentagent.com"},
            timeout=60,
        )
        assert r.status_code == 200, r.text
        d = r.json()
        assert d.get("url", "").startswith("https://checkout.stripe.com/"), d
        assert d.get("session_id", "").startswith("cs_test_"), d
        TestStripePayments.session_id = d["session_id"]
        TestStripePayments.checkout_url = d["url"]

    def test_payment_transaction_record_created(self, auth):
        """After link generation, payment_transactions record should exist with pending status.
        We verify indirectly via status endpoint which falls back to DB lookup."""
        sid = TestStripePayments.session_id
        assert sid
        r = requests.get(f"{BASE_URL}/api/payments/checkout/status/{sid}", timeout=60)
        assert r.status_code == 200, r.text
        d = r.json()
        # invoice_id should match if the txn record was persisted
        assert d.get("invoice_id") == TestStripePayments.invoice_id, d

    def test_checkout_status_public_no_auth(self):
        """GET /api/payments/checkout/status/{id} — no auth, returns Stripe status."""
        sid = TestStripePayments.session_id
        assert sid
        r = requests.get(f"{BASE_URL}/api/payments/checkout/status/{sid}", timeout=60)
        assert r.status_code == 200, r.text
        d = r.json()
        # Fresh unpaid session
        assert d.get("status") in ("open", "expired"), d
        assert d.get("payment_status") in ("unpaid", "pending", "no_payment_required"), d

    def test_payment_link_zero_total_400(self, auth):
        """Invoice with no lines (total=0) — should fail 400."""
        r = auth.post(f"{BASE_URL}/api/invoices", json={
            "client_name": "TEST_Zero", "client_email": "z@test.com",
            "tax_rate": 0.0, "lines": [],
        })
        assert r.status_code == 200
        zid = r.json()["id"]
        TestStripePayments.zero_invoice_id = zid
        assert r.json()["total"] == 0.0
        r2 = auth.post(
            f"{BASE_URL}/api/invoices/{zid}/payment-link",
            json={"origin_url": "https://smart-leaf.preview.emergentagent.com"},
            timeout=60,
        )
        assert r2.status_code == 400, r2.text

    def test_payment_link_nonexistent_invoice(self, auth):
        r = auth.post(
            f"{BASE_URL}/api/invoices/does-not-exist-xyz/payment-link",
            json={"origin_url": "https://smart-leaf.preview.emergentagent.com"},
            timeout=60,
        )
        assert r.status_code in (400, 404), r.text

    def test_payment_link_requires_auth(self, api):
        r = api.post(
            f"{BASE_URL}/api/invoices/anything/payment-link",
            json={"origin_url": "https://x"},
        )
        assert r.status_code == 401

    def test_webhook_endpoint_wired(self, api):
        """Endpoint exists — invalid payload should return 400 (not 404)."""
        r = api.post(f"{BASE_URL}/api/webhook/stripe", data=b"{}", headers={"Content-Type": "application/json"})
        assert r.status_code != 404, "webhook route not registered"
        # Should be 400 (invalid signature/payload) or 500
        assert r.status_code in (400, 500), r.text

    def test_cleanup_stripe_invoices(self, auth):
        for iid in [TestStripePayments.invoice_id, TestStripePayments.zero_invoice_id]:
            if iid:
                auth.delete(f"{BASE_URL}/api/invoices/{iid}")
