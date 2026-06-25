import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Play, RotateCcw, Info, Compass, Flag, AlertOctagon, Waves } from "lucide-react";
import TouchControls from "../TouchControls";

interface Props {
  grade?: number;
  onDecisionResult: (isCorrect: boolean, feedbackText: string) => void;
}

const SHELTER_Z = 8;
const PLAYER_START_Z = -4;
const BOUNDARY_X = 2;
const BOUNDARY_Z_MAX = 9;
const MOVE_SPEED = 3.5;
const TIMER_SECONDS = 20;

export default function TsunamiSimulation({ grade = 5, onDecisionResult }: Props) {
  const isMobile = typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [gameStatus, setGameStatus] = useState<"idle" | "playing" | "wave" | "ended">("idle");
  const [timer, setTimer] = useState(TIMER_SECONDS);
  const [distance, setDistance] = useState(12);
  const [isLocked, setIsLocked] = useState(false);
  const [outcome, setOutcome] = useState<"success" | "failed">("success");
  const [hasEws, setHasEws] = useState(false);

  const playerPosRef = useRef(new THREE.Vector3(0, 0, PLAYER_START_Z));
  const keysRef = useRef({ w: false, a: false, s: false, d: false });
  const yawRef = useRef(Math.PI);
  const pitchRef = useRef(-0.1);
  const gameStatusRef = useRef(gameStatus);
  const hasEwsRef = useRef(false);
  const timerRef = useRef(TIMER_SECONDS);
  const distanceRef = useRef(12);
  const lastDistRenderRef = useRef(12);
  const outcomeRef = useRef<"success" | "failed">("success");

  useEffect(() => { gameStatusRef.current = gameStatus; }, [gameStatus]);
  useEffect(() => { hasEwsRef.current = hasEws; }, [hasEws]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const w = el.clientWidth;
    const h = el.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0x87ceeb, 18, 30);

    const cam = new THREE.PerspectiveCamera(70, w / h, 0.1, 40);
    cam.position.set(0, 1.6, PLAYER_START_Z);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    el.appendChild(renderer.domElement);

    // ── Elevation helper ──
    const SLOPE_START = 0;
    const SLOPE_END = 5;
    const SLOPE_HEIGHT = 2.0;
    function getElevation(z: number): number {
      if (z <= SLOPE_START) return 0;
      if (z >= SLOPE_END) return SLOPE_HEIGHT;
      const t = (z - SLOPE_START) / (SLOPE_END - SLOPE_START);
      return t * t * SLOPE_HEIGHT;
    }

    // ── Beach (flat sand) ──
    const sandMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.9 });
    const beach = new THREE.Mesh(new THREE.PlaneGeometry(20, 4.5), sandMat);
    beach.rotation.x = -Math.PI / 2;
    beach.position.set(0, 0, -2.25);
    beach.receiveShadow = true;
    scene.add(beach);

    // ── Sloped terrain ──
    const slopeMat = new THREE.MeshStandardMaterial({ color: 0x4ade80, roughness: 0.85 });
    const slopeSegs = 30;
    const slopeGeo = new THREE.PlaneGeometry(6, SLOPE_END - SLOPE_START, slopeSegs, slopeSegs);
    slopeGeo.rotateX(-Math.PI / 2);
    const slopePos = slopeGeo.attributes.position;
    for (let i = 0; i < slopePos.count; i++) {
      const worldZ = slopePos.getZ(i) + SLOPE_START + (SLOPE_END - SLOPE_START) / 2;
      const t = Math.max(0, Math.min(1, (worldZ - SLOPE_START) / (SLOPE_END - SLOPE_START)));
      slopePos.setY(i, t * t * SLOPE_HEIGHT);
    }
    slopePos.needsUpdate = true;
    slopeGeo.computeVertexNormals();
    const slope = new THREE.Mesh(slopeGeo, slopeMat);
    slope.position.set(0, 0, (SLOPE_START + SLOPE_END) / 2);
    slope.receiveShadow = true;
    slope.castShadow = true;
    scene.add(slope);

    // Brown path strip on slope
    const pathMat = new THREE.MeshStandardMaterial({ color: 0xa38b6b, roughness: 0.9 });
    const pathStrip = new THREE.Mesh(new THREE.PlaneGeometry(0.6, SLOPE_END - SLOPE_START, 2, slopeSegs), pathMat);
    pathStrip.rotation.x = -Math.PI / 2;
    const pathPos = pathStrip.geometry.attributes.position;
    for (let i = 0; i < pathPos.count; i++) {
      const worldZ = pathPos.getZ(i) + SLOPE_START + (SLOPE_END - SLOPE_START) / 2;
      const t = Math.max(0, Math.min(1, (worldZ - SLOPE_START) / (SLOPE_END - SLOPE_START)));
      pathPos.setY(i, t * t * SLOPE_HEIGHT + 0.01);
    }
    pathPos.needsUpdate = true;
    pathStrip.geometry.computeVertexNormals();
    pathStrip.position.set(0, 0, (SLOPE_START + SLOPE_END) / 2);
    scene.add(pathStrip);

    // ── Plateau (hilltop flat, covers from slope end z=5 to beyond shelter) ──
    const plateauMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.8 });
    const plateau = new THREE.Mesh(new THREE.PlaneGeometry(6, 5), plateauMat);
    plateau.rotation.x = -Math.PI / 2;
    plateau.position.set(0, SLOPE_HEIGHT, SHELTER_Z - 0.5);
    plateau.receiveShadow = true;
    scene.add(plateau);

    // ── Ocean ──
    const oceanMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7, roughness: 0.2, metalness: 0.1,
    });
    const ocean = new THREE.Mesh(new THREE.BoxGeometry(22, 0.8, 6), oceanMat);
    ocean.position.set(0, -0.3, -8);
    scene.add(ocean);

    const hillBaseY = SLOPE_HEIGHT;
    // ── Hill (Bukit) ──
    const hillMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.8 });
    const hill = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 3.5, 1.2, 10), hillMat);
    hill.position.set(0, hillBaseY + 0.6, SHELTER_Z - 0.5);
    hill.castShadow = true;
    hill.receiveShadow = true;
    scene.add(hill);

    // Hill top flat
    const topMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.7 });
    const hillTop = new THREE.Mesh(new THREE.CircleGeometry(1.8, 10), topMat);
    hillTop.rotation.x = -Math.PI / 2;
    hillTop.position.set(0, hillBaseY + 1.2, SHELTER_Z - 0.5);
    scene.add(hillTop);

    // Hill ramp (side facing player)
    const rampMat = new THREE.MeshStandardMaterial({ color: 0x2d7d2d, roughness: 0.85 });
    const ramp = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.15, 1.0), rampMat);
    ramp.position.set(0, hillBaseY + 0.05, SHELTER_Z - 1.6);
    ramp.rotation.x = 0.15;
    scene.add(ramp);

    // ── Safe zone flag on hill ──
    const flagPoleMat = new THREE.MeshBasicMaterial({ color: 0x888888 });
    const flagPole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.8, 4), flagPoleMat);
    flagPole.position.set(0, hillBaseY + 1.6, SHELTER_Z - 0.5);
    scene.add(flagPole);

    const flagMat = new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide });
    const flagMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 0.15), flagMat);
    flagMesh.position.set(0.15, hillBaseY + 2.0, SHELTER_Z - 0.5);
    scene.add(flagMesh);

    const shelterLight = new THREE.PointLight(0x22c55e, 1.0, 5);
    shelterLight.position.set(0, hillBaseY + 2.3, SHELTER_Z - 0.5);
    scene.add(shelterLight);

    // ── 3D Arrow ──
    const arrowGroup = new THREE.Group();
    const arrowMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
    const arrowHead = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.4, 6), arrowMat);
    arrowHead.position.z = 0.3;
    arrowGroup.add(arrowHead);
    const arrowShaftMat = new THREE.MeshBasicMaterial({ color: 0x16a34a });
    const arrowShaft = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.35), arrowShaftMat);
    arrowShaft.position.z = -0.05;
    arrowGroup.add(arrowShaft);
    arrowGroup.position.set(0, 2, PLAYER_START_Z + 1.5);
    scene.add(arrowGroup);

    // ── Palm trees ──
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6 });
    const addPalm = (x: number, z: number) => {
      const elev = getElevation(z);
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.15, 1.5, 6), trunkMat);
      trunk.position.set(x, 0.65 + elev, z);
      trunk.castShadow = true;
      scene.add(trunk);
      for (let i = 0; i < 5; i++) {
        const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.8, 4), leafMat);
        leaf.position.set(x + 0.1, 1.5 + elev, z);
        leaf.rotation.x = 1.0;
        leaf.rotation.y = (i * Math.PI * 2) / 5;
        scene.add(leaf);
      }
    };
    addPalm(-3, -5);
    addPalm(3.5, -4);
    addPalm(-4, -2);
    addPalm(3, -1);

    // ── Boundary posts ──
    const postMat = new THREE.MeshStandardMaterial({ color: 0x8a4513, roughness: 0.8 });
    for (let z = -3; z <= 7; z += 1.5) {
      [-2.3, 2.3].forEach((x) => {
        const elev = getElevation(z);
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.4, 6), postMat);
        post.position.set(x, 0.1 + elev, z);
        scene.add(post);
      });
    }

    // ── Tsunami wave mesh (hidden initially) ──
    const waveMat = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9, transparent: true, opacity: 0.8, roughness: 0.1,
    });
    const wave = new THREE.Mesh(new THREE.BoxGeometry(20, 0.3, 4), waveMat);
    wave.position.set(0, -1, -10);
    scene.add(wave);

    // ── Decorative rocks ──
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x6b7280, roughness: 0.9 });
    for (let i = 0; i < 8; i++) {
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.08 + Math.random() * 0.12), rockMat);
      rock.position.set((Math.random() - 0.5) * 12, 0, (Math.random() - 0.5) * 8);
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      rock.castShadow = true;
      scene.add(rock);
    }

    // ── Lighting ──
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambient);
    scene.add(new THREE.HemisphereLight(0x87ceeb, 0x4ade80, 0.4));
    const dir = new THREE.DirectionalLight(0xffffcc, 0.8);
    dir.position.set(5, 10, 5);
    dir.castShadow = true;
    scene.add(dir);

    const flash = new THREE.SpotLight(0xffffff, 0.3, 10, Math.PI / 4, 0.5, 2);
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
        if (isMobile) return;
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
    let waveProgress = 0;
    let waveActive = false;
    let waveDuration = 0;
    let endedShown = false;

    const animate = () => {
      if (!running) return;
      requestAnimationFrame(animate);
      try {
        const now = performance.now() / 1000;
        const dt = Math.min(now - lastTime, 0.05);
        lastTime = now;
        const elapsed = now;

        const pos = playerPosRef.current;

        // ── Player movement (playing only) ──
        if (gameStatusRef.current === "playing") {
          const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion);
          fwd.y = 0; fwd.normalize();
          const right = new THREE.Vector3(1, 0, 0).applyQuaternion(cam.quaternion);
          right.y = 0; right.normalize();

          if (keysRef.current.w) pos.add(fwd.clone().multiplyScalar(MOVE_SPEED * dt));
          if (keysRef.current.s) pos.add(fwd.clone().multiplyScalar(-MOVE_SPEED * 0.6 * dt));
          if (keysRef.current.a) pos.add(right.clone().multiplyScalar(-MOVE_SPEED * 0.5 * dt));
          if (keysRef.current.d) pos.add(right.clone().multiplyScalar(MOVE_SPEED * 0.5 * dt));

          pos.x = Math.max(-BOUNDARY_X, Math.min(BOUNDARY_X, pos.x));
          pos.z = Math.max(PLAYER_START_Z, Math.min(BOUNDARY_Z_MAX, pos.z));

          const dist = pos.distanceTo(new THREE.Vector3(0, 0, SHELTER_Z - 0.5));
          distanceRef.current = dist;
          if (Math.abs(dist - lastDistRenderRef.current) > 0.1) {
            lastDistRenderRef.current = dist;
            setDistance(dist);
          }

          // Timer
          timerRef.current -= dt;
          if (Math.abs(timerRef.current - timer) > 0.2) {
            setTimer(Math.max(0, Math.ceil(timerRef.current)));
          }

          // Success: reached hill
          if (dist < 1.8) {
            outcomeRef.current = "success";
            setOutcome("success");
            waveActive = true;
            waveProgress = 0;
            waveDuration = 3.5;
            endedShown = false;
            setGameStatus("wave");
            wave.position.set(0, -1, -10);
            wave.scale.set(1, 1, 1);
          }

          // Timeout
          if (timerRef.current <= 0) {
            outcomeRef.current = "failed";
            setOutcome("failed");
            waveActive = true;
            waveProgress = 0;
            waveDuration = 4;
            endedShown = false;
            setGameStatus("wave");
            wave.position.set(0, -1, -10);
            wave.scale.set(1, 1, 1);
          }
        }

        // ── Wave animation ──
        if (gameStatusRef.current === "wave" && waveActive) {
          waveProgress += dt;
          const t = Math.min(waveProgress / waveDuration, 1);
          const ease = t * t;
          wave.position.z = -10 + ease * 15;
          wave.scale.y = 1 + ease * 30;
          wave.position.y = -1 + ease * 2;
          wave.rotation.z = Math.sin(elapsed * 2) * 0.03;
          (wave.material as THREE.MeshStandardMaterial).opacity = 0.6 + ease * 0.3;

          // Screen shake during wave
          if (t >= 1 && !endedShown) {
            endedShown = true;
            waveActive = false;
            setGameStatus("ended");
            const ok = outcomeRef.current === "success";
            const txt = ok
              ? grade === 5
                ? "SELAMAT! 🏃 Kamu berhasil lari ke bukit tinggi sebelum tsunami datang! Hebat! Ingat: saat air laut surut drastis, segera lari ke tempat tinggi!"
                : "EVAKUASI SUKSES! 📊 Respons golden time optimal. Ketinggian aman (≥20m dpl) tercapai sebelum gelombang tsunami Run-up menerjang."
              : grade === 5
                ? "TIDAK SELAMAT! 🌊 Kamu tidak mencapai bukit tepat waktu. Tsunami menerjang! Lain kali, segera lari ke tempat tinggi saat air laut surut!"
                : "GAGAL EVAKUASI! ⚠️ Waktu golden time habis sebelum mencapai zona aman KRB. Tsunami run-up melampaui batas toleransi evakuasi.";
            onDecisionResult(ok, txt);
          }

          shakeTime += dt;
          const si = 0.02 + (waveProgress / waveDuration) * 0.06;
          cam.position.x += Math.sin(shakeTime * 37) * si;
          cam.position.y += Math.sin(shakeTime * 41) * si;
        }

        // ── Camera ──
        const isWave = gameStatusRef.current === "wave";
        if (!isWave) shakeTime = 0;
        const elevation = getElevation(pos.z);
        cam.position.set(pos.x, pos.y + 1.6 + elevation, pos.z);

        const euler = new THREE.Euler(pitchRef.current, yawRef.current, 0, "YXZ");
        cam.quaternion.setFromEuler(euler);

        // Fog darkens during wave
        if (gameStatusRef.current === "wave") {
          scene.fog = new THREE.Fog(0x1a3a5c, 5, 20);
        }

        // Flashlight follows
        flash.position.copy(cam.position);
        const fDir = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion);
        flash.target.position.copy(cam.position).add(fDir);
        flash.target.updateMatrixWorld();

        // Arrow follows player
        if (gameStatusRef.current === "playing") {
          const arrowZ = Math.min(pos.z + 1.5, SHELTER_Z - 1);
          const arrowElev = getElevation(arrowZ);
          arrowGroup.position.set(pos.x, 2.2 + arrowElev + Math.sin(elapsed * 2) * 0.15, arrowZ);
          arrowGroup.rotation.y = Math.PI;
          arrowGroup.visible = true;
        } else {
          arrowGroup.visible = false;
        }

        // Shelter light breathing
        shelterLight.intensity = 0.6 + Math.sin(elapsed * 1.5) * 0.3;

        // Ocean animation
        ocean.position.y = -0.3 + Math.sin(elapsed * 0.5) * 0.05;

        // Reset fog
        if (gameStatusRef.current === "ended" || gameStatusRef.current === "idle") {
          scene.fog = new THREE.Fog(0x87ceeb, 18, 30);
        }

        renderer.render(scene, cam);
      } catch (err) { console.error("TsunamiSim error:", err); }
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
    playerPosRef.current.set(0, 0, PLAYER_START_Z);
    timerRef.current = TIMER_SECONDS + (grade === 6 && hasEws ? 5 : 0);
    setTimer(TIMER_SECONDS + (grade === 6 && hasEws ? 5 : 0));
    distanceRef.current = 12;
    lastDistRenderRef.current = 12;
    setDistance(12);
    setGameStatus("playing");
    if (!isMobile) document.body.requestPointerLock();
  };

  const resetGame = () => {
    playerPosRef.current.set(0, 0, PLAYER_START_Z);
    timerRef.current = TIMER_SECONDS;
    setTimer(TIMER_SECONDS);
    distanceRef.current = 12;
    lastDistRenderRef.current = 12;
    setDistance(12);
    yawRef.current = Math.PI;
    pitchRef.current = -0.1;
    setGameStatus("idle");
    setOutcome("success");
  };

  const dist = distance;
  const timerVal = Math.max(0, Math.ceil(timer));
  const timerPercent = (timerVal / (TIMER_SECONDS + (grade === 6 && hasEws ? 5 : 0))) * 100;
  const timerColor = timerVal > 10 ? "bg-emerald-500" : timerVal > 5 ? "bg-amber-500" : "bg-red-500";
  const distPercent = Math.max(0, Math.min(100, (1 - dist / 12) * 100));

  return (
    <div className="flex flex-col gap-4">
      {grade === 5 ? (
        <div className="bg-gradient-to-r from-sky-900/40 to-blue-900/30 p-5 rounded-2xl border border-sky-800/40 space-y-2">
          <span className="bg-sky-500/20 text-sky-300 text-[10px] font-black tracking-widest uppercase py-1 px-3 rounded-full border border-sky-500/30">MATERI KELAS 5: EVAKUASI TSUNAMI</span>
          <h4 className="text-sm font-extrabold text-white">Lari ke Bukit Tinggi! 🌊</h4>
          <p className="text-xs text-slate-300 leading-relaxed">Tsunami datang setelah air laut surut drastis! Tekan <kbd className="bg-slate-800 text-sky-300 px-1.5 py-0.5 rounded text-[10px] font-mono">W</kbd> untuk lari ke bukit hijau sebelum gelombang besar menerjang!</p>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-sky-950 via-blue-950/40 to-slate-900 p-5 rounded-2xl border border-sky-800 space-y-3">
          <div className="flex justify-between items-start flex-wrap gap-2">
            <div className="space-y-1">
              <span className="bg-sky-500/20 text-sky-300 text-[10px] font-black tracking-widest uppercase py-1 px-3 rounded-full border border-sky-500/30">MATERI KELAS 6: GOLDEN TIME TSUNAMI</span>
              <h4 className="text-sm font-extrabold text-white">Evakuasi Vertikal & Golden Time</h4>
              <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">Golden Time adalah rentang 10-30 menit antara gempa bawah laut dan kedatangan gelombang tsunami. Evakuasi ke ketinggian aman (≥20m dpl) adalah prioritas mutlak.</p>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-xl border border-sky-500/30 flex flex-col items-center gap-1 w-full sm:w-auto text-center">
              <span className="text-[9px] font-bold text-sky-400 uppercase tracking-widest font-mono">EWS DINI</span>
              <button onClick={() => setHasEws(!hasEws)} disabled={gameStatus === "playing"} className={`w-full text-xs font-bold py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${hasEws ? "bg-sky-600 text-white shadow-md shadow-sky-600/20" : "bg-sky-950/40 hover:bg-sky-900/40 text-sky-300 border border-sky-800"} ${gameStatus === "playing" ? "opacity-50 cursor-not-allowed" : ""}`}>
                <AlertOctagon className="w-3.5 h-3.5" />
                {hasEws ? "📡 EWS Aktif!" : "Pasang EWS"}
              </button>
              <span className="text-[9px] text-slate-500">{hasEws ? "+5 detik waktu evakuasi" : "Evakuasi manual standar"}</span>
            </div>
          </div>
          <div className="text-[11px] bg-slate-950 p-2.5 rounded-lg border border-slate-850 text-sky-300/90 leading-relaxed">
            📡 <strong className="text-white">EWS:</strong> Sistem Peringatan Dini memberi +5 detik tambahan waktu evakuasi, meningkatkan peluang mencapai zona aman.
          </div>
        </div>
      )}

      <div className="relative w-full h-[min(400px,calc(100dvh-16rem))] rounded-3xl overflow-hidden shadow-2xl border border-slate-800 bg-sky-950 cursor-crosshair select-none">
        <div ref={containerRef} className="w-full h-full" />

        {!isLocked && gameStatus === "idle" && !isMobile && (
          <div className="absolute top-4 left-4 bg-slate-900/80 text-slate-300 text-[9px] font-bold px-3 py-1.5 rounded-full border border-slate-700 flex items-center gap-1.5 pointer-events-none select-none">🖱️ Klik area 3D untuk lihat-lihat</div>
        )}

        {isLocked && gameStatus === "playing" && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none">
            <div className="w-0.5 h-5 bg-white/40 rounded-full absolute left-1/2 -translate-x-1/2 -top-2.5" />
            <div className="w-5 h-0.5 bg-white/40 rounded-full absolute top-1/2 -translate-y-1/2 -left-2.5" />
          </div>
        )}

        {isMobile && gameStatus === "playing" && (
          <TouchControls
            keysRef={keysRef as React.MutableRefObject<{ w: boolean; a: boolean; s: boolean; d: boolean }>}
            yawRef={yawRef}
            pitchRef={pitchRef}
            enabled={gameStatus === "playing"}
          />
        )}

        {gameStatus === "playing" && (
          <>
            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 pointer-events-none">
              <div className="flex items-center gap-2 bg-slate-950/90 px-4 py-2 rounded-2xl border border-slate-700 shadow-xl">
                <Flag className="w-4 h-4 text-emerald-400" />
                <span className="font-mono font-black text-lg text-white">{Math.max(0, Math.round(dist * 10) / 10)}m</span>
                <span className="text-slate-400 text-xs font-bold">ke Bukit</span>
              </div>
              <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
                <div className="h-full rounded-full transition-all duration-300 bg-emerald-500" style={{ width: `${distPercent}%` }} />
              </div>
            </div>

            <div className="absolute top-4 right-4 pointer-events-none">
              <div className="flex items-center gap-2 bg-slate-950/90 px-3 py-2 rounded-2xl border border-slate-700 shadow-xl">
                <span className={`font-mono font-black text-lg ${timerVal <= 5 ? "text-red-400 animate-pulse" : "text-white"}`}>
                  {timerVal}
                </span>
                <span className="text-slate-400 text-xs font-bold">detik</span>
              </div>
              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-1.5">
                <div className={`h-full rounded-full transition-all duration-500 ${timerColor}`} style={{ width: `${timerPercent}%` }} />
              </div>
            </div>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none">
              <div className="bg-slate-950/80 px-3 py-2 rounded-xl border border-slate-700 flex items-center gap-3 shadow-lg">
                <div className="flex items-center gap-1.5 text-sky-400">
                  <Compass className="w-4 h-4" />
                  <span className="text-[10px] font-bold font-mono">BUKIT</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-mono">
                  <kbd className="bg-slate-800 text-sky-300 px-1.5 py-0.5 rounded text-[9px] font-bold">W</kbd><span>Lari</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-mono">
                  <kbd className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded text-[9px] font-bold">A/D</kbd><span>Belok</span>
                </div>
              </div>
            </div>
          </>
        )}

        {gameStatus === "wave" && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none">
            <div className="bg-red-950/90 text-red-400 font-black text-xs px-4 py-2 rounded-full border border-red-500/50 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.3)] flex items-center gap-2">
              <Waves className="w-4 h-4" />
              {outcome === "success" ? "TSUNAMI MENERJANG! — Kamu Aman di Bukit!" : "🌊 TSUNAMI DATANG!"}
            </div>
          </div>
        )}

        {gameStatus === "idle" && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 gap-4">
            <div className="w-16 h-16 rounded-full bg-sky-500/20 border border-sky-500 flex items-center justify-center animate-pulse">
              <span className="text-3xl">🌊</span>
            </div>
            <h4 className="text-xl font-black text-white tracking-tight uppercase">EVAKUASI TSUNAMI</h4>
            <p className="text-xs text-slate-300 max-w-md leading-relaxed">
              {grade === 5
                ? "Air laut surut drastis — tanda tsunami akan datang! Cepat lari ke bukit hijau menggunakan W A S D. Ikuti panah hijau dan capai bukit sebelum waktu habis!"
                : "Deteksi dini tsunami aktif. Golden time terbatas. Gunakan W A S D untuk evakuasi vertikal ke zona aman (bukit). Waktu evakuasi sangat kritis!"}
            </p>
            <button onClick={startGame} className="bg-sky-600 hover:bg-sky-500 text-white font-extrabold py-3 px-10 rounded-xl shadow-lg shadow-sky-600/30 text-xs uppercase tracking-widest transition-all hover:scale-105 flex items-center gap-2 cursor-pointer">
              <Play className="w-4 h-4 fill-white" /> MULAI EVAKUASI!
            </button>
          </div>
        )}

        {gameStatus === "ended" && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 gap-4">
            <div className={`p-4 rounded-full ${outcome === "success" ? "bg-emerald-500/10 border border-emerald-500" : "bg-red-500/10 border border-red-500"}`}>
              <span className="text-5xl">{outcome === "success" ? "🏆" : "💀"}</span>
            </div>
            <h4 className={`text-2xl font-black tracking-tight uppercase ${outcome === "success" ? "text-emerald-400" : "text-red-400"}`}>
              {outcome === "success" ? "SELAMAT! Evakuasi Berhasil!" : "TEWAS TERJANG TSUNAMI!"}
            </h4>
            <p className="text-xs text-slate-300 max-w-md leading-relaxed">
              {outcome === "success"
                ? grade === 5
                  ? "Kamu berhasil lari ke bukit tinggi sebelum tsunami datang! Ingat: saat air laut surut drastis, segera lari ke tempat tinggi tanpa menunggu!"
                  : "Evakuasi sukses! Golden Time termanfaatkan optimal. Ketinggian aman memberikan perlindungan dari Run-up tsunami."
                : grade === 5
                  ? "Tsunami menerjang sebelum kamu mencapai bukit! Lain kali, jangan buang waktu — lari segera ke tempat tinggi saat air laut surut!"
                  : "Golden Time habis. Elevasi belum tercapai. Tsunami Run-up melampaui batas. Evaluasi rute dan kecepatan evakuasi."}
            </p>
            <button onClick={resetGame} className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-slate-500 text-xs py-2.5 px-8 rounded-lg font-bold uppercase tracking-wider transition flex items-center gap-2 cursor-pointer">
              <RotateCcw className="w-3.5 h-3.5" /> Coba Lagi
            </button>
          </div>
        )}
      </div>

      <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-850 text-xs text-slate-400">
        <Info className="w-4 h-4 text-sky-500 inline mr-2" />
        {grade === 5
          ? "Jika air laut surut drastis: JANGAN mendekat! Segera lari ke bukit atau gedung tinggi! Gunakan W untuk lari, A/D untuk belok."
          : "Golden Time: rentang 10-30 menit sejak gempa bawah laut. Tsunami bergerak 500-800 km/jam di laut. Evakuasi vertikal minimal 20m dpl."}
      </div>
    </div>
  );
}
