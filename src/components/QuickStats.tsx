"use client";
import { Droplets, Thermometer, Leaf, Gauge, TrendingUp, Clock } from "lucide-react";
import { useVerdeStore } from "@/store/verde-store";
import { Card } from "./ui/Card";
import { AnimatedNumber } from "./AnimatedNumber";
import { formatDuration, formatRelative } from "@/lib/utils";

export function QuickStats() {
  const sensors = useVerdeStore(s => s.sensors);
  const plants = useVerdeStore(s => s.plants);
  const history = useVerdeStore(s => s.history);
  const weather = useVerdeStore(s => s.weather);
  const tankDisplayed = useVerdeStore(s => s.tankDisplayed);
  const tankTh = useVerdeStore(s => s.controls.tank_threshold ?? 15);
  const uptime = Date.now() - useVerdeStore(s => s.appLoadTime);
  const tankVal = tankDisplayed(sensors.tank_level) ?? 0;

  const stats = [
    {
      icon: Droplets, label: "Soil Moisture",
      value: sensors.moisture ?? 0, suffix: "%",
      sub: sensors.moisture != null ? (sensors.moisture < 35 ? "Needs water" : "Healthy") : "waiting for data…",
      color: sensors.moisture != null ? (sensors.moisture < 35 ? "amber" : "green") : "slate",
    },
    {
      icon: Thermometer, label: "Temperature",
      value: sensors.temperature ?? 0, suffix: "°C",
      sub: weather ? `${weather.condition} · ${weather.description}` : "Indoor sensor",
      color: sensors.temperature != null ? (sensors.temperature > 38 ? "red" : sensors.temperature < 10 ? "sky" : "green") : "slate",
    },
    {
      icon: Leaf, label: "Plants Tracked",
      value: plants.length, suffix: "",
      sub: history.length + " total scans",
      color: "green",
    },
    {
      icon: TrendingUp, label: "Scans Today",
      value: history.filter(h => Date.now() - h.ts < 86400000).length, suffix: "",
      sub: "Plant Doctor analyses",
      color: "purple",
    },
    {
      icon: Gauge, label: "Tank Level",
      value: tankVal, suffix: "%",
      sub: sensors.tank_level != null ? (tankVal < tankTh ? "Refill soon!" : "OK") : "no sensor",
      color: sensors.tank_level != null ? (tankVal < tankTh ? "red" : "sky") : "slate",
    },
    {
      icon: Clock, label: "Uptime",
      value: 0, suffix: "",
      sub: formatDuration(uptime),
      color: "slate",
      isDuration: true,
    },
  ];

  const colorMap: Record<string, string> = {
    green: "before:via-green/40 text-green-glow",
    amber: "before:via-amber/40 text-amber",
    red: "before:via-red/40 text-red",
    purple: "before:via-purple/40 text-purple-glow",
    sky: "before:via-sky/40 text-sky",
    slate: "before:via-slate-500/20 text-slate-300",
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {stats.map((s, i) => {
        const Icon = s.icon;
        return (
          <Card key={i} accent={s.color as any} hover className="p-4" scanlines>
            <div className="flex items-start justify-between mb-2">
              <div className={`w-8 h-8 rounded-lg bg-${s.color}/10 flex items-center justify-center ${
                s.color === "green" ? "text-green-glow" :
                s.color === "amber" ? "text-amber" :
                s.color === "red" ? "text-red" :
                s.color === "purple" ? "text-purple-glow" :
                s.color === "sky" ? "text-sky" : "text-slate-400"
              }`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1">{s.label}</div>
            <div className="font-mono font-bold text-2xl tabular-nums leading-none mb-1">
              {s.isDuration ? (
                <span className="text-lg">{formatDuration(uptime).split(" ")[0]}</span>
              ) : (
                <AnimatedNumber value={s.value} />
              )}
              <span className="text-sm text-slate-500 font-normal ml-0.5">{s.suffix}</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono truncate">{s.sub}</div>
          </Card>
        );
      })}
    </div>
  );
}
