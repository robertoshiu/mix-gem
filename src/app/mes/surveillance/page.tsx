'use client';

import { useEffect, useRef } from 'react';
import { initSurveillanceScene } from '@/lib/surveillance/main';

const CAMERA_LABELS = [
  'CCTV-NW', '俯視全景', 'CCTV-NE',
  '微影區', '主視角', '化學品區',
  'CCTV-SW', 'AR 視角', 'CCTV-SE',
];

export default function SurveillancePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const canvases = containerRef.current.querySelectorAll<HTMLCanvasElement>('.cam-canvas');
    if (canvases.length !== 9) return;

    const cleanup = initSurveillanceScene(Array.from(canvases));
    cleanupRef.current = cleanup;

    return () => {
      cleanup();
      cleanupRef.current = null;
    };
  }, []);

  return (
    <div className="surveillance-page">
      <div className="grid-3x3" ref={containerRef}>
        {CAMERA_LABELS.map((label, i) => (
          <div key={i} className="cam-cell" data-cam-index={i}>
            <canvas className="cam-canvas" />
            <div className="cam-label">{label}</div>
            <div className="cam-border" />
          </div>
        ))}
      </div>
      <div id="alert-panel" className="alert-panel" />
      <style>{gridStyles}</style>
    </div>
  );
}

const gridStyles = `
.surveillance-page {
  position: fixed;
  inset: 0;
  background: #000;
  overflow: hidden;
}

.grid-3x3 {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-rows: 1fr 1fr 1fr;
  width: 100vw;
  height: 100vh;
  gap: 2px;
  background: #111;
}

.cam-cell {
  position: relative;
  overflow: hidden;
  background: #0a0a0a;
}

.cam-canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.cam-label {
  position: absolute;
  top: 6px;
  left: 8px;
  font-family: 'Fira Code', monospace;
  font-size: 11px;
  color: #0f0;
  background: rgba(0, 0, 0, 0.7);
  padding: 2px 6px;
  border-radius: 2px;
  pointer-events: none;
  z-index: 2;
}

.cam-border {
  position: absolute;
  inset: 0;
  border: 2px solid transparent;
  pointer-events: none;
  transition: border-color 0.3s;
  z-index: 1;
}

.cam-cell[data-alert] .cam-border {
  border-color: #ff0000;
  animation: flash-border 0.5s ease-in-out 6 alternate;
}

@keyframes flash-border {
  from { border-color: #ff0000; }
  to { border-color: transparent; }
}

.cam-cell[data-cam-index="4"] {
  outline: 1px solid #333;
}

.alert-panel {
  position: fixed;
  top: 12px;
  right: 12px;
  width: 320px;
  max-height: 50vh;
  overflow-y: auto;
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 6px;
  pointer-events: none;
}

.alert-panel > * {
  pointer-events: auto;
}

.alert-item {
  background: rgba(20, 0, 0, 0.9);
  border: 1px solid #f00;
  border-radius: 4px;
  padding: 8px 10px;
  font-family: 'Fira Code', monospace;
  font-size: 11px;
  color: #fff;
}

.alert-item .alert-time {
  color: #888;
  font-size: 10px;
}

.alert-item .alert-zone {
  color: #ff4444;
  font-weight: bold;
}

.alert-item .alert-severity {
  display: inline-block;
  padding: 1px 4px;
  border-radius: 2px;
  font-size: 9px;
  margin-left: 6px;
}

.alert-item .alert-severity.critical { background: #900; }
.alert-item .alert-severity.high { background: #960; }
.alert-item .alert-severity.medium { background: #660; }

.alert-item button {
  margin-top: 4px;
  background: #222;
  border: 1px solid #555;
  color: #0ff;
  font-size: 10px;
  padding: 2px 8px;
  cursor: pointer;
  border-radius: 2px;
}

.alert-item button:hover {
  background: #333;
  border-color: #0ff;
}
`;
