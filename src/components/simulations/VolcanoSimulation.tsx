import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Play, RotateCcw, Info, Compass, Flag, AlertOctagon, Trees } from "lucide-react";

interface Props {
  grade?: number;
  onDecisionResult: (secured: boolean, feedbackText: string) => void;
}

const SHELTER_Z = 2.5;
const PLAYER_START_Z = -5;
const BOUNDARY_X = 1.5;
const BOUNDARY_Z_MAX = 3;
const MOVE_SPEED = 3.5;

export default function VolcanoSimulation({ grade = 5, onDecisionResult }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [gameStatus, setGameStatus] = useState<"idle" | "playing" | "success">("idle");
  const [distance, setDistance] = useState(7.5);
  const [isLocked, setIsLocked] = useState(false);
  const [hasEws, setHasEws] = useState(false);

  const playerPosRef = useRef(new THREE.Vector3(0, 0, PLAYER_START_Z));
  const keysRef = useRef({ w: false, a: false, s: false, d: false });
  const yawRef = useRef(Math.PI);
  const pitchRef = useRef(-0.1);
  const gameStatusRef = useRef(gameStatus);
  const hasEwsRef = useRef(false);
  const distanceRef = useRef(7.5);
  const lastDistRenderRef = useRef(7.5);

  useEffect(() => { gameStatusRef.current = gameStatus; }, [gameStatus]);
  useEffect(() => { hasEwsRef.current = hasEws; }, [hasEws]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const w = el.clientWidth;
    const h = el.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1c1917);
    scene.fog = new THREE.Fog(0x1c1917, 12, 22);

    const cam = new THREE.PerspectiveCamera(70, w / h, 0.1, 30);
    cam.position.set(0, 1.6, PLAYER_START_Z);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.9;
    el.appendChild(renderer.domElement);

    // ── Ground ──
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x3c3530, roughness: 0.95 });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(22, 20), groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, -0.1, -1);
    ground.receiveShadow = true;
    scene.add(ground);

    // ── Path ──
    const pathMat = new THREE.MeshStandardMaterial({ color: 0x5c5348, roughness: 0.9 });
    const path = new THREE.Mesh(new THREE.PlaneGeometry(3, 10), pathMat);
    path.rotation.x = -Math.PI / 2;
    path.position.set(0, -0.08, -1);
    path.receiveShadow = true;
    scene.add(path);

    // Path edge lines
    const edgeMat = new THREE.MeshBasicMaterial({ color: 0x8a7a6a });
    [-1.5, 1.5].forEach((x) => {
      const line = new THREE.Mesh(new THREE.PlaneGeometry(0.04, 10), edgeMat);
      line.rotation.x = -Math.PI / 2;
      line.position.set(x, -0.07, -1);
      scene.add(line);
    });

    // ── Path barrier posts ──
    const postMat = new THREE.MeshStandardMaterial({ color: 0x8a4513, roughness: 0.8 });
    for (let z = -4; z <= 2; z += 1.5) {
      [-1.8, 1.8].forEach((x) => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.3, 6), postMat);
        post.position.set(x, 0.05, z);
        post.castShadow = true;
        scene.add(post);
      });
    }

    // ── Volcano ──
    const mountMat = new THREE.MeshStandardMaterial({ color: 0x292524, roughness: 0.9 });
    const mount = new THREE.Mesh(new THREE.ConeGeometry(3, 4, 16), mountMat);
    mount.position.set(0, 1.9, -8);
    mount.castShadow = true;
    mount.receiveShadow = true;
    scene.add(mount);

    // Crater glow
    const craterMat = new THREE.MeshBasicMaterial({ color: 0xea580c });
    const crater = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.15, 12), craterMat);
    crater.position.set(0, 3.95, -8);
    scene.add(crater);

    const craterLight = new THREE.PointLight(0xff4400, 2, 12);
    craterLight.position.set(0, 4, -8);
    scene.add(craterLight);

    // ── Shelter (Posko) ──
    const shelterGroup = new THREE.Group();
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.7 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 1.2), wallMat);
    body.position.y = 0.4;
    body.castShadow = true;
    body.receiveShadow = true;
    shelterGroup.add(body);

    const roofMat = new THREE.MeshStandardMaterial({ color: 0x064e3b, roughness: 0.5 });
    const roof = new THREE.Mesh(new THREE.ConeGeometry(0.9, 0.5, 4), roofMat);
    roof.rotation.y = Math.PI / 4;
    roof.position.y = 0.85;
    roof.castShadow = true;
    shelterGroup.add(roof);

    // Flag
    const poleMat = new THREE.MeshBasicMaterial({ color: 0x888888 });
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.7, 4), poleMat);
    pole.position.set(0.7, 0.75, 0);
    shelterGroup.add(pole);
    const flagMat = new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide });
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.12), flagMat);
    flag.position.set(0.82, 1.05, 0);
    shelterGroup.add(flag);

    shelterGroup.position.set(0, 0, SHELTER_Z);
    scene.add(shelterGroup);

    // Shelter glow marker
    const shelterLight = new THREE.PointLight(0x22c55e, 0.8, 4);
    shelterLight.position.set(0, 1.5, SHELTER_Z);
    scene.add(shelterLight);

    // ── 3D Arrow indicator ──
    const arrowGroup = new THREE.Group();
    const arrowMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
    const arrowHead = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.4, 6), arrowMat);
    arrowHead.position.z = 0.3;
    arrowGroup.add(arrowHead);
    const arrowMat2 = new THREE.MeshBasicMaterial({ color: 0x16a34a });
    const arrowShaft = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.35), arrowMat2);
    arrowShaft.position.z = -0.05;
    arrowGroup.add(arrowShaft);
    arrowGroup.position.set(0, 2, PLAYER_START_Z + 1.5);
    scene.add(arrowGroup);

    // ── Trees around path ──
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c3a1e, roughness: 0.9 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x2d5a1e, roughness: 0.8 });
    const treePositions = [
      { x: -2.2, z: -2 }, { x: 2.2, z: -2 },
      { x: -2.2, z: 1 }, { x: 2.2, z: 1 },
    ];
    treePositions.forEach((p) => {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.8, 6), trunkMat);
      trunk.position.set(p.x, 0.3, p.z);
      trunk.castShadow = true;
      scene.add(trunk);
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.35, 6, 6), leafMat);
      leaf.position.set(p.x, 0.8, p.z);
      leaf.castShadow = true;
      scene.add(leaf);
    });

    // ── Eruption particles ──
    const lavaMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const lavaMat2 = new THREE.MeshBasicMaterial({ color: 0xff8800 });
    const ashMat = new THREE.MeshBasicMaterial({ color: 0x9ca3af, transparent: true, opacity: 0.6 });
    const sparkMat = new THREE.MeshBasicMaterial({ color: 0xffdd44 });

    // Lava plume (upward)
    const lavas: THREE.Mesh[] = [];
    for (let i = 0; i < 25; i++) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.08 + Math.random() * 0.1, 6, 6), i % 3 === 0 ? lavaMat2 : lavaMat);
      m.position.set((Math.random() - 0.5) * 1.5, 3.5 + Math.random() * 1, -8 + (Math.random() - 0.5) * 0.5);
      scene.add(m);
      lavas.push(m);
    }

    // Ash cloud (falling/spreading)
    const ashes: THREE.Mesh[] = [];
    for (let i = 0; i < 30; i++) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.12 + Math.random() * 0.15, 6, 6), ashMat);
      m.position.set((Math.random() - 0.5) * 6, 2 + Math.random() * 3, -8 + (Math.random() - 0.5) * 4);
      scene.add(m);
      ashes.push(m);
    }

    // Sparks (random directions)
    const sparks: THREE.Mesh[] = [];
    for (let i = 0; i < 15; i++) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.04 + Math.random() * 0.03, 4, 4), sparkMat);
      m.position.set(0, 4, -8);
      m.userData = {
        vx: (Math.random() - 0.5) * 0.08,
        vy: 0.03 + Math.random() * 0.08,
        vz: -0.02 - Math.random() * 0.06,
      };
      scene.add(m);
      sparks.push(m);
    }

    // ── Lighting ──
    const ambient = new THREE.AmbientLight(0x888899, 0.3);
    scene.add(ambient);
    scene.add(new THREE.HemisphereLight(0xff8844, 0x222222, 0.3));
    const dir = new THREE.DirectionalLight(0xffaa66, 0.4);
    dir.position.set(3, 5, -5);
    dir.castShadow = true;
    scene.add(dir);

    const flash = new THREE.SpotLight(0xffeedd, 0.3, 8, Math.PI / 4, 0.5, 2);
    flash.target.position.set(0, 0, SHELTER_Z - 1);
    scene.add(flash);
    scene.add(flash.target);

    // ── Keyboard ──
    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === "w" || key === "a" || key === "s" || key === "d") {
        keysRef.current[key as "w" | "a" | "s" | "d"] = true;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === "w" || key === "a" || key === "s" || key === "d") {
        keysRef.current[key as "w" | "a" | "s" | "d"] = false;
      }
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);

    // ── Mouse ──
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
      pitchRef.current = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, pitchRef.current));
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
    };
    document.addEventListener("mousedown", onPointerDown);

    // ── Animation loop ──
    let running = true;
    let lastTime = performance.now() / 1000;
    let shakeTime = 0;

    const animate = () => {
      if (!running) return;
      requestAnimationFrame(animate);
      try {
        const now = performance.now() / 1000;
        const dt = Math.min(now - lastTime, 0.05);
        lastTime = now;
        const elapsed = now;

        // Player movement
        const pos = playerPosRef.current;
        if (gameStatusRef.current === "playing") {
          const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion);
          fwd.y = 0;
          fwd.normalize();
          const right = new THREE.Vector3(1, 0, 0).applyQuaternion(cam.quaternion);
          right.y = 0;
          right.normalize();

          const speedMul = hasEwsRef.current ? 1.2 : 1.0;
          if (keysRef.current.w) pos.add(fwd.clone().multiplyScalar(MOVE_SPEED * speedMul * dt));
          if (keysRef.current.s) pos.add(fwd.clone().multiplyScalar(-MOVE_SPEED * 0.6 * speedMul * dt));
          if (keysRef.current.a) pos.add(right.clone().multiplyScalar(-MOVE_SPEED * 0.5 * speedMul * dt));
          if (keysRef.current.d) pos.add(right.clone().multiplyScalar(MOVE_SPEED * 0.5 * speedMul * dt));

          // Boundaries
          pos.x = Math.max(-BOUNDARY_X, Math.min(BOUNDARY_X, pos.x));
          pos.z = Math.max(PLAYER_START_Z, Math.min(BOUNDARY_Z_MAX, pos.z));

          // Distance update
          const dist = pos.distanceTo(new THREE.Vector3(0, 0, SHELTER_Z));
          distanceRef.current = dist;
          if (Math.abs(dist - lastDistRenderRef.current) > 0.1) {
            lastDistRenderRef.current = dist;
            setDistance(dist);
          }

          // Success check
          if (dist < 1.5 && gameStatusRef.current === "playing") {
            setGameStatus("success");
            const txt = grade === 5
              ? "EVAKUASI BERHASIL! 🏃 Kamu berhasil lari ke Posko Pengungsian tepat waktu! Selamat dari bahaya gunung berapi!"
              : "EVAKUASI SUKSES! 📡 Respon darurat optimal. Zona aman tercapai dengan koordinasi tanggap bencana yang baik.";
            const ok = true;
            setDistance(0);
            onDecisionResult(ok, txt);
          }
        }

        // Camera position
        const eyeHeight = gameStatusRef.current === "playing" ? 1.6 : 1.6;
        cam.position.set(pos.x, pos.y + eyeHeight, pos.z);

        const euler = new THREE.Euler(pitchRef.current, yawRef.current, 0, "YXZ");
        cam.quaternion.setFromEuler(euler);

        // Screen shake during eruption
        if (gameStatusRef.current === "playing") {
          shakeTime += dt;
          const sIntensity = 0.025;
          const sx = Math.sin(shakeTime * 37) * sIntensity + Math.sin(shakeTime * 53) * 0.5 * sIntensity;
          const sy = Math.sin(shakeTime * 41) * sIntensity + Math.sin(shakeTime * 59) * 0.5 * sIntensity;
          cam.position.x += sx;
          cam.position.y += sy;
        } else {
          shakeTime = 0;
        }

        // Flashlight follows camera
        flash.position.copy(cam.position);
        const fDir = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion);
        flash.target.position.copy(cam.position).add(fDir);
        flash.target.updateMatrixWorld();

        // Crater light pulse
        const pulse = 1.5 + Math.sin(elapsed * 4) * 0.8;
        craterLight.intensity = gameStatusRef.current === "playing" ? pulse : 1;
        craterLight.color.setHSL(0.07, 1, 0.5 + Math.sin(elapsed * 3) * 0.1);

        // ── Eruption particles ──
        if (gameStatusRef.current === "playing") {
          // Lava plume
          lavas.forEach((lv, i) => {
            lv.position.y += 0.05 + Math.random() * 0.02;
            lv.position.x += Math.sin(elapsed * 2 + i * 0.7) * 0.005;
            lv.position.z += Math.cos(elapsed * 1.5 + i * 0.5) * 0.003;
            if (lv.position.y > 5.5) {
              lv.position.set((Math.random() - 0.5) * 1.5, 3.5, -8 + (Math.random() - 0.5) * 0.5);
            }
          });

          // Ash
          ashes.forEach((a, i) => {
            a.position.y -= 0.01 + Math.random() * 0.02;
            a.position.x += (Math.random() - 0.5) * 0.008;
            a.position.z += (Math.random() - 0.5) * 0.008;
            if (a.position.y < -0.5) {
              a.position.set((Math.random() - 0.5) * 6, 3 + Math.random() * 3, -8 + (Math.random() - 0.5) * 4);
            }
          });

          // Sparks
          sparks.forEach((s) => {
            s.position.x += s.userData.vx;
            s.position.y += s.userData.vy;
            s.position.z += s.userData.vz;
            s.userData.vy -= 0.002;
            s.position.x += Math.sin(elapsed * 10 + s.id) * 0.005;
            if (s.position.y < 0 || s.position.x > 4 || s.position.x < -4) {
              s.position.set((Math.random() - 0.5) * 1.5, 3.8 + Math.random() * 0.5, -8 + (Math.random() - 0.5) * 0.5);
              s.userData.vx = (Math.random() - 0.5) * 0.1;
              s.userData.vy = 0.04 + Math.random() * 0.08;
              s.userData.vz = -0.01 - Math.random() * 0.04;
            }
          });
        }

        // Arrow follows player
        const arrowZ = Math.min(pos.z + 1.5, SHELTER_Z - 0.5);
        arrowGroup.position.set(pos.x, 2.2 + Math.sin(elapsed * 2) * 0.15, arrowZ);
        arrowGroup.rotation.y = Math.PI;

        // Shelter light pulse (breathing)
        shelterLight.intensity = 0.5 + Math.sin(elapsed * 1.5) * 0.3;

        renderer.render(scene, cam);
      } catch (err) { console.error("VolcanoSim error:", err); }
    };
    animate();

    return () => {
      running = false;
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("pointerlockchange", onLockChange);
      document.removeEventListener("mousedown", onPointerDown);
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
      if (document.pointerLockElement) document.exitPointerLock();
      renderer.dispose();
    };
  }, []);

  const startGame = () => {
    setGameStatus("playing");
    document.body.requestPointerLock();
  };

  const resetGame = () => {
    playerPosRef.current.set(0, 0, PLAYER_START_Z);
    distanceRef.current = 7.5;
    lastDistRenderRef.current = 7.5;
    setDistance(7.5);
    yawRef.current = Math.PI;
    pitchRef.current = -0.1;
    setGameStatus("idle");
  };

  const dist = distance;

  return (
    <div className="flex flex-col gap-4">
      {grade === 5 ? (
        <div className="bg-gradient-to-r from-amber-900/40 to-orange-900/30 p-5 rounded-2xl border border-amber-800/40 space-y-2">
          <span className="bg-amber-500/20 text-amber-300 text-[10px] font-black tracking-widest uppercase py-1 px-3 rounded-full border border-amber-500/30">MATERI KELAS 5: EVAKUASI GUNUNG MELETUS</span>
          <h4 className="text-sm font-extrabold text-white">Lari Menuju Posko Pengungsian! 🌋</h4>
          <p className="text-xs text-slate-300 leading-relaxed">Gunung berapi meletus! Awan panas dan lava turun dari kawah. Tugasmu: tekan <kbd className="bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded text-[10px] font-mono">W</kbd> untuk berlari menuju Posko Pengungsian (tenda hijau). Ikuti tanda panah hijau!</p>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-stone-900 via-amber-950/40 to-slate-900 p-5 rounded-2xl border border-amber-850 space-y-3">
          <div className="flex justify-between items-start flex-wrap gap-2">
            <div className="space-y-1">
              <span className="bg-amber-500/20 text-amber-300 text-[10px] font-black tracking-widest uppercase py-1 px-3 rounded-full border border-amber-500/30">MATERI KELAS 6: EWS & ZONA KRB III</span>
              <h4 className="text-sm font-extrabold text-white">Evakuasi Terarah — Early Warning System</h4>
              <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">Kawasan Rawan Bencana (KRB) III adalah zona paling berbahaya. Sistem EWS memberikan peringatan dini sebelum erupsi. Aktifkan EWS untuk meningkatkan efektivitas evakuasi!</p>
            </div>
            <div className="bg-stone-950 p-2.5 rounded-xl border border-amber-500/30 flex flex-col items-center gap-1 w-full sm:w-auto text-center">
              <span className="text-[9px] font-bold text-amber-400 uppercase tracking-widest font-mono">EWS SIRENE</span>
              <button onClick={() => setHasEws(!hasEws)} disabled={gameStatus === "playing"} className={`w-full text-xs font-bold py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${hasEws ? "bg-amber-600 text-white shadow-md shadow-amber-600/20" : "bg-amber-950/40 hover:bg-amber-900/40 text-amber-300 border border-amber-800"} ${gameStatus === "playing" ? "opacity-50 cursor-not-allowed" : ""}`}>
                <AlertOctagon className="w-3.5 h-3.5" />
                {hasEws ? "📡 EWS Aktif!" : "Pasang EWS"}
              </button>
              <span className="text-[9px] text-slate-500">{hasEws ? "+20% kecepatan evakuasi" : "Evakuasi manual standar"}</span>
            </div>
          </div>
          <div className="text-[11px] bg-slate-950 p-2.5 rounded-lg border border-slate-850 text-amber-300/90 leading-relaxed">
            📡 <strong className="text-white">EWS:</strong> Jika aktif, kecepatan lari bertambah 20% (peringatan dini memberi waktu reaksi lebih panjang).
          </div>
        </div>
      )}

      <div className="relative w-full h-[400px] rounded-3xl overflow-hidden shadow-2xl border border-slate-800 bg-stone-950 cursor-crosshair select-none">
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
          <>
            {/* Distance HUD */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 pointer-events-none">
              <div className="flex items-center gap-2 bg-slate-950/90 px-4 py-2 rounded-2xl border border-slate-700 shadow-xl">
                <Flag className="w-4 h-4 text-emerald-400" />
                <span className="font-mono font-black text-lg text-white">
                  {Math.max(0, Math.round(dist * 10) / 10)}m
                </span>
                <span className="text-slate-400 text-xs font-bold">ke Posko</span>
              </div>
              <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
                <div className="h-full rounded-full transition-all duration-300 bg-emerald-500" style={{ width: `${Math.max(0, Math.min(100, (1 - dist / 7.5) * 100))}%` }} />
              </div>
            </div>

            {/* Compass arrow */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none">
              <div className="bg-slate-950/80 px-3 py-2 rounded-xl border border-slate-700 flex items-center gap-3 shadow-lg">
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <Compass className="w-4 h-4" />
                  <span className="text-[10px] font-bold font-mono">POSKO</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-mono">
                  <kbd className="bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded text-[9px] font-bold">W</kbd>
                  <span>Lari</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-mono">
                  <kbd className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded text-[9px] font-bold">A/D</kbd>
                  <span>Belok</span>
                </div>
              </div>
            </div>
          </>
        )}

        {gameStatus === "idle" && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 gap-4">
            <div className="w-16 h-16 rounded-full bg-orange-500/20 border border-orange-500 flex items-center justify-center animate-pulse">
              <span className="text-3xl">🌋</span>
            </div>
            <h4 className="text-xl font-black text-white tracking-tight uppercase">EVAKUASI GUNUNG BERAPI</h4>
            <p className="text-xs text-slate-300 max-w-md leading-relaxed">
              {grade === 5
                ? "Gunung Merapi meletus! Awan panas turun. Cepat lari ke Posko Pengungsian (tenda hijau). Gunakan W A S D untuk bergerak dan ikuti tanda panah hijau!"
                : "KRB III teraktivasi. Gunakan protokol evakuasi terarah: tekan W untuk maju menuju titik aman (shelter). Waktu reaksi terbatas — optimalkan jalur evakuasi!"}
            </p>
            <button onClick={startGame} className={`bg-amber-600 hover:bg-amber-500 text-white font-extrabold py-3 px-10 rounded-xl shadow-lg shadow-amber-600/30 text-xs uppercase tracking-widest transition-all hover:scale-105 flex items-center gap-2 cursor-pointer`}>
              <Play className="w-4 h-4 fill-white" /> MULAI EVAKUASI!
            </button>
          </div>
        )}

        {gameStatus === "success" && (
          <div className="absolute inset-0 bg-emerald-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 gap-4">
            <div className="text-6xl animate-bounce">🏃✅</div>
            <h4 className="text-2xl font-black text-emerald-400 tracking-tight uppercase">SELAMAT! {grade === 5 ? "Kamu Lolos!" : "Evakuasi Sukses!"}</h4>
            <p className="text-xs text-slate-300 max-w-md leading-relaxed">
              {grade === 5
                ? "Kamu berhasil lari ke Posko Pengungsian sebelum awan panas turun! Hebat! Ingat: saat gunung meletus, selalu lari menjauh dari kawah menuju posko terdekat."
                : "Respon evakuasi KRB III berhasil. Koordinasi jalur aman dan sistem EWS bekerja optimal."}
            </p>
            <button onClick={resetGame} className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-slate-500 text-xs py-2.5 px-8 rounded-lg font-bold uppercase tracking-wider transition flex items-center gap-2 cursor-pointer">
              <RotateCcw className="w-3.5 h-3.5" /> Main Lagi
            </button>
          </div>
        )}
      </div>

      <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-850 text-xs text-slate-400">
        <Info className="w-4 h-4 text-amber-500 inline mr-2" />
        {grade === 5
          ? "Gunakan W untuk lari maju, A/D untuk belok kiri/kanan. Ikuti panah hijau menuju tenda Posko Pengungsian!"
          : "Evakuasi terstruktur: tekanan W untuk akselerasi linier ke titik kumpul (zona aman). Navigasi crosshair + WASD."}
      </div>
    </div>
  );
}
