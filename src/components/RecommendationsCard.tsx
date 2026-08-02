"use client";
import { Sparkles, Droplets, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { useVerdeStore } from "@/store/verde-store";
import { generateRecommendations } from "@/lib/care";
import { Card, CardHeader, CardTitle } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { setCtrl } from "@/lib/services";
import { useState } from "react";
import { sfx } from "@/lib/sound";
import { useRouter } from "next/navigation";

export function RecommendationsCard() {
  const sensors = useVerdeStore(s => s.sensors);
  const controls = useVerdeStore(s => s.controls);
  const weather = useVerdeStore(s => s.weather);
  const plants = useVerdeStore(s => s.plants);
  const waterPlant = useVerdeStore(s => s.waterPlant);
  const setControls = useVerdeStore(s => s.setControls);
  const log = useVerdeStore(s => s.log);
  const pushNotification = useVerdeStore(s => s.pushNotification);
  const recs = generateRecommendations(sensors, controls, weather, plants).slice(0,6);
  const router = useRouter();
  const [actingId, setActingId] = useState<string | null>(null);

  const iconFor = (level: string) => level === "err" ? AlertTriangle : level === "warn" ? Droplets : level === "ok" ? CheckCircle : Info;
  const colorFor = (level: string) => level === "err" ? "red" : level === "warn" ? "amber" : level === "ok" ? "green" : "sky";

  const doAction = async (rec: any) => {
    if (!rec.action) return;
    setActingId(rec.id);
    sfx.click();
    try {
      if (rec.action.key === "pump_on") {
        await setCtrl("pump_state", true);
        setControls({ pump_state: true });
        log("ok","care","Pump turned ON via recommendation");
        sfx.water();
        pushNotification({ level:"ok", title:"Pump activated", body:"Watering started." });
      } else if (rec.action.key === "water_plant") {
        waterPlant(rec.action.payload);
        sfx.water();
        pushNotification({ level:"ok", title:"Plant watered", body:"Marked as watered." });
      }
    } catch(e:any) {
      log("err","care",`Action failed: ${e.message}`);
      sfx.error();
    } finally { setActingId(null); }
  };

  return (
    <Card accent="green">
      <CardHeader>
        <CardTitle icon={Sparkles} color="green">AI Care Recommendations</CardTitle>
        <Badge color={recs.some(r => r.level === "err") ? "red" : recs.some(r => r.level === "warn") ? "amber" : "green"} dot pulse={recs.some(r=>r.level==="err")}>
          {recs.filter(r => r.level === "err").length > 0 ? `${recs.filter(r=>r.level==="err").length} urgent` : recs.some(r=>r.level==="warn") ? "needs attention" : "all good"}
        </Badge>
      </CardHeader>
      <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
        {recs.length === 0 && (
          <div className="text-center py-8 font-mono text-xs text-slate-600">Waiting for sensor data to generate recommendations…</div>
        )}
        {recs.map(r => {
          const Ic = iconFor(r.level);
          const c = colorFor(r.level);
          return (
            <div key={r.id} className={`p-3 rounded-lg border bg-black/30 flex items-start gap-3 ${
              c === "red" ? "border-red/30" : c === "amber" ? "border-amber/30" : c === "green" ? "border-green/20" : "border-sky/20"
            }`}>
              <div className={`mt-0.5 text-xl ${c==="red"?"text-red":c==="amber"?"text-amber":c==="green"?"text-green-glow":"text-sky"}`}>{r.icon}</div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-bold flex items-center gap-2 ${
                  c==="red"?"text-red":c==="amber"?"text-amber":c==="green"?"text-green-glow":"text-sky"
                }`}>
                  <Ic className="w-3.5 h-3.5" />{r.title}
                </div>
                <div className="text-[11px] text-slate-400 leading-relaxed mt-0.5">{r.body}</div>
                {r.action && (
                  <Button size="xs" variant={c === "red" ? "red" : c === "amber" ? "amber" : "green"}
                    className="mt-2" onClick={() => doAction(r)} disabled={actingId===r.id} noSfx>
                    {actingId===r.id ? "…" : r.action.label}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
