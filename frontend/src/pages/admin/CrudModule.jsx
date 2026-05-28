/**
 * Reusable generic CRUD list+form module for simple admin tables.
 * Designed to keep code DRY across Clients / Projects / Bookkeeping / Payroll / POs / Payments.
 */
import React, { useEffect, useState } from "react";
import { Plus, X, Trash2 } from "lucide-react";
import { toast } from "sonner";
import api from "../../lib/api";

export default function CrudModule({
  testIdPrefix,
  title,
  endpoint,
  columns,         // [{ k, label, format? }]
  fields,          // [{ k, label, type, options?, default? }]
  emptyMsg = "No records yet. Create one to get started.",
}) {
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get(endpoint).then(r => setItems(r.data)).finally(() => setLoading(false));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [endpoint]);

  const openCreate = () => {
    const blank = {};
    fields.forEach(f => { blank[f.k] = f.default ?? (f.type === "number" ? 0 : ""); });
    setEditing(blank);
    setShowForm(true);
  };

  const save = async () => {
    try {
      if (editing.id) {
        await api.put(`${endpoint}/${editing.id}`, editing);
        toast.success("Updated");
      } else {
        await api.post(endpoint, editing);
        toast.success("Created");
      }
      setShowForm(false);
      load();
    } catch (e) { toast.error("Save failed"); }
  };

  const del = async (id) => {
    if (!window.confirm("Delete this record?")) return;
    try {
      await api.delete(`${endpoint}/${id}`);
      toast.success("Deleted");
      load();
    } catch (e) { toast.error("Delete failed"); }
  };

  return (
    <div data-testid={`admin-${testIdPrefix}`}>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest text-gold">/ {testIdPrefix}</div>
          <h1 className="font-display text-3xl text-white mt-2">{title}</h1>
        </div>
        <button onClick={openCreate} data-testid={`${testIdPrefix}-add-button`} className="btn-primary">
          <Plus size={16} /> Add new
        </button>
      </div>

      <div className="rounded-2xl border border-subtle bg-leafva-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-black/30 text-[10px] uppercase tracking-widest text-muted-leaf">
            <tr>
              {columns.map(c => <th key={c.k} className="text-left px-6 py-3">{c.label}</th>)}
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {items.map(it => (
              <tr key={it.id} className="hover:bg-white/[0.03]" data-testid={`${testIdPrefix}-row-${it.id}`}>
                {columns.map(c => (
                  <td key={c.k} className="px-6 py-4 text-white/85">
                    {c.format ? c.format(it[c.k], it) : (it[c.k] ?? "—")}
                  </td>
                ))}
                <td className="px-6 py-4 text-right">
                  <button onClick={() => { setEditing(it); setShowForm(true); }} className="text-xs text-gold hover:underline mr-3" data-testid={`${testIdPrefix}-edit-${it.id}`}>Edit</button>
                  <button onClick={() => del(it.id)} className="text-xs text-red-400 hover:underline" data-testid={`${testIdPrefix}-delete-${it.id}`}><Trash2 size={12} className="inline" /></button>
                </td>
              </tr>
            ))}
            {items.length === 0 && !loading && (
              <tr><td colSpan={columns.length + 1} className="text-center px-6 py-12 text-muted-leaf">{emptyMsg}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && editing && (
        <div className="fixed inset-0 z-40 flex" data-testid={`${testIdPrefix}-form-drawer`}>
          <div className="flex-1 bg-black/60" onClick={() => setShowForm(false)} />
          <div className="w-full max-w-xl bg-leafva-surface border-l border-subtle overflow-y-auto">
            <div className="sticky top-0 bg-leafva-surface border-b border-subtle px-6 py-4 flex items-center justify-between">
              <div className="text-white font-display">{editing.id ? "Edit" : "New"} {title.replace(/s$/, "")}</div>
              <button onClick={() => setShowForm(false)} className="text-muted-leaf hover:text-white"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              {fields.map(f => (
                <Field
                  key={f.k}
                  f={f}
                  value={editing[f.k]}
                  onChange={(v) => setEditing({ ...editing, [f.k]: v })}
                  testId={`${testIdPrefix}-field-${f.k}`}
                />
              ))}
              <button onClick={save} data-testid={`${testIdPrefix}-form-save`} className="btn-primary w-full justify-center mt-2">
                {editing.id ? "Save changes" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ f, value, onChange, testId }) {
  const common = "mt-2 w-full bg-black border border-subtle rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-gold";
  return (
    <div>
      <label className="text-xs uppercase tracking-widest text-muted-leaf">{f.label}</label>
      {f.type === "textarea" ? (
        <textarea
          data-testid={testId}
          rows={4}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={common}
        />
      ) : f.type === "select" ? (
        <select
          data-testid={testId}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={common}
        >
          {(f.options || []).map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : f.type === "number" ? (
        <input
          data-testid={testId}
          type="number"
          step="0.01"
          value={value ?? 0}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className={common}
        />
      ) : (
        <input
          data-testid={testId}
          type={f.type || "text"}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={common}
        />
      )}
    </div>
  );
}
