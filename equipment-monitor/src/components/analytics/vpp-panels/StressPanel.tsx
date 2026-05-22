'use client';

import { useRef, useEffect, useState } from 'react';
import type { PipelineStepResult, SubstrateType, StressMode } from '@/lib/analytics/types';
import { computeStressProfile } from '@/lib/analytics/vpp-engine';
import { STEP_SHORT_NAMES } from '@/lib/analytics/constants';

interface Props {
  perStep: PipelineStepResult[];
}

const SUBSTRATE_OPTIONS: SubstrateType[] = ['Si(100)', 'Si(111)', 'SiGe', 'SOI'];
const MODE_OPTIONS: { value: StressMode; label: string }[] = [
  { value: 'biaxial', label: 'Biaxial' },
  { value: 'plane-stress', label: 'Plane Stress' },
  { value: 'plane-strain', label: 'Plane Strain' },
];

export function StressPanel({ perStep }: Props) {
  const [mode, setMode] = useState<StressMode>('biaxial');
  const [substrate, setSubstrate] = useState<SubstrateType>('Si(100)');
  const [tempC, setTempC] = useState(25);
  const [showYield, setShowYield] = useState(false);
  const [hiddenSteps, setHiddenSteps] = useState<Set<string>>(new Set());

  const barRef = useRef<HTMLCanvasElement>(null);
  const cumRef = useRef<HTMLCanvasElement>(null);

  const profile = computeStressProfile(perStep, substrate, tempC, mode);
  const visibleLayers = profile.layers.filter((l) => !hiddenSteps.has(l.stepId));

  useEffect(() => {
    drawStressBar(barRef.current, visibleLayers);
    drawCumulativeStress(cumRef.current, profile.cumulativeStress);
  });

  const bowColor = profile.waferBow < 25 ? 'text-green-400' : profile.waferBow < 50 ? 'text-amber-400' : 'text-red-400';

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 items-center">
        {MODE_OPTIONS.map((m) => (
          <button key={m.value} onClick={() => setMode(m.value)}
            className={`px-2 py-1 text-xs rounded ${mode === m.value ? 'bg-blue-600 text-white' : 'bg-[var(--smartfactory-bg-base)] text-[var(--smartfactory-text-secondary)] border border-[var(--smartfactory-border-default)]'}`}>
            {m.label}
          </button>
        ))}
        <select value={substrate} onChange={(e) => setSubstrate(e.target.value as SubstrateType)}
          className="text-xs bg-[var(--smartfactory-bg-base)] border border-[var(--smartfactory-border-default)] rounded px-2 py-1 text-[var(--smartfactory-text-primary)]">
          {SUBSTRATE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="flex items-center gap-1">
          <label className="text-xs text-[var(--smartfactory-text-muted)]">T:</label>
          <input type="range" min={25} max={400} value={tempC} onChange={(e) => setTempC(Number(e.target.value))}
            className="w-20" />
          <span className="text-xs text-[var(--smartfactory-text-secondary)]">{tempC}°C</span>
        </div>
        <label className="flex items-center gap-1 text-xs text-[var(--smartfactory-text-muted)]">
          <input type="checkbox" checked={showYield} onChange={(e) => setShowYield(e.target.checked)} />
          Yield Strength
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        {profile.layers.map((l) => (
          <label key={l.stepId} className="flex items-center gap-1 text-xs text-[var(--smartfactory-text-muted)]">
            <input type="checkbox" checked={!hiddenSteps.has(l.stepId)}
              onChange={(e) => {
                const next = new Set(hiddenSteps);
                if (e.target.checked) next.delete(l.stepId); else next.add(l.stepId);
                setHiddenSteps(next);
              }} />
            {STEP_SHORT_NAMES[l.stepId]}
          </label>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <canvas ref={barRef} data-testid="stress-bar-canvas" width={400} height={180}
          className="w-full bg-[var(--smartfactory-bg-base)] rounded" />
        <canvas ref={cumRef} data-testid="stress-cumulative-canvas" width={400} height={180}
          className="w-full bg-[var(--smartfactory-bg-base)] rounded" />
      </div>

      <div className="flex gap-4 text-xs">
        <span className="text-[var(--smartfactory-text-muted)]">Net: <strong className="text-[var(--smartfactory-text-primary)]">{profile.netStress > 0 ? '+' : ''}{profile.netStress.toFixed(0)} MPa</strong> ({profile.netStress > 0 ? 'tensile' : 'compressive'})</span>
        <span className="text-[var(--smartfactory-text-muted)]">Bow: <strong className={bowColor}>{profile.waferBow.toFixed(1)} µm</strong></span>
      </div>
    </div>
  );
}

function drawStressBar(canvas: HTMLCanvasElement | null, layers: { stepId: string; totalStress: number; material: string }[]) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width: W, height: H } = canvas;
  ctx.clearRect(0, 0, W, H);
  if (layers.length === 0) return;

  const pad = 30;
  const maxAbs = Math.max(...layers.map((l) => Math.abs(l.totalStress)), 100);
  const barH = (H - 2 * pad) / layers.length * 0.7;
  const gap = (H - 2 * pad) / layers.length * 0.3;
  const zeroX = W / 2;

  ctx.strokeStyle = '#475569';
  ctx.beginPath();
  ctx.moveTo(zeroX, pad);
  ctx.lineTo(zeroX, H - pad);
  ctx.stroke();

  layers.forEach((l, i) => {
    const y = pad + i * (barH + gap);
    const barLen = (l.totalStress / maxAbs) * (W / 2 - pad);
    const x = l.totalStress >= 0 ? zeroX : zeroX + barLen;
    const w = Math.abs(barLen);
    ctx.fillStyle = l.totalStress >= 0 ? '#3B82F688' : '#EF444488';
    ctx.fillRect(x, y, w, barH);
    ctx.fillStyle = '#94A3B8';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(STEP_SHORT_NAMES[l.stepId as keyof typeof STEP_SHORT_NAMES] ?? l.stepId, zeroX - (W / 2 - pad) - 4, y + barH / 2 + 4);
    ctx.textAlign = l.totalStress >= 0 ? 'left' : 'right';
    ctx.fillText(`${l.totalStress > 0 ? '+' : ''}${l.totalStress.toFixed(0)}`, x + (l.totalStress >= 0 ? w + 4 : -4), y + barH / 2 + 4);
  });

  ctx.fillStyle = '#64748B';
  ctx.font = '9px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('Compressive', pad + (zeroX - pad) / 2, H - 4);
  ctx.fillText('Tensile', zeroX + (W - pad - zeroX) / 2, H - 4);
}

function drawCumulativeStress(canvas: HTMLCanvasElement | null, points: { depth: number; stress: number }[]) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width: W, height: H } = canvas;
  ctx.clearRect(0, 0, W, H);
  if (points.length < 2) return;

  const pad = 30;
  const maxDepth = Math.max(...points.map((p) => p.depth));
  const stresses = points.map((p) => p.stress);
  const minS = Math.min(...stresses, 0);
  const maxS = Math.max(...stresses, 0);
  const sRange = maxS - minS || 1;

  const toX = (s: number) => pad + ((s - minS) / sRange) * (W - 2 * pad);
  const toY = (d: number) => pad + (d / (maxDepth || 1)) * (H - 2 * pad);

  ctx.strokeStyle = '#475569';
  ctx.setLineDash([2, 2]);
  ctx.beginPath();
  ctx.moveTo(toX(0), pad);
  ctx.lineTo(toX(0), H - pad);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.strokeStyle = '#22D3EE';
  ctx.lineWidth = 2;
  ctx.beginPath();
  points.forEach((p, i) => {
    const x = toX(p.stress);
    const y = toY(p.depth);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.stroke();

  points.forEach((p) => {
    ctx.fillStyle = '#22D3EE';
    ctx.beginPath();
    ctx.arc(toX(p.stress), toY(p.depth), 3, 0, 2 * Math.PI);
    ctx.fill();
  });

  ctx.fillStyle = '#94A3B8';
  ctx.font = '10px monospace';
  ctx.fillText('Stress (MPa)', pad, pad - 8);
  ctx.textAlign = 'right';
  ctx.fillText('Depth →', W - pad, H - 4);
}
