"use client";
import { Camera, Upload, Leaf, Aperture, Scan } from "lucide-react";
import { useRef, useState, useMemo } from "react";
import { useVerdeStore } from "@/store/verde-store";
import { Card, CardHeader, CardTitle } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { identifyPlant, parseKindwiseResult, setCtrl } from "@/lib/services";
import { sfx } from "@/lib/sound";
import { toDataUrlFromFile, resizeImage, cn } from "@/lib/utils";
import { ProgressBar } from "./ui/ProgressBar";
import { Terminal } from "./ui/Terminal";

export function PlantDoctorCard() {
  const currentImage = useVerdeStore(s => s.currentImage);
  const plantResult = useVerdeStore(s => s.plantResult);
  const analysing = useVerdeStore(s => s.analysing);
  const analysisProgress = useVerdeStore(s => s.analysisProgress);
  const newPhotoFlash = useVerdeStore(s => s.newPhotoFlash);
  const latestScan = useVerdeStore(s => s.latestScan);
  const allLogs = useVerdeStore(s => s.logs);
  const setCurrentImage = useVerdeStore(s => s.setCurrentImage);
  const setPlantResult = useVerdeStore(s => s.setPlantResult);
  const setAnalysing = useVerdeStore(s => s.setAnalysing);
  const addHistoryItem = useVerdeStore(s => s.addHistoryItem);
  const openModal = useVerdeStore(s => s.openModal);
  const log = useVerdeStore(s => s.log);
  const setApiStatus = useVerdeStore(s => s.setApiStatus);
  const pushNotification = useVerdeStore(s => s.pushNotification);
  const autoOpen = useVerdeStore(s => s.settings.autoOpenModalOnAnalysis);

  const logs = useMemo(() => allLogs.filter(l => ["plant-dr","firebase","camera","calibration"].includes(l.source)).slice(-20), [allLogs]);

  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);
  const [waitingCam, setWaitingCam] = useState(false);

  const analyse = async (img: any) => {
    setPlantResult(null);
    setAnalysing(true, 5);
    setApiStatus("plant", "⏳ analysing…");
    sfx.scan();
    log("info", "plant-dr", `Analysing ${img.name} with crop.health…`);
    try {
      // resize for speed
      const resized = await resizeImage(img.dataUrl, 1024, 1024, 0.82);
      setAnalysing(true, 25);
      const j = await identifyPlant(resized);
      setAnalysing(true, 80);
      const { crops, diseases } = parseKindwiseResult(j);
      let result: any = null;
      if (crops.length) {
        result = crops[0];
        if (diseases.length) result.disease = diseases[0];
        setPlantResult(result);
        log("ok", "plant-dr", `${crops[0].name} (${crops[0].prob}%)${diseases.length ? ` · ${diseases[0].name}` : ""}`);
        setApiStatus("plant", `✅ ${result.name} ${result.prob}%`);
        addHistoryItem({
          id: Math.random().toString(36).slice(2),
          image: img, result, ts: Date.now(),
        });
        sfx.success();
        pushNotification({
          level: diseases[0] && !/healthy/i.test(diseases[0].name) ? "warn" : "ok",
          title: "Analysis complete",
          body: `${result.name} (${result.prob}%)${diseases[0] ? ` · ${diseases[0].name}` : ""}`,
        });
        if (autoOpen) openModal("analysis", { image: img, result });
      } else {
        setApiStatus("plant", "❌ no results");
        log("warn", "plant-dr", "No suggestions — is this a clear plant photo?");
      }
      setAnalysing(false, 100);
    } catch(e:any) {
      setAnalysing(false, 0);
      setApiStatus("plant", `❌ ${e.message.slice(0,60)}`);
      log("err", "plant-dr", e.message);
      sfx.error();
    }
  };

  const triggerCam = async () => {
    sfx.click();
    log("info", "plant-dr", "📸 Triggering ESP32 CAM capture (sets /controls/capture_photo=true)…");
    setWaitingCam(true);
    useVerdeStore.getState().setExpectingNewPhoto(true);
    try {
      await setCtrl("capture_photo", true);
      setTimeout(() => setCtrl("capture_photo", false).catch(()=>{}), 4000);
      setTimeout(() => setWaitingCam(false), 8000);
    } catch(e:any) {
      log("err","plant-dr",`Capture trigger FAILED: ${e.message}`);
      setWaitingCam(false);
      useVerdeStore.getState().setExpectingNewPhoto(false);
    }
  };

  const useCam = () => {
    const latest = useVerdeStore.getState().latestScan;
    if (!latest.imageUrl) {
      log("warn","plant-dr","No CAM photo in RTDB yet. Trigger one!");
      alert("No CAM photo found. Trigger capture first.");
      return;
    }
    const img = { dataUrl: latest.imageUrl, source: "cam" as const, name: "cam-capture", ts: latest.ts ?? Date.now() };
    setCurrentImage(img);
    analyse(img);
  };

  const onUpload = async (f: File) => {
    sfx.shutter();
    const dataUrl = await toDataUrlFromFile(f);
    const img = { dataUrl, source: "user" as const, name: f.name, ts: Date.now() };
    setCurrentImage(img);
    analyse(img);
  };

  const onDeviceCam = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    sfx.shutter();
    const dataUrl = await toDataUrlFromFile(f);
    const img = { dataUrl, source: "device" as const, name: `device-${Date.now()}.jpg`, ts: Date.now() };
    setCurrentImage(img);
    e.target.value = "";
    analyse(img);
  };

  const sourceLabel = currentImage?.source === "cam" ? "CAM" : currentImage?.source === "device" ? "DEVICE" : currentImage?.source === "user" ? "UPLOAD" : null;
  const badgeColor = currentImage?.source === "cam" ? "purple" : currentImage ? "sky" : "amber";

  return (
    <Card accent="purple">
      <CardHeader>
        <CardTitle icon={Leaf} color="purple">Plant Doctor — Analyse Photo</CardTitle>
        {sourceLabel && <Badge color={badgeColor as any}>SOURCE: {sourceLabel}</Badge>}
      </CardHeader>

      <div className="relative w-full h-52 bg-black rounded-xl border border-border overflow-hidden flex items-center justify-center">
        {currentImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentImage.dataUrl}
            alt="current plant"
            className={cn("w-full h-full object-contain", currentImage.source === "cam" && "rotate-180")}
          />
        ) : (
          <div className="text-center text-slate-600 font-mono text-xs p-4">
            <Aperture className="w-10 h-10 mx-auto mb-2 opacity-30" />
            No image loaded.<br/>
            <span className="text-slate-500">Capture from ESP32, snap with device, or upload.</span>
          </div>
        )}
        {newPhotoFlash && currentImage?.source === "cam" && (
          <div className="absolute top-2 right-2 bg-red text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
            ● LIVE NEW
          </div>
        )}
        {currentImage?.source === "cam" && (
          <span className="absolute top-2 left-2 text-[9px] font-mono px-1.5 py-0.5 bg-purple/20 text-purple-glow border border-purple/40 rounded">
            CAM 180°
          </span>
        )}
        {analysing && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
            <div className="relative">
              <Scan className="w-10 h-10 text-green animate-pulse" />
              <div className="absolute inset-x-0 top-1/2 h-0.5 bg-gradient-to-r from-transparent via-green to-transparent animate-scan" />
            </div>
            <div className="font-mono text-xs text-green-glow">analysing with crop.health…</div>
            <div className="w-48">
              <ProgressBar value={analysisProgress} color="green" />
            </div>
          </div>
        )}
      </div>

      <div className="mt-2 font-mono text-[10px] text-slate-500">
        Current image: {currentImage ? `${currentImage.name} · ${sourceLabel}` : "none"}
        {currentImage?.source === "cam" && latestScan?.captured_at && (
          <span className="ml-2 text-green-glow/70">
            captured {new Date(typeof latestScan.captured_at === "number" ? latestScan.captured_at : Date.now()).toLocaleTimeString([], {hour12:false})}
          </span>
        )}
        {currentImage?.ts && currentImage.source !== "cam" && (
          <span className="ml-2 text-sky/70">
            uploaded {new Date(currentImage.ts).toLocaleTimeString([], {hour12:false})}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 mt-3">
        <Button variant="red" className="col-span-2 justify-center" onClick={triggerCam} disabled={waitingCam}>
          <Camera className="w-3.5 h-3.5" /> {waitingCam ? "WAITING FOR ESP32…" : "📸 TRIGGER ESP32 CAPTURE"}
        </Button>
        <Button variant="purple" className="justify-center" onClick={useCam}>
          <Camera className="w-3.5 h-3.5" /> USE CAM PHOTO
        </Button>
        <Button className="justify-center" onClick={() => fileRef.current?.click()}>
          <Upload className="w-3.5 h-3.5" /> UPLOAD
        </Button>
        <Button variant="green" className="col-span-2 justify-center" onClick={() => camRef.current?.click()}>
          <Aperture className="w-3.5 h-3.5" /> 📱 SNAP WITH DEVICE CAMERA
        </Button>
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value=""; }} />
      <input ref={camRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onDeviceCam} />

      {plantResult && (
        <div className="mt-4 rounded-xl border border-green/30 bg-green/5 p-3 space-y-2">
          <div className="flex items-start gap-2">
            <Leaf className="w-4 h-4 text-green-glow mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-bold text-green-glow text-sm flex items-center flex-wrap gap-2">
                {plantResult.name}
                {plantResult.common && <span className="text-slate-400 font-normal">({plantResult.common})</span>}
                <Badge color="green">{plantResult.prob}%</Badge>
              </div>
              {plantResult.wiki?.description && (
                <div className="text-[11px] text-slate-300 mt-1 leading-relaxed line-clamp-3">{plantResult.wiki.description.slice(0, 220)}…</div>
              )}
              {plantResult.disease && (
                <div className="mt-2">
                  <div className={`text-xs font-bold ${/healthy/i.test(plantResult.disease.name) ? "text-green-glow" : plantResult.disease.severity === "high" ? "text-red" : plantResult.disease.severity === "medium" ? "text-amber" : "text-slate-300"}`}>
                    🩺 {plantResult.disease.name}
                    <span className="ml-2 font-mono text-slate-400">{plantResult.disease.prob}%</span>
                    {plantResult.disease.severity && <Badge color={plantResult.disease.severity==="high"?"red":plantResult.disease.severity==="medium"?"amber":"green"} className="ml-2">{plantResult.disease.severity}</Badge>}
                  </div>
                  {plantResult.disease.treatment && (
                    <div className="mt-1 text-[11px] text-slate-300 leading-relaxed">💊 {plantResult.disease.treatment}</div>
                  )}
                </div>
              )}
              {plantResult.watering && (
                <div className="mt-2 text-[10px] text-sky font-mono">
                  💧 Water every {plantResult.watering.min_freq_days}–{plantResult.watering.max_freq_days} days
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Terminal
        lines={logs.map(l => ({
          who: (l.level === "err" ? "err" : l.level === "warn" ? "warn" : l.level === "ok" ? "ok" : "info") as any,
          text: `[${new Date(l.ts).toLocaleTimeString([], {hour12:false})}] ${l.message}`,
        }))}
        heightClass="h-28 text-[10px]"
      />
    </Card>
  );
}
