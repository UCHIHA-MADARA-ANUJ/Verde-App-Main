"use client";
// ============================================================================
// VERDE OS — Global Zustand Store
// Central state for the entire app (sensors, controls, chat history, plants,
// scans, settings, preferences, diagnostics, analytics cache, etc.)
// ============================================================================
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  Sensors, Controls, Weather, VerdeImage, PlantResult,
  HistoryItem, SensorHistoryPoint, PlantProfile, AppLog, NotificationItem,
  AppSettings, DiagnosticResult, AppTourStep
} from "@/types";

// -------- Initial sensible defaults --------
const DEFAULT_SETTINGS: AppSettings = {
  pollIntervalMs: 2000,
  weatherIntervalMinutes: 10,
  historyMaxItems: 50,
  chartHistoryPoints: 120,
  soundEnabled: true,
  soundVolume: 0.4,
  notificationsEnabled: false,
  darkMode: true,
  accentColor: "green",
  temperatureUnit: "C",
  city: "Delhi",
  autoAnalyseUploads: true,
  autoAnalyseCam: true,
  autoOpenModalOnAnalysis: true,
  bootSequenceEnabled: true,
  showFPS: false,
  compactMode: false,
  enableRainOverride: true,
  lowTankAlertPercent: 10,
  drySoilAlertMargin: 5,
  highTempAlertC: 38,
  lowTempAlertC: 5,
  fontSize: "medium",
  terminalFont: "jetbrains",
  reduceMotion: false,
  showSystemInfo: true,
  telemetryPaused: false,
  geminiModel: "gemini-2.0-flash",
  openrouterModel: "auto",
};

interface VerdeStore {
  // ---- Connection / system ----
  connStatus: "connecting" | "live" | "off" | "error";
  connError: string | null;
  bootComplete: boolean;
  fps: number;
  appLoadTime: number;
  lastPollTs: number;
  pollCount: number;

  // ---- Core data ----
  sensors: Sensors;
  controls: Controls;
  latestScan: { imageUrl?: string; ts?: number; metadata?: any };
  weather: Weather | null;
  weatherIcon: string;
  lastWeatherCheck: string | null;
  weatherLoading: boolean;

  // ---- Plant doctor ----
  currentImage: VerdeImage | null;
  plantResult: PlantResult | null;
  analysing: boolean;
  analysisProgress: number;
  activeTab: "cam" | "upload" | "device" | null;

  // ---- Chats ----
  geminiMsgs: ChatMsg[];
  geminiBusy: boolean;
  geminiModel: string;
  orMsgs: ChatMsg[];
  orBusy: boolean;
  orActiveModel: string | null;
  modalChatMsgs: ChatMsg[];
  modalChatBusy: boolean;

  // ---- History / plants ----
  history: HistoryItem[];
  plants: PlantProfile[];
  activePlantId: string | null;
  sensorHistory: SensorHistoryPoint[];

  // ---- UI ----
  modalOpen: { type: "analysis" | "plant-detail" | "settings" | "diagnostics" | "history-item" | null; data?: any };
  sidebarOpen: boolean;
  currentRoute: string;
  logs: AppLog[];
  notifications: NotificationItem[];
  apiStatus: {
    firebase: string;
    weather: string;
    router: string;
    plant: string;
    gemini: string;
  };
  diagnostics: DiagnosticResult[];
  tourStep: number;
  tourActive: boolean;
  tourComplete: boolean;

  // ---- Settings ----
  settings: AppSettings;

