import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "VERDE OS — Plant Mission Control",
  description: "Smart plant irrigation, AI plant doctor, live ESP32 telemetry.",
  icons: { icon: "/favicon.svg" },
  applicationName: "VERDE OS",
  keywords: ["plant", "irrigation", "esp32", "iot", "ai", "doctor", "garden"],
  authors: [{ name: "Project Verde" }],
};

export const viewport: Viewport = {
  themeColor: "#06070a",
  width: "device-width", initialScale: 1, maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-bg text-slate-200 min-h-screen">{children}</body>
    </html>
  );
}
