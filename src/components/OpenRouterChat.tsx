"use client";
import { Bot, Send, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ChatMsg } from "@/hooks/useVerde";

export function OpenRouterChat({
  msgs, busy, onSend,
}: {
  msgs: ChatMsg[];
  busy: boolean;
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

  const quick = [
    "What is the current soil moisture and is it healthy?",
    "Should I water the plant right now? Use the thresholds.",
    "Is the reservoir tank safe? What happens if it empties?",
    "Summarize whole system status for a judge.",
  ];

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="flex items-center gap-2 font-mono text-xs font-bold tracking-widest uppercase text-purple-glow">
          <Bot className="w-3.5 h-3.5" /> Sensor-Aware Chat (OpenRouter · free models)
        </h2>
        <span className="badge badge-purple">live sensors</span>
      </div>

      <div ref={boxRef} className="terminal h-44 overflow-y-auto text-[12px] leading-relaxed">
        {msgs.map(m => (
          <div key={m.id} className="terminal-entry mb-2">
            {m.who === "you" && <div><span className="text-purple-glow font-bold">YOU ▸ </span><span className="text-slate-200">{m.text}</span></div>}
            {m.who === "ai" && <div><span className="text-purple-glow font-bold">VERDE AI{ m.meta ? ` (${m.meta})` : ""} ▸ </span><span className="text-slate-200 whitespace-pre-wrap">{m.text}</span></div>}
            {m.who === "sys" && <div className="text-slate-400 whitespace-pre-wrap">{m.text}</div>}
          </div>
        ))}
        {busy && (
          <div className="flex items-center gap-2 text-purple-glow">
            <Loader2 className="w-3 h-3 animate-spin" /> routing through free models<span className="animate-blink">▊</span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 mt-3">
        {quick.map(q => (
          <button key={q} className="text-[10px] font-mono px-2 py-1 rounded-md border border-border text-slate-400 hover:border-purple hover:text-purple-glow transition"
            onClick={() => { setInput(q); setTimeout(submit, 50); }}>
            {q}
          </button>
        ))}
      </div>

      <div className="flex gap-2 mt-3">
        <input className="input flex-1" placeholder="Ask about live sensors or controls…"
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") submit(); }} />
        <button className="btn btn-purple" onClick={submit} disabled={busy || !input.trim()}>
          <Send className="w-3.5 h-3.5" /> ASK
        </button>
      </div>
    </div>
  );
}
