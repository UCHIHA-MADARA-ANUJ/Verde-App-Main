import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: "#06070a",
        card: "#0b0e17",
        card2: "#0f1320",
        border: "#1a2233",
        green: {
          DEFAULT: "#22c55e",
          glow: "#4ade80",
          dark: "#166534",
        },
        purple: {
          DEFAULT: "#a855f7",
          glow: "#c084fc",
          dark: "#6b21a8",
        },
        sky: "#0ea5e9",
        red: "#ef4444",
        amber: "#f59e0b",
      },
      fontFamily: {
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
        sans: ["Inter", "Segoe UI", "system-ui", "sans-serif"],
        display: ["Space Grotesk", "Inter", "sans-serif"],
      },
      animation: {
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
        "scan": "scan 4s linear infinite",
        "float": "float 6s ease-in-out infinite",
        "blink": "blink 1s step-end infinite",
      },
      keyframes: {
        glow: {
          "0%": { boxShadow: "0 0 5px rgba(34,197,94,0.3)" },
          "100%": { boxShadow: "0 0 20px rgba(34,197,94,0.6), 0 0 40px rgba(34,197,94,0.2)" },
        },
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        float: {
          "0%,100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        blink: {
          "0%,100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
