'use client';

import { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import {
  generateSystemRBD, generateLifeProjection, accelerationFactor,
} from '@/lib/analytics/reliability-engine';
import type { RbdTopology, Subsystem } from '@/lib/analytics/types';
import { DEFAULT_SUBSYSTEMS } from '@/lib/analytics/constants';
import { useAnalyticsStore } from '@/stores/analytics-store';

export function ReliabilityTab() {
  const { rbdTopology, setRbdTopology, reliabilityEa, setReliabilityEa, reliabilityUseTemp } = useAnalyticsStore();
  const [subsystems, setSubsystems] = useState<Subsystem[]>(DEFAULT_SUBSYSTEMS.map((s) => ({ ...s })));

  const rbdResult = useMemo(() => generateSystemRBD(subsystems, rbdTopology), [subsystems, rbdTopology]);
  const lifeProjection = useMemo(() => generateLifeProjection(reliabilityEa, 0, 0, reliabilityUseTemp, 50), [reliabilityEa, reliabilityUseTemp]);
  const af125 = accelerationFactor(reliabilityEa, reliabilityUseTemp + 273.15, 125 + 273.15);

  const rbdRef = useRef<HTMLCanvasElement>(null);
  const lifeRef = useRef<HTMLCanvasElement>(null);

  const drawCharts = useCallback(() => {
    drawRbdDiagram(rbdRef.current, rbdResult, rbdTopology);
    drawLifeProjection(lifeRef.current, lifeProjection, reliabilityUseTemp);
  }, [rbdResult, rbdTopology, lifeProjection, reliabilityUseTemp]);

  useEffect(() => { drawCharts(); }, [drawCharts]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-2">
        <KpiBox label="System Availability" value={`${(rbdResult.systemAvail * 100).toFixed(2)}%`} />
        <KpiBox label="System MTBF" value={`${rbdResult.systemMtbf.toFixed(0)}h`} />
        <KpiBox label="Worst Subsystem" value={rbdResult.bottleneck} />
        <KpiBox label="Ea" value={`${reliabilityEa.toFixed(2)} eV`} />
        <KpiBox label="AF @125\u00B0C" value={`${af125.toFixed(1)}\u00D7`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-3 bg-[var(--smartfactory-surface-card)] border border-[var(--smartfactory-border-default)] rounded p-3">
          <div className="flex gap-2">
            {(['series', 'parallel', 'series-parallel'] as RbdTopology[]).map((t) => (
              <button key={t} onClick={() => setRbdTopology(t)}
                className={`px-3 py-1 text-xs rounded capitalize ${rbdTopology === t ? 'bg-blue-600 text-white' : 'bg-[var(--smartfactory-surface-card)] text-[var(--smartfactory-text-secondary)] border border-[var(--smartfactory-border-default)]'}`}>
                {t === 'series-parallel' ? 'Series-Parallel' : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          <div>
            <label className="text-xs text-[var(--smartfactory-text-muted)]">Activation Energy (eV)</label>
            <input type="range" min={0.3} max={1.2} step={0.01} value={reliabilityEa}
              onChange={(e) => setReliabilityEa(Number(e.target.value))} className="w-full" />
            <span className="text-xs text-[var(--smartfactory-text-secondary)]">{reliabilityEa.toFixed(2)} eV</span>
          </div>

          {subsystems.map((s, i) => (
            <div key={s.id} className="grid grid-cols-3 gap-1 items-center text-xs">
              <span className="text-[var(--smartfactory-text-secondary)]">{s.name}</span>
              <div>
                <span className="text-[var(--smartfactory-text-muted)]">\u03BB</span>
                <input type="range" min={0.1} max={10} step={0.1} value={s.lambda}
                  onChange={(e) => {
                    const next = [...subsystems];
                    next[i] = { ...next[i], lambda: Number(e.target.value) };
                    setSubsystems(next);
                  }} className="w-full" />
              </div>
              <div>
                <span className="text-[var(--smartfactory-text-muted)]">\u03BC</span>
                <input type="range" min={1} max={50} step={1} value={s.mu}
                  onChange={(e) => {
                    const next = [...subsystems];
                    next[i] = { ...next[i], mu: Number(e.target.value) };
                    setSubsystems(next);
                  }} className="w-full" />
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <canvas ref={rbdRef} data-testid="reliability-chart-rbd" width={500} height={250}
            className="w-full bg-[var(--smartfactory-surface-card)] border border-[var(--smartfactory-border-default)] rounded" />
          <canvas ref={lifeRef} data-testid="reliability-chart-life" width={500} height={250}
            className="w-full bg-[var(--smartfactory-surface-card)] border border-[var(--smartfactory-border-default)] rounded" />
        </div>
      </div>
    </div>
  );
}

function KpiBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--smartfactory-surface-card)] border border-[var(--smartfactory-border-default)] rounded p-2 text-center">
      <div className="text-xs text-[var(--smartfactory-text-muted)]">{label}</div>
      <div className="text-sm font-semibold text-[var(--smartfactory-text-primary)]">{value}</div>
    </div>
  );
}

const BLOCK_COLORS = { green: '#22C55E', amber: '#F59E0B', red: '#EF4444' };

function drawRbdDiagram(
  canvas: HTMLCanvasElement | null,
  result: ReturnType<typeof generateSystemRBD>,
  topology: RbdTopology,
) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width: W, height: H } = canvas;
  ctx.clearRect(0, 0, W, H);
  const { subsystemAvails } = result;
  const n = subsystemAvails.length;
  const pad = 20;
  const blockW = (W - 2 * pad - (n - 1) * 8) / n;
  const blockH = 40;

  if (topology === 'series') {
    const y = H / 2 - blockH / 2;
    subsystemAvails.forEach((s, i) => {
      const x = pad + i * (blockW + 8);
      const color = s.availability > 0.99 ? BLOCK_COLORS.green : s.availability > 0.95 ? BLOCK_COLORS.amber : BLOCK_COLORS.red;
      ctx.fillStyle = color + '44';
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.fillRect(x, y, blockW, blockH);
      ctx.strokeRect(x, y, blockW, blockH);
      ctx.fillStyle = '#E2E8F0';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(s.id.slice(0, 4).toUpperCase(), x + blockW / 2, y + blockH / 2 + 4);
      if (i < n - 1) {
        ctx.strokeStyle = '#64748B';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + blockW, y + blockH / 2);
        ctx.lineTo(x + blockW + 8, y + blockH / 2);
        ctx.stroke();
      }
    });
  } else {
    const rowH = (H - 2 * pad) / n;
    subsystemAvails.forEach((s, i) => {
      const x = W / 2 - blockW / 2;
      const y = pad + i * rowH + (rowH - blockH) / 2;
      const color = s.availability > 0.99 ? BLOCK_COLORS.green : s.availability > 0.95 ? BLOCK_COLORS.amber : BLOCK_COLORS.red;
      ctx.fillStyle = color + '44';
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.fillRect(x, y, blockW, blockH);
      ctx.strokeRect(x, y, blockW, blockH);
      ctx.fillStyle = '#E2E8F0';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(s.id.slice(0, 4).toUpperCase(), x + blockW / 2, y + blockH / 2 + 4);
    });
  }
}

function drawLifeProjection(
  canvas: HTMLCanvasElement | null,
  points: { tempC: number; arrhenius: number; eyring: number }[],
  useTempC: number,
) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width: W, height: H } = canvas;
  ctx.clearRect(0, 0, W, H);
  if (points.length === 0) return;
  const pad = 40;
  const arrVals = points.map((p) => Math.log10(Math.max(1, p.arrhenius)));
  const yMin = Math.min(...arrVals);
  const yMax = Math.max(...arrVals);
  const yRange = yMax - yMin || 1;
  const toX = (i: number) => pad + (i / (points.length - 1)) * (W - 2 * pad);
  const toY = (logV: number) => H - pad - ((logV - yMin) / yRange) * (H - 2 * pad);

  ctx.strokeStyle = '#3B82F6';
  ctx.lineWidth = 2;
  ctx.beginPath();
  points.forEach((p, i) => {
    const y = toY(Math.log10(Math.max(1, p.arrhenius)));
    i === 0 ? ctx.moveTo(toX(i), y) : ctx.lineTo(toX(i), y);
  });
  ctx.stroke();

  ctx.strokeStyle = '#F59E0B';
  ctx.lineWidth = 2;
  ctx.beginPath();
  points.forEach((p, i) => {
    const y = toY(Math.log10(Math.max(1, p.eyring)));
    i === 0 ? ctx.moveTo(toX(i), y) : ctx.lineTo(toX(i), y);
  });
  ctx.stroke();

  const useIdx = points.findIndex((p) => p.tempC >= useTempC);
  if (useIdx >= 0) {
    ctx.strokeStyle = '#EF4444';
    ctx.setLineDash([4, 4]);
    const x = toX(useIdx);
    ctx.beginPath(); ctx.moveTo(x, pad); ctx.lineTo(x, H - pad); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#EF4444';
    ctx.font = '10px monospace';
    ctx.fillText(`${useTempC}\u00B0C`, x + 4, pad + 12);
  }
}
