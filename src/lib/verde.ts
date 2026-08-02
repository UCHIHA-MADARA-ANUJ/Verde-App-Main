import { config, dbUrl } from "./config";
import type {
  AppState, Sensors, Controls, LatestScan, Weather,
  PlantResult, SensorHistoryPoint
} from "@/types";

// ---------- Firebase helpers ----------
export async function fbGet<T = any>(path: string): Promise<T> {
  const r = await fetch(dbUrl(path));
  if (!r.ok) throw new Error(`Firebase GET ${path}: ${r.status}`);
  return r.json();
}

export async function fbPatch(path: string, body: Record<string, any>) {
  const r = await fetch(dbUrl(path), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`Firebase PATCH ${path}: ${r.status}`);
  return r.json();
}

export async function setCtrl(key: string, value: any) {
  return fbPatch("/controls", { [key]: value });
}

// ---------- Weather (OpenWeather) ----------
export async function fetchWeather(city = config.city): Promise<{
  state: Weather; icon: string; rainExpected: boolean; raw: any;
}> {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${config.openWeatherKey}`;
  const r = await fetch(url);
  const j = await r.json();
  if (j.cod !== 200) throw new Error(`Weather: ${JSON.stringify(j).slice(0, 80)}`);
  const main = j.weather[0].main;
  const id = j.weather[0].id;
  const group = Math.floor(id / 100);
  const RAIN_CODES = new Set([2, 3, 5, 6]);
  const W_ICONS: Record<number, any> = {
    2: "⛈️", 3: "🌦️", 5: "🌧️", 6: "❄️", 7: "🌫️",
  };
  const temp = Math.round(j.main.temp - 273.15);
  const desc = j.weather[0].description;
  const rainExpected = RAIN_CODES.has(group);
  const icon = group === 8 ? (main === "Clear" ? "☀️" : "☁️") : (W_ICONS[group] || "⛅");
  const state: Weather = {
    city: j.name,
    temp,
    condition: main,
    description: desc,
    humidity: j.main.humidity,
    wind_speed: j.wind.speed,
    rain_expected: rainExpected,
    status: "live",
    synced_at: Date.now(),
  };
  // persist to Firebase
  try { await fbPatch("/weather", state); } catch {}
  return { state, icon, rainExpected, raw: j };
}

// ---------- Plant.id / Crop.health ----------
export async function identifyPlant(dataUrl: string): Promise<{
  crops: PlantResult[]; diseases: { name: string; prob: number; treatment?: string }[];
}> {
  let b64 = dataUrl;
  const comma = b64.indexOf(",");
  if (comma !== -1) b64 = b64.slice(comma + 1);
  const url = "https://crop.kindwise.com/api/v1/identification?details=common_names,url,description,treatment";
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Api-Key": config.plantIdKey },
    body: JSON.stringify({ images: [b64] }),
  });
  const j = await r.json();
  if (!r.ok || !j.result) {
    const msg = (j && j.message) ? j.message : JSON.stringify(j).slice(0, 200);
    throw new Error(`Plant.id: ${msg}`);
  }
  const crops = ((j.result.crop && j.result.crop.suggestions) || []).map((c: any) => ({
    name: c.name,
    prob: Math.round((c.probability || 0) * 100),
    common:
      c.details?.common_names?.[0] || "",
    details: c,
  }));
  const diseases = ((j.result.disease && j.result.disease.suggestions) || []).map((d: any) => {
    const t = d.details?.treatment;
    const first = (t?.biological?.[0]) || (t?.prevention?.[0]) || (t?.chemical?.[0]) || "";
    return {
      name: d.name,
      prob: Math.round((d.probability || 0) * 100),
      treatment: first ? String(first).slice(0, 240) : undefined,
    };
  });
  return { crops, diseases };
}

// ---------- Gemini (vision + chat) ----------
export async function askGemini(opts: {
  imageDataUrl?: string;
  text: string;
  system?: string;
}): Promise<string> {
  const parts: any[] = [];
  if (opts.imageDataUrl) {
    const b64 = opts.imageDataUrl.indexOf(",") !== -1
      ? opts.imageDataUrl.split(",")[1]
      : opts.imageDataUrl;
    parts.push({ inline_data: { mime_type: "image/jpeg", data: b64 } });
  }
  parts.push({ text: (opts.system ? opts.system + "\n\n" : "") + opts.text });
  const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-goog-api-key": config.geminiKey },
    body: JSON.stringify({ contents: [{ parts }] }),
  });
  const j = await r.json();
  if (!r.ok || !j.candidates?.[0]?.content?.parts?.[0]?.text) {
    throw new Error(`Gemini: ${j.error?.message || JSON.stringify(j).slice(0, 140)}`);
  }
  return j.candidates[0].content.parts[0].text;
}

// ---------- OpenRouter sensor-aware chat ----------
const FREE_MODELS = [
  "nvidia/nemotron-3-ultra-550b-a55b:free",
  "openai/gpt-oss-120b:free",
  "deepseek/deepseek-v4-flash:free",
  "google/gemma-4-31b-it:free",
  "qwen/qwen3-next-80b-a3b-instruct:free",
  "openai/gpt-oss-20b:free",
];

export async function askOpenRouter(context: string, question: string): Promise<{
  text: string; model: string;
}> {
  let lastErr = "unknown error";
  for (const model of FREE_MODELS) {
    try {
      const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + config.openRouterKey,
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content:
                "You are Verde AI, assistant for Project Verde — a smart plant irrigation system. You have live ESP32 telemetry and controls. Be concise, accurate, conversational (2-4 sentences). Use the sensor numbers. If data is missing, say so.",
            },
            { role: "user", content: `${context}\n\nQuestion: ${question}` },
          ],
        }),
      });
      const j = await r.json();
      if (r.ok && j.choices?.[0]?.message?.content) {
        return { text: j.choices[0].message.content, model };
      }
      lastErr = j.error?.message || JSON.stringify(j).slice(0, 100);
    } catch (e: any) {
      lastErr = e.message;
    }
  }
  throw new Error(`All free models failed: ${lastErr}`);
}

export function buildSensorContext(state: AppState, weather: Weather | null, lastWeatherCheck: string | null) {
  const s = state.sensors || {} as Sensors;
  const c = state.controls || {} as Controls;
  const rain = weather?.rain_expected ? "RAIN DETECTED — watering suspended" : "clear";
  return (
    `LIVE SYSTEM (weather: ${rain}, last check ${lastWeatherCheck || "none"}, ` +
    `${weather?.description || "n/a"} ${weather?.temp != null ? weather.temp + "°C" : ""}):\n` +
    `sensors: ${JSON.stringify(s)}\ncontrols: ${JSON.stringify(c)}\n` +
    `Interpretation: moisture ${s.moisture ?? "?"}% (auto-water below ${c.moisture_threshold ?? 35}%), ` +
    `tank ${s.tank_level ?? "?"}% (lock below ${c.tank_threshold ?? 15}%, 0=off), ` +
    `temp ${s.temperature ?? "?"}°C, humidity ${s.humidity ?? "?"}%, lux ${s.lux ?? "?"}, light ${s.light ?? "?"}, ` +
    `pump mode ${c.manual_mode ? "MANUAL" : "AUTO"}, pump ${c.pump_state ? "ON" : "OFF"}, ` +
    `light mode ${c.light_manual_mode ? "MANUAL" : "AUTO"}, grow-light ${c.grow_light_state ? "ON" : "OFF"}, ` +
    `rain-override ${c.weather_override === 1 ? "ACTIVE (no watering)" : "off"}.`
  );
}

// ---------- Smart actuator prediction (from prototype) ----------
export function predictActuators(s: Sensors, c: Controls) {
  const m = s.moisture ?? 0;
  const tank = s.tank_level ?? 0;
  const tankTh = c.tank_threshold ?? 15;
  const moistTh = c.moisture_threshold ?? 35;
  const lightTh = c.light_threshold ?? 35;
  const luxPct = (s.lux ?? 0) / 10;
  const rain = c.weather_override === 1;

  let pumpOn = false, pumpReason = "";
  if (c.manual_mode) {
    pumpOn = !!c.pump_state && (tankTh === 0 || tank >= tankTh);
    pumpReason = "MANUAL" + (pumpOn ? " → ON 💦" : " → OFF") + (tank < tankTh && tankTh > 0 ? " · tank lock" : "");
  } else {
    pumpOn = m < moistTh && (tankTh === 0 || tank >= tankTh) && !rain;
    pumpReason = "AUTO" + (m < moistTh ? ` · dry (${m}%<${moistTh}%)` : ` · wet (${m}%)`) +
      (tank < tankTh && tankTh > 0 ? " · tank lock" : "") + (rain ? " · RAIN" : "");
  }

  const dark = luxPct < lightTh;
  let lightOn = false, lightReason = "";
  if (c.light_manual_mode) {
    lightOn = !!c.grow_light_state;
    lightReason = "MANUAL";
  } else {
    lightOn = dark;
    lightReason = "AUTO" + (dark ? ` · dark (${Math.round(luxPct)}%<${lightTh}%)` : ` · bright (${Math.round(luxPct)}%)`);
  }

  return {
    pumpOn, pumpReason,
    lightOn, lightReason,
    mode: `pump:${c.manual_mode ? "MAN" : "AUTO"} · light:${c.light_manual_mode ? "MAN" : "AUTO"}`,
  };
}

// ---------- Sensor history buffer ----------
export function appendHistoryPoint(buf: SensorHistoryPoint[], s: Sensors, maxLen = 60): SensorHistoryPoint[] {
  const pt: SensorHistoryPoint = { ts: Date.now() };
  for (const k of ["moisture", "temperature", "humidity", "tank_level", "lux"] as const) {
    if (typeof s[k] === "number") pt[k] = s[k];
  }
  const next = [...buf, pt];
  if (next.length > maxLen) next.splice(0, next.length - maxLen);
  return next;
}

// ---------- Sound FX ----------
let audioCtx: AudioContext | null = null;
export function sfx(type: "click" | "success" | "alert" | "boot" = "click") {
  try {
    if (typeof window === "undefined") return;
    const muted = localStorage.getItem("verde_muted") === "1";
    if (muted) return;
    if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const ctx = audioCtx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    const vol = 0.06;
    switch (type) {
      case "click":
        osc.type = "square"; osc.frequency.setValueAtTime(620, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.06);
        gain.gain.setValueAtTime(vol, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
        osc.start(now); osc.stop(now + 0.09); break;
      case "success":
        osc.type = "sine"; osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.18);
        gain.gain.setValueAtTime(vol, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
        osc.start(now); osc.stop(now + 0.26); break;
      case "alert":
        osc.type = "sawtooth"; osc.frequency.setValueAtTime(220, now);
        osc.frequency.linearRampToValueAtTime(180, now + 0.3);
        gain.gain.setValueAtTime(vol * 1.4, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
        osc.start(now); osc.stop(now + 0.42); break;
      case "boot":
        osc.type = "sine"; osc.frequency.setValueAtTime(110, now);
        osc.frequency.exponentialRampToValueAtTime(660, now + 0.5);
        gain.gain.setValueAtTime(vol * 1.6, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
        osc.start(now); osc.stop(now + 0.62); break;
    }
  } catch {}
}

// ---------- Notifications ----------
export function notify(title: string, body: string) {
  try {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") {
      new Notification(title, { body, icon: "/favicon.svg" });
    }
  } catch {}
}
export async function requestNotifyPermission() {
  try {
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
  } catch {}
}
