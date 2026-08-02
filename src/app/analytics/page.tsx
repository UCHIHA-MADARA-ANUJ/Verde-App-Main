"use client";
import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { useVerdeStore } from "@/store/verde-store";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { formatDuration, formatRelative } from "@/lib/utils";
import { TrendingUp, Leaf, Activity, Droplets, Clock } from "lucide-react";

export default function AnalyticsPage() {
  const history = useVerdeStore(s => s.history);
  const sensorHistory = useVerdeStore(s => s.sensorHistory);
  const plants = useVerdeStore(s => s.plants);
  const logs = useVerdeStore(s => s.logs);
  const appLoadTime = useVerdeStore(s => s.appLoadTime);

  const healthyCount = history.filter(h => !h.result?.disease || /healthy/i.test(h.result.disease.name)).length;
  const issueCount = history.length - healthyCount;
  const pieData = [
    { name: "Healthy", value: healthyCount || 1, color: "#22c55e" },
    { name: "Issues", value: issueCount, color: "#ef4444" },
  ];
  const hourlyBins = Array.from({length:24},(_,h)=>{
    const scans = history.filter(x => {
      const d = new Date(x.ts); return d.getHours() === h;
    }).length;
    return { hour: `${h}h`, scans };
  });

  return (
    <AppShell>
      <Header />
      <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="space-y-5">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">📊 Analytics</h1>
          <p className="text-slate-500 font-mono text-xs mt-1">Insights from your plant care data.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat icon={Leaf} label="Total Scans" value={history.length} color="green" />
          <Stat icon={Activity} label="Healthy %" value={history.length ? Math.round(healthyCount/history.length*100) : 0} suffix="%" color="sky" />
          <Stat icon={Droplets} label="Tracked Plants" value={plants.length} color="purple" />
          <Stat icon={Clock} label="Uptime" value={formatDuration(Date.now()-appLoadTime).split(" ")[0]} suffix={formatDuration(Date.now()-appLoadTime).split(" ")[1]||""} color="amber" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Card accent="green" className="lg:col-span-2">
            <CardHeader><CardTitle icon={TrendingUp} color="green">Scans per hour</CardTitle></CardHeader>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyBins}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a2233" />
                  <XAxis dataKey="hour" tick={{fill:"#475569",fontSize:10,fontFamily:"JetBrains Mono"}} axisLine={{stroke:"#1a2233"}} tickLine={false} />
                  <YAxis tick={{fill:"#475569",fontSize:10,fontFamily:"JetBrains Mono"}} axisLine={{stroke:"#1a2233"}} tickLine={false} allowDecimals={false}/>
                  <Tooltip contentStyle={{background:"#0b0e17",border:"1px solid #253048",borderRadius:8,fontSize:11,fontFamily:"JetBrains Mono"}}/>
                  <Bar dataKey="scans" fill="#22c55e" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card accent="purple">
            <CardHeader><CardTitle icon={Leaf} color="purple">Health Distribution</CardTitle></CardHeader>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={4}>
                    {pieData.map((e,i) => <Cell key={i} fill={e.color} stroke="#0b0e17" strokeWidth={2}/>)}
                  </Pie>
                  <Legend wrapperStyle={{fontSize:11,fontFamily:"JetBrains Mono"}}/>
                  <Tooltip contentStyle={{background:"#0b0e17",border:"1px solid #253048",borderRadius:8,fontSize:11,fontFamily:"JetBrains Mono"}}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <Card accent="sky">
          <CardHeader><CardTitle icon={Activity} color="sky">Recent Activity</CardTitle></CardHeader>
          <div className="max-h-80 overflow-y-auto font-mono text-xs space-y-1">
            {logs.slice(-50).reverse().map(l => (
              <div key={l.id} className="flex gap-3 items-start py-1 border-b border-border/30 last:border-0">
                <span className="text-slate-600 w-20 flex-shrink-0">{formatRelative(l.ts)}</span>
                <span className={`w-16 flex-shrink-0 uppercase tracking-widest text-[10px] ${
                  l.level==="err"?"text-red":l.level==="warn"?"text-amber":l.level==="ok"?"text-green-glow":"text-slate-400"
                }`}>[{l.level}]</span>
                <span className="text-slate-400 w-20 flex-shrink-0">{l.source}</span>
                <span className="text-slate-200 flex-1">{l.message}</span>
              </div>
            ))}
            {logs.length === 0 && <div className="text-slate-600 text-center py-8">No activity yet.</div>}
          </div>
        </Card>
      </motion.div>
    </AppShell>
  );
}

function Stat({ icon: Icon, label, value, suffix, color }: { icon: any; label: string; value: any; suffix?: string; color: "green"|"purple"|"sky"|"amber" }) {
  const bg: Record<string,string> = { green:"from-green/20", purple:"from-purple/20", sky:"from-sky/20", amber:"from-amber/20" };
  const ic: Record<string,string> = { green:"text-green-glow", purple:"text-purple-glow", sky:"text-sky", amber:"text-amber" };
  return (
    <div className={`glass-card p-4 relative overflow-hidden bg-gradient-to-br ${bg} to-transparent`}>
      <div className="flex items-start justify-between mb-2">
        <Icon className={`w-5 h-5 ${ic}`} />
      </div>
      <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1">{label}</div>
      <div className="font-mono font-bold text-2xl tabular-nums">
        {value}<span className="text-sm text-slate-500 font-normal ml-0.5">{suffix}</span>
      </div>
    </div>
  );
}
