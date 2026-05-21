'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { StepState, ImplantMetric } from '@/lib/implant-sim';
import { DEPTH_BINS } from '@/lib/implant-sim';

interface ProfilePanelProps {
  steps: StepState[];
  currentStep: StepState | null;
  metric: ImplantMetric;
  onMetricChange: (m: ImplantMetric) => void;
}

const METRIC_CFG: Record<ImplantMetric, { label: string; unit: string; format: (v: number) => string }> = {
  projectedRange:      { label: 'Rp',          unit: 'nm',   format: v => v.toFixed(1) },
  straggle:            { label: '\u0394Rp',     unit: 'nm',   format: v => v.toFixed(1) },
  junctionDepth:       { label: 'Xj',          unit: 'nm',   format: v => v.toFixed(1) },
  peakConcentration:   { label: 'Cp',          unit: 'rel',  format: v => v.toFixed(4) },
  channelingTailDepth: { label: 'Ch. Tail',    unit: 'nm',   format: v => v.toFixed(1) },
  damagePeakDensity:   { label: 'Dmg Peak',    unit: 'norm', format: v => v.toFixed(3) },
  lateralStraggle:     { label: '\u0394Rp_lat', unit: 'nm',   format: v => v.toFixed(1) },
  retainedDoseFraction:{ label: 'Retained',    unit: '%',    format: v => (v * 100).toFixed(1) },
};

const METRICS: ImplantMetric[] = [
  'projectedRange', 'straggle', 'junctionDepth', 'peakConcentration',
  'channelingTailDepth', 'damagePeakDensity', 'lateralStraggle', 'retainedDoseFraction',
];

