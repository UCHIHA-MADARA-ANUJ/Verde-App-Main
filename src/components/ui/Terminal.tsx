"use client";
import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

interface Line {
  id?: string;
  who?: "you"|"ai"|"sys"|"info"|"ok"|"warn"|"err";
  text: string;
  meta?: string;
}

export function Terminal({
  lines, className, heightClass = "h-48", autoScroll = true,
}: { lines: Line[]; className?: string; heightClass?: string; autoScroll?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (autoScroll && ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [lines, autoScroll]);

  return (
    <div ref={ref} className={cn("terminal overflow-y-auto text-[11px] leading-relaxed", heightClass, className)}>
      {lines.map((l, i) => {
        const color = l.who === "you" ? "text-purple-glow"
          : l.who === "ai" ? "text-green-glow"
          : l.who === "sys" ? "text-slate-400"
          : l.who === "ok" ? "text-green-glow"
          : l.who === "warn" ? "text-amber"
          : l.who === "err" ? "text-red"
          : "text-green-glow/90";
        const prefix = l.who === "you" ? "YOU ▸ "
          : l.who === "ai" ? `VERDE AI${l.meta?` (${l.meta})`:""} ▸ `
          : "";
        return (
          <div key={l.id || i} className="terminal-entry mb-1.5 whitespace-pre-wrap break-words">
            {prefix && <span className="font-bold">{prefix}</span>}
            <span className={l.who === "you" ? "text-slate-200" : l.who === "sys" ? color : color}>{l.text}</span>
          </div>
        );
      })}
    </div>
  );
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "chat-input w-full bg-[#080c15] border border-border rounded-lg px-3.5 py-2.5 font-mono text-xs text-slate-200 outline-none transition-all",
        "focus:border-green focus:shadow-[0_0_0_3px_rgba(34,197,94,0.1),0_0_20px_rgba(34,197,94,0.08)] focus:bg-[#0a0f18]",
        "placeholder:text-slate-600 disabled:opacity-40",
        className
      )}
      {...props}
    />
  );
}
