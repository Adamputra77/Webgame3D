import React, { useState } from "react";
import { Sparkles, Check, CheckCircle, Smartphone, Flame, Gift, Backpack, Heart, RefreshCw } from "lucide-react";

interface EmergencyBagProps {
  onSuccessEarned: (points: number, badge: string) => void;
}

interface BagItem {
  id: string;
  name: string;
  isCorrect: boolean;
  icon: string;
  desc: string;
}

export default function EmergencyBag({ onSuccessEarned }: EmergencyBagProps) {
  const [items, setItems] = useState<BagItem[]>([
    { id: "1", name: "Air Minum", isCorrect: true, icon: "💧", desc: "Kunci mencukupi hidrasi 3 hari pertama." },
    { id: "2", name: "Obat-obatan", isCorrect: true, icon: "💊", desc: "Pertolongan luka gores & obat pribadi anak." },
    { id: "3", name: "Senter Terang", isCorrect: true, icon: "🔦", desc: "Navigasi darurat saat pemadaman listrik total." },
    { id: "4", name: "Peluit Nyaring", isCorrect: true, icon: "🔊", desc: "Tanda suara penyelamatan jika terisolir." },
    { id: "5", name: "Makanan Kering", isCorrect: true, icon: "🍪", desc: "Biskuit tahan lama bergizi tanpa tancapan daya." },
    { id: "6", name: "Konsol PlayStation", isCorrect: false, icon: "🎮", desc: "Mesin game ini rekreasi tapi butuh tancapan kulkas/daya listrik." },
    { id: "7", name: "Kembang Api", isCorrect: false, icon: "🎇", desc: "Bencana gempa memicu kebocoran gas, percikan api sangat bahaya!" },
    { id: "8", name: "Komik Lucu", isCorrect: false, icon: "📚", desc: "Menghibur tapi bukan barang keselamatan darurat primer." },
    { id: "9", name: "Kasur Tiup Besar", isCorrect: false, icon: "🛋️", desc: "Terlalu berat menguras tenaga anak saat evakuasi lari." },
  ]);

  const [equippedIds, setEquippedIds] = useState<string[]>([]);
  const [gameResult, setGameResult] = useState<"notSubmitted" | "success" | "retry">("notSubmitted");
  const [review, setReview] = useState("");

  const handleToggleItem = (id: string) => {
    if (gameResult === "success") return; // locked once won
    setGameResult("notSubmitted");
    setReview("");

    setEquippedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const checkBagLayout = () => {
    // Correct IDs: 1, 2, 3, 4, 5
    const correctIds = ["1", "2", "3", "4", "5"];

    const isMissingSomeCorrect = correctIds.some((id) => !equippedIds.includes(id));
    const hasSomeIncorrect = equippedIds.some((id) => !correctIds.includes(id));

    if (!isMissingSomeCorrect && !hasSomeIncorrect) {
      setGameResult("success");
      setReview(
        "Sempurna! Kamu memasukkan semua barang kelangsungan hidup utama tanpa beban berlebih. Tas siaga bencana ini ringan diajak berlari dan bertahan mandiri selama 72 jam pertama!"
      );
      onSuccessEarned(100, "Ahli Tas Siaga");
    } else {
      setGameResult("retry");
      if (isMissingSomeCorrect && !hasSomeIncorrect) {
        setReview("Koleksi keselamatanmu belum lengkap! Masih ada bekal primer krusial yang tertinggal di laci dapur.");
      } else if (!isMissingSomeCorrect && hasSomeIncorrect) {
        setReview("Tas kamu kembung keberatan! Ada barang permainan atau benda rentan percikan gas berbahaya ikut terbawa.");
      } else {
        setReview("Susunan isi tas siaga bencanamu kurang tepat. Pilah kembali benda dasar penyelamat raga secara sederhana!");
      }
    }
  };

  const handleReset = () => {
    setEquippedIds([]);
    setGameResult("notSubmitted");
    setReview("");
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
      <div className="flex flex-col lg:flex-row gap-8 items-stretch">
        
        {/* Left Side: Items Catalog */}
        <div className="flex-1 flex flex-col gap-4">
          <div>
            <h4 className="text-sm font-extrabold text-blue-400 uppercase tracking-widest mb-1 shadow-inner">
              Peti Kemasan Barang Kesiapan
            </h4>
            <p className="text-[11px] text-slate-400">
              Pililah <strong>5 barang darurat wajib</strong> untuk dimasukkan ke dalam Tas Siaga Bencana di sebelah kanan:
            </p>
          </div>

          <div className="grid grid-cols-2 xs:grid-cols-3 gap-2.5">
            {items.map((i) => {
              const isEquipped = equippedIds.includes(i.id);
              return (
                <button
                  key={i.id}
                  onClick={() => handleToggleItem(i.id)}
                  className={`p-3 rounded-xl border text-center flex flex-col items-center justify-between gap-1 transition relative ${
                    isEquipped
                      ? "bg-blue-900/35 border-blue-500 text-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.15)]"
                      : "bg-slate-950 border-slate-850 hover:border-slate-700 text-slate-300"
                  }`}
                >
                  <span className="text-3xl select-none">{i.icon}</span>
                  <div className="mt-1">
                    <span className="text-xs font-bold block leading-none">{i.name}</span>
                    <span className="text-[8px] text-slate-500 block leading-tight mt-1">{i.desc}</span>
                  </div>

                  {isEquipped && (
                    <span className="absolute top-1 right-1 bg-blue-500 text-white rounded-full p-0.5">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Backpack slots & submission status */}
        <div className="lg:w-80 border-t lg:border-t-0 lg:border-l border-slate-850 pt-6 lg:pt-0 lg:pl-8 flex flex-col justify-between">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="relative w-28 h-28 flex items-center justify-center bg-blue-500/10 border-2 border-dashed border-blue-500/40 rounded-full">
              <Backpack className="w-16 h-16 text-blue-500" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {equippedIds.length} Barang
              </span>
            </div>

            <div>
              <h5 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center justify-center gap-1.5">
                <Backpack className="w-4 h-4 text-emerald-500" /> Isi Tas Siagamu:
              </h5>
              <p className="text-[10px] text-slate-500 mt-1 max-w-xs font-mono">
                {equippedIds.length === 0 ? (
                  "[Tas Kosong]"
                ) : (
                  items
                    .filter((i) => equippedIds.includes(i.id))
                    .map((i) => i.name)
                    .join(", ")
                )}
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-6 border-t border-slate-850 mt-6 lg:mt-0">
            {/* Reviews overlay */}
            {gameResult !== "notSubmitted" && (
              <div
                className={`p-3.5 rounded-xl border text-xs font-semibold leading-relaxed ${
                  gameResult === "success"
                    ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                    : "bg-rose-950/40 border-rose-500/40 text-red-400"
                }`}
              >
                {review}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleReset}
                className="py-3 px-4 rounded-xl border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-600 transition"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={checkBagLayout}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl text-xs shadow-lg transition uppercase tracking-wider"
              >
                Selesai Mengemas Tas ✓
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
