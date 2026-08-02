"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const LINES = [
  { t: 0, text: "VERDE OS v2.0 — kernel init" },
  { t: 220, text: "mounting Firebase RTDB stream [ok]" },
  { t: 420, text: "ESP32 telemetry client loaded [ok]" },
  { t: 620, text: "authenticating Gemini · OpenRouter · Plant.id [ok]" },
  { t: 820, text: "arming weather auto-override (10min cycle) [ok]" },
  { t: 1020, text: "calibrating plant-vision module v2 [ok]" },
  { t: 1220, text: "loading sound engine + haptics [ok]" },
  { t: 1420, text: "restoring history · plants · settings [ok]" },
  { t: 1650, text: "system ready. welcome, operator. 🌿" },
];

export function BootScreen({ onDone }: { onDone: () => void }) {
  const [visible, setVisible] = useState(0);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timers = LINES.map((l, i) => setTimeout(() => setVisible(i+1), l.t));
    const startExit = setTimeout(() => setExiting(true), 2200);
    const finish = setTimeout(onDone, 2800);
    import("@/lib/sound").then(m => m.sfx.startup());
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(startExit);
      clearTimeout(finish);
    };
  }, [onDone]);

  return (
    <AnimatePresence>
      {!exiting && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[9999] bg-[#020408] flex items-center justify-center p-4"
        >
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
            <div className="flex items-center gap-4 mb-8">
              <motion.svg
                width="64" height="64" viewBox="0 0 64 64"
                initial={{ rotate: -20, scale: 0.8 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              >
                <defs>
                  <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                </defs>
                <rect x="4" y="4" width="56" height="56" rx="14" fill="#080b12" stroke="#1a2233" />
                <path d="M32 52 C32 34 20 24 14 20 C20 32 26 40 32 42 Z" fill="url(#bg)" />
                <path d="M32 52 C32 34 44 24 50 20 C44 32 38 40 32 42 Z" fill="url(#bg)" opacity="0.85" />
                <rect x="30" y="44" width="4" height="12" rx="1" fill="#4ade80" />
              </motion.svg>
              <div>
                <div className="font-display text-4xl font-bold tracking-tight">
                  VERDE<span className="text-purple-glow glow-purple">OS</span>
                </div>
                <div className="font-mono text-xs text-green-glow tracking-widest">PLANT · MISSION · CONTROL</div>
              </div>
            </div>

            <div className="font-mono text-xs leading-7 mb-6 h-56">
              {LINES.slice(0, visible).map((l, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex gap-3"
                >
                  <span className="text-slate-600 w-6 text-right">[{String(i+1).padStart(2,"0")}]</span>
                  <span className="text-green-glow">{l.text}</span>
                  <span className="text-green">✓</span>
                </motion.div>
              ))}
              {visible < LINES.length && (
                <div className="flex gap-3">
                  <span className="text-slate-600 w-6 text-right">[{String(visible+1).padStart(2,"0")}]</span>
                  <span className="text-green-glow" />
                  <span className="inline-block w-2 h-4 bg-green animate-blink" />
                </div>
              )}
            </div>

            <div className="h-1 rounded-full bg-slate-800 overflow-hidden">
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: visible >= LINES.length ? "100%" : `${(visible/LINES.length)*100}%` }}
                transition={{ duration: 0.3 }}
                className="h-full bg-gradient-to-r from-green via-green-glow to-purple shadow-[0_0_12px_#22c55e]"
              />
            </div>
            <div className="mt-3 flex justify-between font-mono text-[10px] text-slate-600 uppercase tracking-widest">
              <span>booting…</span>
              <span>{Math.round((visible/LINES.length)*100)}%</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
