import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Play, RotateCcw, ShieldCheck, AlertTriangle, Hammer, CheckSquare, Info, ShieldAlert } from "lucide-react";

interface EarthquakeSimulationProps {
  grade?: number; // 5 or 6
  onDecisionResult: (choiceKey: "A" | "B" | "C", isCorrect: boolean, feedbackText: string) => void;
}

export default function EarthquakeSimulation({ grade = 5, onDecisionResult }: EarthquakeSimulationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [isBookcaseAnchored, setIsBookcaseAnchored] = useState(false);

  // References used in the render loop to trigger events dynamically
  const shakeIntensityRef = useRef<number>(0);
  const isBookcaseAnchoredRef = useRef(false);
  const characterRef = useRef<THREE.Mesh | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  // Keep ref in sync
  useEffect(() => {
    isBookcaseAnchoredRef.current = isBookcaseAnchored;
  }, [isBookcaseAnchored]);

  const bookPositions = [
    { x: 2.5, y: 2.65, z: -4.3 },
    { x: 2.8, y: 2.65, z: -4.3 },
    { x: 3.1, y: 2.65, z: -4.3 },
    { x: 2.4, y: 1.85, z: -4.3 },
    { x: 2.9, y: 1.85, z: -4.3 },
  ];

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111827); // Dark Slate/Gray-900

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 4, 10);
    camera.lookAt(0, 1.5, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);

    // Grid Floor
    const floorGeo = new THREE.PlaneGeometry(12, 12);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x374151, roughness: 0.8 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    scene.add(floor);

    // Walls
    const wallGeo = new THREE.PlaneGeometry(12, 6);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.9 });
    
    const backWall = new THREE.Mesh(wallGeo, wallMat);
    backWall.position.set(0, 3, -6);
    backWall.receiveShadow = true;
    scene.add(backWall);

    const leftWall = new THREE.Mesh(wallGeo, wallMat);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-6, 3, 0);
    leftWall.receiveShadow = true;
    scene.add(leftWall);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xfffbeb, 1.5, 20);
    pointLight.position.set(0, 5, 0);
    pointLight.castShadow = true;
    scene.add(pointLight);

    // Evacuation Table
    const makeTable = () => {
      const g = new THREE.Group();
      const topGeo = new THREE.BoxGeometry(2.5, 0.15, 1.6);
      const topMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.5 });
      const top = new THREE.Mesh(topGeo, topMat);
      top.position.y = 1.35;
      top.castShadow = true;
      top.receiveShadow = true;
      g.add(top);

      const legGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.35, 8);
      const legMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.2 });
      const offsets = [
        [-1.1, 1.35 / 2, -0.6],
        [1.1, 1.35 / 2, -0.6],
        [-1.1, 1.35 / 2, 0.6],
        [1.1, 1.35 / 2, 0.6],
      ];
      offsets.forEach(([x, y, z]) => {
        const leg = new THREE.Mesh(legGeo, legMat);
        leg.position.set(x, y, z);
        leg.castShadow = true;
        leg.receiveShadow = true;
        g.add(leg);
      });
      return g;
    };
    const tableAssemble = makeTable();
    tableAssemble.position.set(-2.5, 0, -1);
    scene.add(tableAssemble);

    // Bookcase
    const makeBookcase = () => {
      const g = new THREE.Group();
      const frameGeo = new THREE.BoxGeometry(2.0, 3.2, 0.8);
      const frameMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 });
      const frame = new THREE.Mesh(frameGeo, frameMat);
      frame.position.y = 1.6;
      frame.castShadow = true;
      frame.receiveShadow = true;
      g.add(frame);

      const shelfGeo = new THREE.BoxGeometry(1.8, 0.08, 0.75);
      const shelfMat = new THREE.MeshStandardMaterial({ color: 0x451a03 });
      [0.8, 1.6, 2.4].forEach((h) => {
        const s = new THREE.Mesh(shelfGeo, shelfMat);
        s.position.set(0, h, 0.02);
        g.add(s);
      });
      return g;
    };
    const bookcaseAssemble = makeBookcase();
    bookcaseAssemble.position.set(2.8, 0, -4.5);
    scene.add(bookcaseAssemble);

    // Books Group
    const booksGroup = new THREE.Group();
    scene.add(booksGroup);

    bookPositions.forEach((pos) => {
      const bGeo = new THREE.BoxGeometry(0.12, 0.45, 0.35);
      const bColor = new THREE.Color().setHSL(Math.random(), 0.8, 0.5);
      const bMat = new THREE.MeshStandardMaterial({ color: bColor, roughness: 0.1 });
      const b = new THREE.Mesh(bGeo, bMat);
      b.position.set(pos.x, pos.y, pos.z);
      b.castShadow = true;
      booksGroup.add(b);
    });

    // Hanging Light
    const makeHangingLight = () => {
      const g = new THREE.Group();
      const stemGeo = new THREE.CylinderGeometry(0.02, 0.02, 2.0, 8);
      const stemMat = new THREE.MeshStandardMaterial({ color: 0x1f2937 });
      const stem = new THREE.Mesh(stemGeo, stemMat);
      stem.position.y = 5.0;
      g.add(stem);

      const bulbGeo = new THREE.SphereGeometry(0.35, 16, 16);
      const bulbMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
      const bulb = new THREE.Mesh(bulbGeo, bulbMat);
      bulb.position.y = 4.0;
      g.add(bulb);
      return g;
    };
    const lamp = makeHangingLight();
    scene.add(lamp);

    // Character
    const chGeo = new THREE.CylinderGeometry(0.25, 0.25, 1.4, 16);
    const chMat = new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.1 });
    const char = new THREE.Mesh(chGeo, chMat);
    char.position.set(0, 0.7, 0);
    char.castShadow = true;
    scene.add(char);
    characterRef.current = char;

    let reqId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      reqId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      if (shakeIntensityRef.current > 0) {
        camera.position.x = (Math.random() - 0.5) * shakeIntensityRef.current;
        camera.position.y = 4 + (Math.random() - 0.5) * shakeIntensityRef.current;
        lamp.rotation.z = Math.sin(elapsed * 8) * 0.45;
        lamp.rotation.x = Math.cos(elapsed * 6) * 0.25;

        // Books fall ONLY if NOT anchored
        if (!isBookcaseAnchoredRef.current) {
          booksGroup.children.forEach((bk, i) => {
            if (elapsed > 1.2 + i * 0.3) {
              if (bk.position.y > 0.22) {
                bk.position.y -= 0.12;
                bk.position.x += 0.05;
              }
            }
          });
        }
      } else {
        camera.position.x = Math.sin(elapsed * 0.5) * 0.2;
        camera.position.y = 4;
        lamp.rotation.z = Math.sin(elapsed * 1.5) * 0.05;

        // Reset books to resting coordinates when not shaking
        booksGroup.children.forEach((bk, i) => {
          const init = bookPositions[i];
          if (init) {
            bk.position.set(init.x, init.y, init.z);
          }
        });
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
  }, []);

  const triggerEarthquake = () => {
    setIsShaking(true);
    setSelectedChoice(null);
    shakeIntensityRef.current = 0.22;
  };

  const handleChoice = (choice: "A" | "B" | "C") => {
    if (!isShaking) return;
    setSelectedChoice(choice);
    setIsShaking(false);
    shakeIntensityRef.current = 0;

    let isCorrect = false;
    let feedback = "";
    const char = characterRef.current;

    if (char) {
      if (choice === "A") {
        char.position.set(-2.5, 0.4, -1);
        char.scale.set(1, 0.5, 1);
        isCorrect = true;
        if (grade === 5) {
          feedback = "PILIHAN HEBAT! 🌟 Kamu langsung meringkuk di bawah meja kayu yang kokoh. Ini melindungi kepalamu dari reruntuhan mainan, buku, atau kaca jendela!";
        } else {
          feedback = "ANALISIS TEPAT! 🎯 Tindakan 'Drop, Cover, and Hold On' meminimalkan gaya tumbukan benda jatuh. Memanfaatkan ruang lindung di bawah meja (rigid structural model) adalah keputusan taktis rasio keselamatan tertinggi.";
        }
      } else if (choice === "B") {
        char.position.set(2.8, 0.7, -3.2);
        isCorrect = false;
        if (grade === 5) {
          feedback = "OOH TIDAK... 😮 Berdiri dekat lemari sangat berbahaya karena lemari bisa roboh menimpamu saat guncangan gempa. Jangan di sini ya!";
        } else {
          feedback = "KERENTANAN TINGGI! ⚠️ Lemari buku adalah benda non-struktural yang memiliki momentum inersia tinggi saat gempa. Berada di jalur jatuh lemari adalah risiko cedera kompresi berat.";
        }
      } else if (choice === "C") {
        char.position.set(0, 0.7, 4);
        isCorrect = false;
        if (grade === 5) {
          feedback = "ADUH, BAHAYA! 🏃 Jangan berlari panik ke luar pintu saat guncangannya kencang. Kamu bisa tersandung dan terjatuh. Sembunyi dulu!";
        } else {
          feedback = "RISIKO BERLARI! 🏃‍♂️ Kecepatan rambat gelombang S seismik menyebabkan pergeseran lantai ekstrem. Berlari saat gempa merusak koordinasi neuromuskular dan melipatgandakan risiko jatuh terbentur.";
        }
      }
    }

    onDecisionResult(choice, isCorrect, feedback);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Grade-Specific Learning Material Header */}
      {grade === 5 ? (
        <div className="bg-gradient-to-r from-blue-900/40 to-indigo-900/40 p-5 rounded-2xl border border-blue-800/40 space-y-2">
          <span className="bg-blue-500/20 text-blue-300 text-[10px] font-black tracking-widest uppercase py-1 px-3 rounded-full border border-blue-500/30">
            MATERI KELAS 5: PENJELAJAH CILIK GEMPA BUMI
          </span>
          <h4 className="text-sm font-extrabold text-white">Ingat Rumus Hebat: Berlutut, Berlindung, Berpegangan! 👦👧</h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            Jika bumi bergoyang, kita tidak boleh berteriak atau berlari panik. Cukup tekuk kakimu (Drop), lindungi kepalamu di bawah meja kayu (Cover), dan pegang erat-erat kaki mejanya (Hold On) sampai goyangannya selesai!
          </p>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-purple-900/40 to-indigo-900/40 p-5 rounded-2xl border border-purple-800/40 space-y-3">
          <div className="flex justify-between items-start flex-wrap gap-2">
            <div className="space-y-1">
              <span className="bg-purple-500/20 text-purple-300 text-[10px] font-black tracking-widest uppercase py-1 px-3 rounded-full border border-purple-500/30">
                MATERI KELAS 6: ANALISIS RISIKO SEISMIK & KERENTANAN STRUKTUR
              </span>
              <h4 className="text-sm font-extrabold text-white">Audit Kerentanan Struktural Non-Fisik 📐</h4>
              <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                Sebagai Siswa Kelas 6, kamu mempelajari rumus indeks risiko bencana: <strong className="text-purple-300">R = (H x V) / C</strong>. Berarti kita bisa menurunkan risiko bencana (<strong className="text-purple-300">R</strong>) dengan memperkuat kapasitas (<strong className="text-purple-300">C</strong>) dan meminimalkan kerentanan perabot ruangan (<strong className="text-purple-300">V</strong>).
              </p>
            </div>
            
            {/* Structural Risk Control toggler for Class 6 */}
            <div className="bg-slate-950 p-2.5 rounded-xl border border-purple-500/30 flex flex-col items-center gap-1.5 w-full sm:w-auto text-center">
              <span className="text-[9px] font-bold text-purple-400 uppercase tracking-widest font-mono">MITIGASI STRUKTUR RAUK</span>
              <button
                onClick={() => setIsBookcaseAnchored(!isBookcaseAnchored)}
                className={`w-full text-xs font-bold py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition ${
                  isBookcaseAnchored
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                    : "bg-purple-900/40 hover:bg-purple-800/40 text-purple-300 border border-purple-800"
                }`}
              >
                <Hammer className="w-3.5 h-3.5 animate-pulse" />
                {isBookcaseAnchored ? "🗲 Angkur Terpasang!" : "Pasang Angkur Dinding"}
              </button>
              <span className="text-[9px] text-slate-500">
                {isBookcaseAnchored 
                  ? "Buku aman dikunci pada dinding!" 
                  : "Lemari rentan roboh, amankan!"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-indigo-950">
            <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-[11px]">
              <span className="text-[9px] text-slate-500 font-mono block">HAZARD (H) / LEVEL</span>
              <span className="text-red-400 font-bold font-mono">Guncangan Tinggi (Msk VII VIII)</span>
            </div>
            <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-[11px]">
              <span className="text-[9px] text-slate-500 font-mono block">VULNERABILITY (V)</span>
              <span className={`font-bold font-mono ${isBookcaseAnchored ? "text-emerald-400" : "text-amber-500 animate-pulse"}`}>
                {isBookcaseAnchored ? "Sangat Rendah (Terankur)" : "Tinggi (Lemari Bebas)"}
              </span>
            </div>
            <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-[11px]">
              <span className="text-[9px] text-slate-500 font-mono block">CAPACITY (C) INDEKS</span>
              <span className="text-blue-400 font-bold font-mono">Dukungan Proteksi Berlutut</span>
            </div>
          </div>
        </div>
      )}

      {/* 3D Action Stage */}
      <div className="relative w-full h-[400px] rounded-3xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-950">
        <div ref={containerRef} className="w-full h-full" id="seismic-lab-adaptive" />

        {/* Shaking Alert */}
        {isShaking && (
          <div className="absolute top-4 right-4 bg-red-600/95 text-white font-mono text-[10px] font-black py-1.5 px-3.5 rounded-full animate-bounce flex items-center gap-2 border border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.7)]">
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            ⚠️ {grade === 5 ? "SIAGA AWAS: TANAH GOYANG!" : "GAYA SEISMIK AKTIF: GULIR AKSELERASI TANAH"}
          </div>
        )}

        {/* Dynamic Pre-start overlays with adaptivity */}
        {!isShaking && !selectedChoice && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 gap-4">
            <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500 flex items-center justify-center animate-pulse">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h4 className="text-xl font-black text-white tracking-tight uppercase">
              {grade === 5 ? "Bumi Siap Bergoyang! 🙀" : "MULAI DIAGNOSIS SEISMIK 3D"}
            </h4>
            <p className="text-xs text-slate-300 max-w-md leading-relaxed">
              {grade === 5 
                ? "Klik lingkaran tombol merah di bawah untuk mengaktifkan guncangan gempa masif. Bersiap pilih tempat sembunyi terbaik!"
                : "Uji integritas dinamika ruangan kelas. Aktifkan simulasi percepatan tanah guncangan gempa bumi lalu evaluasi titik lindung raga."}
            </p>
            
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={triggerEarthquake}
                className="bg-red-600 hover:bg-red-500 text-white font-extrabold py-3 px-8 rounded-xl shadow-lg shadow-red-600/30 text-xs uppercase tracking-widest transition-all hover:scale-105 flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-white" /> {grade === 5 ? "Guncangkan Kamar! 🌋" : "AKTIFKAN SIMULASI SEISMIK"}
              </button>
              {grade === 6 && !isBookcaseAnchored && (
                <span className="text-[10px] text-amber-400 animate-pulse font-bold flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" /> Peringatan: Kamu belum mengunci lemari buku! Risiko terlempar buku sangat tinggi.
                </span>
              )}
            </div>
          </div>
        )}

        {/* Interactive options floating at center bottom during shaker */}
        {isShaking && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-950/95 backdrop-blur-md p-5 rounded-3xl border border-red-500/40 flex flex-col items-center gap-3 w-11/12 max-w-xl shadow-2xl">
            <p className="text-[11px] font-black text-red-400 font-mono tracking-wider animate-pulse uppercase flex items-center gap-1 px-1 text-center">
              🚨 {grade === 5 ? "CEPAT! PILIH TEMPAT KESELAMATANMU:" : "INTEGRITAS CRITICAL SECURE! TENTUKAN TANGGAP DARURAT:"}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 w-full">
              <button
                onClick={() => handleChoice("A")}
                className="bg-slate-900 hover:bg-emerald-950 border border-slate-800 hover:border-emerald-500 text-slate-200 hover:text-emerald-300 font-bold py-3.5 px-2 rounded-xl text-xs transition flex flex-col items-center justify-center gap-1.5 text-center"
              >
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 font-black flex items-center justify-center border border-emerald-500/30 text-[10px]">
                  A
                </span>
                {grade === 5 ? "Sembunyi Bawah Meja" : "Proteksi Bawah Meja (Rigid)"}
              </button>
              
              <button
                onClick={() => handleChoice("B")}
                className="bg-slate-900 hover:bg-red-950 border border-slate-800 hover:border-red-500 text-slate-200 hover:text-red-300 font-bold py-3.5 px-2 rounded-xl text-xs transition flex flex-col items-center justify-center gap-1.5 text-center"
              >
                <span className="w-5 h-5 rounded-full bg-red-500/20 text-red-300 font-black flex items-center justify-center border border-red-500/30 text-[10px]">
                  B
                </span>
                {grade === 5 ? "Dekat Meja Lemari" : "Berdiam Samping Lemari"}
              </button>

              <button
                onClick={() => handleChoice("C")}
                className="bg-slate-900 hover:bg-amber-950 border border-slate-800 hover:border-amber-500 text-slate-200 hover:text-amber-300 font-bold py-3.5 px-2 rounded-xl text-xs transition flex flex-col items-center justify-center gap-1.5 text-center"
              >
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 font-black flex items-center justify-center border border-amber-500/30 text-[10px]">
                  C
                </span>
                {grade === 5 ? "Lari ke Luar Kamar" : "Evakuasi Lari Keluar"}
              </button>
            </div>
          </div>
        )}

        {/* Selected Result Reset layout */}
        {selectedChoice && (
          <div className="absolute bottom-4 right-4 bg-slate-950/90 backdrop-blur-md py-2.5 px-4 rounded-xl border border-slate-800 flex items-center gap-2">
            <button
              onClick={triggerEarthquake}
              className="text-slate-300 hover:text-white flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider transition"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-500" /> Ulangi Diagnosa
            </button>
          </div>
        )}
      </div>

      <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-850 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
        <span className="text-slate-400 flex items-center gap-1.5">
          <Info className="w-4 h-4 text-pink-500 flex-shrink-0" />
          {grade === 5 ? (
            <span>*Bimbel keselamatan Pintar: Anak hebat siap siaga selalu tenang mencontohkan tangguh di kelas.</span>
          ) : (
            <span>*Rasio Keberhasilan evakuasi mandiri struktural non-struktural meningkat 92% berkat pemasangan Angkur Mekanis.</span>
          )}
        </span>
      </div>
    </div>
  );
}
