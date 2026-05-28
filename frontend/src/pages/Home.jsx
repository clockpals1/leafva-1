import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Cpu, Network, Wrench, Code2, ServerCog, Briefcase, Sparkles } from "lucide-react";
import Logo from "../components/Logo";

const HERO_BG = "https://static.prod-images.emergentagent.com/jobs/b689bacc-47ed-4197-a8c4-f1e8cd808e1c/images/7b787de3a733a4ee89ac0e1483f5e0124718ac9a867e901285d36eec123b8abc.png";
const NETWORK_BG = "https://static.prod-images.emergentagent.com/jobs/b689bacc-47ed-4197-a8c4-f1e8cd808e1c/images/92a209e7e3e071940e24b60440419363a41274996047335a0b049ae8e586404f.png";

const SERVICES = [
  { icon: Wrench, title: "IT Support", desc: "Round-the-clock support for the workstations and stack that keep your business breathing." },
  { icon: Cpu, title: "AI Services", desc: "Bespoke AI agents, automations, and intelligence layered into your existing operations." },
  { icon: Network, title: "Networking & Cable Run", desc: "Structured cabling, fibre, and enterprise networking engineered for resilience." },
  { icon: Code2, title: "Application Design", desc: "From idea to deployed product — modern, secure, and built to scale." },
  { icon: ServerCog, title: "System Administration", desc: "Servers, identities, backups, and infrastructure — quietly, perfectly maintained." },
  { icon: Briefcase, title: "Subcontracted Technical", desc: "Trusted overflow capacity for agencies and IT firms across Ontario and beyond." },
];

export default function Home() {
  return (
    <div className="bg-leafva-bg" data-testid="page-home">
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-subtle">
        <div className="absolute inset-0">
          <img src={HERO_BG} alt="" className="w-full h-full object-cover opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-black/30" />
          <div className="absolute inset-0 bg-grid-leaf opacity-40" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 pt-24 pb-32 lg:pt-32 lg:pb-44">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gold/40 bg-gold/5 text-gold text-xs uppercase tracking-widest mb-8 fade-up">
              <Logo size={14} animated={false} />
              Ontario Registered · IT × Nature
            </div>

            <h1 className="font-display font-light text-4xl sm:text-5xl lg:text-7xl text-white leading-[1.05] tracking-tight fade-up" style={{ animationDelay: "100ms" }}>
              IT Intelligence,<br />
              <span className="text-gradient-gold font-medium">Powered by Nature</span><br />
              <span className="text-white/90">and Technology.</span>
            </h1>

            <p className="mt-8 text-lg text-white/70 max-w-xl leading-relaxed fade-up" style={{ animationDelay: "200ms" }}>
              LEAFVA replaces the noise of traditional IT firms with a single intelligent
              interface. Talk to our AI — it understands your problem, builds the ticket,
              and dispatches the right specialist.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4 fade-up" style={{ animationDelay: "300ms" }}>
              <Link to="/assistant" data-testid="hero-cta-primary" className="btn-primary">
                <Sparkles size={16} /> Tell LEAFVA what you need
              </Link>
              <Link to="/services" data-testid="hero-cta-secondary" className="btn-gold">
                Explore Services <ArrowRight size={16} />
              </Link>
            </div>

            <div className="mt-16 grid grid-cols-3 max-w-md gap-6 fade-up" style={{ animationDelay: "400ms" }}>
              <Stat n="24/7" l="AI Triage" />
              <Stat n="<60s" l="Avg. Response" />
              <Stat n="100%" l="Ontario Local" />
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="relative max-w-7xl mx-auto px-6 lg:px-8 py-24 lg:py-32">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <div className="text-xs uppercase tracking-[0.25em] text-gold mb-4">/ what we do</div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-white max-w-2xl leading-tight">
              Six disciplines. One <span className="text-gradient-gold">intelligent</span> firm.
            </h2>
          </div>
          <Link to="/services" className="text-sm text-gold hover:underline flex items-center gap-1.5">
            See full breakdown <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SERVICES.map((s, i) => (
            <Link
              to="/services"
              key={s.title}
              data-testid={`service-card-${s.title.toLowerCase().replace(/\s+/g, "-")}`}
              className="group relative overflow-hidden rounded-2xl border border-subtle bg-leafva-card hover:border-gold/40 transition-colors p-8 fade-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="absolute -top-16 -right-16 h-32 w-32 rounded-full bg-leafva-primary/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <s.icon className="text-gold mb-6" size={28} strokeWidth={1.4} />
              <h3 className="font-display text-xl text-white mb-2">{s.title}</h3>
              <p className="text-sm text-white/60 leading-relaxed">{s.desc}</p>
              <div className="mt-6 flex items-center text-xs uppercase tracking-widest text-gold/70 group-hover:text-gold">
                Learn more <ArrowRight size={12} className="ml-1.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* AI INTRO BAND */}
      <section className="relative overflow-hidden border-y border-subtle">
        <div className="absolute inset-0">
          <img src={NETWORK_BG} alt="" className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-r from-leafva-bg via-leafva-bg/70 to-transparent" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-24 lg:py-32 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="text-xs uppercase tracking-[0.25em] text-gold mb-4">/ the leafva ai</div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-white leading-tight">
              No forms.<br /> Just <span className="text-gradient-gold">conversation</span>.
            </h2>
            <p className="mt-6 text-white/70 leading-relaxed max-w-md">
              Our intake assistant replaces the contact form entirely. Describe your situation
              naturally — it qualifies the urgency, captures technical context, opens a ticket,
              and emails confirmation to you and our team within seconds.
            </p>
            <Link to="/assistant" className="mt-8 inline-flex btn-primary" data-testid="ai-band-cta">
              <Sparkles size={16} /> Start a conversation
            </Link>
          </div>
          <div className="glass rounded-2xl p-6 fade-up">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-gold mb-4">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 pulse-green" /> Live demo
            </div>
            <div className="space-y-3 text-sm">
              <div className="bg-leafva-primary/15 border border-leafva-primary/30 rounded-2xl rounded-tl-sm px-4 py-3 text-leafva-beam">
                Welcome to LEAFVA. Tell me what you need.
              </div>
              <div className="bg-leafva-card border border-subtle rounded-2xl rounded-tr-sm px-4 py-3 text-white ml-auto max-w-[80%]">
                Office network keeps dropping. About 20 staff impacted.
              </div>
              <div className="bg-leafva-primary/15 border border-leafva-primary/30 rounded-2xl rounded-tl-sm px-4 py-3 text-leafva-beam">
                That sounds like a <strong className="text-gold">high-urgency Networking issue</strong>. Got it. Can you tell me whether it's wireless or wired, and what hardware you're running?
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA STRIP */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-24 text-center">
        <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-white">
          Ready when you are.
        </h2>
        <p className="mt-4 text-white/60 max-w-xl mx-auto">
          A 60-second conversation is enough to route the right expertise. We'll take it from there.
        </p>
        <Link to="/assistant" className="mt-8 inline-flex btn-gold" data-testid="footer-cta">
          Tell LEAFVA what you need <ArrowRight size={16} />
        </Link>
      </section>
    </div>
  );
}

function Stat({ n, l }) {
  return (
    <div>
      <div className="font-display text-3xl text-gold">{n}</div>
      <div className="text-[11px] uppercase tracking-widest text-white/50 mt-1">{l}</div>
    </div>
  );
}
