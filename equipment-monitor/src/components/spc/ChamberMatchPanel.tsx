'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { PROCESS_ORDER, INITIAL_PROCESSES } from '@/lib/fab-process-data';
import type { ProcessId } from '@/lib/fab-process-data';
import { FDC_PARAM_IDS, FDC_PARAMS, generateChamberMatchStats } from '@/lib/tool-health';
import type { FdcParamId } from '@/lib/tool-health';

export function ChamberMatchPanel() {
  const [processId, setProcessId] = useState<ProcessId>(PROCESS_ORDER[0]);
  const [paramId, setParamId] = useState<FdcParamId>(FDC_PARAM_IDS[0]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const process = INITIAL_PROCESSES.find(p => p.id === processId);
  const chambers = useMemo(
    () => (process?.equipment ?? []).map(e => ({ id: e.id, name: e.name })),
    [process],
  );

  const stats = useMemo(
    () => generateChamberMatchStats(chambers, paramId),
    [chambers, paramId],
  );

  const groupMean = stats.length > 0 ? stats.reduce((s, c) => s + c.mean, 0) / stats.length : 0;
  const groupSigma = stats.length > 0
    ? Math.sqrt(stats.reduce((s, c) => s + c.sigma ** 2, 0) / stats.length)
    : 1;

  const drifted = stats.filter(c => Math.abs(c.mean - groupMean) > 2 * groupSigma);
  const allMatched = drifted.length === 0;

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;

    const w = cvs.width;
    const h = cvs.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(2, 6, 23, 0.6)';
    ctx.fillRect(0, 0, w, h);

    if (stats.length === 0) return;

    const pad = { top: 12, bottom: 32, left: 44, right: 12 };
    const plotW = w - pad.left - pad.right;
    const plotH = h - pad.top - pad.bottom;

    const allValues = stats.flatMap(s => [s.mean - 3 * s.sigma, s.mean + 3 * s.sigma]);
    const minV = Math.min(...allValues);
    const maxV = Math.max(...allValues);
    const range = maxV - minV || 1;

    const yFrom = (v: number) => pad.top + plotH - ((v - minV) / range) * plotH;

    // Group mean line
    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad.left, yFrom(groupMean));
    ctx.lineTo(pad.left + plotW, yFrom(groupMean));
    ctx.stroke();
    ctx.setLineDash([]);

    const barW = Math.min(40, plotW / stats.length - 8);

    stats.forEach((stat, idx) => {
      const cx = pad.left + ((idx + 0.5) / stats.length) * plotW;
      const barX = cx - barW / 2;
      const yBar = yFrom(stat.mean);
      const yBase = yFrom(minV);

      const offset = Math.abs(stat.mean - groupMean) / groupSigma;
      let barColor = '#22C55E';
      if (offset > 3) barColor = '#EF4444';
      else if (offset > 2) barColor = '#F59E0B';

      ctx.fillStyle = barColor + '88';
      ctx.fillRect(barX, yBar, barW, yBase - yBar);
      ctx.strokeStyle = barColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(barX, yBar, barW, yBase - yBar);

      // Error whiskers
      const yUp = yFrom(stat.mean + 3 * stat.sigma);
      const yDown = yFrom(stat.mean - 3 * stat.sigma);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, yUp);
      ctx.lineTo(cx, yDown);
      ctx.stroke();
      const capW = 6;
      ctx.beginPath();
      ctx.moveTo(cx - capW, yUp);
      ctx.lineTo(cx + capW, yUp);
      ctx.moveTo(cx - capW, yDown);
      ctx.lineTo(cx + capW, yDown);
      ctx.stroke();

      // Label
      ctx.fillStyle = '#94a3b8';
      ctx.font = '7px monospace';
      ctx.textAlign = 'center';
      const shortId = stat.chamberId.split('-').slice(-2).join('-');
      ctx.fillText(shortId, cx, h - pad.bottom + 14);
    });

    // Y axis
    ctx.fillStyle = '#94a3b8';
    ctx.font = '7px monospace';
    ctx.textAlign = 'right';
    const nTicks = 4;
    for (let i = 0; i <= nTicks; i++) {
      const v = minV + (range * i) / nTicks;
      ctx.fillText(v.toFixed(0), pad.left - 4, yFrom(v) + 3);
    }
  }, [stats, groupMean, groupSigma]);

  return (
    <div className="bg-[var(--smartfactory-surface-card)] border border-[var(--smartfactory-border-default)] rounded-lg p-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold text-[var(--smartfactory-text-muted)] tracking-wider">CHAMBER MATCHING</span>
        <select
          data-testid="match-process-select"
          value={processId}
          onChange={e => setProcessId(e.target.value as ProcessId)}
          className="bg-slate-800 border border-slate-600 rounded px-2 py-0.5 text-xs text-[var(--smartfactory-text-primary)]"
        >
          {PROCESS_ORDER.map(pid => {
            const proc = INITIAL_PROCESSES.find(p => p.id === pid);
            return <option key={pid} value={pid}>{proc?.name ?? pid}</option>;
          })}
        </select>
        <select
          data-testid="match-param-select"
          value={paramId}
          onChange={e => setParamId(e.target.value as FdcParamId)}
          className="bg-slate-800 border border-slate-600 rounded px-2 py-0.5 text-xs text-[var(--smartfactory-text-primary)]"
        >
          {FDC_PARAM_IDS.map(pid => (
            <option key={pid} value={pid}>{FDC_PARAMS[pid].label}</option>
          ))}
        </select>
      </div>

      <canvas ref={canvasRef} width={640} height={240} className="w-full" />

      <div data-testid="match-summary" className="mt-1 text-xs font-mono">
        {allMatched ? (
          <span className="text-green-400">
            {stats.length} chambers matched
          </span>
        ) : (
          <span className="text-amber-400">
            {drifted.map(d => d.chamberId).join(', ')} drifted
          </span>
        )}
      </div>
    </div>
  );
}
