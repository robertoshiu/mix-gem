'use client';

import { useRef, useEffect, useCallback, useMemo } from 'react';
import { simulateRuns, computeResidualStats } from '@/lib/analytics/apc-engine';
import type { DriftType, DriftConfig } from '@/lib/analytics/types';
import { useAnalyticsStore } from '@/stores/analytics-store';

const DRIFT_OPTIONS: { value: DriftType; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'linear', label: 'Linear' },
  { value: 'sinusoidal', label: 'Sinusoidal' },
  { value: 'step-shift', label: 'Step-Shift' },
  { value: 'mixed', label: 'Mixed' },
];

export function ApcTab() {
  const {
    apcTarget, apcLambda, apcLambdaSlope, apcNoise, apcDriftType, apcRunCount,
    setApcLambda, setApcLambdaSlope, setApcDriftType, setApcRunCount,
  } = useAnalyticsStore();

  const driftConfig: DriftConfig = useMemo(() => {
    switch (apcDriftType) {
      case 'linear': return { type: 'linear', slope: 0.5 };
      case 'sinusoidal': return { type: 'sinusoidal', amplitude: 5, period: 30 };
      case 'step-shift': return { type: 'step-shift', magnitude: 8, triggerRun: Math.floor(apcRunCount / 2) };
      case 'mixed': return { type: 'mixed', slope: 0.2, amplitude: 3, period: 30 };
      default: return { type: 'none' };
    }
  }, [apcDriftType, apcRunCount]);

  const runs = useMemo(() =>
    simulateRuns({ target: apcTarget, lambda: apcLambda, lambdaSlope: apcLambdaSlope, noise: apcNoise }, driftConfig, apcRunCount, 42),
    [apcTarget, apcLambda, apcLambdaSlope, apcNoise, driftConfig, apcRunCount],
  );

  const stats = useMemo(() =>
    computeResidualStats(runs.map((r) => r.controlled), apcTarget),
    [runs, apcTarget],
  );

  const traceRef = useRef<HTMLCanvasElement>(null);
  const ewmaRef = useRef<HTMLCanvasElement>(null);
  const histRef = useRef<HTMLCanvasElement>(null);

  const drawCharts = useCallback(() => {
    drawTraceChart(traceRef.current, runs, apcTarget);
    drawEwmaChart(ewmaRef.current, runs);
    drawHistogram(histRef.current, stats);
  }, [runs, apcTarget, stats]);

  useEffect(() => { drawCharts(); }, [drawCharts]);

  const lastRun = runs[runs.length - 1];
  const currentOffset = lastRun ? (lastRun.controlled - apcTarget).toFixed(2) : '\u2014';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-2">
        <KpiBox label="Current Offset" value={currentOffset} />
        <KpiBox label="EWMA \u03BB" value={apcLambda.toFixed(2)} />
        <KpiBox label="Drift Rate" value={driftConfig.type === 'linear' ? `${driftConfig.slope}/run` : driftConfig.type} />
        <KpiBox label="Runs" value={`${apcRunCount}`} />
        <KpiBox label="Cpk" value={stats.cpk === Infinity ? '\u221E' : stats.cpk.toFixed(2)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-3 bg-[var(--smartfactory-surface-card)] border border-[var(--smartfactory-border-default)] rounded p-3">
          <div className="flex gap-2">
            <button onClick={() => setApcLambdaSlope(0)}
              className={`px-3 py-1 text-xs rounded ${apcLambdaSlope === 0 ? 'bg-blue-600 text-white' : 'bg-[var(--smartfactory-surface-card)] text-[var(--smartfactory-text-secondary)] border border-[var(--smartfactory-border-default)]'}`}>
              EWMA
            </button>
            <button onClick={() => setApcLambdaSlope(0.1)}
              className={`px-3 py-1 text-xs rounded ${apcLambdaSlope > 0 ? 'bg-blue-600 text-white' : 'bg-[var(--smartfactory-surface-card)] text-[var(--smartfactory-text-secondary)] border border-[var(--smartfactory-border-default)]'}`}>
              d-EWMA
            </button>
          </div>

          <div>
            <label className="text-xs text-[var(--smartfactory-text-muted)]">EWMA \u03BB</label>
            <input type="range" min={0.01} max={1} step={0.01} value={apcLambda}
              onChange={(e) => setApcLambda(Number(e.target.value))} className="w-full" />
          </div>

          {apcLambdaSlope > 0 && (
            <div>
              <label className="text-xs text-[var(--smartfactory-text-muted)]">Slope \u03BB</label>
              <input type="range" min={0.01} max={0.5} step={0.01} value={apcLambdaSlope}
                onChange={(e) => setApcLambdaSlope(Number(e.target.value))} className="w-full" />
            </div>
          )}

          <div>
            <label htmlFor="drift-type" className="text-xs text-[var(--smartfactory-text-muted)]">Drift Type</label>
            <select id="drift-type" aria-label="Drift Type" value={apcDriftType}
              onChange={(e) => setApcDriftType(e.target.value as DriftType)}
              className="w-full bg-[var(--smartfactory-bg-base)] border border-[var(--smartfactory-border-default)] rounded px-2 py-1 text-sm text-[var(--smartfactory-text-primary)]">
              {DRIFT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-[var(--smartfactory-text-muted)]">Run Count</label>
            <input type="range" min={20} max={200} value={apcRunCount}
              onChange={(e) => setApcRunCount(Number(e.target.value))} className="w-full" />
            <span className="text-xs text-[var(--smartfactory-text-secondary)]">{apcRunCount}</span>
          </div>
        </div>

        <div className="space-y-4">
          <canvas ref={traceRef} data-testid="apc-chart-trace" width={500} height={200}
            className="w-full bg-[var(--smartfactory-surface-card)] border border-[var(--smartfactory-border-default)] rounded" />
          <canvas ref={ewmaRef} data-testid="apc-chart-ewma" width={500} height={200}
            className="w-full bg-[var(--smartfactory-surface-card)] border border-[var(--smartfactory-border-default)] rounded" />
          <canvas ref={histRef} data-testid="apc-chart-hist" width={500} height={200}
            className="w-full bg-[var(--smartfactory-surface-card)] border border-[var(--smartfactory-border-default)] rounded" />
        </div>
      </div>
    </div>
  );
}

function KpiBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--smartfactory-surface-card)] border border-[var(--smartfactory-border-default)] rounded p-2 text-center">
      <div className="text-xs text-[var(--smartfactory-text-muted)]">{label}</div>
      <div className="text-sm font-semibold text-[var(--smartfactory-text-primary)]">{value}</div>
    </div>
  );
}

