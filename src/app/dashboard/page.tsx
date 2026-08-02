"use client";
import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { TelemetryCard } from "@/components/TelemetryCard";
import { ChartsCard } from "@/components/ChartsCard";
import { ApiStatusBar } from "@/components/ApiStatusBar";
import { QuickStats } from "@/components/QuickStats";
import { motion } from "framer-motion";

export default function DashboardPage() {
  return (
    <AppShell>
      <Header />
      <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="space-y-5">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Telemetry Dashboard</h1>
          <p className="text-slate-500 font-mono text-xs mt-1">Live ESP32 sensor data, controls, and history.</p>
        </div>
        <QuickStats />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2"><TelemetryCard /></div>
          <div className="lg:col-span-1"><ApiStatusBar /></div>
          <div className="lg:col-span-3"><ChartsCard /></div>
        </div>
      </motion.div>
    </AppShell>
  );
}
