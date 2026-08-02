"use client";
import { Brain, Send, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ChatMsg } from "@/hooks/useVerde";
import type { VerdeImage } from "@/types";

export function GeminiChat({
  msgs, busy, currentImage, onSend,
}: {
  msgs: ChatMsg[];
  busy: boolean;
  currentImage: VerdeImage | null;
  onSend: (q: string) => void;
}) {
  const [input, setInput] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight;
  }, [msgs, busy]);

  const submit = () => {
    if (!input.trim() || busy) return;
    onSend(input.trim());
    setInput("");
  };

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="flex items-center gap-2 font-mono text-xs font-bold tracking-widest uppercase text-sky">
          <Brain className="w-3.5 h-3.5" /> Gemini 2.5 Flash — Vision Chat
        </h2>
        <span className={`badge ${currentImage ? "badge-green" : "badge-amber"}`}>
          {currentImage ? "👁 image loaded" : "no image"}
        </span>
      </div>

      <div ref={boxRef} className="terminal h-48 overflow-y-auto text-[12px] leading-relaxed">
        {msgs.map(m => (
          <div key={m.id} className="terminal-entry mb-2">
            {m.who === "you" && <div><span className="text-purple-glow font-bold">YOU ▸ </span><span className="text-slate-200">{m.text}</span></div>}
            {m.who === "ai" && <div><span className="text-green-glow font-bold">VERDE AI ▸ </span><span className="text-green-glow/90 whitespace-pre-wrap">{m.text}</span></div>}
            {m.who === "sys" && <div className="text-slate-400 whitespace-pre-wrap">{m.text}</div>}
          </div>
        ))}
        {busy && (
          <div className="flex items-center gap-2 text-green-glow">
            <Loader2 className="w-3 h-3 animate-spin" /> thinking<span className="animate-blink">▊</span>
          </div>
        )}
      </div>

      <div className="flex gap-2 mt-3">
        <input className="input flex-1" placeholder={currentImage ? "Ask about this plant photo…" : "Type a question…"}
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") submit(); }} />
        <button className="btn btn-green" onClick={submit} disabled={busy || !input.trim()}>
          <Send className="w-3.5 h-3.5" /> ASK
        </button>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {[
          "What disease might this be?",
          "How should I treat it?",
          "Is it getting enough light?",
          "When should I water it?",
        ].map(q => (
          <button key={q} className="text-[10px] font-mono px-2 py-1 rounded-md border border-border text-slate-400 hover:border-green hover:text-green-glow transition"
            onClick={() => { setInput(q); setTimeout(submit, 50); }}>
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
