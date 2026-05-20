'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { StepState, WaferMetric } from '@/lib/etch-sim';
import { DIE_MASK, DIE_GRID_COLS, DIE_GRID_ROWS, STRIKE_END, MAIN_ETCH_END } from '@/lib/etch-sim';

interface WaferMetricsPanelProps {
  steps: StepState[];
  currentStep: StepState | null;
  metric: WaferMetric;
  onMetricChange: (m: WaferMetric) => void;
}

const METRIC_CFG: Record<WaferMetric, { label: string; unit: string; min: number; max: number; specMin: number; specMax: number; colorLow: string; colorMid: string; colorHigh: string }> = {
  etchRate:     { label: 'Etch Rate',     unit: 'nm/min', min: 150, max: 3000, specMin: 220, specMax: 2800, colorLow: '#3b82f6', colorMid: '#ffffff', colorHigh: '#ef4444' },
  selectivity:  { label: 'Selectivity',   unit: ':1',     min: 5,   max: 25,  specMin: 12,  specMax: 25,  colorLow: '#ef4444', colorMid: '#eab308', colorHigh: '#22c55e' },
  cdBias:       { label: 'CD Bias',       unit: 'nm',     min: -5,  max: 5,   specMin: -3,  specMax: 3,   colorLow: '#22c55e', colorMid: '#ffffff', colorHigh: '#ef4444' },
  profileAngle: { label: 'Profile Angle', unit: '\u00B0', min: 80,  max: 90,  specMin: 87,  specMax: 90,  colorLow: '#ef4444', colorMid: '#eab308', colorHigh: '#22c55e' },
};

function lerpColor(a: string, b: string, t: number): string {
  const parse = (hex: string) => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
  const [ar, ag, ab] = parse(a);
  const [br, bg, bb] = parse(b);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `rgb(${r},${g},${bl})`;
}

function getMetricValue(step: StepState, metric: WaferMetric, dieIdx: number): number {
  switch (metric) {
    case 'etchRate': return step.etchRateMap[dieIdx];
    case 'selectivity': return step.selectivity;
    case 'cdBias': return step.cdBiasMap[dieIdx];
    case 'profileAngle': return step.profileAngle;
  }
}

function getMetricMean(step: StepState, metric: WaferMetric): number {
  switch (metric) {
    case 'etchRate': return step.etchRate;
    case 'selectivity': return step.selectivity;
    case 'cdBias': return step.cdBias;
    case 'profileAngle': return step.profileAngle;
  }
}

