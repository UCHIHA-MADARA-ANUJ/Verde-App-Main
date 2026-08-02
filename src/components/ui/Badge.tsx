"use client";
import { cn } from "@/lib/utils";

type BadgeColor = "green" | "purple" | "sky" | "amber" | "red" | "slate";

const colorMap: Record<BadgeColor, string> = {
  green: "bg-green/15 text-green-glow border-green/30",
  purple: "bg-purple/15 text-purple-glow border-purple/30",
  sky: "bg-sky/15 text-sky border-sky/30",
  amber: "bg-amber/15 text-amber border-amber/30",
  red: "bg-red/15 text-red border-red/30",
  slate: "bg-slate-700/30 text-slate-300 border-slate-600/40",
};

export function Badge({
  children, color = "slate", className, dot, pulse,
}: {
  children: React.ReactNode;
  color?: BadgeColor;
  className?: string;
  dot?: boolean;
  pulse?: boolean;
}) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border font-mono text-[10px] font-bold uppercase tracking-wider",
      colorMap[color], className
    )}>
      {dot && (
        <span className={cn(
          "w-1.5 h-1.5 rounded-full",
          color === "green" && "bg-green",
          color === "purple" && "bg-purple",
          color === "sky" && "bg-sky",
          color === "amber" && "bg-amber",
          color === "red" && "bg-red",
          color === "slate" && "bg-slate-400",
          pulse && "animate-pulse"
        )} />
      )}
      {children}
    </span>
  );
}

export function LiveDot({ status = "live" }: { status?: "live"|"off"|"connecting"|"err" }) {
  const map = {
    live: "bg-green shadow-[0_0_8px_#22c55e]",
    off: "bg-amber shadow-[0_0_8px_#f59e0b]",
    connecting: "bg-amber shadow-[0_0_8px_#f59e0b] animate-pulse",
    err: "bg-red shadow-[0_0_8px_#ef4444]",
  };
  return <span className={cn("w-2 h-2 rounded-full inline-block", map[status])} />;
}
