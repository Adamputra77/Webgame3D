import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Play, HelpCircle, Shield } from "lucide-react";

interface Map3DProps {
  onSelectMission: (missionId: "earthquake" | "flood" | "volcano") => void;
  completedMissions: string[];
}

export default function Map3D({ onSelectMission, completedMissions }: Map3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredMission, setHoveredMission] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Create scene, camera, renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xF0F9FF); // Bright morning blue sky: sky-50

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 10, 15);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);

    // Grid helper as ocean map grid lines
    const grid = new THREE.GridHelper(24, 24, 0xBAE6FD, 0xBAE6FD); // Nice ocean grid layout
    grid.position.y = -0.5;
    scene.add(grid);

    // Lights - Boost light values for maximum clarity and child-friendly atmosphere
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight.position.set(5, 12, 10);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0x0284C7, 1.2, 35); // Soft blue sun bounce
    pointLight.position.set(0, 5, 0);
    scene.add(pointLight);

    // Represent Indonesia's Archipelago with procedural "islands"
    const islandsGroup = new THREE.Group();
    scene.add(islandsGroup);

    const islandMaterial = new THREE.MeshStandardMaterial({
      color: 0x22C55E, // Playful bright forest green: emerald-500
      roughness: 0.5,
      metalness: 0.05,
    });

    const createIsland = (x: number, z: number, scaleX: number, scaleZ: number, h = 0.5) => {
      const geo = new THREE.BoxGeometry(scaleX, h, scaleZ);
      const mesh = new THREE.Mesh(geo, islandMaterial);
      mesh.position.set(x, h / 2 - 0.5, z);
      mesh.receiveShadow = true;
      mesh.castShadow = true;
      islandsGroup.add(mesh);
    };

    // Procedural major islands of Indonesia
    createIsland(-6, 2, 2.8, 0.9);   // Sumatra (top-left slanted)
    createIsland(-5, 1.2, 1.5, 0.8);
    createIsland(-1, 2.5, 2.5, 0.6);   // Jawa
    createIsland(1, 2.5, 1.0, 0.5);   // Bali & Nusa Tenggara
    createIsland(-0.5, -0.6, 2.2, 1.8); // Kalimantan
    createIsland(2.5, -0.3, 1.6, 1.4);  // Sulawesi (complex shape proxy)
    createIsland(5.8, 0.2, 2.2, 1.3);   // Papua

    // Ocean blue plane
    const oceanGeo = new THREE.PlaneGeometry(100, 100);
    const oceanMat = new THREE.MeshStandardMaterial({
      color: 0x0EA5E9, // Brilliant glistening tropical ocean blue: sky-500
      roughness: 0.1,
      metalness: 0.45,
    });
    const ocean = new THREE.Mesh(oceanGeo, oceanMat);
    ocean.rotation.x = -Math.PI / 2;
    ocean.position.y = -0.55;
    ocean.receiveShadow = true;
    scene.add(ocean);

    // Create 3 glowing mission markers
    const missions = [
      { id: "earthquake", name: "Gempa Bumi (Sumatera-Jawa)", pos: [-3, 0.2, 2.4], color: 0xef4444 }, // red
      { id: "flood", name: "Mitigasi Banjir (Kota)", pos: [-0.5, 0.2, -0.2], color: 0x3b82f6 },      // blue
      { id: "volcano", name: "Gunung Meletus (Merapi)", pos: [0.8, 0.2, 2.2], color: 0xf59e0b },    // orange
    ];

    const markersGroup = new THREE.Group();
    scene.add(markersGroup);

    const markerMeshes: THREE.Mesh[] = [];

    missions.forEach((m) => {
      // Cylinder base
      const pinGeo = new THREE.CylinderGeometry(0.01, 0.25, 0.8, 16);
      const pinMat = new THREE.MeshStandardMaterial({
        color: m.color,
        emissive: m.color,
        emissiveIntensity: 0.5,
      });
      const pin = new THREE.Mesh(pinGeo, pinMat);
      pin.position.set(m.pos[0], m.pos[1], m.pos[2]);
      pin.castShadow = true;
      pin.userData = { id: m.id, name: m.name };
      markersGroup.add(pin);
      markerMeshes.push(pin);

      // Fluorescent glowing ring
      const ringGeo = new THREE.RingGeometry(0.1, 0.4, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: m.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(m.pos[0], m.pos[1] - 0.15, m.pos[2]);
      markersGroup.add(ring);
    });

    // Raycaster for hover/click interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleMouseMove = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(markerMeshes);

      if (intersects.length > 0) {
        setHoveredMission(intersects[0].object.userData.name);
        document.body.style.cursor = "pointer";
      } else {
        setHoveredMission(null);
        document.body.style.cursor = "default";
      }
    };

    const handleMouseClick = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(markerMeshes);

      if (intersects.length > 0) {
        const id = intersects[0].object.userData.id as "earthquake" | "flood" | "volcano";
        onSelectMission(id);
      }
    };

    renderer.domElement.addEventListener("mousemove", handleMouseMove);
    renderer.domElement.addEventListener("click", handleMouseClick);

    // Animation loop
    let reqId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      reqId = requestAnimationFrame(animate);

      const elapsed = clock.getElapsedTime();

      // Rotate group slightly
      islandsGroup.rotation.y = Math.sin(elapsed * 0.05) * 0.05;

      // Animate pin indicators (bounce & shine)
      markerMeshes.forEach((mesh, index) => {
        mesh.position.y = 0.2 + Math.sin(elapsed * 2.5 + index) * 0.12;
        mesh.rotation.y += 0.02;
      });

      renderer.render(scene, camera);
    };

    animate();

    // Clean up
    return () => {
      cancelAnimationFrame(reqId);
      if (renderer.domElement && containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      document.body.style.cursor = "default";
    };
  }, [onSelectMission]);

  return (
    <div className="relative w-full h-[500px] rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
      <div ref={containerRef} className="w-full h-full" id="java-ocean-3d" />

      {/* Title Header */}
      <div className="absolute top-4 left-4 bg-slate-950/85 backdrop-blur-md px-4 py-3 rounded-xl border border-blue-500/30">
        <h4 className="text-sm font-bold text-blue-400 tracking-wider font-sans uppercase">
          Eksplorasi Nusantara 3D Map
        </h4>
        <p className="text-xs text-slate-300">
          Arahkan kursor dan klik pada pin aktivitas bergelombang
        </p>
      </div>

      {/* Floating Mission Select Menu */}
      <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 bg-slate-950/85 backdrop-blur-md p-4 rounded-xl border border-slate-800 flex flex-col md:w-80 gap-3">
        <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-emerald-400" /> Pilih Misi Tanggap Bencana:
        </h5>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => onSelectMission("earthquake")}
            className={`w-full py-2.5 px-3 rounded-lg text-left text-xs font-medium flex items-center justify-between border transition-all ${
              completedMissions.includes("earthquake")
                ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                : "bg-slate-900 border-slate-800 text-slate-200 hover:border-red-500/40 hover:bg-slate-800"
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-md animate-pulse" />
              Misi 1: Zona Gempa Bumi
            </span>
            <span className="text-[10px] bg-red-950 text-red-400 px-2 py-0.5 rounded">
              {completedMissions.includes("earthquake") ? "Selesai ✓" : "Aktif"}
            </span>
          </button>

          <button
            onClick={() => onSelectMission("flood")}
            className={`w-full py-2.5 px-3 rounded-lg text-left text-xs font-medium flex items-center justify-between border transition-all ${
              completedMissions.includes("flood")
                ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                : "bg-slate-900 border-slate-800 text-slate-200 hover:border-blue-500/40 hover:bg-slate-800"
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-md animate-pulse" />
              Misi 2: Banjir & Drainase Kota
            </span>
            <span className="text-[10px] bg-blue-950 text-blue-400 px-2 py-0.5 rounded">
              {completedMissions.includes("flood") ? "Selesai ✓" : "Aktif"}
            </span>
          </button>

          <button
            onClick={() => onSelectMission("volcano")}
            className={`w-full py-2.5 px-3 rounded-lg text-left text-xs font-medium flex items-center justify-between border transition-all ${
              completedMissions.includes("volcano")
                ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                : "bg-slate-900 border-slate-800 text-slate-200 hover:border-amber-500/40 hover:bg-slate-800"
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-md animate-pulse" />
              Misi 3: Gunung Berapi Aktif
            </span>
            <span className="text-[10px] bg-amber-950 text-amber-400 px-2 py-0.5 rounded">
              {completedMissions.includes("volcano") ? "Selesai ✓" : "Aktif"}
            </span>
          </button>
        </div>
      </div>

      {/* Floating Hover Indicator */}
      {hoveredMission && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none bg-slate-950/90 text-white px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-bold font-mono">
          {hoveredMission}
        </div>
      )}
    </div>
  );
}
