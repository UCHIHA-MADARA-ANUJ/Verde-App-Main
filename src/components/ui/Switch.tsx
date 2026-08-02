"use client";
import { cn } from "@/lib/utils";

export function Switch({
  checked, onChange, disabled, size = "md", color = "green",
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  size?: "sm" | "md";
  color?: "green" | "purple" | "red" | "amber";
}) {
  const w = size === "sm" ? 36 : 44;
  const h = size === "sm" ? 20 : 24;
  const dotSize = size === "sm" ? 14 : 16;
  const offset = size === "sm" ? 15 : 20;
  const checkedBg = {
    green: "bg-gradient-to-b from-green to-[#16a34a] border-green shadow-[0_0_12px_rgba(34,197,94,0.4)]",
    purple: "bg-gradient-to-b from-purple to-[#9333ea] border-purple shadow-[0_0_12px_rgba(168,85,247,0.4)]",
    red: "bg-gradient-to-b from-red to-[#dc2626] border-red shadow-[0_0_12px_rgba(239,68,68,0.4)]",
    amber: "bg-gradient-to-b from-amber to-[#d97706] border-amber shadow-[0_0_12px_rgba(245,158,11,0.4)]",
  }[color];
  return (
    <label
      className={cn("relative inline-block flex-shrink-0 cursor-pointer", disabled && "opacity-40 pointer-events-none")}
      style={{ width: w, height: h }}
    >
      <input type="checkbox" checked={checked} disabled={disabled} onChange={e => onChange(e.target.checked)} className="opacity-0 w-0 h-0" />
      <span className={cn(
        "absolute inset-0 rounded-full border border-[#2a3550] bg-[#1a2233] transition-all duration-300",
        checked && checkedBg
      )}>
        <span className={cn(
          "absolute rounded-full transition-all duration-300 shadow-md",
          "top-[3px] left-[3px]",
          checked ? "bg-black" : "bg-gradient-to-b from-slate-300 to-slate-500"
        )} style={{
          width: dotSize, height: dotSize,
          transform: checked ? `translateX(${offset}px)` : "translateX(0)",
        }} />
      </span>
    </label>
  );
}
