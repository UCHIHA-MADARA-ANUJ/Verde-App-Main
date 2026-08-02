"use client";
import { History, X, Leaf, Loader2, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { HistoryItem } from "@/types";
import { askGemini } from "@/lib/verde";
import type { Sensors, Controls } from "@/types";

export function HistoryGallery({
  history, sensors, controls,
}: {
  history: HistoryItem[];
  sensors: Sensors;
  controls: Controls;
}) {
  const [active, setActive] = useState<HistoryItem | null>(null);
  const [q, setQ] = useState("");
  const [msgs, setMsgs] = useState<{ who: "you" | "ai"; text: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight;
  }, [msgs, busy]);

  const open = (h: HistoryItem) => {
    setActive(h); setMsgs([]); setQ("");
  };
  const close = () => { setActive(null); setMsgs([]); setQ(""); };

  const ask = async () => {
    if (!q.trim() || !active || busy) return;
    const userQ = q.trim(); setQ("");
    setMsgs(m => [...m, { who: "you", text: userQ }]);
    setBusy(true);
    try {
      const ctx = active.result
        ? `Saved scan: ${active.result.name} (${active.result.prob}% conf)${active.result.disease ? `, issue: ${active.result.disease.name}` : ""}. Live telemetry now: moisture=${sensors.moisture}%, temp=${sensors.temperature}°C, humidity=${sensors.humidity}%.`
        : `Saved scan. Live telemetry now: moisture=${sensors.moisture}%, temp=${sensors.temperature}°C.`;
      const text = await askGemini({
        imageDataUrl: active.image.dataUrl,
        text: `${ctx}\n\nQuestion: ${userQ}`,
        system: "You are Verde AI. Reference both the saved scan and current live sensor data. Be concise (2-3 sentences).",
      });
      setMsgs(m => [...m, { who: "ai", text }]);
    } catch (e: any) {
      setMsgs(m => [...m, { who: "ai", text: "ERR: " + e.message }]);
    } finally { setBusy(false); }
  };

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="flex items-center gap-2 font-mono text-xs font-bold tracking-widest uppercase text-sky">
          <History className="w-3.5 h-3.5" /> Scan History
        </h2>
        <span className="badge badge-sky">{history.length} saved</span>
      </div>
      {history.length === 0 ? (
        <div className="text-center py-6 font-mono text-xs text-slate-600">
          No scans yet. Analyse a plant photo to save it here.
        </div>
      ) : (
        <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
          {history.map(h => (
            <div key={h.id} className="thumb" onClick={() => open(h)} title={h.result?.name || h.image.name}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={h.image.dataUrl} alt={h.image.name} />
              <div className="thumb-label">
                {h.result?.name?.slice(0, 14) || "?"}
                <span className="block text-[9px] text-green-glow">
                  {new Date(h.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={e => { if (e.target === e.currentTarget) close(); }}
          >
            <motion.div
              initial={{ y: 30, scale: 0.95, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 20, scale: 0.95, opacity: 0 }}
              className="modal-box"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display text-lg font-bold flex items-center gap-2">
                  <Leaf className="w-4 h-4 text-green-glow" />
                  {active.result?.name || "Plant Scan"}
                </h3>
                <button onClick={close} className="w-9 h-9 rounded-lg border border-border bg-card2 hover:bg-red/20 hover:border-red flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={active.image.dataUrl} alt="" className="w-full h-56 object-contain bg-black rounded-xl border border-border mb-3" />

              {active.result && (
                <div className="rounded-xl border border-green/30 bg-green/5 p-3 mb-3">
                  <div className="text-sm font-bold text-green-glow">
                    {active.result.name}
                    {active.result.common && <span className="text-slate-400 font-normal"> ({active.result.common})</span>}
                    <span className="ml-2 badge badge-green">{active.result.prob}%</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-1">
                    scanned {new Date(active.ts).toLocaleString()}
                  </div>
                  {active.result.disease && (
                    <div className={`mt-2 text-xs font-bold ${active.result.disease.name.toLowerCase().includes("healthy") ? "text-green-glow" : "text-red"}`}>
                      🩺 {active.result.disease.name} ({active.result.disease.prob}%)
                    </div>
                  )}
                  {active.result.disease?.treatment && (
                    <div className="mt-1 text-[11px] text-slate-300 leading-relaxed">
                      💊 {active.result.disease.treatment}
                    </div>
                  )}
                </div>
              )}

              <div ref={boxRef} className="terminal h-32 overflow-y-auto text-[11px] leading-relaxed mb-2">
                {msgs.length === 0 && (
                  <div className="text-slate-500">Ask Gemini questions about this saved scan.</div>
                )}
                {msgs.map((m, i) => (
                  <div key={i} className="terminal-entry mb-1">
                    {m.who === "you"
                      ? <div><span className="text-purple-glow font-bold">YOU ▸ </span>{m.text}</div>
                      : <div><span className="text-green-glow font-bold">AI ▸ </span><span className="text-green-glow/90 whitespace-pre-wrap">{m.text}</span></div>}
                  </div>
                ))}
                {busy && (
                  <div className="flex items-center gap-2 text-green-glow">
                    <Loader2 className="w-3 h-3 animate-spin" /> thinking<span className="animate-blink">▊</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <input className="input flex-1" placeholder="Ask about this saved scan…"
                  value={q} onChange={e => setQ(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") ask(); }} />
                <button className="btn btn-green" onClick={ask} disabled={busy || !q.trim()}>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
