import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Play, RotateCcw, Trash2, CheckCircle2, Trees, Timer, Droplets, Info } from "lucide-react";

interface Props {
  grade?: number;
  onDecisionResult: (cleanedAll: boolean, feedback: string) => void;
}

function makeRoadTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 256; c.height = 256;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#3d3d3d";
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 200; i++) {
    const g = 60 + Math.random() * 30;
    ctx.fillStyle = `rgb(${g - 10}, ${g}, ${g - 10})`;
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 2 + Math.random() * 4, 1 + Math.random() * 2);
  }
  ctx.strokeStyle = "#ffcc00";
  ctx.lineWidth = 3;
  ctx.setLineDash([20, 15]);
  ctx.beginPath();
  ctx.moveTo(0, 128);
  ctx.lineTo(256, 128);
  ctx.stroke();
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 2);
  return tex;
}

function makeWaterTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 128; c.height = 128;
  const ctx = c.getContext("2d")!;
  for (let y = 0; y < 128; y++)
    for (let x = 0; x < 128; x++) {
      const v = 40 + Math.sin(x * 0.3) * 10 + Math.cos(y * 0.4) * 10 + Math.sin((x + y) * 0.2) * 8;
      ctx.fillStyle = `rgb(30, ${80 + v}, ${140 + v})`;
      ctx.fillRect(x, y, 1, 1);
    }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 4);
  return tex;
}

