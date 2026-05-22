'use client';

import { useRef, useEffect, useState } from 'react';
import type { DopantSpeciesId, DopantProfileResult } from '@/lib/analytics/types';
import { computeDopantProfile } from '@/lib/analytics/vpp-engine';
import { ALL_DOPANT_SPECIES, DOPANT_IMPLANT_DATA } from '@/lib/analytics/vpp-constants';

export function DopantPanel() {
  const [selected, setSelected] = useState<DopantSpeciesId[]>(['B', 'P', 'As']);
  const [depthMax, setDepthMax] = useState(500);
  const [scale, setScale] = useState<'log' | 'linear'>('log');
  const [annealTemp, setAnnealTemp] = useState(1000);
  const [annealTime, setAnnealTime] = useState(30);
  const [showActive, setShowActive] = useState(false);
  const [showJunction, setShowJunction] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const result = computeDopantProfile(selected, 0, depthMax, annealTemp, annealTime, showActive);

  useEffect(() => {
    drawDopantProfile(canvasRef.current, result, scale, showJunction, showActive);
  });

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 items-center">
        {ALL_DOPANT_SPECIES.map((sp) => (
          <label key={sp} className="flex items-center gap-1 text-xs text-[var(--smartfactory-text-muted)]">
            <input type="checkbox" aria-label={sp} checked={selected.includes(sp)}
              onChange={(e) => {
                if (e.target.checked) setSelected([...selected, sp]);
                else setSelected(selected.filter((s) => s !== sp));
              }} />
            <span className="inline-block w-2 h-2 rounded-sm" style={{ backgroundColor: DOPANT_IMPLANT_DATA[sp].color }} />
            {sp}
          </label>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex items-center gap-1">
          <label className="text-xs text-[var(--smartfactory-text-muted)]">Depth:</label>
          <input type="range" min={100} max={2000} step={50} value={depthMax}
            onChange={(e) => setDepthMax(Number(e.target.value))} className="w-20" />
          <span className="text-xs text-[var(--smartfactory-text-secondary)]">{depthMax} nm</span>
        </div>
        {([['log', 'Log'], ['linear', 'Linear']] as const).map(([val, label]) => (
          <button key={val} onClick={() => setScale(val)}
            className={`px-2 py-1 text-xs rounded ${scale === val ? 'bg-blue-600 text-white' : 'bg-[var(--smartfactory-bg-base)] text-[var(--smartfactory-text-secondary)] border border-[var(--smartfactory-border-default)]'}`}>
            {label}
          </button>
        ))}
        {([['Total', false], ['Active', true]] as const).map(([label, val]) => (
          <button key={label} onClick={() => setShowActive(val as boolean)}
            className={`px-2 py-1 text-xs rounded ${showActive === val ? 'bg-blue-600 text-white' : 'bg-[var(--smartfactory-bg-base)] text-[var(--smartfactory-text-secondary)] border border-[var(--smartfactory-border-default)]'}`}>
            {label}
          </button>
        ))}
        <label className="flex items-center gap-1 text-xs text-[var(--smartfactory-text-muted)]">
          <input type="checkbox" checked={showJunction} onChange={(e) => setShowJunction(e.target.checked)} />
          Junction Xj
        </label>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex items-center gap-1">
          <label className="text-xs text-[var(--smartfactory-text-muted)]">Anneal T:</label>
          <input type="range" min={800} max={1200} step={10} value={annealTemp}
            onChange={(e) => setAnnealTemp(Number(e.target.value))} className="w-20" />
          <span className="text-xs text-[var(--smartfactory-text-secondary)]">{annealTemp}&deg;C</span>
        </div>
        <div className="flex items-center gap-1">
          <label className="text-xs text-[var(--smartfactory-text-muted)]">Time:</label>
          <input type="range" min={1} max={120} step={1} value={annealTime}
            onChange={(e) => setAnnealTime(Number(e.target.value))} className="w-20" />
          <span className="text-xs text-[var(--smartfactory-text-secondary)]">{annealTime} min</span>
        </div>
      </div>

      <canvas ref={canvasRef} data-testid="dopant-profile-canvas" width={500} height={250}
        className="w-full bg-[var(--smartfactory-bg-base)] rounded" />

      <div className="flex flex-wrap gap-3 text-xs text-[var(--smartfactory-text-muted)]">
        {result.species.map((sp) => (
          <span key={sp.species}>
            <span className="inline-block w-2 h-2 rounded-sm mr-1" style={{ backgroundColor: sp.color }} />
            {sp.species}: Peak {sp.peakConcentration.toExponential(1)} cm&sup3; | Xj {sp.junctionDepth.toFixed(0)} nm | Dose {sp.dose.toExponential(1)} cm&sup2;
          </span>
        ))}
      </div>
    </div>
  );
}

function drawDopantProfile(
  canvas: HTMLCanvasElement | null,
  result: DopantProfileResult,
  scale: 'log' | 'linear',
  showJunction: boolean,
  showActive: boolean,
) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width: W, height: H } = canvas;
  ctx.clearRect(0, 0, W, H);
  if (result.species.length === 0) return;

  const pad = 50;
  const allProfiles = result.species.flatMap((s) => s.profile);
  const maxDepth = Math.max(...allProfiles.map((p) => p.depth));
  const toX = (d: number) => pad + (d / (maxDepth || 1)) * (W - 2 * pad);

  let toY: (c: number) => number;
  if (scale === 'log') {
    const logMin = 14;
    const logMax = 21;
    toY = (c: number) => {
      const logC = Math.log10(Math.max(c, 1e14));
      return H - pad - ((logC - logMin) / (logMax - logMin)) * (H - 2 * pad);
    };
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 0.5;
    for (let exp = logMin; exp <= logMax; exp++) {
      const y = toY(Math.pow(10, exp));
      ctx.beginPath();
      ctx.moveTo(pad, y);
      ctx.lineTo(W - pad, y);
      ctx.stroke();
      ctx.fillStyle = '#64748B';
      ctx.font = '9px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`10^${exp}`, pad - 4, y + 3);
    }
  } else {
    const maxC = Math.max(...allProfiles.map((p) => p.concentration));
    toY = (c: number) => H - pad - (c / (maxC || 1)) * (H - 2 * pad);
  }

  // Background doping line
  ctx.strokeStyle = '#475569';
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  const bgY = toY(result.backgroundDoping);
  ctx.moveTo(pad, bgY);
  ctx.lineTo(W - pad, bgY);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#475569';
  ctx.font = '9px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('N_sub', W - pad + 4, bgY + 3);

  // Draw profiles
  for (const sp of result.species) {
    ctx.strokeStyle = sp.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    sp.profile.forEach((pt, i) => {
      const x = toX(pt.depth);
      const c = showActive ? pt.activeConcentration : pt.concentration;
      const y = toY(c);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();

    if (showActive) {
      ctx.strokeStyle = sp.color + '88';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      sp.profile.forEach((pt, i) => {
        const x = toX(pt.depth);
        const y = toY(pt.concentration);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (showJunction && sp.junctionDepth > 0 && sp.junctionDepth < maxDepth) {
      const jx = toX(sp.junctionDepth);
      ctx.strokeStyle = sp.color;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(jx, pad);
      ctx.lineTo(jx, H - pad);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = sp.color;
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`Xj=${sp.junctionDepth.toFixed(0)}`, jx, pad - 4);
    }
  }

  ctx.fillStyle = '#94A3B8';
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('Depth (nm)', W / 2, H - 4);
  ctx.save();
  ctx.translate(12, H / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('Concentration (cm\u207B\u00B3)', 0, 0);
  ctx.restore();
}
