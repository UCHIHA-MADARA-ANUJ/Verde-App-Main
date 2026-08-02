"use client";
import { Leaf, Volume2, VolumeX, Bell, BellOff, Wifi, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { sfx, requestNotifyPermission } from "@/lib/verde";

export function Header({ connStatus, mute, setMute }: {
  connStatus: "connecting" | "live" | "off";
  mute: boolean;
  setMute: (v: boolean) => void;
}) {
  const [clock, setClock] = useState("");
  const [notifOn, setNotifOn] = useState(false);

  useEffect(() => {
    const t = setInterval(() => {
      const d = new Date();
      setClock(d.toLocaleTimeString([], { hour12: false }) + " · " + d.toLocaleDateString([], { month: "short", day: "numeric" }));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    setNotifOn(typeof Notification !== "undefined" && Notification.permission === "granted");
  }, []);

  const toggleMute = () => {
    const next = !mute;
    localStorage.setItem("verde_muted", next ? "1" : "0");
    setMute(next);
    if (!next) sfx("click");
  };
  const toggleNotif = async () => {
    if (notifOn) return;
    await requestNotifyPermission();
    setNotifOn(Notification.permission === "granted");
    if (Notification.permission === "granted") sfx("success");
  };

  const statusText = connStatus === "live" ? "FIREBASE LIVE" : connStatus === "off" ? "OFFLINE" : "CONNECTING";
  const dotClass = connStatus === "live" ? "live-dot" : connStatus === "off" ? "live-dot err" : "live-dot off";

  return (
    <header className="glass-card scanlines p-5 md:p-6 mb-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-green to-purple flex items-center justify-center shadow-lg shadow-green/20">
              <Leaf className="text-black w-6 h-6" strokeWidth={2.5} />
            </div>
            <span className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full ${connStatus === "live" ? "bg-green" : connStatus === "off" ? "bg-red" : "bg-amber"} animate-pulse`} />
          </div>
          <div>
            <h1 className="font-display text-xl md:text-2xl font-bold tracking-tight">
              PROJECT <span className="glow-green tx-ok">VERDE</span>{" "}
              <span className="tx-purple glow-purple">OS</span>
            </h1>
            <div className="font-mono text-[11px] tx-mute">
              plant-doctor × gemini-vision × openrouter · {clock}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={toggleNotif} className="btn" title="Notifications">
            {notifOn ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{notifOn ? "ALERTS ON" : "ALERTS OFF"}</span>
          </button>
          <button onClick={toggleMute} className="btn" title="Sound">
            {mute ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{mute ? "MUTED" : "SOUND"}</span>
          </button>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border-strong bg-card2 font-mono text-xs">
            {connStatus === "off" ? <WifiOff className="w-3.5 h-3.5 tx-err" /> : <Wifi className="w-3.5 h-3.5 tx-ok" />}
            <span className={connStatus === "live" ? "tx-ok" : connStatus === "off" ? "tx-err" : "tx-warn"}>
              ● {statusText}
            </span>
          </div>
        </div>
      </div>
      <div className="hidden" aria-hidden>{dotClass}</div>
    </header>
  );
}
