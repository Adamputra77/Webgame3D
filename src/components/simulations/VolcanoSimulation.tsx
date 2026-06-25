import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Play, RotateCcw, AlertOctagon, Trees, Compass, Info, ShieldAlert, CheckCircle2 } from "lucide-react";

interface VolcanoSimulationProps {
  grade?: number; // 5 or 6
  onDecisionResult: (secured: boolean, feedbackText: string) => void;
}

export default function VolcanoSimulation({ grade = 5, onDecisionResult }: VolcanoSimulationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPathBlocked, setIsPathBlocked] = useState<boolean>(true);
  const [selectedDirection, setSelectedDirection] = useState<"summit" | "refuge">("summit");
  const [simulationState, setSimulationState] = useState<"ready" | "running" | "ended">("ready");
  const [review, setReview] = useState<string>("");
  const [hasEwsAlarm, setHasEwsAlarm] = useState(false);

  // Refs for rendering loop updates
  const lavaFlowsRef = useRef<THREE.Mesh[]>([]);
  const rockMeshRef = useRef<THREE.Mesh | null>(null);
  const characterRef = useRef<THREE.Mesh | null>(null);
  const isEruptingRef = useRef<boolean>(false);
  const characterTargetRef = useRef<"nowhere" | "blocked" | "danger" | "safe">("nowhere");
  const hasEwsAlarmRef = useRef<boolean>(false);

  useEffect(() => {
    hasEwsAlarmRef.current = hasEwsAlarm;
  }, [hasEwsAlarm]);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1c1917); // Stone-900

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 5, 12);
    camera.lookAt(0, 0.8, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);

    // Floor (volcanic dusty terrain)
    const floorGeo = new THREE.PlaneGeometry(16, 16);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x44403c, roughness: 0.95 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.5;
    floor.receiveShadow = true;
    scene.add(floor);

    // Volcanic Mountain Cone at the background
    const mountGeo = new THREE.ConeGeometry(5, 5, 16);
    const mountMat = new THREE.MeshStandardMaterial({ color: 0x292524, roughness: 0.9 });
    const mount = new THREE.Mesh(mountGeo, mountMat);
    mount.position.set(0, 2.0, -5);
    mount.castShadow = true;
    mount.receiveShadow = true;
    scene.add(mount);

    // Crater summit orange glow
    const craterGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.2, 16);
    const craterMat = new THREE.MeshBasicMaterial({ color: 0xea580c });
    const crater = new THREE.Mesh(craterGeo, craterMat);
    crater.position.set(0, 4.45, -5);
    scene.add(crater);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffedd5, 1.0);
    dirLight.position.set(2, 6, 4);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // Red light on mountain top
    const mountainLight = new THREE.PointLight(0xea580c, 2.0, 10);
    mountainLight.position.set(0, 4.4, -5);
    scene.add(mountainLight);

    // Safe Refuge House on the bottom right (Pos Hijau)
    const buildRefugeHouse = () => {
      const g = new THREE.Group();
      const bGeo = new THREE.BoxGeometry(1.5, 0.8, 1.2);
      const bMat = new THREE.MeshStandardMaterial({ color: 0x059669 }); // Emerald Green refuge
      const b = new THREE.Mesh(bGeo, bMat);
      b.position.y = 0.4 - 0.5;
      g.add(b);

      const rGeo = new THREE.ConeGeometry(1.1, 0.5, 4);
      const rMat = new THREE.MeshStandardMaterial({ color: 0x064e3b });
      const r = new THREE.Mesh(rGeo, rMat);
      r.rotation.y = Math.PI/4;
      r.position.y = 1.05 - 0.5;
      g.add(r);
      return g;
    };
    const refugeHouse = buildRefugeHouse();
    refugeHouse.position.set(3.5, 0, 1.5);
    scene.add(refugeHouse);

    // Dynamic blocker rock (Batu Besar)
    const rockGeo = new THREE.DodecahedronGeometry(0.5);
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x57534e, roughness: 0.9 });
    const rock = new THREE.Mesh(rockGeo, rockMat);
    // Blocks path from center (0,0) to downstream (3.5, 1.5)
    rock.position.set(1.6, 0.0, 0.5);
    rock.castShadow = true;
    scene.add(rock);
    rockMeshRef.current = rock;

    // Character Mesh (rose color cylindrical block)
    const chGeo = new THREE.CylinderGeometry(0.2, 0.2, 1.0, 12);
    const chMat = new THREE.MeshStandardMaterial({ color: 0xf43f5e });
    const char = new THREE.Mesh(chGeo, chMat);
    char.position.set(-2, 0.0, 0.5);
    char.castShadow = true;
    scene.add(char);
    characterRef.current = char;

    // Spawn 10 tiny particles of red hot lava stream
    const lavas: THREE.Mesh[] = [];
    const lavaGeo = new THREE.SphereGeometry(0.12, 8, 8);
    const lavaMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    for (let i = 0; i < 12; i++) {
      const lv = new THREE.Mesh(lavaGeo, lavaMat);
      lv.position.set(
        (Math.random() - 0.5) * 1.5,
        4.3,
        -5 + (Math.random() - 0.5)*0.5
      );
      scene.add(lv);
      lavas.push(lv);
    }
    lavaFlowsRef.current = lavas;

    // Click trigger on rock to clear path
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleMouseClick = (event: MouseEvent) => {
      if (simulationState !== "ready") return;

      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const hitTest = [rockMeshRef.current].filter((r): r is THREE.Mesh => r !== null);
      const intersects = raycaster.intersectObjects(hitTest);

      if (intersects.length > 0) {
        // Roll block down to the side out of reach
        setIsPathBlocked(false);
        const obstacle = rockMeshRef.current;
        if (obstacle) {
          obstacle.position.set(1.5, -0.4, -2.5); // toss to canyon
        }
      }
    };

    renderer.domElement.addEventListener("click", handleMouseClick);

    // Render ticking
    let reqId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      reqId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Lava flows downward from peak
      if (isEruptingRef.current) {
        lavas.forEach((lv, i) => {
          // move down mountain slope
          lv.position.y -= 0.04;
          lv.position.z += 0.08;
          lv.position.x += Math.sin(elapsed + i) * 0.01;

          // recycle
          if (lv.position.y < -0.5) {
            lv.position.set(
              (Math.random() - 0.5) * 1.2,
              4.3,
              -5
            );
          }
        });

        // Run character
        const ch = characterRef.current;
        const target = characterTargetRef.current;
        if (ch) {
          if (target === "danger") {
            // head towards crater / top
            if (ch.position.z > -4.5) {
              ch.position.z -= 0.08;
              ch.position.y += 0.04;
            }
          } else if (target === "blocked") {
            // head towards right but hits block
            if (ch.position.x < 1.1) {
              ch.position.x += 0.08;
            }
          } else if (target === "safe") {
            // clean path to refuge house
            if (ch.position.x < 3.4) {
              ch.position.x += 0.08;
            }
            if (ch.position.z < 1.4) {
              ch.position.z += 0.02;
            }
          }
        }
      } else {
        // rest state
        lavas.forEach((lv, i) => {
          lv.position.y = 4.3 + Math.sin(elapsed * 2 + i) * 0.08;
        });

        // reset char
        const ch = characterRef.current;
        if (ch) {
          ch.position.set(-2, 0.0, 0.5);
          ch.scale.set(1, 1, 1);
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
  }, [simulationState]);

  const triggerEruption = () => {
    setSimulationState("running");
    isEruptingRef.current = true;

    // Define target path resolution
    if (selectedDirection === "summit") {
      characterTargetRef.current = "danger";
    } else {
      if (isPathBlocked) {
        characterTargetRef.current = "blocked";
      } else {
        characterTargetRef.current = "safe";
      }
    }

    setTimeout(() => {
      setSimulationState("ended");
      isEruptingRef.current = false;

      const pathIsFree = !isPathBlocked;
      const headingToRefuge = selectedDirection === "refuge";
      
      // Class 6 EWS Alarm gives a safety bypass even if they forgot to clear the path, as high-tech sirene triggers ahead-of-time evacuation!
      let secured = false;
      let scoreReview = "";

      if (headingToRefuge) {
        if (pathIsFree) {
          secured = true;
          if (grade === 5) {
            scoreReview = "PENYELAMATAN HEBAT! 🎉 Kamu berhasil memindahkan batu banjir lahar besar dari jalur pendakian, mengganti tanda rambu kearah 'Pos Aman Cepat', dan mengevakuasi bimo ke tempat aman rukun sebelum awan merapi meluncur turun!";
          } else {
            scoreReview = "EVAKUASI TAKTIS REKAYASA BERHASIL! 📡 Risiko KRB III ternetralisasi. Koordinasi peta jalur darurat (evacuation corridor) bebas hambatan mengalir lancar menuju titik evakuasi akhir. Seluruh skenario aman.";
          }
        } else if (grade === 6 && hasEwsAlarm) {
          secured = true;
          scoreReview = "SISTEM EWS MENYELAMATKAN NYAWA! 📡 Alarm Sirene Dini berbunyi 45 menit sebelum erupsi, memberikan jeda reaksi optimal bagi tim SAR untuk mengevakuasi penduduk rute alternatif meskipun rute utama terblokir batuan longsor. Kapasitas (C) optimal!";
        } else {
          secured = false;
          if (grade === 5) {
            scoreReview = "Aduh, Jalan buntu! 😿 Jalurnya masih tertutup tumpukan batu besar, sehingga Bimo tidak sempat menyeberang sungai lahar. Lain kali klik/sentuh tumpukan batu di luar got jalan raya itu ya!";
          } else {
            scoreReview = "HAMBATAN RUTE! 🌋 Kegagalan evakuasi mandiri akibat disrupsi geometris (jalur rute terblokir debris vulkanik). Sistem peringatan terlambat mendeteksi kegagalan, mengakibatkan waktu tunggu paparan awan panas kritis.";
          }
        }
      } else {
        secured = false;
        if (grade === 5) {
          scoreReview = "Gunung Api Sangat Panas! 🔥 Bukannya turun, kamu malah menyuruh Bimo memanjat ke atas kawah yang menyemburkan api hangat. Berlari ke daerah rendah bermukim adalah jalan keselamatan!";
        } else {
          scoreReview = "SALAH ARAH EVAKUASI! ❌ Memasuki zona merah murniah KRB I kawah aktif tanpa pelindung termal. Paparan radiasi piroklastik ekstrem merusak seluruh mitigasi.";
        }
      }

      setReview(scoreReview);
      onDecisionResult(secured, scoreReview);
    }, 4000);
  };

  const resetAll = () => {
    setIsPathBlocked(true);
    setSelectedDirection("summit");
    setSimulationState("ready");
    setReview("");
    isEruptingRef.current = false;
    characterTargetRef.current = "nowhere";
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Grade learning blocks */}
      {grade === 5 ? (
        <div className="bg-gradient-to-r from-amber-900/40 to-orange-900/30 p-5 rounded-2xl border border-amber-800/40 space-y-2">
          <span className="bg-amber-500/20 text-amber-300 text-[10px] font-black tracking-widest uppercase py-1 px-3 rounded-full border border-amber-500/30">
            MATERI KELAS 5: PENJELAJAHAN GUNUNG MERAPI ERUPSI
          </span>
          <h4 className="text-sm font-extrabold text-white">Harus Segera Menjauh Saat Gunung Meletus 🌋</h4>
          <p className="text-xs text-slate-300 leading-relaxed text-left text-balance">
            Gunung meletus sangat menakjubkan tapi awan panas dan batunya sangat panas sekali! Bila ada alarm bising peringatan meraung, kita harus segera berlari menjauh ke bawah gunung (Pos Pengungsian) yang dipasangi tenda-tenda berwarna hijau, jangan pernah berlari ke atas puncak kawah ya!
          </p>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-stone-900 via-amber-950/40 to-slate-900 p-5 rounded-2xl border border-amber-850 space-y-3">
          <div className="flex justify-between items-start flex-wrap gap-2">
            <div className="space-y-1">
              <span className="bg-amber-500/20 text-amber-300 text-[10px] font-black tracking-widest uppercase py-1 px-3 rounded-full border border-amber-500/30">
                MATERI KELAS 6: PEMETAAN EVAKUASI GUNUNG BERAPI (ZONA KRB III)
              </span>
              <h4 className="text-sm font-extrabold text-white">Prinsip EWS (Early Warning System) & Kawasan Bahaya</h4>
              <p className="text-xs text-slate-300 leading-relaxed max-w-2xl text-left">
                Kawasan Rawan Bencana (KRB) III adalah wilayah terdekat yang terancam langsung awan panas, aliran lava, dan lontaran batu pijar. Ketahanan rute didukung oleh sistem **EWS (Sistem Peringatan Dini)** yang mentransmisikan data seismometer ke sirene udara sekolah.
              </p>
            </div>

            {/* EWS control for Class 6 */}
            <div className="bg-stone-950 p-2.5 rounded-xl border border-amber-500/30 flex flex-col items-center gap-1 w-full sm:w-auto text-center">
              <span className="text-[9px] font-bold text-amber-400 uppercase tracking-widest font-mono">EWS TELEMETRI SIRENE</span>
              <button
                onClick={() => setHasEwsAlarm(!hasEwsAlarm)}
                className={`w-full text-xs font-bold py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition ${
                  hasEwsAlarm
                    ? "bg-amber-600 text-white shadow-md shadow-amber-600/20"
                    : "bg-amber-950/40 hover:bg-amber-900/40 text-amber-300 border border-amber-800"
                }`}
              >
                <AlertOctagon className="w-3.5 h-3.5 animate-pulse text-amber-300" />
                {hasEwsAlarm ? "📡 EWS Aktif!" : "Pasang Pemancar EWS"}
              </button>
              <span className="text-[9px] text-slate-500 text-balance leading-none max-w-[130px] inline-block mt-0.5">
                {hasEwsAlarm 
                  ? "Sinyal transmisi otomatis aktif" 
                  : "Hanya evakuasi manual paska-insiden"}
              </span>
            </div>
          </div>

          <div className="text-[11px] bg-slate-950 p-2.5 rounded-lg border border-slate-850 text-amber-300/90 leading-relaxed text-left">
            📟 <strong className="text-white">Intervensi Keputusan:</strong> Pada skenario Kelas 6, jika pemancar EWS aktif, masyarakat mendapatkan jendela evakuasi lebih awal. Jika kamu mengaktifkannya, kamu tetap lulus sekalipun rute utama terhalang tebing batu runtuh!
          </div>
        </div>
      )}

      {/* 3D stage */}
      <div className="relative w-full h-[380px] rounded-3xl overflow-hidden shadow-2xl border border-slate-800 bg-stone-950">
        <div ref={containerRef} className="w-full h-full" id="lava-plateau-adaptive" />

        {/* Path Obstacle Alert indicator */}
        {isPathBlocked ? (
          <div className="absolute top-4 left-4 bg-amber-950/95 text-amber-400 border border-amber-500/40 p-3 rounded-2xl max-w-xs text-[11px] animate-pulse">
            <h5 className="font-extrabold flex items-center gap-1.5 text-red-400">
              <AlertOctagon className="w-4 h-4 text-red-500" /> {grade === 5 ? "BUMI LONGSOR!" : "DISRUPSI JALUR MORFOLOGI"}
            </h5>
            <p className="mt-1 text-slate-300 leading-relaxed">
              {grade === 5 
                ? "Ada batu besar menggelinding dari lereng gunung merapi menyumbat jalan! Klik batu tersebut untuk melemparnya sebelum erupsi dimulai!"
                : "Hambatan longsor sedimentasi berdiameter besar menyumbat grid lintasan (1.6, 0.5). Sentuh/klik batu besar tersebut untuk re-aliran."}
            </p>
          </div>
        ) : (
          <div className="absolute top-4 left-4 bg-emerald-950/90 text-emerald-400 border border-emerald-500/40 px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase font-mono tracking-widest shadow-lg">
            Koridor Jalan Terbuka ✓
          </div>
        )}

        {/* Direction setting box inside simulator */}
        {simulationState === "ready" && (
          <div className="absolute bottom-4 left-4 bg-slate-950/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-800 text-xs flex flex-col gap-2 max-w-[200px] shadow-2xl">
            <span className="font-black text-stone-300/80 uppercase tracking-widest flex items-center gap-1 text-[9px]">
              <Compass className="w-3.5 h-3.5 text-rose-500" /> {grade === 5 ? "Tanda Arah Jalan:" : "ZONING PILIHAN EVAKUASI:"}
            </span>
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => setSelectedDirection("summit")}
                className={`py-1.5 px-3 rounded-lg text-[10px] font-black tracking-wide text-left justify-between flex items-center transition ${
                  selectedDirection === "summit"
                    ? "bg-rose-600 text-white shadow-md shadow-rose-600/25"
                    : "bg-slate-900 text-stone-400 border border-slate-850 hover:bg-slate-850"
                }`}
              >
                <span>🚀 Ke Kawah Gunung</span>
                {selectedDirection === "summit" && <span>⏺</span>}
              </button>
              <button
                onClick={() => setSelectedDirection("refuge")}
                className={`py-1.5 px-3 rounded-lg text-[10px] font-black tracking-wide text-left justify-between flex items-center transition ${
                  selectedDirection === "refuge"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/25"
                    : "bg-slate-900 text-stone-400 border border-slate-850 hover:bg-slate-850"
                }`}
              >
                <span>🏕 Ke Pos Pengungsian</span>
                {selectedDirection === "refuge" && <span>✓</span>}
              </button>
            </div>
          </div>
        )}

        {/* Play control overlay */}
        {simulationState === "ready" && (
          <div className="absolute bottom-4 right-4 bg-slate-950/95 p-3.5 border border-slate-850 rounded-2xl flex items-center shadow-2xl">
            <button
              onClick={triggerEruption}
              className="bg-red-600 hover:bg-red-500 text-white font-extrabold text-[10px] uppercase tracking-wider py-2.5 px-5 rounded-xl flex items-center gap-2 transform active:scale-95 transition-all shadow-lg"
            >
              <Play className="w-4 h-4 fill-white animate-pulse" /> Erupsi Gunung! 🌋
            </button>
          </div>
        )}

        {/* Running screen popup */}
        {simulationState === "running" && (
          <div className="absolute inset-0 bg-red-950/20 backdrop-blur-[0.5px] pointer-events-none flex items-center justify-center">
            <div className="bg-stone-950/95 border border-red-600/40 p-4 rounded-xl shadow-2xl flex items-center gap-2 animate-pulse">
              <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
              <p className="text-[10px] text-red-400 font-mono tracking-widest font-black uppercase">
                {grade === 5 ? "GUNUNG MELETUS! BIMO BERLARI..." : "LAUNCHING PLINIAN ERUPTION SEQUENCE: EVACUATING CHARACTER"}
              </p>
            </div>
          </div>
        )}

        {/* Re-start block overlay */}
        {simulationState === "ended" && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center gap-4">
            <div className={`p-4 rounded-full ${isPathBlocked && selectedDirection === "refuge" && !(grade === 6 && hasEwsAlarm) ? "bg-red-500/10 border border-red-500 text-red-500" : selectedDirection === "refuge" ? "bg-emerald-500/10 border border-emerald-500 text-emerald-400" : "bg-red-500/10 border border-red-500 text-red-500"}`}>
              {selectedDirection === "refuge" && (!isPathBlocked || (grade === 6 && hasEwsAlarm)) ? <CheckCircle2 className="w-10 h-10" /> : <ShieldAlert className="w-10 h-10" />}
            </div>
            <h4 className="text-lg font-black text-white uppercase tracking-wider">
              {selectedDirection === "refuge" && (!isPathBlocked || (grade === 6 && hasEwsAlarm)) ? "EVAKUASI KELAS LOLOS!" : "ZONA KRB SEKTOR DARURAT BAHAYA!"}
            </h4>
            <p className="text-xs text-slate-300 max-w-sm leading-relaxed">
              {review}
            </p>
            <button
              onClick={resetAll}
              className="mt-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-500 text-xs py-2 px-6 rounded-lg font-bold uppercase tracking-widest transition flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Atur Ulang Rencana
            </button>
          </div>
        )}
      </div>

      <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-850 text-xs text-slate-400">
        <Info className="w-4 h-4 text-amber-500 inline mr-2" />
        {grade === 5 
          ? "Gunung berapi menyuburkan sawah ladang merdeka kita, tetapi saat bergolak marilah kita menepi dan berlindung ke pos pengungsian guru." 
          : "Statistik geologi: EWS sirene radio VHF nirkabel andal mengurangi waktu respon tanggap siaga daerah terpencil sampai 55%."}
      </div>
    </div>
  );
}
