"use client";
import { Cloud, Cpu, Database, Leaf, Brain } from "lucide-react";
import { useVerdeStore } from "@/store/verde-store";

export function ApiStatusBar() {
  const api = useVerdeStore(s => s.apiStatus);
  const ok = (s: string) => s.startsWith("✅");
  const err = (s: string) => s.startsWith("❌");
  const wait = (s: string) => s.startsWith("⏳") || s === "—";

  const items = [
    { key: "firebase", label: "Firebase RTDB", val: api.firebase, Icon: Database },
    { key: "weather", label: "OpenWeather", val: api.weather, Icon: Cloud },
    { key: "gemini", label: "Gemini Vision", val: api.gemini, Icon: Brain },
    { key: "router", label: "OpenRouter", val: api.router, Icon: Cpu },
    { key: "plant", label: "Plant.id", val: api.plant, Icon: Leaf },
  ];

  return (
    <div className="glass-card p-4">
      <div className="flex flex-wrap gap-2">
        {items.map(({key, label, val, Icon}) => {
          const dot = ok(val) ? "bg-green shadow-[0_0_8px_#22c55e]"
            : err(val) ? "bg-red shadow-[0_0_8px_#ef4444]"
            : wait(val) ? "bg-amber shadow-[0_0_8px_#f59e0b] animate-pulse"
            : "bg-slate-500";
          return (
            <div key={key} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-[#0c0f16] flex-1 min-w-[150px]">
              <Icon className="w-3.5 h-3.5 text-slate-400" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                  <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400">{label}</span>
                </div>
                <div className={`font-mono text-[10px] truncate ${ok(val)?"text-green-glow":err(val)?"text-red":"text-slate-400"}`}>{val}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
