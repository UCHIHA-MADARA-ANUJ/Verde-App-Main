// ============================================================================
// VERDE OS — Core Type Definitions
// ============================================================================

// ---------- Sensor / control state ----------
export interface Sensors {
  moisture?: number;
  temperature?: number;
  humidity?: number;
  tank_level?: number;
  lux?: number;
  light?: number;
  voltage_sag?: number;
  successful_uploads?: number;
  failed_uploads?: number;
  soil_ph?: number;
  soil_n?: number;
  soil_p?: number;
  soil_k?: number;
  co2?: number;
  pressure?: number;
  wind_speed?: number;
  dew_point?: number;
  heat_index?: number;
  last_watered?: number;
  uptime_ms?: number;
  rssi?: number;
  free_heap?: number;
  firmware_version?: string;
  [k: string]: any;
}

export interface Controls {
  manual_mode?: boolean;
  pump_state?: boolean;
  light_manual_mode?: boolean;
  grow_light_state?: boolean;
  weather_override?: number;
  moisture_threshold?: number;
  tank_threshold?: number;
  light_threshold?: number;
  capture_photo?: boolean;
  ph_threshold_min?: number;
  ph_threshold_max?: number;
  temp_threshold_min?: number;
  temp_threshold_max?: number;
  humid_threshold_min?: number;
  humid_threshold_max?: number;
  pump_duration_s?: number;
  light_on_hour?: number;
  light_off_hour?: number;
  auto_detect_disease?: boolean;
  fan_state?: boolean;
  fan_manual_mode?: boolean;
  [k: string]: any;
}

export interface LatestScan {
  imageUrl?: string;
  timestamp?: number;
  captured_at?: number | string;
  metadata?: {
    width?: number;
    height?: number;
    lux?: number;
    temp?: number;
    moisture?: number;
  };
  [k: string]: any;
}

export interface Weather {
  city?: string;
  temp?: number;
  feels_like?: number;
  temp_min?: number;
  temp_max?: number;
  condition?: string;
  description?: string;
  humidity?: number;
  pressure?: number;
  wind_speed?: number;
  wind_deg?: number;
  clouds?: number;
  visibility?: number;
  sunrise?: number;
  sunset?: number;
  rain_expected?: boolean;
  rain_1h?: number;
  snow_1h?: number;
  forecast?: WeatherForecast[];
  status?: string;
  synced_at?: number;
}

export interface WeatherForecast {
  dt: number;
  temp: number;
  condition: string;
  description: string;
  rain_prob: number;
  icon: string;
}

export interface AppState {
  sensors: Sensors;
  controls: Controls;
  latest_scan: LatestScan;
  weather: Weather;
}

// ---------- Plants / analysis ----------
export interface PlantResult {
  name: string;
  prob: number;
  common?: string;
  scientific?: string;
  taxonomy?: Record<string, string>;
  disease?: {
    name: string;
    prob: number;
    treatment?: string;
    biological?: string[];
    chemical?: string[];
    prevention?: string[];
    severity?: "low" | "medium" | "high";
  };
  watering?: {
    min_freq_days?: number;
    max_freq_days?: number;
    notes?: string;
  };
  wiki?: {
    description?: string;
    url?: string;
    image?: string;
  };
  details?: any;
}

export interface VerdeImage {
  dataUrl: string;
  source: "cam" | "user" | "device" | "history";
  name: string;
  ts: number;
  width?: number;
  height?: number;
}

export interface HistoryItem {
  id: string;
  image: VerdeImage;
  result?: PlantResult;
  ts: number;
  plantId?: string;
  sensorSnapshot?: Partial<Sensors>;
  chatTranscript?: { who: string; text: string }[];
  tags?: string[];
  notes?: string;
}

