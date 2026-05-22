'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { StepState, SimulationParams, OxidationMetric } from '@/lib/oxidation-sim';

interface ProfilePanelProps {
  steps: StepState[];
  currentStep: StepState | null;
  params: SimulationParams;
  metric: OxidationMetric;
  onMetricChange: (m: OxidationMetric) => void;
}

const METRIC_CFG: Record<OxidationMetric, { label: string; unit: string; format: (v: number) => string }> = {
  oxideThickness:    { label: 'Tox',    unit: 'nm',      format: v => v.toFixed(1) },
  temperature:       { label: 'T',      unit: '\u00B0C', format: v => v.toFixed(0) },
  peakStress:        { label: '\u03C3', unit: 'MPa',     format: v => v.toFixed(1) },
  birdBeakLength:    { label: 'BB',     unit: 'nm',      format: v => v.toFixed(1) },
  oxidationRate:     { label: 'Rate',   unit: 'nm/s',    format: v => v.toExponential(1) },
  oxideUniformity:   { label: 'Unif',   unit: '%',       format: v => v.toFixed(1) },
  trenchCornerStress:{ label: 'SCF',    unit: '\u00D7',  format: v => v.toFixed(2) },
  thermalBudget:     { label: '\u2211T\u00B7t', unit: '\u00B0C\u00B7s', format: v => v.toExponential(2) },
};

const METRICS: OxidationMetric[] = [
  'oxideThickness', 'temperature', 'peakStress', 'birdBeakLength',
  'oxidationRate', 'oxideUniformity', 'trenchCornerStress', 'thermalBudget',
];

const TRACE_COLORS = {
  center: '#F59E0B',
  mid: '#22C55E',
  edge: '#06B6D4',
};

