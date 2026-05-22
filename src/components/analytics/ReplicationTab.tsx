'use client';

import { useRef, useEffect, useCallback, useMemo } from 'react';
import {
  generateFabComparison, generateDistributionCurve, computeCpk,
} from '@/lib/analytics/replication-engine';
import {
  FAB_CONFIGS, FAB_IDS, REPLICATION_PARAMS,
} from '@/lib/analytics/constants';
import type { ReplicationParam } from '@/lib/analytics/types';
import { useAnalyticsStore } from '@/stores/analytics-store';

export function ReplicationTab() {
  const {
    replicationParam, setReplicationParam,
    replicationMargin, replicationSampleSize, replicationConfidence,
  } = useAnalyticsStore();

  const comparison = useMemo(() => generateFabComparison(replicationParam, {
    sampleSize: replicationSampleSize,
    confidence: replicationConfidence,
    margin: replicationMargin,
  }), [replicationParam, replicationSampleSize, replicationConfidence, replicationMargin]);

  const paramDef = REPLICATION_PARAMS.find((p) => p.id === replicationParam)!;
  const passCount = comparison.tostResults.filter((r) => r.pass).length;

  const tostRef = useRef<HTMLCanvasElement>(null);
  const distRef = useRef<HTMLCanvasElement>(null);
  const transferRef = useRef<HTMLCanvasElement>(null);

  const drawCharts = useCallback(() => {
    drawTostChart(tostRef.current, comparison.tostResults, replicationMargin);
    drawDistributions(distRef.current, comparison.fabData, paramDef.target, paramDef.usl, paramDef.lsl);
    drawTransfer(transferRef.current, comparison.fabData, comparison.transferFits);
  }, [comparison, replicationMargin, paramDef]);

  useEffect(() => { drawCharts(); }, [drawCharts]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-2">
        <KpiBox label="Fab Count" value="3" />
        <KpiBox label="Params Matched" value={`${passCount}/3`} />
        <KpiBox label="Pass Rate" value={`${((passCount / 3) * 100).toFixed(0)}%`} />
        <KpiBox label="Max Bias" value={`${Math.max(...comparison.tostResults.map((r) => Math.abs(r.meanDiff))).toFixed(2)}`} />
        <KpiBox label="Transfer R\u00B2" value={comparison.transferFits[0] ? comparison.transferFits[0].rSquared.toFixed(3) : '\u2014'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-3 bg-[var(--smartfactory-surface-card)] border border-[var(--smartfactory-border-default)] rounded p-3">
          <div className="grid grid-cols-3 gap-2">
            {FAB_IDS.map((id) => {
              const cfg = FAB_CONFIGS[id];
              const fabData = comparison.fabData.get(id);
              const cpk = fabData ? computeCpk(fabData, paramDef.usl, paramDef.lsl) : 0;
              return (
                <div key={id} className="bg-[var(--smartfactory-bg-base)] border border-[var(--smartfactory-border-default)] rounded p-2 text-center">
                  <div className="text-xs font-semibold text-[var(--smartfactory-text-primary)]">{cfg.name}</div>
                  <div className="text-[10px] text-[var(--smartfactory-text-muted)]">{cfg.location}</div>
                  <div className={`text-[10px] mt-1 px-1 rounded inline-block ${
                    cfg.maturity === 'Mature' ? 'bg-green-900 text-green-400'
                      : cfg.maturity === 'Established' ? 'bg-blue-900 text-blue-400'
                        : 'bg-amber-900 text-amber-400'
                  }`}>{cfg.maturity}</div>
                  <div className="text-xs text-[var(--smartfactory-text-secondary)] mt-1">Cpk {cpk.toFixed(2)}</div>
                </div>
              );
            })}
          </div>

          <div>
            <label htmlFor="repl-param" className="text-xs text-[var(--smartfactory-text-muted)]">Parameter</label>
            <select id="repl-param" aria-label="Parameter" value={replicationParam}
              onChange={(e) => setReplicationParam(e.target.value as ReplicationParam)}
              className="w-full bg-[var(--smartfactory-bg-base)] border border-[var(--smartfactory-border-default)] rounded px-2 py-1 text-sm text-[var(--smartfactory-text-primary)]">
              {REPLICATION_PARAMS.map((p) => (
                <option key={p.id} value={p.id}>{p.label} ({p.unit})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-[var(--smartfactory-text-muted)]">Equivalence Margin (\u00B1)</label>
            <input type="range" min={0.5} max={5} step={0.1} value={replicationMargin}
              onChange={(e) => useAnalyticsStore.getState().setReplicationMargin(Number(e.target.value))}
              className="w-full" />
            <span className="text-xs text-[var(--smartfactory-text-secondary)]">\u00B1{replicationMargin}</span>
          </div>

          <div>
            <label className="text-xs text-[var(--smartfactory-text-muted)]">Sample Size</label>
            <input type="range" min={30} max={100} step={10} value={replicationSampleSize}
              onChange={(e) => useAnalyticsStore.getState().setReplicationSampleSize(Number(e.target.value))}
              className="w-full" />
            <span className="text-xs text-[var(--smartfactory-text-secondary)]">{replicationSampleSize}</span>
          </div>

          <div className="space-y-1">
            {comparison.tostResults.map((r) => (
              <div key={`${r.fab1}-${r.fab2}`} className="flex justify-between text-xs">
                <span className="text-[var(--smartfactory-text-secondary)]">{r.fab1} \u2194 {r.fab2}</span>
                <span className={r.pass ? 'text-green-400' : 'text-red-400'}>{r.pass ? 'PASS' : 'FAIL'}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <canvas ref={tostRef} data-testid="replication-chart-tost" width={500} height={180}
            className="w-full bg-[var(--smartfactory-surface-card)] border border-[var(--smartfactory-border-default)] rounded" />
          <canvas ref={distRef} data-testid="replication-chart-dist" width={500} height={180}
            className="w-full bg-[var(--smartfactory-surface-card)] border border-[var(--smartfactory-border-default)] rounded" />
          <canvas ref={transferRef} data-testid="replication-chart-transfer" width={500} height={180}
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

const FAB_COLORS: Record<string, string> = { hq: '#22D3EE', satellite: '#A855F7', 'new-build': '#F59E0B' };

function drawTostChart(
  canvas: HTMLCanvasElement | null,
  results: { fab1: string; fab2: string; meanDiff: number; ciLower: number; ciUpper: number; equivalenceLower: number; equivalenceUpper: number; pass: boolean }[],
  margin: number,
) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width: W, height: H } = canvas;
  ctx.clearRect(0, 0, W, H);
  const pad = 40;
  const rowH = (H - 2 * pad) / results.length;
  const xRange = margin * 3;
  const toX = (v: number) => pad + ((v + xRange) / (2 * xRange)) * (W - 2 * pad);
  ctx.strokeStyle = '#EF4444';
  ctx.setLineDash([4, 4]);
  [margin, -margin].forEach((m) => {
    ctx.beginPath(); ctx.moveTo(toX(m), pad); ctx.lineTo(toX(m), H - pad); ctx.stroke();
  });
  ctx.setLineDash([]);
  ctx.strokeStyle = '#64748B';
  ctx.beginPath(); ctx.moveTo(toX(0), pad); ctx.lineTo(toX(0), H - pad); ctx.stroke();
  results.forEach((r, i) => {
    const y = pad + i * rowH + rowH / 2;
    ctx.strokeStyle = r.pass ? '#22C55E' : '#EF4444';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(toX(r.ciLower), y); ctx.lineTo(toX(r.ciUpper), y); ctx.stroke();
    ctx.fillStyle = r.pass ? '#22C55E' : '#EF4444';
    ctx.beginPath(); ctx.arc(toX(r.meanDiff), y, 5, 0, 2 * Math.PI); ctx.fill();
    ctx.fillStyle = '#94A3B8';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${r.fab1}\u2194${r.fab2}`, pad - 4, y + 3);
  });
}

function drawDistributions(
  canvas: HTMLCanvasElement | null,
  fabData: Map<string, number[]>,
  _target: number,
  usl: number,
  lsl: number,
) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width: W, height: H } = canvas;
  ctx.clearRect(0, 0, W, H);
  const pad = 30;
  const allVals = Array.from(fabData.values()).flat();
  const xMin = Math.min(...allVals, lsl);
  const xMax = Math.max(...allVals, usl);
  const xRange = xMax - xMin || 1;
  const toX = (v: number) => pad + ((v - xMin) / xRange) * (W - 2 * pad);
  ctx.strokeStyle = '#EF4444';
  ctx.setLineDash([4, 4]);
  [usl, lsl].forEach((sl) => {
    ctx.beginPath(); ctx.moveTo(toX(sl), pad); ctx.lineTo(toX(sl), H - pad); ctx.stroke();
  });
  ctx.setLineDash([]);
  for (const [fabId, data] of fabData) {
    const mean = data.reduce((s, v) => s + v, 0) / data.length;
    const std = Math.sqrt(data.reduce((s, v) => s + (v - mean) ** 2, 0) / data.length);
    const curve = generateDistributionCurve(mean, std, 100);
    const maxPdf = Math.max(...curve.map((p) => p.pdf));
    ctx.strokeStyle = FAB_COLORS[fabId] ?? '#94A3B8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    curve.forEach((p, i) => {
      const x = toX(p.x);
      const y = H - pad - (p.pdf / maxPdf) * (H - 2 * pad) * 0.8;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
  }
}

function drawTransfer(
  canvas: HTMLCanvasElement | null,
  fabData: Map<string, number[]>,
  fits: { fromFab: string; toFab: string; coefficients: number[]; rSquared: number }[],
) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width: W, height: H } = canvas;
  ctx.clearRect(0, 0, W, H);
  const pad = 30;
  const hqData = fabData.get('hq');
  const satData = fabData.get('satellite');
  if (!hqData || !satData) return;
  const allX = [...hqData];
  const allY = [...satData];
  const xMin = Math.min(...allX); const xMax = Math.max(...allX);
  const yMin = Math.min(...allY); const yMax = Math.max(...allY);
  const xRange = xMax - xMin || 1; const yRange = yMax - yMin || 1;
  const toXp = (v: number) => pad + ((v - xMin) / xRange) * (W - 2 * pad);
  const toYp = (v: number) => H - pad - ((v - yMin) / yRange) * (H - 2 * pad);
  ctx.strokeStyle = '#64748B';
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  const refMin = Math.min(xMin, yMin); const refMax = Math.max(xMax, yMax);
  ctx.moveTo(toXp(refMin), toYp(refMin)); ctx.lineTo(toXp(refMax), toYp(refMax));
  ctx.stroke();
  ctx.setLineDash([]);
  const minLen = Math.min(hqData.length, satData.length);
  ctx.fillStyle = '#A855F744';
  for (let i = 0; i < minLen; i++) {
    ctx.beginPath(); ctx.arc(toXp(hqData[i]), toYp(satData[i]), 3, 0, 2 * Math.PI); ctx.fill();
  }
  if (fits[0]) {
    const [b0, b1] = fits[0].coefficients;
    ctx.strokeStyle = '#A855F7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(toXp(xMin), toYp(b0 + b1 * xMin));
    ctx.lineTo(toXp(xMax), toYp(b0 + b1 * xMax));
    ctx.stroke();
    ctx.fillStyle = '#94A3B8';
    ctx.font = '10px monospace';
    ctx.fillText(`R\u00B2=${fits[0].rSquared.toFixed(3)}`, pad + 4, pad + 12);
  }
}