  // ---- Actions ----
  setConnStatus: (s: "connecting"|"live"|"off"|"error", err?: string) => void;
  setBootComplete: () => void;
  setFps: (f: number) => void;
  tickPoll: () => void;
  setSensors: (s: Partial<Sensors>) => void;
  setControls: (c: Partial<Controls>) => void;
  setLatestScan: (s: any) => void;
  setWeather: (w: Weather | null, icon?: string) => void;
  setWeatherLoading: (b: boolean) => void;
  setLastWeatherCheck: (t: string) => void;
  setCurrentImage: (img: VerdeImage | null) => void;
  setPlantResult: (r: PlantResult | null) => void;
  setAnalysing: (b: boolean, progress?: number) => void;
  addGeminiMsg: (m: ChatMsg) => void;
  setGeminiBusy: (b: boolean) => void;
  addOrMsg: (m: ChatMsg) => void;
  setOrBusy: (b: boolean) => void;
  setOrActiveModel: (m: string | null) => void;
  addModalChatMsg: (m: ChatMsg) => void;
  setModalChatBusy: (b: boolean) => void;
  clearModalChat: () => void;
  addHistoryItem: (item: HistoryItem) => void;
  deleteHistoryItem: (id: string) => void;
  clearHistory: () => void;
  addPlant: (p: Omit<PlantProfile, "id" | "created" | "wateredAt" | "scansCount">) => void;
  updatePlant: (id: string, p: Partial<PlantProfile>) => void;
  deletePlant: (id: string) => void;
  setActivePlant: (id: string | null) => void;
  waterPlant: (id: string) => void;
  addSensorPoint: (p: SensorHistoryPoint) => void;
  openModal: (type: any, data?: any) => void;
  closeModal: () => void;
  setSidebarOpen: (b: boolean) => void;
  setRoute: (r: string) => void;
  log: (level: AppLog["level"], source: string, message: string, data?: any) => void;
  pushNotification: (n: Omit<NotificationItem, "id" | "ts">) => void;
  dismissNotification: (id: string) => void;
  setApiStatus: (k: keyof VerdeStore["apiStatus"], v: string) => void;
  addDiagnostic: (d: DiagnosticResult) => void;
  clearDiagnostics: () => void;
  updateSettings: (patch: Partial<AppSettings>) => void;
  resetSettings: () => void;
  startTour: () => void;
  nextTourStep: () => void;
  prevTourStep: () => void;
  endTour: () => void;
  resetApp: () => void;
}

const initialState = {
  connStatus: "connecting" as const,
  connError: null,
  bootComplete: false,
  fps: 0,
  appLoadTime: Date.now(),
  lastPollTs: 0,
  pollCount: 0,

  sensors: {} as Sensors,
  controls: {} as Controls,
  latestScan: {},
  weather: null,
  weatherIcon: "⛅",
  lastWeatherCheck: null,
  weatherLoading: false,

  currentImage: null,
  plantResult: null,
  analysing: false,
  analysisProgress: 0,
  activeTab: null,

  geminiMsgs: [{ id: "sys0", who: "sys", text: "VERDE AI TERMINAL ONLINE.\nUpload or capture a plant photo to begin. I can see the image, sensor data, and answer any plant-care questions." }],
  geminiBusy: false,
  geminiModel: "gemini-2.0-flash",
  orMsgs: [{ id: "sys0", who: "sys", text: "OPENROUTER SENSOR-AWARE TERMINAL ONLINE.\nI can see live ESP32 telemetry + controls. Ask about moisture, watering, tank, pump logic, or request a judge summary." }],
  orBusy: false,
  orActiveModel: null,
  modalChatMsgs: [],
  modalChatBusy: false,

  history: [],
  plants: [],
  activePlantId: null,
  sensorHistory: [],

  modalOpen: { type: null } as any,
  sidebarOpen: false,
  currentRoute: "/",
  logs: [
    { id: "boot0", ts: Date.now(), level: "info", source: "kernel", message: "VERDE OS v2.0 initializing…" },
  ],
  notifications: [],
  apiStatus: { firebase: "—", weather: "—", router: "—", plant: "—", gemini: "—" },
  diagnostics: [],
  tourStep: 0,
  tourActive: false,
  tourComplete: true,

  settings: DEFAULT_SETTINGS,
};

