import React, { useEffect, useState, useRef } from "react";
import { useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Loader2, ArrowLeft } from "lucide-react";
import Logo from "../components/Logo";
import api from "../lib/api";

export function PaymentSuccess() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const sessionId = params.get("session_id");
  const invoiceId = params.get("invoice");

  const [status, setStatus] = useState("checking");
  const [details, setDetails] = useState(null);
  const attemptsRef = useRef(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      return;
    }

    const poll = async () => {
      try {
        const r = await api.get(`/payments/checkout/status/${sessionId}`);
        setDetails(r.data);
        if (r.data.payment_status === "paid") {
          setStatus("paid");
          clearInterval(intervalRef.current);
        } else if (r.data.status === "expired") {
          setStatus("expired");
          clearInterval(intervalRef.current);
        } else {
          attemptsRef.current += 1;
          if (attemptsRef.current >= 8) {
            setStatus("timeout");
            clearInterval(intervalRef.current);
          }
        }
      } catch (e) {
        attemptsRef.current += 1;
        if (attemptsRef.current >= 8) {
          setStatus("error");
          clearInterval(intervalRef.current);
        }
      }
    };

    poll();
    intervalRef.current = setInterval(poll, 2200);
    return () => clearInterval(intervalRef.current);
  }, [sessionId]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-leafva-bg bg-grid-leaf px-6" data-testid="page-payment-success">
      <div className="absolute inset-0 bg-gradient-to-br from-leafva-primary/10 to-transparent pointer-events-none" />
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="relative w-full max-w-md rounded-2xl border border-subtle bg-leafva-card p-10 text-center"
      >
        <div className="flex flex-col items-center">
          <Logo size={42} />
          <div className="text-xs uppercase tracking-widest text-gold mt-4">/ payment</div>
        </div>

        <div className="mt-8">
          {status === "checking" && (
            <>
              <Loader2 className="mx-auto text-gold animate-spin" size={42} />
              <h1 className="font-display text-2xl text-white mt-6">Confirming your payment…</h1>
              <p className="text-white/60 mt-3 text-sm">Polling Stripe — usually takes a few seconds.</p>
            </>
          )}
          {status === "paid" && (
            <>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}>
                <CheckCircle2 className="mx-auto text-emerald-400" size={56} />
              </motion.div>
              <h1 className="font-display text-3xl text-white mt-6">Payment received.</h1>
              <p className="text-white/70 mt-3">
                Thank you — your invoice has been marked as paid. A receipt has been sent to your email.
              </p>
              {details && (
                <div className="mt-6 inline-block rounded-lg border border-subtle bg-black/40 px-4 py-2 font-mono-leaf text-xs text-gold">
                  ${(details.amount_total / 100).toFixed(2)} {(details.currency || "cad").toUpperCase()}
                </div>
              )}
            </>
          )}
          {(status === "expired" || status === "error" || status === "timeout") && (
            <>
              <XCircle className="mx-auto text-red-400" size={48} />
              <h1 className="font-display text-2xl text-white mt-6">
                {status === "expired" ? "Session expired" : "We couldn't confirm payment"}
              </h1>
              <p className="text-white/60 mt-3 text-sm">
                If you completed the payment, please check your email — we'll catch it via webhook. Or contact us if anything looks off.
              </p>
            </>
          )}
        </div>

        <Link to="/" className="mt-10 inline-flex items-center gap-2 text-sm text-gold hover:underline">
          <ArrowLeft size={14} /> Back to leafva.com
        </Link>
      </motion.div>
    </div>
  );
}

export function PaymentCancel() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-leafva-bg bg-grid-leaf px-6" data-testid="page-payment-cancel">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md rounded-2xl border border-subtle bg-leafva-card p-10 text-center"
      >
        <Logo size={42} />
        <div className="text-xs uppercase tracking-widest text-gold mt-4">/ payment</div>
        <XCircle className="mx-auto text-orange-400 mt-8" size={48} />
        <h1 className="font-display text-2xl text-white mt-6">Payment cancelled</h1>
        <p className="text-white/60 mt-3 text-sm">
          No charge was made. You can re-open the invoice link any time to complete payment.
        </p>
        <Link to="/" className="mt-10 inline-flex items-center gap-2 text-sm text-gold hover:underline">
          <ArrowLeft size={14} /> Back to leafva.com
        </Link>
      </motion.div>
    </div>
  );
}
