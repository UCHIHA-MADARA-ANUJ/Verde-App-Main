"use client";
import { History, X, Leaf, Trash2, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useVerdeStore } from "@/store/verde-store";
import { Card, CardHeader, CardTitle } from "./ui/Card";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { Modal } from "./ui/Modal";
import { Input, Terminal } from "./ui/Terminal";
import { askGemini } from "@/lib/services";
import { formatRelative } from "@/lib/utils";
import { sfx } from "@/lib/sound";
import type { HistoryItem } from "@/types";

export function HistoryGallery() {
  const history = useVerdeStore(s => s.history);
  const [active, setActive] = useState<HistoryItem | null>(null);
  const [q, setQ] = useState("");
  const [msgs, setMsgs] = useState<{who:"you"|"ai"|"sys";text:string}[]>([]);
  const [busy, setBusy] = useState(false);

  const open = (h: HistoryItem) => { setActive(h); setMsgs([]); setQ(""); sfx.click(); };
  const close = () => { setActive(null); setMsgs([]); };
  const deleteItem = (id: string) => {
    useVerdeStore.getState().deleteHistoryItem(id);
    if (active?.id === id) close();
    sfx.toggle();
  };

  const ask = async () => {
    if (!q.trim() || !active || busy) return;
    const userQ = q.trim(); setQ("");
    setMsgs(m => [...m, { who: "you", text: userQ }]);
    setBusy(true);
    try {
      const ctx = active.result
        ? `Saved scan: ${active.result.name} (${active.result.prob}% conf)${active.result.disease ? `, issue: ${active.result.disease.name} (${active.result.disease.prob}%)` : ""}. Sensors at scan time: ${JSON.stringify(active.sensorSnapshot || {})}.`
        : "Saved plant scan.";
      const text = await askGemini({
        imageDataUrls: [active.image.dataUrl],
        text: `${ctx}\n\nQuestion: ${userQ}`,
        system: "You are Verde AI looking at a saved plant scan. Reference the image and diagnosis. Concise (2-3 sentences).",
      });
      setMsgs(m => [...m, { who: "ai", text }]);
      sfx.success();
    } catch(e:any) {
      setMsgs(m => [...m, { who: "sys", text: "ERR: " + e.message }]);
    } finally { setBusy(false); }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle icon={History} color="sky">Scan History Gallery</CardTitle>
        <div className="flex items-center gap-2">
          <Badge color="sky">{history.length} saved</Badge>
          {history.length > 0 && (
            <Button variant="ghost" size="xs" onClick={() => { if(confirm("Clear all history?")) useVerdeStore.getState().clearHistory(); }} noSfx>
              <Trash2 className="w-3 h-3" /> Clear
            </Button>
          )}
        </div>
      </CardHeader>
      {history.length === 0 ? (
        <div className="text-center py-8 font-mono text-xs text-slate-600">
          No scans yet. Capture or upload a plant photo to start your history.
        </div>
      ) : (
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
          {history.map(h => (
            <div key={h.id} className="thumb group" onClick={() => open(h)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={h.image.dataUrl} alt="" />
              <div className="thumb-label">
                {h.result?.name?.slice(0, 12) || "?"}
                <span className="block text-[9px] text-green-glow">{formatRelative(h.ts)}</span>
              </div>
              <button
                onClick={e => { e.stopPropagation(); deleteItem(h.id); }}
                className="absolute top-1 right-1 w-5 h-5 rounded bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition hover:bg-red/80"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!active} onClose={close} size="lg" title={
        <span className="flex items-center gap-2"><Leaf className="w-4 h-4 text-green-glow" />{active?.result?.name || "Plant Scan"}</span>
      }>
        {active && (
          <div className="space-y-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={active.image.dataUrl} alt="" className="w-full max-h-64 object-contain bg-black rounded-xl border border-border" />
            {active.result && (
              <div className="rounded-xl border border-green/30 bg-green/5 p-4">
                <div className="text-sm font-bold text-green-glow flex flex-wrap items-center gap-2">
                  {active.result.name}
                  {active.result.common && <span className="text-slate-400 font-normal">({active.result.common})</span>}
                  <Badge color="green">{active.result.prob}%</Badge>
                  <span className="text-[10px] text-slate-500 font-mono">scanned {new Date(active.ts).toLocaleString()}</span>
                </div>
                {active.result.wiki?.description && (
                  <div className="mt-2 text-xs text-slate-300 leading-relaxed line-clamp-4">{active.result.wiki.description.slice(0, 300)}…</div>
                )}
                {active.result.disease && (
                  <div className={`mt-3 text-xs font-bold ${/healthy/i.test(active.result.disease.name) ? "text-green-glow" : "text-red"}`}>
                    🩺 {active.result.disease.name} ({active.result.disease.prob}%)
                    {active.result.disease.treatment && (
                      <div className="mt-1 text-[11px] text-slate-300 leading-relaxed font-normal">💊 {active.result.disease.treatment}</div>
                    )}
                  </div>
                )}
                {active.notes && <div className="mt-3 text-xs text-slate-400 italic">📝 {active.notes}</div>}
              </div>
            )}
            <Terminal
              lines={msgs.map(m => ({ who: m.who as any, text: m.text }))}
              heightClass="h-32"
            />
            <div className="flex gap-2">
              <Input value={q} onChange={e => setQ(e.target.value)}
                placeholder="Ask about this saved scan…"
                onKeyDown={e => { if (e.key === "Enter") ask(); }} />
              <Button variant="green" onClick={ask} disabled={busy || !q.trim()}>
                <Send className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </Card>
  );
}
