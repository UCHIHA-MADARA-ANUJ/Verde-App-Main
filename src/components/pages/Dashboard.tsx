"use client";
import { motion } from "framer-motion";
import { TelemetryCard } from "@/components/TelemetryCard";
import { WeatherCard } from "@/components/WeatherCard";
import { PlantDoctorCard } from "@/components/PlantDoctorCard";
import { ChartsCard } from "@/components/ChartsCard";
import { GeminiChat } from "@/components/GeminiChat";
import { OpenRouterChat } from "@/components/OpenRouterChat";
import { HistoryGallery } from "@/components/HistoryGallery";
import { ApiStatusBar } from "@/components/ApiStatusBar";
import { QuickStats } from "@/components/QuickStats";
import { RecommendationsCard } from "@/components/RecommendationsCard";
import { HealthGauge } from "@/components/HealthGauge";
import { useVerdeStore } from "@/store/verde-store";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 200, damping: 22 } },
};

export function Dashboard() {
  const plantResult = useVerdeStore(s => s.plantResult);
  return (
    <motion.div
      className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5"
      variants={container} initial="hidden" animate="show"
    >
      <motion.div variants={item} className="lg:col-span-3">
        <QuickStats />
      </motion.div>

      <motion.div variants={item} className="lg:col-span-2">
        <TelemetryCard />
      </motion.div>

      <motion.div variants={item}>
        <WeatherCard />
      </motion.div>

      <motion.div variants={item} className="lg:col-span-1">
        <PlantDoctorCard />
      </motion.div>

      <motion.div variants={item} className="lg:col-span-1">
        <HealthGauge />
      </motion.div>

      <motion.div variants={item} className="lg:col-span-3">
        <ApiStatusBar />
      </motion.div>

      <motion.div variants={item} className="lg:col-span-3">
        <ChartsCard />
      </motion.div>

      <motion.div variants={item} className="lg:col-span-2">
        <GeminiChat />
      </motion.div>

      <motion.div variants={item} className="lg:col-span-1">
        <QuickActionsCard />
      </motion.div>

      <motion.div variants={item} className="lg:col-span-3">
        <RecommendationsCard />
      </motion.div>

      <motion.div variants={item} className="lg:col-span-3">
        <OpenRouterChat />
      </motion.div>

      <motion.div variants={item} className="lg:col-span-3">
        <HistoryGallery />
      </motion.div>

      <motion.footer variants={item} className="lg:col-span-3 text-center pb-2">
        <div className="font-mono text-[10px] text-slate-600">
          PROJECT VERDE OS v2.0 · built with next.js · keep your plants alive 🌿
          {plantResult && <span className="text-green-glow"> · last scan: {plantResult.name} ({plantResult.prob}%)</span>}
        </div>
      </motion.footer>
    </motion.div>
  );
}

function QuickActionsCard() {
  const pingDB = useVerdeStore(s => s.log);
  const checkWeather = useVerdeStore(s => s.setWeatherLoading);
  const testRouter = async () => {
    const { askOpenRouter } = await import("@/lib/services");
    try {
      await askOpenRouter({ messages: [{ role: "user", content: "Say VERDE online in 3 words." }] });
      pingDB("ok", "openrouter", "Connection test succeeded");
    } catch(e:any) { pingDB("err", "openrouter", e.message); }
  };
  return (
    <div className="glass-card p-5 h-full flex flex-col">
      <h2 className="flex items-center gap-2 font-mono text-xs font-bold tracking-widest uppercase text-sky mb-3">
        ⚡ System Tools
      </h2>
      <div className="grid grid-cols-1 gap-2">
        <button className="btn btn-sky justify-center" onClick={() => location.reload()}>🔄 Reload App</button>
        <button className="btn btn-purple justify-center" onClick={() => { checkWeather(true); import("@/lib/services").then(m => {
          const { fetchWeather } = m;
          const store = useVerdeStore.getState();
          fetchWeather(store.settings.city).then(({ state, icon }) => {
            store.setWeather(state as any, icon);
            store.setLastWeatherCheck(new Date().toLocaleTimeString([], {hour12:false}));
            store.setWeatherLoading(false);
            store.log("ok", "weather", "Manual refresh OK");
          }).catch((e:any) => { store.setWeatherLoading(false); store.log("err","weather",e.message); });
        }); }}>🌦 Refresh Weather</button>
        <button className="btn justify-center" onClick={testRouter}>🛰 Test OpenRouter</button>
        <button className="btn btn-green justify-center" onClick={() => useVerdeStore.getState().startTour()}>🧭 Start Tour</button>
      </div>
      <div className="mt-auto pt-4">
        <div className="font-mono text-[10px] text-slate-500 leading-relaxed">
          <div className="text-slate-400 uppercase tracking-widest font-bold mb-1">VERDE OS v2.0</div>
          Firebase · Gemini 2.0 Flash · OpenRouter 6-model failover · Crop.health · OpenWeather · Recharts · Framer Motion · Zustand<br/>
          <span className="text-green-glow">● All systems operational</span>
        </div>
      </div>
    </div>
  );
}
