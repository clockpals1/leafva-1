import React, { useEffect, useState } from "react";
import { Plus, X, Trash2, Send } from "lucide-react";
import { toast } from "sonner";
import api from "../../lib/api";

const STATUS_COLORS = {
  draft: "bg-zinc-900 text-zinc-300 border-zinc-800",
  sent: "bg-blue-950 text-blue-300 border-blue-900",
  paid: "bg-emerald-950 text-emerald-300 border-emerald-900",
  overdue: "bg-red-950 text-red-300 border-red-900",
  void: "bg-zinc-900 text-zinc-500 border-zinc-800",
};

export default function Invoices() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);

  const load = () => api.get("/invoices").then(r => setItems(r.data));
  useEffect(() => { load(); }, []);

  const openCreate = () => setEditing({
    client_name: "", client_email: "", due_date: "", tax_rate: 13, notes: "", status: "draft",
    lines: [{ description: "", qty: 1, rate: 0, amount: 0 }],
  });

  const save = async () => {
    try {
      if (editing.id) await api.put(`/invoices/${editing.id}`, editing);
      else await api.post("/invoices", editing);
      toast.success("Invoice saved");
      setEditing(null);
      load();
    } catch (e) { toast.error("Save failed"); }
  };

  const del = async (id) => {
    if (!window.confirm("Delete this invoice?")) return;
    await api.delete(`/invoices/${id}`);
    toast.success("Deleted");
    load();
  };

  const subtotal = (editing?.lines || []).reduce((s, l) => s + (Number(l.qty) || 0) * (Number(l.rate) || 0), 0);
  const tax = subtotal * (Number(editing?.tax_rate) || 0) / 100;
  const total = subtotal + tax;

  return (
    <div data-testid="admin-invoices">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest text-gold">/ invoices</div>
          <h1 className="font-display text-3xl text-white mt-2">Invoices</h1>
        </div>
        <button onClick={openCreate} data-testid="invoices-add-button" className="btn-primary"><Plus size={16} /> New invoice</button>
      </div>

      <div className="rounded-2xl border border-subtle bg-leafva-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-black/30 text-[10px] uppercase tracking-widest text-muted-leaf">
            <tr>
              <th className="text-left px-6 py-3">Number</th>
              <th className="text-left px-6 py-3">Client</th>
              <th className="text-left px-6 py-3">Total</th>
              <th className="text-left px-6 py-3">Status</th>
              <th className="text-left px-6 py-3">Issued</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {items.map(inv => (
              <tr key={inv.id} className="hover:bg-white/[0.03] cursor-pointer" onClick={() => setEditing(inv)} data-testid={`invoices-row-${inv.id}`}>
                <td className="px-6 py-4 font-mono-leaf text-gold text-xs">{inv.number}</td>
                <td className="px-6 py-4 text-white">{inv.client_name}<div className="text-xs text-muted-leaf">{inv.client_email}</div></td>
                <td className="px-6 py-4 text-white font-medium">${Number(inv.total).toFixed(2)}</td>
                <td className="px-6 py-4"><span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded border ${STATUS_COLORS[inv.status]}`}>{inv.status}</span></td>
                <td className="px-6 py-4 text-xs text-muted-leaf">{new Date(inv.issue_date).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={(e) => { e.stopPropagation(); del(inv.id); }} className="text-red-400 hover:underline text-xs" data-testid={`invoices-delete-${inv.id}`}><Trash2 size={12} /></button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={6} className="text-center px-6 py-12 text-muted-leaf">No invoices yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 z-40 flex" data-testid="invoice-drawer">
          <div className="flex-1 bg-black/60" onClick={() => setEditing(null)} />
          <div className="w-full max-w-2xl bg-leafva-surface border-l border-subtle overflow-y-auto">
            <div className="sticky top-0 bg-leafva-surface border-b border-subtle px-6 py-4 flex items-center justify-between">
              <div className="text-white font-display">{editing.id ? `Edit ${editing.number}` : "New Invoice"}</div>
              <button onClick={() => setEditing(null)}><X size={18} className="text-muted-leaf" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Inp label="Client name" v={editing.client_name} on={(v) => setEditing({ ...editing, client_name: v })} testId="invoice-client-name" />
                <Inp label="Client email" v={editing.client_email} on={(v) => setEditing({ ...editing, client_email: v })} type="email" testId="invoice-client-email" />
                <Inp label="Due date" v={editing.due_date} on={(v) => setEditing({ ...editing, due_date: v })} type="date" testId="invoice-due-date" />
                <div>
                  <label className="text-xs uppercase tracking-widest text-muted-leaf">Status</label>
                  <select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })} data-testid="invoice-status" className="mt-2 w-full bg-black border border-subtle rounded-lg px-4 py-2.5 text-sm text-white">
                    {["draft", "sent", "paid", "overdue", "void"].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <div className="text-xs uppercase tracking-widest text-gold mb-2">Line items</div>
                <div className="space-y-2">
                  {editing.lines.map((l, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center" data-testid={`invoice-line-${idx}`}>
                      <input value={l.description} onChange={(e) => updateLine(editing, setEditing, idx, "description", e.target.value)} placeholder="Description" className="col-span-6 bg-black border border-subtle rounded px-3 py-2 text-sm text-white" />
                      <input type="number" step="0.01" value={l.qty} onChange={(e) => updateLine(editing, setEditing, idx, "qty", parseFloat(e.target.value) || 0)} placeholder="Qty" className="col-span-2 bg-black border border-subtle rounded px-2 py-2 text-sm text-white" />
                      <input type="number" step="0.01" value={l.rate} onChange={(e) => updateLine(editing, setEditing, idx, "rate", parseFloat(e.target.value) || 0)} placeholder="Rate" className="col-span-3 bg-black border border-subtle rounded px-2 py-2 text-sm text-white" />
                      <button onClick={() => setEditing({ ...editing, lines: editing.lines.filter((_, i) => i !== idx) })} className="col-span-1 text-red-400"><X size={16} /></button>
                    </div>
                  ))}
                </div>
                <button onClick={() => setEditing({ ...editing, lines: [...editing.lines, { description: "", qty: 1, rate: 0 }] })} className="mt-2 text-xs text-gold hover:underline" data-testid="invoice-add-line">+ Add line</button>
              </div>

              <Inp label="Tax rate %" v={editing.tax_rate} on={(v) => setEditing({ ...editing, tax_rate: parseFloat(v) || 0 })} type="number" testId="invoice-tax-rate" />

              <div className="rounded-lg bg-black/40 border border-subtle p-4 text-sm space-y-1">
                <div className="flex justify-between text-white/70"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-white/70"><span>Tax ({editing.tax_rate}%)</span><span>${tax.toFixed(2)}</span></div>
                <div className="flex justify-between text-gold font-medium pt-2 border-t border-subtle"><span>Total</span><span>${total.toFixed(2)}</span></div>
              </div>

              <Inp label="Notes" v={editing.notes} on={(v) => setEditing({ ...editing, notes: v })} textarea testId="invoice-notes" />

              <button onClick={save} className="btn-primary w-full justify-center" data-testid="invoice-save"><Send size={14} /> Save invoice</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function updateLine(editing, setEditing, idx, k, v) {
  const lines = [...editing.lines];
  lines[idx] = { ...lines[idx], [k]: v };
  setEditing({ ...editing, lines });
}

function Inp({ label, v, on, type = "text", textarea, testId }) {
  const cls = "mt-2 w-full bg-black border border-subtle rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-gold";
  return (
    <div>
      <label className="text-xs uppercase tracking-widest text-muted-leaf">{label}</label>
      {textarea
        ? <textarea data-testid={testId} rows={3} value={v ?? ""} onChange={(e) => on(e.target.value)} className={cls} />
        : <input data-testid={testId} type={type} value={v ?? ""} onChange={(e) => on(e.target.value)} className={cls} />}
    </div>
  );
}
