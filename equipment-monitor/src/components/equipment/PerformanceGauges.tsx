'use client';

import { useEffect, useRef } from 'react';
import type { ToolPerformance } from '@/lib/tool-health';
import { PERF_THRESHOLDS } from '@/lib/tool-health';

interface PerformanceGaugesProps {
  performance: ToolPerformance;
}

function getColor(value: number): string {
  if (value >= PERF_THRESHOLDS.green) return '#22C55E';
  if (value >= PERF_THRESHOLDS.amber) return '#F59E0B';
  return '#EF4444';
}

function drawGauge(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, value: number, label: string) {
  const color = getColor(value);
  const startAngle = 0.75 * Math.PI;
  const endAngle = 2.25 * Math.PI;
  const valueAngle = startAngle + (value / 100) * (endAngle - startAngle);

  ctx.beginPath();
  ctx.arc(cx, cy, r, startAngle, endAngle);
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, r, startAngle, valueAngle);
  ctx.strokeStyle = color;
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${value.toFixed(1)}%`, cx, cy - 2);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '8px monospace';
  ctx.fillText(label, cx, cy + 14);
}

function drawSparkline(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  data: number[], color: string,
) {
  if (data.length < 2) return;
  const min = Math.min(...data);
  const max = Math.max(...data, min + 0.1);

  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  for (let i = 0; i < data.length; i++) {
    const px = x + (i / (data.length - 1)) * w;
    const py = y + h - ((data[i] - min) / (max - min)) * h;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
}

export function PerformanceGauges({ performance }: PerformanceGaugesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;

    const w = cvs.width;
    const h = cvs.height;
    ctx.clearRect(0, 0, w, h);

    const gauges = [
      { label: 'OEE', value: performance.oee, data: performance.trend24h.map(t => t.oee) },
      { label: 'Avail', value: performance.availability, data: performance.trend24h.map(t => t.availability) },
      { label: 'Util', value: performance.utilization, data: performance.trend24h.map(t => t.utilization) },
    ];

    const gaugeW = w / 3;
    const gaugeR = 28;
    const gaugeCy = 40;

    for (let i = 0; i < 3; i++) {
      const cx = gaugeW * i + gaugeW / 2;
      const g = gauges[i];
      drawGauge(ctx, cx, gaugeCy, gaugeR, g.value, g.label);
      const sparkX = cx - 36;
      const sparkY = gaugeCy + gaugeR + 10;
      drawSparkline(ctx, sparkX, sparkY, 72, 18, g.data, getColor(g.value));
    }
  }, [performance]);

  return (
    <canvas
      ref={canvasRef}
      width={420}
      height={110}
      className="w-full"
      data-testid="performance-gauges"
    />
  );
}
