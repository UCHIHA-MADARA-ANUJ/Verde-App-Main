"use client";
import { Leaf, Volume2, VolumeX, Bell, BellOff, Wifi, WifiOff, Activity } from "lucide-react";
import { useEffect, useState } from "react";
import { useVerdeStore } from "@/store/verde-store";
import { Button } from "@/components/ui/Button";
import { LiveDot, Badge } from "@/components/ui/Badge";
import { requestNotifyPermission } from "@/lib/notify";
import { setMuted, sfx } from "@/lib/sound";

export function Header() {
  const [clock, setClock] = useState("");
  const connStatus = useVerdeStore(s => s.connStatus);
  const sound = useVerdeStore(s => s.settings.soundEnabled);
  const fps = useVerdeStore(s => s.fps);
  const showFPS = useVerdeStore(s => s.settings.showFPS);
  const updateSettings = useVerdeStore(s => s.updateSettings);
  const pollCount = useVerdeStore(s => s.pollCount);
  const pushNotification = useVerdeStore(s => s.pushNotification);
  const [notifOn, setNotifOn] = useState(false);

  useEffect(() => {
    setMuted(!sound);
  }, [sound]);

  useEffect(() => {
    setNotifOn(typeof Notification !== "undefined" && Notification.permission === "granted");
    const t = setInterval(() => {
      const d = new Date();
      setClock(d.toLocaleTimeString([], { hour12: false }) + " · " + d.toLocaleDateString([], { month: "short", day: "numeric", weekday: "short" }));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const toggleSound = () => {
    const next = !sound;
    updateSettings({ soundEnabled: next });
    if (next) sfx.click();
  };

  const toggleNotif = async () => {
    if (notifOn) return;
    const ok = await requestNotifyPermission();
    setNotifOn(ok);
    if (ok) {
      sfx.success();
      pushNotification({ level: "ok", title: "Notifications enabled", body: "VERDE OS will alert you about plant health." });
    }
  };

  const label = {
    live: "FIREBASE LIVE",
    off: "OFFLINE",
    connecting: "CONNECTING",
    error: "ERROR",
  }[connStatus];

  return (
    <header className="glass-card scanlines p-5 mb-5 flex items-center justify-between flex-wrap gap-4">
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green to-purple flex items-center justify-center shadow-lg shadow-green/20">
            <Leaf className="text-black w-6 h-6" strokeWidth={2.5} />
          </div>
          <div className="absolute -top-0.5 -right-0.5">
            <LiveDot status={connStatus as any} />
          </div>
        </div>
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">
            PROJECT <span className="glow-green text-green-glow">VERDE</span> <span className="glow-purple text-purple-glow">OS</span>
          </h1>
          <div className="font-mono text-[11px] text-slate-500">
            plant-doctor · gemini-vision · openrouter · {clock}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {showFPS && (
          <Badge color="slate" dot>
            <Activity className="w-3 h-3" /> {fps} fps · polls:{pollCount}
          </Badge>
        )}
        <Button variant="outline" size="sm" onClick={toggleNotif} noSfx>
          {notifOn ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
          <span className="hidden md:inline">{notifOn ? "ALERTS ON" : "ALERTS OFF"}</span>
        </Button>
        <Button variant="outline" size="sm" onClick={toggleSound} noSfx>
          {sound ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          <span className="hidden md:inline">{sound ? "SOUND" : "MUTED"}</span>
        </Button>
        <div className={`flex items-center gap-2 px-4 h-9 rounded-lg border ${
          connStatus === "live" ? "border-green/30 bg-green/5"
          : connStatus === "off" ? "border-red/30 bg-red/5"
          : "border-amber/30 bg-amber/5"
        }`}>
          {connStatus === "off" ? <WifiOff className="w-3.5 h-3.5 text-red" /> : <Wifi className={`w-3.5 h-3.5 ${connStatus==="live"?"text-green-glow":"text-amber"}`} />}
          <span className={`font-mono text-[11px] font-bold uppercase tracking-wider ${
            connStatus==="live"?"text-green-glow":connStatus==="off"?"text-red":"text-amber"
          }`}>● {label}</span>
        </div>
      </div>
    </header>
  );
}
