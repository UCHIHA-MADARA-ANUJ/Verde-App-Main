"use client";
// ============================================================================
// Master data hook: polls Firebase, weather, tracks sensor history, pushes alerts,
// syncs state into the Zustand store. Should be mounted once at app root.
// ============================================================================
import { useEffect, useRef } from "react";
import { useVerdeStore } from "@/store/verde-store";
import { fbGet, fbPatch, fetchWeather, fetchForecast } from "@/lib/services";
import { sfx } from "@/lib/sound";
import { notify, requestNotifyPermission } from "@/lib/notify";
import type { Sensors, Controls, Weather, SensorHistoryPoint } from "@/types";

const LAST_ALERT: Record<string, number> = {};
const cooldown = (key: string, ms = 60000) => {
  const now = Date.now();
  if (LAST_ALERT[key] && now - LAST_ALERT[key] < ms) return false;
  LAST_ALERT[key] = now; return true;
};

export function useVerdeData() {
  const pollTimer = useRef<any>(null);
  const wTimer = useRef<any>(null);
  const mounted = useRef(false);

  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;
    const store = useVerdeStore.getState();

    // Initial weather fetch
    doWeather();
    wTimer.current = setInterval(doWeather, store.settings.weatherIntervalMinutes * 60 * 1000);

    // Poll Firebase
    pollFirebase();
    pollTimer.current = setInterval(pollFirebase, store.settings.pollIntervalMs);

    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
      if (wTimer.current) clearInterval(wTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When settings change, restart intervals
  useEffect(() => {
    const unsub = useVerdeStore.subscribe((s, prev) => {
      if (s.settings.pollIntervalMs !== prev.settings.pollIntervalMs) {
        if (pollTimer.current) clearInterval(pollTimer.current);
        pollTimer.current = setInterval(pollFirebase, s.settings.pollIntervalMs);
      }
      if (s.settings.weatherIntervalMinutes !== prev.settings.weatherIntervalMinutes) {
        if (wTimer.current) clearInterval(wTimer.current);
        wTimer.current = setInterval(doWeather, s.settings.weatherIntervalMinutes * 60 * 1000);
      }
    });
    return unsub;
  }, []);

  return null;
}

// ---- Poll Firebase ----
async function pollFirebase() {
  const s = useVerdeStore.getState();
  if (s.settings.telemetryPaused) return;
  try {
    const j = await fbGet("/") as any;
    const sensors: Sensors = { ...s.sensors, ...(j.sensors || {}) };
    const controls: Controls = { ...s.controls, ...(j.controls || {}) };
    const latest_scan = { ...s.latestScan, ...(j.latest_scan || {}) };
    const weatherFromFb = { ...(j.weather || {}) };

    useVerdeStore.setState({
      sensors, controls,
      latestScan: latest_scan,
      connStatus: "live",
      connError: null,
      apiStatus: { ...s.apiStatus, firebase: "● live" },
    });
    s.tickPoll();

    // Detect new CAM photo (url changed or capture_photo was just triggered)
    const prevUrl = s.latestScan?.imageUrl || "";
    const newUrl = latest_scan.imageUrl || "";
    const prevCapturedAt = s.latestScan?.captured_at;
    const newCapturedAt = (latest_scan as any).captured_at;
    const isNewPhoto = !!newUrl && (newUrl !== prevUrl || (newCapturedAt && newCapturedAt !== prevCapturedAt));
    if (isNewPhoto) {
      const img = {
        dataUrl: newUrl, source: "cam" as const, name: "cam-capture",
        ts: (latest_scan as any).captured_at || (latest_scan as any).timestamp || Date.now(),
      };
      s.setCurrentImage(img);
      s.setNewPhotoFlash(true);
      s.log("ok", "firebase", "📸 NEW CAM photo detected");
      s.pushNotification({ level: "info", title: "New CAM photo", body: "Fresh capture from ESP32", icon: "📸" });
      if (s.settings.soundEnabled) sfx.shutter();
      setTimeout(() => s.setNewPhotoFlash(false), 4000);
    }

    // Threshold sync
    if (controls.moisture_threshold != null) {
      // ok, controls already updated
    }

    // Sensor history point
    const pt: SensorHistoryPoint = { ts: Date.now() };
    for (const k of ["moisture","temperature","humidity","tank_level","lux","soil_ph","pressure","co2"] as const) {
      if (typeof sensors[k] === "number") (pt as any)[k] = sensors[k];
    }
    s.addSensorPoint(pt);

    // ---- Smart alerts ----
    const th = s.settings;
    if (sensors.moisture != null && controls.moisture_threshold != null) {
      if (sensors.moisture < controls.moisture_threshold - th.drySoilAlertMargin) {
        if (cooldown("dry")) {
          s.pushNotification({
            level: "warn",
            title: "Soil is dry",
            body: `Moisture ${sensors.moisture}% — below threshold (${controls.moisture_threshold}%)`,
            icon: "💧",
          });
          if (th.soundEnabled) sfx.alert();
          notify("VERDE OS", `Soil dry (${sensors.moisture}%) — watering recommended`);
        }
      }
    }
    if (sensors.tank_level != null && controls.tank_threshold != null && controls.tank_threshold > 0) {
      const tankDisp = s.tankDisplayed(sensors.tank_level) ?? sensors.tank_level;
      if (tankDisp < controls.tank_threshold) {
        if (cooldown("tank", 120000)) {
          s.pushNotification({
            level: "err",
            title: "Reservoir low",
            body: `Tank ${Math.round(tankDisp)}% — pump locked below ${controls.tank_threshold}%`,
            icon: "🛢️",
          });
          if (th.soundEnabled) sfx.error();
          notify("VERDE OS", `Reservoir low (${Math.round(tankDisp)}%) — refill needed`);
        }
      }
    }
    if (sensors.temperature != null && sensors.temperature > th.highTempAlertC) {
      if (cooldown("hot", 300000)) {
        s.pushNotification({
          level: "err",
          title: "High temperature",
          body: `Temp ${sensors.temperature}°C — plant stress risk`,
          icon: "🌡️",
        });
        notify("VERDE OS", `High temperature (${sensors.temperature}°C)`);
      }
    }
    if (sensors.temperature != null && sensors.temperature < th.lowTempAlertC) {
      if (cooldown("cold", 300000)) {
        s.pushNotification({
          level: "err", title: "Low temperature",
          body: `Temp ${sensors.temperature}°C — cold stress`, icon: "❄️",
        });
      }
    }
    if (j.weather?.rain_expected && th.enableRainOverride) {
      if (cooldown("rain", 15*60000)) {
        s.pushNotification({
          level: "warn", title: "Rain detected",
          body: "Auto-watering suspended until weather clears", icon: "☔",
        });
      }
    }
  } catch (e: any) {
    const s = useVerdeStore.getState();
    s.setConnStatus("off", e.message);
    s.setApiStatus("firebase", "✗ offline");
    if (cooldown("conn-err", 15000)) {
      s.log("err", "firebase", `Connection error: ${e.message}`);
    }
  }
}

// ---- Weather ----
async function doWeather() {
  const s = useVerdeStore.getState();
  s.setWeatherLoading(true);
  s.setApiStatus("weather", "⏳ checking…");
  try {
    const { state: w, icon, rainExpected } = await fetchWeather(s.settings.city);
    s.setWeather(w as Weather, icon);
    s.setLastWeatherCheck(new Date().toLocaleTimeString([], { hour12: false }));
    s.setWeatherLoading(false);
    s.setApiStatus("weather", `✅ ${w.temp}°C ${w.description}`);

    // auto rain override
    if (s.settings.enableRainOverride) {
      await fbPatch("/controls", { weather_override: rainExpected ? 1 : 0 }).catch(() => {});
      s.setControls({ weather_override: rainExpected ? 1 : 0 });
    }

    // Write weather back to fb
    try { await fbPatch("/weather", w); } catch {}

    // fetch forecast too
    try {
      const fc = await fetchForecast(s.settings.city, 8);
      s.setWeather({ ...w, forecast: fc } as Weather, icon);
    } catch {}

    s.log("ok", "weather", `${w.city} ${w.temp}°C ${w.description}, rain=${rainExpected}`);
  } catch (e: any) {
    s.setWeatherLoading(false);
    s.setApiStatus("weather", `❌ ${e.message.slice(0, 60)}`);
    s.log("err", "weather", e.message);
  }
}
