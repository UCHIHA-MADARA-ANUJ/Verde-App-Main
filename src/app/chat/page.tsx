"use client";
import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { GeminiChat } from "@/components/GeminiChat";
import { OpenRouterChat } from "@/components/OpenRouterChat";
import { motion } from "framer-motion";

export default function ChatPage() {
  return (
    <AppShell>
      <Header />
      <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="space-y-5">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">🧠 AI Chat</h1>
          <p className="text-slate-500 font-mono text-xs mt-1">Dual AI: Gemini vision (sees your plant) + OpenRouter (sees sensors).</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <GeminiChat />
          <OpenRouterChat />
        </div>
      </motion.div>
    </AppShell>
  );
}
