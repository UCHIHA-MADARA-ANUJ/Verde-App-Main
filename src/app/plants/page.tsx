"use client";
import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Terminal";
import { useVerdeStore } from "@/store/verde-store";
import { Sprout, Plus, Droplets, Clock, Leaf, Trash2 } from "lucide-react";
import { useState } from "react";
import { formatRelative } from "@/lib/utils";
import { sfx } from "@/lib/sound";

const EMOJIS = ["🌱","🌿","🌵","🌴","🌳","🌲","🍀","🌸","🌺","🌻","🌹","🪴","🌷","🪻","🌾"];

export default function PlantsPage() {
  const plants = useVerdeStore(s => s.plants);
  const addPlant = useVerdeStore(s => s.addPlant);
  const deletePlant = useVerdeStore(s => s.deletePlant);
  const waterPlant = useVerdeStore(s => s.waterPlant);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("");
  const [emoji, setEmoji] = useState("🌱");
  const [location, setLocation] = useState("");

  const submit = () => {
    if (!name.trim()) return;
    addPlant({ name: name.trim(), species: species.trim() || undefined, emoji, location: location.trim() || undefined });
    sfx.success();
    setOpen(false); setName(""); setSpecies(""); setLocation(""); setEmoji("🌱");
  };

  return (
    <AppShell>
      <Header />
      <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight flex items-center gap-3"><Sprout className="w-7 h-7 text-green-glow" />My Plants</h1>
            <p className="text-slate-500 font-mono text-xs mt-1">Track individual plants, watering schedules, and care.</p>
          </div>
          <Button variant="green" onClick={() => setOpen(true)}><Plus className="w-3.5 h-3.5"/>ADD PLANT</Button>
        </div>

        {plants.length === 0 ? (
          <Card>
            <div className="text-center py-16">
              <Sprout className="w-16 h-16 mx-auto text-slate-700 mb-4" />
              <div className="font-display text-xl mb-2">No plants yet</div>
              <p className="text-slate-500 text-sm mb-6">Add your first plant to start tracking its health.</p>
              <Button variant="green" onClick={() => setOpen(true)}><Plus className="w-3.5 h-3.5"/>ADD YOUR FIRST PLANT</Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plants.map(p => (
              <Card key={p.id} accent="green" hover className="group">
                <div className="flex items-start justify-between mb-3">
                  <div className="text-5xl">{p.emoji || "🌿"}</div>
                  <Button variant="ghost" size="icon" onClick={() => { if(confirm(`Delete ${p.name}?`)){ deletePlant(p.id); sfx.toggle(); }}} noSfx>
                    <Trash2 className="w-4 h-4 text-red/70" />
                  </Button>
                </div>
                <div className="font-display text-lg font-bold mb-1">{p.name}</div>
                {p.species && <div className="text-xs text-slate-400 font-mono mb-2">{p.species}</div>}
                {p.location && <div className="text-[11px] text-slate-500 flex items-center gap-1 mb-3"><Leaf className="w-3 h-3"/>{p.location}</div>}
                <div className="flex items-center gap-3 text-xs font-mono text-slate-400 mb-3">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3"/>{formatRelative(p.created)}</span>
                  <span className="flex items-center gap-1"><Droplets className="w-3 h-3"/>{formatRelative(p.wateredAt)}</span>
                </div>
                <Button variant="green" size="sm" className="w-full justify-center" onClick={() => { waterPlant(p.id); sfx.water(); }}>
                  <Droplets className="w-3.5 h-3.5" />WATER NOW
                </Button>
              </Card>
            ))}
          </div>
        )}

        <Modal open={open} onClose={() => setOpen(false)} title={<span className="flex items-center gap-2"><Sprout className="w-4 h-4 text-green-glow"/>Add Plant</span>} footer={
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setOpen(false)} noSfx>Cancel</Button>
            <Button variant="green" onClick={submit} disabled={!name.trim()}>Add Plant</Button>
          </div>
        }>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-mono uppercase text-slate-400 block mb-2">Name *</label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Basil, Monstera, Tulsi…" autoFocus/>
            </div>
            <div>
              <label className="text-xs font-mono uppercase text-slate-400 block mb-2">Species (optional)</label>
              <Input value={species} onChange={e => setSpecies(e.target.value)} placeholder="Ocimum tenuiflorum"/>
            </div>
            <div>
              <label className="text-xs font-mono uppercase text-slate-400 block mb-2">Location (optional)</label>
              <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="Kitchen window, balcony…"/>
            </div>
            <div>
              <label className="text-xs font-mono uppercase text-slate-400 block mb-2">Emoji</label>
              <div className="flex flex-wrap gap-1.5">
                {EMOJIS.map(e => (
                  <button key={e} onClick={() => setEmoji(e)}
                    className={`w-9 h-9 rounded-lg text-xl border transition ${emoji===e?"border-green bg-green/10 scale-110":"border-border hover:border-green/50"}`}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      </motion.div>
    </AppShell>
  );
}