export const useVerdeStore = create<VerdeStore>()(
  persist(
    (set, get) => ({
      ...initialState as any,

      // ---- Actions ----
      setConnStatus: (s, err) => set({ connStatus: s, connError: err ?? null }),
      setBootComplete: () => set({ bootComplete: true }),
      setFps: (f) => set({ fps: f }),
      tickPoll: () => set(s => ({ pollCount: s.pollCount + 1, lastPollTs: Date.now() })),

      setSensors: (s) => set(st => ({ sensors: { ...st.sensors, ...s } })),
      setControls: (c) => set(st => ({ controls: { ...st.controls, ...c } })),
      setLatestScan: (s) => set(st => ({ latestScan: { ...st.latestScan, ...s } })),

      setWeather: (w, icon = "⛅") => set({ weather: w, weatherIcon: icon }),
      setWeatherLoading: (b) => set({ weatherLoading: b }),
      setLastWeatherCheck: (t) => set({ lastWeatherCheck: t }),

      setCurrentImage: (img) => set({ currentImage: img }),
      setPlantResult: (r) => set({ plantResult: r }),
      setAnalysing: (b, p = 0) => set({ analysing: b, analysisProgress: p }),

      addGeminiMsg: (m) => set(s => ({ geminiMsgs: [...s.geminiMsgs.slice(-200), { ...m, id: m.id || Math.random().toString(36).slice(2) }] })),
      setGeminiBusy: (b) => set({ geminiBusy: b }),
      addOrMsg: (m) => set(s => ({ orMsgs: [...s.orMsgs.slice(-200), { ...m, id: m.id || Math.random().toString(36).slice(2) }] })),
      setOrBusy: (b) => set({ orBusy: b }),
      setOrActiveModel: (m) => set({ orActiveModel: m }),
      addModalChatMsg: (m) => set(s => ({ modalChatMsgs: [...s.modalChatMsgs.slice(-100), { ...m, id: m.id || Math.random().toString(36).slice(2) }] })),
      setModalChatBusy: (b) => set({ modalChatBusy: b }),
      clearModalChat: () => set({ modalChatMsgs: [] }),

      addHistoryItem: (item) => set(s => {
        const next = [item, ...s.history].slice(0, s.settings.historyMaxItems);
        try { localStorage.setItem("verde_history_v2", JSON.stringify(next)); } catch {}
        return { history: next };
      }),
      deleteHistoryItem: (id) => set(s => {
        const next = s.history.filter(h => h.id !== id);
        try { localStorage.setItem("verde_history_v2", JSON.stringify(next)); } catch {}
        return { history: next };
      }),
      clearHistory: () => {
        try { localStorage.removeItem("verde_history_v2"); } catch {}
        set({ history: [] });
      },

      addPlant: (p) => set(s => {
        const plant: PlantProfile = {
          ...p, id: Math.random().toString(36).slice(2, 10),
          created: Date.now(), wateredAt: Date.now(), scansCount: 0,
        };
        return { plants: [...s.plants, plant] };
      }),
      updatePlant: (id, patch) => set(s => ({
        plants: s.plants.map(p => p.id === id ? { ...p, ...patch } : p),
      })),
      deletePlant: (id) => set(s => ({
        plants: s.plants.filter(p => p.id !== id),
        activePlantId: s.activePlantId === id ? null : s.activePlantId,
      })),
      setActivePlant: (id) => set({ activePlantId: id }),
      waterPlant: (id) => set(s => ({
        plants: s.plants.map(p => p.id === id ? { ...p, wateredAt: Date.now(), lastWaterBy: "user" } : p),
      })),

      addSensorPoint: (p) => set(s => {
        const max = s.settings.chartHistoryPoints;
        const next = [...s.sensorHistory, p];
        if (next.length > max) next.splice(0, next.length - max);
        return { sensorHistory: next };
      }),

      openModal: (type, data) => set({ modalOpen: { type, data } }),
      closeModal: () => set({ modalOpen: { type: null } }),
      setSidebarOpen: (b) => set({ sidebarOpen: b }),
      setRoute: (r) => set({ currentRoute: r, sidebarOpen: false }),

      log: (level, source, message, data) => set(s => ({
        logs: [...s.logs.slice(-500), { id: Math.random().toString(36).slice(2), ts: Date.now(), level, source, message, data }],
      })),

      pushNotification: (n) => set(s => {
        const id = Math.random().toString(36).slice(2);
        const full = { ...n, id, ts: Date.now() };
        if (s.settings.soundEnabled && (n.level === "err" || n.level === "warn")) {
          // sound handled in hooks
        }
        return { notifications: [...s.notifications, full].slice(-20) };
      }),
      dismissNotification: (id) => set(s => ({ notifications: s.notifications.filter(n => n.id !== id) })),

      setApiStatus: (k, v) => set(s => ({ apiStatus: { ...s.apiStatus, [k]: v } })),

      addDiagnostic: (d) => set(s => ({ diagnostics: [d, ...s.diagnostics].slice(0, 100) })),
      clearDiagnostics: () => set({ diagnostics: [] }),

      updateSettings: (patch) => set(s => ({ settings: { ...s.settings, ...patch } })),
      resetSettings: () => set({ settings: DEFAULT_SETTINGS }),

      startTour: () => set({ tourActive: true, tourStep: 0, tourComplete: false }),
      nextTourStep: () => set(s => {
        if (s.tourStep >= TOUR_STEPS.length - 1) {
          return { tourActive: false, tourComplete: true, tourStep: 0 };
        }
        return { tourStep: s.tourStep + 1 };
      }),
      prevTourStep: () => set(s => ({ tourStep: Math.max(0, s.tourStep - 1) })),
      endTour: () => set({ tourActive: false, tourComplete: true, tourStep: 0 }),

      resetApp: () => {
        try {
          localStorage.clear();
        } catch {}
        set({ ...initialState, bootComplete: false, settings: DEFAULT_SETTINGS } as any);
      },
    }),
    {
      name: "verde-os-v2",
      version: 2,
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") return { getItem: () => null, setItem: () => {}, removeItem: () => {} };
        return window.localStorage;
      }),
      partialize: (s) => ({
        settings: s.settings,
        history: s.history,
        plants: s.plants,
        activePlantId: s.activePlantId,
        tourComplete: s.tourComplete,
        geminiMsgs: s.geminiMsgs.slice(-50),
        orMsgs: s.orMsgs.slice(-50),
      }),
      onRehydrateStorage: () => (state) => {
        // reload persisted history from localStorage too
        try {
          const raw = localStorage.getItem("verde_history_v2");
          if (raw && state) (state as any).history = JSON.parse(raw);
        } catch {}
      },
    }
  )
);

