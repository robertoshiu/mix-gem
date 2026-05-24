'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { INITIAL_PROCESSES } from '@/lib/fab-process-data';
import { FDC_PARAM_IDS, FDC_PARAMS, generateFdcTraces } from '@/lib/tool-health';
import type { FdcAnomalyType, FdcParamId } from '@/lib/tool-health';

const ANOMALY_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'No Anomaly' },
  { value: 'drift', label: 'Drift' },
  { value: 'spike', label: 'Spike' },
  { value: 'oscillation', label: 'Oscillation' },
  { value: 'step-shift', label: 'Step-Shift' },
];

const TRACE_COLORS: Record<FdcParamId, string> = {
  pressure: '#F59E0B',
  rfPower: '#3B82F6',
  temperature: '#EF4444',
  gasFlow1: '#22C55E',
  gasFlow2: '#06B6D4',
  biasVoltage: '#A855F7',
};

const ALL_CHAMBERS = INITIAL_PROCESSES.flatMap(p =>
  p.equipment.map(e => ({ id: e.id, name: e.name }))
);

export function FdcTraceViewer() {
  const [chamberId, setChamberId] = useState(ALL_CHAMBERS[0]?.id ?? '');
  const [anomalyType, setAnomalyType] = useState<FdcAnomalyType | undefined>(undefined);
  const [visibleParams, setVisibleParams] = useState<Set<FdcParamId>>(new Set(FDC_PARAM_IDS));
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const traces = useMemo(
    () => generateFdcTraces(chamberId, anomalyType),
    [chamberId, anomalyType],
  );

  const toggleParam = useCallback((pid: FdcParamId) => {
    setVisibleParams(prev => {
      const next = new Set(prev);
      if (next.has(pid)) next.delete(pid); else next.add(pid);
      return next;
    });
  }, []);

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

    const pad = { top: 4, bottom: 20, left: 52, right: 8 };
    const plotW = w - pad.left - pad.right;

    const visibleTraces = traces.filter(tr => visibleParams.has(tr.paramId));
    if (visibleTraces.length === 0) return;

    const traceH = Math.floor((h - pad.top - pad.bottom) / visibleTraces.length);

    visibleTraces.forEach((trace, idx) => {
      const param = FDC_PARAMS[trace.paramId];
      const color = TRACE_COLORS[trace.paramId];
      const baseY = pad.top + idx * traceH;

      const allVals = trace.samples.map(s => s.value);
      const minV = Math.min(...allVals, param.fdcLower);
      const maxV = Math.max(...allVals, param.fdcUpper);
      const range = maxV - minV || 1;

      const yFrom = (v: number) => baseY + traceH - 4 - ((v - minV) / range) * (traceH - 8);

      // FDC limit band
      const yUpper = yFrom(param.fdcUpper);
      const yLower = yFrom(param.fdcLower);
      ctx.fillStyle = 'rgba(34, 197, 94, 0.06)';
      ctx.fillRect(pad.left, yUpper, plotW, yLower - yUpper);

      // Anomaly overlay
      for (const s of trace.samples) {
        if (s.anomaly) {
          const x = pad.left + (s.t / 199) * plotW;
          ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
          ctx.fillRect(x - 1, baseY, 3, traceH);
        }
      }

      // Setpoint dashed line
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      const ySet = yFrom(param.setpoint);
      ctx.moveTo(pad.left, ySet);
      ctx.lineTo(pad.left + plotW, ySet);
      ctx.stroke();
      ctx.setLineDash([]);

      // Signal line
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      for (let i = 0; i < trace.samples.length; i++) {
        const x = pad.left + (i / 199) * plotW;
        const y = yFrom(trace.samples[i].value);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Y label
      ctx.fillStyle = '#94a3b8';
      ctx.font = '7px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${param.label.slice(0, 8)}`, pad.left - 4, baseY + traceH / 2 + 3);
    });

    // X axis
    ctx.fillStyle = '#94a3b8';
    ctx.font = '7px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('0', pad.left, h - 4);
    ctx.fillText('200', pad.left + plotW, h - 4);
    ctx.fillText('Time (s)', pad.left + plotW / 2, h - 4);
  }, [traces, visibleParams]);

  return (
    <div className="bg-[var(--smartfactory-surface-card)] border border-[var(--smartfactory-border-default)] rounded-lg p-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold text-[var(--smartfactory-text-muted)] tracking-wider">FDC TRACES</span>
        <select
          data-testid="fdc-chamber-select"
          value={chamberId}
          onChange={e => setChamberId(e.target.value)}
          className="bg-slate-800 border border-slate-600 rounded px-2 py-0.5 text-xs text-[var(--smartfactory-text-primary)]"
        >
          {ALL_CHAMBERS.map(c => (
            <option key={c.id} value={c.id}>{c.id} — {c.name}</option>
          ))}
        </select>
        <select
          data-testid="fdc-anomaly-select"
          value={anomalyType ?? ''}
          onChange={e => setAnomalyType((e.target.value || undefined) as FdcAnomalyType | undefined)}
          className="bg-slate-800 border border-slate-600 rounded px-2 py-0.5 text-xs text-[var(--smartfactory-text-primary)]"
        >
          {ANOMALY_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <canvas ref={canvasRef} width={640} height={280} className="w-full" />

      <div className="flex flex-wrap gap-1 mt-1">
        {FDC_PARAM_IDS.map(pid => {
          const visible = visibleParams.has(pid);
          return (
            <button
              key={pid}
              type="button"
              data-testid={`fdc-legend-${pid}`}
              data-visible={String(visible)}
              onClick={() => toggleParam(pid)}
              className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-mono transition-opacity"
              style={{
                backgroundColor: visible ? TRACE_COLORS[pid] + '22' : 'rgba(255,255,255,0.04)',
                color: visible ? TRACE_COLORS[pid] : '#64748b',
                opacity: visible ? 1 : 0.5,
              }}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: TRACE_COLORS[pid] }} />
              {FDC_PARAMS[pid].label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