export function ProfilePanel({ steps, currentStep, metric, onMetricChange }: ProfilePanelProps) {
  const profileRef = useRef<HTMLCanvasElement>(null);
  const damageRef = useRef<HTMLCanvasElement>(null);
  const sparkRef = useRef<HTMLCanvasElement>(null);

  const drawProfile = useCallback(() => {
    const ctx = profileRef.current?.getContext('2d');
    if (!ctx || !profileRef.current || !currentStep) return;
    const w = profileRef.current.width;
    const h = profileRef.current.height;
    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = 'rgba(2, 6, 23, 0.6)';
    ctx.fillRect(0, 0, w, h);

    const pad = { top: 16, bottom: 24, left: 40, right: 12 };
    const plotW = w - pad.left - pad.right;
    const plotH = h - pad.top - pad.bottom;

    const profile = currentStep.depthProfile;
    const maxVal = Math.max(...profile, 1e-10);
    const maxDepth = currentStep.maxDepthNm;

    // Log scale Y axis
    const logMin = -5;
    const logMax = Math.ceil(Math.log10(maxVal + 1e-10));
    const yFromLog = (logV: number) => pad.top + plotH - ((logV - logMin) / (logMax - logMin)) * plotH;

    // Axes
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.3)';
    ctx.lineWidth = 0.5;
    for (let lv = logMin; lv <= logMax; lv++) {
      const y = yFromLog(lv);
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + plotW, y);
      ctx.stroke();
      ctx.fillStyle = '#94a3b8';
      ctx.font = '8px monospace';
      ctx.fillText(`1e${lv}`, 2, y + 3);
    }

    // Depth profile
    ctx.beginPath();
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < DEPTH_BINS; i++) {
      const x = pad.left + (i / DEPTH_BINS) * plotW;
      const val = profile[i];
      const logV = val > 0 ? Math.log10(val) : logMin;
      const y = yFromLog(Math.max(logMin, logV));
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Fill under curve
    const lastX = pad.left + plotW;
    ctx.lineTo(lastX, pad.top + plotH);
    ctx.lineTo(pad.left, pad.top + plotH);
    ctx.closePath();
    ctx.fillStyle = 'rgba(6, 182, 212, 0.08)';
    ctx.fill();

    // Rp marker
    if (currentStep.projectedRange > 0) {
      const rpX = pad.left + (currentStep.projectedRange / maxDepth) * plotW;
      ctx.strokeStyle = '#ef4444';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(rpX, pad.top);
      ctx.lineTo(rpX, pad.top + plotH);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#ef4444';
      ctx.font = '8px monospace';
      ctx.fillText('Rp', rpX + 2, pad.top + 10);
    }

    // Labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '8px monospace';
    ctx.fillText('Depth Profile (log)', pad.left, pad.top - 4);
    ctx.fillText(`0 — ${maxDepth.toFixed(0)} nm`, pad.left, h - 4);
  }, [currentStep]);

  const drawDamage = useCallback(() => {
    const ctx = damageRef.current?.getContext('2d');
    if (!ctx || !damageRef.current || !currentStep) return;
    const w = damageRef.current.width;
    const h = damageRef.current.height;
    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = 'rgba(2, 6, 23, 0.6)';
    ctx.fillRect(0, 0, w, h);

    const pad = { top: 16, bottom: 20, left: 12, right: 12 };
    const plotW = w - pad.left - pad.right;
    const plotH = h - pad.top - pad.bottom;

    const damage = currentStep.damageProfile;
    const maxDmg = Math.max(...damage, 0.1);

    // Damage profile
    ctx.beginPath();
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 1;
    for (let i = 0; i < damage.length; i++) {
      const x = pad.left + (i / damage.length) * plotW;
      const y = pad.top + plotH - (damage[i] / maxDmg) * plotH;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Amorphization threshold line
    const threshY = pad.top + plotH - (1.0 / maxDmg) * plotH;
    if (threshY > pad.top && threshY < pad.top + plotH) {
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(pad.left, threshY);
      ctx.lineTo(pad.left + plotW, threshY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#ef4444';
      ctx.font = '7px monospace';
      ctx.fillText('amorph', pad.left + plotW - 30, threshY - 3);
    }

    // Amorphous regions highlight
    ctx.fillStyle = 'rgba(168, 85, 247, 0.15)';
    for (let i = 0; i < currentStep.amorphousMap.length; i++) {
      if (!currentStep.amorphousMap[i]) continue;
      const x = pad.left + (i / damage.length) * plotW;
      const bw = plotW / damage.length;
      ctx.fillRect(x, pad.top, bw, plotH);
    }

    ctx.fillStyle = '#94a3b8';
    ctx.font = '8px monospace';
    ctx.fillText('Damage Density', pad.left, pad.top - 4);
  }, [currentStep]);

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
    ctx.strokeStyle = '#06b6d4';
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
  useEffect(() => { drawDamage(); }, [drawDamage]);
  useEffect(() => { drawSparkline(); }, [drawSparkline]);

  return (
    <div className="flex h-full flex-col bg-[var(--sf-bg-canvas)] p-3">
      {/* Metric selector */}
      <div className="mb-2 flex flex-wrap gap-1">
        {METRICS.map((m) => (
          <button key={m} type="button" onClick={() => onMetricChange(m)}
            className="rounded-full px-2 py-0.5 font-mono text-[10px] transition-colors"
            style={{
              backgroundColor: metric === m ? '#06b6d4' : 'rgba(6,182,212,0.1)',
              color: metric === m ? '#fff' : '#06b6d4',
            }}>
            {METRIC_CFG[m].label}
          </button>
        ))}
      </div>

      {/* Metric readout */}
      {currentStep && (
        <div className="mb-2 grid grid-cols-4 gap-1 text-center font-mono text-[9px]">
          {METRICS.map((m) => {
            const cfg = METRIC_CFG[m];
            const val = currentStep[m] as number;
            return (
              <div key={m} className="rounded bg-white/5 px-1 py-0.5">
                <div className="text-[var(--sf-text-muted)]">{cfg.label}</div>
                <div style={{ color: metric === m ? '#06b6d4' : '#94a3b8' }}>{cfg.format(val)} {cfg.unit}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Depth profile canvas */}
      <div className="flex-1 min-h-0">
        <canvas ref={profileRef} width={360} height={220} className="h-full w-full" />
      </div>

      {/* Damage density canvas */}
      <div className="mt-1 h-[80px]">
        <canvas ref={damageRef} width={360} height={80} className="h-full w-full" />
      </div>

      {/* Sparkline */}
      <div className="mt-1 h-[70px]">
        <canvas ref={sparkRef} width={360} height={70} className="h-full w-full" />
      </div>
    </div>
  );
}