// ---- Helpers / types for msg objects ----
export interface ChatMsg {
  id?: string;
  who: "you" | "ai" | "sys";
  text: string;
  meta?: string;
  ts?: number;
}

// ---- App Tour steps ----
export const TOUR_STEPS: AppTourStep[] = [
  { id: "welcome", title: "Welcome to VERDE OS", body: "Your personal plant mission control. Live sensors, AI doctor, vision chat — all in one place.", target: null },
  { id: "telemetry", title: "Live Telemetry", body: "Watch real-time sensor data stream from your ESP32 every 2 seconds.", target: "telemetry-card" },
  { id: "controls", title: "Take Control", body: "Toggle pump/light between AUTO and MANUAL, adjust thresholds, override for rain.", target: "controls" },
  { id: "weather", title: "Weather Auto-Override", body: "VERDE checks the forecast every 10 min and pauses watering when rain is coming.", target: "weather-card" },
  { id: "doctor", title: "Plant Doctor", body: "Trigger the ESP32 camera, snap with your device, or upload a photo. Plant.id identifies crops and diseases.", target: "doctor-card" },
  { id: "chat", title: "AI Chat", body: "Ask Gemini about the plant photo (it sees the image + your live sensors), or OpenRouter for data-heavy questions.", target: "chat-card" },
  { id: "done", title: "You're ready", body: "Explore the sidebar for analytics, plant profiles, history, diagnostics, and settings. Keep those plants alive! 🌿", target: null },
];
