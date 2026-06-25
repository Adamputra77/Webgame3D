import React, { useRef, useCallback } from "react";

interface TouchControlsProps {
  keysRef: React.MutableRefObject<{ w: boolean; a: boolean; s: boolean; d: boolean }>;
  yawRef: React.MutableRefObject<number>;
  pitchRef: React.MutableRefObject<number>;
  enabled: boolean;
  pitchMin?: number;
  pitchMax?: number;
}

export default function TouchControls({
  keysRef, yawRef, pitchRef, enabled, pitchMin = -Math.PI / 3, pitchMax = Math.PI / 3,
}: TouchControlsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const joystickId = useRef<number | null>(null);
  const lookId = useRef<number | null>(null);
  const joystickOrigin = useRef({ x: 0, y: 0 });
  const lastLook = useRef({ x: 0, y: 0 });

  const resetKeys = useCallback(() => {
    keysRef.current.w = false;
    keysRef.current.a = false;
    keysRef.current.s = false;
    keysRef.current.d = false;
  }, [keysRef]);

  const updateJoystick = useCallback((tx: number, ty: number) => {
    const dx = tx - joystickOrigin.current.x;
    const dy = ty - joystickOrigin.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxDist = 60;
    const clamped = Math.min(dist, maxDist) / maxDist;
    const nx = dist > 0 ? (dx / dist) * clamped : 0;
    const ny = dist > 0 ? (dy / dist) * clamped : 0;
    const deadzone = 0.2;
    keysRef.current.w = ny < -deadzone;
    keysRef.current.s = ny > deadzone;
    keysRef.current.a = nx < -deadzone;
    keysRef.current.d = nx > deadzone;
  }, [keysRef]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (!enabled) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) continue;
      const relX = t.clientX - rect.left;
      const inLeft = relX < rect.width * 0.35;
      if (inLeft && joystickId.current === null) {
        joystickId.current = t.identifier;
        joystickOrigin.current = { x: t.clientX, y: t.clientY };
        updateJoystick(t.clientX, t.clientY);
      } else if (!inLeft && lookId.current === null) {
        lookId.current = t.identifier;
        lastLook.current = { x: t.clientX, y: t.clientY };
      }
    }
  }, [enabled, updateJoystick]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!enabled) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === joystickId.current) {
        updateJoystick(t.clientX, t.clientY);
      }
      if (t.identifier === lookId.current) {
        const dx = t.clientX - lastLook.current.x;
        const dy = t.clientY - lastLook.current.y;
        yawRef.current -= dx * 0.005;
        pitchRef.current -= dy * 0.005;
        pitchRef.current = Math.max(pitchMin, Math.min(pitchMax, pitchRef.current));
        lastLook.current = { x: t.clientX, y: t.clientY };
      }
    }
  }, [enabled, updateJoystick, yawRef, pitchRef, pitchMin, pitchMax]);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === joystickId.current) {
        joystickId.current = null;
        resetKeys();
      }
      if (t.identifier === lookId.current) {
        lookId.current = null;
      }
    }
  }, [resetKeys]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-10 touch-none select-none"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
    >
      <div className="absolute bottom-8 left-6 w-20 h-20 rounded-full border-2 border-white/20 bg-white/5 pointer-events-none" />
    </div>
  );
}
