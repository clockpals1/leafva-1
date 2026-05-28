import React, { useEffect, useState } from "react";
import { Plus, X, Trash2 } from "lucide-react";
import { toast } from "sonner";
import api from "../../lib/api";

export default function PurchaseOrders() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);

  const load = () => api.get("/purchase-orders").then(r => setItems(r.data));
  useEffect(() => { load(); }, []);

  const openCreate = () => setEditing({ vendor: "", vendor_email: "", status: "draft", notes: "", lines: [{ description: "", qty: 1, unit_price: 0 }] });

  const save = async () => {
    try {
      if (editing.id) await api.put(`/purchase-orders/${editing.id}`, editing);
      else await api.post("/purchase-orders", editing);
      toast.success("Purchase order saved");
      setEditing(null);
      load();
    } catch (e) { toast.error("Save failed"); }
  };

  const del = async (id) => {
    if (!window.confirm("Delete this PO?")) return;
    await api.delete(`/purchase-orders/${id}`);
    toast.success("Deleted");
    load();
  };

  const total = (editing?.lines || []).reduce((s, l) => s + (Number(l.qty) || 0) * (Number(l.unit_price) || 0), 0);

  return (
    <div data-testid="admin-purchase-orders">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest text-gold">/ purchase orders</div>
          <h1 className="font-display text-3xl text-white mt-2">Purchase Orders</h1>
        </div>
        <button onClick={openCreate} data-testid="po-add-button" className="btn-primary"><Plus size={16} /> New PO</button>
      </div>

      <div className="rounded-2xl border border-subtle bg-leafva-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-black/30 text-[10px] uppercase tracking-widest text-muted-leaf">
            <tr>
              <th className="text-left px-6 py-3">Number</th>
              <th className="text-left px-6 py-3">Vendor</th>
              <th className="text-left px-6 py-3">Total</th>
              <th className="text-left px-6 py-3">Status</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {items.map(po => (
              <tr key={po.id} onClick={() => setEditing(po)} className="hover:bg-white/[0.03] cursor-pointer" data-testid={`po-row-${po.id}`}>
                <td className="px-6 py-4 font-mono-leaf text-gold text-xs">{po.number}</td>
                <td className="px-6 py-4 text-white">{po.vendor}</td>
                <td className="px-6 py-4 text-white">${Number(po.total).toFixed(2)}</td>
                <td className="px-6 py-4 text-xs uppercase text-white/70">{po.status}</td>
                <td className="px-6 py-4 text-right"><button onClick={(e) => { e.stopPropagation(); del(po.id); }} className="text-red-400"><Trash2 size={12} /></button></td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={5} className="text-center px-6 py-12 text-muted-leaf">No purchase orders yet.</td></tr>}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 z-40 flex">
          <div className="flex-1 bg-black/60" onClick={() => setEditing(null)} />
          <div className="w-full max-w-2xl bg-leafva-surface border-l border-subtle overflow-y-auto">
            <div className="sticky top-0 bg-leafva-surface border-b border-subtle px-6 py-4 flex items-center justify-between">
              <div className="text-white font-display">{editing.id ? `Edit ${editing.number}` : "New PO"}</div>
              <button onClick={() => setEditing(null)}><X size={18} className="text-muted-leaf" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Inp label="Vendor" v={editing.vendor} on={(v) => setEditing({ ...editing, vendor: v })} testId="po-vendor" />
                <Inp label="Vendor email" v={editing.vendor_email} on={(v) => setEditing({ ...editing, vendor_email: v })} testId="po-vendor-email" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest text-muted-leaf">Status</label>
                <select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })} data-testid="po-status" className="mt-2 w-full bg-black border border-subtle rounded-lg px-3 py-2 text-sm text-white">
                  {["draft", "issued", "received", "cancelled"].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest text-gold mb-2">Line items</div>
                {editing.lines.map((l, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 mb-2">
                    <input value={l.description} onChange={(e) => upd(editing, setEditing, idx, "description", e.target.value)} placeholder="Description" className="col-span-6 bg-black border border-subtle rounded px-3 py-2 text-sm text-white" />
                    <input type="number" value={l.qty} onChange={(e) => upd(editing, setEditing, idx, "qty", parseFloat(e.target.value) || 0)} placeholder="Qty" className="col-span-2 bg-black border border-subtle rounded px-2 py-2 text-sm text-white" />
                    <input type="number" step="0.01" value={l.unit_price} onChange={(e) => upd(editing, setEditing, idx, "unit_price", parseFloat(e.target.value) || 0)} placeholder="Price" className="col-span-3 bg-black border border-subtle rounded px-2 py-2 text-sm text-white" />
                    <button onClick={() => setEditing({ ...editing, lines: editing.lines.filter((_, i) => i !== idx) })} className="col-span-1 text-red-400"><X size={16} /></button>
                  </div>
                ))}
                <button onClick={() => setEditing({ ...editing, lines: [...editing.lines, { description: "", qty: 1, unit_price: 0 }] })} className="text-xs text-gold hover:underline">+ Add line</button>
              </div>
              <div className="rounded-lg bg-black/40 border border-subtle p-4 text-sm flex justify-between"><span className="text-white/70">Total</span><span className="text-gold font-medium">${total.toFixed(2)}</span></div>
              <Inp label="Notes" v={editing.notes} on={(v) => setEditing({ ...editing, notes: v })} textarea testId="po-notes" />
              <button onClick={save} data-testid="po-save" className="btn-primary w-full justify-center">Save PO</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function upd(editing, setEditing, idx, k, v) {
  const lines = [...editing.lines];
  lines[idx] = { ...lines[idx], [k]: v };
  setEditing({ ...editing, lines });
}

function Inp({ label, v, on, textarea, testId }) {
  const cls = "mt-2 w-full bg-black border border-subtle rounded-lg px-4 py-2.5 text-sm text-white";
  return (
    <div>
      <label className="text-xs uppercase tracking-widest text-muted-leaf">{label}</label>
      {textarea
        ? <textarea data-testid={testId} rows={3} value={v ?? ""} onChange={(e) => on(e.target.value)} className={cls} />
        : <input data-testid={testId} type="text" value={v ?? ""} onChange={(e) => on(e.target.value)} className={cls} />}
    </div>
  );
}
