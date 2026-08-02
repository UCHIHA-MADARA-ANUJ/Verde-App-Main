"use client";
import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { PlantDoctorCard } from "@/components/PlantDoctorCard";
import { GeminiChat } from "@/components/GeminiChat";
import { HistoryGallery } from "@/components/HistoryGallery";
import { motion } from "framer-motion";

export default function DoctorPage() {
  return (
    <AppShell>
      <Header />
      <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="space-y-5">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight flex items-center gap-3">
            🌿 Plant Doctor
          </h1>
          <p className="text-slate-500 font-mono text-xs mt-1">AI-powered plant identification and disease detection.</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div><PlantDoctorCard /></div>
          <div className="lg:col-span-2"><GeminiChat /></div>
          <div className="lg:col-span-3"><HistoryGallery /></div>
        </div>
      </motion.div>
    </AppShell>
  );
}
