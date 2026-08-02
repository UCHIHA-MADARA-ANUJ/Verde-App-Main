// ============================================================================
// VERDE OS — Web Audio sound effects (no external asset files)
// ============================================================================
let ctx: AudioContext | null = null;
let muted = false;

export function setMuted(m: boolean) { muted = m; if (muted && ctx) ctx.suspend?.(); }
export function isMuted() { return muted; }

function ensure() {
  if (!ctx && typeof window !== "undefined") {
    try { ctx = new (window.AudioContext || (window as any).webkitAudioContext)(); } catch { ctx = null; }
  }
  return ctx;
}

function tone(freq: number, duration: number, type: OscillatorType = "sine", vol = 0.05, slideTo?: number) {
  if (muted) return;
  const c = ensure(); if (!c) return;
  if (c.state === "suspended") c.resume().catch(()=>{});
  const t0 = c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t0 + duration);
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain); gain.connect(c.destination);
  osc.start(t0); osc.stop(t0 + duration + 0.02);
}

function noiseBurst(duration: number, vol = 0.03, filterFreq = 1000) {
  if (muted) return;
  const c = ensure(); if (!c) return;
  if (c.state === "suspended") c.resume().catch(()=>{});
  const t0 = c.currentTime;
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * duration), c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i=0; i<d.length; i++) d[i] = (Math.random()*2-1) * (1 - i/d.length);
  const src = c.createBufferSource(); src.buffer = buf;
  const bp = c.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = filterFreq;
  const g = c.createGain(); g.gain.value = vol;
  src.connect(bp); bp.connect(g); g.connect(c.destination);
  src.start(t0);
}

export const sfx = {
  click: () => tone(620, 0.07, "square", 0.04, 320),
  success: () => { tone(520, 0.1, "sine", 0.05); setTimeout(()=>tone(780,0.16,"sine",0.05,920),90); },
  alert: () => tone(200, 0.35, "sawtooth", 0.07, 150),
  boot: () => {
    tone(110, 0.25, "sine", 0.08, 220);
    setTimeout(()=>tone(220, 0.3, "sine", 0.06, 440), 180);
    setTimeout(()=>tone(440, 0.35, "sine", 0.05, 660), 400);
  },
  error: () => { tone(220,0.12,"square",0.06,140); setTimeout(()=>tone(180,0.2,"square",0.06,100),120); },
  notification: () => { tone(880,0.08,"sine",0.05); setTimeout(()=>tone(1100,0.12,"sine",0.04),70); },
  scan: () => noiseBurst(0.08, 0.02, 2000),
  water: () => noiseBurst(0.25, 0.03, 800),
  toggle: () => tone(800, 0.05, "triangle", 0.03, 1200),
  shutter: () => { noiseBurst(0.05, 0.08, 3000); setTimeout(()=>tone(200,0.08,"square",0.04,80),40); },
  startup: () => {
    for (let i=0; i<5; i++) setTimeout(()=>tone(220 + i*110, 0.08, "triangle", 0.03), i*70);
  },
};
