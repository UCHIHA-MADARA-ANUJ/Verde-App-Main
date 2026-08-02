"use client";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, X } from "lucide-react";
import { useVerdeStore, TOUR_STEPS } from "@/store/verde-store";
import { Button } from "@/components/ui/Button";

export function Tour() {
  const step = useVerdeStore(s => s.tourStep);
  const next = useVerdeStore(s => s.nextTourStep);
  const prev = useVerdeStore(s => s.prevTourStep);
  const end = useVerdeStore(s => s.endTour);
  const t = TOUR_STEPS[step];
  const isLast = step === TOUR_STEPS.length - 1;
  const isFirst = step === 0;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000]" />
      <AnimatePresence>
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[2001] w-[90vw] max-w-md bg-gradient-to-b from-[#0d111c] to-[#070a11] border border-purple/40 rounded-2xl p-6 shadow-[0_0_60px_rgba(168,85,247,0.25),0_20px_60px_rgba(0,0,0,0.6)]"
        >
          <button onClick={end} className="absolute top-3 right-3 w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-400">
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-mono text-purple-glow uppercase tracking-widest">Step {step+1} / {TOUR_STEPS.length}</span>
          </div>
          <h3 className="font-display text-xl font-bold mb-2 text-white">{t.title}</h3>
          <p className="text-sm text-slate-300 leading-relaxed mb-5">{t.body}</p>
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {TOUR_STEPS.map((_, i) => (
                <div key={i} className={`h-1 rounded-full transition-all ${i === step ? "w-6 bg-purple" : "w-1 bg-slate-600"}`} />
              ))}
            </div>
            <div className="flex gap-2">
              {!isFirst && (
                <Button variant="outline" size="sm" onClick={prev} noSfx>
                  <ArrowLeft className="w-3 h-3" /> Back
                </Button>
              )}
              <Button variant="purple" size="sm" onClick={isLast ? end : next} noSfx>
                {isLast ? "Let's grow! 🌿" : "Next"} {!isLast && <ArrowRight className="w-3 h-3" />}
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
