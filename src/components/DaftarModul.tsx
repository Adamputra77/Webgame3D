import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { FileText, ArrowLeft, ChevronRight } from "lucide-react";

interface ModulItem {
  id: string;
  judul: string;
  file: string;
}

export default function DaftarModul({ onContinue, onBack }: { onContinue?: () => void; onBack?: () => void }) {
  const [modulList, setModulList] = useState<ModulItem[]>([]);
  const [selected, setSelected] = useState<ModulItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/modul/index.json")
      .then((r) => r.json())
      .then((data) => {
        setModulList(data);
        setLoading(false);
      })
      .catch(() => {
        setModulList([]);
        setLoading(false);
      });
  }, []);

  if (selected) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white border-4 border-indigo-100 rounded-3xl p-4 md:p-6 shadow-md space-y-4"
      >
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelected(null)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition cursor-pointer active:scale-[0.98]"
          >
            <ArrowLeft size={18} /> Kembali
          </button>
          <h3 className="text-lg font-black text-slate-800 font-playful">{selected.judul}</h3>
          <div className="w-24" />
        </div>
        <div className="w-full rounded-2xl overflow-hidden border-2 border-slate-200" style={{ height: "min(80vh, 800px)" }}>
          <iframe
            src={`/modul/${selected.file}`}
            className="w-full h-full"
            title={selected.judul}
          />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white border-4 border-indigo-100 rounded-3xl p-6 md:p-8 shadow-md space-y-6"
    >
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="text-[10px] bg-indigo-50 border border-indigo-150 text-indigo-700 font-black px-3.5 py-1 rounded-full uppercase tracking-wider">
          Rencana Pembelajaran 📖
        </span>
        <h3 className="text-2xl font-black text-slate-800 tracking-tight font-playful mt-1">
          Modul & Bahan Ajar
        </h3>
        <p className="text-xs text-slate-500 font-semibold leading-relaxed">
          Pilih modul pembelajaran untuk dilihat langsung.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-300 border-t-indigo-600 rounded-full" />
        </div>
      ) : modulList.length === 0 ? (
        <div className="text-center py-12 text-slate-400 font-semibold space-y-2">
          <FileText size={48} className="mx-auto opacity-40" />
          <p>Belum ada modul tersedia.</p>
          <p className="text-xs">Masukkan file PDF ke folder <code className="bg-slate-100 px-2 py-0.5 rounded text-xs">public/modul/</code> dan daftarkan di <code className="bg-slate-100 px-2 py-0.5 rounded text-xs">index.json</code></p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {modulList.map((modul) => (
            <button
              key={modul.id}
              onClick={() => setSelected(modul)}
              className="flex items-center gap-4 p-5 rounded-2xl border-2 border-indigo-100 bg-indigo-50/30 hover:bg-indigo-50 hover:border-indigo-300 transition text-left cursor-pointer active:scale-[0.98]"
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <FileText size={24} className="text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-black text-sm text-slate-800 font-playful">{modul.judul}</h4>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">{modul.file}</p>
              </div>
              <ChevronRight size={18} className="text-slate-300 flex-shrink-0" />
            </button>
          ))}
        </div>
      )}

      <div className="flex justify-center gap-3 pt-3">
        {onBack && (
          <button
            onClick={onBack}
            className="px-6 py-4 bg-slate-100 hover:bg-slate-200 border-b-4 border-slate-300 text-slate-700 font-black rounded-2xl text-sm transition shadow-sm cursor-pointer active:scale-[0.98] font-playful"
          >
            ⬅ Kembali ke Beranda
          </button>
        )}
        {onContinue && modulList.length > 0 && (
          <button
            onClick={onContinue}
            className="px-8 py-4 bg-indigo-600 hover:bg-indigo-550 border-b-4 border-indigo-800 text-white font-black rounded-2xl text-sm transition uppercase tracking-wider shadow-md shadow-indigo-600/10 cursor-pointer active:scale-[0.98] font-playful"
          >
            Lanjut ke Materi Bencana 📚
          </button>
        )}
      </div>
    </motion.div>
  );
}
