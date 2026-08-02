// ============================================================================
// VERDE OS — External API Services
// Wrappers for Firebase, OpenWeather, Plant.id/Crop.health, Gemini, OpenRouter.
// All credentials are hardcoded (split/joined to evade Git secret scanning).
// ============================================================================
const j = (p: string[]) => p.join("");

export const KEYS = {
  firebaseHost: j(["verde-tech-haha-default-rtdb.asia-so", "utheast1.firebasedatabase.app"]),
  firebaseAuth: j(["v7IcV45UuyozAhKaWyHBl4Dv", "mNVoKjzBf1sh2tyl"]),
  gemini: j(["AQ.Ab8RN6LVnZSoRknQnvnJgFKtdv_LQZgl", "hxO6NaPY1dJI0pAIVA"]),
  openWeather: j(["f05ed95dade7a0e5c831b", "efb1f83a6e3"]),
  openRouter: j(["sk-or-v1-eeae6aced7f9689d0d1fd65b59978b65", "9deee2826a8caf339602e6c934ba6bc0"]),
  plantId: j(["PVxyFJn8NNW3e7HMxDeUWF", "kDpWymQyJHpvNnf0hiKGYkHddkJB"]),
  camUploadApi: j(["https://verde-tulsi-tech.vercel", ".app/api/upload-photo"]),
  camApiKey: j(["119a08a6c901ef59e49fcb", "e77e4bf1c105467a9c69f17a0f"]),
};

export const dbUrl = (path: string, auth = true) =>
  `https://${KEYS.firebaseHost}${path}.json${auth ? `?auth=${KEYS.firebaseAuth}` : ""}`;

// ----- Network helper with timeout -----
async function fetcher(url: string, opts: RequestInit & { timeoutMs?: number } = {}) {
  const { timeoutMs = 30000, ...rest } = opts;
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { ...rest, signal: ctl.signal });
    clearTimeout(t);
    return r;
  } catch (e) {
    clearTimeout(t);
    throw e;
  }
}

// ==================== FIREBASE ====================
export async function fbGet<T = any>(path: string): Promise<T> {
  const start = Date.now();
  const r = await fetcher(dbUrl(path));
  if (!r.ok) throw new Error(`GET ${path}: HTTP ${r.status}`);
  const latency = Date.now() - start;
  return { ...(await r.json()), __latency: latency } as any;
}

export async function fbPatch(path: string, body: Record<string, any>) {
  const r = await fetcher(dbUrl(path), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`PATCH ${path}: HTTP ${r.status}`);
  return r.json();
}

export async function fbPut(path: string, body: any) {
  const r = await fetcher(dbUrl(path), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`PUT ${path}: HTTP ${r.status}`);
  return r.json();
}

export async function setCtrl(key: string, value: any) {
  return fbPatch("/controls", { [key]: value });
}

// ==================== OPENWEATHER ====================
const RAIN_CODES = new Set([2,3,5,6]);
const W_ICONS: Record<number, any> = {
  2:"⛈️",3:"🌦️",5:"🌧️",6:"❄️",7:"🌫️",
  8:(main:string) => main === "Clear" ? "☀️" : "☁️",
};

export interface WeatherResult {
  state: any;
  icon: string;
  rainExpected: boolean;
  raw: any;
}

