import React, { useEffect, useState } from "react";
import { Ticket, Users, FileText, DollarSign, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../../lib/api";

export default function Dashboard() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get("/analytics/dashboard").then(r => setData(r.data)); }, []);

  return (
    <div data-testid="admin-dashboard">
      <div className="mb-8">
        <div className="text-xs uppercase tracking-widest text-gold">/ overview</div>
        <h1 className="font-display text-3xl text-white mt-2">Dashboard</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Stat icon={Ticket} label="Total Tickets" value={data?.tickets_total ?? "—"} accent />
        <Stat icon={AlertTriangle} label="Open" value={data?.open_tickets ?? "—"} warn={data?.open_tickets > 0} />
        <Stat icon={AlertTriangle} label="Emergency" value={data?.emergency_tickets ?? "—"} danger={data?.emergency_tickets > 0} />
        <Stat icon={Users} label="Clients" value={data?.clients_total ?? "—"} />
        <Stat icon={FileText} label="Invoices" value={data?.invoices_total ?? "—"} />
        <Stat icon={FileText} label="Paid Invoices" value={data?.paid_invoices ?? "—"} />
        <Stat icon={DollarSign} label="Revenue (CAD)" value={`$${(data?.revenue ?? 0).toLocaleString()}`} accent />
      </div>

      <div className="rounded-2xl border border-subtle bg-leafva-card overflow-hidden">
        <div className="px-6 py-4 border-b border-subtle flex items-center justify-between">
          <div className="font-display text-lg text-white">Recent Tickets</div>
          <Link to="/admin/tickets" className="text-xs text-gold hover:underline">View all →</Link>
        </div>
        <div className="divide-y divide-white/5">
          {(data?.recent_tickets || []).map((t) => (
            <Link to="/admin/tickets" key={t.id} className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02]" data-testid={`dashboard-recent-${t.id}`}>
              <div className="font-mono-leaf text-xs text-muted-leaf w-28 truncate">{t.code}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white truncate">{t.name} · {t.category}</div>
                <div className="text-xs text-muted-leaf truncate">{t.details}</div>
              </div>
              <UrgencyBadge u={t.urgency} />
              <StatusBadge s={t.status} />
            </Link>
          ))}
          {(!data?.recent_tickets || data.recent_tickets.length === 0) && (
            <div className="px-6 py-12 text-center text-muted-leaf text-sm">No tickets yet. Start a chat from the public site to test the AI intake flow.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, accent, warn, danger }) {
  const color = danger ? "text-red-400" : warn ? "text-orange-400" : accent ? "text-gold" : "text-white";
  return (
    <div className="rounded-xl border border-subtle bg-leafva-card p-4">
      <div className="flex items-center justify-between mb-3">
        <Icon size={16} className={`${accent ? "text-gold" : "text-muted-leaf"}`} strokeWidth={1.5} />
        <div className="text-[10px] uppercase tracking-widest text-muted-leaf">{label}</div>
      </div>
      <div className={`font-display text-2xl ${color}`}>{value}</div>
    </div>
  );
}

export function UrgencyBadge({ u }) {
  const map = {
    low: "bg-blue-950 text-blue-300 border-blue-900",
    medium: "bg-yellow-950 text-yellow-300 border-yellow-900",
    high: "bg-orange-950 text-orange-300 border-orange-900",
    emergency: "bg-red-950 text-red-300 border-red-900",
  };
  return <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded border ${map[u] || ""}`}>{u}</span>;
}

export function StatusBadge({ s }) {
  const map = {
    new: "bg-gold/10 text-gold border-gold/30",
    in_progress: "bg-blue-950 text-blue-300 border-blue-900",
    waiting: "bg-purple-950 text-purple-300 border-purple-900",
    resolved: "bg-emerald-950 text-emerald-300 border-emerald-900",
    closed: "bg-zinc-900 text-zinc-400 border-zinc-800",
  };
  return <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded border ${map[s] || ""}`}>{(s || "").replace("_", " ")}</span>;
}
