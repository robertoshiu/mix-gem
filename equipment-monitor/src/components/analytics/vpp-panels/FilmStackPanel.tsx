'use client';

import { useRef, useEffect } from 'react';
import type { FilmLayer } from '@/lib/analytics/types';

interface Props {
  filmStack: FilmLayer[];
}

export function FilmStackPanel({ filmStack }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const totalThickness = filmStack.reduce((s, l) => s + l.thickness, 0);

  useEffect(() => {
    drawFilmStack(canvasRef.current, filmStack);
  });

  return (
    <div className="space-y-2">
      <canvas ref={canvasRef} data-testid="film-stack-canvas" width={500} height={200}
        className="w-full bg-[var(--smartfactory-bg-base)] rounded" />
      <div className="flex flex-wrap gap-2 text-xs text-[var(--smartfactory-text-secondary)]">
        {filmStack.map((l, i) => (
          <span key={i} className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-sm" style={{ backgroundColor: l.color }} />
            {l.material} — {l.thickness.toFixed(0)} nm
          </span>
        ))}
      </div>
      <div className="text-xs text-[var(--smartfactory-text-muted)]">
        Total: {totalThickness.toFixed(0)} nm | {filmStack.length} layers | Thickest: {filmStack.length > 0 ? filmStack.reduce((a, b) => a.thickness > b.thickness ? a : b).material : '—'}
      </div>
    </div>
  );
}

function drawFilmStack(canvas: HTMLCanvasElement | null, stack: FilmLayer[]) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width: W, height: H } = canvas;
  ctx.clearRect(0, 0, W, H);
  if (stack.length === 0) return;

  const pad = 20;
  const totalThickness = stack.reduce((s, l) => s + l.thickness, 0);
  const drawH = H - 2 * pad;
  const barW = W * 0.4;
  const barX = (W - barW) / 2;

  ctx.fillStyle = '#475569';
  ctx.fillRect(barX, H - pad - 20, barW, 20);
  ctx.fillStyle = '#94A3B8';
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('Si Substrate', barX + barW / 2, H - pad - 6);

  let y = H - pad - 20;
  for (let i = stack.length - 1; i >= 0; i--) {
    const layerH = Math.max(15, (stack[i].thickness / totalThickness) * (drawH - 20));
    y -= layerH;
    ctx.fillStyle = stack[i].color + '88';
    ctx.strokeStyle = stack[i].color;
    ctx.lineWidth = 1;
    ctx.fillRect(barX, y, barW, layerH);
    ctx.strokeRect(barX, y, barW, layerH);
    ctx.fillStyle = '#94A3B8';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${stack[i].material} ${stack[i].thickness.toFixed(0)}nm`, barX + barW + 8, y + layerH / 2 + 4);
  }
}
