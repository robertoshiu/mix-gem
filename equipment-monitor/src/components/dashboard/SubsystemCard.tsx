'use client';

import { useRef, useEffect } from 'react';
import type { SubsystemId, SubsystemSnapshot } from '@/lib/engines/dashboard-facility-types';
import { SUBSYSTEM_DEFS } from '@/lib/engines/dashboard-facility-types';
import { formatMetricValue } from '@/lib/engines/dashboard-facility-engine';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface SubsystemCardProps {
  subsystemId: SubsystemId;
  snapshot: SubsystemSnapshot;
  sparklineData: number[];
}

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

const STATUS_DOT_CLASSES: Record<string, string> = {
  normal: 'bg-green-400',
  warning: 'bg-amber-400',
  critical: 'bg-red-500 animate-pulse',
};

const METRIC_STATUS_CLASSES: Record<string, string> = {
  normal: 'text-[var(--sf-text-primary)]',
  warning: 'text-amber-400',
  critical: 'text-red-500',
};

// ---------------------------------------------------------------------------
// Sparkline drawing
// ---------------------------------------------------------------------------

const MAX_POINTS = 180;

function hexToRgba(hex: string, alpha: number): string {
  const value = hex.replace('#', '');
  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function drawSparkline(
  canvas: HTMLCanvasElement,
  data: number[],
  color: string,
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const rect = canvas.getBoundingClientRect();
  const w = rect.width || 200;
  const h = rect.height || 48;

  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);

  if (data.length < 2) return;

  const pts = data.slice(-MAX_POINTS);
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const range = max - min || 1;
  const pad = 2;

  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.lineJoin = 'round';

  for (let i = 0; i < pts.length; i++) {
    const x = (i / (pts.length - 1)) * w;
    const y = pad + (1 - (pts[i] - min) / range) * (h - pad * 2);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Dot at latest value
  const lastY =
    pad + (1 - (pts[pts.length - 1] - min) / range) * (h - pad * 2);
  ctx.beginPath();
  ctx.fillStyle = color;
  ctx.arc(w - 2, lastY, 2.5, 0, Math.PI * 2);
  ctx.fill();
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SubsystemCard({
  subsystemId,
  snapshot,
  sparklineData,
}: SubsystemCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const def = SUBSYSTEM_DEFS[subsystemId];
  const latestValue = sparklineData.at(-1);
  const previousValue = sparklineData.at(-2);
  const trend = latestValue === undefined || previousValue === undefined
    ? 'not enough trend data yet'
    : latestValue > previousValue
      ? 'trending up'
      : latestValue < previousValue
        ? 'trending down'
        : 'holding steady';

  useEffect(() => {
    if (canvasRef.current) {
      drawSparkline(canvasRef.current, sparklineData, def.color);
    }
  }, [sparklineData, def.color]);

  return (
    <div
      data-subsystem={subsystemId}
      className="rounded-2xl border bg-[rgba(2,6,23,0.72)] p-4 backdrop-blur-xl"
      style={{ borderColor: hexToRgba(def.color, 0.2) }}
    >
      {/* Header: status dot + label */}
      <div className="mb-3 flex items-center gap-2">
        <span
          data-testid="status-dot"
          className={`inline-block h-2.5 w-2.5 rounded-full ${STATUS_DOT_CLASSES[snapshot.status] ?? STATUS_DOT_CLASSES.normal}`}
          aria-hidden="true"
        />
        <span className="sr-only">{def.shortLabel} status: {snapshot.status}</span>
        <span className="text-sm font-semibold text-[var(--sf-text-primary)]">
          {def.shortLabel}
        </span>
        <span className="text-xs text-[var(--sf-text-muted)]">
          &mdash; {def.label}
        </span>
      </div>

      {/* Sparkline canvas */}
      <canvas
        ref={canvasRef}
        className="mb-3 h-12 w-full"
        aria-hidden="true"
      />
      <span className="sr-only">
        {def.shortLabel} primary metric sparkline is {trend}.
      </span>

      {/* Metric grid: 4 columns */}
      <div className="grid grid-cols-4 gap-x-2 gap-y-1 text-center">
        {snapshot.metrics.map((metric, i) => {
          const metricDef = def.metrics[i];
          const precision = metricDef?.precision ?? 1;
          return (
            <div key={metric.key} className="min-w-0">
              <div
                className={`font-mono text-sm font-semibold tabular-nums ${METRIC_STATUS_CLASSES[metric.status] ?? METRIC_STATUS_CLASSES.normal}`}
              >
                {formatMetricValue(metric.value, precision)}
              </div>
              <div className="truncate text-[10px] text-[var(--sf-text-muted)]">
                {metricDef?.label ?? metric.key}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
