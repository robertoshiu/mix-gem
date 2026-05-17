'use client';

import { useEffect, useRef, useState } from 'react';
import { initSurveillanceScene } from '@/lib/surveillance/main';

const CAMERA_LABELS = [
  'NW 走廊', '俯視全景', 'NE 走廊',
  '微影區特寫', '中控追蹤', '化學品特寫',
  '設備區', 'AR 視角', '出入口',
];

export default function SurveillancePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const canvases = containerRef.current.querySelectorAll<HTMLCanvasElement>('.cam-canvas');
    if (canvases.length !== 9) return;

    let cancelled = false;

    initSurveillanceScene(Array.from(canvases))
      .then((cleanup) => {
        if (cancelled) {
          cleanup();
          return;
        }
        cleanupRef.current = cleanup;
        setLoading(false);
      })
      .catch((e) => {
        if (!cancelled) {
          setError((e as Error).message);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, []);

  return (
    <div className="surveillance-page">
      {loading && (
        <div className="loading-overlay">
          <div className="loading-text">
            {error ? `Error: ${error}` : '載入監控場景中...'}
          </div>
        </div>
      )}
      <div className="grid-3x3" ref={containerRef}>
        {CAMERA_LABELS.map((label, i) => (
          <div key={i} className="cam-cell" data-cam-index={i}>
            <canvas className="cam-canvas" />
            <div className="cam-label">{label}</div>
            <div className="cam-border" />
            {i === 7 && (
              <div className="standby-overlay">
                <span className="standby-text">STANDBY</span>
              </div>
            )}
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

.loading-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
}

.loading-text {
  font-family: 'Fira Code', monospace;
  font-size: 13px;
  color: #0ff;
  animation: pulse-text 1.5s ease-in-out infinite;
}

@keyframes pulse-text {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
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
  transition: color 0.3s;
}

.cam-label.ar-active {
  color: #ff4444;
  text-shadow: 0 0 6px rgba(255, 0, 0, 0.6);
}

.cam-border {
  position: absolute;
  inset: 0;
  border: 2px solid transparent;
  pointer-events: none;
  transition: border-color 0.3s, box-shadow 0.3s;
  z-index: 1;
}

.cam-cell[data-alert] .cam-border {
  border-color: #ff0000;
  animation: flash-border 0.5s ease-in-out 6 alternate;
}

.cam-cell[data-ar-swap] .cam-border {
  border-color: #ff0000;
  box-shadow: inset 0 0 20px rgba(255, 0, 0, 0.15);
}

@keyframes flash-border {
  from { border-color: #ff0000; }
  to { border-color: transparent; }
}

.cam-cell[data-cam-index="4"] {
  outline: 1px solid #333;
  cursor: pointer;
}

.cam-cell[data-cam-index="4"]:hover .cam-border {
  border-color: rgba(0, 255, 255, 0.3);
}

.standby-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 3;
}

.standby-text {
  font-family: 'Fira Code', monospace;
  font-size: 12px;
  color: #444;
  letter-spacing: 0.2em;
  text-transform: uppercase;
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
  background: rgba(20, 0, 0, 0.92);
  border: 1px solid #f00;
  border-radius: 4px;
  padding: 8px 10px;
  font-family: 'Fira Code', monospace;
  font-size: 11px;
  color: #fff;
  transition: opacity 0.3s, border-color 0.3s;
}

.alert-item .alert-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.alert-item .alert-time {
  color: #888;
  font-size: 10px;
}

.alert-item .alert-zone {
  color: #ff4444;
  font-weight: bold;
  margin-bottom: 2px;
}

.alert-item .alert-person {
  color: #ccc;
  font-size: 10px;
  margin-bottom: 6px;
}

.alert-item .alert-severity {
  display: inline-block;
  padding: 1px 4px;
  border-radius: 2px;
  font-size: 9px;
}

.alert-item .alert-severity.critical { background: #900; color: #fff; }
.alert-item .alert-severity.high { background: #960; color: #fff; }
.alert-item .alert-severity.medium { background: #660; color: #fff; }

.alert-item .alert-actions {
  display: flex;
  gap: 6px;
}

.alert-item button {
  background: #222;
  border: 1px solid #555;
  color: #0ff;
  font-family: 'Fira Code', monospace;
  font-size: 10px;
  padding: 3px 10px;
  cursor: pointer;
  border-radius: 2px;
  transition: background 0.2s, border-color 0.2s;
}

.alert-item button:hover {
  background: #333;
  border-color: #0ff;
}

.alert-item .btn-view-ar {
  color: #0ff;
  border-color: #0ff;
}

.alert-item .btn-ack {
  color: #aaa;
  border-color: #444;
}

.alert-item .btn-ack:hover {
  color: #fff;
  border-color: #888;
}
`;
