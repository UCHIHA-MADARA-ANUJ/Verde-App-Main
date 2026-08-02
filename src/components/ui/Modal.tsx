"use client";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { sfx } from "@/lib/sound";
import { useEffect } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  footer?: React.ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, children, size = "md", footer, className }: ModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) { document.addEventListener("keydown", onKey); sfx.toggle(); }
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const maxW = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl", xl: "max-w-5xl", full: "max-w-[95vw] h-[92vh]" }[size];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[1000] p-4 flex items-center justify-center bg-black/80 backdrop-blur-md"
          onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className={cn(
              "relative w-full bg-gradient-to-b from-[#0d111c] to-[#070a11] border border-border-strong rounded-2xl shadow-[0_0_80px_rgba(34,197,94,0.1),0_40px_80px_rgba(0,0,0,0.7)] overflow-hidden flex flex-col",
              maxW, className
            )}
          >
            {title && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <h3 className="font-display text-lg font-bold tracking-tight flex items-center gap-2">{title}</h3>
                <button
                  onClick={onClose}
                  className="w-9 h-9 rounded-lg border border-border bg-card2 hover:bg-red/20 hover:border-red flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <div className="flex-1 overflow-y-auto p-6">{children}</div>
            {footer && <div className="px-6 py-4 border-t border-border bg-card/40">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
