import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Save, Eye, EyeOff } from "lucide-react";
import api from "../../lib/api";

const FIELDS = [
  { group: "Business", items: [
    { k: "company_name", label: "Company name" },
    { k: "tagline", label: "Tagline" },
    { k: "ontario_reg_number", label: "Ontario registration #" },
    { k: "business_number", label: "Business number (BN)" },
    { k: "address", label: "Address" },
    { k: "phone", label: "Phone" },
    { k: "contact_email", label: "Public contact email" },
  ]},
  { group: "Resend (email)", items: [
    { k: "resend_api_key", label: "Resend API key", secret: true, placeholder: "re_xxxxxxxxxxxxxxxx" },
    { k: "resend_sender_email", label: "Sender email (verified in Resend)" },
    { k: "resend_notify_email", label: "Internal notification inbox" },
  ]},
  { group: "AI", items: [
    { k: "ai_provider", label: "AI provider", options: ["anthropic", "openai", "gemini"] },
    { k: "ai_model", label: "AI model" },
    { k: "ai_system_prompt", label: "AI system prompt (intake)", textarea: true },
  ]},
];

export default function Settings() {
  const [data, setData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showSecret, setShowSecret] = useState({});

  useEffect(() => { api.get("/settings").then(r => setData(r.data)); }, []);

  if (!data) return <div className="text-muted-leaf">Loading…</div>;

  const set = (k, v) => setData({ ...data, [k]: v });

  const save = async () => {
    setSaving(true);
    try {
      const r = await api.put("/settings", data);
      setData(r.data);
      toast.success("Settings saved");
    } catch (e) { toast.error("Save failed"); }
    finally { setSaving(false); }
  };

  return (
    <div data-testid="admin-settings">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest text-gold">/ settings</div>
          <h1 className="font-display text-3xl text-white mt-2">Business & Integrations</h1>
        </div>
        <button onClick={save} disabled={saving} data-testid="settings-save" className="btn-primary disabled:opacity-50">
          <Save size={16} /> {saving ? "Saving…" : "Save changes"}
        </button>
      </div>

      <div className="space-y-8">
        {FIELDS.map((g) => (
          <section key={g.group} className="rounded-2xl border border-subtle bg-leafva-card overflow-hidden">
            <div className="px-6 py-4 border-b border-subtle text-xs uppercase tracking-widest text-gold">{g.group}</div>
            <div className="p-6 space-y-5">
              {g.items.map((f) => {
                const id = `setting-${f.k}`;
                if (f.textarea) {
                  return (
                    <div key={f.k}>
                      <label className="text-xs uppercase tracking-widest text-muted-leaf">{f.label}</label>
                      <textarea
                        data-testid={id}
                        rows={8}
                        value={data[f.k] || ""}
                        onChange={(e) => set(f.k, e.target.value)}
                        className="mt-2 w-full bg-black border border-subtle rounded-lg px-4 py-3 text-sm text-white font-mono-leaf outline-none focus:border-gold transition-colors"
                      />
                    </div>
                  );
                }
                if (f.options) {
                  return (
                    <div key={f.k}>
                      <label className="text-xs uppercase tracking-widest text-muted-leaf">{f.label}</label>
                      <select
                        data-testid={id}
                        value={data[f.k] || ""}
                        onChange={(e) => set(f.k, e.target.value)}
                        className="mt-2 w-full bg-black border border-subtle rounded-lg px-4 py-3 text-sm text-white outline-none focus:border-gold"
                      >
                        {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  );
                }
                const isSecret = f.secret && !showSecret[f.k];
                return (
                  <div key={f.k}>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs uppercase tracking-widest text-muted-leaf">{f.label}</label>
                      {f.secret && (
                        <button
                          onClick={() => setShowSecret(s => ({ ...s, [f.k]: !s[f.k] }))}
                          className="text-muted-leaf hover:text-gold text-xs flex items-center gap-1"
                          type="button"
                          data-testid={`${id}-toggle-secret`}
                        >
                          {showSecret[f.k] ? <><EyeOff size={12} /> Hide</> : <><Eye size={12} /> Show</>}
                        </button>
                      )}
                    </div>
                    <input
                      data-testid={id}
                      type={isSecret ? "password" : "text"}
                      placeholder={f.placeholder || ""}
                      value={data[f.k] || ""}
                      onChange={(e) => set(f.k, e.target.value)}
                      className="w-full bg-black border border-subtle rounded-lg px-4 py-3 text-sm text-white outline-none focus:border-gold transition-colors"
                    />
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
