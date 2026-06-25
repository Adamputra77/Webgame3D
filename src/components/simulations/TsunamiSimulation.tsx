import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Play, RotateCcw, Waves, AlertTriangle, ShieldCheck, CheckCircle2, ShieldAlert, Info } from "lucide-react";

interface TsunamiSimulationProps {
  grade?: number; // 5 or 6
  onDecisionResult: (isCorrect: boolean, feedbackText: string) => void;
}

export default function TsunamiSimulation({ grade = 5, onDecisionResult }: TsunamiSimulationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [simulationState, setSimulationState] = useState<"ready" | "receding" | "waveIncoming" | "ended">("ready");
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string>("");

  // Three.js references
  const waterPlaneRef = useRef<THREE.Mesh | null>(null);
  const waveMeshRef = useRef<THREE.Mesh | null>(null);
  const timeRef = useRef<number>(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a192f); // Deep marine blue

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 5, 12);
    camera.lookAt(0, 1, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfffbeb, 1.0);
    dirLight.position.set(5, 15, 5);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // Sandy Beach
    const beachGeo = new THREE.PlaneGeometry(16, 16);
    // Rotate beach to be floor
    beachGeo.rotateX(-Math.PI / 2);
    const beachMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.9 }); // Warm yellow sand
    const beach = new THREE.Mesh(beachGeo, beachMat);
    beach.position.y = -0.5;
    beach.receiveShadow = true;
    scene.add(beach);

    // Sloped shore - let's make beach rise towards the screen
    const shoreGeo = new THREE.BoxGeometry(16, 2, 8);
    const shore = new THREE.Mesh(shoreGeo, beachMat);
    shore.position.set(0, -0.2, 4);
    shore.rotation.x = 0.1; // slight incline
    scene.add(shore);

    // Cute Little Palms on the beach
    const createPalmTree = (x: number, z: number) => {
      const palmGroup = new THREE.Group();
      
      const trunkGeo = new THREE.CylinderGeometry(0.1, 0.15, 2, 8);
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f });
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 1;
      trunk.rotation.z = 0.1;
      palmGroup.add(trunk);

      // Leaves
      const leafMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6 });
      for (let i = 0; i < 5; i++) {
        const leafGeo = new THREE.ConeGeometry(0.5, 1.2, 4);
        const leaf = new THREE.Mesh(leafGeo, leafMat);
        leaf.position.set(0.1, 2.1, 0);
        leaf.rotation.x = 1.2;
        leaf.rotation.y = (i * Math.PI * 2) / 5;
        palmGroup.add(leaf);
      }

      palmGroup.position.set(x, 0, z);
      scene.add(palmGroup);
    };

    createPalmTree(-5, 3);
    createPalmTree(5, 2.5);

    // Ocean Water Plane (normally covers the background)
    const waterGeo = new THREE.BoxGeometry(16, 1, 10);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.8,
      roughness: 0.2,
    });
    const waterPlane = new THREE.Mesh(waterGeo, waterMat);
    waterPlane.position.set(0, -0.2, -3);
    scene.add(waterPlane);
    waterPlaneRef.current = waterPlane;

    // Giant Wave (starts flat/hidden far back, grows and moves forward when triggered)
    const waveGeo = new THREE.BoxGeometry(16, 0.1, 2);
    const waveMat = new THREE.MeshStandardMaterial({
      color: 0x0369a1,
      roughness: 0.1,
      emissive: 0x0284c7,
      emissiveIntensity: 0.2,
    });
    const waveMesh = new THREE.Mesh(waveGeo, waveMat);
    waveMesh.position.set(0, -1, -7);
    scene.add(waveMesh);
    waveMeshRef.current = waveMesh;

    // Background mountains
    const mountGeo = new THREE.ConeGeometry(4, 5, 4);
    const mountMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.95 });
    const mountain1 = new THREE.Mesh(mountGeo, mountMat);
    mountain1.position.set(-8, 1, -8);
    scene.add(mountain1);

    const mountain2 = new THREE.Mesh(mountGeo, mountMat);
    mountain2.position.set(8, 1, -8);
    scene.add(mountain2);

    let animationId: number;
    let waveProgress = 0;

    const animate = () => {
      timeRef.current += 0.03;
      animationId = requestAnimationFrame(animate);

      // Normal ambient ocean ripples
      if (waterPlaneRef.current) {
        waterPlaneRef.current.position.y = -0.2 + Math.sin(timeRef.current) * 0.05;
      }

      // Animate receding water
      if (simulationState === "receding") {
        if (waterPlaneRef.current && waterPlaneRef.current.position.z > -7) {
          waterPlaneRef.current.position.z -= 0.04;
          waterPlaneRef.current.scale.z -= 0.005;
          waterPlaneRef.current.position.y -= 0.003;
        } else {
          // Finished receding, start the incoming giant wave
          setSimulationState("waveIncoming");
        }
      }

      // Animate giant wave coming forward and rising
      if (simulationState === "waveIncoming") {
        if (waveMeshRef.current) {
          waveProgress += 0.015;
          waveMeshRef.current.position.z = -7 + waveProgress * 10;
          
          // Wave height rises
          if (waveMeshRef.current.scale.y < 35) {
            waveMeshRef.current.scale.y += 0.8;
            waveMeshRef.current.position.y += 0.04;
          }

          // Sway wave scale/rotation slightly to simulate rapid water movement
          waveMeshRef.current.rotation.x = Math.sin(timeRef.current * 2) * 0.05;
          
          if (waveMeshRef.current.position.z >= 2) {
            setSimulationState("ended");
          }
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [simulationState]);

  const triggerTsunami = () => {
    setSelectedChoice(null);
    setFeedback("");
    setSimulationState("receding");
    if (waterPlaneRef.current) {
      waterPlaneRef.current.position.set(0, -0.2, -3);
      waterPlaneRef.current.scale.set(1, 1, 1);
    }
    if (waveMeshRef.current) {
      waveMeshRef.current.position.set(0, -1, -7);
      waveMeshRef.current.scale.set(1, 1, 1);
    }
  };

  const handleChoice = (choice: string) => {
    setSelectedChoice(choice);
    let isCorrect = choice === "B";
    let text = "";

    if (choice === "A") {
      text = grade === 6 
        ? "Salah! Pikir: Mengabaikan tanda-tanda surut air laut untuk mencari ikan meningkatkan fatalitas korban jiwa akibat terjangan gelombang pertama (Tsunami run-up)."
        : "Salah! Hati-hati, jika air laut surut drastis, itu pertanda tsunami besar akan segera datang. Jangan pernah mendekat atau mencari ikan di pantai!";
    } else if (choice === "B") {
      text = grade === 6
        ? "Sangat Tepat! Raga & Pikir: Evakuasi vertikal/horizontal segera menuju titik kumpul zona aman (Ketinggian minimal 20-30 meter) adalah mitigasi tsunami terbaik."
        : "Luar Biasa Hebat! Raga & Rasa: Begitu melihat air laut surut drastis, segera lari sejauh dan setinggi mungkin! Kamu berhasil menyelamatkan diri dari tsunami!";
    } else if (choice === "C") {
      text = grade === 6
        ? "Salah! Rasa: Berfoto selfie mengorbankan waktu emas evakuasi (golden time), yang biasanya hanya berkisar 10-20 menit sejak air laut surut."
        : "Salah! Jangan sekali-kali berdiam di pantai apalagi berfoto selfie. Air laut yang surut adalah peringatan alam darurat bagi raga kita untuk segera pergi!";
    } else {
      text = grade === 6
        ? "Salah! Raga: Menunggu tanpa aksi evakuasi mandiri di pantai sangat berbahaya. Tsunami bergerak secepat pesawat terbang (500-800 km/jam) di laut dalam."
        : "Salah! Jangan menunggu di pantai. Lari segera adalah tindakan terbaik raga kita demi keselamatan bersama.";
    }

    setFeedback(text);
    onDecisionResult(isCorrect, text);
  };

  const resetAll = () => {
    setSimulationState("ready");
    setSelectedChoice(null);
    setFeedback("");
  };

  return (
    <div className="bg-white border-4 border-slate-100 rounded-3xl p-6 shadow-sm space-y-6 text-[#1E293B]">
      {/* Intro info card */}
      <div className="bg-sky-50 border border-sky-100 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <span className="bg-sky-100 text-sky-800 text-[10px] font-black tracking-wider uppercase py-0.5 px-2.5 rounded-full block w-max">
            SIMULASI ZONA PANTAI NUSANTARA
          </span>
          <h4 className="text-base font-black text-sky-900 mt-1 font-playful flex items-center gap-1">
            <Waves className="w-5 h-5 text-sky-650 animate-pulse" /> Deteksi Dini & Mitigasi Tsunami
          </h4>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-500 font-bold block">Tingkat Kesulitan:</span>
          <span className="text-xs font-black text-rose-600 block">⚠️ Sangat Tinggi</span>
        </div>
      </div>

      {/* 3D Action Stage */}
      <div className="relative w-full h-[400px] rounded-3xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-950">
        <div ref={containerRef} className="w-full h-full" id="tsunami-lab-3d" />

        {/* Shaking or Warning Alerts */}
        {simulationState === "receding" && (
          <div className="absolute top-4 right-4 bg-amber-600/95 text-white font-sans text-xs font-black py-1.5 px-3.5 rounded-full animate-pulse flex items-center gap-2 border border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.5)]">
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            ⚠️ {grade === 5 ? "TANDA ALAM: AIR LAUT SURUT DRASITIS!" : "AWAS: DEPRESI PENAMPANG AIR LAUT DALAM"}
          </div>
        )}

        {simulationState === "waveIncoming" && (
          <div className="absolute top-4 right-4 bg-red-600/95 text-white font-sans text-xs font-black py-1.5 px-3.5 rounded-full animate-bounce flex items-center gap-2 border border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.7)]">
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            🚨 {grade === 5 ? "BAHAYA: GELOMBANG TSUNAMI DATANG!" : "KRITIS: GELOMBANG TSUNAMI MENERJANG PANTAI"}
          </div>
        )}

        {/* Pre-start overlays */}
        {simulationState === "ready" && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 gap-4">
            <div className="w-16 h-16 rounded-full bg-sky-500/20 border border-sky-500 flex items-center justify-center animate-pulse">
              <Waves className="w-8 h-8 text-sky-400" />
            </div>
            <h4 className="text-xl font-black text-white tracking-tight uppercase font-playful">
              Simulasi Tsunami 3D 🌊
            </h4>
            <p className="text-sm text-slate-300 max-w-md leading-relaxed font-semibold">
              {grade === 5 
                ? "Mari pelajari bahaya gelombang tsunami! Klik tombol di bawah untuk mengaktifkan gempa bawah laut dan melihat perubahan air laut."
                : "Uji kompetensi taktis darurat raga terhadap bahaya tsunami akibat gempa bumi bawah laut tektonik."}
            </p>
            
            <button
              onClick={triggerTsunami}
              className="bg-sky-600 hover:bg-sky-500 text-white font-black py-3 px-8 rounded-xl shadow-lg shadow-sky-600/30 text-xs uppercase tracking-wider transition-all hover:scale-105 flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" /> {grade === 5 ? "Mulai Simulasi Pantai 🌴" : "AKTIFKAN DETEKSI TSUNAMI"}
            </button>
          </div>
        )}

        {/* Options floating during simulation active */}
        {(simulationState === "receding" || simulationState === "waveIncoming") && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-950/95 backdrop-blur-md p-5 rounded-3xl border border-sky-500/40 flex flex-col items-center gap-3 w-11/12 max-w-xl shadow-2xl">
            <p className="text-sm font-bold text-sky-400 tracking-wider animate-pulse uppercase text-center font-playful">
              🚨 Kamu sedang di pantai dan tiba-tiba air laut surut jauh lebih dari biasanya. Apa yang harus kamu lakukan?
            </p>
            <div className="grid grid-cols-1 gap-2 w-full">
              <button
                onClick={() => handleChoice("A")}
                className={`py-3 px-4 rounded-xl text-xs font-semibold text-left transition flex items-center gap-3 cursor-pointer ${
                  selectedChoice === "A"
                    ? "bg-red-950 border-2 border-red-500 text-red-200"
                    : "bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-200"
                }`}
              >
                <span className="w-6 h-6 rounded-full bg-red-500/20 text-red-300 font-black flex items-center justify-center border border-red-500/30 text-xs shrink-0">
                  A
                </span>
                <span>A. Mendekat ke pantai untuk mencari ikan yang terdampar di pasir</span>
              </button>
              
              <button
                onClick={() => handleChoice("B")}
                className={`py-3 px-4 rounded-xl text-xs font-semibold text-left transition flex items-center gap-3 cursor-pointer ${
                  selectedChoice === "B"
                    ? "bg-emerald-950 border-2 border-emerald-500 text-emerald-200"
                    : "bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-200"
                }`}
              >
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 font-black flex items-center justify-center border border-emerald-500/30 text-xs shrink-0">
                  B
                </span>
                <span>B. Segera lari ke tempat yang tinggi dan menjauhi pantai, jangan mendekat sama sekali</span>
              </button>

              <button
                onClick={() => handleChoice("C")}
                className={`py-3 px-4 rounded-xl text-xs font-semibold text-left transition flex items-center gap-3 cursor-pointer ${
                  selectedChoice === "C"
                    ? "bg-amber-950 border-2 border-amber-500 text-amber-200"
                    : "bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-200"
                }`}
              >
                <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 font-black flex items-center justify-center border border-amber-500/30 text-xs shrink-0">
                  C
                </span>
                <span>C. Berdiam diri di pantai sambil berfoto selfie dengan air laut yang surut</span>
              </button>

              <button
                onClick={() => handleChoice("D")}
                className={`py-3 px-4 rounded-xl text-xs font-semibold text-left transition flex items-center gap-3 cursor-pointer ${
                  selectedChoice === "D"
                    ? "bg-slate-950 border-2 border-slate-700 text-slate-300"
                    : "bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-200"
                }`}
              >
                <span className="w-6 h-6 rounded-full bg-slate-500/20 text-slate-400 font-black flex items-center justify-center border border-slate-500/30 text-xs shrink-0">
                  D
                </span>
                <span>D. Menunggu instruksi resmi di pantai tanpa melakukan apa-apa</span>
              </button>
            </div>
          </div>
        )}

        {/* Ended layout */}
        {simulationState === "ended" && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center gap-3">
            <div className={`p-4 rounded-full ${selectedChoice === "B" ? "bg-emerald-500/10 border border-emerald-500 text-emerald-400" : "bg-red-500/10 border border-red-500 text-red-500"}`}>
              {selectedChoice === "B" ? <CheckCircle2 className="w-10 h-10" /> : <ShieldAlert className="w-10 h-10" />}
            </div>
            <h4 className="text-lg font-black text-white uppercase tracking-wider font-playful">
              {selectedChoice === "B" ? "Misi Tsunami Selesai!" : "Terjebak Terjangan Tsunami!"}
            </h4>
            <p className="text-sm text-slate-300 max-w-sm leading-relaxed font-semibold">
              {feedback || "Lakukan evakuasi mandiri segera demi keselamatan raga!"}
            </p>
            <button
              onClick={resetAll}
              className="mt-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-500 text-xs py-2.5 px-6 rounded-xl font-bold uppercase tracking-wider transition flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Ulangi Simulasi
            </button>
          </div>
        )}
      </div>

      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-sm text-slate-600 font-semibold leading-relaxed">
        <Info className="w-4 h-4 text-sky-550 inline mr-2" />
        {grade === 5 
          ? "Ingat Pesan Siaga: Jika ada gempa besar di dekat pantai, atau kamu melihat air laut surut drastis, jangan tunggu sirene! Segera lari ke tempat yang tinggi." 
          : "Prinsip Golden Time: Rentang waktu antara gempa bumi bawah laut dengan kedatangan gelombang tsunami pertama di pesisir berkisar antara 10-30 menit."}
      </div>
    </div>
  );
}
