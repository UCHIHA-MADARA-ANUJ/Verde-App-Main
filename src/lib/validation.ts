// ============================================================================
// VERDE OS — Validation Schemas (runtime checks for config/inputs)
// ============================================================================

export function isValidFirebaseUrl(url: string): boolean {
  return /^https:\/\/[a-z0-9-]+\.(firebaseio\.com|firebasedatabase\.app)/.test(url);
}

export function isValidApiKey(k: string, prefixes: string[] = []): boolean {
  if (!k || k.length < 10) return false;
  if (prefixes.length && !prefixes.some(p => k.startsWith(p))) return false;
  return true;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function isInRange(n: number|undefined, min: number, max: number): boolean {
  if (n === undefined || n === null || Number.isNaN(n)) return false;
  return n >= min && n <= max;
}

export function isValidEmail(email: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

export function sanitizeChatInput(s: string, maxLen = 1000): string {
  return s.replace(/[<>]/g, "").trim().slice(0, maxLen);
}

export function parseNumberInput(v: string, fallback = 0): number {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
}