export function WaferMetricsPanel({ steps, currentStep, metric, onMetricChange }: WaferMetricsPanelProps) {
  const mapRef = useRef<HTMLCanvasElement>(null);
  const sparkRef = useRef<HTMLCanvasElement>(null);

  const drawMap = useCallback(() => {
    const ctx = mapRef.current?.getContext('2d');
    if (!ctx || !mapRef.current) return;
    const w = mapRef.current.width;
    const h = mapRef.current.height;
    ctx.clearRect(0, 0, w, h);

    const cfg = METRIC_CFG[metric];
    const cellW = Math.floor((w - 20) / DIE_GRID_COLS);
    const cellH = Math.floor((h - 20) / DIE_GRID_ROWS);
    const ox = Math.floor((w - cellW * DIE_GRID_COLS) / 2);
    const oy = Math.floor((h - cellH * DIE_GRID_ROWS) / 2);

    for (let r = 0; r < DIE_GRID_ROWS; r++) {
      for (let c = 0; c < DIE_GRID_COLS; c++) {
        const idx = r * DIE_GRID_COLS + c;
        if (!DIE_MASK[idx]) continue;

        const x = ox + c * cellW;
        const y = oy + r * cellH;

        let val = 0;
        if (currentStep) val = getMetricValue(currentStep, metric, idx);
        const t = Math.max(0, Math.min(1, (val - cfg.min) / (cfg.max - cfg.min)));

        let color: string;
        if (t < 0.5) {
          color = lerpColor(cfg.colorLow, cfg.colorMid, t * 2);
        } else {
          color = lerpColor(cfg.colorMid, cfg.colorHigh, (t - 0.5) * 2);
        }

        ctx.fillStyle = color;
        ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2);
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.2)';
        ctx.strokeRect(x + 1, y + 1, cellW - 2, cellH - 2);
      }
    }

    if (currentStep) {
      const meanVal = getMetricMean(currentStep, metric);
      ctx.fillStyle = '#a855f7';
      ctx.font = '11px monospace';
      ctx.fillText(`${cfg.label}: ${meanVal.toFixed(1)} ${cfg.unit}`, 8, h - 6);
    }
  }, [currentStep, metric]);

  const drawSparkline = useCallback(() => {
    const ctx = sparkRef.current?.getContext('2d');
    if (!ctx || !sparkRef.current) return;
    const w = sparkRef.current.width;
    const h = sparkRef.current.height;
    ctx.clearRect(0, 0, w, h);

    const cfg = METRIC_CFG[metric];
    const pad = { top: 12, bottom: 20, left: 8, right: 8 };
    const plotW = w - pad.left - pad.right;
    const plotH = h - pad.top - pad.bottom;

    ctx.fillStyle = 'rgba(2, 6, 23, 0.6)';
    ctx.fillRect(0, 0, w, h);

    const totalSteps = steps.length > 0 ? steps[steps.length - 1].stepIndex + 1 : 200;
    const drawDivider = (stepIdx: number, label: string) => {
      const x = pad.left + (stepIdx / totalSteps) * plotW;
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.3)';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(x, pad.top);
      ctx.lineTo(x, pad.top + plotH);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(168, 85, 247, 0.5)';
      ctx.font = '8px monospace';
      ctx.fillText(label, x + 2, pad.top + 10);
    };
    drawDivider(STRIKE_END, 'Main Etch');
    drawDivider(MAIN_ETCH_END, 'Over-etch');

    const yFromVal = (v: number) => pad.top + plotH - ((v - cfg.min) / (cfg.max - cfg.min)) * plotH;
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(pad.left, yFromVal(cfg.specMin));
    ctx.lineTo(pad.left + plotW, yFromVal(cfg.specMin));
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pad.left, yFromVal(cfg.specMax));
    ctx.lineTo(pad.left + plotW, yFromVal(cfg.specMax));
    ctx.stroke();
    ctx.setLineDash([]);

    if (steps.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < steps.length; i++) {
        const val = getMetricMean(steps[i], metric);
        const x = pad.left + (steps[i].stepIndex / totalSteps) * plotW;
        const y = yFromVal(val);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      const lastStep = steps[steps.length - 1];
      const lastX = pad.left + (lastStep.stepIndex / totalSteps) * plotW;
      ctx.lineTo(lastX, pad.top + plotH);
      ctx.lineTo(pad.left, pad.top + plotH);
      ctx.closePath();
      ctx.fillStyle = 'rgba(168, 85, 247, 0.08)';
      ctx.fill();
      ctx.lineWidth = 1;
    }

    ctx.fillStyle = '#94a3b8';
    ctx.font = '8px monospace';
    ctx.fillText(`Step 0-${totalSteps}`, pad.left, h - 4);
    ctx.fillText(cfg.unit, w - pad.right - 30, h - 4);
  }, [steps, metric]);

  useEffect(() => { drawMap(); }, [drawMap]);
  useEffect(() => { drawSparkline(); }, [drawSparkline]);

  const metrics: WaferMetric[] = ['etchRate', 'selectivity', 'cdBias', 'profileAngle'];

  return (
    <div className="flex h-full flex-col bg-[var(--sf-bg-canvas)] p-3">
      <div className="mb-2 flex gap-1">
        {metrics.map((m) => (
          <button key={m} type="button" onClick={() => onMetricChange(m)} className="rounded-full px-2 py-0.5 font-mono text-[10px] transition-colors" style={{ backgroundColor: metric === m ? '#a855f7' : 'rgba(168, 85, 247, 0.1)', color: metric === m ? '#fff' : '#a855f7' }}>
            {METRIC_CFG[m].label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0">
        <canvas ref={mapRef} width={340} height={340} className="h-full w-full" style={{ imageRendering: 'pixelated' }} />
      </div>

      <div className="mt-2 h-[120px]">
        <canvas ref={sparkRef} width={340} height={120} className="h-full w-full" />
      </div>
    </div>
  );
}
