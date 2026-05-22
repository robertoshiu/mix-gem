'use client';

import { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import {
  evaluateObjectives, generateParetoFrontier, computeSensitivity, checkConstraints,
} from '@/lib/analytics/optimization-engine';
import {
  DEFAULT_RECIPE_KNOBS, DEFAULT_CONSTRAINTS, STEP_SHORT_NAMES, OBJECTIVES,
} from '@/lib/analytics/constants';
import type { ObjectiveId } from '@/lib/analytics/types';
import { useAnalyticsStore } from '@/stores/analytics-store';

export function OptimizationTab() {
  const { optimizationObjectives, setOptimizationObjectives } = useAnalyticsStore();
  const [recipe, setRecipe] = useState(DEFAULT_RECIPE_KNOBS.map((k) => k.value));
  const [constraints] = useState(DEFAULT_CONSTRAINTS);

  const objectives = useMemo(() => evaluateObjectives(recipe), [recipe]);
  const [obj1, obj2] = optimizationObjectives;
  const frontier = useMemo(() => generateParetoFrontier([obj1, obj2], constraints, 100), [obj1, obj2, constraints]);
  const sensitivity = useMemo(() => computeSensitivity(recipe, obj1, 0.1), [recipe, obj1]);
  const { feasible, violations } = checkConstraints(objectives, constraints);
  const nonDom = frontier.filter((p) => !p.dominated);

  const paretoRef = useRef<HTMLCanvasElement>(null);
  const tornadoRef = useRef<HTMLCanvasElement>(null);
  const rsmRef = useRef<HTMLCanvasElement>(null);

  const drawCharts = useCallback(() => {
    drawParetoScatter(paretoRef.current, frontier, obj1, obj2, objectives);
    drawTornado(tornadoRef.current, sensitivity);
    if (rsmRef.current) {
      const ctx = rsmRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, rsmRef.current.width, rsmRef.current.height);
        ctx.fillStyle = '#64748B';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('RSM Contour (select 2 axes)', rsmRef.current.width / 2, rsmRef.current.height / 2);
      }
    }
  }, [frontier, obj1, obj2, objectives, sensitivity]);

  useEffect(() => { drawCharts(); }, [drawCharts]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-2">
        <KpiBox label="Pareto Solutions" value={`${nonDom.length}`} />
        <KpiBox label="Current Yield" value={`${objectives.yield.toFixed(1)}%`} />
        <KpiBox label="Throughput" value={`${objectives.throughput.toFixed(0)} wph`} />
        <KpiBox label="Violations" value={violations.length > 0 ? violations.join(', ') : 'None'} />
        <KpiBox label="Feasible" value={feasible ? 'Yes' : 'No'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-3 bg-[var(--smartfactory-surface-card)] border border-[var(--smartfactory-border-default)] rounded p-3">
          <div className="text-xs text-[var(--smartfactory-text-muted)]">Objectives (select 2)</div>
          <div className="flex gap-2 flex-wrap">
            {OBJECTIVES.map((o) => (
              <button key={o.id} onClick={() => {
                const current = [...optimizationObjectives];
                if (current.includes(o.id)) {
                  if (current.length > 1) setOptimizationObjectives(current.filter((x) => x !== o.id));
                } else {
                  setOptimizationObjectives([...current.slice(-1), o.id]);
                }
              }}
                className={`px-2 py-1 text-xs rounded ${optimizationObjectives.includes(o.id) ? 'bg-blue-600 text-white' : 'bg-[var(--smartfactory-surface-card)] text-[var(--smartfactory-text-secondary)] border border-[var(--smartfactory-border-default)]'}`}>
                {o.id} ({o.direction === 'maximize' ? '\u2191' : '\u2193'})
              </button>
            ))}
          </div>

          <div className="text-xs text-[var(--smartfactory-text-muted)]">Min Yield \u2265 {constraints.minYield}%</div>

          {DEFAULT_RECIPE_KNOBS.map((knob, i) => (
            <div key={knob.stepId}>
              <label htmlFor={`knob-${knob.stepId}`} aria-label={`${STEP_SHORT_NAMES[knob.stepId]} ${knob.label}`}
                className="text-xs text-[var(--smartfactory-text-muted)]">
                {STEP_SHORT_NAMES[knob.stepId]} {knob.label}
              </label>
              <input id={`knob-${knob.stepId}`} aria-label={`${STEP_SHORT_NAMES[knob.stepId]} ${knob.label}`}
                type="range" min={knob.min} max={knob.max} step={(knob.max - knob.min) / 100}
                value={recipe[i]}
                onChange={(e) => { const next = [...recipe]; next[i] = Number(e.target.value); setRecipe(next); }}
                className="w-full" />
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <canvas ref={paretoRef} data-testid="opt-chart-pareto" width={500} height={200}
            className="w-full bg-[var(--smartfactory-surface-card)] border border-[var(--smartfactory-border-default)] rounded" />
          <canvas ref={rsmRef} data-testid="opt-chart-rsm" width={500} height={200}
            className="w-full bg-[var(--smartfactory-surface-card)] border border-[var(--smartfactory-border-default)] rounded" />
          <canvas ref={tornadoRef} data-testid="opt-chart-tornado" width={500} height={200}
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

function drawParetoScatter(
  canvas: HTMLCanvasElement | null,
  frontier: { objectives: Record<ObjectiveId, number>; dominated: boolean }[],
  obj1: ObjectiveId,
  obj2: ObjectiveId,
  currentObj: Record<ObjectiveId, number>,
) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width: W, height: H } = canvas;
  ctx.clearRect(0, 0, W, H);
  if (frontier.length === 0) return;
  const pad = 30;
  const x1s = frontier.map((p) => p.objectives[obj1]);
  const x2s = frontier.map((p) => p.objectives[obj2]);
  const xMin = Math.min(...x1s); const xMax = Math.max(...x1s);
  const yMin = Math.min(...x2s); const yMax = Math.max(...x2s);
  const xRange = xMax - xMin || 1; const yRange = yMax - yMin || 1;
  const toX = (v: number) => pad + ((v - xMin) / xRange) * (W - 2 * pad);
  const toY = (v: number) => H - pad - ((v - yMin) / yRange) * (H - 2 * pad);
  frontier.filter((p) => p.dominated).forEach((p) => {
    ctx.fillStyle = '#64748B44';
    ctx.beginPath(); ctx.arc(toX(p.objectives[obj1]), toY(p.objectives[obj2]), 3, 0, 2 * Math.PI); ctx.fill();
  });
  const nonDom = frontier.filter((p) => !p.dominated).sort((a, b) => a.objectives[obj1] - b.objectives[obj1]);
  ctx.strokeStyle = '#22D3EE';
  ctx.lineWidth = 1;
  if (nonDom.length > 1) {
    ctx.beginPath();
    nonDom.forEach((p, i) => {
      const x = toX(p.objectives[obj1]); const y = toY(p.objectives[obj2]);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }
  nonDom.forEach((p) => {
    ctx.fillStyle = '#22D3EE';
    ctx.beginPath(); ctx.arc(toX(p.objectives[obj1]), toY(p.objectives[obj2]), 4, 0, 2 * Math.PI); ctx.fill();
  });
  ctx.fillStyle = '#F47920';
  ctx.beginPath(); ctx.arc(toX(currentObj[obj1]), toY(currentObj[obj2]), 6, 0, 2 * Math.PI); ctx.fill();
}

function drawTornado(canvas: HTMLCanvasElement | null, bars: { label: string; impact: number }[]) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width: W, height: H } = canvas;
  ctx.clearRect(0, 0, W, H);
  if (bars.length === 0) return;
  const pad = 60;
  const maxAbs = Math.max(...bars.map((b) => Math.abs(b.impact)), 0.01);
  const barH = (H - 2 * pad) / bars.length;
  const centerX = W / 2;
  bars.forEach((bar, i) => {
    const y = pad + i * barH;
    const barW = (bar.impact / maxAbs) * (W / 2 - pad);
    ctx.fillStyle = bar.impact >= 0 ? '#22C55E88' : '#EF444488';
    ctx.fillRect(centerX, y, barW, barH - 2);
    ctx.fillStyle = '#94A3B8';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(bar.label, centerX - 4, y + barH / 2 + 3);
  });
  ctx.strokeStyle = '#64748B';
  ctx.beginPath(); ctx.moveTo(centerX, pad); ctx.lineTo(centerX, H - pad); ctx.stroke();
}
