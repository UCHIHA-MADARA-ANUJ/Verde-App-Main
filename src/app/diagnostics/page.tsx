"use client";
import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useVerdeStore } from "@/store/verde-store";
import { checkApiHealth, fetchWeather } from "@/lib/services";
import { useState } from "react";
import { Activity, RefreshCw } from "lucide-react";
import { formatRelative } from "@/lib/utils";

export default function DiagnosticsPage() {
  const logs = useVerdeStore(s => s.logs);
  const sensors = useVerdeStore(s => s.sensors);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const connStatus = useVerdeStore(s => s.connStatus);

  async function runDiagnostics() {
    setRunning(true); setResults([]);
    const checks: any[] = [];
    const apis: Array<["firebase"|"weather"|"gemini"|"router",string]> = [
      ["firebase","Firebase RTDB"], ["weather","OpenWeather API"],
      ["gemini","Gemini Vision"], ["router","OpenRouter"],
    ];
    for (const [key, label] of apis) {
      setResults(r => [...r, { key, label, status: "running" }]);
      const res = await checkApiHealth(key);
      setResults(r => r.map(x => x.key === key ? { ...x, ...res, label, status: res.ok ? "ok" : "err" } : x));
    }
    setRunning(false);
  }

  const sensorEntries = Object.entries(sensors).filter(([,v]) => typeof v === "number");

  return (
    <AppShell>
      <Header />
      <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">🩺 Diagnostics</h1>
            <p className="text-slate-500 font-mono text-xs mt-1">API health checks, sensor snapshot, system logs.</p>
          </div>
          <Button variant="green" onClick={runDiagnostics} disabled={running}>
            <RefreshCw className={`w-3.5 h-3.5 ${running?"animate-spin":""}`} /> {running?"RUNNING…":"RUN DIAGNOSTICS"}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Card accent={connStatus==="live"?"green":"red"}>
            <CardHeader>
              <CardTitle icon={Activity} color={connStatus==="live"?"green":"red"}>API Health</CardTitle>
              <Badge color={running?"amber":results.length&&results.every(r=>r.ok)?"green":"slate"} dot={running} pulse={running}>
                {running?"running…":results.length?`${results.filter(r=>r.ok).length}/${results.length} ok`:"idle"}
              </Badge>
            </CardHeader>
            {results.length === 0 && !running && (
              <div className="text-center py-10 font-mono text-xs text-slate-600">
                Click &quot;RUN DIAGNOSTICS&quot; to check all APIs.
              </div>
            )}
            <div className="space-y-2">
              {results.map(r => (
                <div key={r.key} className="flex items-center justify-between p-3 rounded-lg bg-black/30 border border-border">
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${r.status==="ok"?"bg-green":r.status==="running"?"bg-amber animate-pulse":"bg-red"}`} />
                    <span className="text-sm font-medium">{r.label}</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-[11px]">
                    {r.latencyMs != null && <span className="text-slate-400">{r.latencyMs}ms</span>}
                    {r.status === "ok" ? <span className="text-green-glow">✓ OK</span>
                     : r.status === "running" ? <span className="text-amber">…</span>
                     : <span className="text-red">✗ {r.error?.slice(0,40) || "fail"}</span>}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card accent="sky">
            <CardHeader><CardTitle color="sky">Sensor Snapshot</CardTitle></CardHeader>
            <div className="grid grid-cols-2 gap-2">
              {sensorEntries.length === 0 && <div className="col-span-2 text-center py-10 font-mono text-xs text-slate-600">Waiting for sensor data…</div>}
              {sensorEntries.map(([k,v]) => (
                <div key={k} className="flex items-center justify-between p-2 rounded bg-black/30 border border-border">
                  <span className="font-mono text-[11px] text-slate-400 uppercase">{k.replace(/_/g," ")}</span>
                  <span className="font-mono text-sm font-bold text-slate-200 tabular-nums">{v}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle color="sky">System Logs ({logs.length})</CardTitle></CardHeader>
          <div className="max-h-96 overflow-y-auto font-mono text-[11px]">
            {logs.slice(-200).reverse().map(l => (
              <div key={l.id} className="flex gap-3 py-1 border-b border-border/30">
                <span className="text-slate-600 w-24 flex-shrink-0">{formatRelative(l.ts)}</span>
                <span className={`w-12 uppercase text-[10px] ${
                  l.level==="err"?"text-red":l.level==="warn"?"text-amber":l.level==="ok"?"text-green-glow":"text-slate-400"
                }`}>[{l.level}]</span>
                <span className="text-purple-glow/80 w-24 flex-shrink-0">{l.source}</span>
                <span className="text-slate-300 flex-1">{l.message}</span>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>
    </AppShell>
  );
}
