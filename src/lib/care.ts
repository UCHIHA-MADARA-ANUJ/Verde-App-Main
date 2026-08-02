// ============================================================================
// VERDE OS — Plant Care Logic / Recommendations Engine
// Pure functions that analyze sensor data + plant profiles to generate advice.
// ============================================================================
import type { Sensors, Controls, PlantProfile, Weather } from "@/types";

export interface CareRecommendation {
  id: string;
  level: "info" | "ok" | "warn" | "err";
  icon: string;
  title: string;
  body: string;
  action?: { label: string; key: string; payload?: any };
}

export function generateRecommendations(
  sensors: Sensors,
  controls: Controls,
  weather: Weather | null,
  plants: PlantProfile[]
): CareRecommendation[] {
  const recs: CareRecommendation[] = [];
  const m = sensors.moisture, t = sensors.temperature, h = sensors.humidity;
  const tank = sensors.tank_level, lux = sensors.lux;
  const moistTh = controls.moisture_threshold ?? 35;
  const tankTh = controls.tank_threshold ?? 15;
  const rain = weather?.rain_expected || controls.weather_override === 1;

  // ---- Watering ----
  if (rain) {
    recs.push({
      id: "rain-hold", level: "warn", icon: "☔",
      title: "Watering paused — rain incoming",
      body: `Forecast shows ${weather?.description || "rain"}. Auto-watering is suspended. Override with the toggle if needed.`,
    });
  } else if (m != null && m < moistTh - 5) {
    const deficit = Math.round(moistTh - m);
    recs.push({
      id: "water-now", level: "err", icon: "💦",
      title: "Soil is dry",
      body: `Moisture is ${m}% (${deficit}% below your ${moistTh}% threshold). ${controls.manual_mode ? "Pump is in MANUAL mode — toggle pump ON." : "AUTO should start the pump if tank is safe."}`,
      action: controls.manual_mode ? { label: "Turn pump ON", key: "pump_on", payload: true } : undefined,
    });
  } else if (m != null && m > 80) {
    recs.push({
      id: "overwater", level: "warn", icon: "💧",
      title: "Soil very wet",
      body: `Moisture ${m}% — risk of root rot. Hold off watering and consider improving drainage.`,
    });
  } else if (m != null) {
    recs.push({
      id: "moisture-ok", level: "ok", icon: "💧",
      title: "Moisture healthy",
      body: `Soil moisture ${m}% is within your target range.`,
    });
  }

  // ---- Tank ----
  if (tank != null && tankTh > 0 && tank < tankTh) {
    recs.push({
      id: "tank-low", level: "err", icon: "🛢️",
      title: "Reservoir low",
      body: `Tank is at ${tank}%, below your ${tankTh}% lock threshold. Pump is disabled. Refill soon.`,
    });
  } else if (tank != null && tankTh > 0 && tank < tankTh + 15) {
    recs.push({
      id: "tank-soon", level: "warn", icon: "🛢️",
      title: "Reservoir getting low",
      body: `Tank is ${tank}% — consider refilling soon.`,
    });
  } else if (tank != null) {
    recs.push({
      id: "tank-ok", level: "ok", icon: "🛢️",
      title: "Reservoir OK", body: `Tank at ${tank}%.`,
    });
  }

  // ---- Temperature ----
  if (t != null && t > 38) {
    recs.push({
      id: "hot", level: "err", icon: "🌡️",
      title: "High temperature stress",
      body: `${t}°C is too hot for most plants. Move away from direct sun, increase ventilation, mist leaves.`,
    });
  } else if (t != null && t < 10) {
    recs.push({
      id: "cold", level: "err", icon: "❄️",
      title: "Cold stress",
      body: `${t}°C is too cold. Move plant indoors or add heat.`,
    });
  } else if (t != null) {
    recs.push({
      id: "temp-ok", level: "ok", icon: "🌡️",
      title: "Temperature healthy", body: `${t}°C is within range.`,
    });
  }

  // ---- Humidity ----
  if (h != null && h < 30) {
    recs.push({
      id: "dry-air", level: "warn", icon: "💨",
      title: "Air too dry",
      body: `Humidity ${h}% — most tropical plants want 50%+. Consider a humidifier or pebble tray.`,
    });
  } else if (h != null && h > 85) {
    recs.push({
      id: "humid", level: "warn", icon: "💦",
      title: "High humidity",
      body: `Humidity ${h}% — risk of fungal disease. Increase airflow.`,
    });
  }

  // ---- Light ----
  if (lux != null) {
    const luxPct = lux/10;
    if (luxPct < 20 && !controls.light_manual_mode) {
      recs.push({
        id: "dark", level: "warn", icon: "💡",
        title: "Low light",
        body: `Lux reading ${lux} is dark — grow light should be on (AUTO: threshold ${controls.light_threshold}%).`,
      });
    }
  }

  // ---- Plant-specific ----
  plants.forEach(p => {
    const daysSince = Math.floor((Date.now() - p.wateredAt) / 86400000);
    if (p.wateringIntervalDays && daysSince >= p.wateringIntervalDays) {
      recs.push({
        id: `plant-${p.id}-water`, level: "warn", icon: p.emoji || "🌱",
        title: `${p.name} needs water`,
        body: `Last watered ${daysSince} days ago${p.wateringIntervalDays?` (schedule: every ${p.wateringIntervalDays} days)`:""}.`,
        action: { label: "Mark watered", key: "water_plant", payload: p.id },
      });
    }
  });

  // ---- Uptime / connection ----
  if (sensors.voltage_sag != null && sensors.voltage_sag < 4.3) {
    recs.push({
      id: "voltage", level: "err", icon: "⚡",
      title: "Low voltage",
      body: `Reading ${sensors.voltage_sag}V — check power supply to ESP32.`,
    });
  }

  return recs;
}

