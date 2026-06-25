import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Play, RotateCcw, AlertTriangle, Hammer, ShieldAlert, Info } from "lucide-react";

interface Props {
  grade?: number;
  onDecisionResult: (key: "A" | "B" | "C", correct: boolean, feedback: string) => void;
}

function makeTileTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext("2d")!;
  const tileSize = 32;
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const bright = (x + y) % 2 === 0;
      ctx.fillStyle = bright ? "#d4c5a9" : "#c2b396";
      ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
      ctx.strokeStyle = "#a89880";
      ctx.lineWidth = 1;
      ctx.strokeRect(x * tileSize, y * tileSize, tileSize, tileSize);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  return tex;
}

function makeOutsideTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext("2d")!;
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, "#7dd3fc");
  grad.addColorStop(0.6, "#bae6fd");
  grad.addColorStop(1, "#e0f2fe");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 12; i++) {
    const x = 80 + Math.random() * 360;
    const y = 100 + Math.random() * 300;
    ctx.fillStyle = `hsl(${120 + Math.random() * 40}, 50%, ${30 + Math.random() * 20}%)`;
    ctx.beginPath();
    ctx.arc(x, y, 15 + Math.random() * 30, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  return tex;
}

function makePosterTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 320;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#1e40af";
  ctx.fillRect(0, 0, 256, 320);
  ctx.fillStyle = "#fbbf24";
  ctx.font = "bold 28px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("SIAGA", 128, 80);
  ctx.fillText("GEMPA!", 128, 120);
  ctx.font = "16px sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText("Drop! Cover!", 128, 180);
  ctx.fillText("Hold On!", 128, 210);
  ctx.strokeStyle = "#fbbf24";
  ctx.lineWidth = 4;
  ctx.strokeRect(20, 20, 216, 280);
  return new THREE.CanvasTexture(c);
}

