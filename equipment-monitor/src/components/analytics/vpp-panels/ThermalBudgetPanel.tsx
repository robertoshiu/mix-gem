'use client';

import { useRef, useEffect } from 'react';
import type { ThermalBudgetStep } from '@/lib/analytics/types';
import { STEP_SHORT_NAMES } from '@/lib/analytics/constants';

interface Props {
  steps: ThermalBudgetStep[];
  ceiling: number;
}

export function ThermalBudgetPanel({ steps, ceiling }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const totalDt = steps.length > 0 ? steps[steps.length - 1].cumulativeDt : 0;
  const exceeded = totalDt > ceiling;

  useEffect(() => {
    drawThermalBudget(canvasRef.current, steps, ceiling);
  });

  return (
    <div className="space-y-2">
      <canvas ref={canvasRef} data-testid="thermal-budget-canvas" width={500} height={200}
        className="w-full bg-[var(--smartfactory-bg-base)] rounded" />
      {exceeded && (
        <div className="text-xs text-red-400 font-semibold">
          Budget exceeded: {totalDt.toExponential(2)} &gt; {ceiling.toExponential(2)} °C·s
        </div>
      )}
    </div>
  );
}

const STEP_COLORS = ['#FF6B35', '#22D3EE', '#A855F7', '#3B82F6', '#F43F5E', '#F59E0B', '#10B981', '#E2E8F0'];

function drawThermalBudget(canvas: HTMLCanvasElement | null, steps: ThermalBudgetStep[], ceiling: number) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width: W, height: H } = canvas;
  ctx.clearRect(0, 0, W, H);
  if (steps.length === 0) return;

  const pad = 40;
  const maxDt = Math.max(ceiling, steps[steps.length - 1].cumulativeDt) * 1.1;
  const barW = (W - 2 * pad) / steps.length * 0.7;
  const gap = (W - 2 * pad) / steps.length * 0.3;

  const ceilingY = H - pad - (ceiling / maxDt) * (H - 2 * pad);
  ctx.strokeStyle = '#EF4444';
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(pad, ceilingY);
  ctx.lineTo(W - pad, ceilingY);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#EF4444';
  ctx.font = '10px monospace';
  ctx.textAlign = 'right';
  ctx.fillText(`Ceiling ${ceiling.toExponential(1)}`, W - pad, ceilingY - 4);

  steps.forEach((step, i) => {
    const x = pad + i * (barW + gap);
    const barH = (step.cumulativeDt / maxDt) * (H - 2 * pad);
    const isHot = step.temperature > 1000;
    ctx.fillStyle = (isHot ? '#F59E0B' : STEP_COLORS[i % STEP_COLORS.length]) + '88';
    ctx.fillRect(x, H - pad - barH, barW, barH);
    if (isHot) {
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, H - pad - barH, barW, barH);
    }
    ctx.fillStyle = '#94A3B8';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(STEP_SHORT_NAMES[step.stepId] ?? step.stepId, x + barW / 2, H - pad + 12);
    ctx.fillText(step.cumulativeDt.toExponential(1), x + barW / 2, H - pad - barH - 4);
  });

  ctx.fillStyle = '#94A3B8';
  ctx.font = '10px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('Cumulative Dt (\u00B0C\u00B7s)', pad, pad - 8);
}
