'use client';

import { useEffect, useRef } from 'react';
import type { MtbfPrediction } from '@/lib/tool-health';

interface MtbfChartProps {
  prediction: MtbfPrediction;
}

export function MtbfChart({ prediction }: MtbfChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;

    const w = cvs.width;
    const h = cvs.height;
    ctx.clearRect(0, 0, w, h);

    const pad = { top: 8, bottom: 20, left: 36, right: 12 };
    const plotW = w - pad.left - pad.right;
    const plotH = h - pad.top - pad.bottom;
    const { survivalCurve, currentAgeHours } = prediction;

    if (survivalCurve.length < 2) return;

    const maxT = survivalCurve[survivalCurve.length - 1].hours;

    const xFrom = (t: number) => pad.left + (t / maxT) * plotW;
    const yFrom = (p: number) => pad.top + plotH - p * plotH;

    // Filled area with gradient
    const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + plotH);
    grad.addColorStop(0, 'rgba(34, 197, 94, 0.25)');
    grad.addColorStop(0.5, 'rgba(245, 158, 11, 0.15)');
    grad.addColorStop(1, 'rgba(239, 68, 68, 0.08)');

    ctx.beginPath();
    ctx.moveTo(xFrom(survivalCurve[0].hours), yFrom(survivalCurve[0].probability));
    for (const pt of survivalCurve) {
      ctx.lineTo(xFrom(pt.hours), yFrom(pt.probability));
    }
    ctx.lineTo(xFrom(survivalCurve[survivalCurve.length - 1].hours), yFrom(0));
    ctx.lineTo(xFrom(survivalCurve[0].hours), yFrom(0));
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Curve line
    ctx.beginPath();
    ctx.strokeStyle = '#22C55E';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < survivalCurve.length; i++) {
      const x = xFrom(survivalCurve[i].hours);
      const y = yFrom(survivalCurve[i].probability);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Current age dashed line
    const ageX = xFrom(currentAgeHours);
    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(ageX, pad.top);
    ctx.lineTo(ageX, pad.top + plotH);
    ctx.stroke();
    ctx.setLineDash([]);

    // Age label
    ctx.fillStyle = '#F59E0B';
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${currentAgeHours}h`, ageX, pad.top + plotH + 12);

    // Y axis
    ctx.fillStyle = '#94a3b8';
    ctx.font = '7px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('1.0', pad.left - 4, pad.top + 4);
    ctx.fillText('0.5', pad.left - 4, pad.top + plotH / 2 + 3);
    ctx.fillText('0.0', pad.left - 4, pad.top + plotH + 3);

    // X axis
    ctx.textAlign = 'center';
    ctx.fillText('0', pad.left, pad.top + plotH + 12);
    ctx.fillText(`${maxT}h`, pad.left + plotW, pad.top + plotH + 12);
  }, [prediction]);

  const readouts = [
    { label: 'MTBF', value: `${prediction.mtbfHours.toLocaleString()}h` },
    { label: 'Age', value: `${prediction.currentAgeHours.toLocaleString()}h` },
    { label: 'P(fail)', value: `${(prediction.failureProbability * 100).toFixed(1)}%` },
    { label: '\u03B2', value: prediction.weibullShape.toFixed(1) },
  ];

  return (
    <div>
      <div className="grid grid-cols-4 gap-1 mb-1 text-center">
        {readouts.map(r => (
          <div key={r.label} className="rounded bg-white/5 px-1 py-0.5">
            <div className="text-[8px] text-[var(--smartfactory-text-muted)]">{r.label}</div>
            <div className="text-xs font-mono text-[var(--smartfactory-text-primary)]">{r.value}</div>
          </div>
        ))}
      </div>
      <canvas
        ref={canvasRef}
        width={440}
        height={120}
        className="w-full"
        data-testid="mtbf-chart"
      />
    </div>
  );
}
