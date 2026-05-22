'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import {
  computeLineYield, generateYieldWaterfall, generateYieldCurve,
} from '@/lib/analytics/yield-engine';
import { DEFAULT_D0, PROCESS_STEPS, STEP_SHORT_NAMES } from '@/lib/analytics/constants';
import type { ProcessStepId } from '@/lib/analytics/types';
import { useAnalyticsStore } from '@/stores/analytics-store';

const PRESETS = {
  Baseline: () => ({ ...DEFAULT_D0 }),
  '10% Improvement': () => {
    const d: Record<string, number> = {};
    for (const k of PROCESS_STEPS) d[k] = DEFAULT_D0[k] * 0.9;
    return d as Record<ProcessStepId, number>;
  },
  'New Tool': () => {
    const d = { ...DEFAULT_D0 };
    let worst: ProcessStepId = 'oxidation';
    for (const k of PROCESS_STEPS) if (DEFAULT_D0[k] > DEFAULT_D0[worst]) worst = k;
    d[worst] *= 0.6;
    return d;
  },
};

export function YieldTab() {
  const { yieldArea, yieldAlpha, setYieldArea, setYieldAlpha } = useAnalyticsStore();
  const [d0Values, setD0Values] = useState<Record<ProcessStepId, number>>({ ...DEFAULT_D0 });
  const [selectedStep] = useState<ProcessStepId>('lithography');

  const steps = PROCESS_STEPS.map((id) => ({ stepId: id, d0: d0Values[id] }));
  const result = computeLineYield(steps, yieldArea, yieldAlpha);
  const waterfall = generateYieldWaterfall(steps, yieldArea, yieldAlpha);
  const curve = generateYieldCurve(yieldArea, yieldAlpha, 0, 1, 100);

  const barRef = useRef<HTMLCanvasElement>(null);
  const curveRef = useRef<HTMLCanvasElement>(null);
  const waterfallRef = useRef<HTMLCanvasElement>(null);

  const drawCharts = useCallback(() => {
    drawStackedBar(barRef.current, result);
    drawYieldCurve(curveRef.current, curve, d0Values[selectedStep]);
    drawWaterfall(waterfallRef.current, waterfall);
  }, [result, curve, waterfall, d0Values, selectedStep]);

  useEffect(() => { drawCharts(); }, [drawCharts]);

  const worstStep = result.worstStep;
  const worstYield = result.perStep.find((s) => s.stepId === worstStep);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-2">
        <KpiBox label="Line Yield" value={`${(result.lineYield * 100).toFixed(1)}%`} />
        <KpiBox label="Worst Step" value={`${STEP_SHORT_NAMES[worstStep]} ${((worstYield?.yield ?? 0) * 100).toFixed(1)}%`} />
        <KpiBox label="D\u2080 avg" value={`${(steps.reduce((s, st) => s + st.d0, 0) / steps.length).toFixed(3)}`} />
        <KpiBox label="Die Area" value={`${yieldArea} mm\u00B2`} />
        <KpiBox label="\u03B1 cluster" value={`${yieldAlpha.toFixed(1)}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-3 bg-[var(--smartfactory-surface-card)] border border-[var(--smartfactory-border-default)] rounded p-3">
          <div>
            <label htmlFor="die-area" className="text-xs text-[var(--smartfactory-text-muted)]">Die Area (mm\u00B2)</label>
            <input id="die-area" aria-label="Die Area" type="range" min={50} max={300} value={yieldArea}
              onChange={(e) => setYieldArea(Number(e.target.value))}
              className="w-full" />
            <span className="text-xs text-[var(--smartfactory-text-secondary)]">{yieldArea} mm\u00B2</span>
          </div>
          <div>
            <label htmlFor="alpha" className="text-xs text-[var(--smartfactory-text-muted)]">Cluster \u03B1</label>
            <input id="alpha" type="range" min={0.5} max={10} step={0.1} value={yieldAlpha}
              onChange={(e) => setYieldAlpha(Number(e.target.value))}
              className="w-full" />
          </div>
          {PROCESS_STEPS.map((id) => (
            <div key={id}>
              <label htmlFor={`d0-${id}`} className="text-xs text-[var(--smartfactory-text-muted)]" aria-label={STEP_SHORT_NAMES[id]}>
                {STEP_SHORT_NAMES[id]} D\u2080
              </label>
              <input id={`d0-${id}`} aria-label={STEP_SHORT_NAMES[id]} type="range" min={0.01} max={2} step={0.01}
                value={d0Values[id]}
                onChange={(e) => setD0Values((prev) => ({ ...prev, [id]: Number(e.target.value) }))}
                className="w-full" />
              <span className="text-xs text-[var(--smartfactory-text-secondary)]">{d0Values[id].toFixed(2)}</span>
            </div>
          ))}
          <div className="flex gap-2 flex-wrap">
            {Object.entries(PRESETS).map(([name, fn]) => (
              <button key={name} onClick={() => setD0Values(fn())}
                className="px-2 py-1 text-xs rounded bg-[var(--smartfactory-surface-card)] border border-[var(--smartfactory-border-default)] hover:border-[var(--smartfactory-border-active)] text-[var(--smartfactory-text-secondary)]">
                {name}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <canvas ref={barRef} data-testid="yield-chart-bar" width={500} height={200}
            className="w-full bg-[var(--smartfactory-surface-card)] border border-[var(--smartfactory-border-default)] rounded" />
          <canvas ref={curveRef} data-testid="yield-chart-curve" width={500} height={200}
            className="w-full bg-[var(--smartfactory-surface-card)] border border-[var(--smartfactory-border-default)] rounded" />
          <canvas ref={waterfallRef} data-testid="yield-chart-waterfall" width={500} height={200}
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

const STEP_COLORS = ['#FF6B35', '#22D3EE', '#A855F7', '#3B82F6', '#F43F5E', '#F59E0B', '#10B981', '#E2E8F0'];

function drawStackedBar(canvas: HTMLCanvasElement | null, result: ReturnType<typeof computeLineYield>) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width: W, height: H } = canvas;
  ctx.clearRect(0, 0, W, H);
  const { perStep } = result;
  if (perStep.length === 0) return;
  const barW = W / perStep.length * 0.7;
  const gap = W / perStep.length * 0.3;
  perStep.forEach((s, i) => {
    const x = i * (barW + gap) + gap / 2;
    const barH = s.yieldLoss * H * 5;
    ctx.fillStyle = STEP_COLORS[i % STEP_COLORS.length];
    ctx.fillRect(x, H - barH, barW, barH);
    ctx.fillStyle = '#94A3B8';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(STEP_SHORT_NAMES[s.stepId], x + barW / 2, H - barH - 4);
  });
}

function drawYieldCurve(canvas: HTMLCanvasElement | null, curve: { d0: number; yield: number }[], currentD0: number) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width: W, height: H } = canvas;
  ctx.clearRect(0, 0, W, H);
  if (curve.length === 0) return;
  const pad = 30;
  ctx.strokeStyle = '#22D3EE';
  ctx.lineWidth = 2;
  ctx.beginPath();
  curve.forEach((pt, i) => {
    const x = pad + (i / (curve.length - 1)) * (W - 2 * pad);
    const y = H - pad - pt.yield * (H - 2 * pad);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();
  const idx = curve.findIndex((pt) => pt.d0 >= currentD0);
  if (idx >= 0) {
    const x = pad + (idx / (curve.length - 1)) * (W - 2 * pad);
    const y = H - pad - curve[idx].yield * (H - 2 * pad);
    ctx.fillStyle = '#F47920';
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, 2 * Math.PI);
    ctx.fill();
  }
}

function drawWaterfall(canvas: HTMLCanvasElement | null, waterfall: { stepId: ProcessStepId; cumulative: number }[]) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width: W, height: H } = canvas;
  ctx.clearRect(0, 0, W, H);
  if (waterfall.length === 0) return;
  const pad = 30;
  const barW = (W - 2 * pad) / waterfall.length * 0.7;
  const gap = (W - 2 * pad) / waterfall.length * 0.3;
  waterfall.forEach((pt, i) => {
    const x = pad + i * (barW + gap);
    const barH = pt.cumulative * (H - 2 * pad);
    ctx.fillStyle = STEP_COLORS[i % STEP_COLORS.length] + '88';
    ctx.fillRect(x, H - pad - barH, barW, barH);
    ctx.fillStyle = '#94A3B8';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${(pt.cumulative * 100).toFixed(0)}%`, x + barW / 2, H - pad - barH - 4);
  });
}
