"use client";
import { Droplets, Thermometer, Wind, Battery, Sun, Lightbulb, Zap, Upload, Activity, Gauge } from "lucide-react";
import { AnimatedNumber } from "./AnimatedNumber";
import { useVerdeStore } from "@/store/verde-store";
import { Card, CardHeader, CardTitle } from "./ui/Card";
import { Switch } from "./ui/Switch";
import { Badge } from "./ui/Badge";
import { setCtrl } from "@/lib/services";
import { sfx } from "@/lib/sound";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";
type TileDef = { key: string; label: string; suffix: string; icon: any; color: string; max: number; unit?: string };

const TILES: TileDef[] = [
  { key: "moisture", label: "Moisture", suffix: "%", icon: Droplets, color: "sky", max: 100 },
  { key: "temperature", label: "Temp", suffix: "°C", icon: Thermometer, color: "amber", max: 50 },
  { key: "humidity", label: "Humidity", suffix: "%", icon: Wind, color: "sky", max: 100 },
  { key: "tank_level", label: "Tank", suffix: "%", icon: Battery, color: "green", max: 100 },
  { key: "lux", label: "Lux", suffix: "", icon: Sun, color: "amber", max: 1000 },
  { key: "light", label: "Light", suffix: "", icon: Lightbulb, color: "purple", max: 100 },
  { key: "voltage_sag", label: "Volt", suffix: "V", icon: Zap, color: "green", max: 15 },
  { key: "uploads", label: "Uploads", suffix: "", icon: Upload, color: "purple", max: 100 },
];

