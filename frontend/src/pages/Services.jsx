import React from "react";
import { Link } from "react-router-dom";
import { Wrench, Cpu, Network, Code2, ServerCog, Briefcase, ArrowRight } from "lucide-react";

const SERVER_1 = "https://images.pexels.com/photos/5203849/pexels-photo-5203849.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";
const SERVER_2 = "https://images.pexels.com/photos/1181316/pexels-photo-1181316.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";

const SERVICES = [
  {
    icon: Wrench,
    title: "IT Support",
    tagline: "Always-on technical operations",
    points: ["Help-desk & ticketing", "Workstation & endpoint management", "Hardware procurement", "On-site & remote response"],
  },
  {
    icon: Cpu,
    title: "AI Services",
    tagline: "Intelligence inside your business",
    points: ["Custom AI agents", "Document & inbox automation", "Knowledge base RAG", "Voice + chat assistants"],
  },
  {
    icon: Network,
    title: "Networking & Cable Run",
    tagline: "Built for stability",
    image: SERVER_1,
    points: ["Structured cabling (Cat6/6A/fibre)", "Enterprise Wi-Fi design", "VLAN & switch deployment", "Site surveys & rack builds"],
  },
  {
    icon: Code2,
    title: "Application Design",
    tagline: "From idea to deployed product",
    points: ["Modern web & mobile apps", "Internal tools & dashboards", "API integration", "Secure cloud architecture"],
  },
  {
    icon: ServerCog,
    title: "System Administration",
    tagline: "Quiet, reliable infrastructure",
    image: SERVER_2,
    points: ["Server & cloud management", "Identity (Entra/AD/Google)", "Backup & DR", "Monitoring & patching"],
  },
  {
    icon: Briefcase,
    title: "Subcontracted Technical",
    tagline: "Trusted overflow capacity",
    points: ["White-label tech delivery", "Field-tech dispatch", "Project surge support", "MSP partnerships"],
  },
];

export default function Services() {
  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-24" data-testid="page-services">
      <div className="text-xs uppercase tracking-[0.25em] text-gold mb-4">/ services</div>
      <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-white max-w-3xl leading-tight">
        Every layer of your tech, <span className="text-gradient-gold">under one roof</span>.
      </h1>
      <p className="mt-6 text-white/60 max-w-2xl leading-relaxed">
        We provide end-to-end IT services for Ontario businesses. Talk to our AI assistant to scope your project and we'll route the right expert within minutes.
      </p>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-6">
        {SERVICES.map((s, i) => (
          <div
            key={s.title}
            data-testid={`services-list-${s.title.toLowerCase().replace(/\s+/g, "-")}`}
            className="group relative overflow-hidden rounded-2xl border border-subtle bg-leafva-card hover:border-gold/40 transition-colors p-8 fade-up"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            {s.image && (
              <div className="absolute inset-0 opacity-15 group-hover:opacity-30 transition-opacity duration-700">
                <img src={s.image} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-leafva-card via-leafva-card/80 to-transparent" />
              </div>
            )}
            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <s.icon className="text-gold" size={32} strokeWidth={1.4} />
                <span className="text-[10px] uppercase tracking-widest text-white/40">{String(i + 1).padStart(2, "0")}</span>
              </div>
              <h3 className="font-display text-2xl text-white">{s.title}</h3>
              <div className="text-xs uppercase tracking-widest text-gold mt-1">{s.tagline}</div>
              <ul className="mt-6 space-y-2 text-sm text-white/70">
                {s.points.map((p) => (
                  <li key={p} className="flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-gold mt-1.5 flex-shrink-0" /> {p}
                  </li>
                ))}
              </ul>
              <Link to="/assistant" className="mt-8 inline-flex items-center text-sm text-gold hover:underline">
                Discuss with AI <ArrowRight size={14} className="ml-1.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
