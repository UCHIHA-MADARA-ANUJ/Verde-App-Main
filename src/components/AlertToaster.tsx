"use client";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";

export function AlertToaster({ alerts }: {
  alerts: { id: string; text: string; level: "ok" | "warn" | "err" }[];
}) {
  return (
    <div className="fixed top-4 right-4 z-[1500] flex flex-col gap-2 max-w-[320px] pointer-events-none">
      <AnimatePresence>
        {alerts.map(a => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, x: 30, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 30, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className={`pointer-events-auto rounded-xl border px-4 py-3 backdrop-blur-md shadow-2xl flex items-start gap-2 ${
              a.level === "err"
                ? "bg-red/15 border-red/40 text-red"
                : a.level === "warn"
                ? "bg-amber/15 border-amber/40 text-amber"
                : "bg-green/15 border-green/40 text-green-glow"
            }`}
          >
            {a.level === "err" ? <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              : a.level === "warn" ? <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              : <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
            <div className="text-[12px] font-medium leading-snug">{a.text}</div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