export function ProfilePanel({ steps, currentStep, params, metric, onMetricChange }: ProfilePanelProps) {
  const profileRef = useRef<HTMLCanvasElement>(null);
  const tempRef = useRef<HTMLCanvasElement>(null);
  const sparkRef = useRef<HTMLCanvasElement>(null);

  const drawProfile = useCallback(() => {
    const ctx = profileRef.current?.getContext('2d');
    if (!ctx || !profileRef.current) return;
    const w = profileRef.current.width;
    const h = profileRef.current.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(2, 6, 23, 0.6)';
    ctx.fillRect(0, 0, w, h);

    if (steps.length < 1) return;

    const pad = { top: 16, bottom: 28, left: 44, right: 12 };
    const plotW = w - pad.left - pad.right;
    const plotH = h - pad.top - pad.bottom;

    // Get 3 traces: center, mid, edge oxide thickness over time
    const centerVals = steps.map(s => s.oxideThicknessCenter);
    const midVals = steps.map(s => s.oxideThicknessMid);
    const edgeVals = steps.map(s => s.oxideThicknessEdge);

    const allVals = [...centerVals, ...midVals, ...edgeVals];
    const minV = 0;
    const maxV = Math.max(...allVals, 1);

    const yFrom = (v: number) => pad.top + plotH - ((v - minV) / (maxV - minV)) * plotH;

    // Grid lines
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.15)';
    ctx.lineWidth = 0.5;
    ctx.fillStyle = '#94a3b8';
    ctx.font = '7px monospace';
    const nGridLines = 5;
    for (let i = 0; i <= nGridLines; i++) {
      const v = minV + (maxV - minV) * (i / nGridLines);
      const y = yFrom(v);
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + plotW, y);
      ctx.stroke();
      ctx.fillText(v.toFixed(1), 2, y + 3);
    }

    // Draw traces
    const drawCurve = (data: number[], color: string) => {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      for (let i = 0; i < data.length; i++) {
        const x = pad.left + (i / Math.max(1, steps.length - 1)) * plotW;
        const y = yFrom(data[i]);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    };

    drawCurve(centerVals, TRACE_COLORS.center);
    drawCurve(midVals, TRACE_COLORS.mid);
    drawCurve(edgeVals, TRACE_COLORS.edge);

    // Title and legend
    ctx.fillStyle = '#94a3b8';
    ctx.font = '8px monospace';
    ctx.fillText('Oxide Thickness (nm) vs Step', pad.left, pad.top - 4);

    const legend = [
      { label: 'Center', color: TRACE_COLORS.center },
      { label: 'Mid', color: TRACE_COLORS.mid },
      { label: 'Edge', color: TRACE_COLORS.edge },
    ];
    let lx = pad.left + plotW - 120;
    ctx.font = '7px monospace';
    for (const l of legend) {
      ctx.fillStyle = l.color;
      ctx.fillRect(lx, h - 15, 8, 4);
      ctx.fillText(l.label, lx + 10, h - 11);
      lx += 45;
    }
  }, [steps]);

  const drawTemp = useCallback(() => {
    const ctx = tempRef.current?.getContext('2d');
    if (!ctx || !tempRef.current) return;
    const w = tempRef.current.width;
    const h = tempRef.current.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(2, 6, 23, 0.6)';
    ctx.fillRect(0, 0, w, h);

    if (steps.length < 1) return;

    const pad = { top: 12, bottom: 16, left: 44, right: 12 };
    const plotW = w - pad.left - pad.right;
    const plotH = h - pad.top - pad.bottom;

    const temps = steps.map(s => s.temperature);
    const minT = Math.min(...temps, 25);
    const maxT = Math.max(...temps, 100);

    const phaseColors: Record<string, string> = {
      ramp: '#F59E0B', soak: '#EF4444', cool: '#3B82F6',
    };

    ctx.lineWidth = 1.5;
    for (let i = 1; i < steps.length; i++) {
      const x0 = pad.left + ((i - 1) / (steps.length - 1)) * plotW;
      const x1 = pad.left + (i / (steps.length - 1)) * plotW;
      const y0 = pad.top + plotH - ((temps[i - 1] - minT) / (maxT - minT)) * plotH;
      const y1 = pad.top + plotH - ((temps[i] - minT) / (maxT - minT)) * plotH;
      ctx.strokeStyle = phaseColors[steps[i].thermalPhase] ?? '#94a3b8';
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    }

    if (currentStep) {
      ctx.fillStyle = '#F59E0B';
      ctx.font = 'bold 14px monospace';
      ctx.fillText(`${currentStep.temperature.toFixed(0)}°C`, pad.left + plotW - 60, pad.top + 14);
    }

    ctx.fillStyle = '#94a3b8';
    ctx.font = '8px monospace';
    ctx.fillText('T(t) Thermal History', pad.left, pad.top - 2);
  }, [steps, currentStep]);

  const drawSparkline = useCallback(() => {
    const ctx = sparkRef.current?.getContext('2d');
    if (!ctx || !sparkRef.current) return;
    const w = sparkRef.current.width;
    const h = sparkRef.current.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(2, 6, 23, 0.6)';
    ctx.fillRect(0, 0, w, h);

    if (steps.length < 2) return;

    const cfg = METRIC_CFG[metric];
    const pad = { top: 12, bottom: 16, left: 8, right: 8 };
    const plotW = w - pad.left - pad.right;
    const plotH = h - pad.top - pad.bottom;

    const values = steps.map(s => s[metric] as number);
    const minV = Math.min(...values);
    const maxV = Math.max(...values, minV + 0.001);

    ctx.beginPath();
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < values.length; i++) {
      const x = pad.left + (i / (steps.length - 1)) * plotW;
      const y = pad.top + plotH - ((values[i] - minV) / (maxV - minV)) * plotH;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '8px monospace';
    ctx.fillText(`${cfg.label} trend`, pad.left, pad.top - 2);
  }, [steps, metric]);

  useEffect(() => { drawProfile(); }, [drawProfile]);
  useEffect(() => { drawTemp(); }, [drawTemp]);
  useEffect(() => { drawSparkline(); }, [drawSparkline]);

  return (
    <div className="flex h-full flex-col bg-[var(--sf-bg-canvas)] p-3">
      <div className="mb-2 flex flex-wrap gap-1">
        {METRICS.map((m) => (
          <button key={m} type="button" onClick={() => onMetricChange(m)}
            className="rounded-full px-2 py-0.5 font-mono text-[10px] transition-colors"
            style={{
              backgroundColor: metric === m ? '#F59E0B' : 'rgba(245,158,11,0.1)',
              color: metric === m ? '#fff' : '#F59E0B',
            }}>
            {METRIC_CFG[m].label}
          </button>
        ))}
      </div>

      {currentStep && (
        <div className="mb-2 grid grid-cols-4 gap-1 text-center font-mono text-[9px]">
          {METRICS.map((m) => {
            const cfg = METRIC_CFG[m];
            const val = currentStep[m] as number;
            return (
              <div key={m} className="rounded bg-white/5 px-1 py-0.5">
                <div className="text-[var(--sf-text-muted)]">{cfg.label}</div>
                <div style={{ color: metric === m ? '#F59E0B' : '#94a3b8' }}>{cfg.format(val)} {cfg.unit}</div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex-1 min-h-0">
        <canvas ref={profileRef} width={360} height={220} className="h-full w-full" />
      </div>

      <div className="mt-1 h-[80px]">
        <canvas ref={tempRef} width={360} height={80} className="h-full w-full" />
      </div>

      <div className="mt-1 h-[70px]">
        <canvas ref={sparkRef} width={360} height={70} className="h-full w-full" />
      </div>
    </div>
  );
}
