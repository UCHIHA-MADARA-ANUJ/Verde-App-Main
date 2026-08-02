"use client";
import { Droplets, Thermometer, Wind, Battery, Sun, Lightbulb, Zap, Upload, Activity } from "lucide-react";
import { AnimatedNumber } from "./AnimatedNumber";
import type { Sensors, Controls } from "@/types";

const TILES = [
  { key: "moisture", label: "Moisture", suffix: "%", icon: Droplets, color: "sky", max: 100, good: [35, 80] },
  { key: "temperature", label: "Temp", suffix: "°C", icon: Thermometer, color: "amber", max: 50, good: [18, 32] },
  { key: "humidity", label: "Humidity", suffix: "%", icon: Wind, color: "sky", max: 100, good: [40, 80] },
  { key: "tank_level", label: "Tank", suffix: "%", icon: Battery, color: "green", max: 100, good: [20, 100] },
  { key: "lux", label: "Lux", suffix: "", icon: Sun, color: "amber", max: 1000, good: [200, 800] },
  { key: "light", label: "Light", suffix: "", icon: Lightbulb, color: "purple", max: 100, good: [30, 100] },
  { key: "voltage_sag", label: "Volt", suffix: "V", icon: Zap, color: "green", max: 15, good: [4.5, 5.5] },
  { key: "uploads", label: "Uploads", suffix: "", icon: Upload, color: "purple", max: 100, good: [0, 10000], composite: true },
] as const;

