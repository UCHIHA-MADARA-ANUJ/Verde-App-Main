"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { config } from "@/lib/config";
import {
  fbGet, setCtrl, fetchWeather, identifyPlant,
  askGemini, askOpenRouter, buildSensorContext,
  predictActuators, appendHistoryPoint, notify,
} from "@/lib/verde";
import type {
  AppState, Sensors, Controls, Weather, PlantResult,
  VerdeImage, HistoryItem, SensorHistoryPoint,
} from "@/types";

const HISTORY_KEY = "verde_history_v1";

export interface ChatMsg {
  id: string;
  who: "you" | "ai" | "sys";
  text: string;
  meta?: string;
}

function loadHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch { return []; }
}
function saveHistory(h: HistoryItem[]) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(0, config.historyMaxItems))); } catch {}
}

export function useVerde() {
  const [state, setState] = useState<AppState>({
    sensors: {}, controls: {}, latest_scan: {}, weather: {},
  });
  const [connStatus, setConnStatus] = useState<"connecting" | "live" | "off">("connecting");
  const [weather, setWeather] = useState<Weather | null>(null);
  const [weatherIcon, setWeatherIcon] = useState("⛅");
  const [lastWeatherCheck, setLastWeatherCheck] = useState<string | null>(null);
  const [predict, setPredict] = useState<ReturnType<typeof predictActuators> | null>(null);

  const [currentImage, setCurrentImage] = useState<VerdeImage | null>(null);
  const [plantResult, setPlantResult] = useState<PlantResult | null>(null);
  const [analysing, setAnalysing] = useState(false);

  const [logLines, setLogLines] = useState<string[]>([
    "// VERDE OS v1.0.0 — terminal online.",
    "// Waiting for Firebase handshake…",
  ]);
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([
    { id: "w0", who: "sys", text: "VERDE AI TERMINAL ONLINE.\nNo image loaded. Capture or upload a plant photo to begin." },
  ]);
  const [orMsgs, setOrMsgs] = useState<ChatMsg[]>([
    { id: "o0", who: "sys", text: "OPENROUTER SENSOR-AWARE TERMINAL ONLINE.\nI see your live ESP32 sensors. Try: 'Should I water?' 'Summarize system status.'" },
  ]);
  const [orBusy, setOrBusy] = useState(false);
  const [chatBusy, setChatBusy] = useState(false);
  const [apiStatus, setApiStatus] = useState({
    weather: "—", router: "—", db: "—", plant: "—",
  });

  const [history, setHistory] = useState<HistoryItem[]>(() => loadHistory());
  const [sensorHistory, setSensorHistory] = useState<SensorHistoryPoint[]>([]);

  const [alerts, setAlerts] = useState<{ id: string; text: string; level: "ok"|"warn"|"err" }[]>([]);
  const lastAlertRef = useRef<Record<string, number>>({});

  const log = useCallback((m: string) => {
    const t = new Date().toLocaleTimeString([], { hour12: false });
    setLogLines(prev => [...prev.slice(-120), `[${t}] ${m}`]);
  }, []);
  const chat = useCallback((m: Omit<ChatMsg, "id">) => {
    setChatMsgs(prev => [...prev.slice(-80), { ...m, id: Math.random().toString(36).slice(2) }]);
  }, []);
  const orch = useCallback((m: Omit<ChatMsg, "id">) => {
    setOrMsgs(prev => [...prev.slice(-80), { ...m, id: Math.random().toString(36).slice(2) }]);
  }, []);

  const pushAlert = useCallback((text: string, level: "ok"|"warn"|"err" = "warn", key?: string, cooldownMs = 60000) => {
    const k = key || text;
    const now = Date.now();
    if (lastAlertRef.current[k] && now - lastAlertRef.current[k] < cooldownMs) return;
    lastAlertRef.current[k] = now;
    const id = Math.random().toString(36).slice(2);
    setAlerts(prev => [...prev, { id, text, level }]);
    if (level === "err" || level === "warn") notify("VERDE OS", text);
    setTimeout(() => setAlerts(prev => prev.filter(a => a.id !== id)), 6000);
  }, []);

  // Poll Firebase
  useEffect(() => {
    let cancelled = false;
    async function tick() {
      try {
        const j = await fbGet("/");
        if (cancelled) return;
        setState(prev => {
          const sensors = { ...prev.sensors, ...(j.sensors || {}) };
          const controls = { ...prev.controls, ...(j.controls || {}) };
          const latest_scan = { ...prev.latest_scan, ...(j.latest_scan || {}) };
          const w = { ...prev.weather, ...(j.weather || {}) };
          setPredict(predictActuators(sensors as Sensors, controls as Controls));
          setSensorHistory(buf => appendHistoryPoint(buf, sensors as Sensors));
          // auto-show latest CAM if no current image
          if (latest_scan.imageUrl) {
            setCurrentImage(curr => {
              if (!curr) {
                log(">> Loaded latest CAM photo from Firebase.");
                return { dataUrl: latest_scan.imageUrl!, source: "cam", name: "cam-capture", ts: Date.now() };
              }
              return curr;
            });
          }
          // threshold sync
          if (controls.moisture_threshold !== undefined) {
            // expose via DOM ref not needed, react state handles
          }
          return { sensors, controls, latest_scan, weather: w };
        });
        setConnStatus("live");
        setApiStatus(s => ({ ...s, db: "● live" }));
      } catch (e: any) {
        if (cancelled) return;
        setConnStatus("off");
        setApiStatus(s => ({ ...s, db: "✗ offline" }));
      }
    }
    tick();
    const h = setInterval(tick, config.pollIntervalMs);
    return () => { cancelled = true; clearInterval(h); };
  }, [log]);

  // Smart alerts based on sensor state
  useEffect(() => {
    const s = state.sensors as Sensors, c = state.controls as Controls;
    if (s.moisture != null && c.moisture_threshold != null) {
      if (s.moisture < c.moisture_threshold - 5) {
        pushAlert(`Soil dry (${s.moisture}%) — watering recommended`, "warn", "dry", 5 * 60000);
      }
    }
    if (s.tank_level != null && c.tank_threshold != null && c.tank_threshold > 0) {
      if (s.tank_level < c.tank_threshold) {
        pushAlert(`Reservoir low (${s.tank_level}%) — pump locked`, "err", "tank", 2 * 60000);
      }
    }
    if (s.temperature != null && s.temperature > 38) {
      pushAlert(`High temperature (${s.temperature}°C) — plant stress`, "err", "hot", 10 * 60000);
    }
    if (state.weather?.rain_expected) {
      pushAlert(`Rain forecast — auto-watering suspended`, "warn", "rain", 15 * 60000);
    }
  }, [state.sensors, state.controls, state.weather, pushAlert]);

  // Weather auto-check
  const checkWeather = useCallback(async () => {
    setApiStatus(s => ({ ...s, weather: "⏳ checking…" }));
    try {
      const { state: w, icon, rainExpected } = await fetchWeather(config.city);
      setWeather(w); setWeatherIcon(icon);
      setLastWeatherCheck(new Date().toLocaleTimeString([], { hour12: false }));
      setApiStatus(s => ({ ...s, weather: `✅ ${w.temp}°C ${w.description}` }));
      // auto rain override
      await setCtrl("weather_override", rainExpected ? 1 : 0);
      log(`>> Weather: ${w.temp}°C ${w.description}, rain=${rainExpected} → override=${rainExpected ? 1 : 0}`);
      if (rainExpected) chat({ who: "sys", text: `☔ Rain expected (${w.description}) — auto-watering suspended.` });
    } catch (e: any) {
      setApiStatus(s => ({ ...s, weather: `❌ ${e.message}` }));
      log(`>> Weather error: ${e.message}`);
    }
  }, [log, chat]);

  useEffect(() => {
    checkWeather();
    const h = setInterval(checkWeather, config.weatherIntervalMs);
    return () => clearInterval(h);
  }, [checkWeather]);

  // Controls
  const doSetCtrl = useCallback(async (k: string, v: any) => {
    log(`>> controls.${k} = ${typeof v === "boolean" ? v : v}`);
    try {
      await setCtrl(k, v);
      setState(prev => ({ ...prev, controls: { ...prev.controls, [k]: v } }));
    } catch (e: any) {
      log(`>> set FAILED: ${e.message}`);
    }
  }, [log]);

  // Camera trigger
  const triggerCapture = useCallback(async () => {
    log(">> 📸 Triggering ESP32 CAM capture…");
    try {
      await setCtrl("capture_photo", true);
      setTimeout(() => setCtrl("capture_photo", false).catch(() => {}), 4000);
    } catch (e: any) { log(`>> capture trigger failed: ${e.message}`); }
  }, [log]);

  const useCamPhoto = useCallback(() => {
    const url = state.latest_scan?.imageUrl;
    if (!url) { log(">> No CAM photo in Firebase yet. Trigger one!"); alert("No CAM photo found. Trigger a capture first."); return; }
    const img: VerdeImage = { dataUrl: url, source: "cam", name: "cam-capture", ts: Date.now() };
    setCurrentImage(img);
    return img;
  }, [state.latest_scan, log]);

  const setUserImage = useCallback((file: File) => {
    return new Promise<VerdeImage>((resolve) => {
      const rd = new FileReader();
      rd.onload = () => {
        const img: VerdeImage = {
          dataUrl: rd.result as string, source: "user", name: file.name, ts: Date.now(),
        };
        setCurrentImage(img);
        resolve(img);
      };
      rd.readAsDataURL(file);
    });
  }, []);

  const setDeviceImage = useCallback((dataUrl: string) => {
    const img: VerdeImage = { dataUrl, source: "device", name: `device-${Date.now()}.jpg`, ts: Date.now() };
    setCurrentImage(img);
    return img;
  }, []);

  // Plant analysis
  const analyse = useCallback(async (img: VerdeImage) => {
    setAnalysing(true);
    setApiStatus(s => ({ ...s, plant: "⏳ analysing…" }));
    log(`>> Analysing ${img.name} with crop.health…`);
    try {
      const { crops, diseases } = await identifyPlant(img.dataUrl);
      let pr: PlantResult | null = null;
      if (crops.length) {
        pr = { name: crops[0].name, prob: crops[0].prob, common: crops[0].common };
        log(`>> Crop: ${crops[0].name}${crops[0].common ? ` (${crops[0].common})` : ""} — ${crops[0].prob}%`);
      }
      if (diseases.length) {
        const d = diseases[0];
        if (pr) pr.disease = { name: d.name, prob: d.prob, treatment: d.treatment };
        log(`>> Disease: ${d.name} (${d.prob}%)${d.treatment ? " · treatment available" : ""}`);
        if (!d.name.toLowerCase().includes("healthy")) {
          pushAlert(`Possible issue: ${d.name} (${d.prob}%)`, "err", "disease-" + d.name, 30 * 60000);
        }
      }
      setPlantResult(pr);
      setApiStatus(s => ({ ...s, plant: pr ? `✅ ${pr.name} ${pr.prob}%` : "—" }));
      // save to history
      if (pr) {
        const item: HistoryItem = { id: Math.random().toString(36).slice(2), image: img, result: pr, ts: img.ts };
        setHistory(prev => {
          const next = [item, ...prev].slice(0, config.historyMaxItems);
          saveHistory(next);
          return next;
        });
        chat({ who: "sys", text: `🌿 Identified: ${pr.name}${pr.common ? ` (${pr.common})` : ""} — ${pr.prob}% conf.${pr.disease ? `\n🩺 ${pr.disease.name} (${pr.disease.prob}%)` : ""}` });
      }
      return pr;
    } catch (e: any) {
      setApiStatus(s => ({ ...s, plant: `❌ ${e.message}` }));
      log(`>> Plant.id error: ${e.message}`);
      return null;
    } finally {
      setAnalysing(false);
    }
  }, [log, chat, pushAlert]);

  // Gemini chat (with current image)
  const sendGemini = useCallback(async (q: string, imgOverride?: VerdeImage) => {
    const img = imgOverride || currentImage;
    if (!q.trim()) return;
    chat({ who: "you", text: q });
    setChatBusy(true);
    try {
      const ctx = plantResult
        ? `Plant.id result: ${JSON.stringify(plantResult)}. Live telemetry: moisture=${state.sensors.moisture}%, temp=${state.sensors.temperature}°C, humidity=${state.sensors.humidity}%, tank=${state.sensors.tank_level}%, light=${state.sensors.light}, pump=${state.controls.pump_state}, mode=${state.controls.manual_mode ? "MANUAL" : "AUTO"}.`
        : `Plant not analysed yet. Live telemetry: moisture=${state.sensors.moisture}%, temp=${state.sensors.temperature}°C, humidity=${state.sensors.humidity}%, tank=${state.sensors.tank_level}%, light=${state.sensors.light}.`;
      const text = await askGemini({
        imageDataUrl: img?.dataUrl,
        text: `${ctx}\n\nQuestion: ${q}`,
        system: "You are Verde AI, a plant-care assistant. You see the plant photo (if provided), Plant.id diagnosis, and live sensor data. Answer briefly, helpfully, in plain English (2-4 sentences). Be specific with numbers when relevant.",
      });
      chat({ who: "ai", text });
    } catch (e: any) {
      chat({ who: "sys", text: `ERR: ${e.message}` });
    } finally { setChatBusy(false); }
  }, [currentImage, plantResult, state.sensors, state.controls, chat]);

  // OpenRouter
  const sendOpenRouter = useCallback(async (q: string) => {
    if (!q.trim()) return;
    orch({ who: "you", text: q });
    setOrBusy(true);
    setApiStatus(s => ({ ...s, router: "⏳ thinking…" }));
    try {
      const ctx = buildSensorContext(state, weather, lastWeatherCheck);
      const { text, model } = await askOpenRouter(ctx, q);
      orch({ who: "ai", text, meta: model.split("/")[0] });
      setApiStatus(s => ({ ...s, router: `✅ via ${model.split("/")[0]}` }));
    } catch (e: any) {
      orch({ who: "sys", text: `ERR: ${e.message}` });
      setApiStatus(s => ({ ...s, router: `❌ ${e.message.slice(0, 60)}` }));
    } finally { setOrBusy(false); }
  }, [state, weather, lastWeatherCheck, orch]);

  // API test buttons
  const testRouter = useCallback(async () => {
    setApiStatus(s => ({ ...s, router: "⏳ ping…" }));
    try {
      const { text, model } = await askOpenRouter("Say hello briefly.", "Just say 'VERDE online' and nothing else.");
      setApiStatus(s => ({ ...s, router: `✅ ${text.slice(0, 40)} (${model.split("/")[0]})` }));
    } catch (e: any) {
      setApiStatus(s => ({ ...s, router: `❌ ${e.message.slice(0, 60)}` }));
    }
  }, []);

  const pingDB = useCallback(async () => {
    try {
      const j = await fbGet("/");
      setApiStatus(s => ({ ...s, db: `✅ nodes: ${Object.keys(j).join(",")}` }));
    } catch (e: any) {
      setApiStatus(s => ({ ...s, db: `❌ ${e.message}` }));
    }
  }, []);

  return {
    state, connStatus, weather, weatherIcon, lastWeatherCheck, predict,
    currentImage, setCurrentImage, plantResult, analysing,
    logLines, chatMsgs, orMsgs, orBusy, chatBusy,
    apiStatus, history, sensorHistory, alerts,
    log, chat, orch,
    doSetCtrl, checkWeather, triggerCapture, useCamPhoto, setUserImage, setDeviceImage,
    analyse, sendGemini, sendOpenRouter,
    testRouter, pingDB,
  };
}
