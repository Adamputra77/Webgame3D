import React, { useState } from "react";
import { Activity, Compass, AlertTriangle, Waves, BookOpen, Check, ArrowRight, ShieldCheck } from "lucide-react";

interface DisasterMaterialsProps {
  onContinue: () => void;
}

export default function DisasterMaterials({ onContinue }: DisasterMaterialsProps) {
  const [activeTab, setActiveTab] = useState<"earthquake" | "flood" | "volcano" | "tsunami">("earthquake");

  const tabs = [
    { id: "earthquake", label: "Gempa Bumi", icon: Activity, color: "text-blue-600 bg-blue-50 border-blue-200" },
    { id: "flood", label: "Banjir", icon: Compass, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
    { id: "volcano", label: "Gunung Berapi", icon: AlertTriangle, color: "text-red-600 bg-red-50 border-red-200" },
    { id: "tsunami", label: "Tsunami", icon: Waves, color: "text-sky-600 bg-sky-50 border-sky-200" }
  ];

  return (
    <div className="bg-white border-4 border-indigo-100 rounded-3xl p-6 md:p-8 shadow-sm space-y-6 text-[#1E293B]">
      {/* Header */}
      <div className="border-b-2 border-indigo-50 pb-4">
        <span className="bg-emerald-50 text-emerald-850 text-[11px] font-black tracking-widest uppercase py-1 px-3.5 rounded-full border border-emerald-100">
          STASIUN BELAJAR MANDIRI SD
        </span>
        <h3 className="text-xl font-black text-slate-850 mt-2 font-playful flex items-center gap-2">
          <BookOpen className="w-5.5 h-5.5 text-emerald-600" /> Ruang Belajar Siaga Bencana
        </h3>
        <p className="text-xs text-slate-500 mt-1 font-semibold">
          Mari baca materi singkat tentang 4 jenis bencana di bawah ini untuk membekali pengetahuan ragamu!
        </p>
      </div>

      {/* Tabs Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`p-3.5 rounded-2xl border-2 flex flex-col sm:flex-row items-center gap-2 transition-all cursor-pointer font-bold text-xs ${
                isActive
                  ? "bg-indigo-600 border-indigo-750 text-white shadow-md font-black"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <IconComponent className={`w-5 h-5 shrink-0 ${isActive ? "text-white animate-bounce" : "text-indigo-500"}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Display */}
      <div className="bg-slate-50/60 p-5 md:p-6 rounded-2xl border-2 border-slate-100 space-y-6">
        {activeTab === "earthquake" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2.5">
              <Activity className="w-5 h-5 text-blue-600 animate-pulse" />
              <h4 className="text-lg font-black text-slate-800 font-playful">Disaster 1: Gempa Bumi</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-650">
              <div className="bg-white p-4 rounded-xl border border-slate-150 space-y-2">
                <span className="text-[10px] text-blue-600 font-black block uppercase tracking-wider">💥 Penyebab Gempa</span>
                <p className="leading-relaxed">
                  Pergeseran lempeng tektonik di bawah permukaan bumi, aktivitas sesar/patahan aktif bumi, atau letusan gunung berapi yang sangat besar.
                </p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-150 space-y-2">
                <span className="text-[10px] text-blue-600 font-black block uppercase tracking-wider">📢 Tanda-Tanda</span>
                <p className="leading-relaxed">
                  Lantai dan tanah mulai bergoyang tiba-tiba, lampu gantung bergoyang, lemari berderit keras, jendela kaca bergetar, dan hewan-hewan berlarian gelisah.
                </p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-150 space-y-2 col-span-1 md:col-span-2">
                <span className="text-[10px] text-blue-600 font-black block uppercase tracking-wider">🐢 Cara Duck, Cover, and Hold On (Bebek Lindungi Diri)</span>
                <ul className="list-disc pl-4 space-y-1.5 mt-1 leading-relaxed">
                  <li><strong>Duck (Berlutut/Merunduk):</strong> Segera turunkan posisi badanmu agar tidak mudah terjatuh dari guncangan tanah.</li>
                  <li><strong>Cover (Melindungi Kepala):</strong> Berlindunglah di bawah meja yang kuat untuk menghindari jatuhnya reruntuhan langit-langit.</li>
                  <li><strong>Hold On (Berpegangan):</strong> Pegang kaki meja erat-erat agar mejamu tidak bergerak menjauh darimu selama bumi bergoyang.</li>
                </ul>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-150 space-y-2 col-span-1 md:col-span-2">
                <span className="text-[10px] text-blue-600 font-black block uppercase tracking-wider">🏃 Evakuasi Gempa</span>
                <p className="leading-relaxed">
                  Setelah guncangan berhenti, berjalanlah dengan tenang (jangan berlari saling dorong) mengikuti rute jalur evakuasi menuju lapangan terbuka yang jauh dari bangunan tinggi atau tiang listrik. Gunakan tangga darurat, jangan lift!
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "flood" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2.5">
              <Compass className="w-5 h-5 text-emerald-600" />
              <h4 className="text-lg font-black text-slate-800 font-playful">Disaster 2: Banjir Bandang & Kota</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-650">
              <div className="bg-white p-4 rounded-xl border border-slate-150 space-y-2">
                <span className="text-[10px] text-emerald-600 font-black block uppercase tracking-wider">🌧️ Penyebab Banjir</span>
                <p className="leading-relaxed">
                  Curah hujan yang terlalu tinggi dan lama, diperparah dengan penyumbatan sampah di selokan, serta minimnya daerah resapan tanah hijau di perkotaan.
                </p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-150 space-y-2">
                <span className="text-[10px] text-emerald-600 font-black block uppercase tracking-wider">🌿 Pencegahan Banjir</span>
                <p className="leading-relaxed">
                  Selalu membuang sampah pada tempatnya, menanam banyak pohon untuk menyerap air, dan membuat lubang biopori resapan di sekitar pekarangan rumah.
                </p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-150 space-y-2 col-span-1 md:col-span-2">
                <span className="text-[10px] text-emerald-600 font-black block uppercase tracking-wider">🌊 Langkah Saat Banjir Datang</span>
                <ul className="list-disc pl-4 space-y-1.5 mt-1 leading-relaxed">
                  <li><strong>Amankan Listrik:</strong> Cabut semua kabel elektronik yang dekat dengan lantai dan minta orang dewasa mematikan sekring listrik utama.</li>
                  <li><strong>Naikkan Barang:</strong> Pindahkan barang berharga ke lantai atas atau permukaan yang lebih tinggi agar tidak terendam air.</li>
                  <li><strong>Dilarang Bermain Air:</strong> JANGAN berenang atau bermain di air banjir karena kotor, berarus deras mendadak, dan rawan kabel listrik bocor.</li>
                </ul>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-150 space-y-2 col-span-1 md:col-span-2">
                <span className="text-[10px] text-emerald-600 font-black block uppercase tracking-wider">🧗 Evakuasi Mandiri</span>
                <p className="leading-relaxed">
                  Jika ketinggian air terus meningkat dengan cepat, pakailah alas kaki yang aman, kemas Tas Siaga Bencana raga, dan segeralah berjalan bersama keluarga menuju tempat penampungan pengungsian darurat yang tinggi.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "volcano" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2.5">
              <AlertTriangle className="w-5 h-5 text-red-650" />
              <h4 className="text-lg font-black text-slate-800 font-playful">Disaster 3: Gunung Berapi (Erupsi)</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-650">
              <div className="bg-white p-4 rounded-xl border border-slate-150 space-y-2">
                <span className="text-[10px] text-red-600 font-black block uppercase tracking-wider">🌋 Status Gunung Berapi</span>
                <ul className="list-disc pl-4 space-y-1 leading-relaxed">
                  <li><strong>1. Normal (Hijau):</strong> Gunung berapi aman dan tidak menunjukkan aktivitas berbahaya.</li>
                  <li><strong>2. Waspada (Kuning):</strong> Mulai ada sedikit gempa lokal di atas kondisi normal.</li>
                  <li><strong>3. Siaga (Jingga):</strong> Terjadi peningkatan gempa kawah yang signifikan.</li>
                  <li><strong>4. Awas (Merah):</strong> Gunung sangat kritis dan siap meletus kapan saja!</li>
                </ul>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-150 space-y-2">
                <span className="text-[10px] text-red-600 font-black block uppercase tracking-wider">🔥 Bahaya Letusan</span>
                <ul className="list-disc pl-4 space-y-1 leading-relaxed">
                  <li><strong>Abu Vulkanik:</strong> Debu pasir tajam dari dalam kawah gunung yang merusak mata & pernapasan.</li>
                  <li><strong>Awan Panas (Piroklastik):</strong> Gulungan awan gas panas berkecepatan tinggi yang mematikan.</li>
                  <li><strong>Lahar Dingin:</strong> Lumpur tebal berisi batu yang mengalir deras lewat jembatan sungai.</li>
                </ul>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-150 space-y-2 col-span-1 md:col-span-2">
                <span className="text-[10px] text-red-600 font-black block uppercase tracking-wider">🛡️ Mitigasi & Lindungi Diri</span>
                <p className="leading-relaxed">
                  Selalu siapkan masker medis/masker kain tebal, kacamata pelindung, baju lengan panjang untuk melindungi kulit dari hujan abu vulkanik. Dengarkan sirine radio VHF EWS atau alarm peringatan dini dari pihak guru dan pemerintah.
                </p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-150 space-y-2 col-span-1 md:col-span-2">
                <span className="text-[10px] text-red-600 font-black block uppercase tracking-wider">⛺ Evakuasi ke Pos Hijau</span>
                <p className="leading-relaxed">
                  Bila status gunung naik menjadi AWAS, jangan menunda evakuasi atau mendekati puncak gunung. Segeralah mengemasi Tas Siaga Bencana, gunakan masker penutup hidung, dan ikuti jalur evakuasi resmi ke posko penampungan yang aman dari jangkauan awan panas.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "tsunami" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2.5">
              <Waves className="w-5 h-5 text-sky-600" />
              <h4 className="text-lg font-black text-slate-800 font-playful">Disaster 4: Tsunami (Ombak Raksasa Pantai)</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-650">
              <div className="bg-white p-4 rounded-xl border border-slate-150 space-y-2">
                <span className="text-[10px] text-sky-600 font-black block uppercase tracking-wider">🌊 Penyebab Tsunami</span>
                <p className="leading-relaxed">
                  Tsunami biasanya disebabkan oleh gempa bumi tektonik bawah laut yang sangat kuat yang memicu patahan vertikal dasar samudra, menyebabkan air laut terguncang masif.
                </p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-150 space-y-2">
                <span className="text-[10px] text-sky-600 font-black block uppercase tracking-wider">🐚 Tanda Alam Penting</span>
                <p className="leading-relaxed">
                  Setelah guncangan gempa bumi besar dirasakan di dekat laut, air laut tiba-tiba surut drastis jauh lebih dari biasanya, meninggalkan pasir pantai kering dan banyak ikan terdampar tanpa air.
                </p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-150 space-y-2 col-span-1 md:col-span-2">
                <span className="text-[10px] text-sky-600 font-black block uppercase tracking-wider">🎯 Cara Evakuasi Tercepat</span>
                <ul className="list-disc pl-4 space-y-1.5 mt-1 leading-relaxed">
                  <li><strong>Segera Lari:</strong> Begitu air surut, JANGAN mendekat ke pasir pantai untuk menonton atau mencari ikan terdampar. Lari secepat raga sejauh mungkin!</li>
                  <li><strong>Cari Ketinggian:</strong> Evakuasilah ke bukit tinggi, atau gedung beton berstruktur kokoh yang tingginya minimal 15-20 meter di atas permukaan laut.</li>
                  <li><strong>Ikuti Jalur Rambu:</strong> Berlarilah searah dengan rambu jalur evakuasi bergambar orang berlari menjauhi ombak ke arah perbukitan.</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="flex justify-between items-center pt-2">
        <span className="text-xs text-slate-400 font-bold hidden sm:inline-block">
          ✨ Selesai membaca? Klik tombol di kanan untuk memulai Pre-Test!
        </span>
        <button
          onClick={onContinue}
          className="bg-indigo-600 hover:bg-indigo-550 border-b-4 border-indigo-805 text-white font-black py-4 px-8 rounded-2xl text-base transition flex items-center gap-2 tracking-wide cursor-pointer active:scale-95 shadow-md"
        >
          <span>Lanjut ke Pre-Test</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
