import React from "react";
import ChatPanel from "../components/ChatPanel";

export default function Assistant() {
  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16" data-testid="page-assistant">
      <div className="text-xs uppercase tracking-[0.25em] text-gold mb-4">/ ai assistant</div>
      <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl text-white max-w-2xl leading-tight mb-3">
        Talk to LEAFVA.
      </h1>
      <p className="text-white/60 max-w-xl mb-10">
        Describe your situation naturally. Our AI intake will qualify urgency, capture context, and open a ticket — no forms required.
      </p>

      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 h-[70vh] min-h-[600px]">
          <ChatPanel fullHeight />
        </div>
        <aside className="lg:col-span-4 space-y-4">
          <Panel title="What happens here">
            The assistant will ask about your category (IT, AI, Networking, etc.), urgency, and key technical details, then collect your contact info to open a ticket.
          </Panel>
          <Panel title="Privacy first">
            We collect the minimum information needed to help you. Data is encrypted in transit and at rest. PIPEDA & GDPR aligned.
          </Panel>
          <Panel title="Need a human?">
            Type <strong className="text-gold">"speak to a person"</strong> anytime and we'll route you to a LEAFVA specialist via email.
          </Panel>
        </aside>
      </div>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <div className="rounded-xl border border-subtle bg-leafva-card p-5">
      <div className="text-[11px] uppercase tracking-widest text-gold mb-2">{title}</div>
      <div className="text-sm text-white/70 leading-relaxed">{children}</div>
    </div>
  );
}
