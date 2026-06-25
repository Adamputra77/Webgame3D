import React, { useState } from "react";
import { Award, Brain, Heart, Activity, Smile, Sparkles, Check } from "lucide-react";

interface DisasterRefleksiProps {
  onRefleksiComplete: (name: string, feeling: string, reflectionData: any) => void;
}

export default function DisasterRefleksi({ onRefleksiComplete }: DisasterRefleksiProps) {
  const [studentName, setStudentName] = useState("");
  const [selectedFeeling, setSelectedFeeling] = useState<string>("Senang");
  const [pikirText, setPikirText] = useState("");
  const [hatiText, setHatiText] = useState("");
  const [ragaText, setRagaText] = useState("");

  const feelings = [
    { label: "Senang", emoji: "😄", color: "bg-emerald-50 border-emerald-200 text-emerald-700" },
    { label: "Semangat", emoji: "🤩", color: "bg-amber-50 border-amber-200 text-amber-700" },
    { label: "Bangga", emoji: "😎", color: "bg-indigo-50 border-indigo-200 text-indigo-700" },
    { label: "Siaga", emoji: "😌", color: "bg-sky-50 border-sky-200 text-sky-700" }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !pikirText.trim() || !hatiText.trim() || !ragaText.trim()) {
      alert("Lengkapi semua kotak jawaban refleksimu ya, Pahlawan Siaga!");
      return;
    }
    onRefleksiComplete(studentName, selectedFeeling, {
      pikirText,
      hatiText,
      ragaText,
      selectedFeeling
    });
  };

  return (
    <div className="bg-white border-4 border-indigo-100 rounded-3xl p-6 md:p-8 shadow-sm space-y-6 text-[#1E293B]">
      {/* Header */}
      <div className="border-b-2 border-indigo-50 pb-4 text-center sm:text-left">
        <span className="bg-amber-50 text-amber-850 text-[11px] font-black tracking-widest uppercase py-1 px-3.5 rounded-full border border-amber-150">
          STASIUN REKAPITULASI ADVENTURE
        </span>
        <h3 className="text-xl font-black text-slate-800 mt-2 font-playful flex items-center justify-center sm:justify-start gap-2">
          <Award className="w-6 h-6 text-amber-500 animate-pulse" /> Tahap 8: Refleksi & Penamaan Sertifikat
        </h3>
        <p className="text-xs text-slate-500 mt-1 font-semibold leading-relaxed">
          Kamu telah melintasi 4 tantangan bencana! Mari isi refleksi akhir raga di bawah ini untuk mengunci pencapaian belajarmu.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name input */}
        <div className="bg-indigo-50/40 p-5 rounded-2xl border-2 border-indigo-50 space-y-2">
          <label className="text-sm font-black text-indigo-700 uppercase tracking-wide block">
            ✍️ Siapa Nama Lengkapmu? (Ditampilkan di Sertifikat)
          </label>
          <input
            type="text"
            required
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            placeholder="Tulis nama lengkapmu untuk dicetak di sertifikat..."
            className="w-full bg-white border-2 border-slate-200 text-slate-800 rounded-xl px-4 py-3.5 text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition font-extrabold"
          />
        </div>

        {/* Feel selection */}
        <div className="space-y-3">
          <label className="text-xs font-black text-slate-750 uppercase tracking-wide block">
            🥰 Pilih Perasaanmu Setelah Belajar & Bermain:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {feelings.map((f) => (
              <button
                type="button"
                key={f.label}
                onClick={() => setSelectedFeeling(f.label)}
                className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-1.5 transition cursor-pointer active:scale-95 ${
                  selectedFeeling === f.label
                    ? "bg-indigo-650 border-indigo-750 text-white shadow-md font-black"
                    : `bg-white border-slate-200 text-slate-600 ${f.color}`
                }`}
              >
                <span className="text-3xl select-none animate-float" style={{ animationDuration: "4s" }}>{f.emoji}</span>
                <span className="text-xs font-extrabold">{f.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 3 Child friendly Refleksi fields */}
        <div className="space-y-4">
          <h4 className="text-xs font-black text-slate-700 uppercase tracking-wide block border-b border-slate-100 pb-1">
            💭 Jawab Pertanyaan Reflektif (Pikir, Hati & Raga):
          </h4>

          {/* 1. PIKIR */}
          <div className="bg-blue-50/40 p-4 rounded-2xl border-2 border-blue-50 space-y-2">
            <label className="text-xs font-extrabold text-blue-700 flex items-center gap-2 uppercase">
              <Brain className="w-4 h-4" /> 1. PIKIR (Kognitif)
            </label>
            <p className="text-[11px] text-slate-500 font-semibold leading-tight">
              Hal atau tanda bencana apa yang paling kamu ingat dari petualangan 3D kita?
            </p>
            <textarea
              required
              rows={2}
              value={pikirText}
              onChange={(e) => setPikirText(e.target.value)}
              placeholder="Contoh: Saya paling ingat kalau tsunami tandanya air laut surut drastis, kita harus lari ke bukit tinggi..."
              className="w-full bg-white border-2 border-slate-200 rounded-xl p-3 text-xs text-slate-800 outline-none focus:border-blue-400 font-semibold leading-relaxed"
            />
          </div>

          {/* 2. HATI & RASA */}
          <div className="bg-rose-50/40 p-4 rounded-2xl border-2 border-rose-50 space-y-2">
            <label className="text-xs font-extrabold text-rose-700 flex items-center gap-2 uppercase">
              <Heart className="w-4 h-4" /> 2. HATI & RASA (Empati & Spiritual)
            </label>
            <p className="text-[11px] text-slate-500 font-semibold leading-tight">
              Bagaimana cara kita mendoakan atau berempati kepada teman-teman kita di wilayah rawan bencana?
            </p>
            <textarea
              required
              rows={2}
              value={hatiText}
              onChange={(e) => setHatiText(e.target.value)}
              placeholder="Contoh: Saya bersyukur raga saya aman, dan saya ingin mendoakan serta mengajari teman-teman rute evakuasi..."
              className="w-full bg-white border-2 border-slate-200 rounded-xl p-3 text-xs text-slate-800 outline-none focus:border-rose-400 font-semibold leading-relaxed"
            />
          </div>

          {/* 3. RAGA */}
          <div className="bg-emerald-50/40 p-4 rounded-2xl border-2 border-emerald-50 space-y-2">
            <label className="text-xs font-extrabold text-emerald-700 flex items-center gap-2 uppercase">
              <Activity className="w-4 h-4" /> 3. RAGA (Tindakan Nyata)
            </label>
            <p className="text-[11px] text-slate-500 font-semibold leading-tight">
              Aksi kesiapsiagaan atau tindakan fisik apa yang akan segera kamu siapkan di rumah bersama orang tuamu?
            </p>
            <textarea
              required
              rows={2}
              value={ragaText}
              onChange={(e) => setRagaText(e.target.value)}
              placeholder="Contoh: Saya akan mengajak ayah dan ibu merapikan barang-barang tajam di atas lemari dan menyiapkan tas siaga..."
              className="w-full bg-white border-2 border-slate-200 rounded-xl p-3 text-xs text-slate-800 outline-none focus:border-emerald-400 font-semibold leading-relaxed"
            />
          </div>
        </div>

        {/* CTA submit */}
        <button
          type="submit"
          className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-550 border-b-4 border-emerald-805 text-white font-black rounded-2xl text-base transition flex items-center justify-center gap-2 tracking-wide cursor-pointer active:scale-95 shadow-md uppercase font-playful"
        >
          <Award className="w-5 h-5 fill-white" />
          <span>Simpan & Tampilkan Sertifikat Kelulusanku 🏆</span>
        </button>
      </form>
    </div>
  );
}
