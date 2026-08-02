"use client";
import { useEffect, useState } from "react";
import { BootScreen } from "@/components/BootScreen";
import { Header } from "@/components/Header";
import { TelemetryCard } from "@/components/TelemetryCard";
import { WeatherCard } from "@/components/WeatherCard";
import { PlantDoctorCard } from "@/components/PlantDoctorCard";
import { GeminiChat } from "@/components/GeminiChat";
import { OpenRouterChat } from "@/components/OpenRouterChat";
import { ChartsCard } from "@/components/ChartsCard";
import { HistoryGallery } from "@/components/HistoryGallery";
import { ApiStatusBar } from "@/components/ApiStatusBar";
import { AlertToaster } from "@/components/AlertToaster";
import { useVerde } from "@/hooks/useVerde";
import { sfx } from "@/lib/verde";
import { motion } from "framer-motion";

export default function HomePage() {
  const [booted, setBooted] = useState(false);
  const [mute, setMute] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("verde_muted") === "1";
  });
  const [weatherLoading, setWeatherLoading] = useState(false);

  const v = useVerde();

  useEffect(() => {
    // Play boot sound
    const t = setTimeout(() => { if (!mute) sfx("boot"); }, 100);
    return () => clearTimeout(t);
  }, [mute]);

  // click sound on buttons
  useEffect(() => {
    if (mute) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("button, .switch, input[type=range]")) sfx("click");
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [mute]);

  // success sound when analysis completes
  useEffect(() => {
    if (v.plantResult && !mute) sfx("success");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v.plantResult?.name]);

  const refreshWeather = async () => {
    setWeatherLoading(true);
    await v.checkWeather();
    setWeatherLoading(false);
  };

  // When user uploads a file: set image + auto-analyse
  const onUpload = async (f: File) => {
    const img = await v.setUserImage(f);
    if (img) v.analyse(img);
  };
  const onDevice = (dataUrl: string) => {
    const img = v.setDeviceImage(dataUrl);
    if (img) v.analyse(img);
  };

  // When user clicks "USE CAM PHOTO" from plant doctor:
  const onUseCamAndAnalyse = () => {
    const img = v.useCamPhoto();
    if (img) v.analyse(img);
    return img;
  };

  if (!booted) {
    return <BootScreen onDone={() => setBooted(true)} />;
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 },
    },
  };
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 200, damping: 22 } },
  };

  return (
    <main className="relative z-10 min-h-screen px-3 md:px-5 py-4 md:py-6 max-w-[1400px] mx-auto">
      <AlertToaster alerts={v.alerts} />

      <Header connStatus={v.connStatus} mute={mute} setMute={setMute} />

      <motion.div
        className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={item} className="lg:col-span-2">
          <TelemetryCard
            sensors={v.state.sensors}
            controls={v.state.controls}
            predict={v.predict}
            onCtrl={v.doSetCtrl}
          />
        </motion.div>

        <motion.div variants={item}>
          <WeatherCard
            weather={v.weather}
            icon={v.weatherIcon}
            lastCheck={v.lastWeatherCheck}
            rainOverride={v.state.controls.weather_override ?? 0}
            onRefresh={refreshWeather}
            apiStatus={v.apiStatus.weather}
            loading={weatherLoading}
          />
        </motion.div>

        <motion.div variants={item} className="lg:col-span-1">
          <PlantDoctorCard
            currentImage={v.currentImage}
            analysing={v.analysing}
            plantResult={v.plantResult}
            apiStatus={v.apiStatus.plant}
            onTriggerCam={v.triggerCapture}
            onUseCam={onUseCamAndAnalyse as any}
            onUpload={onUpload}
            onDevice={onDevice}
            onAnalyse={v.analyse}
            logLines={v.logLines}
          />
        </motion.div>

        <motion.div variants={item} className="lg:col-span-2">
          <ChartsCard history={v.sensorHistory} />
        </motion.div>

        <motion.div variants={item} className="lg:col-span-3">
          <ApiStatusBar
            weather={v.apiStatus.weather}
            router={v.apiStatus.router}
            db={v.apiStatus.db}
            plant={v.apiStatus.plant}
          />
        </motion.div>

        <motion.div variants={item} className="lg:col-span-2">
          <GeminiChat
            msgs={v.chatMsgs}
            busy={v.chatBusy}
            currentImage={v.currentImage}
            onSend={v.sendGemini}
          />
        </motion.div>

        <motion.div variants={item} className="lg:col-span-1">
          <div className="glass-card p-5 h-full flex flex-col">
            <h3 className="font-mono text-xs font-bold tracking-widest uppercase text-sky mb-3">⚡ Quick Tests</h3>
            <div className="grid grid-cols-1 gap-2">
              <button className="btn justify-center" onClick={v.checkWeather}>🌦️ Test Weather</button>
              <button className="btn justify-center" onClick={v.testRouter}>🛰️ Test OpenRouter</button>
              <button className="btn justify-center" onClick={v.pingDB}>🔥 Firebase Ping</button>
            </div>
            <div className="mt-auto pt-4">
              <div className="font-mono text-[10px] text-slate-500 leading-relaxed">
                <div className="mb-1 text-slate-400 uppercase tracking-widest font-bold">VERDE OS v1.0.0</div>
                Firebase · Gemini 2.5 Flash · OpenRouter free-tier failover · Crop.health / Plant.id · OpenWeather · Recharts · Framer Motion<br />
                <span className="tx-ok">● All systems operational</span>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={item} className="lg:col-span-3">
          <OpenRouterChat msgs={v.orMsgs} busy={v.orBusy} onSend={v.sendOpenRouter} />
        </motion.div>

        <motion.div variants={item} className="lg:col-span-3">
          <HistoryGallery history={v.history} sensors={v.state.sensors} controls={v.state.controls} />
        </motion.div>
      </motion.div>

      <footer className="mt-8 pb-4 text-center font-mono text-[10px] text-slate-600">
        PROJECT VERDE · built with next.js · keep your plants alive 🌿
      </footer>
    </main>
  );
}
