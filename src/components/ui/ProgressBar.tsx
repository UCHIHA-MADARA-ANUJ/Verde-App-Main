"use client";
import { cn } from "@/lib/utils";

export function ProgressBar({
  value, min = 0, max = 100, color = "green", className, showLabel = false, label,
}: {
  value: number;
  min?: number;
  max?: number;
  color?: "green" | "purple" | "sky" | "amber" | "red";
  className?: string;
  showLabel?: boolean;
  label?: string;
}) {
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  const fillClass = {
    green: "bg-gradient-to-r from-green to-green-glow shadow-[0_0_10px_rgba(34,197,94,0.5)]",
    purple: "bg-gradient-to-r from-purple to-purple-glow shadow-[0_0_10px_rgba(168,85,247,0.5)]",
    sky: "bg-gradient-to-r from-sky to-cyan-300 shadow-[0_0_10px_rgba(14,165,233,0.5)]",
    amber: "bg-gradient-to-r from-amber to-yellow-300 shadow-[0_0_10px_rgba(245,158,11,0.5)]",
    red: "bg-gradient-to-r from-red to-red-400 shadow-[0_0_10px_rgba(239,68,68,0.5)]",
  }[color];
  return (
    <div className={cn("relative h-1.5 rounded-full bg-slate-800 overflow-hidden", className)}>
      <div
        className={cn("h-full rounded-full transition-all duration-500 ease-out", fillClass)}
        style={{ width: `${pct}%` }}
      />
      {showLabel && (
        <span className="absolute inset-0 flex items-center justify-center text-[9px] font-mono font-bold text-white/90 mix-blend-difference">
          {label ?? `${Math.round(pct)}%`}
        </span>
      )}
    </div>
  );
}
