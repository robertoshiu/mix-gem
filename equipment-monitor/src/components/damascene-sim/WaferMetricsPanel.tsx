'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { StepState, WaferMetric } from '@/lib/damascene-sim';
import {
  DIE_GRID_COLS,
  DIE_GRID_ROWS,
  DIE_MASK,
  ECD_FILL_END,
  ANNEAL_END,
} from '@/lib/damascene-sim/constants';

interface WaferMetricsPanelProps {
  steps: StepState[];
  currentStep: StepState | null;
  metric: WaferMetric;
  onMetricChange: (metric: WaferMetric) => void;
}

const METRICS: Array<{ id: WaferMetric; label: string; labelCN: string }> = [
  { id: 'thickness', label: 'Thickness', labelCN: '\u819C\u539A' },
  { id: 'sheetResistance', label: 'Sheet Rs', labelCN: '\u7247\u96FB\u963B' },
  { id: 'viaResistance', label: 'Via Rs', labelCN: '\u901A\u5B54\u96FB\u963B' },
  { id: 'stepCoverage', label: 'Step Cov.', labelCN: '\u968E\u68AF\u8986\u84CB' },
];

const COLORMAPS: Record<
  WaferMetric,
  {
    lo: [number, number, number];
    mid: [number, number, number];
    hi: [number, number, number];
    range: [number, number];
  }
> = {
  thickness: {
    lo: [59, 130, 246],
    mid: [255, 255, 255],
    hi: [239, 68, 68],
    range: [0, 200],
  },
  sheetResistance: {
    lo: [34, 197, 94],
    mid: [250, 204, 21],
    hi: [239, 68, 68],
    range: [0.02, 0.06],
  },
  viaResistance: {
    lo: [34, 197, 94],
    mid: [250, 204, 21],
    hi: [239, 68, 68],
    range: [0, 3.0],
  },
  stepCoverage: {
    lo: [239, 68, 68],
    mid: [250, 204, 21],
    hi: [34, 197, 94],
    range: [60, 100],
  },
};

function lerpColor(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): string {
  const r = Math.round(a[0] + (b[0] - a[0]) * t);
  const g = Math.round(a[1] + (b[1] - a[1]) * t);
  const bl = Math.round(a[2] + (b[2] - a[2]) * t);
  return `rgb(${r},${g},${bl})`;
}

function valueToColor(value: number, metric: WaferMetric): string {
  const { lo, mid, hi, range } = COLORMAPS[metric];
  const t = Math.max(
    0,
    Math.min(1, (value - range[0]) / (range[1] - range[0])),
  );
  if (t < 0.5) return lerpColor(lo, mid, t / 0.5);
  return lerpColor(mid, hi, (t - 0.5) / 0.5);
}

function getMetricData(step: StepState, metric: WaferMetric): number[] {
  switch (metric) {
    case 'thickness':
      return step.thicknessMap;
    case 'sheetResistance':
      return step.resistanceMap;
    case 'viaResistance':
      return step.resistanceMap.map((r) => r * 0.04);
    case 'stepCoverage':
      return step.thicknessMap.map(() => step.stepCoverage);
  }
}

function getAggregateValue(step: StepState, metric: WaferMetric): number {
  switch (metric) {
    case 'thickness':
      return step.copperThickness;
    case 'sheetResistance':
      return step.sheetResistance;
    case 'viaResistance':
      return step.viaResistance;
    case 'stepCoverage':
      return step.stepCoverage;
  }
}

