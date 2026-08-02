"use client";
import { useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";
import { AlertToaster } from "@/components/AlertToaster";
import { BootScreen } from "@/components/BootScreen";
import { Tour } from "@/components/onboarding/Tour";
import { useVerdeData } from "@/hooks/useVerdeData";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useVerdeStore } from "@/store/verde-store";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [booted, setBooted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const tourActive = useVerdeStore(s => s.tourActive);
  const bootEnabled = useVerdeStore(s => s.settings.bootSequenceEnabled);

  // Start global systems
  useVerdeData();
  useKeyboardShortcuts();

  // FPS counter
  useEffect(() => {
    let frame = 0;
    let last = performance.now();
    let raf = 0;
    const loop = (t: number) => {
      frame++;
      if (t - last >= 1000) {
        useVerdeStore.getState().setFps(frame);
        frame = 0; last = t;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const showBoot = bootEnabled && !booted;

  return (
    <div className="relative min-h-screen flex">
      <AlertToaster />
      {tourActive && <Tour />}
      {showBoot ? (
        <BootScreen onDone={() => setBooted(true)} />
      ) : (
        <>
          <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <div className="flex-1 flex flex-col min-w-0">
            <div className="lg:hidden sticky top-0 z-30 bg-bg/80 backdrop-blur px-4 py-3 border-b border-border flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} noSfx>
                <Menu className="w-5 h-5" />
              </Button>
              <span className="font-display font-bold">VERDE <span className="text-purple-glow">OS</span></span>
            </div>
            <main className="flex-1 p-3 md:p-5 lg:p-6 relative z-10">
              {children}
            </main>
          </div>
        </>
      )}
    </div>
  );
}
