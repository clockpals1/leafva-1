import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X } from "lucide-react";
import Logo from "./Logo";

const links = [
  { to: "/", label: "Home" },
  { to: "/services", label: "Services" },
  { to: "/about", label: "About" },
  { to: "/assistant", label: "AI Assistant" },
  { to: "/contact", label: "Contact" },
];

export default function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-subtle bg-leafva-bg/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-3 group" data-testid="nav-logo">
          <Logo size={32} />
          <div className="flex flex-col leading-none">
            <span className="font-display font-semibold tracking-wider text-white text-base">LEAFVA</span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-gold">IT × Nature</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              data-testid={`nav-link-${l.label.toLowerCase().replace(/\s+/g, "-")}`}
              className={({ isActive }) =>
                `relative px-4 py-2 text-sm font-medium transition-colors ${
                  isActive ? "text-gold" : "text-white/80 hover:text-white"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {l.label}
                  {isActive && (
                    <span className="absolute -bottom-px left-4 right-4 h-px bg-gold" />
                  )}
                </>
              )}
            </NavLink>
          ))}
          <Link
            to="/assistant"
            data-testid="nav-cta-button"
            className="ml-3 btn-gold text-sm py-2 px-4"
          >
            Tell LEAFVA what you need
          </Link>
        </nav>

        <button
          onClick={() => setOpen(!open)}
          className="md:hidden text-white p-2"
          data-testid="nav-mobile-toggle"
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-subtle bg-leafva-surface">
          <div className="px-6 py-4 flex flex-col gap-3">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                end={l.to === "/"}
                className={({ isActive }) =>
                  `text-sm py-2 ${isActive ? "text-gold" : "text-white/80"}`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
