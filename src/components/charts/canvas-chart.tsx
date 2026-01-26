'use client';

import { useRef, useEffect } from 'react';

interface DataPoint {
  timestamp: Date | number;
  value: number;
}

interface CanvasChartProps {
  data: DataPoint[];
  width: number;
  height: number;
  color?: string;
  lsl?: number;
  usl?: number;
  className?: string;
}

export function CanvasChart({
  data,
  width,
  height,
  color = '#3B82F6',
  lsl,
  usl,
  className,
}: CanvasChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculate data range
    const values = data.map((d) => d.value);
    const minValue = Math.min(...values, lsl ?? Infinity);
    const maxValue = Math.max(...values, usl ?? -Infinity);
    const range = maxValue - minValue || 1;

    // Add 10% padding to the range
    const padding = range * 0.1;
    const yMin = minValue - padding;
    const yMax = maxValue + padding;
    const yRange = yMax - yMin;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw spec limits if provided
    if (lsl !== undefined) {
      const lslY = height - ((lsl - yMin) / yRange) * height;
      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, lslY);
      ctx.lineTo(width, lslY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (usl !== undefined) {
      const uslY = height - ((usl - yMin) / yRange) * height;
      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, uslY);
      ctx.lineTo(width, uslY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw data line
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();

    data.forEach((point, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((point.value - yMin) / yRange) * height;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw filled area
    ctx.fillStyle = color + '33'; // 20% opacity
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();
  }, [data, width, height, color, lsl, usl]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={className}
      aria-label="Chart visualization"
      role="img"
    />
  );
}