export function TelemetryCard() {
  const sensors = useVerdeStore(s => s.sensors);
  const controls = useVerdeStore(s => s.controls);
  const tankCal = useVerdeStore(s => s.tankCalibration);
  const tankDisplayed = useVerdeStore(s => s.tankDisplayed);
  const setTankEmpty = useVerdeStore(s => s.setTankEmpty);
  const setTankFull = useVerdeStore(s => s.setTankFull);
  const resetTankCalibration = useVerdeStore(s => s.resetTankCalibration);
  const setControls = useVerdeStore(s => s.setControls);
  const log = useVerdeStore(s => s.log);
  const setApiStatus = useVerdeStore(s => s.setApiStatus);
  const pushNotification = useVerdeStore(s => s.pushNotification);

  const predict = useMemo(() => {
    const S = sensors;
    const C = controls;
    const m = S.moisture ?? 0;
    const rawTank = S.tank_level;
    const tank = tankDisplayed(rawTank) ?? 0;
    const tankTh = C.tank_threshold ?? 15;
    const moistTh = C.moisture_threshold ?? 35;
    const lightTh = C.light_threshold ?? 35;
    const luxPct = (S.lux ?? 0) / 10;
    const rain = C.weather_override === 1;
    let pumpOn = false, pumpReason = "", lightOn = false, lightReason = "";

    if (C.manual_mode) {
      pumpOn = !!C.pump_state && (tankTh === 0 || tank >= tankTh);
      pumpReason = "MANUAL" + (pumpOn ? " → ON 💦" : " → OFF") + (tank < tankTh && tankTh > 0 ? " · tank lock" : "");
    } else {
      pumpOn = m < moistTh && (tankTh === 0 || tank >= tankTh) && !rain;
      pumpReason = "AUTO" + (m < moistTh ? ` · dry (${m}%<${moistTh}%)` : ` · wet (${m}%)`) + (tank < tankTh && tankTh > 0 ? " · tank lock" : "") + (rain ? " · RAIN" : "");
    }

    const dark = luxPct < lightTh;
    if (C.light_manual_mode) {
      lightOn = !!C.grow_light_state;
      lightReason = "MANUAL";
    } else {
      lightOn = dark;
      lightReason = "AUTO" + (dark ? ` · dark (${Math.round(luxPct)}%<${lightTh}%)` : ` · bright (${Math.round(luxPct)}%)`);
    }

    return {
      pumpOn,
      pumpReason,
      lightOn,
      lightReason,
      mode: `pump:${C.manual_mode ? "MAN" : "AUTO"} · light:${C.light_manual_mode ? "MAN" : "AUTO"}`,
      tank,
    };
  }, [sensors, controls, tankDisplayed]);

  const doSetCtrl = async (k: string, v: any) => {
    sfx.toggle();
    log("info", "controls", `${k} = ${v}`);
    setControls({ [k]: v });
    try {
      await setCtrl(k, v);
      sfx.success();
    } catch(e:any) {
      log("err", "controls", `set failed: ${e.message}`);
      pushNotification({ level: "err", title: "Control failed", body: `${k}: ${e.message}` });
    }
  };

  // Sync controls state from fb periodically (already handled by polling hook)

  const getVal = (key: string): number => {
    if (key === "uploads") return sensors.successful_uploads ?? 0;
    if (key === "tank_level") {
      const cal = tankDisplayed(sensors.tank_level);
      return cal ?? 0;
    }
    const v = (sensors as any)[key];
    return typeof v === "number" ? v : 0;
  };
  const tankRawVal = typeof sensors.tank_level === "number" ? sensors.tank_level : null;
  const tankCalVal = tankDisplayed(tankRawVal);
  const colorClass = (c: string) => ({
    sky: "before:bg-sky text-sky", green: "before:bg-green text-green-glow",
    purple: "before:bg-purple text-purple-glow", amber: "before:bg-amber text-amber",
  } as any)[c] || "before:bg-slate-500 text-slate-300";

  const tileValueColor = (key: string, v: number) => {
    if (v === 0 && (sensors as any)[key] === undefined) return "text-slate-600";
    if (key === "moisture") return v < (controls.moisture_threshold ?? 35) ? "text-amber" : "text-green-glow";
    if (key === "tank_level") {
      const disp = tankCalVal ?? v;
      return disp < (controls.tank_threshold ?? 15) ? "text-red" : "text-green-glow";
    }
    if (key === "temperature") return v > 38 ? "text-red" : v < 10 ? "text-sky" : "text-white";
    if (key === "voltage_sag") return v < 4.2 ? "text-red" : v > 5.5 ? "text-red" : "text-green-glow";
    return "text-white";
  };

  return (
    <Card accent="green" scanlines>
      <CardHeader>
        <CardTitle icon={Activity} color="sky">Live ESP32 Telemetry</CardTitle>
        <Badge color="green" dot pulse>streaming</Badge>
      </CardHeader>

      <div className="grid grid-cols-4 gap-2.5 mb-5">
        {TILES.map(t => {
          const v = getVal(t.key);
          const Icon = t.icon;
          const pct = Math.min(100, (v / t.max) * 100);
          const valColor = tileValueColor(t.key, v);
          return (
            <div key={t.key} className={`tile ${colorClass(t.color)} relative`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-mono font-bold tracking-widest uppercase text-slate-400">{t.label}</span>
                <Icon className={`w-3 h-3 ${colorClass(t.color)}`} />
              </div>
              <div className={cn("text-xl font-mono font-bold tabular-nums", valColor)}>
                {t.key === "uploads" ? (
                  <>
                    <AnimatedNumber value={sensors.successful_uploads ?? 0} />
                    <span className="text-slate-600 text-sm">/{sensors.failed_uploads ?? 0}</span>
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
                  className={cn("h-full rounded-full transition-all duration-500",
                    t.color === "green" && "bg-gradient-to-r from-green to-green-glow",
                    t.color === "amber" && "bg-gradient-to-r from-amber to-yellow-300",
                    t.color === "purple" && "bg-gradient-to-r from-purple to-purple-glow",
                    t.color === "sky" && "bg-gradient-to-r from-sky to-cyan-300",
                  )}
                  style={{ width: `${isNaN(pct) ? 0 : pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Tank Calibration */}
      <div className="mt-2 rounded-xl border border-amber/30 bg-amber/5 p-3">
        <div className="flex items-center gap-2 mb-2">
          <Gauge className="w-3.5 h-3.5 text-amber" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-amber">
            🛢 Tank Calibration (app-side — no reflash)
          </span>
        </div>
        <div className="text-[11px] text-slate-300">
          Raw: <b className="font-mono text-white">{tankRawVal ?? "--"}%</b>
          {" → "}Displayed: <b className="font-mono text-green-glow">{tankCalVal != null ? Math.round(tankCalVal) + "%" : "--"}</b>
          {(tankCal.empty != null || tankCal.full != null) && (
            <span className="text-slate-500 font-mono ml-2">
              [empty:{tankCal.empty ?? "?"}% · full:{tankCal.full ?? "?"}%]
            </span>
          )}
        </div>
        <div className="flex gap-2 mt-2 flex-wrap">
          <button
            onClick={() => { if (tankRawVal != null) { setTankEmpty(tankRawVal); sfx.click(); log("info","calibration",`SET EMPTY @ raw ${tankRawVal}%`); pushNotification({level:"ok",title:"Tank empty point set",body:`Raw ${tankRawVal}% = 0%`});} }}
            className="text-[10px] font-mono font-bold px-2.5 py-1.5 rounded-md border border-red/40 bg-red/10 text-red hover:bg-red/20 transition">
            📉 SET EMPTY (0%)
          </button>
          <button
            onClick={() => { if (tankRawVal != null) { setTankFull(tankRawVal); sfx.click(); log("info","calibration",`SET FULL @ raw ${tankRawVal}%`); pushNotification({level:"ok",title:"Tank full point set",body:`Raw ${tankRawVal}% = 100%`});} }}
            className="text-[10px] font-mono font-bold px-2.5 py-1.5 rounded-md border border-green/40 bg-green/10 text-green-glow hover:bg-green/20 transition">
            📈 SET FULL (100%)
          </button>
          <button
            onClick={() => { resetTankCalibration(); sfx.toggle(); log("info","calibration","Tank calibration reset"); }}
            className="text-[10px] font-mono font-bold px-2.5 py-1.5 rounded-md border border-slate-600 bg-slate-800/40 text-slate-300 hover:bg-slate-700 transition">
            ↺ RESET
          </button>
        </div>
        <div className="text-[10px] text-amber/80 font-mono mt-1.5">
          Tip: empty bucket → SET EMPTY · fill to desired max → SET FULL. App remaps instantly.
        </div>
      </div>

      <div className="space-y-0.5">
        <CtrlRow label="Pump AUTO/MANUAL" sub="Toggle for manual control"
          checked={!!controls.manual_mode}
          onChange={v => doSetCtrl("manual_mode", v)} />
        <CtrlRow label="Pump State" sub="Only in MANUAL mode"
          checked={!!controls.pump_state} disabled={!controls.manual_mode}
          onChange={v => doSetCtrl("pump_state", v)} />
        <CtrlRow label="Light AUTO/MANUAL" sub="Toggle for manual control"
          checked={!!controls.light_manual_mode}
          onChange={v => doSetCtrl("light_manual_mode", v)} />
        <CtrlRow label="Grow Light" sub="Only in MANUAL mode"
          checked={!!controls.grow_light_state} disabled={!controls.light_manual_mode}
          onChange={v => doSetCtrl("grow_light_state", v)} />
        <CtrlRow label="☔ Rain Override" sub="Force-suspend watering"
          checked={controls.weather_override === 1}
          onChange={v => doSetCtrl("weather_override", v ? 1 : 0)} />
      </div>

      {/* Predictions */}
      <div className="mt-3 rounded-xl border border-border bg-[#0c0f16] p-3">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-3.5 h-3.5 text-purple-glow" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400">Actuator States (predicted)</span>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-1 font-mono text-sm">
          <span className={predict.pumpOn ? "text-sky" : "text-slate-500"}>pump {predict.pumpOn ? "ON 💦" : "OFF"}</span>
          <span className={predict.lightOn ? "text-purple-glow" : "text-slate-500"}>light {predict.lightOn ? "ON 💡" : "OFF"}</span>
          <span className="text-slate-400">{predict.mode}</span>
        </div>
        <div className="mt-1 font-mono text-[10px] text-slate-500">{predict.pumpReason} · {predict.lightReason}</div>
      </div>

      <div className="mt-4 space-y-3">
        <Threshold label="Moisture Threshold" hint="Auto-water below this" color="green"
          value={controls.moisture_threshold ?? 35} min={0} max={80} step={5} unit="%"
          onChange={v => doSetCtrl("moisture_threshold", v)} />
        <Threshold label="Tank Lock" hint="Stop pump below this (0=off)" color="red"
          value={controls.tank_threshold ?? 15} min={0} max={40} step={5} unit="%"
          onChange={v => doSetCtrl("tank_threshold", v)} />
        <Threshold label="Light Threshold" hint="LED on below this %" color="purple"
          value={controls.light_threshold ?? 35} min={0} max={90} step={5} unit="%"
          onChange={v => doSetCtrl("light_threshold", v)} />
      </div>
    </Card>
  );
}

function CtrlRow({ label, sub, checked, onChange, disabled }: {
  label: string; sub?: string; checked: boolean;
  onChange: (v: boolean) => void; disabled?: boolean;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-3 py-2.5 border-b border-border/50 last:border-0", disabled && "opacity-40")}>
      <div>
        <div className="text-[13px] font-medium text-slate-200">{label}</div>
        {sub && <div className="text-[10px] text-slate-500 font-mono">{sub}</div>}
      </div>
      <Switch checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  );
}

function Threshold({ label, hint, value, min, max, step, unit, color, onChange }: {
  label: string; hint: string; value: number; min: number; max: number; step: number;
  unit: string; color: "green" | "red" | "purple"; onChange: (v: number) => void;
}) {
  const accent = {
    green: "accent-green text-green-glow border-green/30 bg-green/15",
    red: "accent-red text-red border-red/30 bg-red/15",
    purple: "accent-purple text-purple-glow border-purple/30 bg-purple/15",
  }[color];
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[12px] text-slate-300">{label} <span className="text-slate-500 text-[10px]">({hint})</span></span>
        <span className={cn("badge border text-[11px]", accent)}>{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        className={cn("w-full", accent.split(" ")[0])}
        onChange={e => onChange(parseInt(e.target.value))} />
    </div>
  );
}
