import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CornerDownLeft, CheckCircle2 } from "lucide-react";
import { chat } from "../lib/api";

const NETWORK_BG = "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1920&q=80";

/**
 * Reusable AI chat panel — premium pill-bubble design with smooth motion.
 */
export default function ChatPanel({ fullHeight = false, embedded = false }) {
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [intakeComplete, setIntakeComplete] = useState(false);
  const [ticketId, setTicketId] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    chat.start().then((r) => {
      setSessionId(r.data.id);
      setMessages(r.data.messages || []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, sending]);

  const send = async () => {
    if (!input.trim() || sending) return;
    const userText = input.trim();
    setInput("");
    setMessages((m) => [...m, { role: "user", content: userText }]);
    setSending(true);
    try {
      const r = await chat.send(sessionId, userText);
      setSessionId(r.data.session_id);
      setMessages((m) => [...m, { role: "assistant", content: r.data.reply }]);
      if (r.data.intake_complete) {
        setIntakeComplete(true);
        setTicketId(r.data.ticket_id);
      }
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", content: "Network error. Please try again." }]);
    } finally {
      setSending(false);
    }
  };

  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div
      className={`relative flex flex-col ${fullHeight ? "h-full" : "min-h-[560px]"} overflow-hidden rounded-[28px] border border-leafva-primary/30`}
      style={{ background: "linear-gradient(135deg, #0a1812 0%, #0d2418 50%, #081410 100%)" }}
      data-testid="chat-panel"
    >
      {/* Faint circuit board image as ambient background */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.08]">
        <img src={NETWORK_BG} alt="" className="w-full h-full object-cover" />
      </div>
      {/* Soft inner gold glow at top */}
      <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 h-40 w-[80%] rounded-full bg-gold/10 blur-3xl" />

      {/* Header */}
      <div className="relative px-6 pt-6 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-gold/60 animate-ping" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-gold" />
          </span>
          <span className="text-leafva-beam text-xs sm:text-sm font-display tracking-[0.35em] uppercase">
            LEAFVA Assistant · Live
          </span>
        </div>
        {!embedded && (
          <span className="hidden sm:inline text-[10px] uppercase tracking-[0.25em] text-leafva-beam/40 font-mono-leaf">
            sonnet · 4.5
          </span>
        )}
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="relative flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-5"
        data-testid="chat-messages"
      >
        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 18, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ type: "spring", stiffness: 260, damping: 22, delay: i === messages.length - 1 ? 0.05 : 0 }}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={
                  m.role === "user"
                    ? "max-w-[78%] rounded-[26px] rounded-tr-md px-6 py-3.5 text-sm sm:text-base font-medium shadow-[0_4px_20px_rgba(212,175,55,0.15)]"
                    : "max-w-[80%] rounded-[26px] rounded-tl-md px-6 py-3.5 text-sm sm:text-base shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
                }
                style={
                  m.role === "user"
                    ? { background: "linear-gradient(135deg, #D4AF37 0%, #E0BD4E 100%)", color: "#1A1208" }
                    : { background: "linear-gradient(135deg, #0F3D26 0%, #1A4F33 100%)", color: "#EAE0C8" }
                }
              >
                <MessageText text={m.content} />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {sending && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div
              className="rounded-[26px] rounded-tl-md px-6 py-4"
              style={{ background: "linear-gradient(135deg, #0F3D26 0%, #1A4F33 100%)" }}
            >
              <div className="flex gap-1.5 items-center">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="h-1.5 w-1.5 rounded-full bg-gold"
                    animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {intakeComplete && ticketId && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="mx-2 rounded-2xl border border-gold/40 bg-gold/5 backdrop-blur-sm p-4 flex items-start gap-3"
            data-testid="chat-intake-complete"
          >
            <CheckCircle2 className="text-gold flex-shrink-0 mt-0.5" size={18} />
            <div className="text-sm">
              <div className="text-gold font-medium tracking-wide">Ticket filed.</div>
              <div className="text-leafva-beam/70 mt-1">A LEAFVA specialist will reach out shortly. Confirmation email queued.</div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input */}
      <div className="relative px-4 sm:px-6 pb-5 pt-2">
        <div className="flex items-center gap-2 bg-black/30 backdrop-blur-sm border border-leafva-primary/30 rounded-full pl-5 pr-2 py-1.5 focus-within:border-gold/60 transition-colors">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder={intakeComplete ? "Continue the conversation…" : "Describe your issue or project…"}
            className="flex-1 bg-transparent text-leafva-beam placeholder:text-leafva-beam/40 text-sm sm:text-base outline-none py-2"
            data-testid="chat-input"
          />
          <motion.button
            onClick={send}
            disabled={!input.trim() || sending}
            whileTap={{ scale: 0.92 }}
            whileHover={{ scale: 1.05 }}
            className="h-9 w-9 rounded-full flex items-center justify-center text-leafva-beam/60 hover:text-gold disabled:opacity-30 transition-colors"
            data-testid="chat-send-button"
            aria-label="Send message"
          >
            <CornerDownLeft size={16} />
          </motion.button>
        </div>
        {!embedded && (
          <div className="mt-3 px-2 text-[10px] tracking-wider uppercase text-leafva-beam/30">
            By chatting you accept our <a href="/legal/ai-disclaimer" className="underline hover:text-gold">AI Disclaimer</a> · PIPEDA & GDPR aligned
          </div>
        )}
      </div>
    </div>
  );
}

function MessageText({ text }) {
  // Render **bold** + preserve line breaks
  const segments = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <span className="whitespace-pre-wrap leading-relaxed">
      {segments.map((seg, k) =>
        seg.startsWith("**") && seg.endsWith("**")
          ? <strong key={k} className="font-semibold">{seg.slice(2, -2)}</strong>
          : <React.Fragment key={k}>{seg}</React.Fragment>
      )}
    </span>
  );
}
