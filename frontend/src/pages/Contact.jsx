import React, { useEffect, useState } from "react";
import { Mail, Phone, MapPin } from "lucide-react";
import ChatPanel from "../components/ChatPanel";
import api from "../lib/api";

export default function Contact() {
  const [biz, setBiz] = useState({});
  useEffect(() => { api.get("/settings/public").then(r => setBiz(r.data)).catch(() => {}); }, []);

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16" data-testid="page-contact">
      <div className="text-xs uppercase tracking-[0.25em] text-gold mb-4">/ contact</div>
      <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl text-white max-w-2xl leading-tight mb-3">
        No forms. <span className="text-gradient-gold">Just chat.</span>
      </h1>
      <p className="text-white/60 max-w-xl mb-10">
        Start a conversation with LEAFVA AI below — it will gather everything we need and open a ticket on your behalf.
      </p>

      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 h-[640px]">
          <ChatPanel fullHeight />
        </div>
        <aside className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-subtle bg-leafva-card p-6">
            <div className="text-xs uppercase tracking-widest text-gold mb-4">Direct contact</div>
            <div className="space-y-3 text-sm text-white/80">
              <div className="flex items-center gap-3"><Mail size={16} className="text-gold" /> {biz.contact_email || "hello@leafva.com"}</div>
              <div className="flex items-center gap-3"><Phone size={16} className="text-gold" /> {biz.phone || "+1 (000) 000-0000"}</div>
              <div className="flex items-center gap-3"><MapPin size={16} className="text-gold" /> {biz.address || "Ontario, Canada"}</div>
            </div>
          </div>
          <div className="rounded-2xl border border-gold/30 bg-gold/5 p-6">
            <div className="text-xs uppercase tracking-widest text-gold mb-3">Compliance note</div>
            <p className="text-sm text-white/70 leading-relaxed">
              LEAFVA's AI may collect your name, email, phone, and a short description of your issue. We don't ask for sensitive data (passwords, payment info) — please don't share them.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
