"use client";
import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { HistoryGallery } from "@/components/HistoryGallery";
import { motion } from "framer-motion";

export default function HistoryPage() {
  return (
    <AppShell>
      <Header />
      <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="space-y-5">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">🗂 Scan History</h1>
          <p className="text-slate-500 font-mono text-xs mt-1">Every plant analysis you&apos;ve run, saved locally.</p>
        </div>
        <HistoryGallery />
      </motion.div>
    </AppShell>
  );
}