export interface PlantProfile {
  id: string;
  name: string;
  species?: string;
  emoji?: string;
  location?: string;
  created: number;
  wateredAt: number;
  lastWaterBy?: "user" | "auto" | "schedule";
  wateringIntervalDays?: number;
  scansCount: number;
  latestScanId?: string;
  notes?: string;
  healthScore?: number; // 0-100
  photoUrl?: string;
  potSize?: string;
  soilType?: string;
  acquiredAt?: number;
  tags?: string[];
  idealTempMin?: number;
  idealTempMax?: number;
  idealMoistureMin?: number;
  idealMoistureMax?: number;
  idealLight?: "low" | "medium" | "bright" | "direct";
}

export interface SensorHistoryPoint {
  ts: number;
  moisture?: number;
  temperature?: number;
  humidity?: number;
  tank_level?: number;
  lux?: number;
  soil_ph?: number;
  pressure?: number;
  co2?: number;
}

// ---------- Settings ----------
export type AccentColor = "green" | "purple" | "sky" | "amber" | "red";
export type TempUnit = "C" | "F";
export type FontSize = "small" | "medium" | "large";
export type TerminalFont = "jetbrains" | "fira" | "cascadia" | "system";

export interface AppSettings {
  pollIntervalMs: number;
  weatherIntervalMinutes: number;
  historyMaxItems: number;
  chartHistoryPoints: number;
  soundEnabled: boolean;
  soundVolume: number;
  notificationsEnabled: boolean;
  darkMode: boolean;
  accentColor: AccentColor;
  temperatureUnit: TempUnit;
  city: string;
  autoAnalyseUploads: boolean;
  autoAnalyseCam: boolean;
  autoOpenModalOnAnalysis: boolean;
  bootSequenceEnabled: boolean;
  showFPS: boolean;
  compactMode: boolean;
  enableRainOverride: boolean;
  lowTankAlertPercent: number;
  drySoilAlertMargin: number;
  highTempAlertC: number;
  lowTempAlertC: number;
  fontSize: FontSize;
  terminalFont: TerminalFont;
  reduceMotion: boolean;
  showSystemInfo: boolean;
  telemetryPaused: boolean;
  geminiModel: string;
  openrouterModel: string;
  pump_duration_s?: number;
}

// ---------- Logs / notifications ----------
export type LogLevel = "info" | "ok" | "warn" | "err" | "debug";

export interface AppLog {
  id: string;
  ts: number;
  level: LogLevel;
  source: string;
  message: string;
  data?: any;
}

export type NotificationLevel = "ok" | "warn" | "err" | "info";

export interface NotificationItem {
  id: string;
  ts: number;
  level: NotificationLevel;
  title: string;
  body: string;
  icon?: string;
  action?: { label: string; href?: string; onClick?: () => void };
  persistent?: boolean;
}

// ---------- Diagnostics ----------
export interface DiagnosticResult {
  id: string;
  ts: number;
  category: "firebase" | "weather" | "gemini" | "openrouter" | "plantid" | "hardware" | "network" | "storage";
  label: string;
  status: "ok" | "warn" | "err" | "pending";
  message: string;
  latencyMs?: number;
  detail?: any;
}

// ---------- Tour ----------
export interface AppTourStep {
  id: string;
  title: string;
  body: string;
  target: string | null;
}

// ---------- API responses (partial shapes) ----------
export interface KindwiseSuggestion {
  id: string;
  name: string;
  probability: number;
  details?: {
    common_names?: string[];
    description?: { value?: string; citation?: string };
    url?: string;
    treatment?: {
      biological?: string[];
      chemical?: string[];
      prevention?: string[];
    };
    taxonomy?: Record<string, string>;
    watering?: { min?: number; max?: number };
    wiki_images?: { id?: string; url?: string; citation?: string }[];
    language?: string;
    entity_id?: string;
  };
  similar_images?: { id?: string; url?: string; license_name?: string; citation?: string; similarity?: number }[];
}

// ---------- Misc ----------
export interface StatsSummary {
  totalScans: number;
  plantsTracked: number;
  waterings: number;
  healthyPlants: number;
  issuesDetected: number;
  uptimeHours: number;
  apiCallsToday: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: number;
  progress?: number;
  target?: number;
}
