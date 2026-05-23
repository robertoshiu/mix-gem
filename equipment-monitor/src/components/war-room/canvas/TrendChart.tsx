'use client';
import { useRef, useEffect, useCallback } from 'react';

interface TrendPoint {
  tick: number;
  value: number;
}

interface TrendChartProps {
  data: TrendPoint[];
  markers?: TrendPoint[];
  label: string;
  unit: string;
  lsl?: number;
  usl?: number;
  color?: string;
  height?: number;
  expanded?: boolean;
  onToggleExpand?: () => void;
}

export function TrendChart({
  data,
  markers,
  label,
  unit,
  lsl,
  usl,
  color = '#22D3EE',
  height,
  expanded = false,
  onToggleExpand,
}: TrendChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartHeight = height ?? (expanded ? 180 : 80);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    const w = parent?.clientWidth ?? 300;
    const h = chartHeight;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    if (data.length === 0) return;

    // Compute Y range
    const values = data.map((d) => d.value);
    let yMin = Math.min(...values);
    let yMax = Math.max(...values);
    if (lsl !== undefined) yMin = Math.min(yMin, lsl);
    if (usl !== undefined) yMax = Math.max(yMax, usl);
    const pad = (yMax - yMin) * 0.1 || 1;
    yMin -= pad;
    yMax += pad;
    const yRange = yMax - yMin;

    // X range from tick values
    const xMin = data[0].tick;
    const xMax = data[data.length - 1].tick;
    const xRange = xMax - xMin || 1;

    const marginLeft = 36;
    const marginRight = 8;
    const marginTop = 4;
    const marginBottom = 4;
    const plotW = w - marginLeft - marginRight;
    const plotH = h - marginTop - marginBottom;

    const toX = (tick: number) =>
      marginLeft + ((tick - xMin) / xRange) * plotW;
    const toY = (val: number) =>
      marginTop + (1 - (val - yMin) / yRange) * plotH;

    // Draw spec limits (LSL / USL)
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    if (lsl !== undefined) {
      const ly = toY(lsl);
      ctx.strokeStyle = '#EF4444';
      ctx.beginPath();
      ctx.moveTo(marginLeft, ly);
      ctx.lineTo(w - marginRight, ly);
      ctx.stroke();
    }
    if (usl !== undefined) {
      const uy = toY(usl);
      ctx.strokeStyle = '#EF4444';
      ctx.beginPath();
      ctx.moveTo(marginLeft, uy);
      ctx.lineTo(w - marginRight, uy);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Draw scenario markers (orange dashed vertical lines)
    if (markers && markers.length > 0) {
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = '#F47920';
      ctx.lineWidth = 1;
      for (const m of markers) {
        const mx = toX(m.tick);
        ctx.beginPath();
        ctx.moveTo(mx, marginTop);
        ctx.lineTo(mx, h - marginBottom);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }

    // Draw data line + fill
    if (data.length >= 2) {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.lineJoin = 'round';

      for (let i = 0; i < data.length; i++) {
        const x = toX(data[i].tick);
        const y = toY(data[i].value);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Fill below at 10% opacity
      const lastX = toX(data[data.length - 1].tick);
      const firstX = toX(data[0].tick);
      ctx.lineTo(lastX, h - marginBottom);
      ctx.lineTo(firstX, h - marginBottom);
      ctx.closePath();
      ctx.fillStyle = color + '1A'; // 10% opacity
      ctx.fill();
    }

    // Y-axis min/max labels
    ctx.fillStyle = '#94A3B8';
    ctx.font = '9px monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(yMax.toFixed(1), marginLeft - 4, marginTop);
    ctx.textBaseline = 'bottom';
    ctx.fillText(yMin.toFixed(1), marginLeft - 4, h - marginBottom);

    // Latest value top-right
    if (data.length > 0) {
      const latest = data[data.length - 1].value;
      ctx.fillStyle = color;
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      ctx.fillText(`${latest.toFixed(1)} ${unit}`, w - marginRight, marginTop);
    }
  }, [data, markers, lsl, usl, color, chartHeight, unit]);

  useEffect(() => {
    draw();
    const handleResize = () => draw();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [draw]);

  return (
    <div
      style={{
        backgroundColor: 'var(--sf-surface-card, #1E293B)',
        border: '1px solid rgba(148,163,184,0.15)',
        borderRadius: 6,
        padding: '6px 8px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 4,
        }}
      >
        <span
          style={{
            color: '#CBD5E1',
            fontSize: 10,
            fontFamily: 'monospace',
            fontWeight: 600,
          }}
        >
          {label}
        </span>
        {onToggleExpand && (
          <button
            onClick={onToggleExpand}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748B',
              cursor: 'pointer',
              fontSize: 10,
              fontFamily: 'monospace',
              padding: '0 2px',
            }}
            aria-label={expanded ? 'Collapse chart' : 'Expand chart'}
          >
            {expanded ? '\u25B2' : '\u25BC'}
          </button>
        )}
      </div>
      <canvas ref={canvasRef} aria-label={`${label} trend chart`} role="img" />
    </div>
  );
}
