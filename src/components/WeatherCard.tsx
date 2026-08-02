"use client";
import { Cloud, RefreshCw } from "lucide-react";
import { useVerdeStore } from "@/store/verde-store";
import { Card, CardHeader, CardTitle } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { sfx } from "@/lib/sound";
import { fetchWeather, fetchForecast, fbPatch } from "@/lib/services";
import { useEffect, useState } from "react";

export function WeatherCard() {
  const weather = useVerdeStore(s => s.weather);
  const icon = useVerdeStore(s => s.weatherIcon);
  const lastCheck = useVerdeStore(s => s.lastWeatherCheck);
  const controls = useVerdeStore(s => s.controls);
  const city = useVerdeStore(s => s.settings.city);
  const weatherIntervalMin = useVerdeStore(s => s.settings.weatherIntervalMinutes);
  const setWeather = useVerdeStore(s => s.setWeather);
  const setLastWeatherCheck = useVerdeStore(s => s.setLastWeatherCheck);
  const setControls = useVerdeStore(s => s.setControls);
  const setApiStatus = useVerdeStore(s => s.setApiStatus);
  const log = useVerdeStore(s => s.log);
  const pushNotification = useVerdeStore(s => s.pushNotification);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState<number>(weatherIntervalMin * 60);

  // Countdown tick
  useEffect(() => {
    const t = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  // Reset countdown when weather is refreshed
  useEffect(() => {
    if (lastCheck) setCountdown(weatherIntervalMin * 60);
  }, [lastCheck, weatherIntervalMin]);
  const cdMin = Math.floor(countdown/60);
  const cdSec = countdown % 60;
  const cdStr = `${cdMin}:${cdSec.toString().padStart(2,"0")}`;

  const refresh = async () => {
    sfx.click(); setLoading(true);
    setApiStatus("weather", "⏳ checking…");
    try {
      const { state, icon: ic, rainExpected } = await fetchWeather(city);
      setWeather(state as any, ic);
      setLastWeatherCheck(new Date().toLocaleTimeString([], { hour12: false }));
      setApiStatus("weather", `✅ ${state.temp}°C ${state.description}`);
      if (useVerdeStore.getState().settings.enableRainOverride) {
        await fbPatch("/controls", { weather_override: rainExpected ? 1 : 0 });
        setControls({ weather_override: rainExpected ? 1 : 0 });
      }
      // forecast
      try {
        const fc = await fetchForecast(city, 8);
        setWeather({ ...state, forecast: fc } as any, ic);
      } catch {}
      log("ok", "weather", `${state.city} ${state.temp}°C ${state.description}, rain=${rainExpected}`);
      sfx.success();
    } catch(e:any) {
      setApiStatus("weather", `❌ ${e.message.slice(0,60)}`);
      log("err", "weather", e.message);
      pushNotification({ level: "err", title: "Weather error", body: e.message });
    } finally { setLoading(false); }
  };

  const rain = weather?.rain_expected || controls.weather_override === 1;

  return (
    <Card accent="sky">
      <CardHeader>
        <CardTitle icon={Cloud} color="sky">Weather Auto-Override</CardTitle>
        {rain && <Badge color="red">☔ RAIN</Badge>}
      </CardHeader>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="text-5xl leading-none">{icon}</div>
        <div className="flex-1 min-w-[140px]">
          <div className="text-lg font-bold font-display">{weather?.city || city} — {weather?.condition || "checking…"}</div>
          <div className="font-mono text-[11px] text-slate-400">
            humidity {weather?.humidity ?? "--"}% · wind {weather?.wind_speed ?? "--"} m/s
            {weather?.feels_like != null && ` · feels ${weather.feels_like}°C`}
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold font-mono tabular-nums">{weather?.temp != null ? `${weather.temp}°C` : "--°"}</div>
          <div className="text-[10px] text-slate-400 font-mono">{weather?.description || "--"}</div>
        </div>
      </div>

      {weather?.forecast && (
        <div className="mt-4 grid grid-cols-8 gap-1.5">
          {weather.forecast.slice(0,8).map((f:any, i:number) => (
            <div key={i} className="rounded-lg bg-black/40 border border-border p-1.5 text-center">
              <div className="text-[9px] font-mono text-slate-500">{new Date(f.dt).getHours()}:00</div>
              <div className="text-base">{f.icon}</div>
              <div className="text-[10px] font-mono font-bold">{f.temp}°</div>
              {f.rain_prob > 20 && <div className="text-[9px] font-mono text-sky">{f.rain_prob}%</div>}
            </div>
          ))}
        </div>
      )}

      <div className={`mt-4 rounded-xl p-3 text-[12px] font-medium border ${
        rain ? "bg-red/10 border-red/30 text-red" : "bg-green/10 border-green/25 text-green-glow"
      }`}>
        {rain
          ? `☔ Rain detected (${weather?.description || "override active"}) — auto-watering suspended.`
          : `✅ Clear — watering allowed. Auto-checking every ${weatherIntervalMin} minutes.`}
      </div>

      <div className="mt-4 space-y-1">
        <Row label="🌧 Rain Override" sub="Auto-set when rain is forecast">
          <span className={`font-mono font-bold text-sm ${rain ? "text-red" : "text-green-glow"}`}>{rain ? "ON (auto)" : "OFF"}</span>
        </Row>
        <Row label="Last check" sub="Auto-refresh on interval">
          <span className="font-mono text-sm text-slate-300">{lastCheck || "--"}</span>
        </Row>
        <Row label="Next auto-check" sub="countdown">
          <span className="font-mono text-sm text-sky tabular-nums">{cdStr}</span>
        </Row>
      </div>

      <Button variant="green" className="w-full mt-4 justify-center" onClick={refresh} disabled={loading}>
        <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        {loading ? "CHECKING…" : "🔍 CHECK WEATHER NOW"}
      </Button>

      <div className="mt-2 font-mono text-[10px] text-slate-500 break-all">
        sunrise {weather?.sunrise ? new Date(weather.sunrise*1000).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit",hour12:false}) : "--"} · sunset {weather?.sunset ? new Date(weather.sunset*1000).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit",hour12:false}) : "--"}
      </div>
    </Card>
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
