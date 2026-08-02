"use client";
import { Cloud, RefreshCw } from "lucide-react";
import type { Weather } from "@/types";

export function WeatherCard({
  weather, icon, lastCheck, rainOverride, onRefresh, apiStatus, loading,
}: {
  weather: Weather | null;
  icon: string;
  lastCheck: string | null;
  rainOverride: number;
  onRefresh: () => void;
  apiStatus: string;
  loading: boolean;
}) {
  const rain = weather?.rain_expected || rainOverride === 1;
  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="flex items-center gap-2 font-mono text-xs font-bold tracking-widest uppercase text-sky">
          <Cloud className="w-3.5 h-3.5" /> Weather Auto-Override
        </h2>
        {rain && <span className="badge badge-red">☔ RAIN</span>}
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="text-5xl leading-none">{icon}</div>
        <div className="flex-1 min-w-[140px]">
          <div className="text-lg font-bold font-display">{weather?.city || "Delhi"} — {weather?.condition || "checking…"}</div>
          <div className="font-mono text-[11px] text-slate-400">
            humidity {weather?.humidity ?? "--"}% · wind {weather?.wind_speed ?? "--"} m/s
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold font-mono tabular-nums">
            {weather?.temp != null ? `${weather.temp}°C` : "--°"}
          </div>
          <div className="text-[10px] text-slate-400 font-mono">{weather?.description || "--"}</div>
        </div>
      </div>

      <div className={`mt-4 rounded-xl p-3 text-[12px] font-medium border ${
        rain
          ? "bg-red/10 border-red/30 text-red"
          : "bg-green/10 border-green/25 text-green-glow"
      }`}>
        {rain
          ? `☔ Rain detected (${weather?.description || "override active"}) — auto-watering suspended.`
          : "✅ Clear — watering allowed. Auto-checking every 10 minutes."}
      </div>

      <div className="mt-4 space-y-1">
        <Row label="🌧 Rain Override" sub="Auto-set when rain is forecast">
          <span className={`font-mono font-bold text-sm ${rain ? "text-red" : "text-green-glow"}`}>
            {rain ? "ON (auto)" : "OFF"}
          </span>
        </Row>
        <Row label="Last check" sub="Auto-refresh every 10 min">
          <span className="font-mono text-sm text-slate-300">{lastCheck || "--"}</span>
        </Row>
      </div>

      <button className="btn btn-green w-full mt-4 justify-center" onClick={onRefresh} disabled={loading}>
        <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        {loading ? "CHECKING…" : "CHECK WEATHER NOW"}
      </button>

      <div className="mt-2 font-mono text-[10px] text-slate-500 break-all">{apiStatus}</div>
    </div>
  );
}

function Row({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <div>
        <div className="text-[12px] text-slate-300">{label}</div>
        {sub && <div className="text-[10px] text-slate-500 font-mono">{sub}</div>}
      </div>
      {children}
    </div>
  );
}
