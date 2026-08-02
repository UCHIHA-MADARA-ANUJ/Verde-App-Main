"use client";
import { Camera, Upload, Leaf, Loader2, Aperture } from "lucide-react";
import { useRef, useState } from "react";
import type { VerdeImage, PlantResult } from "@/types";

export function PlantDoctorCard({
  currentImage, analysing, plantResult, apiStatus,
  onTriggerCam, onUseCam, onUpload, onDevice, onAnalyse,
  logLines,
}: {
  currentImage: VerdeImage | null;
  analysing: boolean;
  plantResult: PlantResult | null;
  apiStatus: string;
  onTriggerCam: () => void;
  onUseCam: () => VerdeImage | undefined;
  onUpload: (file: File) => void;
  onDevice: (dataUrl: string) => void;
  onAnalyse: (img: VerdeImage) => void;
  logLines: string[];
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);
  const [waitingCam, setWaitingCam] = useState(false);

  const handleDevicePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      if (typeof rd.result === "string") {
        onDevice(rd.result);
      }
    };
    rd.readAsDataURL(f);
  };

  const handleTrigger = () => {
    onTriggerCam();
    setWaitingCam(true);
    setTimeout(() => setWaitingCam(false), 6000);
  };

  const sourceLabel = currentImage?.source === "cam" ? "CAM" : currentImage?.source === "device" ? "DEVICE" : currentImage?.source === "user" ? "UPLOAD" : null;
  const badgeClass = currentImage?.source === "cam" ? "badge badge-purple"
    : currentImage?.source === "device" ? "badge badge-sky"
    : currentImage?.source === "user" ? "badge badge-sky" : "badge badge-amber";

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="flex items-center gap-2 font-mono text-xs font-bold tracking-widest uppercase text-sky">
          <Leaf className="w-3.5 h-3.5" /> Plant Doctor — Analyse Photo
        </h2>
        {sourceLabel && <span className={badgeClass}>SOURCE: {sourceLabel}</span>}
      </div>

      <div className="relative w-full h-52 bg-black rounded-xl border border-border overflow-hidden flex items-center justify-center">
        {currentImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={currentImage.dataUrl} alt="current plant" className="w-full h-full object-contain" />
        ) : (
          <div className="text-center text-slate-600 font-mono text-xs p-4">
            <Aperture className="w-10 h-10 mx-auto mb-2 opacity-30" />
            No image loaded.<br />
            <span className="text-slate-500">Capture from ESP32 cam, snap with device, or upload a photo.</span>
          </div>
        )}
        {analysing && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-10 h-10 text-green animate-spin" />
              <div className="font-mono text-xs text-green-glow">analysing with crop.health…</div>
              <div className="w-40 h-1 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-green to-purple animate-pulse" style={{ width: "70%" }} />
              </div>
            </div>
          </div>
        )}
        {/* Scan line effect when analysing */}
        {analysing && (
          <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-green to-transparent animate-scan" />
        )}
      </div>

      <div className="mt-2 font-mono text-[10px] text-slate-500">
        Current image: {currentImage ? `${currentImage.name} (${sourceLabel})` : "none"}
      </div>

      <div className="grid grid-cols-2 gap-2 mt-3">
        <button className="btn btn-red justify-center col-span-2" onClick={handleTrigger}>
          <Camera className="w-3.5 h-3.5" /> {waitingCam ? "WAITING FOR ESP32…" : "📸 TRIGGER ESP32 CAPTURE"}
        </button>
        <button className="btn btn-purple justify-center"
          onClick={() => {
            const img = onUseCam();
            if (img) onAnalyse(img);
          }}>
          <Camera className="w-3.5 h-3.5" /> USE CAM PHOTO
        </button>
        <button className="btn justify-center" onClick={() => fileRef.current?.click()}>
          <Upload className="w-3.5 h-3.5" /> UPLOAD
        </button>
        <button className="btn btn-green justify-center col-span-2"
          onClick={() => camRef.current?.click()}>
          <Aperture className="w-3.5 h-3.5" /> 📱 SNAP WITH DEVICE CAMERA
        </button>
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = ""; }} />
      <input ref={camRef} type="file" accept="image/*" capture="environment" className="hidden"
        onChange={e => { handleDevicePhoto(e); e.target.value = ""; }} />

      {/* Result panel */}
      {plantResult && (
        <div className="mt-4 rounded-xl border border-green/30 bg-green/5 p-3 space-y-2">
          <div className="flex items-start gap-2">
            <Leaf className="w-4 h-4 text-green-glow mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="font-bold text-green-glow text-sm">
                {plantResult.name}
                {plantResult.common && <span className="text-slate-400 font-normal"> ({plantResult.common})</span>}
                <span className="ml-2 badge badge-green">{plantResult.prob}%</span>
              </div>
              {plantResult.disease && (
                <div className="mt-2">
                  <div className={`text-xs font-bold ${plantResult.disease.name.toLowerCase().includes("healthy") ? "text-green-glow" : "text-red"}`}>
                    🩺 {plantResult.disease.name}
                    <span className="ml-2 font-mono text-slate-400">{plantResult.disease.prob}%</span>
                  </div>
                  {plantResult.disease.treatment && (
                    <div className="mt-1 text-[11px] text-slate-300 leading-relaxed">
                      💊 {plantResult.disease.treatment}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mt-3 font-mono text-[10px] text-slate-500 break-all">{apiStatus}</div>

      {/* Log */}
      <div className="mt-3 terminal h-28 text-[10px] text-green-glow/80">
        {logLines.slice(-30).map((l, i) => (
          <div key={i} className="terminal-entry">{l}</div>
        ))}
      </div>
    </div>
  );
}
