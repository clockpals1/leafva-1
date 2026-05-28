import React, { useEffect, useState } from "react";
import { Leaf, Cpu, ShieldCheck, MapPin } from "lucide-react";
import Logo from "../components/Logo";
import api from "../lib/api";

export default function About() {
  const [biz, setBiz] = useState({});
  useEffect(() => { api.get("/settings/public").then(r => setBiz(r.data)).catch(() => {}); }, []);

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-24" data-testid="page-about">
      <div className="text-xs uppercase tracking-[0.25em] text-gold mb-4">/ about</div>
      <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-white max-w-3xl leading-tight">
        We built LEAFVA to feel <span className="text-gradient-gold">human</span> and operate like <span className="text-gradient-gold">a machine</span>.
      </h1>

      <div className="mt-16 grid md:grid-cols-12 gap-10">
        <div className="md:col-span-7 space-y-6 text-white/75 leading-relaxed">
          <p>
            LEAFVA is an Ontario-registered IT services company offering full-stack
            technology partnership for small businesses, agencies, and growing enterprises.
            From server rooms to AI agents, from cable runs to cloud architecture — we deliver
            the entire technology stack with a premium, calm, professional touch.
          </p>
          <p>
            We pair seasoned engineers with an AI intake layer that triages every request
            instantly. That means faster response, smarter routing, and less time spent
            re-explaining your problem.
          </p>
          <p>
            Our visual language — natural beams, deep forest greens, and gold — is intentional.
            It signals trust, craftsmanship, and the quiet excellence we bring to every engagement.
          </p>
        </div>
        <div className="md:col-span-5 space-y-4">
          <Card icon={<Logo size={22} />} label="Company">{biz.company_name || "LEAFVA"}</Card>
          <Card icon={<ShieldCheck size={20} className="text-gold" />} label="Registration">{biz.ontario_reg_number || "Ontario Reg. #XXXXXXXXX"}</Card>
          <Card icon={<MapPin size={20} className="text-gold" />} label="Address">{biz.address || "Ontario, Canada"}</Card>
          <Card icon={<Cpu size={20} className="text-gold" />} label="AI core">Claude Sonnet 4.5 · Always-on</Card>
        </div>
      </div>

      <div className="mt-24 grid md:grid-cols-3 gap-6">
        {[
          { icon: Leaf, t: "Natural", d: "We bring calm and clarity to a chaotic IT landscape. No hype, no jargon — just solid work." },
          { icon: Cpu, t: "Intelligent", d: "AI is woven into our intake, routing, and follow-up so nothing slips through the cracks." },
          { icon: ShieldCheck, t: "Compliant", d: "PIPEDA & GDPR-aligned data handling. Your information stays minimal, encrypted, and yours." },
        ].map((v) => (
          <div key={v.t} className="rounded-2xl border border-subtle bg-leafva-card p-8">
            <v.icon className="text-gold mb-4" size={26} strokeWidth={1.4} />
            <h3 className="font-display text-xl text-white mb-2">{v.t}</h3>
            <p className="text-sm text-white/60 leading-relaxed">{v.d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Card({ icon, label, children }) {
  return (
    <div className="rounded-xl border border-subtle bg-leafva-card p-5 flex items-start gap-4">
      <div className="mt-0.5">{icon}</div>
      <div>
        <div className="text-[10px] uppercase tracking-widest text-gold/80">{label}</div>
        <div className="text-white mt-1 font-mono-leaf text-sm">{children}</div>
      </div>
    </div>
  );
}
