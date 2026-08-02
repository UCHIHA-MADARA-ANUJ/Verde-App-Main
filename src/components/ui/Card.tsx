"use client";
import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  accent?: "green" | "purple" | "sky" | "amber" | "red" | "none";
  hover?: boolean;
  scanlines?: boolean;
  glow?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ accent = "none", hover = true, scanlines = false, glow = false, className, children, ...props }, ref) => {
    const accentBorder = {
      none: "",
      green: "before:bg-gradient-to-r before:from-transparent before:via-green/30 before:to-transparent shadow-[0_0_30px_rgba(34,197,94,0.05)]",
      purple: "before:bg-gradient-to-r before:from-transparent before:via-purple/30 before:to-transparent shadow-[0_0_30px_rgba(168,85,247,0.08)]",
      sky: "before:bg-gradient-to-r before:from-transparent before:via-sky/30 before:to-transparent shadow-[0_0_30px_rgba(14,165,233,0.05)]",
      amber: "before:bg-gradient-to-r before:from-transparent before:via-amber/30 before:to-transparent",
      red: "before:bg-gradient-to-r before:from-transparent before:via-red/30 before:to-transparent",
    }[accent];
    return (
      <div
        ref={ref}
        className={cn(
          "glass-card relative p-5",
          hover && "hover:-translate-y-0.5",
          scanlines && "scanlines",
          glow && "shadow-[0_0_40px_rgba(34,197,94,0.1)]",
          "before:absolute before:top-0 before:left-0 before:right-0 before:h-px before:opacity-0 hover:before:opacity-100 before:transition-opacity",
          accentBorder,
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = "Card";

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex items-center justify-between mb-4 gap-2", className)}>{children}</div>;
}

export function CardTitle({ children, icon: Icon, color = "sky" }: { children: React.ReactNode; icon?: any; color?: string }) {
  const colorMap: Record<string, string> = {
    sky: "text-sky", green: "text-green-glow", purple: "text-purple-glow",
    amber: "text-amber", red: "text-red",
  };
  return (
    <h2 className={cn("flex items-center gap-2 font-mono text-xs font-bold tracking-widest uppercase", colorMap[color] || colorMap.sky)}>
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {children}
    </h2>
  );
}
