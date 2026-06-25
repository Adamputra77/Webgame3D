import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Play, RotateCcw, Droplets, Trash2, CheckCircle2, Shield, Trees, Info } from "lucide-react";

interface FloodSimulationProps {
  grade?: number; // 5 or 6
  onDecisionResult: (cleanedAll: boolean, feedbackText: string) => void;
}

export default function FloodSimulation({ grade = 5, onDecisionResult }: FloodSimulationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [trashLeft, setTrashLeft] = useState<number>(4);
  const [rainStatus, setRainStatus] = useState<"notStarted" | "raining" | "completed">("notStarted");
  const [feedback, setFeedback] = useState<string>("");
  const [hasBiopori, setHasBiopori] = useState(false);

  // Three.js object references used in tick updates
  const trashMeshesRef = useRef<THREE.Mesh[]>([]);
  const waterLevelRef = useRef<number>(-1.5);
  const waterMeshRef = useRef<THREE.Mesh | null>(null);
  const isRainingRef = useRef<boolean>(false);
  const drainCleanedRef = useRef<boolean>(false);
  const hasBioporiRef = useRef<boolean>(false);

  useEffect(() => {
    hasBioporiRef.current = hasBiopori;
  }, [hasBiopori]);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a192f); // Deep oceanic dark

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 6, 12);
    camera.lookAt(0, -0.5, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);

    // Grid land
    const landGeo = new THREE.PlaneGeometry(14, 14);
    const landMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.9 }); // green grass
    const land = new THREE.Mesh(landGeo, landMat);
    land.rotation.x = -Math.PI / 2;
    land.position.y = -0.5;
    land.receiveShadow = true;
    scene.add(land);

    // River channel/Drainage in the middle
    const riverGeo = new THREE.BoxGeometry(3, 0.4, 14);
    const riverMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
    const riverBed = new THREE.Mesh(riverGeo, riverMat);
    riverBed.position.set(0, -0.6, 0);
    scene.add(riverBed);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight.position.set(4, 10, 6);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // Spawn 4 Little 3D Houses
    const housePositions = [
      [-3.5, 0, -3],
      [-3.8, 0, 2],
      [3.5, 0, -2.5],
      [4.0, 0, 3],
    ];

    const housesGroup = new THREE.Group();
    scene.add(housesGroup);

    housePositions.forEach(([x, y, z]) => {
      const houseGroup = new THREE.Group();
      houseGroup.position.set(x, y, z);

      // Base wall
      const wallG = new THREE.BoxGeometry(1.4, 1.0, 1.4);
      const wallM = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.8 }); // Yellow walls
      const walls = new THREE.Mesh(wallG, wallM);
      walls.position.y = 0;
      walls.castShadow = true;
      walls.receiveShadow = true;
      houseGroup.add(walls);

      // Roof (red cone)
      const roofG = new THREE.ConeGeometry(1.1, 0.7, 4);
      const roofM = new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.4 });
      const roof = new THREE.Mesh(roofG, roofM);
      roof.rotation.y = Math.PI / 4;
      roof.position.y = 0.85;
      roof.castShadow = true;
      houseGroup.add(roof);

      housesGroup.add(houseGroup);
    });

    // Spawn 4 Trash cubes blocking the central drainage
    const trashPositions = [
      [0, -0.4, -3],
      [0.2, -0.4, -0.5],
      [-0.1, -0.4, 2.5],
      [0, -0.4, 4.8],
    ];

    const trashMeshes: THREE.Mesh[] = [];
    const trashMat = new THREE.MeshStandardMaterial({
      color: 0xef4444, // Red toxic color
      emissive: 0xb91c1c,
      emissiveIntensity: 0.4,
    });

    const trashLeftCountRef = { current: 4 };

    const cleanTrashArray = () => {
      trashPositions.forEach((pos, i) => {
        const tGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const tMesh = new THREE.Mesh(tGeo, trashMat);
        tMesh.position.set(pos[0], pos[1], pos[2]);
        tMesh.userData = { id: i, isTrash: true };
        tMesh.castShadow = true;
        scene.add(tMesh);
        trashMeshes.push(tMesh);
      });
      trashMeshesRef.current = trashMeshes;
    };

    cleanTrashArray();

    // Translucent Blue Water mesh
    const waterGeo = new THREE.BoxGeometry(14, 2.0, 14);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x3b82f6,
      transparent: true,
      opacity: 0.7,
      roughness: 0.15,
      metalness: 0.1,
    });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.position.set(0, -1.8, 0); 
    scene.add(water);
    waterMeshRef.current = water;

    // Raycaster for clicking trash items
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleMouseClick = (event: MouseEvent) => {
      if (isRainingRef.current) return; // cannot clean during rain demo

      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const activeTrash = trashMeshesRef.current.filter((t) => t.parent !== null);
      const intersects = raycaster.intersectObjects(activeTrash);

      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;
        scene.remove(hit);

        setTrashLeft((prev) => {
          const updated = prev - 1;
          trashLeftCountRef.current = updated;
          if (updated === 0) {
            drainCleanedRef.current = true;
          }
          return updated;
        });
      }
    };

    renderer.domElement.addEventListener("click", handleMouseClick);

    // Animation Loop
    let reqId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      reqId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Hover trash items
      trashMeshesRef.current.forEach((t) => {
        if (t.parent) {
          t.rotation.y += 0.02;
          t.rotation.x = Math.sin(elapsed * 2) * 0.15;
        }
      });

      // Water Level management
      if (isRainingRef.current) {
        // If biopori or drained clean, water shouldn't overflow
        const isClean = trashLeftCountRef.current === 0;
        const bPori = hasBioporiRef.current;

        if (isClean) {
          // completely safe
          if (waterLevelRef.current < -0.4) {
            waterLevelRef.current += 0.008;
          }
        } else if (bPori && trashLeftCountRef.current <= 2) {
          // partially clean + enhanced capacity biopori -> keeps water managed below surface
          if (waterLevelRef.current < -0.1) {
            waterLevelRef.current += 0.008;
          }
        } else {
          // Clogged drain without biopori capacity triggers severe flood
          const targetLimit = bPori ? 0.2 : 0.6; // Biopori partially buffers the peak limit
          if (waterLevelRef.current < targetLimit) {
            waterLevelRef.current += 0.015;
          }
        }
        water.position.y = waterLevelRef.current;
      } else {
        // reset water down
        if (waterLevelRef.current > -1.8) {
          waterLevelRef.current -= 0.05;
          water.position.y = waterLevelRef.current;
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(reqId);
      if (renderer.domElement && containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [rainStatus]);

  const startRainSimulation = () => {
    setRainStatus("raining");
    isRainingRef.current = true;
    waterLevelRef.current = -1.8;

    setTimeout(() => {
      setRainStatus("completed");
      isRainingRef.current = false;

      // Class 6 allows biopori buffer to permit success if most trash is cleaned
      const fullyCleaned = trashLeft === 0;
      const bioporiBufferSuccess = grade === 6 && hasBiopori && trashLeft <= 1;
      const isAwesomeSuccess = fullyCleaned || bioporiBufferSuccess;

      let reviewText = "";
      if (isAwesomeSuccess) {
        if (grade === 5) {
          reviewText = "Pahlawan Lingkungan Hebat! 🌟 Kamu sudah menyapu bersih semua sampah merah di selokan. Air hujan mengalir super lancar dan rumah penduduk tetap aman kering!";
        } else {
          reviewText = "ANALISIS MITIGASI BERHASIL! 🌧️ Kapasitas infiltrasi (C) optimal. Kombinasi pembersihan sedimen sisa dan integrasi Lubang Resapan Biopori sukses memotong puncak limpasan run-off, menyelamatkan perumahan warga.";
        }
      } else {
        if (grade === 5) {
          reviewText = "Aduh, Kotanya Kebanjiran! ⛆ Masih ada sampah tersisa yang menghalangi air di got. Air meluap merendam kaki rumah penduduk. Yuk, bersihkan semua sampahnya dulu!";
        } else {
          reviewText = "KOTA TERGENANG! ⚠️ Koefisien limpasan terlalu besar disebabkan bottleneck penampang saluran air (drains blocked). Evaluasi ulang tata kelola prasarana mikro mitigasi kotamu.";
        }
      }

      setFeedback(reviewText);
      onDecisionResult(isAwesomeSuccess, reviewText);
    }, 4500);
  };

  const resetAll = () => {
    setTrashLeft(4);
    setRainStatus("notStarted");
    setFeedback("");
    waterLevelRef.current = -1.8;
    drainCleanedRef.current = false;
    isRainingRef.current = false;
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Grade-Based Material Block */}
      {grade === 5 ? (
        <div className="bg-gradient-to-r from-emerald-900/40 to-blue-900/30 p-5 rounded-2xl border border-emerald-800/40 space-y-2">
          <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black tracking-widest uppercase py-1 px-3 rounded-full border border-emerald-500/30">
            MATERI KELAS 5: MENJAGA KEBERSIHAN GOT & DETEKSI BANJIR
          </span>
          <h4 className="text-sm font-extrabold text-white">Buang Sampah Pada Tempatnya Menjauhkan Kita dari Banjir 🗑️</h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            Sampah plastik, daun kering, dan botol bekas yang kita buang sembarangan akan hanyut terbawa air hujan masuk ke got. Di sana, mereka menumpuk menjadi sumbatan besar. Bila air got terhalang sampah, air akan tumpah membanjiri jalanan!
          </p>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-emerald-950 to-indigo-950 p-5 rounded-2xl border border-emerald-800/40 space-y-3">
          <div className="flex justify-between items-start flex-wrap gap-2">
            <div className="space-y-1">
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black tracking-widest uppercase py-1 px-3 rounded-full border border-emerald-500/30">
                MATERI KELAS 6: MANAJEMEN DAS (DAERAH ALIRAN SUNGAI) & INFILTRASI BIOPORI
              </span>
              <h4 className="text-sm font-extrabold text-white">Prinsip Infiltrasi Mikro & Sumur Resapan Buatan</h4>
              <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                Banjir perkotaan terjadi ketika volume presipitasi melampaui <strong className="text-emerald-400">Infiltration Capacity</strong> (kecepatan tanah menyerap air). Dengan mendesain **Lubang Biopori**, kita memperluas bidang resapan air tanah, meningkatkan kapasitas resapan alami, sekaligus membantu fauna tanah menguraikan bahan organik.
              </p>
            </div>

            {/* Infiltration expansion button for Class 6 */}
            <div className="bg-slate-950 p-2.5 rounded-xl border border-emerald-500/30 flex flex-col items-center gap-1 w-full sm:w-auto text-center">
              <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest font-mono">DAERAH RESAPAN AKTIF</span>
              <button
                onClick={() => setHasBiopori(!hasBiopori)}
                className={`w-full text-xs font-bold py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition ${
                  hasBiopori
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                    : "bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-300 border border-emerald-800"
                }`}
              >
                <Trees className="w-3.5 h-3.5 animate-bounce" />
                {hasBiopori ? "🌳 Biopori Aktif!" : "Tanam Lubang Biopori"}
              </button>
              <span className="text-[9px] text-slate-500">
                {hasBiopori 
                  ? "Kapasitas Resapan Infiltrasi +75%" 
                  : "Hanya mengandalkan got semen biasa"}
              </span>
            </div>
          </div>

          <div className="text-[11px] bg-slate-900/70 p-2.5 rounded-lg border border-slate-800/80 text-emerald-300/90 leading-relaxed">
            🌿 <strong className="text-white">Analisis Pemukiman Hijau:</strong> Lubang biopori bertindak sebagai peningkat kapasitas drainase mikro. Jika kamu mengaktifkan Biopori, toleransi risiko kota meningkat: simulasi tetap berhasil (bebas genangan) meskipun masih tersisa maksimal 1 sampah kecil!
          </div>
        </div>
      )}

      {/* 3D Simulation Stage */}
      <div className="relative w-full h-[380px] rounded-3xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-950">
        <div ref={containerRef} className="w-full h-full" id="flood-grid-city-adaptive" />

        {/* Clog Alert Overlay */}
        <div className="absolute top-4 left-4 bg-slate-950/90 backdrop-blur-md p-4 rounded-2xl border border-slate-800 flex flex-col gap-1 max-w-xs shadow-xl">
          <h5 className="text-[11px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
            <Trash2 className="w-4 h-4 text-rose-500 animate-pulse" /> 
            {grade === 5 ? "TUGAS: AMBIL SAMPAH DI GOT" : "AUDIT CLOGGING KOEFISIEN DRAINASE"}
          </h5>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            {grade === 5 
              ? "Klik balok-balok merah di selokan sungai untuk mengambil sampah sebelum memicu hujan!"
              : "Deteksi botol bekas/sedimen padat (warna merah menyala). Klik atau sentuh tiap balok merah untuk melonggarkan debit penampang sungai."}
          </p>
        </div>

        {/* Dynamic State flags */}
        <div className="absolute top-4 right-4 flex flex-col gap-1.5">
          {trashLeft === 0 ? (
            <div className="bg-emerald-950/90 text-emerald-400 font-extrabold border border-emerald-500/40 text-[9px] uppercase font-mono py-1.5 px-3 rounded-full flex items-center gap-1 shadow-lg">
              <CheckCircle2 className="w-3.5 h-3.5" /> Saluran Lancar ✓
            </div>
          ) : (
            <div className="bg-rose-950/90 text-red-400 font-extrabold border border-rose-500/40 text-[9px] uppercase font-mono py-1.5 px-3 rounded-full flex items-center gap-1">
              ⚠️ {trashLeft} Bottleneck Aliran
            </div>
          )}

          {grade === 6 && hasBiopori && (
            <div className="bg-emerald-950/90 text-emerald-300 font-bold border border-emerald-500/40 text-[9px] uppercase font-mono py-1 px-3 rounded-full text-center">
              🌿 Infiltrasi Ekstra On
            </div>
          )}
        </div>

        {/* Start Rain CTA Overlay */}
        {rainStatus === "notStarted" && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-950/95 backdrop-blur-md py-3 px-6 rounded-2xl border border-slate-800 flex items-center gap-4 shadow-2xl">
            <span className="text-xs text-slate-300">
              {grade === 5 ? "Siap mendatangkan awan hujan?" : "Uji ketahanan resapan tata kota:"}
            </span>
            <button
              onClick={startRainSimulation}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-black py-2.5 px-6 rounded-xl flex items-center gap-2 shadow-lg hover:shadow-blue-500/20 active:scale-95 transition"
            >
              <Droplets className="w-4 h-4 fill-white" /> {grade === 5 ? "MULAI HUJAN DERAS! 🌨️" : "AKTIFKAN EVALUASI LIMPASAN"}
            </button>
          </div>
        )}

        {/* Raining Screen overlay */}
        {rainStatus === "raining" && (
          <div className="absolute inset-0 bg-blue-950/20 backdrop-blur-[1px] flex flex-col items-center justify-center pointer-events-none">
            <div className="bg-slate-950/95 border border-blue-500/40 px-6 py-4 rounded-2xl flex items-center gap-3 animate-pulse shadow-2xl">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              <p className="text-[10px] font-black text-slate-300 font-mono tracking-widest uppercase">
                {grade === 5 ? "HUJAN DERAS SEDANG TURUN... LIHAT GOT KAMU!" : "SIMULASI PRESIPITASI PUNCAK 140MM/JAM SEDANG DIAKTIFKAN"}
              </p>
            </div>
          </div>
        )}

        {/* Result Overlay */}
        {rainStatus === "completed" && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center gap-3">
            <div className={`p-4 rounded-full ${trashLeft === 0 || (grade === 6 && hasBiopori && trashLeft <= 1) ? "bg-emerald-500/10 border border-emerald-500 text-emerald-400" : "bg-red-500/10 border border-red-500 text-red-500"}`}>
              {trashLeft === 0 || (grade === 6 && hasBiopori && trashLeft <= 1) ? <CheckCircle2 className="w-10 h-10" /> : <Trash2 className="w-10 h-10" />}
            </div>
            <h4 className="text-lg font-black text-white tracking-wide uppercase">
              {trashLeft === 0 || (grade === 6 && hasBiopori && trashLeft <= 1) ? "ZONA KELAS AMAN!" : "PERMUKIMAN TERENDAM LUAPAN!"}
            </h4>
            <p className="text-xs text-slate-300 max-w-sm leading-relaxed">
              {feedback}
            </p>
            <button
              onClick={resetAll}
              className="mt-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-500 text-xs py-2 px-6 rounded-lg font-bold uppercase tracking-wider transition flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Bersihkan Selokan Lagi
            </button>
          </div>
        )}
      </div>

      <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-850 text-xs text-slate-400">
        <Info className="w-4 h-4 text-emerald-500 inline mr-2" />
        {grade === 5 
          ? "Merawat alam adalah bentuk kasih sayang raga kita kepada teman-teman, guru, dan keluarga agar sekolah merdeka bersih aman selalu." 
          : "Studi kasus: Penambahan lubang biopori di wilayah padat penduduk dapat merekayasa resapan limpasan lokal sebesar 45 liter/menit."}
      </div>
    </div>
  );
}