export function TelemetryCard({
  sensors, controls, predict, onCtrl,
}: {
  sensors: Sensors;
  controls: Controls;
  predict: any;
  onCtrl: (k: string, v: any) => void;
}) {
  function getVal(key: string): number {
    if (key === "uploads") return (sensors.successful_uploads ?? 0);
    const v = (sensors as any)[key];
    return typeof v === "number" ? v : 0;
  }
  function colorForGood(v: number, good: [number, number], max: number) {
    if (v === 0 && good[0] > 0) return "text-slate-600";
    if (v < good[0] || v > good[1]) return "text-red";
    return "";
  }

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="flex items-center gap-2 font-mono text-xs font-bold tracking-widest uppercase text-sky">
          <Activity className="w-3.5 h-3.5" /> Live ESP32 Telemetry
        </h2>
        <span className="badge badge-green"><span className="live-dot" /> streaming</span>
      </div>

      <div className="grid grid-cols-4 gap-2.5 mb-5">
        {TILES.map((t: any) => {
          const v = getVal(t.key as string);
          const Icon = t.icon;
          const pct = Math.min(100, (v / t.max) * 100);
          const colorClass = t.composite ? "" : colorForGood(v, t.good as [number, number], t.max);
          return (
            <div key={t.key as string} className={`tile ${t.color}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-mono font-bold tracking-widest uppercase text-slate-400">{t.label}</span>
                <Icon className={`w-3 h-3 ${t.color === "green" ? "text-green-glow" : t.color === "amber" ? "text-amber" : t.color === "purple" ? "text-purple-glow" : t.color === "sky" ? "text-sky" : ""}`} />
              </div>
              <div className={`text-xl font-mono font-bold tabular-nums ${colorClass || "text-white"}`}>
                {t.key === "uploads" ? (
                  <>
                    <AnimatedNumber value={sensors.successful_uploads ?? 0} />
                    <span className="text-slate-500 text-sm">/{sensors.failed_uploads ?? 0}</span>
                  </>
                ) : (
                  <>
                    <AnimatedNumber value={v} decimals={t.key === "voltage_sag" ? 1 : 0} />
                    <span className="text-slate-500 text-sm">{t.suffix}</span>
                  </>
                )}
              </div>
              <div className="mt-2 h-1 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    t.color === "green" ? "bg-gradient-to-r from-green to-green-glow" :
                    t.color === "amber" ? "bg-gradient-to-r from-amber to-yellow-300" :
                    t.color === "purple" ? "bg-gradient-to-r from-purple to-purple-glow" :
                    t.color === "sky" ? "bg-gradient-to-r from-sky to-cyan-300" : ""
                  }`}
                  style={{ width: `${isNaN(pct) ? 0 : pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Controls rows */}
      <div className="space-y-0.5">
        <CtrlRow label="Pump AUTO/MANUAL" sub="Toggle to take manual control"
          checked={!!controls.manual_mode}
          onChange={v => onCtrl("manual_mode", v)} />
        <CtrlRow label="Pump State" sub="Only in MANUAL mode"
          checked={!!controls.pump_state} disabled={!controls.manual_mode}
          onChange={v => onCtrl("pump_state", v)} />
        <CtrlRow label="Light AUTO/MANUAL" sub="Toggle to take manual control"
          checked={!!controls.light_manual_mode}
          onChange={v => onCtrl("light_manual_mode", v)} />
        <CtrlRow label="Grow Light" sub="Only in MANUAL mode"
          checked={!!controls.grow_light_state} disabled={!controls.light_manual_mode}
          onChange={v => onCtrl("grow_light_state", v)} />
        <CtrlRow label="☔ Rain Override" sub="Force-suspend watering"
          checked={controls.weather_override === 1}
          onChange={v => onCtrl("weather_override", v ? 1 : 0)} />
      </div>

      {/* Predictions */}
      <div className="mt-3 rounded-xl border border-border bg-card2 p-3">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-3.5 h-3.5 text-purple-glow" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400">Actuator States (predicted)</span>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-1 font-mono text-sm">
          <span className={predict?.pumpOn ? "text-sky glow-purple" : "text-slate-500"}>
            pump {predict?.pumpOn ? "ON 💦" : "OFF"}
          </span>
          <span className={predict?.lightOn ? "text-purple-glow glow-purple" : "text-slate-500"}>
            light {predict?.lightOn ? "ON 💡" : "OFF"}
          </span>
          <span className="text-slate-400">{predict?.mode}</span>
        </div>
        <div className="mt-1 font-mono text-[10px] text-slate-500">{predict?.pumpReason} · {predict?.lightReason}</div>
      </div>

      {/* Threshold sliders */}
      <div className="mt-4 space-y-3">
        <Threshold label="Moisture Threshold" hint="Auto-water below this" color="green"
          value={controls.moisture_threshold ?? 35} min={0} max={80} step={5} unit="%"
          onChange={v => { onCtrl("moisture_threshold", v); }} />
        <Threshold label="Tank Lock" hint="Stop pump below this (0=off)" color="red"
          value={controls.tank_threshold ?? 15} min={0} max={40} step={5} unit="%"
          onChange={v => { onCtrl("tank_threshold", v); }} />
        <Threshold label="Light Threshold" hint="LED on below this %" color="purple"
          value={controls.light_threshold ?? 35} min={0} max={90} step={5} unit="%"
          onChange={v => { onCtrl("light_threshold", v); }} />
      </div>
    </div>
  );
}

function CtrlRow({ label, sub, checked, onChange, disabled }: {
  label: string; sub?: string; checked: boolean;
  onChange: (v: boolean) => void; disabled?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between gap-3 py-2.5 border-b border-border/50 last:border-0 ${disabled ? "opacity-50" : ""}`}>
      <div>
        <div className="text-[13px] font-medium text-slate-200">{label}</div>
        {sub && <div className="text-[10px] text-slate-500 font-mono">{sub}</div>}
      </div>
      <label className="switch">
        <input type="checkbox" checked={checked} disabled={disabled}
          onChange={e => onChange(e.target.checked)} />
        <span className="slider" />
      </label>
    </div>
  );
}

function Threshold({ label, hint, value, min, max, step, unit, color, onChange }: {
  label: string; hint: string; value: number; min: number; max: number; step: number;
  unit: string; color: "green" | "red" | "purple";
  onChange: (v: number) => void;
}) {
  const accent = {
    green: { track: "accent-green", badge: "bg-green/15 text-green-glow border-green/30" },
    red: { track: "accent-red", badge: "bg-red/15 text-red border-red/30" },
    purple: { track: "accent-purple", badge: "bg-purple/15 text-purple-glow border-purple/30" },
  }[color];
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[12px] text-slate-300">{label} <span className="text-slate-500 text-[10px]">({hint})</span></span>
        <span className={`badge border ${accent.badge} text-[11px]`}>{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        className={`w-full ${accent.track}`}
        onChange={e => onChange(parseInt(e.target.value))} />
    </div>
  );
}