export function WaferMetricsPanel({
  steps,
  currentStep,
  metric,
  onMetricChange,
}: WaferMetricsPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sparklineRef = useRef<HTMLCanvasElement | null>(null);

  // ---- Die map drawing ----
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const padding = 40;
    const size = Math.min(w, h) - padding * 2;
    const ox = (w - size) / 2;
    const oy = (h - size) / 2;
    const cellW = size / DIE_GRID_COLS;
    const cellH = size / DIE_GRID_ROWS;
    const cx = ox + size / 2;
    const cy = oy + size / 2;
    const radius = size / 2;

    // Clear
    ctx.fillStyle = '#0a1628';
    ctx.fillRect(0, 0, w, h);

    // Wafer outline
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 2, 0, Math.PI * 2);
    ctx.strokeStyle = '#94a3b844';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Notch
    ctx.beginPath();
    ctx.arc(cx, cy + radius + 2, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#94a3b8';
    ctx.fill();

    if (!currentStep) {
      ctx.fillStyle = '#64748b';
      ctx.font = '13px "Fira Code", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Press Play to start damascene simulation', cx, cy);
      return;
    }

    const data = getMetricData(currentStep, metric);

    // Draw dies
    for (let row = 0; row < DIE_GRID_ROWS; row++) {
      for (let col = 0; col < DIE_GRID_COLS; col++) {
        const idx = row * DIE_GRID_COLS + col;
        if (!DIE_MASK[idx]) continue;

        const x = ox + col * cellW;
        const y = oy + row * cellH;
        const value = data[idx] ?? 0;

        ctx.fillStyle = valueToColor(value, metric);
        ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2);

        // Value label (only if cells are large enough)
        if (cellW > 30) {
          ctx.fillStyle = '#0a1628';
          ctx.font = '9px "Fira Code", monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(
            metric === 'sheetResistance' ? value.toFixed(3) : value.toFixed(2),
            x + cellW / 2,
            y + cellH / 2,
          );
        }
      }
    }

    // Color bar legend
    const barX = ox + size + 12;
    const barH = size * 0.6;
    const barY = oy + (size - barH) / 2;
    const barW = 12;
    const { range } = COLORMAPS[metric];
    for (let i = 0; i < barH; i++) {
      const t = i / barH;
      ctx.fillStyle = valueToColor(
        range[0] + t * (range[1] - range[0]),
        metric,
      );
      ctx.fillRect(barX, barY + barH - i, barW, 1);
    }
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px "Fira Code", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`${range[1]}`, barX + barW + 4, barY);
    ctx.textBaseline = 'bottom';
    ctx.fillText(`${range[0]}`, barX + barW + 4, barY + barH);

    // Title
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '600 12px "Fira Code", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const metricLabel = METRICS.find((m) => m.id === metric);
    ctx.fillText(
      `${metricLabel?.label ?? metric} Map \u2014 Step ${currentStep.stepIndex} (illustrative)`,
      cx,
      oy - 22,
    );
  }, [currentStep, metric]);

  // ---- Trend sparkline drawing ----
  const drawSparkline = useCallback(() => {
    const canvas = sparklineRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;

    // Clear
    ctx.fillStyle = '#0a1628';
    ctx.fillRect(0, 0, w, h);

    if (steps.length === 0) return;

    const marginL = 36;
    const marginR = 8;
    const marginT = 8;
    const marginB = 18;
    const plotW = w - marginL - marginR;
    const plotH = h - marginT - marginB;

    // Compute aggregate values
    const values = steps.map((s) => getAggregateValue(s, metric));
    const dataMin = Math.min(...values);
    const dataMax = Math.max(...values);

    // Y-axis range with padding
    const ySpan = dataMax - dataMin || 1;
    const yMin = dataMin - ySpan * 0.1;
    const yMax = dataMax + ySpan * 0.1;

    // Axis helpers
    const toX = (i: number) => marginL + (i / Math.max(1, steps.length - 1)) * plotW;
    const toY = (v: number) => marginT + plotH - ((v - yMin) / (yMax - yMin)) * plotH;

    // Metric mid color for the line
    const { mid } = COLORMAPS[metric];
    const lineColor = `rgb(${mid[0]},${mid[1]},${mid[2]})`;
    const fillColor = `rgba(${mid[0]},${mid[1]},${mid[2]},0.15)`;

    // Area fill
    ctx.beginPath();
    ctx.moveTo(toX(0), toY(values[0]));
    for (let i = 1; i < values.length; i++) {
      ctx.lineTo(toX(i), toY(values[i]));
    }
    ctx.lineTo(toX(values.length - 1), marginT + plotH);
    ctx.lineTo(toX(0), marginT + plotH);
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.moveTo(toX(0), toY(values[0]));
    for (let i = 1; i < values.length; i++) {
      ctx.lineTo(toX(i), toY(values[i]));
    }
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Spec limits
    const drawSpecLine = (specVal: number) => {
      const sy = toY(specVal);
      if (sy >= marginT && sy <= marginT + plotH) {
        ctx.beginPath();
        ctx.setLineDash([4, 3]);
        ctx.moveTo(marginL, sy);
        ctx.lineTo(marginL + plotW, sy);
        ctx.strokeStyle = 'rgba(239,68,68,0.7)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.setLineDash([]);
        // Label
        ctx.fillStyle = 'rgba(239,68,68,0.8)';
        ctx.font = '9px "Fira Code", monospace';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(specVal.toString(), marginL - 3, sy);
      }
    };

    if (metric === 'sheetResistance') {
      drawSpecLine(0.052);
    } else if (metric === 'viaResistance') {
      drawSpecLine(2.4);
    } else if (metric === 'stepCoverage') {
      drawSpecLine(75);
    }
    // thickness: no spec limit

    // Phase dividers
    const drawPhaseDivider = (stepIdx: number, label: string) => {
      if (steps.length <= stepIdx) return;
      const dx = toX(stepIdx);
      ctx.beginPath();
      ctx.setLineDash([3, 3]);
      ctx.moveTo(dx, marginT);
      ctx.lineTo(dx, marginT + plotH);
      ctx.strokeStyle = 'rgba(148,163,184,0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(148,163,184,0.6)';
      ctx.font = '8px "Fira Code", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(label, dx, marginT + 2);
    };
    drawPhaseDivider(ECD_FILL_END, 'Anneal');
    drawPhaseDivider(ANNEAL_END, 'CMP');

    // X-axis label
    ctx.fillStyle = '#64748b';
    ctx.font = '9px "Fira Code", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Step', marginL + plotW / 2, marginT + plotH + 5);

    // X-axis ticks (first and last)
    ctx.textAlign = 'center';
    ctx.fillText('0', toX(0), marginT + plotH + 5);
    if (steps.length > 1) {
      ctx.fillText(`${steps.length - 1}`, toX(steps.length - 1), marginT + plotH + 5);
    }

    // Y-axis ticks
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText(yMax.toFixed(1), marginL - 3, marginT + 2);
    ctx.textBaseline = 'top';
    ctx.fillText(yMin.toFixed(1), marginL - 3, marginT + plotH - 2);
  }, [steps, metric]);

  // Redraw on changes
  useEffect(() => {
    draw();
    drawSparkline();
    const handleResize = () => {
      draw();
      drawSparkline();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [draw, drawSparkline]);

  return (
    <div className="flex h-full flex-col">
      {/* Metric tabs */}
      <div className="flex gap-1 border-b border-white/10 px-3 py-2">
        {METRICS.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => onMetricChange(m.id)}
            data-testid={`metric-tab-${m.id}`}
            className={`rounded-lg px-3 py-1.5 font-mono text-[11px] transition-colors ${
              metric === m.id
                ? 'border border-[#94a3b8] bg-[rgba(148,163,184,0.12)] text-white'
                : 'border border-transparent text-[var(--sf-text-secondary)] hover:bg-white/[0.06]'
            }`}
          >
            {m.label}{' '}
            <span className="text-[var(--sf-text-muted)]/60">({m.labelCN})</span>
          </button>
        ))}
      </div>

      {/* Die map canvas */}
      <canvas
        ref={canvasRef}
        data-testid="wafer-metrics-canvas"
        className="flex-1"
        style={{ width: '100%', height: '100%' }}
      />

      {/* Trend sparkline */}
      <div className="border-t border-white/10 px-3 py-2">
        <canvas
          ref={sparklineRef}
          data-testid="wafer-trend-sparkline"
          style={{ width: '100%', height: 80 }}
        />
      </div>
    </div>
  );
}
