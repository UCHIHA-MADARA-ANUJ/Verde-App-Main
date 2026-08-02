"use client";
import { useEffect } from "react";
import { useVerdeStore } from "@/store/verde-store";
import { setCtrl } from "@/lib/services";
import { sfx } from "@/lib/sound";

// Global keyboard shortcuts (mounted once via AppShell)
export function useKeyboardShortcuts() {
  useEffect(() => {
    const onKey = async (e: KeyboardEvent) => {
      // Don't trigger when typing in input/textarea
      const target = e.target as HTMLElement;
      const inInput = ["INPUT", "TEXTAREA"].includes(target.tagName) || target.isContentEditable;

      if (inInput && e.key !== "Escape") return;

      const s = useVerdeStore.getState();

      switch(e.key) {
        case "?":
          if (!inInput) {
            e.preventDefault();
            s.pushNotification({ level: "info", title: "Shortcuts", body: "?=help  /=focus chat  r=weather  t=trigger cam  m=mute  s=sidebar  Esc=close modal" });
          }
          break;
        case "r":
          if (!inInput) {
            e.preventDefault();
            s.log("info", "hotkey", "r → refresh weather");
            // trigger weather via a custom event
            window.dispatchEvent(new CustomEvent("verde:refresh-weather"));
          }
          break;
        case "t":
          if (!inInput) {
            e.preventDefault();
            s.log("info", "hotkey", "t → trigger cam capture");
            try {
              await setCtrl("capture_photo", true);
              setTimeout(() => setCtrl("capture_photo", false).catch(()=>{}), 4000);
              s.pushNotification({ level: "info", title: "Capture triggered", body: "ESP32 taking photo…" });
              sfx.shutter();
            } catch(err:any) {
              s.log("err","hotkey",`Capture failed: ${err.message}`);
            }
          }
          break;
        case "m":
          if (!inInput) {
            e.preventDefault();
            s.updateSettings({ soundEnabled: !s.settings.soundEnabled });
            if (s.settings.soundEnabled) sfx.click();
          }
          break;
        case "s":
          if (!inInput) {
            e.preventDefault();
            s.setSidebarOpen(!s.sidebarOpen);
          }
          break;
        case "/":
          if (!inInput) {
            e.preventDefault();
            // focus first chat input
            const chat = document.querySelector(".chat-input") as HTMLInputElement;
            chat?.focus();
          }
          break;
        case "Escape":
          if (s.modalOpen.type) s.closeModal();
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
