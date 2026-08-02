"use client";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle, XCircle, Info, X } from "lucide-react";
import { useVerdeStore } from "@/store/verde-store";
import { useEffect } from "react";

export function AlertToaster() {
  const notifications = useVerdeStore(s => s.notifications);
  const dismiss = useVerdeStore(s => s.dismissNotification);

  useEffect(() => {
    // Auto-dismiss non-persistent after 5s
    const timers = notifications.map(n => {
      if (!n.persistent) {
        return setTimeout(() => dismiss(n.id), 5000);
      }
      return null;
    });
    return () => timers.forEach(t => t && clearTimeout(t));
  }, [notifications, dismiss]);

  const Icon = (level: string) => {
    switch(level) {
      case "ok": return CheckCircle;
      case "warn": return AlertTriangle;
      case "err": return XCircle;
      default: return Info;
    }
  };
  const colorClass = (level: string) => ({
    ok: "bg-green/15 border-green/40 text-green-glow",
    warn: "bg-amber/15 border-amber/40 text-amber",
    err: "bg-red/15 border-red/40 text-red",
    info: "bg-sky/15 border-sky/40 text-sky",
  } as any)[level] || "bg-slate-800/60 border-slate-600 text-slate-200";

  return (
    <div className="fixed top-4 right-4 z-[1500] flex flex-col gap-2 w-[320px] max-w-[92vw] pointer-events-none">
      <AnimatePresence>
        {notifications.map(n => {
          const Ic = Icon(n.level);
          return (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: 40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className={`pointer-events-auto rounded-xl border px-4 py-3 backdrop-blur-md shadow-2xl flex items-start gap-3 ${colorClass(n.level)}`}
            >
              <Ic className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold mb-0.5">{n.title}</div>
                <div className="text-[11px] leading-snug opacity-90">{n.body}</div>
              </div>
              <button onClick={() => dismiss(n.id)} className="opacity-50 hover:opacity-100 transition">
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
