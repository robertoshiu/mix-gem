'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { WaferMetric, WaferState } from '@/lib/lens-sim';
import { DIE_GRID_COLS, DIE_GRID_ROWS, DIE_MASK } from '@/lib/lens-sim/constants';

interface WaferImpactMapProps {
  wafer: WaferState | null;
  metric: WaferMetric;
  onMetricChange: (metric: WaferMetric) => void;
}

const METRICS: Array<{ id: WaferMetric; label: string; labelCN: string }> = [
  { id: 'cd', label: 'CD', labelCN: '\u7EBF\u5BBD' },
  { id: 'overlay', label: 'Overlay', labelCN: '\u5957\u523B' },
  { id: 'ler', label: 'LER', labelCN: '\u7EBF\u8FB9\u7C97\u7CD9' },
  { id: 'defectivity', label: 'Defect', labelCN: '\u7F3A\u9677' },
];

const COLORMAPS: Record<WaferMetric, { lo: [number, number, number]; mid: [number, number, number]; hi: [number, number, number]; range: [number, number] }> = {
  cd:           { lo: [59, 130, 246],  mid: [255, 255, 255], hi: [239, 68, 68],   range: [-3, 3] },
  overlay:      { lo: [34, 197, 94],   mid: [250, 204, 21],  hi: [239, 68, 68],   range: [0, 2.5] },
  ler:          { lo: [34, 211, 238],  mid: [168, 85, 247],  hi: [236, 72, 153],  range: [2.0, 4.5] },
  defectivity:  { lo: [34, 197, 94],   mid: [250, 204, 21],  hi: [239, 68, 68],   range: [0, 5] },
};

function lerpColor(a: [number, number, number], b: [number, number, number], t: number): string {
  const r = Math.round(a[0] + (b[0] - a[0]) * t);
  const g = Math.round(a[1] + (b[1] - a[1]) * t);
  const bl = Math.round(a[2] + (b[2] - a[2]) * t);
  return `rgb(${r},${g},${bl})`;
}

function valueToColor(value: number, metric: WaferMetric): string {
  const { lo, mid, hi, range } = COLORMAPS[metric];
  const t = Math.max(0, Math.min(1, (value - range[0]) / (range[1] - range[0])));
  if (t < 0.5) return lerpColor(lo, mid, t / 0.5);
  return lerpColor(mid, hi, (t - 0.5) / 0.5);
}

function getMetricData(wafer: WaferState, metric: WaferMetric): number[] {
  switch (metric) {
    case 'cd': return wafer.cdMap;
    case 'overlay': return wafer.overlayMap;
    case 'ler': return wafer.lerMap;
    case 'defectivity': return wafer.defectMap;
  }
}

export function WaferImpactMap({ wafer, metric, onMetricChange }: WaferImpactMapProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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
    ctx.strokeStyle = '#22d3ee44';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Notch
    ctx.beginPath();
    ctx.arc(cx, cy + radius + 2, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#22d3ee';
    ctx.fill();

    if (!wafer) {
      ctx.fillStyle = '#64748b';
      ctx.font = '13px "Fira Code", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Press Play to start exposure', cx, cy);
      return;
    }

    const data = getMetricData(wafer, metric);

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
            metric === 'defectivity' ? value.toFixed(1) : value.toFixed(2),
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
      ctx.fillStyle = valueToColor(range[0] + t * (range[1] - range[0]), metric);
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
      `${metricLabel?.label ?? metric} Map — Wafer ${wafer.waferIndex + 1} (illustrative)`,
      cx,
      oy - 22,
    );
  }, [wafer, metric]);

  useEffect(() => {
    draw();
    window.addEventListener('resize', draw);
    return () => window.removeEventListener('resize', draw);
  }, [draw]);

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
                ? 'border border-[var(--sf-accent-cyan)] bg-[rgba(34,211,238,0.12)] text-white'
                : 'border border-transparent text-[var(--sf-text-secondary)] hover:bg-white/[0.06]'
            }`}
          >
            {m.label} <span className="text-[var(--sf-text-muted)]/60">({m.labelCN})</span>
          </button>
        ))}
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        data-testid="wafer-impact-canvas"
        className="flex-1"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