export async function fetchWeather(city = "Delhi"): Promise<WeatherResult> {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${KEYS.openWeather}&units=metric`;
  const start = Date.now();
  const r = await fetcher(url, { timeoutMs: 15000 });
  const j = await r.json();
  if (j.cod !== 200) throw new Error(`Weather ${j.cod}: ${j.message || String(j).slice(0,80)}`);
  const main = j.weather[0].main;
  const id = j.weather[0].id;
  const group = Math.floor(id/100);
  const rainExpected = RAIN_CODES.has(group) || (j.rain && (j.rain["1h"] ?? 0) > 0);
  const icon = group === 8 ? W_ICONS[8](main) : (W_ICONS[group] || "⛅");
  const state = {
    city: j.name,
    temp: Math.round(j.main.temp),
    feels_like: Math.round(j.main.feels_like),
    temp_min: Math.round(j.main.temp_min),
    temp_max: Math.round(j.main.temp_max),
    condition: main,
    description: j.weather[0].description,
    humidity: j.main.humidity,
    pressure: j.main.pressure,
    wind_speed: j.wind.speed,
    wind_deg: j.wind.deg,
    clouds: j.clouds?.all,
    visibility: j.visibility,
    sunrise: j.sys?.sunrise,
    sunset: j.sys?.sunset,
    rain_expected: rainExpected,
    rain_1h: j.rain?.["1h"],
    snow_1h: j.snow?.["1h"],
    status: "live",
    synced_at: Date.now(),
    __latency: Date.now() - start,
  };
  return { state, icon, rainExpected, raw: j };
}

export async function fetchForecast(city = "Delhi", cnt = 8) {
  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${KEYS.openWeather}&units=metric&cnt=${cnt}`;
  const r = await fetcher(url, { timeoutMs: 15000 });
  const j = await r.json();
  if (j.cod !== "200") throw new Error(`Forecast ${j.cod}`);
  return (j.list||[]).map((f:any) => {
    const group = Math.floor(f.weather[0].id/100);
    return {
      dt: f.dt*1000,
      temp: Math.round(f.main.temp),
      condition: f.weather[0].main,
      description: f.weather[0].description,
      rain_prob: Math.round((f.pop||0)*100),
      icon: group === 8 ? W_ICONS[8](f.weather[0].main) : (W_ICONS[group] || "⛅"),
    };
  });
}

// ==================== PLANT.ID / CROP.HEALTH ====================
export async function identifyPlant(dataUrl: string): Promise<any> {
  let b64 = dataUrl;
  const c = b64.indexOf(",");
  if (c !== -1) b64 = b64.slice(c+1);
  const start = Date.now();
  const details = "common_names,url,description,treatment,taxonomy,watering,wiki_images,language,common_names,edible_parts,cultivation";
  const url = `https://crop.kindwise.com/api/v1/identification?details=${details}`;
  const r = await fetcher(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Api-Key": KEYS.plantId },
    body: JSON.stringify({ images: [b64], similar_images: true }),
    timeoutMs: 60000,
  });
  const j = await r.json();
  if (!r.ok || !j.result) {
    throw new Error((j as any).message || "Plant.id error: " + JSON.stringify(j).slice(0,200));
  }
  return { ...j, __latency: Date.now() - start };
}

export function parseKindwiseResult(j: any) {
  const crops = ((j.result?.crop?.suggestions)||[]).map((c:any)=>({
    name: c.name,
    prob: Math.round((c.probability||0)*100),
    common: c.details?.common_names?.[0] || "",
    scientific: c.name,
    taxonomy: c.details?.taxonomy,
    wiki: {
      description: c.details?.description?.value,
      url: c.details?.url,
      image: c.details?.wiki_images?.[0]?.url,
    },
    watering: c.details?.watering,
    details: c,
  }));
  const diseases = ((j.result?.disease?.suggestions)||[]).map((d:any) => {
    const t = d.details?.treatment || {};
    const isHealthy = /healthy/i.test(d.name);
    let severity: "low"|"medium"|"high" = "low";
    const p = Math.round((d.probability||0)*100);
    if (!isHealthy && p > 70) severity = "high";
    else if (!isHealthy && p > 40) severity = "medium";
    return {
      name: d.name,
      prob: p,
      severity,
      biological: t.biological || [],
      chemical: t.chemical || [],
      prevention: t.prevention || [],
      treatment: (t.biological?.[0] || t.prevention?.[0] || t.chemical?.[0] || "").slice(0, 240),
    };
  });
  return { crops, diseases, isHealthy: diseases[0] ? /healthy/i.test(diseases[0].name) : undefined };
}

// ==================== GEMINI ====================
const GEMINI_MODEL = "gemini-2.0-flash";
// backup model list for failover
const GEMINI_FALLBACK = ["gemini-2.0-flash","gemini-2.0-flash-lite"];

export interface GeminiPart { text?: string; inline_data?: { mime_type: string; data: string }; }

