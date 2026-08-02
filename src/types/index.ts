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
  [k: string]: any;
}

export interface LatestScan {
  imageUrl?: string;
  timestamp?: number;
  [k: string]: any;
}

export interface Weather {
  city?: string;
  temp?: number;
  condition?: string;
  description?: string;
  humidity?: number;
  wind_speed?: number;
  rain_expected?: boolean;
  status?: string;
  synced_at?: number;
}

export interface AppState {
  sensors: Sensors;
  controls: Controls;
  latest_scan: LatestScan;
  weather: Weather;
}

export interface PlantResult {
  name: string;
  prob: number;
  common?: string;
  disease?: { name: string; prob: number; treatment?: string };
  details?: any;
}

export interface VerdeImage {
  dataUrl: string;
  source: "cam" | "user" | "device";
  name: string;
  ts: number;
}

export interface HistoryItem {
  id: string;
  image: VerdeImage;
  result?: PlantResult;
  ts: number;
}

export interface SensorHistoryPoint {
  ts: number;
  moisture?: number;
  temperature?: number;
  humidity?: number;
  tank_level?: number;
  lux?: number;
}
