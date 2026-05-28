import React, { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { Lock, AlertCircle } from "lucide-react";
import Logo from "../../components/Logo";
import { auth } from "../../lib/api";

export default function AdminLogin() {
  const nav = useNavigate();
  const [email, setEmail] = useState("admin@leafva.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  if (auth.isLoggedIn()) return <Navigate to="/admin" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const r = await auth.login(email, password);
      auth.setToken(r.data.access_token, r.data.user);
      nav("/admin");
    } catch (e) {
      setErr(e?.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-leafva-bg bg-grid-leaf px-6" data-testid="admin-login-page">
      <div className="absolute inset-0 bg-gradient-to-br from-leafva-primary/10 to-transparent pointer-events-none" />
      <div className="relative w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <Logo size={48} />
          <h1 className="font-display text-2xl text-white mt-4">LEAFVA Admin</h1>
          <p className="text-xs uppercase tracking-widest text-gold mt-1">Control Center</p>
        </div>

        <form onSubmit={submit} className="rounded-2xl border border-subtle bg-leafva-card p-8 space-y-5">
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-leaf">Email</label>
            <input
              data-testid="admin-login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-2 w-full bg-black border border-subtle rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-gold transition-colors"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-leaf">Password</label>
            <input
              data-testid="admin-login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-2 w-full bg-black border border-subtle rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-gold transition-colors"
            />
          </div>
          {err && (
            <div className="flex items-start gap-2 text-sm text-red-400 bg-red-950/30 border border-red-900/40 rounded-lg p-3" data-testid="admin-login-error">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" /> {err}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            data-testid="admin-login-submit"
            className="w-full btn-primary justify-center disabled:opacity-50"
          >
            <Lock size={16} /> {loading ? "Signing in…" : "Sign in"}
          </button>
          <p className="text-xs text-muted-leaf text-center pt-2">
            Default: admin@leafva.com / LeafvaAdmin@2026
          </p>
        </form>
      </div>
    </div>
  );
}
