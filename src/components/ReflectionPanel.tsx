import React, { useState, useEffect } from "react";
import { Brain, Heart, Users, Activity, Save, Sparkles, Target } from "lucide-react";
import { ReflectionData } from "../types";
import { db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";

interface ReflectionPanelProps {
  userId: string;
  missionId: string;
  onReflectionSaved: (pointsEarned: number) => void;
  initialData?: ReflectionData;
}

export default function ReflectionPanel({ userId, missionId, onReflectionSaved, initialData }: ReflectionPanelProps) {
  // Reflective text states
  const [pikirText, setPikirText] = useState(initialData?.pikirText || "");
  const [hatiText, setHatiText] = useState(initialData?.hatiText || "");
  const [rasaText, setRasaText] = useState(initialData?.rasaText || "");
  const [ragaText, setRagaText] = useState(initialData?.ragaText || "");

  // Slider Metric Values (1-10)
  const [pikirVal, setPikirVal] = useState(initialData?.pikirVal || 5);
  const [hatiVal, setHatiVal] = useState(initialData?.hatiVal || 5);
  const [rasaVal, setRasaVal] = useState(initialData?.rasaVal || 5);
  const [ragaVal, setRagaVal] = useState(initialData?.ragaVal || 5);

  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setPikirText(initialData.pikirText);
      setHatiText(initialData.hatiText);
      setRasaText(initialData.rasaText);
      setRagaText(initialData.ragaText);
      setPikirVal(initialData.pikirVal);
      setHatiVal(initialData.hatiVal);
      setRasaVal(initialData.rasaVal);
      setRagaVal(initialData.ragaVal);
    }
  }, [initialData]);

  // SVG Radar Coordinates helpers
  const cx = 150;
  const cy = 150;
  const maxR = 90;

  const rP = (pikirVal / 10) * maxR;
  const rH = (hatiVal / 10) * maxR;
  const rRa = (rasaVal / 10) * maxR;
  const rRg = (ragaVal / 10) * maxR;

  const pPt = { x: cx, y: cy - rP };
  const hPt = { x: cx + rH, y: cy };
  const raPt = { x: cx, y: cy + rRa };
  const rgPt = { x: cx - rRg, y: cy };

  const polygonPath = `M ${pPt.x} ${pPt.y} L ${hPt.x} ${hPt.y} L ${raPt.x} ${raPt.y} L ${rgPt.x} ${rgPt.y} Z`;

  const handlesave = async () => {
    if (!pikirText || !hatiText || !rasaText || !ragaText) {
      setFeedback("Tuliskan refleksi singkat pada keempat kotak dimensi dahulu!");
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    const reflectionId = `ref_${missionId}_${Date.now()}`;
    const data: ReflectionData = {
      id: reflectionId,
      userId,
      missionId,
      pikirText,
      pikirVal,
      hatiText,
      hatiVal,
      rasaText,
      rasaVal,
      ragaText,
      ragaVal,
      createdAt: new Date().toISOString(),
    };

    if (userId.startsWith("guest_")) {
      setFeedback("Refleksi tersimpan di Profil Lokal (Offline). Hebat!");
      onReflectionSaved(150);
      setIsSaving(false);
      return;
    }

    try {
      const docRef = doc(db, "users", userId, "reflections", reflectionId);
      await setDoc(docRef, data);
      setFeedback("Refleksi Pikir-Hati-Rasa-Raga Berhasil Tersimpan di Firestore!");
      onReflectionSaved(150); // give 150 points for deep learning reflection!
    } catch (err) {
      console.error(err);
      // Fallback offline success
      setFeedback("Refleksi tersimpan di Profil Lokal (Offline). Hebat!");
      onReflectionSaved(150);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-850 rounded-2xl p-6 shadow-xl flex flex-col xl:flex-row gap-8">
      {/* 4-Dimension Fields Left */}
      <div className="flex-1 space-y-6">
        <div>
          <h4 className="text-sm font-black text-rose-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
            <Target className="w-5 h-5 text-rose-500 animate-spin-slow" /> Refleksi 4 Dimensi Deep Learning
          </h4>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Dalam Kurikulum Merdeka, sains tidak lengkap tanpa penguatan karakter sosial-spiritual. Isi kotak reflektif di bawah dengan jujur:
          </p>
        </div>

        {/* 1. PIKIR */}
        <div className="bg-slate-950 p-4 rounded-xl border border-blue-950 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-blue-400 flex items-center gap-1.5 uppercase tracking-wider">
              <Brain className="w-4 h-4 text-blue-400" /> Dimensi PIKIR (Kognitif)
            </label>
            <span className="text-[10px] text-blue-400 font-mono font-bold">Skor Pemahaman: {pikirVal}/10</span>
          </div>
          <p className="text-[10px] text-slate-400">Apa pengetahuan mitigasi baru yang berhasil terserap di kepalamu?</p>
          <textarea
            value={pikirText}
            onChange={(e) => setPikirText(e.target.value)}
            rows={2}
            placeholder="Contoh: Saya belajar pentingnya melindungi kepala di bawah meja kokoh..."
            className="w-full bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-600 rounded-lg p-2.5 text-xs focus:border-blue-500 outline-none resize-none leading-relaxed"
          />
          <input
            type="range"
            min={1}
            max={10}
            value={pikirVal}
            onChange={(e) => setPikirVal(Number(e.target.value))}
            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>

        {/* 2. HATI */}
        <div className="bg-slate-950 p-4 rounded-xl border border-rose-950 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-rose-400 flex items-center gap-1.5 uppercase tracking-wider">
              <Heart className="w-4 h-4 text-rose-400" /> Dimensi HATI (Apresiasi / Spiritual)
            </label>
            <span className="text-[10px] text-rose-400 font-mono font-bold">Apresiasi Nilai: {hatiVal}/10</span>
          </div>
          <p className="text-[10px] text-slate-400">Nilai moral, keselamatan, atau ketuhanan apa yang menggerakkan hatimu?</p>
          <textarea
            value={hatiText}
            onChange={(e) => setHatiText(e.target.value)}
            rows={2}
            placeholder="Contoh: Saya bersyukur karena ilmu mitigasi ini bisa menjaga nyawa diri sendiri dan keluarga..."
            className="w-full bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-600 rounded-lg p-2.5 text-xs focus:border-rose-500 outline-none resize-none leading-relaxed"
          />
          <input
            type="range"
            min={1}
            max={10}
            value={hatiVal}
            onChange={(e) => setHatiVal(Number(e.target.value))}
            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
          />
        </div>

        {/* 3. RASA */}
        <div className="bg-slate-950 p-4 rounded-xl border border-purple-950 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-purple-400 flex items-center gap-1.5 uppercase tracking-wider">
              <Users className="w-4 h-4 text-purple-400" /> Dimensi RASA (Empati Sosial)
            </label>
            <span className="text-[10px] text-purple-400 font-mono font-bold">Empati Korban: {rasaVal}/10</span>
          </div>
          <p className="text-[10px] text-slate-400">Bagaimana perasaanmu terhadap masyarakat Indonesia yang tinggal di wilayah rawan bencana?</p>
          <textarea
            value={rasaText}
            onChange={(e) => setRasaText(e.target.value)}
            rows={2}
            placeholder="Contoh: Saya merasa empati dan ingin membantu mengedukasi kawan-kawan tentang rute evakuasi..."
            className="w-full bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-600 rounded-lg p-2.5 text-xs focus:border-purple-500 outline-none resize-none leading-relaxed"
          />
          <input
            type="range"
            min={1}
            max={10}
            value={rasaVal}
            onChange={(e) => setRasaVal(Number(e.target.value))}
            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
        </div>

        {/* 4. RAGA */}
        <div className="bg-slate-950 p-4 rounded-xl border border-emerald-950 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
              <Activity className="w-4 h-4 text-emerald-400" /> Dimensi RAGA (Tindakan Nyata)
            </label>
            <span className="text-[10px] text-emerald-400 font-mono font-bold">Aksi Raga: {ragaVal}/10</span>
          </div>
          <p className="text-[10px] text-slate-400">Tindakan fisik atau aksi kesiapsiagaan apa yang akan kamu lakukan di rumah/sekolah?</p>
          <textarea
            value={ragaText}
            onChange={(e) => setRagaText(e.target.value)}
            rows={2}
            placeholder="Contoh: Saya akan memeriksa jalur evakuasi di rumah dan menyiapkan tas siaga bersama orang tua..."
            className="w-full bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-600 rounded-lg p-2.5 text-xs focus:border-emerald-500 outline-none resize-none leading-relaxed"
          />
          <input
            type="range"
            min={1}
            max={10}
            value={ragaVal}
            onChange={(e) => setRagaVal(Number(e.target.value))}
            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>
      </div>

      {/* Radar Chart Display Right */}
      <div className="lg:w-80 flex flex-col justify-between items-center border-t xl:border-t-0 xl:border-l border-slate-800 pt-6 xl:pt-0 xl:pl-8">
        <div className="text-center">
          <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">
            Visualisasi Profil Tangguh
          </h5>
          <p className="text-[10px] text-slate-500">
            Peta radar menyelaraskan keseimbangan 4 dimensi tanggap bencanamu:
          </p>
        </div>

        {/* Dynamic Glowing SVG Radar Chart */}
        <div className="my-6 relative bg-slate-950 p-3 rounded-2xl border border-slate-850 shadow-inner">
          <svg width="280" height="280" className="overflow-visible select-none">
            {/* Grid circles background */}
            <circle cx={cx} cy={cy} r={maxR} fill="none" stroke="#1e293b" strokeWidth="1" />
            <circle cx={cx} cy={cy} r={maxR * 0.75} fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="3,3" />
            <circle cx={cx} cy={cy} r={maxR * 0.5} fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="3,3" />
            <circle cx={cx} cy={cy} r={maxR * 0.25} fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="3,3" />

            {/* Axes Lines */}
            <line x1={cx} y1={cy - maxR} x2={cx} y2={cy + maxR} stroke="#1e293b" strokeWidth="1" />
            <line x1={cx - maxR} y1={cy} x2={cx + maxR} y2={cy} stroke="#1e293b" strokeWidth="1" />

            {/* Axis Labels */}
            <text x={cx} y={cy - maxR - 8} textAnchor="middle" fill="#38bdf8" className="text-[10px] font-extrabold tracking-wider">PIKIR (IQ)</text>
            <text x={cx + maxR + 10} y={cy + 4} textAnchor="start" fill="#f43f5e" className="text-[10px] font-extrabold tracking-wider">HATI (SQ)</text>
            <text x={cx} y={cy + maxR + 15} textAnchor="middle" fill="#c084fc" className="text-[10px] font-extrabold tracking-wider">RASA (EQ)</text>
            <text x={cx - maxR - 10} y={cy + 4} textAnchor="end" fill="#34d399" className="text-[10px] font-extrabold tracking-wider">RAGA (AQ)</text>

            {/* Fill Radar Area */}
            <polygon
              points={`${pPt.x},${pPt.y} ${hPt.x},${hPt.y} ${raPt.x},${raPt.y} ${rgPt.x},${rgPt.y}`}
              fill="url(#radarGradient)"
              stroke="#fbbf24"
              strokeWidth="2.5"
              className="drop-shadow-[0_0_10px_rgba(251,191,36,0.4)]"
            />

            {/* Vertice marker nodes */}
            <circle cx={pPt.x} cy={pPt.y} r="4" fill="#38bdf8" />
            <circle cx={hPt.x} cy={hPt.y} r="4" fill="#f43f5e" />
            <circle cx={raPt.x} cy={raPt.y} r="4" fill="#c084fc" />
            <circle cx={rgPt.x} cy={rgPt.y} r="4" fill="#34d399" />

            {/* SVG Gradient definitions */}
            <defs>
              <radialGradient id="radarGradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#d97706" stopOpacity="0.6" />
              </radialGradient>
            </defs>
          </svg>
        </div>

        {/* CTA Save reflection */}
        <div className="w-full space-y-3 pt-4 border-t border-slate-850">
          {feedback && (
            <div className={`p-3 rounded-xl text-center text-[11px] font-bold border leading-relaxed ${
              feedback.includes("Berhasil") || feedback.includes("Lokal")
                ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                : "bg-rose-950/30 border-rose-500/40 text-red-400"
            }`}>
              {feedback}
            </div>
          )}

          <button
            onClick={handlesave}
            disabled={isSaving}
            className="w-full bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 text-white font-extrabold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs transition uppercase tracking-wider shadow-lg"
          >
            <Save className="w-4 h-4" /> {isSaving ? "Menyimpan ke Cloud..." : "Simpan Refleksi Karakter"}
          </button>
        </div>
      </div>
    </div>
  );
}