function drawTraceChart(canvas: HTMLCanvasElement | null, runs: { run: number; controlled: number; uncontrolled: number }[], target: number) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width: W, height: H } = canvas;
  ctx.clearRect(0, 0, W, H);
  if (runs.length === 0) return;
  const pad = 30;
  const allVals = runs.flatMap((r) => [r.controlled, r.uncontrolled]);
  const yMin = Math.min(...allVals, target - 5);
  const yMax = Math.max(...allVals, target + 5);
  const yRange = yMax - yMin || 1;
  const toX = (i: number) => pad + (i / (runs.length - 1)) * (W - 2 * pad);
  const toY = (v: number) => H - pad - ((v - yMin) / yRange) * (H - 2 * pad);
  ctx.strokeStyle = '#64748B';
  ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(pad, toY(target)); ctx.lineTo(W - pad, toY(target)); ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = '#EF4444';
  ctx.lineWidth = 1;
  ctx.beginPath();
  runs.forEach((r, i) => { if (i === 0) ctx.moveTo(toX(i), toY(r.uncontrolled)); else ctx.lineTo(toX(i), toY(r.uncontrolled)); });
  ctx.stroke();
  ctx.strokeStyle = '#3B82F6';
  ctx.lineWidth = 2;
  ctx.beginPath();
  runs.forEach((r, i) => { if (i === 0) ctx.moveTo(toX(i), toY(r.controlled)); else ctx.lineTo(toX(i), toY(r.controlled)); });
  ctx.stroke();
}

function drawEwmaChart(canvas: HTMLCanvasElement | null, runs: { ewmaLevel: number; ewmaSlope: number }[]) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width: W, height: H } = canvas;
  ctx.clearRect(0, 0, W, H);
  if (runs.length === 0) return;
  const pad = 30;
  const levels = runs.map((r) => r.ewmaLevel);
  const yMin = Math.min(...levels);
  const yMax = Math.max(...levels);
  const yRange = yMax - yMin || 1;
  ctx.strokeStyle = '#22D3EE';
  ctx.lineWidth = 2;
  ctx.beginPath();
  runs.forEach((r, i) => {
    const x = pad + (i / (runs.length - 1)) * (W - 2 * pad);
    const y = H - pad - ((r.ewmaLevel - yMin) / yRange) * (H - 2 * pad);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.stroke();
}

function drawHistogram(canvas: HTMLCanvasElement | null, stats: ReturnType<typeof computeResidualStats>) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width: W, height: H } = canvas;
  ctx.clearRect(0, 0, W, H);
  const { histogram } = stats;
  if (histogram.length === 0) return;
  const pad = 30;
  const maxCount = Math.max(...histogram.map((b) => b.count), 1);
  const barW = (W - 2 * pad) / histogram.length;
  histogram.forEach((bin, i) => {
    const x = pad + i * barW;
    const barH = (bin.count / maxCount) * (H - 2 * pad);
    ctx.fillStyle = '#3B82F688';
    ctx.fillRect(x, H - pad - barH, barW - 1, barH);
  });
}
