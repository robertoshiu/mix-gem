'use client';

import { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import {
  createDefaultPipeline, runFederatedSim, computePipelineYield,
} from '@/lib/analytics/vpp-engine';
import {
  STEP_SHORT_NAMES,
} from '@/lib/analytics/constants';
import type { PipelineStep } from '@/lib/analytics/types';

export function VppTab() {
  const [pipeline] = useState<PipelineStep[]>(createDefaultPipeline);

  const result = useMemo(() => runFederatedSim(pipeline), [pipeline]);
  useMemo(() => computePipelineYield(result.perStep), [result]);

  const waterfallRef = useRef<HTMLCanvasElement>(null);
  const metricRef = useRef<HTMLCanvasElement>(null);

  const drawCharts = useCallback(() => {
    drawPipelineWaterfall(waterfallRef.current, result.perStep);
    drawMetricTrend(metricRef.current, result.perStep);
  }, [result]);

  useEffect(() => { drawCharts(); }, [drawCharts]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-2">
        <KpiBox label="Active Sims" value={`${pipeline.length}`} />
        <KpiBox label="Pipeline Steps" value={`${pipeline.length}`} />
        <KpiBox label="Cumulative Yield" value={`${(result.cumulativeYield * 100).toFixed(1)}%`} />
        <KpiBox label="Total Thickness" value={`${result.filmStack.reduce((s, l) => s + l.thickness, 0).toFixed(0)} nm`} />
        <KpiBox label="Layers" value={`${result.filmStack.length}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-3 bg-[var(--smartfactory-surface-card)] border border-[var(--smartfactory-border-default)] rounded p-3">
          <div className="text-xs font-semibold text-[var(--smartfactory-text-primary)]">Pipeline Steps</div>
          {pipeline.map((step, i) => (
            <div key={step.stepId} className="flex items-center gap-2 text-xs">
              <span className="w-10 font-mono text-[var(--smartfactory-text-secondary)]">{STEP_SHORT_NAMES[step.stepId]}</span>
              <span className="flex-1 text-[var(--smartfactory-text-muted)]">
                Y: {(result.perStep[i]?.yield * 100).toFixed(1)}% | T: {result.perStep[i]?.thickness.toFixed(0)}nm
              </span>
            </div>
          ))}

          <div className="text-xs font-semibold text-[var(--smartfactory-text-primary)] mt-4">Film Stack</div>
          <div className="flex flex-col gap-0">
            {result.filmStack.map((layer, i) => (
              <div key={i} className="flex items-center gap-2 text-xs"
                style={{ borderLeft: `4px solid ${layer.color}`, paddingLeft: '8px' }}>
                <span className="text-[var(--smartfactory-text-secondary)]">{layer.material}</span>
                <span className="text-[var(--smartfactory-text-muted)]">{layer.thickness.toFixed(0)} nm</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <canvas ref={waterfallRef} data-testid="vpp-chart-waterfall" width={500} height={220}
            className="w-full bg-[var(--smartfactory-surface-card)] border border-[var(--smartfactory-border-default)] rounded" />
          <canvas ref={metricRef} data-testid="vpp-chart-metric" width={500} height={220}
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

function drawPipelineWaterfall(canvas: HTMLCanvasElement | null, perStep: { stepId: string; yield: number }[]) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width: W, height: H } = canvas;
  ctx.clearRect(0, 0, W, H);
  if (perStep.length === 0) return;
  const pad = 30;
  const barW = (W - 2 * pad) / perStep.length * 0.7;
  const gap = (W - 2 * pad) / perStep.length * 0.3;
  let cumulative = 1;
  perStep.forEach((step, i) => {
    cumulative *= step.yield;
    const x = pad + i * (barW + gap);
    const barH = cumulative * (H - 2 * pad);
    ctx.fillStyle = STEP_COLORS[i % STEP_COLORS.length] + '88';
    ctx.fillRect(x, H - pad - barH, barW, barH);
    ctx.fillStyle = '#94A3B8';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${(cumulative * 100).toFixed(0)}%`, x + barW / 2, H - pad - barH - 4);
    ctx.fillText(STEP_SHORT_NAMES[step.stepId as keyof typeof STEP_SHORT_NAMES] ?? step.stepId, x + barW / 2, H - pad + 12);
  });
}

function drawMetricTrend(canvas: HTMLCanvasElement | null, perStep: { stepId: string; thickness: number; stress: number; defectDensity: number }[]) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width: W, height: H } = canvas;
  ctx.clearRect(0, 0, W, H);
  if (perStep.length === 0) return;
  const pad = 30;
  const vals = perStep.map((s) => s.thickness);
  const yMin = Math.min(...vals, 0);
  const yMax = Math.max(...vals);
  const yRange = yMax - yMin || 1;
  ctx.strokeStyle = '#22D3EE';
  ctx.lineWidth = 2;
  ctx.beginPath();
  perStep.forEach((step, i) => {
    const x = pad + (i / (perStep.length - 1)) * (W - 2 * pad);
    const y = H - pad - ((step.thickness - yMin) / yRange) * (H - 2 * pad);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();
  perStep.forEach((step, i) => {
    const x = pad + (i / (perStep.length - 1)) * (W - 2 * pad);
    const y = H - pad - ((step.thickness - yMin) / yRange) * (H - 2 * pad);
    ctx.fillStyle = STEP_COLORS[i % STEP_COLORS.length];
    ctx.beginPath(); ctx.arc(x, y, 4, 0, 2 * Math.PI); ctx.fill();
  });
  ctx.fillStyle = '#94A3B8';
  ctx.font = '10px monospace';
  ctx.fillText('Thickness (nm)', pad, pad - 8);
}
