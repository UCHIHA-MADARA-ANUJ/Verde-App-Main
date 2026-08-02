"use client";
import { useVerdeStore } from "@/store/verde-store";
import { computeHealthScore } from "@/lib/care";
import { Card, CardHeader, CardTitle } from "./ui/Card";
import { Activity } from "lucide-react";
import { Badge } from "./ui/Badge";

export function HealthGauge() {
  const sensors = useVerdeStore(s => s.sensors);
  const controls = useVerdeStore(s => s.controls);
  const score = computeHealthScore(sensors, controls);
  let label = "Critical", color = "red", deg = 0;
  if (score >= 85) { label = "Excellent"; color = "green"; deg = 180; }
  else if (score >= 70) { label = "Good"; color = "green"; deg = 126 + (score-70)*1.8; }
  else if (score >= 50) { label = "Fair"; color = "amber"; deg = 90 + (score-50)*1.8; }
  else if (score >= 30) { label = "Poor"; color = "amber"; deg = 54 + (score-30)*1.8; }
  else { label = "Critical"; color = "red"; deg = score * 1.8; }

  const strokeColor = color === "green" ? "#22c55e" : color === "amber" ? "#f59e0b" : "#ef4444";

  return (
    <Card accent={color as any}>
      <CardHeader>
        <CardTitle icon={Activity} color={color as any}>Plant Health Score</CardTitle>
        <Badge color={color as any}>{label}</Badge>
      </CardHeader>
      <div className="flex items-center justify-center py-4">
        <div className="relative w-44 h-24 overflow-hidden">
          <svg viewBox="0 0 200 110" className="w-full h-full">
            <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#1a2233" strokeWidth="14" strokeLinecap="round"/>
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke={strokeColor}
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray="251.3"
              strokeDashoffset={251.3 - (251.3 * score / 100)}
              style={{
                filter: `drop-shadow(0 0 8px ${strokeColor})`,
                transition: "stroke-dashoffset 1s ease-out",
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
            <div className="font-mono font-bold text-4xl tabular-nums" style={{ color: strokeColor }}>{score}</div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-slate-500">/ 100</div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
        <div><div className="text-slate-500">WATER</div><div className={sensors.moisture != null && sensors.moisture >= (controls.moisture_threshold??35) ? "text-green-glow" : "text-amber"}>{sensors.moisture ?? "--"}%</div></div>
        <div><div className="text-slate-500">TEMP</div><div className={sensors.temperature != null && sensors.temperature >= 15 && sensors.temperature <= 32 ? "text-green-glow" : "text-amber"}>{sensors.temperature ?? "--"}°C</div></div>
        <div><div className="text-slate-500">TANK</div><div className={sensors.tank_level != null && sensors.tank_level >= (controls.tank_threshold??15) ? "text-green-glow" : "text-red"}>{sensors.tank_level ?? "--"}%</div></div>
      </div>
    </Card>
  );
}
