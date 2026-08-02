"use client";
import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Switch } from "@/components/ui/Switch";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Terminal";
import { useVerdeStore } from "@/store/verde-store";
import { useState } from "react";
import { Settings as SettingsIcon, RotateCcw, Download, Trash2 } from "lucide-react";
import { downloadJSON, copyToClipboard } from "@/lib/utils";
import { requestNotifyPermission } from "@/lib/notify";
import { sfx } from "@/lib/sound";

export default function SettingsPage() {
  const s = useVerdeStore(st => st.settings);
  const update = useVerdeStore(st => st.updateSettings);
  const reset = useVerdeStore(st => st.resetSettings);
  const resetApp = useVerdeStore(st => st.resetApp);
  const startTour = useVerdeStore(st => st.startTour);
  const history = useVerdeStore(st => st.history);
  const plants = useVerdeStore(st => st.plants);
  const logs = useVerdeStore(st => st.logs);
  const [notifStatus, setNotifStatus] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "denied"
  );

  async function enableNotifs() {
    const ok = await requestNotifyPermission();
    setNotifStatus(ok ? "granted" : "denied");
    if (ok) sfx.success();
  }

  function exportData() {
    downloadJSON({
      settings: s, history, plants, logs,
      exportedAt: new Date().toISOString(), version: "2.0.0",
    }, `verde-backup-${Date.now()}.json`);
    sfx.success();
  }

  function doReset() {
    if (confirm("Reset all settings to defaults?")) { reset(); sfx.success(); }
  }

  function doResetAll() {
    if (confirm("WIPE EVERYTHING — history, plants, settings? This cannot be undone.")) {
      resetApp(); location.reload();
    }
  }

  return (
    <AppShell>
      <Header />
      <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="space-y-5 max-w-3xl">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight flex items-center gap-3">
            <SettingsIcon className="w-7 h-7" /> Settings
          </h1>
          <p className="text-slate-500 font-mono text-xs mt-1">Configure VERDE OS to your liking.</p>
        </div>

        <Card>
          <CardHeader><CardTitle color="green">System</CardTitle></CardHeader>
          <div className="space-y-4">
            <Toggle label="Boot sequence" sub="Play the startup animation on load"
              checked={s.bootSequenceEnabled} onChange={v => update({ bootSequenceEnabled: v })} />
            <Toggle label="Sound effects" sub="Clicks, success, alerts, boot chime"
              checked={s.soundEnabled} onChange={v => update({ soundEnabled: v })} />
            <Toggle label="Show FPS counter" sub="Display FPS + poll count in header"
              checked={s.showFPS} onChange={v => update({ showFPS: v })} />
            <Toggle label="Compact mode" sub="Denser UI spacing"
              checked={s.compactMode} onChange={v => update({ compactMode: v })} />
            <Toggle label="Reduce motion" sub="Disables entrance animations"
              checked={s.reduceMotion} onChange={v => update({ reduceMotion: v })} />
            <Toggle label="Pause telemetry polling"
              checked={s.telemetryPaused} onChange={v => update({ telemetryPaused: v })} />
          </div>
        </Card>

        <Card>
          <CardHeader><CardTitle color="sky">Notifications</CardTitle></CardHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm">Browser Notifications</div>
                <div className="text-[10px] text-slate-500 font-mono">Status: {notifStatus}</div>
              </div>
              <Button variant={notifStatus==="granted"?"green":"purple"} size="sm" onClick={enableNotifs} disabled={notifStatus==="granted"}>
                {notifStatus==="granted" ? "✓ ENABLED" : "ENABLE"}
              </Button>
            </div>
            <Toggle label="Sound alerts" sub="Play sound for errors/warnings"
              checked={s.soundEnabled} onChange={v => update({ soundEnabled: v })} />
          </div>
        </Card>

        <Card>
          <CardHeader><CardTitle color="purple">Polling & Timing</CardTitle></CardHeader>
          <div className="space-y-3">
            <NumberField label="Firebase poll interval (ms)" sub="How often to fetch sensor data"
              value={s.pollIntervalMs} min={500} max={10000} step={500}
              onChange={v => update({ pollIntervalMs: v })} />
            <NumberField label="Weather check interval (minutes)"
              value={s.weatherIntervalMinutes} min={1} max={60} step={1}
              onChange={v => update({ weatherIntervalMinutes: v })} />
            <NumberField label="History items to keep"
              value={s.historyMaxItems} min={10} max={200} step={10}
              onChange={v => update({ historyMaxItems: v })} />
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm">City (weather)</div>
                <div className="text-[10px] text-slate-500 font-mono">OpenWeather location query</div>
              </div>
              <Input className="w-40" value={s.city} onChange={e => update({ city: e.target.value })} />
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader><CardTitle color="amber">Thresholds & Alerts</CardTitle></CardHeader>
          <div className="space-y-3">
            <NumberField label="Low tank alert %" sub="Alert below this %"
              value={s.lowTankAlertPercent} min={0} max={50} step={5}
              onChange={v => update({ lowTankAlertPercent: v })} />
            <NumberField label="Dry soil margin %"
              value={s.drySoilAlertMargin} min={0} max={20} step={1}
              onChange={v => update({ drySoilAlertMargin: v })} />
            <NumberField label="High temp alert (°C)"
              value={s.highTempAlertC} min={25} max={60} step={1}
              onChange={v => update({ highTempAlertC: v })} />
            <NumberField label="Low temp alert (°C)"
              value={s.lowTempAlertC} min={-10} max={20} step={1}
              onChange={v => update({ lowTempAlertC: v })} />
            <Toggle label="Enable rain override"
              sub="Auto-suspend watering when rain forecast"
              checked={s.enableRainOverride} onChange={v => update({ enableRainOverride: v })} />
          </div>
        </Card>

        <Card>
          <CardHeader><CardTitle color="green">Plant Doctor</CardTitle></CardHeader>
          <div className="space-y-4">
            <Toggle label="Auto-analyse uploads" sub="Immediately identify plants after upload"
              checked={s.autoAnalyseUploads} onChange={v => update({ autoAnalyseUploads: v })} />
            <Toggle label="Auto-analyse ESP32 photos"
              checked={s.autoAnalyseCam} onChange={v => update({ autoAnalyseCam: v })} />
            <Toggle label="Auto-open analysis modal"
              checked={s.autoOpenModalOnAnalysis} onChange={v => update({ autoOpenModalOnAnalysis: v })} />
          </div>
        </Card>

        <Card>
          <CardHeader><CardTitle color="sky">About & Data</CardTitle></CardHeader>
          <div className="space-y-3 font-mono text-xs text-slate-400 mb-4">
            <div>VERDE OS v2.0.0</div>
            <div>Build: Next.js 14 + TypeScript + Tailwind + Framer Motion + Zustand</div>
            <div>APIs: Firebase RTDB · OpenWeather · Gemini 2.0 Flash · OpenRouter (6 models) · Plant.id/Crop.health</div>
            <div className="flex gap-2 pt-2">
              <Badge color="green">{history.length} scans</Badge>
              <Badge color="purple">{plants.length} plants</Badge>
              <Badge color="sky">{logs.length} logs</Badge>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="green" onClick={startTour}><RotateCcw className="w-3.5 h-3.5"/>REPLAY TOUR</Button>
            <Button variant="sky" onClick={exportData}><Download className="w-3.5 h-3.5"/>EXPORT DATA</Button>
            <Button variant="amber" onClick={doReset}>RESET SETTINGS</Button>
            <Button variant="red" onClick={doResetAll}><Trash2 className="w-3.5 h-3.5"/>WIPE ALL DATA</Button>
          </div>
        </Card>
      </motion.div>
    </AppShell>
  );
}

function Toggle({ label, sub, checked, onChange }: { label: string; sub?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="text-sm">{label}</div>
        {sub && <div className="text-[10px] text-slate-500 font-mono">{sub}</div>}
      </div>
      <Switch checked={checked} onChange={onChange} />
    </div>
  );
}

function NumberField({ label, sub, value, min, max, step, onChange }: {
  label: string; sub?: string; value: number; min?: number; max?: number; step?: number; onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="text-sm">{label}</div>
        {sub && <div className="text-[10px] text-slate-500 font-mono">{sub}</div>}
      </div>
      <input type="number" value={value} min={min} max={max} step={step}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-24 bg-[#080c15] border border-border rounded-lg px-3 py-1.5 font-mono text-sm text-right outline-none focus:border-green" />
    </div>
  );
}
