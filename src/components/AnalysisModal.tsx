"use client";
import { Leaf, Send, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useVerdeStore } from "@/store/verde-store";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { Input, Terminal } from "./ui/Terminal";
import { askGemini } from "@/lib/services";
import { sfx } from "@/lib/sound";
import { cn } from "@/lib/utils";

interface Msg { who: "you" | "ai" | "sys"; text: string; }

export function AnalysisModal() {
  const open = useVerdeStore(s => s.modalOpen.type === "analysis");
  const data = useVerdeStore(s => s.modalOpen.data);
  const close = useVerdeStore(s => s.closeModal);
  const sensors = useVerdeStore(s => s.sensors);
  const controls = useVerdeStore(s => s.controls);
  const log = useVerdeStore(s => s.log);
  const setApiStatus = useVerdeStore(s => s.setApiStatus);

  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const initRef = useRef(false);

  const image: any = data?.image;
  const result: any = data?.result;

  // Reset chat when a new analysis opens
  useEffect(() => {
    if (open && !initRef.current) {
      initRef.current = true;
      setMsgs([{
        who: "sys",
        text: "VERDE AI — I can see this plant photo, the diagnosis above, and your live sensors. Ask follow-ups: disease?, treatment?, watering?, light?",
      }]);
    }
    if (!open) { initRef.current = false; setMsgs([]); setInput(""); setBusy(false); }
  }, [open]);

  const ask = async () => {
    const q = input.trim();
    if (!q || busy || !image) return;
    setInput("");
    setMsgs(m => [...m, { who: "you", text: q }]);
    setBusy(true);
    try {
      const ctx = `Analysis: ${result ? `${result.name} (${result.prob}% conf)${result.disease ? ` · disease: ${result.disease.name}` : ""}` : "pending"}.
Live telemetry: moisture=${sensors.moisture}%, temp=${sensors.temperature}°C, humidity=${sensors.humidity}%, tank=${sensors.tank_level}%, lux=${sensors.lux}, pump=${controls.pump_state}, mode=${controls.manual_mode?"MANUAL":"AUTO"}.`;
      const text = await askGemini({
        imageDataUrls: [image.dataUrl],
        text: `${ctx}\n\nQuestion about THIS plant photo: ${q}`,
        system: "You are Verde AI looking at a specific plant photo the user just analysed. Be concise (2-4 sentences). Reference what you see in the image.",
      });
      setMsgs(m => [...m, { who: "ai", text }]);
      sfx.success();
    } catch(e: any) {
      setMsgs(m => [...m, { who: "sys", text: "ERR: " + e.message }]);
      log("err", "gemini", e.message);
      sfx.error();
    } finally { setBusy(false); }
  };

  const rotCam = image?.source === "cam"; // ESP32 cam is mounted upside-down

  return (
    <Modal open={open} onClose={close} size="lg" title={
      <span className="flex items-center gap-2">
        <Leaf className="w-4 h-4 text-green-glow" />
        Plant Analysis
        {image?.source === "cam" && <Badge color="purple">CAM</Badge>}
        {image?.source === "user" && <Badge color="sky">UPLOAD</Badge>}
        {image?.source === "device" && <Badge color="amber">DEVICE</Badge>}
      </span>
    }>
      {image && (
        <div className="space-y-4">
          {/* Image */}
          <div className="relative w-full max-h-72 bg-black rounded-xl border border-border overflow-hidden flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.dataUrl}
              alt="analysis"
              className={cn("max-h-72 w-full object-contain", rotCam && "rotate-180")}
            />
            {rotCam && (
              <span className="absolute top-2 right-2 text-[9px] font-mono px-2 py-0.5 bg-purple/20 text-purple-glow border border-purple/40 rounded">
                ESP32-CAM (rotated)
              </span>
            )}
          </div>

          {/* Result */}
          {result ? (
            <div className="rounded-xl border border-green/30 bg-green/5 p-4">
              <div className="text-sm font-bold text-green-glow flex flex-wrap items-center gap-2">
                {result.name}
                {result.common && <span className="text-slate-400 font-normal">({result.common})</span>}
                <Badge color="green">{result.prob}%</Badge>
              </div>
              {result.wiki?.description && (
                <div className="mt-2 text-xs text-slate-300 leading-relaxed">
                  {result.wiki.description.slice(0, 400)}{result.wiki.description.length > 400 ? "…" : ""}
                </div>
              )}
              {result.wiki?.url && (
                <a href={result.wiki.url} target="_blank" rel="noreferrer"
                  className="mt-2 inline-block text-[10px] font-mono text-sky hover:underline">
                  Wikipedia ↗
                </a>
              )}
              {result.disease && (
                <div className={`mt-3 rounded-lg p-3 border ${
                  /healthy/i.test(result.disease.name)
                    ? "border-green/30 bg-green/10 text-green-glow"
                    : result.disease.severity === "high"
                    ? "border-red/40 bg-red/10 text-red"
                    : result.disease.severity === "medium"
                    ? "border-amber/40 bg-amber/10 text-amber"
                    : "border-slate-700 bg-slate-800/30 text-slate-200"
                }`}>
                  <div className="text-xs font-bold flex items-center gap-2">
                    🩺 {result.disease.name}
                    <span className="font-mono text-slate-400">{result.disease.prob}%</span>
                    {result.disease.severity && (
                      <Badge color={result.disease.severity==="high"?"red":result.disease.severity==="medium"?"amber":"green"}>
                        {result.disease.severity}
                      </Badge>
                    )}
                  </div>
                  {result.disease.treatment && (
                    <div className="mt-1 text-[11px] leading-relaxed">💊 {result.disease.treatment}</div>
                  )}
                  {result.disease.prevention?.[0] && (
                    <div className="mt-1 text-[11px] text-slate-300 leading-relaxed">
                      🛡 Prevention: {result.disease.prevention[0].slice(0, 200)}
                    </div>
                  )}
                </div>
              )}
              {result.watering && (result.watering.min_freq_days != null || result.watering.max_freq_days != null) && (
                <div className="mt-2 text-[11px] text-sky font-mono">
                  💧 Water every {result.watering.min_freq_days ?? "?"}–{result.watering.max_freq_days ?? "?"} days
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-amber/30 bg-amber/5 p-4 text-amber font-mono text-xs">
              ⏳ Analysis pending or no crop identification found.
            </div>
          )}

          {/* Chat */}
          <Terminal
            lines={msgs.map(m => ({ who: m.who as any, text: m.text }))}
            heightClass="h-36"
          />
          <div className="flex gap-2">
            <Input value={input} onChange={e => setInput(e.target.value)}
              placeholder="Ask about THIS plant photo…"
              onKeyDown={e => { if (e.key === "Enter") ask(); }} />
            <Button variant="green" onClick={ask} disabled={busy || !input.trim()}>
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              ASK
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {["What disease is this?", "How do I treat it?", "Should I water?", "Is it getting enough light?"].map(q => (
              <button key={q} onClick={() => { setInput(q); setTimeout(ask, 50); }}
                className="text-[10px] font-mono px-2 py-1 rounded-md border border-border text-slate-400 hover:border-green hover:text-green-glow transition">
                {q}
              </button>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}
