// VERDE OS — central config (reads from env vars)
export const config = {
  firebase: {
    host: process.env.NEXT_PUBLIC_FIREBASE_HOST || "",
    auth: process.env.NEXT_PUBLIC_FIREBASE_AUTH || "",
  },
  geminiKey: process.env.NEXT_PUBLIC_GEMINI_KEY || "",
  openWeatherKey: process.env.NEXT_PUBLIC_OPENWEATHER_KEY || "",
  openRouterKey: process.env.NEXT_PUBLIC_OPENROUTER_KEY || "",
  plantIdKey: process.env.NEXT_PUBLIC_PLANTID_KEY || "",
  camUploadApi: process.env.NEXT_PUBLIC_CAM_UPLOAD_API || "https://your-app.vercel.app/api/upload-photo",
  camApiKey: process.env.NEXT_PUBLIC_CAM_API_KEY || "",
  city: "Delhi",
  pollIntervalMs: 2000,
  weatherIntervalMs: 10 * 60 * 1000,
  historyMaxItems: 24,
};

export const dbUrl = (path: string) =>
  `https://${config.firebase.host}${path}.json?auth=${config.firebase.auth}`;