export default function EarthquakeSimulation({ grade = 5, onDecisionResult }: Props) {
  const isMobile = typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0 || /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
  const containerRef = useRef<HTMLDivElement>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [isBookcaseAnchored, setIsBookcaseAnchored] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  const shakeRef = useRef(0);
  const anchoredRef = useRef(false);
  const yawRef = useRef(0);
  const pitchRef = useRef(0);
  const camRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  const tableRef = useRef<THREE.Group | null>(null);
  const chairRef = useRef<THREE.Group | null>(null);
  const bookcaseRef = useRef<THREE.Group | null>(null);
  const booksRef = useRef<THREE.Group | null>(null);
  const lampRef = useRef<THREE.Group | null>(null);
  const lightRef = useRef<THREE.PointLight | null>(null);
  const debrisRef = useRef<THREE.Mesh[]>([]);
  const glassRef = useRef<THREE.Mesh[]>([]);
  const dustRef = useRef<THREE.Points | null>(null);
  const flashRef = useRef<THREE.SpotLight | null>(null);

  const tablePos = useRef(new THREE.Vector3(-1.8, 0, -1.5));
  const chairPos = useRef(new THREE.Vector3(-1.8, 0, 1.4));
  const bookcasePos = useRef(new THREE.Vector3(-5.4, 0, -0.5));

  useEffect(() => { anchoredRef.current = isBookcaseAnchored; }, [isBookcaseAnchored]);

  const bookPositions = [
    { x: -4.5, y: 2.65, z: -1.2 }, { x: -4.2, y: 2.65, z: -1.2 }, { x: -3.9, y: 2.65, z: -1.2 },
    { x: -4.6, y: 1.85, z: -1.2 }, { x: -4.1, y: 1.85, z: -1.2 }, { x: -3.6, y: 1.85, z: -1.2 },
    { x: -4.4, y: 1.05, z: -1.2 }, { x: -4.0, y: 1.05, z: -1.2 },
  ];

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const w = el.clientWidth || 400;
    const h = el.clientHeight || 300;
    const ROOM_H = 3.5;
    const ROOM_W = 12;
    const ROOM_D = 12;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111827);
    scene.fog = new THREE.Fog(0x111827, 8, 14);

    const cam = new THREE.PerspectiveCamera(75, w / h, 0.1, 100);
    cam.position.set(0, 1.6, 0);
    camRef.current = cam;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    el.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // ===== ROOM =====
    // Floor
    const floorTex = makeTileTexture();
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(ROOM_W, ROOM_D),
      new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.7, metalness: 0.05 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, 0);
    floor.receiveShadow = true;
    scene.add(floor);

    // Rug
    const rugMat = new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.95 });
    const rug = new THREE.Mesh(new THREE.PlaneGeometry(3, 2), rugMat);
    rug.rotation.x = -Math.PI / 2;
    rug.position.set(-1.8, 0.01, 0);
    rug.receiveShadow = true;
    scene.add(rug);

    // Ceiling tiles
    const ceilTexCanvas = document.createElement("canvas");
    ceilTexCanvas.width = 128;
    ceilTexCanvas.height = 128;
    const cctx = ceilTexCanvas.getContext("2d")!;
    cctx.fillStyle = "#e8e8e8";
    cctx.fillRect(0, 0, 128, 128);
    cctx.strokeStyle = "#d0d0d0";
    cctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
      cctx.beginPath();
      cctx.moveTo(0, i * 16);
      cctx.lineTo(128, i * 16);
      cctx.stroke();
      cctx.beginPath();
      cctx.moveTo(i * 16, 0);
      cctx.lineTo(i * 16, 128);
      cctx.stroke();
    }
    const ceilTex = new THREE.CanvasTexture(ceilTexCanvas);
    ceilTex.wrapS = ceilTex.wrapT = THREE.RepeatWrapping;
    ceilTex.repeat.set(4, 4);
    const ceiling = new THREE.Mesh(
      new THREE.PlaneGeometry(ROOM_W, ROOM_D),
      new THREE.MeshStandardMaterial({ map: ceilTex, roughness: 0.9, side: THREE.BackSide })
    );
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(0, ROOM_H, 0);
    scene.add(ceiling);

    // Walls
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xf0e8d8, roughness: 0.85, metalness: 0 });

    // Left wall
    const lw = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_D, ROOM_H), wallMat);
    lw.position.set(-ROOM_W / 2, ROOM_H / 2, 0);
    lw.rotation.y = Math.PI / 2;
    lw.receiveShadow = true;
    scene.add(lw);

    // Right wall
    const rw = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_D, ROOM_H), wallMat);
    rw.position.set(ROOM_W / 2, ROOM_H / 2, 0);
    rw.rotation.y = -Math.PI / 2;
    rw.receiveShadow = true;
    scene.add(rw);

    // Back wall halves (window in center)
    const bw1 = new THREE.Mesh(new THREE.PlaneGeometry(4.5, ROOM_H), wallMat);
    bw1.position.set(-3.25, ROOM_H / 2, -ROOM_D / 2);
    bw1.receiveShadow = true;
    scene.add(bw1);
    const bw2 = new THREE.Mesh(new THREE.PlaneGeometry(4.5, ROOM_H), wallMat);
    bw2.position.set(3.25, ROOM_H / 2, -ROOM_D / 2);
    bw2.receiveShadow = true;
    scene.add(bw2);
    const bwTop = new THREE.Mesh(new THREE.PlaneGeometry(3, 0.6), wallMat);
    bwTop.position.set(0, ROOM_H - 0.3, -ROOM_D / 2);
    scene.add(bwTop);
    const bwBot = new THREE.Mesh(new THREE.PlaneGeometry(3, 1.0), wallMat);
    bwBot.position.set(0, 0.5, -ROOM_D / 2);
    scene.add(bwBot);

    // Window view (outside)
    const outsideTex = makeOutsideTexture();
    const outsideMat = new THREE.MeshBasicMaterial({ map: outsideTex });
    const outside = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 2.4), outsideMat);
    outside.position.set(0, 1.9, -5.98);
    scene.add(outside);

    // Window frame
    const frameMat2 = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.7 });
    const fw = (px: number, py: number, sx: number, sy: number) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, 0.08), frameMat2);
      m.position.set(px, py, -5.97);
      scene.add(m);
    };
    fw(0, 3.1, 3.2, 0.08); // top
    fw(0, 0.7, 3.2, 0.08); // bottom
    fw(-1.55, 1.9, 0.08, 2.6); // left
    fw(1.55, 1.9, 0.08, 2.6); // right
    fw(0, 1.9, 0.06, 2.6); // middle vertical

    // Front wall (doorway)
    const fMat2 = new THREE.MeshStandardMaterial({ color: 0xf0e8d8, roughness: 0.85 });
    const fwl2 = new THREE.Mesh(new THREE.PlaneGeometry(4.5, ROOM_H), fMat2);
    fwl2.position.set(-4.25, ROOM_H / 2, ROOM_D / 2);
    scene.add(fwl2);
    const fwr2 = new THREE.Mesh(new THREE.PlaneGeometry(4.5, ROOM_H), fMat2);
    fwr2.position.set(4.25, ROOM_H / 2, ROOM_D / 2);
    scene.add(fwr2);
    const fwt2 = new THREE.Mesh(new THREE.PlaneGeometry(3, 0.8), fMat2);
    fwt2.position.set(0, ROOM_H - 0.4, ROOM_D / 2);
    scene.add(fwt2);

    // Poster on right wall
    const posterTex = makePosterTexture();
    const posterMat = new THREE.MeshBasicMaterial({ map: posterTex });
    const poster = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.5), posterMat);
    poster.position.set(5.97, 2.0, -1);
    poster.rotation.y = Math.PI;
    scene.add(poster);
    const posterFrame = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 1.6, 1.3),
      new THREE.MeshStandardMaterial({ color: 0x333333 })
    );
    posterFrame.position.set(5.97, 2.0, -1);
    posterFrame.rotation.y = Math.PI;
    scene.add(posterFrame);

    // ===== FURNITURE =====
    // Desk with objects
    const desk = new THREE.Group();
    const deskTop = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 0.12, 1.2),
      new THREE.MeshStandardMaterial({ color: 0x8b6914, roughness: 0.5 })
    );
    deskTop.position.y = 1.2;
    deskTop.castShadow = true;
    deskTop.receiveShadow = true;
    desk.add(deskTop);
    const dLegMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.4, roughness: 0.3 });
    const dlg = new THREE.CylinderGeometry(0.04, 0.04, 1.2, 6);
    [[-0.85, 0.6, -0.45], [0.85, 0.6, -0.45], [-0.85, 0.6, 0.45], [0.85, 0.6, 0.45]].forEach(([x, y, z]) => {
      const leg = new THREE.Mesh(dlg, dLegMat);
      leg.position.set(x, y, z);
      leg.castShadow = true;
      desk.add(leg);
    });
    // Book on desk
    const bookMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.3 });
    const bookTop = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.06, 0.28), bookMat);
    bookTop.position.set(0.2, 1.28, 0.1);
    bookTop.castShadow = true;
    desk.add(bookTop);
    const bookMat2 = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.3 });
    const book2 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.04, 0.22), bookMat2);
    book2.position.set(-0.15, 1.27, -0.1);
    book2.castShadow = true;
    desk.add(book2);
    // Pencil
    const pencilMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.5 });
    const pencil = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.3, 6), pencilMat);
    pencil.position.set(0.5, 1.28, -0.3);
    pencil.rotation.z = 0.2;
    desk.add(pencil);
    desk.position.copy(tablePos.current);
    scene.add(desk);
    tableRef.current = desk;

    // Chair
    const chair = new THREE.Group();
    const seatMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.8 });
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.08, 0.8), seatMat);
    seat.position.y = 0.8;
    seat.castShadow = true;
    seat.receiveShadow = true;
    chair.add(seat);
    const cLegMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.4, roughness: 0.3 });
    const clg = new THREE.CylinderGeometry(0.03, 0.03, 0.8, 6);
    [[-0.35, 0.4, -0.35], [0.35, 0.4, -0.35], [-0.35, 0.4, 0.35], [0.35, 0.4, 0.35]].forEach(([x, y, z]) => {
      const leg = new THREE.Mesh(clg, cLegMat);
      leg.position.set(x, y, z);
      chair.add(leg);
    });
    // Backrest
    const back = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.6, 0.04),
      new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.8 })
    );
    back.position.set(0, 1.1, -0.4);
    chair.add(back);
    chair.position.copy(chairPos.current);
    scene.add(chair);
    chairRef.current = chair;

    // Bookcase
    const bookcase = new THREE.Group();
    const bcMat = new THREE.MeshStandardMaterial({ color: 0x6b4423, roughness: 0.7 });
    const bcFrame = new THREE.Mesh(new THREE.BoxGeometry(1.6, ROOM_H - 0.3, 0.6), bcMat);
    bcFrame.position.y = (ROOM_H - 0.3) / 2;
    bcFrame.castShadow = true;
    bcFrame.receiveShadow = true;
    bookcase.add(bcFrame);
    const shMat = new THREE.MeshStandardMaterial({ color: 0x8b6914 });
    [0.8, 1.6, 2.4].forEach((h) => {
      const s = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.04, 0.55), shMat);
      s.position.set(0, h, 0.02);
      bookcase.add(s);
    });
    bookcase.position.copy(bookcasePos.current);
    scene.add(bookcase);
    bookcaseRef.current = bookcase;

    // Books
    const booksGroup = new THREE.Group();
    scene.add(booksGroup);
    booksRef.current = booksGroup;
    bookPositions.forEach((pos) => {
      const bh = 0.2 + Math.random() * 0.35;
      const bMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(Math.random() * 0.1 + 0.05, 0.6, 0.3 + Math.random() * 0.2),
        roughness: 0.4,
      });
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.12, bh, 0.3), bMat);
      b.position.set(pos.x, pos.y + bh / 2 - 0.23, pos.z);
      b.castShadow = true;
      booksGroup.add(b);
    });

    // Hanging lamp (chain + shade)
    const lampG = new THREE.Group();
    const chainMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.6, roughness: 0.3 });
    for (let i = 0; i < 6; i++) {
      const link = new THREE.Mesh(
        new THREE.TorusGeometry(0.04, 0.015, 6, 8),
        chainMat
      );
      link.position.y = ROOM_H - 0.2 - i * 0.12;
      link.rotation.x = Math.PI / 2;
      lampG.add(link);
    }
    // Lamp shade
    const shadeMat = new THREE.MeshStandardMaterial({
      color: 0xf0e8d0,
      roughness: 0.6,
      side: THREE.DoubleSide,
    });
    const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.15, 0.25, 12, 1, true), shadeMat);
    shade.position.y = ROOM_H - 1.0;
    lampG.add(shade);
    const bulb2 = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xfff8d6 })
    );
    bulb2.position.y = ROOM_H - 1.12;
    lampG.add(bulb2);
    lampG.position.set(0.5, 0, 0);
    scene.add(lampG);
    lampRef.current = lampG;

    // ===== LIGHTING =====
    scene.add(new THREE.AmbientLight(0xffeedd, 0.3));

    const mainLight = new THREE.PointLight(0xfff0d0, 2.0, 15);
    mainLight.position.set(0.5, ROOM_H - 0.5, 0);
    mainLight.castShadow = true;
    scene.add(mainLight);
    lightRef.current = mainLight;

    const spotLight = new THREE.SpotLight(0xffeecc, 0.3, 8, Math.PI / 4, 0.6);
    spotLight.position.set(0.5, ROOM_H, 0);
    spotLight.target.position.set(0.5, 0, 0);
    scene.add(spotLight);
    scene.add(spotLight.target);

    const flash = new THREE.SpotLight(0xffeedd, 0.5, 10, Math.PI / 5, 0.5, 2);
    flash.position.copy(cam.position);
    flash.target.position.set(0, 1.6, -5);
    flash.castShadow = true;
    scene.add(flash);
    scene.add(flash.target);
    flashRef.current = flash;

    // ===== DEBRIS =====
    const allDebris: THREE.Mesh[] = [];
    const concreteMat = new THREE.MeshStandardMaterial({ color: 0x9ca3af, roughness: 0.9 });
    for (let i = 0; i < 30; i++) {
      const s = 0.04 + Math.random() * 0.1;
      const m = new THREE.Mesh(
        new THREE.DodecahedronGeometry(s),
        concreteMat
      );
      m.position.set((Math.random() - 0.5) * 10, ROOM_H + 0.2, (Math.random() - 0.5) * 10);
      m.userData = {
        vel: new THREE.Vector3((Math.random() - 0.5) * 0.04, 0, (Math.random() - 0.5) * 0.04),
        rot: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(0.08),
        active: false,
        delay: Math.random() * 3,
      };
      m.visible = false;
      m.castShadow = true;
      scene.add(m);
      allDebris.push(m);
    }
    debrisRef.current = allDebris;

    // Glass shards
    const glassList: THREE.Mesh[] = [];
    for (let i = 0; i < 20; i++) {
      const s = 0.02 + Math.random() * 0.06;
      const gMat = new THREE.MeshPhysicalMaterial({
        color: 0xb0d4f1,
        transparent: true,
        opacity: 0.5 + Math.random() * 0.4,
        roughness: 0.1,
        metalness: 0,
        envMapIntensity: 0.5,
      });
      const m = new THREE.Mesh(new THREE.BoxGeometry(s, s * 0.2, s), gMat);
      m.position.set((Math.random() - 0.5) * 10, ROOM_H + 0.2, (Math.random() - 0.5) * 10);
      m.userData = {
        vel: new THREE.Vector3((Math.random() - 0.5) * 0.05, 0, (Math.random() - 0.5) * 0.05),
        rot: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(0.1),
        active: false,
        delay: Math.random() * 4,
      };
      m.visible = false;
      m.castShadow = true;
      scene.add(m);
      glassList.push(m);
    }
    glassRef.current = glassList;

    // Dust
    const dustCount = 400;
    const dg = new THREE.BufferGeometry();
    const dp = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount * 3; i++) {
      dp[i] = (Math.random() - 0.5) * ROOM_W;
      if (i % 3 === 1) dp[i] = Math.random() * ROOM_H;
    }
    dg.setAttribute("position", new THREE.BufferAttribute(dp, 3));
    const dm = new THREE.PointsMaterial({
      color: 0xcbd5e1,
      size: 0.02,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const dustPts = new THREE.Points(dg, dm);
    scene.add(dustPts);
    dustRef.current = dustPts;

    // ===== CONTROLS =====
    let lastMX = 0, lastMY = 0, hasLast = false;

    const onMouseMove = (e: MouseEvent) => {
      if (!document.pointerLockElement) {
        lastMX = e.clientX; lastMY = e.clientY; hasLast = true;
        return;
      }
      if (e.movementX !== 0 || e.movementY !== 0) {
        yawRef.current -= e.movementX * 0.003;
        pitchRef.current -= e.movementY * 0.003;
      } else if (hasLast) {
        yawRef.current -= (e.clientX - lastMX) * 0.01;
        pitchRef.current -= (e.clientY - lastMY) * 0.01;
        lastMX = e.clientX; lastMY = e.clientY;
      }
      pitchRef.current = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, pitchRef.current));
    };
    document.addEventListener("mousemove", onMouseMove);

    const onLockChange = () => {
      setIsLocked(!!document.pointerLockElement);
      if (document.pointerLockElement) hasLast = false;
    };
    document.addEventListener("pointerlockchange", onLockChange);

    const onCanvasClick = () => {
      if (!document.pointerLockElement && !isMobile) {
        try { document.body.requestPointerLock(); } catch (_) {}
      }
    };
    renderer.domElement.addEventListener("click", onCanvasClick);

    // ── Touch look for mobile ──
    let touchId: number | null = null;
    let touchStartX = 0, touchStartY = 0;
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      touchId = e.touches[0].identifier;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (touchId === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchId) {
          const dx = e.changedTouches[i].clientX - touchStartX;
          const dy = e.changedTouches[i].clientY - touchStartY;
          yawRef.current -= dx * 0.005;
          pitchRef.current -= dy * 0.005;
          pitchRef.current = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, pitchRef.current));
          touchStartX = e.changedTouches[i].clientX;
          touchStartY = e.changedTouches[i].clientY;
        }
      }
    };
    const onTouchEnd = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchId) touchId = null;
      }
    };
    renderer.domElement.addEventListener("touchstart", onTouchStart, { passive: true });
    renderer.domElement.addEventListener("touchmove", onTouchMove, { passive: true });
    renderer.domElement.addEventListener("touchend", onTouchEnd);

    // ── Document touch look (always catches touches, bypasses z-index) ──
    let docTouchId: number | null = null;
    let docTouchLX = 0, docTouchLY = 0;
    const onDocTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      docTouchId = e.touches[0].identifier;
      docTouchLX = e.touches[0].clientX;
      docTouchLY = e.touches[0].clientY;
    };
    const onDocTouchMove = (e: TouchEvent) => {
      if (docTouchId === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === docTouchId) {
          const dx = e.changedTouches[i].clientX - docTouchLX;
          const dy = e.changedTouches[i].clientY - docTouchLY;
          yawRef.current -= dx * 0.005;
          pitchRef.current -= dy * 0.005;
          docTouchLX = e.changedTouches[i].clientX;
          docTouchLY = e.changedTouches[i].clientY;
        }
      }
    };
    const onDocTouchEnd = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === docTouchId) docTouchId = null;
      }
    };
    document.addEventListener("touchstart", onDocTouchStart, { passive: true });
    document.addEventListener("touchmove", onDocTouchMove, { passive: true });
    document.addEventListener("touchend", onDocTouchEnd);

    // ===== ANIMATION =====
    let running = true;
    let lastTime = performance.now() / 1000;
    let flickerTime = 0;

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

        const intensity = shakeRef.current;

        if (intensity > 0) {
          const sx = Math.sin(elapsed * 37) * 0.5 + Math.sin(elapsed * 53) * 0.3 + Math.sin(elapsed * 71) * 0.2;
          const sy = Math.sin(elapsed * 41) * 0.4 + Math.sin(elapsed * 59) * 0.3 + Math.sin(elapsed * 67) * 0.2;
          const sz = Math.sin(elapsed * 29) * 0.5 + Math.sin(elapsed * 47) * 0.3 + Math.sin(elapsed * 83) * 0.2;
          const sRoll = Math.sin(elapsed * 19) * 0.02 + Math.sin(elapsed * 31) * 0.01;

          cam.position.set(sx * intensity * 0.35, 1.6 + sy * intensity * 0.25, sz * intensity * 0.15);

          const rollQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, sRoll * intensity * 10));
          cam.quaternion.copy(baseQuat.clone().multiply(rollQuat));
          cam.fov = 75 + Math.sin(elapsed * 15) * intensity * 5;
          cam.updateProjectionMatrix();

          flash.position.copy(cam.position);
          const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion);
          flash.target.position.copy(cam.position).add(fwd);
          flash.target.updateMatrixWorld();

          // Flicker light
          flickerTime += dt;
          if (lightRef.current) {
            const flicker = 1.0 + Math.sin(flickerTime * 23) * 0.15 + Math.sin(flickerTime * 37) * 0.1;
            lightRef.current.intensity = Math.max(0.2, 2.0 * (flicker > 0.6 ? flicker : 0.3));
          }

          // Swing lamp
          if (lampRef.current) {
            lampRef.current.rotation.z = Math.sin(elapsed * 10) * 0.4 + Math.sin(elapsed * 15) * 0.2;
            lampRef.current.rotation.x = Math.sin(elapsed * 8) * 0.3 + Math.sin(elapsed * 13) * 0.15;
          }

          // Desk wobble
          if (tableRef.current) {
            tableRef.current.position.x = tablePos.current.x + Math.sin(elapsed * 22) * intensity * 0.08;
            tableRef.current.position.z = tablePos.current.z + Math.cos(elapsed * 18) * intensity * 0.06;
            tableRef.current.rotation.z = Math.sin(elapsed * 15) * intensity * 0.04;
            tableRef.current.rotation.x = Math.sin(elapsed * 20) * intensity * 0.025;
          }

          // Chair wobble
          if (chairRef.current) {
            chairRef.current.position.x = chairPos.current.x + Math.sin(elapsed * 17) * intensity * 0.1;
            chairRef.current.position.z = chairPos.current.z + Math.cos(elapsed * 13) * intensity * 0.08;
            chairRef.current.rotation.z = Math.sin(elapsed * 12) * intensity * 0.05;
          }

          // Bookcase wobble
          if (bookcaseRef.current) {
            const bcP = bookcasePos.current;
            bookcaseRef.current.rotation.z = Math.sin(elapsed * 12) * intensity * 0.08 + Math.sin(elapsed * 17) * intensity * 0.04;
            bookcaseRef.current.position.x = bcP.x + Math.sin(elapsed * 14) * intensity * 0.12;
          }

          // Books fall
          if (!anchoredRef.current && booksRef.current) {
            booksRef.current.children.forEach((bk, i) => {
              if (elapsed > 1.0 + i * 0.25 && bk.position.y > 0.05) {
                bk.position.y -= 0.2 * dt * 60;
                bk.rotation.z += 0.06 * dt * 60;
                bk.rotation.x += 0.04 * dt * 60;
              }
            });
          }

          // Concrete debris
          allDebris.forEach((piece) => {
            if (!piece.userData.active) {
              piece.userData.delay -= dt;
              if (piece.userData.delay <= 0) {
                piece.userData.active = true;
                piece.visible = true;
                piece.position.y = ROOM_H - 0.2 + Math.random() * 0.3;
              }
            } else {
              piece.userData.vel.y -= 0.018 * dt * 60;
              piece.position.x += piece.userData.vel.x * dt * 60;
              piece.position.y += piece.userData.vel.y * dt * 60;
              piece.position.z += piece.userData.vel.z * dt * 60;
              piece.rotation.x += piece.userData.rot.x * dt * 60;
              piece.rotation.z += piece.userData.rot.z * dt * 60;
              if (piece.position.y < 0) {
                piece.userData.active = false;
                piece.visible = false;
                piece.userData.delay = 1.5 + Math.random() * 3;
                piece.position.set((Math.random() - 0.5) * 10, ROOM_H + 0.2, (Math.random() - 0.5) * 10);
                piece.userData.vel.set((Math.random() - 0.5) * 0.04, 0, (Math.random() - 0.5) * 0.04);
              }
            }
          });

          // Glass shards
          glassList.forEach((piece) => {
            if (!piece.userData.active) {
              piece.userData.delay -= dt;
              if (piece.userData.delay <= 0) {
                piece.userData.active = true;
                piece.visible = true;
                piece.position.y = ROOM_H - 0.5 + Math.random() * 0.5;
              }
            } else {
              piece.userData.vel.y -= 0.02 * dt * 60;
              piece.position.x += piece.userData.vel.x * dt * 60;
              piece.position.y += piece.userData.vel.y * dt * 60;
              piece.position.z += piece.userData.vel.z * dt * 60;
              piece.rotation.x += piece.userData.rot.x * dt * 60;
              piece.rotation.z += piece.userData.rot.z * dt * 60;
              if (piece.position.y < 0) {
                piece.userData.active = false;
                piece.visible = false;
                piece.userData.delay = 2 + Math.random() * 3;
                piece.position.set((Math.random() - 0.5) * 10, ROOM_H + 0.2, (Math.random() - 0.5) * 10);
                piece.userData.vel.set((Math.random() - 0.5) * 0.05, 0, (Math.random() - 0.5) * 0.05);
              }
            }
          });

          // Dust particles
          if (dustRef.current) {
            const mat = dustRef.current.material as THREE.PointsMaterial;
            mat.opacity = Math.min(0.7, mat.opacity + 0.015);
            const pos = dustRef.current.geometry.attributes.position.array as Float32Array;
            for (let i = 0; i < pos.length; i += 3) {
              pos[i] += Math.sin(elapsed * 5 + i) * 0.002 * dt * 60;
              pos[i + 1] += Math.sin(elapsed * 3 + i * 0.5) * 0.003 * dt * 60;
              pos[i + 2] += Math.cos(elapsed * 4 + i * 0.7) * 0.002 * dt * 60;
              if (pos[i + 1] > ROOM_H) pos[i + 1] = 0;
              if (pos[i + 1] < 0) pos[i + 1] = ROOM_H;
            }
            dustRef.current.geometry.attributes.position.needsUpdate = true;
          }
        } else {
          cam.position.set(0, 1.6, 0);
          cam.quaternion.copy(baseQuat);
          cam.fov = 75;
          cam.updateProjectionMatrix();

          flash.position.copy(cam.position);
          const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion);
          flash.target.position.copy(cam.position).add(fwd);
          flash.target.updateMatrixWorld();

          if (lightRef.current) lightRef.current.intensity = 2.0;

          if (tableRef.current) {
            tableRef.current.position.copy(tablePos.current);
            tableRef.current.rotation.set(0, 0, 0);
          }
          if (chairRef.current) {
            chairRef.current.position.copy(chairPos.current);
            chairRef.current.rotation.set(0, 0, 0);
          }
          if (bookcaseRef.current) {
            bookcaseRef.current.position.copy(bookcasePos.current);
            bookcaseRef.current.rotation.set(0, 0, 0);
          }
          if (lampRef.current) {
            lampRef.current.rotation.z = Math.sin(elapsed * 0.8) * 0.02;
            lampRef.current.rotation.x = 0;
          }
          if (booksRef.current) {
            booksRef.current.children.forEach((bk, i) => {
              const init = bookPositions[i];
              if (init) {
                bk.position.set(init.x, init.y + 0.2 - 0.23, init.z);
                bk.rotation.set(0, 0, 0);
              }
            });
          }
          allDebris.forEach((p) => {
            p.userData.active = false;
            p.visible = false;
            p.position.set((Math.random() - 0.5) * 10, ROOM_H + 0.2, (Math.random() - 0.5) * 10);
            p.userData.delay = Math.random() * 3;
          });
          glassList.forEach((p) => {
            p.userData.active = false;
            p.visible = false;
            p.position.set((Math.random() - 0.5) * 10, ROOM_H + 0.2, (Math.random() - 0.5) * 10);
            p.userData.delay = Math.random() * 4;
          });
          if (dustRef.current) {
            const mat = dustRef.current.material as THREE.PointsMaterial;
            mat.opacity = Math.max(0, mat.opacity - 0.008);
          }
        }

        renderer.render(scene, cam);
      } catch (err) {
        console.error("Earthquake animate error:", err);
      }
    };

    animate();

    return () => {
      running = false;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("pointerlockchange", onLockChange);
      renderer.domElement.removeEventListener("click", onCanvasClick);
      renderer.domElement.removeEventListener("touchstart", onTouchStart);
      renderer.domElement.removeEventListener("touchmove", onTouchMove);
      renderer.domElement.removeEventListener("touchend", onTouchEnd);
      document.removeEventListener("touchstart", onDocTouchStart);
      document.removeEventListener("touchmove", onDocTouchMove);
      document.removeEventListener("touchend", onDocTouchEnd);
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
      if (document.pointerLockElement) document.exitPointerLock();
      renderer.dispose();
    };
  }, []);

  const triggerEarthquake = () => {
    setIsShaking(true);
    setSelectedChoice(null);
    shakeRef.current = 0.22;
    if (!document.pointerLockElement && !isMobile) {
      try { document.body.requestPointerLock(); } catch (_) {}
    }
  };

  const handleChoice = (choice: "A" | "B" | "C") => {
    if (!isShaking) return;
    setSelectedChoice(choice);
    setIsShaking(false);
    shakeRef.current = 0;
    let correct = false, feedback = "";
    if (choice === "A") {
      correct = true;
      feedback = grade === 5
        ? "PILIHAN HEBAT! 🌟 Kamu langsung meringkuk di bawah meja kayu yang kokoh. Ini melindungi kepalamu dari reruntuhan mainan, buku, atau kaca jendela!"
        : "ANALISIS TEPAT! 🎯 Tindakan 'Drop, Cover, and Hold On' meminimalkan gaya tumbukan benda jatuh. Memanfaatkan ruang lindung di bawah meja (rigid structural model) adalah keputusan taktis rasio keselamatan tertinggi.";
    } else if (choice === "B") {
      feedback = grade === 5
        ? "OOH TIDAK... 😮 Berdiri dekat lemari sangat berbahaya karena lemari bisa roboh menimpamu saat guncangan gempa. Jangan di sini ya!"
        : "KERENTANAN TINGGI! ⚠️ Lemari buku adalah benda non-struktural yang memiliki momentum inersia tinggi saat gempa. Berada di jalur jatuh lemari adalah risiko cedera kompresi berat.";
    } else {
      feedback = grade === 5
        ? "ADUH, BAHAYA! 🏃 Jangan berlari panik ke luar pintu saat guncangannya kencang. Kamu bisa tersandung dan terjatuh. Sembunyi dulu!"
        : "RISIKO BERLARI! 🏃‍♂️ Kecepatan rambat gelombang S seismik menyebabkan pergeseran lantai ekstrem. Berlari saat gempa merusak koordinasi neuromuskular dan melipatgandakan risiko jatuh terbentur.";
    }
    onDecisionResult(choice, correct, feedback);
  };

  return (
    <div className="flex flex-col gap-5">
      {grade === 5 ? (
        <div className="bg-gradient-to-r from-blue-900/40 to-indigo-900/40 p-5 rounded-2xl border border-blue-800/40 space-y-2">
          <span className="bg-blue-500/20 text-blue-300 text-[10px] font-black tracking-widest uppercase py-1 px-3 rounded-full border border-blue-500/30">MATERI KELAS 5: PENJELAJAH CILIK GEMPA BUMI</span>
          <h4 className="text-sm font-extrabold text-white">Ingat Rumus Hebat: Berlutut, Berlindung, Berpegangan! 👦👧</h4>
          <p className="text-xs text-slate-300 leading-relaxed">Jika bumi bergoyang, kita tidak boleh berteriak atau berlari panik. Cukup tekuk kakimu (Drop), lindungi kepalamu di bawah meja kayu (Cover), dan pegang erat-erat kaki mejanya (Hold On) sampai goyangannya selesai!</p>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-purple-900/40 to-indigo-900/40 p-5 rounded-2xl border border-purple-800/40 space-y-3">
          <div className="flex justify-between items-start flex-wrap gap-2">
            <div className="space-y-1">
              <span className="bg-purple-500/20 text-purple-300 text-[10px] font-black tracking-widest uppercase py-1 px-3 rounded-full border border-purple-500/30">MATERI KELAS 6: ANALISIS RISIKO SEISMIK & KERENTANAN STRUKTUR</span>
              <h4 className="text-sm font-extrabold text-white">Audit Kerentanan Struktural Non-Fisik 📐</h4>
              <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">Sebagai Siswa Kelas 6, kamu mempelajari rumus indeks risiko bencana: <strong className="text-purple-300">R = (H x V) / C</strong>. Berarti kita bisa menurunkan risiko bencana (<strong className="text-purple-300">R</strong>) dengan memperkuat kapasitas (<strong className="text-purple-300">C</strong>) dan meminimalkan kerentanan perabot ruangan (<strong className="text-purple-300">V</strong>).</p>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-xl border border-purple-500/30 flex flex-col items-center gap-1.5 w-full sm:w-auto text-center">
              <span className="text-[9px] font-bold text-purple-400 uppercase tracking-widest font-mono">MITIGASI STRUKTUR RAUK</span>
              <button onClick={() => setIsBookcaseAnchored(!isBookcaseAnchored)} className={`w-full text-xs font-bold py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${isBookcaseAnchored ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20" : "bg-purple-900/40 hover:bg-purple-800/40 text-purple-300 border border-purple-800"}`}>
                <Hammer className="w-3.5 h-3.5 animate-pulse" />
                {isBookcaseAnchored ? "🗲 Angkur Terpasang!" : "Pasang Angkur Dinding"}
              </button>
              <span className="text-[9px] text-slate-500">{isBookcaseAnchored ? "Buku aman dikunci pada dinding!" : "Lemari rentan roboh, amankan!"}</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-indigo-950">
            <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-[11px]"><span className="text-[9px] text-slate-500 font-mono block">HAZARD (H) / LEVEL</span><span className="text-red-400 font-bold font-mono">Guncangan Tinggi (Msk VII VIII)</span></div>
            <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-[11px]"><span className="text-[9px] text-slate-500 font-mono block">VULNERABILITY (V)</span><span className={`font-bold font-mono ${isBookcaseAnchored ? "text-emerald-400" : "text-amber-500 animate-pulse"}`}>{isBookcaseAnchored ? "Sangat Rendah (Terankur)" : "Tinggi (Lemari Bebas)"}</span></div>
            <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-[11px]"><span className="text-[9px] text-slate-500 font-mono block">CAPACITY (C) INDEKS</span><span className="text-blue-400 font-bold font-mono">Dukungan Proteksi Berlutut</span></div>
          </div>
        </div>
      )}

      <div className="relative w-full h-[min(400px,calc(100vh-12rem))] rounded-3xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-950 cursor-crosshair select-none touch-none">
        <div ref={containerRef} className="w-full h-full" />

        {!isLocked && !isMobile && (
          <div className="absolute top-4 left-4 bg-slate-900/80 text-slate-300 text-[9px] font-bold px-3 py-1.5 rounded-full border border-slate-700 flex items-center gap-1.5 pointer-events-none select-none">🖱️ Klik area 3D untuk lihat-lihat</div>
        )}
        {(isLocked || (isMobile && isShaking)) && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none">
            <div className="w-0.5 h-5 bg-white/40 rounded-full absolute left-1/2 -translate-x-1/2 -top-2.5" />
            <div className="w-5 h-0.5 bg-white/40 rounded-full absolute top-1/2 -translate-y-1/2 -left-2.5" />
          </div>
        )}

        {isShaking && (
          <div className="absolute top-4 right-4 bg-red-600/95 text-white font-mono text-[10px] font-black py-1.5 px-3.5 rounded-full animate-bounce flex items-center gap-2 border border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.7)] pointer-events-none select-none">
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            ⚠️ {grade === 5 ? "SIAGA AWAS: TANAH GOYANG!" : "GAYA SEISMIK AKTIF: GULIR AKSELERASI TANAH"}
          </div>
        )}

        {!isShaking && !selectedChoice && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 gap-4">
            <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500 flex items-center justify-center animate-pulse"><AlertTriangle className="w-8 h-8 text-red-500" /></div>
            <h4 className="text-xl font-black text-white tracking-tight uppercase">{grade === 5 ? "Bumi Siap Bergoyang! 🙀" : "MULAI DIAGNOSIS SEISMIK 3D"}</h4>
            <p className="text-xs text-slate-300 max-w-md leading-relaxed">{grade === 5 ? "Klik tombol merah di bawah untuk mengaktifkan guncangan gempa masif. Bersiap pilih tempat sembunyi terbaik!" : "Uji integritas dinamika ruangan kelas. Aktifkan simulasi percepatan tanah guncangan gempa bumi lalu evaluasi titik lindung raga."}</p>
            <div className="flex flex-col items-center gap-2">
              <button onClick={triggerEarthquake} className="bg-red-600 hover:bg-red-500 text-white font-extrabold py-3 px-8 rounded-xl shadow-lg shadow-red-600/30 text-xs uppercase tracking-widest transition-all hover:scale-105 flex items-center gap-2 cursor-pointer">
                <Play className="w-4 h-4 fill-white" /> {grade === 5 ? "Guncangkan Kamar! 🌋" : "AKTIFKAN SIMULASI SEISMIK"}
              </button>
              {grade === 6 && !isBookcaseAnchored && (
                <span className="text-[10px] text-amber-400 animate-pulse font-bold flex items-center gap-1"><ShieldAlert className="w-3.5 h-3.5" /> Peringatan: Kamu belum mengunci lemari buku! Risiko terlempar buku sangat tinggi.</span>
              )}
            </div>
          </div>
        )}

        {isShaking && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-950/95 backdrop-blur-md p-5 rounded-3xl border border-red-500/40 flex flex-col items-center gap-3 w-11/12 max-w-xl shadow-2xl select-none">
            <p className="text-[11px] font-black text-red-400 font-mono tracking-wider animate-pulse uppercase flex items-center gap-1 px-1 text-center">🚨 {grade === 5 ? "CEPAT! PILIH TEMPAT KESELAMATANMU:" : "INTEGRITAS CRITICAL SECURE! TENTUKAN TANGGAP DARURAT:"}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 w-full">
              <button onClick={() => handleChoice("A")} className="bg-slate-900 hover:bg-emerald-950 border border-slate-800 hover:border-emerald-500 text-slate-200 hover:text-emerald-300 font-bold py-3.5 px-2 rounded-xl text-xs transition flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 font-black flex items-center justify-center border border-emerald-500/30 text-[10px]">A</span>
                {grade === 5 ? "Sembunyi Bawah Meja" : "Proteksi Bawah Meja (Rigid)"}
              </button>
              <button onClick={() => handleChoice("B")} className="bg-slate-900 hover:bg-red-950 border border-slate-800 hover:border-red-500 text-slate-200 hover:text-red-300 font-bold py-3.5 px-2 rounded-xl text-xs transition flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer">
                <span className="w-5 h-5 rounded-full bg-red-500/20 text-red-300 font-black flex items-center justify-center border border-red-500/30 text-[10px]">B</span>
                {grade === 5 ? "Dekat Meja Lemari" : "Berdiam Samping Lemari"}
              </button>
              <button onClick={() => handleChoice("C")} className="bg-slate-900 hover:bg-amber-950 border border-slate-800 hover:border-amber-500 text-slate-200 hover:text-amber-300 font-bold py-3.5 px-2 rounded-xl text-xs transition flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 font-black flex items-center justify-center border border-amber-500/30 text-[10px]">C</span>
                {grade === 5 ? "Lari ke Luar Kamar" : "Evakuasi Lari Keluar"}
              </button>
            </div>
          </div>
        )}

        {selectedChoice && (
          <div className="absolute bottom-4 right-4 bg-slate-950/90 backdrop-blur-md py-2.5 px-4 rounded-xl border border-slate-800 flex items-center gap-2">
            <button onClick={triggerEarthquake} className="text-slate-300 hover:text-white flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider transition cursor-pointer">
              <RotateCcw className="w-3.5 h-3.5 text-rose-500" /> Ulangi Diagnosa
            </button>
          </div>
        )}
      </div>

      <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-850 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
        <span className="text-slate-400 flex items-center gap-1.5"><Info className="w-4 h-4 text-pink-500 flex-shrink-0" />{grade === 5 ? <span>*Bimbel keselamatan Pintar: Anak hebat siap siaga selalu tenang mencontohkan tangguh di kelas.</span> : <span>*Rasio Keberhasilan evakuasi mandiri struktural non-struktural meningkat 92% berkat pemasangan Angkur Mekanis.</span>}</span>
      </div>
    </div>
  );
}
