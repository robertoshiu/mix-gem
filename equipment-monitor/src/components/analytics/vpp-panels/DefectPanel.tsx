'use client';

import { useRef, useEffect, useState } from 'react';
import type { PipelineStepResult, DefectSource } from '@/lib/analytics/types';
import { computeDefectMap } from '@/lib/analytics/vpp-engine';
import { STEP_SHORT_NAMES } from '@/lib/analytics/constants';
import {
  DEFECT_SOURCES, DEFECT_SOURCE_COLORS, DEFAULT_KILL_RATIOS,
} from '@/lib/analytics/vpp-constants';

interface Props {
  perStep: PipelineStepResult[];
}

type SortOrder = 'by-step' | 'by-severity' | 'by-layer';

export function DefectPanel({ perStep }: Props) {
  const [sortOrder, setSortOrder] = useState<SortOrder>('by-step');
  const [viewMode, setViewMode] = useState<'per-step' | 'cumulative'>('per-step');
  const [ceiling, setCeiling] = useState(1.5);
  const [killRatios, setKillRatios] = useState<Record<DefectSource, number>>({ ...DEFAULT_KILL_RATIOS });
  const [enabledSources, setEnabledSources] = useState<DefectSource[]>([...DEFECT_SOURCES]);

  const barRef = useRef<HTMLCanvasElement>(null);
  const waferRef = useRef<HTMLCanvasElement>(null);

  const defects = computeDefectMap(perStep, killRatios, enabledSources);

  const sortedSteps = [...defects.perStep];
  if (sortOrder === 'by-severity') sortedSteps.sort((a, b) => b.killerD0 - a.killerD0);

  useEffect(() => {
    drawDefectBars(barRef.current, sortedSteps, defects.paretoPoints, ceiling);
    drawWaferMap(waferRef.current, defects.waferDots);
  });

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 items-center">
        {([['by-step', 'By Step'], ['by-severity', 'By Severity'], ['by-layer', 'By Layer']] as const).map(([val, label]) => (
          <button key={val} onClick={() => setSortOrder(val)}
            className={`px-2 py-1 text-xs rounded ${sortOrder === val ? 'bg-blue-600 text-white' : 'bg-[var(--smartfactory-bg-base)] text-[var(--smartfactory-text-secondary)] border border-[var(--smartfactory-border-default)]'}`}>
            {label}
          </button>
        ))}
        {([['per-step', 'Per-Step'], ['cumulative', 'Cumulative']] as const).map(([val, label]) => (
          <button key={val} onClick={() => setViewMode(val)}
            className={`px-2 py-1 text-xs rounded ${viewMode === val ? 'bg-blue-600 text-white' : 'bg-[var(--smartfactory-bg-base)] text-[var(--smartfactory-text-secondary)] border border-[var(--smartfactory-border-default)]'}`}>
            {label}
          </button>
        ))}
        <div className="flex items-center gap-1">
          <label className="text-xs text-[var(--smartfactory-text-muted)]">D&#x2080; Ceiling:</label>
          <input type="range" min={0.1} max={3} step={0.1} value={ceiling} onChange={(e) => setCeiling(Number(e.target.value))} className="w-16" />
          <span className="text-xs text-[var(--smartfactory-text-secondary)]">{ceiling.toFixed(1)}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {DEFECT_SOURCES.map((src) => (
          <div key={src} className="flex items-center gap-1">
            <label className="flex items-center gap-1 text-xs text-[var(--smartfactory-text-muted)]">
              <input type="checkbox" checked={enabledSources.includes(src)}
                onChange={(e) => {
                  if (e.target.checked) setEnabledSources([...enabledSources, src]);
                  else setEnabledSources(enabledSources.filter((s) => s !== src));
                }} />
              <span className="inline-block w-2 h-2 rounded-sm" style={{ backgroundColor: DEFECT_SOURCE_COLORS[src] }} />
              {src}
            </label>
            <input type="range" min={0} max={1} step={0.05} value={killRatios[src]}
              onChange={(e) => setKillRatios({ ...killRatios, [src]: Number(e.target.value) })}
              className="w-12" />
            <span className="text-xs text-[var(--smartfactory-text-secondary)]">{killRatios[src].toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <canvas ref={barRef} data-testid="defect-bar-canvas" width={400} height={200}
          className="w-full bg-[var(--smartfactory-bg-base)] rounded" />
        <canvas ref={waferRef} data-testid="defect-wafer-canvas" width={400} height={200}
          className="w-full bg-[var(--smartfactory-bg-base)] rounded" />
      </div>

      <div className="flex gap-4 text-xs text-[var(--smartfactory-text-muted)]">
        <span>Total D&#x2080;: <strong className="text-[var(--smartfactory-text-primary)]">{defects.totalD0.toFixed(2)} /cm&#xB2;</strong></span>
        <span>Killer: <strong className="text-[var(--smartfactory-text-primary)]">{defects.totalKillerD0.toFixed(2)} /cm&#xB2;</strong></span>
        <span>Yield Impact: <strong className="text-red-400">&minus;{(defects.totalYieldImpact * 100).toFixed(1)}%</strong></span>
      </div>
    </div>
  );
}

function drawDefectBars(
  canvas: HTMLCanvasElement | null,
  steps: { stepId: string; totalD0: number; sources: { source: string; density: number; color: string }[] }[],
  paretoPoints: { stepId: string; cumPct: number }[],
  ceiling: number,
) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width: W, height: H } = canvas;
  ctx.clearRect(0, 0, W, H);
  if (steps.length === 0) return;

  const pad = 30;
  const maxD0 = Math.max(...steps.map((s) => s.totalD0), ceiling) * 1.1;
  const barW = (W - 2 * pad) / steps.length * 0.7;
  const gap = (W - 2 * pad) / steps.length * 0.3;

  const ceilY = H - pad - (ceiling / maxD0) * (H - 2 * pad);
  ctx.strokeStyle = '#EF4444';
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(pad, ceilY);
  ctx.lineTo(W - pad, ceilY);
  ctx.stroke();
  ctx.setLineDash([]);

  steps.forEach((step, i) => {
    const x = pad + i * (barW + gap);
    let y = H - pad;
    for (const src of step.sources) {
      const segH = (src.density / maxD0) * (H - 2 * pad);
      y -= segH;
      ctx.fillStyle = src.color + '88';
      ctx.fillRect(x, y, barW, segH);
    }
    ctx.fillStyle = '#94A3B8';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(STEP_SHORT_NAMES[step.stepId as keyof typeof STEP_SHORT_NAMES] ?? step.stepId, x + barW / 2, H - pad + 12);
  });

  ctx.strokeStyle = '#F97316';
  ctx.lineWidth = 2;
  ctx.beginPath();
  paretoPoints.forEach((pt, i) => {
    const stepIdx = steps.findIndex((s) => s.stepId === pt.stepId);
    if (stepIdx < 0) return;
    const x = pad + stepIdx * (barW + gap) + barW / 2;
    const y = pad + (1 - pt.cumPct / 100) * (H - 2 * pad);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.stroke();
}

function drawWaferMap(canvas: HTMLCanvasElement | null, dots: { x: number; y: number; source: string }[]) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width: W, height: H } = canvas;
  ctx.clearRect(0, 0, W, H);

  const cx = W / 2;
  const cy = H / 2;
  const r = Math.min(W, H) / 2 - 20;

  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, 2 * Math.PI);
  ctx.stroke();

  ctx.strokeStyle = '#47456944';
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.95, 0, 2 * Math.PI);
  ctx.stroke();

  const colorMap: Record<string, string> = {
    particles: '#22D3EE',
    scratches: '#F59E0B',
    voids: '#A855F7',
    inclusions: '#EF4444',
  };

  for (const dot of dots) {
    const x = cx + dot.x * r * 0.93;
    const y = cy + dot.y * r * 0.93;
    ctx.fillStyle = colorMap[dot.source] ?? '#94A3B8';
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, 2 * Math.PI);
    ctx.fill();
  }

  ctx.fillStyle = '#94A3B8';
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('Wafer Defect Map', cx, H - 4);
}
