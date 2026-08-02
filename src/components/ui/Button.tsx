"use client";
import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { sfx as sfxPlay } from "@/lib/sound";

type Variant = "default" | "green" | "purple" | "red" | "amber" | "sky" | "ghost" | "outline";
type Size = "xs" | "sm" | "md" | "lg" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  noSfx?: boolean;
}

const variantStyles: Record<Variant, string> = {
  default: "bg-gradient-to-b from-[#1a2235] to-[#121827] border-[#334155] text-slate-200 hover:border-green hover:text-green-glow hover:shadow-[0_0_16px_rgba(34,197,94,0.15)]",
  green: "bg-gradient-to-b from-green to-[#16a34a] border-green text-black font-bold hover:border-green-glow hover:shadow-[0_0_24px_rgba(34,197,94,0.45)]",
  purple: "bg-gradient-to-b from-purple to-[#9333ea] border-purple text-[#1a0630] font-bold hover:border-purple-glow hover:shadow-[0_0_24px_rgba(168,85,247,0.45)]",
  red: "bg-gradient-to-b from-red to-[#dc2626] border-red text-[#1a0606] font-bold hover:shadow-[0_0_24px_rgba(239,68,68,0.45)]",
  amber: "bg-gradient-to-b from-amber to-[#d97706] border-amber text-black font-bold hover:shadow-[0_0_20px_rgba(245,158,11,0.4)]",
  sky: "bg-gradient-to-b from-sky to-[#0284c7] border-sky text-black font-bold hover:shadow-[0_0_20px_rgba(14,165,233,0.4)]",
  ghost: "bg-transparent border-transparent text-slate-400 hover:text-slate-100 hover:bg-white/5",
  outline: "bg-transparent border-border text-slate-300 hover:border-green hover:text-green-glow hover:bg-green/5",
};

const sizeStyles: Record<Size, string> = {
  xs: "h-7 px-2.5 text-[10px] rounded-md",
  sm: "h-8 px-3 text-[11px] rounded-md",
  md: "h-9 px-4 text-xs rounded-lg",
  lg: "h-11 px-6 text-sm rounded-lg",
  icon: "h-9 w-9 rounded-lg p-0 justify-center",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "default", size = "md", noSfx, className, children, onClick, ...props }, ref) => {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!noSfx && !props.disabled) sfxPlay.click();
      onClick?.(e);
    };
    return (
      <button
        ref={ref}
        onClick={handleClick}
        className={cn(
          "relative inline-flex items-center justify-center gap-2 font-mono font-semibold uppercase tracking-wider border transition-all duration-200 overflow-hidden select-none",
          "after:content-[''] after:absolute after:top-0 after:left-[-100%] after:w-full after:h-full after:bg-gradient-to-r after:from-transparent after:via-white/[0.06] after:to-transparent after:transition-all after:duration-500",
          "hover:after:left-[100%]",
          "active:translate-y-px",
          "disabled:opacity-40 disabled:pointer-events-none disabled:cursor-not-allowed",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
