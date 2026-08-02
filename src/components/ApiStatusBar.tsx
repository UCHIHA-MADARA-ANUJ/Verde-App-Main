"use client";
import { Cloud, Cpu, Database, Leaf } from "lucide-react";

export function ApiStatusBar({
  weather, router, db, plant,
}: { weather: string; router: string; db: string; plant: string }) {
  const ok = (s: string) => s.startsWith("✅");
  const err = (s: string) => s.startsWith("❌");
  const waiting = (s: string) => s.startsWith("⏳") || s === "—";
  const Item = ({ icon, label, val, Icon }: { icon: string; label: string; val: string; Icon: any }) => {
    const dot = ok(val) ? "bg-green" : err(val) ? "bg-red" : waiting(val) ? "bg-amber" : "bg-slate-500";
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card2 flex-1 min-w-[140px]">
        <Icon className="w-3.5 h-3.5 text-slate-400" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
            <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400">{label}</span>
          </div>
          <div className={`font-mono text-[10px] truncate ${ok(val) ? "text-green-glow" : err(val) ? "text-red" : "text-slate-400"}`}>
            {val}
          </div>
        </div>
      </div>
    );
  };
  return (
    <div className="flex flex-wrap gap-2">
      <Item icon="db" label="Firebase" val={db} Icon={Database} />
      <Item icon="w" label="OpenWeather" val={weather} Icon={Cloud} />
      <Item icon="r" label="OpenRouter" val={router} Icon={Cpu} />
      <Item icon="p" label="Plant.id" val={plant} Icon={Leaf} />
    </div>
  );
}
