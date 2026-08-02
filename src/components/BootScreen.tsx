"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const LINES = [
  { t: 0, text: "> VERDE OS v1.0.0 — initializing kernel…" },
  { t: 300, text: "> loading Firebase RTDB client… OK" },
  { t: 550, text: "> mounting ESP32 telemetry stream… OK" },
  { t: 800, text: "> authenticating Gemini / OpenRouter / Plant.id… OK" },
  { t: 1050, text: "> arming weather auto-override… OK" },
  { t: 1300, text: "> calibrating plant-doctor vision module… OK" },
  { t: 1550, text: "> system ready. welcome, operator. 🌿" },
];

export function BootScreen({ onDone }: { onDone: () => void }) {
  const [visible, setVisible] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const timers = LINES.map((l, i) =>
      setTimeout(() => setVisible(i + 1), l.t)
    );
    const end = setTimeout(() => setDone(true), 2400);
    const gone = setTimeout(onDone, 3000);
    return () => { timers.forEach(clearTimeout); clearTimeout(end); clearTimeout(gone); };
  }, [onDone]);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          className="boot-overlay"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center gap-6"
          >
            <div className="flex items-center gap-3">
              <svg width="48" height="48" viewBox="0 0 64 64" className="animate-float">
                <defs>
                  <linearGradient id="boot-g" x1="0" x2="1" y1="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e"/>
                    <stop offset="100%" stopColor="#a855f7"/>
                  </linearGradient>
                </defs>
                <path d="M32 52 C32 34 20 24 14 20 C20 32 26 40 32 42 Z" fill="url(#boot-g)"/>
                <path d="M32 52 C32 34 44 24 50 20 C44 32 38 40 32 42 Z" fill="url(#boot-g)" opacity="0.85"/>
                <rect x="30" y="44" width="4" height="12" rx="1" fill="#4ade80"/>
              </svg>
              <div>
                <div className="font-display text-3xl font-bold tracking-tight">
                  <span className="text-white">VERDE</span>
                  <span className="tx-purple"> OS</span>
                </div>
                <div className="font-mono text-xs text-green-glow">plant · mission · control</div>
              </div>
            </div>
            <div className="w-[420px] font-mono text-[12px] leading-6">
              {LINES.slice(0, visible).map((l, i) => (
                <div key={i} className="boot-line" style={{ animationDelay: "0ms" }}>
                  <span className="tx-mute">{String(i + 1).padStart(2, "0")}</span>{" "}
                  <span className="tx-ok">{l.text.replace(/^> /, "")}</span>
                </div>
              ))}
              {visible < LINES.length && <span className="cursor tx-ok" />}
            </div>
            <div className="boot-bar">
              <div className="boot-bar-fill" />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
