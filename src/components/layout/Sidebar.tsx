"use client";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Activity, Leaf, MessageSquare, History as HistoryIcon,
  LineChart, Settings, Stethoscope, Bug, Sprout,
} from "lucide-react";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard", label: "Telemetry", icon: Activity },
  { href: "/doctor", label: "Plant Doctor", icon: Stethoscope },
  { href: "/chat", label: "AI Chat", icon: MessageSquare },
  { href: "/plants", label: "My Plants", icon: Sprout },
  { href: "/history", label: "History", icon: HistoryIcon },
  { href: "/analytics", label: "Analytics", icon: LineChart },
  { href: "/diagnostics", label: "Diagnostics", icon: Bug },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const path = usePathname();
  return (
    <>
      {/* Mobile overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity lg:hidden",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />
      <aside className={cn(
        "fixed lg:static top-0 left-0 z-50 h-screen w-64 bg-[#080b12]/95 backdrop-blur-xl border-r border-border flex flex-col transition-transform duration-300",
        open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="p-5 border-b border-border">
          <Link href="/" className="flex items-center gap-3" onClick={onClose}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green to-purple flex items-center justify-center shadow-lg shadow-green/20">
              <Leaf className="text-black w-5 h-5" strokeWidth={2.5} />
            </div>
            <div>
              <div className="font-display text-xl font-bold tracking-tight">
                <span className="text-white">VERDE</span>
                <span className="text-purple-glow"> OS</span>
              </div>
              <div className="font-mono text-[10px] text-green-glow">plant · mission · control</div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = path === href || (href !== "/" && path?.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative",
                  active
                    ? "bg-gradient-to-r from-green/15 to-transparent text-green-glow border-l-2 border-green"
                    : "text-slate-400 hover:text-slate-100 hover:bg-white/5 border-l-2 border-transparent"
                )}
              >
                <Icon className={cn("w-4 h-4 transition-transform group-hover:scale-110", active && "text-green-glow")} />
                <span className="font-mono text-xs uppercase tracking-wider">{label}</span>
                {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-green animate-pulse" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="rounded-lg bg-gradient-to-br from-purple/10 to-green/10 border border-border p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-green animate-pulse" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-green-glow font-bold">System Online</span>
            </div>
            <div className="font-mono text-[10px] text-slate-400 leading-relaxed">
              v2.0.0 · all APIs operational<br/>
              keep your plants alive 🌿
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
