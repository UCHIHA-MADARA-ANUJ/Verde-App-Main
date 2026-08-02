# VERDE OS — Plant Mission Control 🌿

The ultimate smart-plant dashboard: live ESP32 telemetry, AI plant doctor (Plant.id / Crop.health), Gemini vision chat, OpenRouter sensor-aware chat, weather auto-override, and more.

> Built with **Next.js 14 (App Router) + TypeScript + Tailwind CSS + Framer Motion + Recharts**.
> **All API keys are pre-configured** — just install and run.

## Quick start

```bash
npm install
npm run dev       # → http://localhost:3000
```

That's it. No `.env` setup, no config files needed.

## Production

```bash
npm run build
npm start
```

## Features

### 🛰️ Live ESP32 Telemetry (Firebase RTDB)
- Polls Firebase every 2 seconds
- Animated tiles with mini progress bars for: moisture, temp, humidity, tank, lux, light, voltage, uploads
- Color-coded health indicators (red = out-of-range)
- AUTO/MANUAL toggles for pump + grow light, with disabled state when in wrong mode
- Rain override toggle
- Live **predicted actuator states** (app computes what the ESP32 *should* be doing, shows reasoning)
- Three threshold sliders (moisture, tank lock, light) with live badges

### 🌦️ Weather Auto-Override (OpenWeather)
- Auto-fetches Delhi weather every 10 minutes
- Writes weather data back to Firebase `/weather`
- Automatically sets `weather_override=1` when rain is forecast
- Manual "check now" button
- Shows icon, temp, description, humidity, wind, last-check time

### 🌿 Plant Doctor (Plant.id / Crop.health ×3 sources)
- **ESP32 CAM trigger** — sets `/controls/capture_photo=true`, auto-resets after 4s
- **Use latest CAM photo** — pulls from `/latest_scan/imageUrl`
- **Upload your own photo** — file picker
- **📱 Device camera** — uses `capture="environment"` to snap directly from phone
- All images auto-analyse with crop.health (identification + disease + treatment)
- Animated scanning overlay with scanline effect + spinner
- Results show crop name, common name, confidence %, disease, treatment snippet

### 🧠 Gemini 2.5 Flash Vision Chat
- Terminal-style chat that sees the current image (inline base64)
- Gets full context: plant-id result + live sensor telemetry
- Quick-prompt chips ("What disease?", "How to treat?", etc.)
- Animated typing indicator, scroll-to-bottom

### 🤖 OpenRouter Sensor-Aware Chat
- Fallback chain across 6 **free** models (Nemotron, GPT-OSS, DeepSeek V4 Flash, Gemma 4, Qwen3, GPT-OSS 20b) — automatically tries the next if one is rate-limited/delisted
- System-prompted as Verde AI with full live sensor/control context
- Quick-prompt chips for common questions
- Shows which model actually answered

### 📈 Live Sensor Charts
- Real-time area chart with moisture/humidity/temp using Recharts
- Gradient fills, 60-point rolling buffer, animated updates

### 🗂️ Scan History Gallery
- Automatically saves every successful analysis to `localStorage`
- Thumbnail grid with timestamps
- Click any past scan to see full details + chat with Gemini about *that specific saved image* (with current live telemetry context)
- Framer-Motion modal with spring entrance

### 🔔 Smart Alerts & Notifications
- Toast notifications (top-right) for: dry soil, low tank, high temp, rain detected, disease found
- Each alert has its own cooldown so they don't spam
- Optional browser notifications (one-click enable button in header)

### ✨ Polish & UX
- **Cinematic boot sequence** — 7 sequential log lines + animated gradient progress bar + boot chime sound
- **Micro sound effects** — click, success, alert, boot (Web Audio API, no assets, mute toggle in header)
- **Ambient background** — subtle grid + purple/green radial glow
- **Framer Motion page entrance** — staggered card animations
- **Animated counters** on all sensor numbers (ease-out cubic)
- **Hover effects** on every interactive element (sheen sweep on buttons, lift on cards)
- **API status bar** — live indicator for Firebase/OpenWeather/OpenRouter/Plant.id
- **Custom scrollbar**, custom range sliders, custom switch toggles
- **Live clock** in header
- Fully responsive (mobile → desktop)

## Project structure

```
src/
├── app/
│   ├── layout.tsx        # root layout + metadata
│   └── page.tsx          # main dashboard
├── components/
│   ├── Header.tsx            # top bar: logo, clock, mute, alerts, conn pill
│   ├── BootScreen.tsx        # cinematic boot animation
│   ├── TelemetryCard.tsx     # sensor tiles + controls + thresholds
│   ├── WeatherCard.tsx       # weather panel
│   ├── PlantDoctorCard.tsx   # image capture + analysis
│   ├── GeminiChat.tsx        # vision chat
│   ├── OpenRouterChat.tsx    # sensor-aware chat
│   ├── ChartsCard.tsx        # live line chart
│   ├── HistoryGallery.tsx    # saved scans + modal chat
│   ├── ApiStatusBar.tsx      # 4-API health strip
│   ├── AlertToaster.tsx      # toast alerts
│   └── AnimatedNumber.tsx    # rolling counter
├── hooks/
│   └── useVerde.ts       # central state + all API logic
├── lib/
│   ├── config.ts         # all keys + constants (EDIT HERE TO CHANGE KEYS)
│   ├── verde.ts          # API helpers, sound FX, notifs, prediction logic
│   └── cn.ts             # className helper
├── styles/
│   └── globals.css       # Tailwind + custom hand-tuned CSS
└── types/
    └── index.ts          # full TS types
```

## Configured APIs

- **Firebase RTDB** — `verde-tech-haha-default-rtdb.asia-southeast1.firebasedatabase.app`
- **Gemini 2.5 Flash** — `generativelanguage.googleapis.com` (AQ key)
- **OpenWeather** — Delhi weather every 10 min
- **OpenRouter** — 6 free-model fallback chain
- **Crop.health / Plant.id (Kindwise)** — plant + disease identification
- **Device camera** — native `capture="environment"` (no API needed)

To swap any key, edit `src/lib/config.ts`.
