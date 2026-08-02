"use client";
import { Brain, Send, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useVerdeStore } from "@/store/verde-store";
import { Card, CardHeader, CardTitle } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Input, Terminal } from "./ui/Terminal";
import { askGemini } from "@/lib/services";
import { sfx } from "@/lib/sound";

export function GeminiChat() {
  const [input, setInput] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);
  const msgs = useVerdeStore(s => s.geminiMsgs);
  const busy = useVerdeStore(s => s.geminiBusy);
  const currentImage = useVerdeStore(s => s.currentImage);
  const plantResult = useVerdeStore(s => s.plantResult);
  const sensors = useVerdeStore(s => s.sensors);
  const controls = useVerdeStore(s => s.controls);
  const tankDisplayed = useVerdeStore(s => s.tankDisplayed);
  const addMsg = useVerdeStore(s => s.addGeminiMsg);
  const setBusy = useVerdeStore(s => s.setGeminiBusy);
  const setApiStatus = useVerdeStore(s => s.setApiStatus);
  const log = useVerdeStore(s => s.log);

  useEffect(() => {
    if (boxRef.current) {
      const el = boxRef.current.closest(".terminal") as HTMLElement;
      if (el) el.scrollTop = el.scrollHeight;
    }
  }, [msgs, busy]);

  const submit = async () => {
    const q = input.trim();
    if (!q || busy) return;
    setInput("");
    sfx.click();
    addMsg({ who: "you", text: q, ts: Date.now() });
    setBusy(true);
    setApiStatus("gemini", "⏳ thinking…");
    try {
      const sys = "You are Verde AI, plant-care assistant. You can see the plant photo, Plant.id diagnosis (if available), and live ESP32 sensor data. Answer concisely, helpfully (2-4 sentences). Use numbers when relevant. Don't be robotic.";
      const tankCal = tankDisplayed(sensors.tank_level);
      const tankStr = tankCal != null ? `${Math.round(tankCal)}%` : `${sensors.tank_level ?? "?"}%`;
      const ctx = `Plant Doctor context: ${plantResult ? `${plantResult.name} (${plantResult.prob}% conf)${plantResult.disease ? `, issue: ${plantResult.disease.name}` : ""}.` : "No plant analysed yet."}
Live telemetry: moisture=${sensors.moisture}%, temp=${sensors.temperature}°C, humidity=${sensors.humidity}%, tank=${tankStr}, lux=${sensors.lux}, pump=${controls.pump_state}, mode=${controls.manual_mode?"MANUAL":"AUTO"}, thresholds: moisture=${controls.moisture_threshold}%, tank_lock=${controls.tank_threshold}%, light_threshold=${controls.light_threshold}%, rain_override=${controls.weather_override}.`;
      const text = await askGemini({
        imageDataUrls: currentImage ? [currentImage.dataUrl] : undefined,
        text: `${ctx}\n\nQuestion: ${q}`,
        system: sys,
      });
      addMsg({ who: "ai", text, ts: Date.now() });
      setApiStatus("gemini", "✅ responded");
      sfx.success();
    } catch(e:any) {
      addMsg({ who: "sys", text: `ERR: ${e.message}`, ts: Date.now() });
      setApiStatus("gemini", `❌ ${e.message.slice(0,40)}`);
      log("err", "gemini", e.message);
      sfx.error();
    } finally { setBusy(false); }
  };

  const quickQs = [
    "What disease might this be?",
    "How should I treat it?",
    "Is it getting enough light?",
    "When should I water it?",
  ];

  return (
    <Card accent="green">
      <CardHeader>
        <CardTitle icon={Brain} color="green">Gemini 2.0 Flash — Vision Chat</CardTitle>
        <Badge color={currentImage ? "green" : "amber"} dot={!!currentImage} pulse={!!currentImage}>
          {currentImage ? "👁 image loaded" : "no image"}
        </Badge>
      </CardHeader>

      <Terminal
        lines={msgs.map(m => ({ who: m.who as any, text: m.text, meta: m.meta }))}
        heightClass="h-52"
      />

      <div className="flex gap-2 mt-3">
        <Input value={input} onChange={e => setInput(e.target.value)}
          placeholder={currentImage ? "Ask about this plant photo…" : "Ask anything about plants, sensors, care…"}
          onKeyDown={e => { if (e.key === "Enter") submit(); }} />
        <Button variant="green" onClick={submit} disabled={busy || !input.trim()}>
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          ASK
        </Button>
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        {quickQs.map(q => (
          <button key={q}
            className="text-[10px] font-mono px-2 py-1 rounded-md border border-border text-slate-400 hover:border-green hover:text-green-glow transition"
            onClick={() => { setInput(q); setTimeout(submit, 50); }}>
            {q}
          </button>
        ))}
      </div>
    </Card>
  );
}
