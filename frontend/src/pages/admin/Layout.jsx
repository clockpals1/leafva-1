import React from "react";
import { NavLink, Outlet, useNavigate, Navigate } from "react-router-dom";
import {
  LayoutDashboard, Ticket, Users, FolderKanban, FileText,
  CreditCard, BookOpen, UserCog, ShoppingCart, MailPlus, Settings, LogOut, ExternalLink
} from "lucide-react";
import Logo from "../../components/Logo";
import { auth } from "../../lib/api";

const NAV = [
  { to: "/admin", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/admin/tickets", icon: Ticket, label: "Tickets" },
  { to: "/admin/clients", icon: Users, label: "Clients (CRM)" },
  { to: "/admin/projects", icon: FolderKanban, label: "Projects" },
  { to: "/admin/invoices", icon: FileText, label: "Invoices" },
  { to: "/admin/payments", icon: CreditCard, label: "Payments" },
  { to: "/admin/bookkeeping", icon: BookOpen, label: "Bookkeeping" },
  { to: "/admin/payroll", icon: UserCog, label: "Payroll" },
  { to: "/admin/purchase-orders", icon: ShoppingCart, label: "Purchase Orders" },
  { to: "/admin/email", icon: MailPlus, label: "AI Email Composer" },
  { to: "/admin/settings", icon: Settings, label: "Settings" },
];

export default function AdminLayout() {
  const nav = useNavigate();
  if (!auth.isLoggedIn()) return <Navigate to="/admin/login" replace />;

  const user = auth.user();

  const logout = () => {
    auth.logout();
    nav("/admin/login");
  };

  return (
    <div className="min-h-screen flex bg-leafva-bg" data-testid="admin-layout">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-subtle bg-leafva-surface">
        <div className="px-5 py-5 border-b border-subtle flex items-center gap-3">
          <Logo size={28} />
          <div>
            <div className="text-white font-display tracking-wider">LEAFVA</div>
            <div className="text-[10px] uppercase tracking-widest text-gold">Admin</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              data-testid={`admin-nav-${n.label.toLowerCase().replace(/[^a-z]+/g, "-")}`}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive ? "bg-leafva-primary/20 text-gold border border-leafva-primary/40" : "text-white/70 hover:text-white hover:bg-white/5"
                }`
              }
            >
              <n.icon size={16} strokeWidth={1.5} />
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-subtle">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-muted-leaf hover:text-gold px-3 py-2"
          >
            <ExternalLink size={14} /> View public site
          </a>
          <div className="mt-2 flex items-center justify-between px-3 py-2">
            <div className="text-xs">
              <div className="text-white">{user?.name || "Admin"}</div>
              <div className="text-muted-leaf text-[10px]">{user?.email}</div>
            </div>
            <button onClick={logout} data-testid="admin-logout" className="text-muted-leaf hover:text-gold" title="Sign out">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden border-b border-subtle bg-leafva-surface px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo size={24} /> <span className="text-white font-display">LEAFVA Admin</span>
          </div>
          <button onClick={logout} className="text-muted-leaf"><LogOut size={16} /></button>
        </header>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden overflow-x-auto border-b border-subtle bg-leafva-surface flex gap-1 px-2 py-2">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `flex-shrink-0 px-3 py-1.5 rounded text-xs whitespace-nowrap ${
                  isActive ? "bg-leafva-primary/20 text-gold" : "text-white/60"
                }`
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>

        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
