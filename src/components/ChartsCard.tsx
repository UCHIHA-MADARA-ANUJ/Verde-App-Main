"use client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from "recharts";
import { TrendingUp } from "lucide-react";
import type { SensorHistoryPoint } from "@/types";

export function ChartsCard({ history }: { history: SensorHistoryPoint[] }) {
  // reverse so oldest first; downsample to ~30 points
  const data = history.slice(-60).map((p, i) => ({
    i,
    t: new Date(p.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }),
    moisture: p.moisture,
    temp: p.temperature,
    humidity: p.humidity,
    tank: p.tank_level,
    lux: p.lux ? Math.round(p.lux / 10) : undefined,
  }));

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="flex items-center gap-2 font-mono text-xs font-bold tracking-widest uppercase text-sky">
          <TrendingUp className="w-3.5 h-3.5" /> Live Sensor History
        </h2>
        <span className="badge badge-sky">{data.length} pts</span>
      </div>
      <div className="h-48 -ml-2">
        {data.length < 2 ? (
          <div className="w-full h-full flex items-center justify-center font-mono text-xs text-slate-600">
            collecting telemetry…
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="g-moist" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.4}/>
                  <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="g-temp" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.4}/>
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="g-hum" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity={0.3}/>
                  <stop offset="100%" stopColor="#a855f7" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 4" stroke="#1a2233" />
              <XAxis dataKey="t" tick={{ fill: "#475569", fontSize: 9, fontFamily: "JetBrains Mono" }} axisLine={{ stroke: "#1a2233" }} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fill: "#475569", fontSize: 9, fontFamily: "JetBrains Mono" }} axisLine={{ stroke: "#1a2233" }} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "#0b0e17", border: "1px solid #253048", borderRadius: 8, fontSize: 11, fontFamily: "JetBrains Mono" }}
                labelStyle={{ color: "#94a3b8" }}
              />
              <Legend wrapperStyle={{ fontSize: 10, fontFamily: "JetBrains Mono" }} iconSize={8} />
              <Area type="monotone" dataKey="moisture" name="moisture %" stroke="#0ea5e9" fill="url(#g-moist)" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Area type="monotone" dataKey="humidity" name="humidity %" stroke="#a855f7" fill="url(#g-hum)" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Area type="monotone" dataKey="temp" name="temp °C" stroke="#f59e0b" fill="url(#g-temp)" strokeWidth={2} dot={false} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
