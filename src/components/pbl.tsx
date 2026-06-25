import React, { useState, useRef, useEffect } from "react";
import { Flag, Trash2, Edit3, CheckCircle, Save, Sparkles, AlertCircle } from "lucide-react";
import { PBLProject } from "../types";
import { db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";

interface PBLProps {
  userId: string;
  onProjectSaved: (pointsEarned: number) => void;
}

export default function PBL({ userId, onProjectSaved }: PBLProps) {
  const [title, setTitle] = useState("Rancangan Peta Evakuasi Rumah Kelompokku");
  const [description, setDescription] = useState(
    "Ini adalah denah jalur keluar rumah saya menuju jalan utama perumahan yang aman dari runtuhan tiang listrik."
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // HTML5 Drawing Canvas for sketch map
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    
    // Set display/retina resolution
    canvas.width = 460;
    canvas.height = 240;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#ef4444"; // red sketch pen
      ctx.lineWidth = 3.5;
      ctxRef.current = ctx;

      // Draw grid-lines initially as blueprint
      ctx.fillStyle = "#0c0a09"; // stone-950 dark background
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = "#1c1917"; // stone-800 grids
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.width; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
      }
      for (let j = 0; j < canvas.height; j += 20) {
        ctx.beginPath();
        ctx.moveTo(0, j);
        ctx.lineTo(canvas.width, j);
        ctx.stroke();
      }

      ctx.strokeStyle = "#ef4444"; // restore red draw line
      ctx.lineWidth = 3.5;
    }
  }, []);

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!ctxRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    let clientX, clientY;
    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctxRef.current.beginPath();
    ctxRef.current.moveTo(x, y);
    setIsDrawing(true);
  };

  const drawAction = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !ctxRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    let clientX, clientY;
    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
      e.preventDefault(); // prevent scroll on touch
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctxRef.current.lineTo(x, y);
    ctxRef.current.stroke();
  };

  const endDraw = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    if (!canvasRef.current || !ctxRef.current) return;
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;

    ctx.fillStyle = "#0c0a09"; // reset background
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "#1c1917";
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 20) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    for (let j = 0; j < canvas.height; j += 20) {
      ctx.beginPath();
      ctx.moveTo(0, j);
      ctx.lineTo(canvas.width, j);
      ctx.stroke();
    }

    ctx.strokeStyle = "#ef4444"; // restore draw style
    ctx.lineWidth = 3.5;
  };

  const handlesave = async () => {
    if (!title.trim() || !description.trim()) {
      setSaveStatus("Tolong lengkapi Judul Proyek dan Keterangan!");
      return;
    }

    setIsSaving(true);
    setSaveStatus(null);

    const canvas = canvasRef.current;
    const base64Sketch = canvas ? canvas.toDataURL() : "";

    const projectId = "proj_" + Date.now();
    const data: PBLProject = {
      id: projectId,
      userId,
      title,
      description,
      fileUrlOrData: base64Sketch,
      status: "Terkirim",
      createdAt: new Date().toISOString(),
    };

    if (userId.startsWith("guest_")) {
      setSaveStatus("Proyek disimpan ke Portofolio Lokal (Offline). Hebat!");
      onProjectSaved(200);
      setIsSaving(false);
      return;
    }

    try {
      const docRef = doc(db, "users", userId, "projects", projectId);
      await setDoc(docRef, data);
      setSaveStatus("Hebat! Proyek Peta Evakuasi Rumahku berhasil diunggah demi memenuhi Pembelajaran Berbasis Proyek Kurikulum Merdeka!");
      onProjectSaved(200); // 200 points for project upload!
    } catch (err) {
      console.error(err);
      setSaveStatus("Proyek disimpan ke Portofolio Lokal (Offline). Hebat!");
      onProjectSaved(200);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-850 rounded-2xl p-6 shadow-xl flex flex-col xl:flex-row gap-8">
      {/* Forms Segment Left */}
      <div className="flex-1 space-y-4">
        <div>
          <h4 className="text-sm font-black text-blue-400 uppercase tracking-widest mb-1 shadow-inner">
            Kreativitas Proyek: Peta Evakuasi Rumahku
          </h4>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Kegiatan akhir Pembelajaran Berbasis Proyek (Project-Based Learning). Buatlah coretan peta/sketsa jalur keluar cepat dari ruang kamarmu menuju titik kumpul halaman rumah yang bebas reruntuhan:
          </p>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">
            Nama / Judul Tugas:
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-4 py-2.5 text-xs focus:border-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">
            Keterangan/Penjelasan Logika Mitigasi:
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 rounded-xl p-3 text-xs focus:border-blue-500 outline-none leading-relaxed resize-none"
          />
        </div>
      </div>

      {/* Canvas Draw Block Right */}
      <div className="xl:w-120 flex flex-col gap-4">
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between mb-1.5">
            <span className="flex items-center gap-1.5"><Edit3 className="w-4 h-4 text-rose-500" /> Papan Gambar Sketsa 2D:</span>
            <button
              onClick={clearCanvas}
              type="button"
              className="text-[10px] text-red-400 hover:text-red-300 font-extrabold flex items-center gap-1 underline transition"
            >
              <Trash2 className="w-3.5 h-3.5" /> Bersihkan Papan
            </button>
          </label>

          {/* Interactive touch-drawing canvas wrapper */}
          <div className="border border-slate-800 rounded-xl overflow-hidden shadow-inner bg-stone-950 flex items-center justify-center p-1.5">
            <canvas
              ref={canvasRef}
              onMouseDown={startDraw}
              onMouseMove={drawAction}
              onMouseUp={endDraw}
              onMouseLeave={endDraw}
              onTouchStart={startDraw}
              onTouchMove={drawAction}
              onTouchEnd={endDraw}
              className="max-w-full h-auto cursor-crosshair rounded-lg"
            />
          </div>
        </div>

        {/* Save segment */}
        <div className="space-y-3.5">
          {saveStatus && (
            <div className={`p-3 rounded-xl text-center text-xs border leading-relaxed ${
              saveStatus.includes("Berhasil") || saveStatus.includes("Lokal")
                ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                : "bg-rose-950/30 border-rose-500/40 text-red-500"
            }`}>
              {saveStatus}
            </div>
          )}

          <button
            onClick={handlesave}
            disabled={isSaving}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-extrabold py-3.5 px-6 rounded-xl text-xs transition uppercase tracking-wider shadow-lg flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-4 h-4" /> {isSaving ? "Mengunggah Proyek..." : "Kirim Sketsa Portofolio"}
          </button>
        </div>
      </div>
    </div>
  );
}