// ---- Health score computation (0-100) ----
export function computeHealthScore(sensors: Sensors, controls: Controls): number {
  let score = 100;
  const m = sensors.moisture, t = sensors.temperature, h = sensors.humidity, tank = sensors.tank_level;
  const moistTh = controls.moisture_threshold ?? 35;
  if (m != null) {
    if (m < moistTh - 10) score -= 25;
    else if (m < moistTh - 5) score -= 12;
    else if (m > 90) score -= 15;
    else if (m > 80) score -= 8;
  }
  if (t != null) {
    if (t > 40) score -= 25;
    else if (t > 35) score -= 12;
    else if (t < 5) score -= 25;
    else if (t < 10) score -= 12;
  }
  if (h != null) {
    if (h < 25) score -= 10;
    else if (h > 90) score -= 10;
  }
  if (tank != null && (controls.tank_threshold ?? 15) > 0) {
    if (tank < (controls.tank_threshold ?? 15)) score -= 20;
  }
  if (sensors.voltage_sag != null && sensors.voltage_sag < 4.2) score -= 15;
  return Math.max(0, Math.min(100, score));
}

// ---- Care schedule: next watering estimate ----
export function estimateNextWatering(
  sensors: Sensors,
  controls: Controls,
  weather: Weather | null
): { estimateHours: number; confidence: "low"|"med"|"high"; reason: string } {
  const m = sensors.moisture ?? 50;
  const moistTh = controls.moisture_threshold ?? 35;
  const h = sensors.humidity ?? 60;
  const t = sensors.temperature ?? 25;

  if (weather?.rain_expected) {
    return { estimateHours: 0, confidence: "high", reason: "Rain forecast — watering paused." };
  }
  // Rough model: soil dries ~X% per hour based on temp, humidity
  const dryRate = (0.5 + ((t - 20) * 0.04)) * (1 - (h-30)/140);
  const dryRateClamped = Math.max(0.1, Math.min(4, dryRate));
  const deficit = m - moistTh;
  if (deficit <= 0) {
    return { estimateHours: 0, confidence: "high", reason: `Soil already at ${m}% (below ${moistTh}%). Water now.` };
  }
  const hours = Math.round(deficit / dryRateClamped);
  const conf = m != null && t != null && h != null ? "med" : "low";
  return {
    estimateHours: hours,
    confidence: conf,
    reason: `At current drying rate (${dryRateClamped.toFixed(1)}%/hr, ${t}°C, ${h}% RH), moisture will hit ${moistTh}% in ~${hours}h.`,
  };
}
