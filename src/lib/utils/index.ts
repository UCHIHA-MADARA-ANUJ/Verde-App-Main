// ============================================================================
// VERDE OS — Utility functions (general-purpose helpers used across the app)
// ============================================================================
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

export function formatNumber(n: number | undefined | null, digits = 0, fallback = "--"): string {
  if (n === undefined || n === null || Number.isNaN(n)) return fallback;
  return n.toFixed(digits);
}

export function formatPercent(n: number | undefined | null, digits = 0, fallback = "--%"): string {
  if (n === undefined || n === null || Number.isNaN(n)) return fallback;
  return n.toFixed(digits) + "%";
}

export function formatTemp(c: number | undefined | null, unit: "C"|"F" = "C", digits = 0, fallback = "--"): string {
  if (c === undefined || c === null || Number.isNaN(c)) return fallback;
  const v = unit === "F" ? c * 9/5 + 32 : c;
  return `${v.toFixed(digits)}°${unit}`;
}

export function formatTime(ts?: number | null, includeSeconds = true): string {
  if (!ts) return "--";
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit", minute: "2-digit", ...(includeSeconds ? { second: "2-digit" } : {}), hour12: false,
  });
}

export function formatDate(ts?: number | null, style: "short" | "long" | "relative" = "short"): string {
  if (!ts) return "--";
  const d = new Date(ts);
  if (style === "relative") return formatRelative(ts);
  if (style === "long") return d.toLocaleString([], { dateStyle: "full", timeStyle: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(ts).toLocaleDateString();
}

export function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rs = s % 60;
  if (m < 60) return `${m}m ${rs}s`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  if (h < 24) return `${h}h ${rm}m`;
  const d = Math.floor(h / 24);
  return `${d}d ${h%24}h`;
}

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function lerp(a: number, b: number, t: number): number { return a + (b - a) * t; }

export function mapRange(v: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
  return ((v - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin;
}

export function average(arr: number[]): number {
  if (!arr.length) return 0;
  return arr.reduce((a,b)=>a+b,0)/arr.length;
}

export function median(arr: number[]): number {
  if (!arr.length) return 0;
  const s = [...arr].sort((a,b)=>a-b);
  const mid = Math.floor(s.length/2);
  return s.length % 2 ? s[mid] : (s[mid-1] + s[mid])/2;
}

export function minMax(arr: number[]): { min: number; max: number } {
  if (!arr.length) return { min:0, max:0 };
  return { min: Math.min(...arr), max: Math.max(...arr) };
}

export function slope(points: {x:number;y:number}[]): number {
  if (points.length < 2) return 0;
  const n = points.length;
  let sumX=0,sumY=0,sumXY=0,sumXX=0;
  for (const p of points) { sumX+=p.x; sumY+=p.y; sumXY+=p.x*p.y; sumXX+=p.x*p.x; }
  const d = n*sumXX - sumX*sumX;
  if (d===0) return 0;
  return (n*sumXY - sumX*sumY)/d;
}

export function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function debounce<T extends (...args: any[])=>void>(fn: T, ms: number): T & { cancel: ()=>void } {
  let h: any;
  const r: any = (...args: any[]) => { clearTimeout(h); h = setTimeout(() => fn(...args), ms); };
  r.cancel = () => clearTimeout(h);
  return r;
}

export function throttle<T extends (...args: any[])=>void>(fn: T, ms: number): T {
  let last = 0; let pending: any = null;
  return ((...args: any[]) => {
    const now = Date.now();
    if (now - last >= ms) { last = now; fn(...args); }
    else { clearTimeout(pending); pending = setTimeout(() => { last = Date.now(); fn(...args); }, ms - (now-last)); }
  }) as T;
}

export function sleep(ms: number): Promise<void> { return new Promise(r => setTimeout(r, ms)); }

export function downloadJSON(data: any, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

export function downloadText(text: string, filename: string) {
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

export function copyToClipboard(text: string): Promise<boolean> {
  return navigator.clipboard.writeText(text).then(() => true).catch(() => false);
}

export function isMobile(): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth < 768 || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function healthColor(pct: number | undefined, greenAt = 60, yellowAt = 30): string {
  if (pct === undefined) return "text-slate-500";
  if (pct >= greenAt) return "text-green-glow";
  if (pct >= yellowAt) return "text-amber";
  return "text-red";
}

export function sensorStatusColor(value: number, min: number, max: number): "ok"|"warn"|"err" {
  if (value < min || value > max) return "err";
  const buffer = (max - min) * 0.1;
  if (value < min + buffer || value > max - buffer) return "warn";
  return "ok";
}

export function stableHash(str: string): number {
  let h = 0;
  for (let i=0; i<str.length; i++) { h = ((h<<5) - h) + str.charCodeAt(i); h |= 0; }
  return Math.abs(h);
}

export function colorFromString(str: string): string {
  const palette = ["#22c55e","#a855f7","#0ea5e9","#f59e0b","#ef4444","#ec4899","#14b8a6","#f97316"];
  return palette[stableHash(str) % palette.length];
}

export function truncate(s: string, n: number): string {
  if (!s) return "";
  return s.length > n ? s.slice(0, n-1) + "…" : s;
}

export function bytesToHuman(b: number): string {
  if (b < 1024) return b + " B";
  if (b < 1024*1024) return (b/1024).toFixed(1) + " KB";
  if (b < 1024*1024*1024) return (b/1024/1024).toFixed(1) + " MB";
  return (b/1024/1024/1024).toFixed(2) + " GB";
}

export function getOrdinalSuffix(n: number): string {
  const s = ["th","st","nd","rd"], v = n%100;
  return n + (s[(v-20)%10] || s[v] || s[0]);
}

export function daysBetween(a: number, b: number): number {
  return Math.floor(Math.abs(a-b)/86400000);
}

export function hexToRgba(hex: string, alpha = 1): string {
  const h = hex.replace("#","");
  const bigint = parseInt(h.length === 3
    ? h.split("").map(c => c+c).join("")
    : h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

export function randomBetween(min: number, max: number): number {
  return Math.random()*(max-min)+min;
}

export function toDataUrlFromFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export async function resizeImage(dataUrl: string, maxW = 1024, maxH = 1024, quality = 0.85): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxW) { height *= maxW / width; width = maxW; }
      if (height > maxH) { width *= maxH / height; height = maxH; }
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.src = dataUrl;
  });
}