export default function FloodSimulation({ grade = 5, onDecisionResult }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [trashLeft, setTrashLeft] = useState(4);
  const [gameStatus, setGameStatus] = useState<"idle" | "playing" | "success" | "flood">("idle");
  const [timer, setTimer] = useState(30);
  const [hasBiopori, setHasBiopori] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  const trashLeftRef = useRef(4);
  const waterRef = useRef<THREE.Mesh | null>(null);
  const waterLevRef = useRef(-0.55);
  const yawRef = useRef(0);
  const pitchRef = useRef(-0.68);
  const camRef = useRef<THREE.PerspectiveCamera | null>(null);
  const bioporiRef = useRef(false);
  const trashRef = useRef<THREE.Mesh[]>([]);
  const gameStatusRef = useRef<"idle" | "playing" | "success" | "flood">("idle");
  const timerRef = useRef(30);

  useEffect(() => { bioporiRef.current = hasBiopori; }, [hasBiopori]);
  useEffect(() => { gameStatusRef.current = gameStatus; }, [gameStatus]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const w = el.clientWidth || 400;
    const h = el.clientHeight || 300;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    scene.fog = new THREE.Fog(0x1a1a2e, 10, 18);
    const cam = new THREE.PerspectiveCamera(75, w / h, 0.1, 50);
    cam.position.set(0, 1.4, 2.0);
    cam.lookAt(0, -0.2, -0.3);
    camRef.current = cam;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    el.appendChild(renderer.domElement);

    const grassMat = new THREE.MeshStandardMaterial({ color: 0x3a6b35, roughness: 0.9 });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(20, 14), grassMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, -0.5, 0);
    ground.receiveShadow = true;
    scene.add(ground);

    const roadTex = makeRoadTexture();
    const roadMat = new THREE.MeshStandardMaterial({ map: roadTex, roughness: 0.85 });
    const road = new THREE.Mesh(new THREE.BoxGeometry(18, 0.5, 4.0), roadMat);
    road.position.set(0, -0.25, 2.5);
    road.receiveShadow = true;
    road.castShadow = true;
    scene.add(road);

    const concMat = new THREE.MeshStandardMaterial({ color: 0x8a8f96, roughness: 0.85 });
    const gotBack = new THREE.Mesh(new THREE.BoxGeometry(18, 0.6, 0.08), concMat);
    gotBack.position.set(0, -0.3, 0.5);
    gotBack.receiveShadow = true;
    gotBack.castShadow = true;
    scene.add(gotBack);

    const gotFront = new THREE.Mesh(new THREE.BoxGeometry(18, 0.6, 0.08), concMat);
    gotFront.position.set(0, -0.3, -0.3);
    gotFront.receiveShadow = true;
    gotFront.castShadow = true;
    scene.add(gotFront);

    const gotFloor = new THREE.Mesh(new THREE.PlaneGeometry(18, 0.8), concMat);
    gotFloor.rotation.x = -Math.PI / 2;
    gotFloor.position.set(0, -0.6, 0.1);
    scene.add(gotFloor);

    const swMat = new THREE.MeshStandardMaterial({ color: 0x9ca3af, roughness: 0.8 });
    const sidewalk = new THREE.Mesh(new THREE.BoxGeometry(18, 0.5, 0.4), swMat);
    sidewalk.position.set(0, -0.25, -0.5);
    sidewalk.receiveShadow = true;
    sidewalk.castShadow = true;
    scene.add(sidewalk);

    const lampMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.5, roughness: 0.3 });
    const lightMat = new THREE.MeshStandardMaterial({ color: 0xffffaa, emissive: 0xffdd88, emissiveIntensity: 0.3 });
    [-6, -3, 0, 3, 6].forEach((x) => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 1.2, 6), lampMat);
      pole.position.set(x, 0.6, 3.8);
      pole.castShadow = true;
      scene.add(pole);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 0.2), lampMat);
      arm.position.set(x, 1.2, 3.7);
      scene.add(arm);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), lightMat);
      bulb.position.set(x, 1.18, 3.6);
      scene.add(bulb);
    });

    const waterTex = makeWaterTexture();
    const waterMat = new THREE.MeshStandardMaterial({
      map: waterTex, color: 0x3b82f6, transparent: true, opacity: 0.7,
      roughness: 0.2, metalness: 0.05,
    });
    const water = new THREE.Mesh(new THREE.BoxGeometry(20, 0.5, 8), waterMat);
    water.position.set(0, -0.55, 0);
    scene.add(water);
    waterRef.current = water;

    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c3a1e, roughness: 0.9 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x2d7d2d, roughness: 0.8 });
    [-5, -2, 2, 5].forEach((x) => {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.1, 1.5, 6), trunkMat);
      trunk.position.set(x, 0.25, -2.2);
      trunk.castShadow = true;
      scene.add(trunk);
      const crown = new THREE.Mesh(new THREE.SphereGeometry(0.6, 6, 6), leafMat);
      crown.position.set(x, 1.1, -2.2);
      crown.castShadow = true;
      scene.add(crown);
    });

    const makeHouse = (x: number, z: number, color: number) => {
      const g = new THREE.Group();
      const wM = new THREE.MeshStandardMaterial({ color, roughness: 0.7 });
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.9, 1.2), wM);
      body.position.y = 0.45;
      body.castShadow = true;
      body.receiveShadow = true;
      g.add(body);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(0.9, 0.5, 4), new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.5 }));
      roof.rotation.y = Math.PI / 4;
      roof.position.y = 0.95;
      roof.castShadow = true;
      g.add(roof);
      const doorM = new THREE.MeshStandardMaterial({ color: 0x5c3a1e });
      const door = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.35), doorM);
      door.position.set(0, 0.3, 0.61);
      g.add(door);
      const winM = new THREE.MeshBasicMaterial({ color: 0x87ceeb });
      [-0.35, 0.35].forEach((ox) => {
        const win = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.2), winM);
        win.position.set(ox, 0.45, 0.61);
        g.add(win);
      });
      g.position.set(x, 0, z);
      return g;
    };
    scene.add(makeHouse(-4, -1.2, 0xfef08a));
    scene.add(makeHouse(-1.5, -1.2, 0xfca5a5));
    scene.add(makeHouse(1.5, -1.2, 0xbbf7d0));
    scene.add(makeHouse(4, -1.2, 0xbfdbfe));

    const trashItems: THREE.Mesh[] = [];
    const trashPos = [{ x: -0.6, z: 0.1 }, { x: -0.2, z: 0.1 }, { x: 0.2, z: 0.1 }, { x: 0.6, z: 0.1 }];
    const bottleMat = new THREE.MeshPhysicalMaterial({ color: 0x60a5fa, transparent: true, opacity: 0.6, roughness: 0.1, emissive: 0x60a5fa, emissiveIntensity: 0.15 });
    const plasticMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.6, emissive: 0xef4444, emissiveIntensity: 0.2 });
    const canMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness: 0.7, roughness: 0.3, emissive: 0xff6666, emissiveIntensity: 0.1 });
    trashPos.forEach((pos, i) => {
      let mesh: THREE.Mesh;
      switch (i % 3) {
        case 0:
          mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.08, 0.35, 8), bottleMat);
          mesh.position.set(pos.x, -0.12, pos.z);
          mesh.rotation.z = 0.15;
          break;
        case 1:
          mesh = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), plasticMat);
          mesh.position.set(pos.x, -0.15, pos.z);
          mesh.scale.set(1, 0.5, 0.7);
          break;
        default:
          mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.25, 8), canMat);
          mesh.position.set(pos.x, -0.14, pos.z);
          mesh.rotation.x = 0.3;
      }
      mesh.userData = { id: i, isTrash: true };
      mesh.castShadow = true;
      scene.add(mesh);
      trashItems.push(mesh);
    });
    trashRef.current = trashItems;

    const ambient = new THREE.AmbientLight(0x8899aa, 0.4);
    scene.add(ambient);
    scene.add(new THREE.HemisphereLight(0x87ceeb, 0x3a6b35, 0.5));
    const dir = new THREE.DirectionalLight(0xccddff, 0.6);
    dir.position.set(5, 8, 3);
    dir.castShadow = true;
    scene.add(dir);
    const flash = new THREE.SpotLight(0xffeedd, 0.6, 10, Math.PI / 5, 0.5, 2);
    flash.position.copy(cam.position);
    flash.target.position.set(0, 0.2, 0);
    flash.castShadow = true;
    scene.add(flash);
    scene.add(flash.target);

    let lastMX = 0, lastMY = 0, hasLast = false;

    const onMouseMove = (e: MouseEvent) => {
      if (!document.pointerLockElement) { lastMX = e.clientX; lastMY = e.clientY; hasLast = true; return; }
      if (e.movementX !== 0 || e.movementY !== 0) {
        yawRef.current -= e.movementX * 0.003;
        pitchRef.current -= e.movementY * 0.003;
      } else if (hasLast) {
        yawRef.current -= (e.clientX - lastMX) * 0.01;
        pitchRef.current -= (e.clientY - lastMY) * 0.01;
        lastMX = e.clientX; lastMY = e.clientY;
      }
      pitchRef.current = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, pitchRef.current));
    };
    document.addEventListener("mousemove", onMouseMove);

    const onLockChange = () => {
      setIsLocked(!!document.pointerLockElement);
      if (document.pointerLockElement) hasLast = false;
    };
    document.addEventListener("pointerlockchange", onLockChange);

    const onPointerDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      if (!document.pointerLockElement) {
        if (e.target === renderer.domElement || containerRef.current?.contains(e.target as Node)) {
          document.body.requestPointerLock();
        }
        return;
      }
      if (gameStatusRef.current !== "playing") return;
      const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion);
      const active = trashRef.current.filter((t) => t.parent !== null);
      let best: THREE.Mesh | null = null;
      let bestAngle = 0.3;
      active.forEach((t) => {
        const dir = new THREE.Vector3().copy(t.position).sub(cam.position).normalize();
        const angle = fwd.angleTo(dir);
        if (angle < bestAngle) { bestAngle = angle; best = t; }
      });
      if (best) {
        scene.remove(best);
        const remaining = trashRef.current.filter((t) => t.parent !== null).length;
        trashLeftRef.current = remaining;
        setTrashLeft(remaining);
        if (remaining === 0) setGameStatus("success");
      }
    };
    document.addEventListener("mousedown", onPointerDown);

    let running = true;
    let lastTime = performance.now() / 1000;

    const animate = () => {
      if (!running) return;
      requestAnimationFrame(animate);
      try {
        const now = performance.now() / 1000;
        const dt = Math.min(now - lastTime, 0.05);
        lastTime = now;
        const elapsed = now;

        const euler = new THREE.Euler(pitchRef.current, yawRef.current, 0, "YXZ");
        const baseQuat = new THREE.Quaternion().setFromEuler(euler);
        cam.position.set(0, 1.4, 2.0);
        cam.quaternion.copy(baseQuat);

        flash.position.copy(cam.position);
        const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion);
        flash.target.position.copy(cam.position).add(fwd);
        flash.target.updateMatrixWorld();

        trashRef.current.forEach((t) => {
          if (t.parent) {
            t.rotation.y += 0.01;
            t.position.y = -0.14 + Math.sin(elapsed * 1.5 + t.position.x) * 0.03;
          }
        });

        if (gameStatusRef.current === "flood") {
          if (waterLevRef.current < 1.2) waterLevRef.current += 0.025;
          water.position.y = waterLevRef.current;
        } else if (gameStatusRef.current === "success") {
          if (waterLevRef.current > -0.55) waterLevRef.current -= 0.05;
          water.position.y = waterLevRef.current;
        }

        if (waterRef.current) {
          const wt = waterRef.current.material as THREE.MeshStandardMaterial;
          if (wt.map) wt.map!.offset.x += dt * 0.02;
        }

        renderer.render(scene, cam);
      } catch (err) { console.error("FloodSim error:", err); }
    };
    animate();

    return () => {
      running = false;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("pointerlockchange", onLockChange);
      document.removeEventListener("mousedown", onPointerDown);
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
      if (document.pointerLockElement) document.exitPointerLock();
      renderer.dispose();
    };
  }, []);

  // Timer countdown
  useEffect(() => {
    if (gameStatus !== "playing") return;
    timerRef.current = 30;
    setTimer(30);

    const interval = setInterval(() => {
      timerRef.current -= 1;
      setTimer(timerRef.current);

      if (timerRef.current <= 0) {
        clearInterval(interval);
        if (trashLeftRef.current > 0) {
          const bpOk = grade === 6 && bioporiRef.current && trashLeftRef.current <= 1;
          if (bpOk) {
            setGameStatus("success");
          } else {
            setGameStatus("flood");
          }
        } else {
          setGameStatus("success");
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [gameStatus, grade]);

  // Result feedback
  useEffect(() => {
    if (gameStatus !== "success" && gameStatus !== "flood") return;
    const remaining = trashLeft;
    const ok = gameStatus === "success";
    let txt = "";
    if (gameStatus === "success") {
      txt = remaining === 0
        ? grade === 5
          ? "PAHLAWAN BANJIR! 🌟 Kamu berhasil membersihkan semua sampah dari got tepat waktu! Air mengalir lancar dan kota selamat dari banjir!"
          : "MITIGASI SUKSES! 🎯 Seluruh sampah dibersihkan, drainase berfungsi optimal. Kapasitas infrastruktur pengendali banjir tercapai!"
        : grade === 6
          ? "MITIGASI SUKSES (Biopori)! 🌿 Meski ada sisa sampah, lubang biopori membantu menyerap air sehingga kota tetap aman."
          : "Berhasil!";
    } else {
      txt = grade === 5
        ? "BANJIR MELANDA! ⛆ Waktu habis! Sampah masih menyumbat got. Air meluap ke permukiman warga. Lain kali lebih cepat ya!"
        : "BANJIR MELANDA! ⚠️ Waktu habis sebelum drainase terbebas dari bottleneck. Tingkatkan kapasitas dan kecepatan tanggap darurat!";
    }
    setFeedback(txt);
    onDecisionResult(ok, txt);
  }, [gameStatus]);

  const [feedback, setFeedback] = useState("");

  const startGame = () => {
    setTimer(30);
    setGameStatus("playing");
    waterLevRef.current = -0.55;
    if (!document.pointerLockElement) document.body.requestPointerLock();
  };

  const resetGame = () => {
    setTrashLeft(4);
    trashLeftRef.current = 4;
    setGameStatus("idle");
    setTimer(30);
    setFeedback("");
    waterLevRef.current = -0.55;
  };

  const timerPercent = timer / 30 * 100;
  const timerColor = timer > 15 ? "bg-emerald-500" : timer > 7 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="flex flex-col gap-4">
      {grade === 5 ? (
        <div className="bg-gradient-to-r from-emerald-900/40 to-blue-900/30 p-5 rounded-2xl border border-emerald-800/40 space-y-2">
          <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black tracking-widest uppercase py-1 px-3 rounded-full border border-emerald-500/30">MATERI KELAS 5: MENJAGA KEBERSIHAN GOT & DETEKSI BANJIR</span>
          <h4 className="text-sm font-extrabold text-white">Buang Sampah Pada Tempatnya Menjauhkan Kita dari Banjir 🗑️</h4>
          <p className="text-xs text-slate-300 leading-relaxed">Sampah di got menghalangi aliran air. Saat hujan deras, air meluap dan banjir! Tugasmu: bersihkan semua sampah dari got sebelum waktu habis!</p>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-emerald-950 to-indigo-950 p-5 rounded-2xl border border-emerald-800/40 space-y-3">
          <div className="flex justify-between items-start flex-wrap gap-2">
            <div className="space-y-1">
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black tracking-widest uppercase py-1 px-3 rounded-full border border-emerald-500/30">MATERI KELAS 6: MANAJEMEN DAS & INFILTRASI BIOPORI</span>
              <h4 className="text-sm font-extrabold text-white">Prinsip Infiltrasi Mikro & Sumur Resapan Buatan</h4>
              <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">Banjir terjadi saat presipitasi melebihi kapasitas drainase. Dengan biopori, tanah menyerap lebih banyak air, memberi toleransi jika masih ada sisa sampah kecil.</p>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-xl border border-emerald-500/30 flex flex-col items-center gap-1 w-full sm:w-auto text-center">
              <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest font-mono">DAERAH RESAPAN AKTIF</span>
              <button onClick={() => setHasBiopori(!hasBiopori)} disabled={gameStatus === "playing"} className={`w-full text-xs font-bold py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${hasBiopori ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20" : "bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-300 border border-emerald-800"} ${gameStatus === "playing" ? "opacity-50 cursor-not-allowed" : ""}`}>
                <Trees className="w-3.5 h-3.5" />
                {hasBiopori ? "🌳 Biopori Aktif!" : "Tanam Lubang Biopori"}
              </button>
              <span className="text-[9px] text-slate-500">{hasBiopori ? "Toleransi 1 sampah tersisa" : "Hanya mengandalkan got semen"}</span>
            </div>
          </div>
          <div className="text-[11px] bg-slate-900/70 p-2.5 rounded-lg border border-slate-800/80 text-emerald-300/90 leading-relaxed">
            🌿 <strong className="text-white">Biopori Aktif:</strong> Jika kamu mengaktifkan Biopori MISI, toleransi meningkat: kamu tetap menang meskipun masih tersisa 1 sampah saat waktu habis!
          </div>
        </div>
      )}

      <div className="relative w-full h-[min(400px,calc(100vh-12rem))] rounded-3xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-950 cursor-crosshair select-none">
        <div ref={containerRef} className="w-full h-full" />

        {!isLocked && (
          <div className="absolute top-4 left-4 bg-slate-900/80 text-slate-300 text-[9px] font-bold px-3 py-1.5 rounded-full border border-slate-700 flex items-center gap-1.5 pointer-events-none select-none">🖱️ Klik area 3D untuk lihat-lihat</div>
        )}

        {isLocked && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none">
            <div className="w-0.5 h-5 bg-white/40 rounded-full absolute left-1/2 -translate-x-1/2 -top-2.5" />
            <div className="w-5 h-0.5 bg-white/40 rounded-full absolute top-1/2 -translate-y-1/2 -left-2.5" />
          </div>
        )}

        {gameStatus === "playing" && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 pointer-events-none">
            <div className="flex items-center gap-2 bg-slate-950/90 px-4 py-2 rounded-2xl border border-slate-700 shadow-xl">
              <Timer className={`w-4 h-4 ${timer <= 7 ? "text-red-400 animate-pulse" : "text-slate-300"}`} />
              <span className={`font-mono font-black text-xl ${timer <= 7 ? "text-red-400 animate-pulse" : "text-white"}`}>
                {timer}
              </span>
              <span className="text-slate-400 text-xs font-bold">detik</span>
            </div>
            <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
              <div className={`h-full rounded-full transition-all duration-700 ${timerColor}`} style={{ width: `${timerPercent}%` }} />
            </div>
          </div>
        )}

        <div className={`absolute top-4 right-4 flex flex-col gap-1.5 ${gameStatus === "idle" ? "pointer-events-none" : "pointer-events-none"}`}>
          {gameStatus === "playing" && (
            <>
              <div className={`font-extrabold border text-[9px] uppercase font-mono py-1.5 px-3 rounded-full flex items-center gap-1 shadow-lg ${trashLeft === 0 ? "bg-emerald-950/90 text-emerald-400 border-emerald-500/40" : "bg-rose-950/90 text-red-400 border-rose-500/40"}`}>
                {trashLeft === 0 ? <CheckCircle2 className="w-3.5 h-3.5" /> : "🗑️"} {trashLeft === 0 ? "Selesai!" : `${trashLeft} Sampah Tersisa`}
              </div>
              {grade === 6 && hasBiopori && (
                <div className="bg-emerald-950/90 text-emerald-300 font-bold border border-emerald-500/40 text-[9px] uppercase font-mono py-1 px-3 rounded-full text-center">🌿 Biopori On</div>
              )}
            </>
          )}
        </div>

        {gameStatus === "idle" && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-500/20 border border-blue-500 flex items-center justify-center animate-pulse">
              <Droplets className="w-8 h-8 text-blue-500" />
            </div>
            <h4 className="text-xl font-black text-white tracking-tight uppercase">MISI SIAGA BANJIR</h4>
            <p className="text-xs text-slate-300 max-w-md leading-relaxed">
              {grade === 5
                ? "Bersihkan 4 sampah dari got sebelum hujan turun deras! Kamu punya waktu 30 detik. Cepat, arahkan crosshair dan klik sampah!"
                : "Audit sistem drainase perkotaan. Bebaskan saluran air dari sampah penyumbat dalam batas waktu 30 detik. Gunakan crosshair untuk menembak target."}
            </p>
            <button onClick={startGame} className="bg-blue-600 hover:bg-blue-500 text-white font-extrabold py-3 px-10 rounded-xl shadow-lg shadow-blue-600/30 text-xs uppercase tracking-widest transition-all hover:scale-105 flex items-center gap-2 cursor-pointer">
              <Play className="w-4 h-4 fill-white" /> MULAI MISI!
            </button>
          </div>
        )}

        {gameStatus === "flood" && (
          <div className="absolute inset-0 bg-red-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 gap-4 animate-pulse">
            <div className="text-6xl">⛆</div>
            <h4 className="text-2xl font-black text-red-400 tracking-tight uppercase">BANJIR MELANDA!</h4>
            <p className="text-xs text-slate-300 max-w-md leading-relaxed">{feedback}</p>
            <button onClick={resetGame} className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-slate-500 text-xs py-2.5 px-8 rounded-lg font-bold uppercase tracking-wider transition flex items-center gap-2 cursor-pointer">
              <RotateCcw className="w-3.5 h-3.5" /> Coba Lagi
            </button>
          </div>
        )}

        {gameStatus === "success" && (
          <div className="absolute inset-0 bg-emerald-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 gap-4">
            <div className="text-6xl animate-bounce">🌊✅</div>
            <h4 className="text-2xl font-black text-emerald-400 tracking-tight uppercase">KOTA SELAMAT!</h4>
            <p className="text-xs text-slate-300 max-w-md leading-relaxed">{feedback}</p>
            <button onClick={resetGame} className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-slate-500 text-xs py-2.5 px-8 rounded-lg font-bold uppercase tracking-wider transition flex items-center gap-2 cursor-pointer">
              <RotateCcw className="w-3.5 h-3.5" /> Main Lagi
            </button>
          </div>
        )}
      </div>

      <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-850 text-xs text-slate-400">
        <Info className="w-4 h-4 text-blue-500 inline mr-2" />
        {grade === 5
          ? "Arahkan crosshair ke sampah merah di got, lalu klik untuk membersihkan! Kerja cepat sebelum waktu habis ⏱️"
          : "Kombinasikan pembersihan drainase dengan teknologi biopori untuk hasil mitigasi maksimal. Evaluasi efisiensi waktu vs kapasitas!"}
      </div>
    </div>
  );
}
