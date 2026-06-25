import React from "react";
import { Award, Shield } from "lucide-react";
import { UserProfile } from "../types";

interface CertificatorProps {
  profile: UserProfile;
  onReset: () => void;
}

export default function Certificator({ profile, onReset }: CertificatorProps) {
  const printId = `M-XR-${profile.uid?.substring(0, 4).toUpperCase() || "SD"}-${Date.now().toString().slice(-6)}`;

  return (
    <div className="bg-white border-4 border-indigo-100 rounded-3xl p-6 shadow-sm flex flex-col items-center gap-6 text-[#1E293B]">
      <div className="text-center max-w-md">
        <div className="w-14 h-14 bg-amber-50 border-2 border-amber-200 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-3 animate-bounce">
          <Award className="w-8 h-8" />
        </div>
        <h4 className="text-xl font-black text-slate-800 font-playful">Sertifikat Kelulusan Siaga Bencana</h4>
        <p className="text-sm text-slate-500 mt-1 font-semibold leading-relaxed">
          Hebat sekali! Seluruh rangkaian tantangan mitigasi bencana dan evaluasi telah kamu tuntaskan dengan luar biasa tangguh.
        </p>
      </div>

      {/* Visual Certificate Frame Block */}
      <div
        id="certificate-print-area"
        className="w-full max-w-2xl bg-white text-slate-900 border-[10px] border-double border-amber-600 rounded-3xl p-6 md:p-8 relative flex flex-col items-center justify-between gap-6 shadow-md overflow-hidden font-serif"
      >
        {/* Background watermark seals */}
        <div className="absolute inset-0 opacity-5 flex items-center justify-center pointer-events-none">
          <Shield className="w-96 h-96 text-amber-500" />
        </div>

        {/* Certificate Heading */}
        <div className="text-center space-y-1.5 pt-4">
          <h2 className="text-amber-700 text-2xl md:text-3xl font-black tracking-widest leading-none font-playful">
            SERTIFIKAT KELULUSAN
          </h2>
          <p className="text-[10px] text-slate-500 tracking-wider uppercase font-sans font-bold">
            Portal Edukasi Mitigasi MITIGA-XR - LIDM Nasional
          </p>
        </div>

        {/* Award recipient segment */}
        <div className="text-center py-4">
          <span className="text-xs italic text-slate-400 block font-serif">Sertifikat ini dengan bangga dianugerahkan kepada:</span>
          <h3 className="text-slate-800 text-2xl md:text-3xl font-extrabold border-b-2 border-amber-600/30 px-8 pb-1 inline-block mt-3 tracking-wide">
            {profile.name || "Pahlawan Cilik Tangguh"}
          </h3>
          <span className="text-xs text-slate-550 block mt-3 font-sans font-extrabold">
            Sebagai "Siswa Tanggap Bencana Indonesia" tingkat Sekolah Dasar (SD kelas 4-6)
          </span>
        </div>

        {/* Explanatory statements */}
        <div className="text-center max-w-lg">
          <p className="text-[11px] leading-relaxed text-slate-600 font-sans font-semibold">
            Telah menyelesaikan seluruh rangkaian penjelajahan tantangan simulasi penyelamatan 3D dalam portal <strong>MITIGA-XR</strong>. Meliputi uji keputusan gempa bumi seismik, perbaikan tata drainase sungai banjir, penentuan rute jalur aman letusan kawah Merapi, serta penataan tas bekal darurat mandiri.
          </p>
        </div>

        {/* Authorized signatures */}
        <div className="w-full flex justify-between items-center px-4 md:px-8 pt-4 font-sans text-[11px] font-bold">
          <div className="text-center">
            <span className="text-[9px] text-slate-400 block font-sans">Dibuat oleh AI Mentor:</span>
            <span className="text-blue-600 font-bold block mt-2">SiagaBot AI ✓</span>
            <span className="text-[8px] text-slate-400 block border-t border-slate-100 mt-1 pt-1">Sistem Otomatis</span>
          </div>

          {/* Golden Badge Emblem Center */}
          <div className="flex items-center justify-center pointer-events-none shrink-0">
            <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-500 flex items-center justify-center text-amber-500 shadow-sm">
              <Shield className="w-6 h-6 fill-amber-50" />
            </div>
          </div>

          <div className="text-center">
            <span className="text-[9px] text-slate-400 block font-sans">Majelis Juri Nasional:</span>
            <span className="text-amber-700 font-extrabold block mt-2 italic">Konsultan LIDM ✓</span>
            <span className="text-[8px] text-slate-400 block border-t border-slate-100 mt-1 pt-1 font-sans">Inovasi Digital</span>
          </div>
        </div>

        {/* Document verify ID footer print code */}
        <div className="w-full flex justify-between items-center text-[8px] text-slate-400 font-mono pt-4 border-t border-slate-100">
          <span>Verifikasi Kode ID: {printId}</span>
          <span>Sertifikat Digital Tanggal: {new Date().toLocaleDateString("id-ID")}</span>
        </div>
      </div>

      <button
        onClick={onReset}
        className="bg-indigo-600 hover:bg-indigo-550 border-b-4 border-indigo-805 text-white font-black py-4 px-10 rounded-2xl text-base transition flex items-center gap-2 tracking-wider mt-2 shadow-md cursor-pointer active:scale-95"
      >
        <span>Main Lagi 🎮</span>
      </button>
    </div>
  );
}
