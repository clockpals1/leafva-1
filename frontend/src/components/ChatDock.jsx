import React, { useState } from "react";
import { MessageSquare, X } from "lucide-react";
import ChatPanel from "./ChatPanel";

export default function ChatDock() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-20 right-6 z-50 h-14 w-14 rounded-full bg-leafva-primary border border-gold/50 text-white shadow-xl hover:shadow-[0_0_30px_rgba(212,175,55,0.35)] transition-all flex items-center justify-center pulse-green"
        data-testid="chat-dock-toggle"
        aria-label={open ? "Close chat" : "Open chat"}
      >
        {open ? <X size={20} /> : <MessageSquare size={22} />}
      </button>

      {open && (
        <div className="fixed bottom-40 right-6 z-50 w-[calc(100vw-3rem)] sm:w-[400px] h-[560px]" data-testid="chat-dock-panel">
          <ChatPanel fullHeight />
        </div>
      )}
    </>
  );
}
