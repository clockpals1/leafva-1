import React, { useEffect, useState } from "react";
import { Mail, Send, X } from "lucide-react";
import { toast } from "sonner";
import api from "../../lib/api";
import { UrgencyBadge, StatusBadge } from "./Dashboard";

const STATUSES = ["new", "in_progress", "waiting", "resolved", "closed"];

export default function Tickets() {
  const [tickets, setTickets] = useState([]);
  const [filter, setFilter] = useState("all");
  const [active, setActive] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get("/tickets").then(r => setTickets(r.data)).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const filtered = tickets.filter(t => filter === "all" || t.status === filter);

  return (
    <div data-testid="admin-tickets">
      <div className="mb-8">
        <div className="text-xs uppercase tracking-widest text-gold">/ tickets</div>
        <h1 className="font-display text-3xl text-white mt-2">Service Tickets</h1>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {["all", ...STATUSES].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            data-testid={`tickets-filter-${s}`}
            className={`text-xs uppercase tracking-widest px-3 py-1.5 rounded border ${
              filter === s ? "bg-gold text-black border-gold" : "border-subtle text-white/70 hover:text-white"
            }`}
          >
            {s.replace("_", " ")} ({s === "all" ? tickets.length : tickets.filter(t => t.status === s).length})
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-subtle bg-leafva-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-black/30 text-[10px] uppercase tracking-widest text-muted-leaf">
            <tr>
              <th className="text-left px-6 py-3">Code</th>
              <th className="text-left px-6 py-3">Customer</th>
              <th className="text-left px-6 py-3">Category</th>
              <th className="text-left px-6 py-3">Urgency</th>
              <th className="text-left px-6 py-3">Status</th>
              <th className="text-left px-6 py-3">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map(t => (
              <tr
                key={t.id}
                onClick={() => setActive(t)}
                className="hover:bg-white/[0.03] cursor-pointer"
                data-testid={`tickets-row-${t.id}`}
              >
                <td className="px-6 py-4 font-mono-leaf text-xs text-gold">{t.code}</td>
                <td className="px-6 py-4 text-white">{t.name}<div className="text-xs text-muted-leaf">{t.email}</div></td>
                <td className="px-6 py-4 text-white/80">{t.category}</td>
                <td className="px-6 py-4"><UrgencyBadge u={t.urgency} /></td>
                <td className="px-6 py-4"><StatusBadge s={t.status} /></td>
                <td className="px-6 py-4 text-muted-leaf text-xs">{new Date(t.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {filtered.length === 0 && !loading && (
              <tr><td colSpan={6} className="text-center px-6 py-12 text-muted-leaf">No tickets matching this filter.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {active && <TicketDrawer ticket={active} onClose={() => setActive(null)} onUpdated={load} />}
    </div>
  );
}

function TicketDrawer({ ticket, onClose, onUpdated }) {
  const [t, setT] = useState(ticket);
  const [composing, setComposing] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const update = async (field, value) => {
    const nt = { ...t, [field]: value };
    setT(nt);
    try {
      await api.put(`/tickets/${t.id}`, { [field]: value });
      toast.success(`${field.replace("_", " ")} updated`);
      onUpdated();
    } catch (e) { toast.error("Update failed"); }
  };

  const aiCompose = async () => {
    setComposing(true);
    try {
      const r = await api.post("/email/compose", {
        context: `Ticket ${t.code}: customer ${t.name} reported "${t.details}" in category ${t.category} with urgency ${t.urgency}. Current status: ${t.status}.`,
        tone: "professional",
        purpose: "ticket_followup",
        recipient_name: t.name,
      });
      setSubject(r.data.subject);
      setBody(r.data.body);
      toast.success("Email drafted by AI");
    } catch (e) { toast.error("AI compose failed"); }
    finally { setComposing(false); }
  };

  const send = async () => {
    setSending(true);
    try {
      const r = await api.post("/email/send", {
        to: t.email,
        subject,
        body,
        related_ticket_id: t.id,
      });
      if (r.data.status === "sent") toast.success("Email sent");
      else if (r.data.status === "mocked") toast.info("Logged (set Resend key in Settings to send)");
      else toast.error(`Failed: ${r.data.error || "unknown"}`);
      setSubject(""); setBody("");
    } catch (e) { toast.error("Send failed"); }
    finally { setSending(false); }
  };

  return (
    <div className="fixed inset-0 z-40 flex" data-testid="ticket-drawer">
      <div className="flex-1 bg-black/60" onClick={onClose} />
      <div className="w-full max-w-2xl bg-leafva-surface border-l border-subtle overflow-y-auto">
        <div className="sticky top-0 bg-leafva-surface border-b border-subtle px-6 py-4 flex items-center justify-between">
          <div>
            <div className="font-mono-leaf text-xs text-gold">{t.code}</div>
            <div className="text-white">{t.name}</div>
          </div>
          <button onClick={onClose} data-testid="ticket-drawer-close" className="text-muted-leaf hover:text-white"><X size={18} /></button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email">{t.email}</Field>
            <Field label="Phone">{t.phone || "—"}</Field>
            <Field label="Category">{t.category}</Field>
            <Field label="Created">{new Date(t.created_at).toLocaleString()}</Field>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-widest text-gold mb-2">Details</div>
            <div className="bg-black/40 border border-subtle rounded-lg p-4 text-sm text-white/80 whitespace-pre-wrap">{t.details || "—"}</div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-leaf mb-2">Status</div>
              <select
                value={t.status}
                onChange={(e) => update("status", e.target.value)}
                data-testid="ticket-status-select"
                className="w-full bg-black border border-subtle rounded-lg px-3 py-2 text-sm text-white"
              >
                {STATUSES.map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
              </select>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-leaf mb-2">Urgency</div>
              <select
                value={t.urgency}
                onChange={(e) => update("urgency", e.target.value)}
                data-testid="ticket-urgency-select"
                className="w-full bg-black border border-subtle rounded-lg px-3 py-2 text-sm text-white"
              >
                {["low", "medium", "high", "emergency"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="border-t border-subtle pt-6">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs uppercase tracking-widest text-gold flex items-center gap-2"><Mail size={14} /> Reply via AI Email</div>
              <button onClick={aiCompose} disabled={composing} data-testid="ticket-ai-compose" className="btn-gold text-xs py-1.5 px-3">
                {composing ? "Drafting…" : "AI Draft"}
              </button>
            </div>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
              data-testid="ticket-email-subject"
              className="w-full bg-black border border-subtle rounded-lg px-3 py-2 text-sm text-white mb-2"
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Email body…"
              data-testid="ticket-email-body"
              rows={8}
              className="w-full bg-black border border-subtle rounded-lg px-3 py-2 text-sm text-white"
            />
            <button onClick={send} disabled={!subject || !body || sending} data-testid="ticket-email-send" className="mt-3 btn-primary text-sm disabled:opacity-50">
              <Send size={14} /> {sending ? "Sending…" : "Send email"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-muted-leaf">{label}</div>
      <div className="text-sm text-white mt-1">{children}</div>
    </div>
  );
}
