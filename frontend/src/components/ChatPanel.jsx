import React, { useEffect, useRef, useState } from "react";
import { Send, Sparkles, CheckCircle2 } from "lucide-react";
import { chat } from "../lib/api";
import Logo from "./Logo";

/**
 * Reusable AI chat panel.
 * @param {boolean} fullHeight - when true, uses h-full; otherwise default min-h-[600px].
 * @param {boolean} embedded - when embedded (dock), shows compact header.
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
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
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
    <div className={`flex flex-col ${fullHeight ? "h-full" : "min-h-[560px]"} bg-leafva-surface border border-subtle rounded-2xl overflow-hidden`}
         data-testid="chat-panel">
      {!embedded && (
        <div className="border-b border-subtle px-5 py-4 flex items-center justify-between bg-black/30">
          <div className="flex items-center gap-3">
            <Logo size={28} />
            <div>
              <div className="font-display font-medium tracking-wide text-white text-sm">LEAFVA AI Assistant</div>
              <div className="text-[11px] uppercase tracking-widest text-gold flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block pulse-green" />
                Live
              </div>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-muted-leaf">
            <Sparkles size={12} /> Claude Sonnet 4.5
          </div>
        </div>
      )}

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-4"
        data-testid="chat-messages"
      >
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} fade-up`}>
            {m.role === "assistant" && (
              <div className="mr-2 mt-1 hidden sm:block">
                <div className="h-7 w-7 rounded-full bg-leafva-primary/30 border border-leafva-primary flex items-center justify-center">
                  <Logo size={14} />
                </div>
              </div>
            )}
            <div className={
              m.role === "user"
                ? "max-w-[80%] bg-leafva-card border border-subtle text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed"
                : "max-w-[80%] bg-leafva-primary/15 border border-leafva-primary/30 text-leafva-beam rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap"
            }>
              {m.content.split(/(\*\*[^*]+\*\*)/g).map((seg, k) =>
                seg.startsWith("**") && seg.endsWith("**")
                  ? <strong key={k} className="text-gold">{seg.slice(2, -2)}</strong>
                  : <span key={k}>{seg}</span>
              )}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start fade-up">
            <div className="bg-leafva-primary/15 border border-leafva-primary/30 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1.5">
                <span className="h-2 w-2 rounded-full bg-gold animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="h-2 w-2 rounded-full bg-gold animate-bounce" style={{ animationDelay: "120ms" }} />
                <span className="h-2 w-2 rounded-full bg-gold animate-bounce" style={{ animationDelay: "240ms" }} />
              </div>
            </div>
          </div>
        )}
        {intakeComplete && ticketId && (
          <div className="rounded-xl border border-gold/40 bg-gold/5 p-4 flex items-start gap-3 fade-up" data-testid="chat-intake-complete">
            <CheckCircle2 className="text-gold flex-shrink-0 mt-0.5" size={18} />
            <div className="text-sm">
              <div className="text-gold font-medium">Ticket filed successfully.</div>
              <div className="text-white/70 mt-1">A LEAFVA specialist will contact you shortly. A confirmation email has been queued.</div>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-subtle p-3 bg-black/30">
        <div className="flex items-end gap-2 bg-black border border-subtle rounded-xl p-2 focus-within:border-gold transition-colors">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder={intakeComplete ? "Continue the conversation…" : "Tell LEAFVA what you need…"}
            rows={1}
            className="flex-1 bg-transparent text-white placeholder:text-muted-leaf text-sm resize-none px-3 py-2 outline-none max-h-32"
            data-testid="chat-input"
          />
          <button
            onClick={send}
            disabled={!input.trim() || sending}
            className="h-10 w-10 rounded-lg bg-leafva-primary hover:bg-leafva-primaryHover disabled:opacity-40 transition-colors flex items-center justify-center text-white"
            data-testid="chat-send-button"
            aria-label="Send message"
          >
            <Send size={16} />
          </button>
        </div>
        <div className="text-[10px] text-muted-leaf mt-2 px-1">
          By chatting, you agree to our <a href="/legal/ai-disclaimer" className="underline hover:text-gold">AI Disclaimer</a>. Data handled per PIPEDA/GDPR.
        </div>
      </div>
    </div>
  );
}
