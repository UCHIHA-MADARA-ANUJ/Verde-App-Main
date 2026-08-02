"use client";
import { useEffect, useRef, useState } from "react";

export function AnimatedNumber({
  value, suffix = "", duration = 500, decimals = 0,
}: { value: number | string; suffix?: string; duration?: number; decimals?: number }) {
  const [display, setDisplay] = useState(typeof value === "number" ? 0 : value);
  const prev = useRef<number>(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (typeof value !== "number") { setDisplay(value); return; }
    const start = prev.current;
    const end = value;
    const t0 = performance.now();
    function step(t: number) {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = start + (end - start) * eased;
      setDisplay(decimals > 0 ? v.toFixed(decimals) : Math.round(v).toString());
      if (p < 1) raf.current = requestAnimationFrame(step);
      else prev.current = end;
    }
    raf.current = requestAnimationFrame(step);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <span className="num-val">{display}{suffix}</span>;
}
