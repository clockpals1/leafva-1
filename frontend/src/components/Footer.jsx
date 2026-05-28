import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Phone, MapPin } from "lucide-react";
import Logo from "./Logo";
import api from "../lib/api";

export default function Footer() {
  const [biz, setBiz] = useState({
    company_name: "LEAFVA",
    ontario_reg_number: "Ontario Reg. #XXXXXXXXX",
    address: "Ontario, Canada",
    phone: "+1 (000) 000-0000",
    contact_email: "hello@leafva.com",
  });

  useEffect(() => {
    api.get("/settings/public").then((r) => setBiz(r.data)).catch(() => {});
  }, []);

  return (
    <footer className="border-t border-subtle bg-leafva-surface mt-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 grid md:grid-cols-4 gap-10">
        <div className="md:col-span-1">
          <Link to="/" className="flex items-center gap-3 mb-4">
            <Logo size={36} />
            <span className="font-display text-lg tracking-wider text-white">LEAFVA</span>
          </Link>
          <p className="text-sm text-muted-leaf leading-relaxed">
            IT Intelligence, Powered by Nature and Technology.
          </p>
          <p className="text-xs text-muted-leaf mt-4 font-mono-leaf">{biz.ontario_reg_number}</p>
        </div>

        <div>
          <div className="text-xs uppercase tracking-widest text-gold mb-4">Services</div>
          <ul className="space-y-2 text-sm text-white/70">
            <li><Link to="/services" className="hover:text-white">IT Support</Link></li>
            <li><Link to="/services" className="hover:text-white">AI Services</Link></li>
            <li><Link to="/services" className="hover:text-white">Networking & Cable Run</Link></li>
            <li><Link to="/services" className="hover:text-white">Application Design</Link></li>
            <li><Link to="/services" className="hover:text-white">System Administration</Link></li>
            <li><Link to="/services" className="hover:text-white">Subcontracted Technical</Link></li>
          </ul>
        </div>

        <div>
          <div className="text-xs uppercase tracking-widest text-gold mb-4">Company</div>
          <ul className="space-y-2 text-sm text-white/70">
            <li><Link to="/about" className="hover:text-white">About LEAFVA</Link></li>
            <li><Link to="/assistant" className="hover:text-white">AI Assistant</Link></li>
            <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
            <li><Link to="/legal/privacy" className="hover:text-white">Privacy Policy</Link></li>
            <li><Link to="/legal/terms" className="hover:text-white">Terms of Use</Link></li>
            <li><Link to="/legal/ai-disclaimer" className="hover:text-white">AI Disclaimer</Link></li>
            <li><Link to="/legal/cookies" className="hover:text-white">Cookie Policy</Link></li>
          </ul>
        </div>

        <div>
          <div className="text-xs uppercase tracking-widest text-gold mb-4">Contact</div>
          <ul className="space-y-3 text-sm text-white/70">
            <li className="flex items-start gap-2"><MapPin size={14} className="mt-0.5 text-gold" /> {biz.address}</li>
            <li className="flex items-start gap-2"><Phone size={14} className="mt-0.5 text-gold" /> {biz.phone}</li>
            <li className="flex items-start gap-2"><Mail size={14} className="mt-0.5 text-gold" /> {biz.contact_email}</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-subtle">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6 flex flex-col md:flex-row justify-between items-center text-xs text-muted-leaf">
          <div>© {new Date().getFullYear()} LEAFVA. All rights reserved.</div>
          <div className="flex items-center gap-2 mt-2 md:mt-0">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block pulse-green" /> AI core online
          </div>
        </div>
      </div>
    </footer>
  );
}
