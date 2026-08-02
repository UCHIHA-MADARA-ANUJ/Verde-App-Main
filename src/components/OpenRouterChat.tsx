"use client";
import { Bot, Send, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useVerdeStore } from "@/store/verde-store";
import { Card, CardHeader, CardTitle } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Input, Terminal } from "./ui/Terminal";
import { askOpenRouter } from "@/lib/services";
import { sfx } from "@/lib/sound";

export function OpenRouterChat() {
  const [input, setInput] = useState("");
  const msgs = useVerdeStore(s => s.orMsgs);
  const busy = useVerdeStore(s => s.orBusy);
  const activeModel = useVerdeStore(s => s.orActiveModel);
  const sensors = useVerdeStore(s => s.sensors);
  const controls = useVerdeStore(s => s.controls);
  const weather = useVerdeStore(s => s.weather);
  const lastWeatherCheck = useVerdeStore(s => s.lastWeatherCheck);
  const addMsg = useVerdeStore(s => s.addOrMsg);
  const setBusy = useVerdeStore(s => s.setOrBusy);
  const setActiveModel = useVerdeStore(s => s.setOrActiveModel);
  const setApiStatus = useVerdeStore(s => s.setApiStatus);
  const log = useVerdeStore(s => s.log);

  const submit = async (qOverride?: string) => {
    const q = (qOverride ?? input).trim();
    if (!q || busy) return;
    if (!qOverride) setInput("");
    sfx.click();
    addMsg({ who: "you", text: q, ts: Date.now() });
    setBusy(true);
    setApiStatus("router", "⏳ thinking…");

    const rain = weather?.rain_expected ? "RAIN DETECTED — watering suspended" : "clear";
    const sys = "You are Verde AI, assistant for Project Verde — a smart plant irrigation system. You have live ESP32 telemetry and controls. Be concise, accurate, conversational (2-4 sentences). Use the sensor numbers. If data is missing say so.";
    const ctx = `LIVE SYSTEM (weather: ${rain}, last check ${lastWeatherCheck || "none"}, ${weather?.description || "n/a"} ${weather?.temp != null ? weather.temp+"°C" : ""}):
sensors: ${JSON.stringify(sensors)}
controls: ${JSON.stringify(controls)}
Interpretation: moisture ${sensors.moisture??"?"}% (auto-water below ${controls.moisture_threshold??35}%), tank ${sensors.tank_level??"?"}% (lock below ${controls.tank_threshold??15}%, 0=off), temp ${sensors.temperature??"?"}°C, humidity ${sensors.humidity??"?"}%, lux ${sensors.lux??"?"}, pump ${controls.manual_mode?"MANUAL":"AUTO"}, pump ${controls.pump_state?"ON":"OFF"}, light ${controls.light_manual_mode?"MANUAL":"AUTO"}, grow-light ${controls.grow_light_state?"ON":"OFF"}, rain-override ${controls.weather_override===1?"ACTIVE":"off"}.`;

    try {
      const { text, model } = await askOpenRouter({
        messages: [
          { role: "system", content: sys },
          { role: "user", content: `${ctx}\n\nQuestion: ${q}` },
        ],
      });
      addMsg({ who: "ai", text, meta: model.split("/")[0], ts: Date.now() });
      setActiveModel(model);
      setApiStatus("router", `✅ via ${model.split("/")[0]}`);
      sfx.success();
    } catch(e:any) {
      addMsg({ who: "sys", text: `ERR: ${e.message}`, ts: Date.now() });
      setApiStatus("router", `❌ ${e.message.slice(0,50)}`);
      log("err", "openrouter", e.message);
      sfx.error();
    } finally { setBusy(false); }
  };

  const quick = [
    "What is the current soil moisture and is it healthy?",
    "Should I water the plant right now? Use the thresholds.",
    "Is the reservoir tank safe? What if it empties?",
    "Summarize whole system status for a judge.",
  ];

  return (
    <Card accent="purple">
      <CardHeader>
        <CardTitle icon={Bot} color="purple">Sensor-Aware Chat (OpenRouter · free models)</CardTitle>
        {activeModel && <Badge color="purple">{activeModel.split("/")[0]}</Badge>}
      </CardHeader>

      <Terminal
        lines={msgs.map(m => ({ who: m.who as any, text: m.text, meta: m.meta }))}
        heightClass="h-44"
      />

      <div className="flex flex-wrap gap-1.5 mt-3">
        {quick.map(q => (
          <button key={q} onClick={() => submit(q)}
            className="text-[10px] font-mono px-2 py-1 rounded-md border border-border text-slate-400 hover:border-purple hover:text-purple-glow transition">
            {q}
          </button>
        ))}
      </div>

      <div className="flex gap-2 mt-3">
        <Input value={input} onChange={e => setInput(e.target.value)}
          placeholder="Ask about live sensors, watering, tank, pump logic…"
          onKeyDown={e => { if (e.key === "Enter") submit(); }} />
        <Button variant="purple" onClick={() => submit()} disabled={busy || !input.trim()}>
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          ASK
        </Button>
      </div>
    </Card>
  );
}
