// ============================================================================
// VERDE OS — Achievement / Badge System
// Unlocks based on app usage, scan count, plant care, etc.
// ============================================================================
import type { Achievement } from "@/types";
import type { AppState, HistoryItem, PlantProfile, AppLog } from "@/types";

export const ACHIEVEMENTS: Omit<Achievement, "unlocked"|"unlockedAt"|"progress">[] = [
  { id: "first-scan", title: "First Look", description: "Run your first plant analysis", icon: "🔬", target: 1 },
  { id: "ten-scans", title: "Green Thumb", description: "Analyse 10 plants", icon: "🌿", target: 10 },
  { id: "fifty-scans", title: "Plant Doctor", description: "Analyse 50 plants", icon: "🩺", target: 50 },
  { id: "hundred-scans", title: "Master Botanist", description: "Analyse 100 plants", icon: "🏆", target: 100 },
  { id: "first-plant", title: "Plant Parent", description: "Add your first plant profile", icon: "🌱", target: 1 },
  { id: "five-plants", title: "Jungle Owner", description: "Track 5 plants", icon: "🌴", target: 5 },
  { id: "water-first", title: "Thirst Quenched", description: "Water a plant for the first time", icon: "💧", target: 1 },
  { id: "weather-save", title: "Rain Saver", description: "Auto-override triggers because of rain forecast", icon: "☔", target: 1 },
  { id: "healthy-week", title: "Streak: Healthy Week", description: "7 days of healthy readings", icon: "📈", target: 7 },
  { id: "all-apis", title: "Full Stack", description: "All APIs respond successfully", icon: "⚡", target: 1 },
  { id: "night-owl", title: "Night Shift", description: "Use VERDE OS after midnight", icon: "🦉", target: 1 },
  { id: "chat-10", title: "Curious Mind", description: "Send 10 AI chat messages", icon: "🧠", target: 10 },
];

export function computeAchievements(ctx: {
  history: HistoryItem[];
  plants: PlantProfile[];
  waterings: number;
  chatCount: number;
  rainOverrideTrips: number;
  allApisOk: boolean;
}) : Achievement[] {
  return ACHIEVEMENTS.map(a => {
    let progress = 0;
    let unlocked = false;
    switch(a.id) {
      case "first-scan": case "ten-scans": case "fifty-scans": case "hundred-scans":
        progress = Math.min(a.target!, ctx.history.length);
        unlocked = ctx.history.length >= a.target!; break;
      case "first-plant": case "five-plants":
        progress = Math.min(a.target!, ctx.plants.length);
        unlocked = ctx.plants.length >= a.target!; break;
      case "water-first":
        progress = Math.min(a.target!, ctx.waterings);
        unlocked = ctx.waterings >= a.target!; break;
      case "weather-save":
        progress = Math.min(a.target!, ctx.rainOverrideTrips);
        unlocked = ctx.rainOverrideTrips >= a.target!; break;
      case "chat-10":
        progress = Math.min(a.target!, ctx.chatCount);
        unlocked = ctx.chatCount >= a.target!; break;
      case "all-apis":
        progress = ctx.allApisOk ? 1 : 0;
        unlocked = ctx.allApisOk; break;
      case "night-owl": {
        const h = new Date().getHours();
        unlocked = h >= 0 && h < 5;
        progress = unlocked ? 1 : 0;
        break;
      }
      case "healthy-week": progress = 0; unlocked = false; break;
    }
    return { ...a, unlocked, progress, unlockedAt: unlocked ? Date.now() : undefined };
  });
}