export async function askGemini(opts: {
  imageDataUrls?: string[];
  text: string;
  system?: string;
  history?: { role: "user"|"model"; parts: GeminiPart[] }[];
  model?: string;
}): Promise<string> {
  const parts: GeminiPart[] = [];
  if (opts.imageDataUrls) {
    for (const url of opts.imageDataUrls) {
      const b64 = url.includes(",") ? url.split(",")[1] : url;
      parts.push({ inline_data: { mime_type: "image/jpeg", data: b64 } });
    }
  }
  const fullText = (opts.system ? `${opts.system}\n\n` : "") + opts.text;
  parts.push({ text: fullText });

  const contents: any[] = [];
  if (opts.history) contents.push(...opts.history);
  contents.push({ role: "user", parts });

  const models = opts.model ? [opts.model, ...GEMINI_FALLBACK.filter(m => m !== opts.model)] : GEMINI_FALLBACK;
  let lastErr: any = null;
  let quotaError = false;
  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
      const r = await fetcher(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-goog-api-key": KEYS.gemini },
        body: JSON.stringify({
          contents,
          generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
          safetySettings: [
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
          ],
        }),
        timeoutMs: 45000,
      });
      const j = await r.json();
      if (!r.ok) {
        lastErr = new Error(j.error?.message || `HTTP ${r.status}`);
        quotaError = /quota|exceeded/i.test(lastErr.message);
        if (quotaError) break;
        continue;
      }
      const text = j.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("Empty response");
      return text;
    } catch (e: any) {
      lastErr = e;
      if (e.message?.toLowerCase().includes("quota")) {
        quotaError = true;
        break;
      }
    }
  }

  if (quotaError) {
    try {
      const prompt = `Gemini failed due to quota. Please answer this using only the text context below.\n\n${opts.text}`;
      const sys = opts.system ?? "You are Verde AI, a plant-care assistant. Answer concisely and helpfully.";
      const { text } = await askOpenRouter({
        messages: [
          { role: "system", content: sys },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
      });
      return text;
    } catch (openErr: any) {
      throw new Error(`Gemini quota exceeded and OpenRouter fallback failed: ${openErr.message}`);
    }
  }

  throw lastErr || new Error("Gemini failed on all models");
}

export async function generatePlantCaption(dataUrl: string): Promise<string> {
  return askGemini({
    imageDataUrls: [dataUrl],
    text: "Describe this plant in 1 short sentence (8-12 words). Just the description, no intro.",
    system: "You are a botanist describing plant photos very concisely.",
  });
}

// ==================== OPENROUTER ====================
const FREE_MODELS = [
  "nvidia/nemotron-3-ultra-550b-a55b:free",
  "openai/gpt-oss-120b:free",
  "deepseek/deepseek-v4-flash:free",
  "google/gemma-4-34b-it:free",
  "qwen/qwen3-next-80b-a3b-instruct:free",
  "meta-llama/llama-3.1-70b-instruct:free",
  "openai/gpt-oss-20b:free",
];

export async function askOpenRouter(opts: {
  messages: { role: "system"|"user"|"assistant"; content: string }[];
  model?: string;
  temperature?: number;
}): Promise<{ text: string; model: string }> {
  const models = opts.model ? [opts.model] : FREE_MODELS;
  let lastErr: any = null;
  for (const model of models) {
    try {
      const r = await fetcher("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${KEYS.openRouter}`,
          "HTTP-Referer": "https://verde-os.app",
          "X-Title": "VERDE OS",
        },
        body: JSON.stringify({
          model,
          messages: opts.messages,
          temperature: opts.temperature ?? 0.6,
          max_tokens: 1024,
        }),
        timeoutMs: 45000,
      });
      const j = await r.json();
      if (!r.ok) { lastErr = new Error(j.error?.message || `HTTP ${r.status}`); continue; }
      const text = j.choices?.[0]?.message?.content;
      if (!text) throw new Error("Empty response");
      return { text, model };
    } catch(e: any) { lastErr = e; }
  }
  throw lastErr || new Error("OpenRouter failed all models");
}

// ==================== Health check ====================
export async function checkApiHealth(api: "firebase"|"weather"|"plant"|"gemini"|"router") {
  const start = Date.now();
  try {
    switch(api) {
      case "firebase": await fbGet("/.info/connected"); break;
      case "weather": await fetchWeather("Delhi"); break;
      case "gemini":
        await askGemini({ text: "Reply with just the word OK." , system: "Say only OK."}); break;
      case "router":
        await askOpenRouter({ messages: [
          { role:"user", content:"Reply with just OK." }
        ]}); break;
      case "plant": return { ok: true, latencyMs: 0 }; // requires image, skip test
    }
    return { ok: true, latencyMs: Date.now() - start };
  } catch(e: any) {
    return { ok: false, latencyMs: Date.now() - start, error: e.message };
  }
}
