'use client';

import { useRef, useEffect } from 'react';
import type { SubsystemId, SubsystemSnapshot, EquipmentStatus } from '@/lib/engines/dashboard-facility-types';
import { SUBSYSTEM_DEFS } from '@/lib/engines/dashboard-facility-types';
import { formatMetricValue } from '@/lib/engines/dashboard-facility-engine';

// ---------------------------------------------------------------------------
// Chart title mapping
// ---------------------------------------------------------------------------

const CHART_TITLES: Record<SubsystemId, string> = {
  ems: 'Cleanroom Temp',
  bas: 'Chiller Load',
  gas: 'NH\u2083 Concentration',
  fire: 'Smoke Obscuration',
  power: 'Total Load',
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface SubsystemCardProps {
  subsystemId: SubsystemId;
  snapshot: SubsystemSnapshot;
  sparklineData: number[];
  equipmentStatuses: [EquipmentStatus, EquipmentStatus, EquipmentStatus];
}

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

const STATUS_DOT_CLASSES: Record<string, string> = {
  normal: 'bg-green-400',
  warning: 'bg-amber-400',
  critical: 'bg-red-500 animate-pulse motion-reduce:animate-none',
};

const EQUIP_STATUS_ICON: Record<string, string> = {
  running: '\u2713',
  maintenance: '\u26A0',
  fault: '\u2717',
};

const EQUIP_STATUS_COLOR: Record<string, string> = {
  running: 'text-emerald-400',
  maintenance: 'text-amber-400',
  fault: 'text-red-400',
};

// ---------------------------------------------------------------------------
// Threshold-band chart
// ---------------------------------------------------------------------------

function drawThresholdChart(
  canvas: HTMLCanvasElement,
  data: number[],
  color: string,
  warnLo: number,
  warnHi: number,
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const rect = canvas.getBoundingClientRect();
  const w = rect.width || 280;
  const h = rect.height || 140;

  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);

  const pad = { top: 16, bottom: 24, left: 40, right: 12 };
  const chartW = w - pad.left - pad.right;
  const chartH = h - pad.top - pad.bottom;

  const dataMin = data.length > 0 ? Math.min(...data) : warnLo;
  const dataMax = data.length > 0 ? Math.max(...data) : warnHi;
  const range = warnHi - warnLo;
  const yMin = Math.min(dataMin, warnLo - range * 0.3);
  const yMax = Math.max(dataMax, warnHi + range * 0.3);
  const yRange = yMax - yMin || 1;

  const toY = (v: number) => pad.top + (1 - (v - yMin) / yRange) * chartH;
  const toX = (i: number) => pad.left + (data.length > 1 ? (i / (data.length - 1)) * chartW : chartW / 2);

  // Green band
  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = color;
  const bandTop = toY(warnHi);
  const bandBottom = toY(warnLo);
  ctx.fillRect(pad.left, bandTop, chartW, bandBottom - bandTop);
  ctx.restore();

  // Red zones
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(pad.left, pad.top, chartW, bandTop - pad.top);
  ctx.fillRect(pad.left, bandBottom, chartW, pad.top + chartH - bandBottom);
  ctx.restore();

  // Threshold lines (dashed)
  ctx.save();
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(pad.left, bandTop);
  ctx.lineTo(pad.left + chartW, bandTop);
  ctx.moveTo(pad.left, bandBottom);
  ctx.lineTo(pad.left + chartW, bandBottom);
  ctx.stroke();
  ctx.restore();

  // Y-axis labels
  ctx.save();
  ctx.font = '9px monospace';
  ctx.fillStyle = 'rgba(148,163,184,0.7)';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  const yTicks = [yMin, warnLo, warnHi, yMax];
  for (const val of yTicks) {
    const y = toY(val);
    if (y >= pad.top - 2 && y <= pad.top + chartH + 2) {
      ctx.fillText(val.toFixed(val < 10 ? 1 : 0), pad.left - 4, y);
    }
  }
  ctx.restore();

  // Metric line
  if (data.length >= 2) {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    for (let i = 0; i < data.length; i++) {
      const x = toX(i);
      const y = toY(data[i]);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Latest value dot
    const lastX = toX(data.length - 1);
    const lastY = toY(data[data.length - 1]);
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.arc(lastX, lastY, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SubsystemCard({
  subsystemId,
  snapshot,
  sparklineData,
  equipmentStatuses,
}: SubsystemCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const def = SUBSYSTEM_DEFS[subsystemId];
  const primaryMetricDef = def.metrics[0];

  useEffect(() => {
    if (canvasRef.current) {
      drawThresholdChart(
        canvasRef.current,
        sparklineData,
        def.color,
        primaryMetricDef.warnLo,
        primaryMetricDef.warnHi,
      );
    }
  }, [sparklineData, def.color, primaryMetricDef.warnLo, primaryMetricDef.warnHi]);

  return (
    <div
      data-subsystem={subsystemId}
      className="rounded-2xl border bg-[rgba(2,6,23,0.72)] p-4 backdrop-blur-xl"
      style={{ borderColor: `${def.color}33` }}
    >
      {/* Header */}
      <div className="mb-2 flex items-center gap-2">
        <span
          data-testid="status-dot"
          aria-label={`Subsystem status: ${snapshot.status}`}
          className={`h-2.5 w-2.5 rounded-full ${STATUS_DOT_CLASSES[snapshot.status] ?? STATUS_DOT_CLASSES.normal}`}
        />
        <span className="text-sm font-semibold text-[var(--sf-text-primary)]">
          {def.shortLabel}
        </span>
        <span className="text-xs text-[var(--sf-text-muted)]">
          &mdash; {def.label}
        </span>
      </div>

      {/* Chart title + latest value */}
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--sf-text-muted)]">
          {CHART_TITLES[subsystemId]}
        </span>
        <span className="font-mono text-xs tabular-nums" style={{ color: def.color }}>
          {formatMetricValue(snapshot.metrics[0].value, primaryMetricDef.precision)}{primaryMetricDef.unit}
        </span>
      </div>

      {/* Threshold-band chart */}
      <canvas
        ref={canvasRef}
        role="img"
        className="mb-3 h-[140px] w-full rounded-lg bg-[rgba(255,255,255,0.02)]"
        aria-label={`${CHART_TITLES[subsystemId]} trend chart`}
      />

      {/* Metrics row */}
      <div className="mb-3 grid grid-cols-4 gap-x-2 text-center border-b border-[rgba(255,255,255,0.06)] pb-3">
        {snapshot.metrics.map((metric, i) => {
          const metricDef = def.metrics[i];
          const statusColor = metric.status === 'critical' ? 'text-red-400'
            : metric.status === 'warning' ? 'text-amber-400'
            : 'text-[var(--sf-text-primary)]';
          return (
            <div key={metric.key} className="min-w-0">
              <div className={`font-mono text-xs font-semibold tabular-nums ${statusColor}`}>
                {formatMetricValue(metric.value, metricDef.precision)}{metricDef.unit}
              </div>
              <div className="truncate text-[9px] text-[var(--sf-text-muted)]">
                {metricDef.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Equipment status */}
      <div className="space-y-1">
        {equipmentStatuses.map((eq) => (
          <div
            key={eq.name}
            className="flex items-center gap-2 text-[10px]"
            aria-label={`${eq.name} status ${eq.status}: ${eq.detail}`}
          >
            <span aria-hidden="true" className={`shrink-0 font-bold ${EQUIP_STATUS_COLOR[eq.status]}`}>
              {EQUIP_STATUS_ICON[eq.status]}
            </span>
            <span className="flex-1 truncate text-[var(--sf-text-secondary)]">
              {eq.name}
            </span>
            <span className="shrink-0 font-mono text-[var(--sf-text-muted)]">
              {eq.detail}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
