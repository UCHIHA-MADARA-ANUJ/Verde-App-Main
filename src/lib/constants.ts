// ============================================================================
// VERDE OS — App-wide constants
// ============================================================================

export const APP_VERSION = "2.0.0";
export const APP_NAME = "VERDE OS";
export const APP_TAGLINE = "plant · mission · control";

export const DEFAULT_THRESHOLDS = {
  moisture: 35,
  tank: 15,
  light: 35,
  temp_min: 10,
  temp_max: 38,
  humid_min: 30,
  humid_max: 85,
  pump_duration_s: 10,
};

export const SENSOR_LABELS: Record<string, { label: string; unit: string; icon: string; color: string }> = {
  moisture:     { label: "Soil Moisture",   unit: "%",   icon: "💧", color: "sky" },
  temperature:  { label: "Temperature",     unit: "°C",  icon: "🌡️", color: "amber" },
  humidity:     { label: "Humidity",        unit: "%",   icon: "💨", color: "sky" },
  tank_level:   { label: "Tank Level",      unit: "%",   icon: "🛢️", color: "green" },
  lux:          { label: "Light (Lux)",     unit: "lx",  icon: "☀️", color: "amber" },
  light:        { label: "Light %",         unit: "%",   icon: "💡", color: "purple" },
  voltage_sag:  { label: "Voltage",         unit: "V",   icon: "⚡", color: "green" },
  soil_ph:      { label: "Soil pH",         unit: "pH",  icon: "🧪", color: "purple" },
  co2:          { label: "CO₂",             unit: "ppm", icon: "🌫️", color: "amber" },
  pressure:     { label: "Pressure",        unit: "hPa", icon: "📊", color: "sky" },
};

export const PLANT_CARE_LIBRARY = [
  { name: "Tulsi (Holy Basil)", species: "Ocimum tenuiflorum", water_days: "1-2", light: "full sun", notes: "Keep moist, warm, 6+ hours sun." },
  { name: "Mint", species: "Mentha", water_days: "1-2", light: "partial sun", notes: "Loves water, grows aggressively." },
  { name: "Monstera", species: "Monstera deliciosa", water_days: "7-10", light: "bright indirect", notes: "Let top 2 inches dry out." },
  { name: "Snake Plant", species: "Sansevieria trifasciata", water_days: "14-21", light: "low to bright", notes: "Very drought tolerant." },
  { name: "Pothos", species: "Epipremnum aureum", water_days: "7-10", light: "low to bright indirect", notes: "Hard to kill." },
  { name: "Basil", species: "Ocimum basilicum", water_days: "1-2", light: "full sun", notes: "Keep soil damp, not soggy." },
  { name: "Tomato", species: "Solanum lycopersicum", water_days: "2-3", light: "full sun", notes: "Deep waterings, consistent moisture." },
  { name: "Rose", species: "Rosa", water_days: "2-3", light: "full sun", notes: "Water at base, avoid leaves." },
  { name: "Succulent", species: "Various", water_days: "10-14", light: "bright", notes: "Drench, then fully dry." },
  { name: "Orchid", species: "Orchidaceae", water_days: "7", light: "bright indirect", notes: "Ice cube a week or soak." },
  { name: "Aloe Vera", species: "Aloe barbadensis", water_days: "14-21", light: "bright", notes: "Drought tolerant." },
  { name: "Peace Lily", species: "Spathiphyllum", water_days: "5-7", light: "low to medium", notes: "Droops when thirsty." },
];

export const DISEASE_TIPS: Record<string, string> = {
  "powdery mildew": "Improve airflow, avoid wetting leaves, apply neem oil.",
  "leaf spot": "Remove affected leaves, reduce overhead watering, fungicide if severe.",
  "rust": "Remove infected leaves, improve air circulation, sulfur spray.",
  "aphids": "Spray with soapy water, introduce ladybugs, neem oil.",
  "spider mites": "Increase humidity, spray with water, neem oil.",
  "whitefly": "Yellow sticky traps, insecticidal soap, reflective mulch.",
  "root rot": "Repot with fresh dry soil, cut away rotted roots, reduce watering.",
  "blight": "Remove infected parts, copper fungicide, crop rotation.",
  "healthy": "This plant looks healthy — maintain current care routine.",
};

export const WEATHER_TIPS: Record<string, string> = {
  "rain": "Rain expected — auto-override will suspend watering to avoid overwatering.",
  "clear": "Clear skies — check moisture levels as plants may dry faster.",
  "clouds": "Cloudy — evaporation slows; monitor soil before watering.",
  "thunderstorm": "Storm incoming — watering suspended, secure outdoor plants.",
  "snow": "Freezing — protect sensitive plants, bring indoors.",
  "drizzle": "Light rain — auto-override ON, enjoy the free water.",
  "mist": "Misty/Foggy — high humidity; fungal watch; ventilation recommended.",
  "haze": "Poor air quality — consider bringing sensitive plants indoors.",
};

export const KEYBOARD_SHORTCUTS = [
  { keys: ["?"], action: "Show help / shortcuts" },
  { keys: ["/"], action: "Focus chat input" },
  { keys: ["r"], action: "Refresh weather" },
  { keys: ["t"], action: "Trigger camera capture" },
  { keys: ["Escape"], action: "Close modal" },
  { keys: ["s"], action: "Toggle sidebar" },
  { keys: ["m"], action: "Mute/unmute sound" },
];
