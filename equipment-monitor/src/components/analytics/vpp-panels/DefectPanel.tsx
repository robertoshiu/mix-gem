'use client';

import { useMemo, useState } from 'react';
import {
  ComposedChart, Bar, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceLine, ScatterChart, Scatter, ZAxis, Cell,
} from 'recharts';
import type { PipelineStepResult, DefectSource } from '@/lib/analytics/types';
import { computeDefectMap } from '@/lib/analytics/vpp-engine';
import { STEP_SHORT_NAMES } from '@/lib/analytics/constants';
import {
  DEFECT_SOURCES, DEFECT_SOURCE_COLORS, DEFAULT_KILL_RATIOS,
} from '@/lib/analytics/vpp-constants';
import { SYM } from '@/lib/analytics/symbols';
import { useClientReady } from '@/hooks/use-client-ready';

interface Props {
  perStep: PipelineStepResult[];
  /** Called when the user explores via a control — pauses the parent tab's live updates. */
  onExplore?: () => void;
}

type SortOrder = 'by-step' | 'by-severity';

/** Themed recharts tooltip surface — #0f172a + cyan border (home dashboard style). */
const TOOLTIP_STYLE = {
  backgroundColor: '#0f172a',
  border: '1px solid rgba(34,211,238,0.45)',
  borderRadius: 12,
  color: '#f8fafc',
  fontSize: 12,
} as const;

const AXIS_STROKE = 'rgba(148,163,184,0.72)';
const GRID_STROKE = 'rgba(148,163,184,0.12)';

const WAFER_COLORS: Record<string, string> = {
  particles: '#22D3EE',
  scratches: '#F59E0B',
  voids: '#8B5CF6',
  inclusions: '#EF4444',
};

function toggleClass(active: boolean): string {
  return [
    'inline-flex min-h-[44px] items-center rounded-full px-3 py-2 text-sm font-medium outline-none transition-colors',
    'focus-visible:ring-2 focus-visible:ring-[var(--sf-accent-cyan)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0F19]',
    active
      ? 'border border-[rgba(34,211,238,0.5)] bg-[rgba(34,211,238,0.16)] text-[var(--sf-accent-cyan)]'
      : 'border border-[rgba(34,211,238,0.18)] bg-[rgba(2,6,23,0.5)] text-[var(--sf-text-secondary)] hover:bg-[rgba(34,211,238,0.08)]',
  ].join(' ');
}

export function DefectPanel({ perStep, onExplore }: Props) {
  const clientReady = useClientReady();
  const [sortOrder, setSortOrder] = useState<SortOrder>('by-step');
  const [ceiling, setCeiling] = useState(1.5);
  const [killRatios, setKillRatios] = useState<Record<DefectSource, number>>({ ...DEFAULT_KILL_RATIOS });
  const [enabledSources, setEnabledSources] = useState<DefectSource[]>([...DEFECT_SOURCES]);

  const explore = (fn: () => void) => {
    onExplore?.();
    fn();
  };

  const defects = useMemo(
    () => computeDefectMap(perStep, killRatios, enabledSources),
    [perStep, killRatios, enabledSources],
  );

  // Build per-step rows with one numeric column per source + the pareto cum %.
  const barData = useMemo(() => {
    const steps = [...defects.perStep];
    if (sortOrder === 'by-severity') steps.sort((a, b) => b.killerD0 - a.killerD0);
    const paretoByStep = new Map(defects.paretoPoints.map((p) => [p.stepId, p.cumPct]));
    return steps.map((step) => {
      const row: Record<string, number | string> = {
        step: STEP_SHORT_NAMES[step.stepId] ?? step.stepId,
        cumPct: paretoByStep.get(step.stepId) ?? 0,
      };
      for (const src of step.sources) row[src.source] = Number(src.density.toFixed(3));
      return row;
    });
  }, [defects, sortOrder]);

  const waferData = useMemo(
    () => defects.waferDots.map((d, i) => ({ x: d.x, y: d.y, source: d.source, key: i })),
    [defects],
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {([['by-step', 'By Step'], ['by-severity', 'By Severity']] as const).map(([val, label]) => (
          <button key={val} type="button" onClick={() => explore(() => setSortOrder(val))} className={toggleClass(sortOrder === val)}>
            {label}
          </button>
        ))}
        <label className="flex items-center gap-2 text-sm text-[var(--sf-text-secondary)]">
          <span>
            D{SYM.sub0} ceiling
          </span>
          <input
            type="range"
            min={0.1}
            max={3}
            step={0.1}
            value={ceiling}
            aria-label="Defect density ceiling"
            onChange={(e) => explore(() => setCeiling(Number(e.target.value)))}
            className="h-2 w-20 accent-[var(--sf-accent-cyan)]"
          />
          <span className="font-mono tabular-nums text-[var(--sf-text-primary)]">{ceiling.toFixed(1)}</span>
        </label>
      </div>

      <div className="flex flex-wrap gap-4">
        {DEFECT_SOURCES.map((src) => (
          <div key={src} className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-sm text-[var(--sf-text-secondary)]">
              <input
                type="checkbox"
                checked={enabledSources.includes(src)}
                className="h-4 w-4 accent-[var(--sf-accent-cyan)]"
                onChange={(e) =>
                  explore(() => {
                    if (e.target.checked) setEnabledSources([...enabledSources, src]);
                    else setEnabledSources(enabledSources.filter((s) => s !== src));
                  })
                }
              />
              <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: DEFECT_SOURCE_COLORS[src] }} />
              {src}
            </label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={killRatios[src]}
              aria-label={`${src} kill ratio`}
              onChange={(e) => explore(() => setKillRatios({ ...killRatios, [src]: Number(e.target.value) }))}
              className="h-2 w-16 accent-[var(--sf-accent-cyan)]"
            />
            <span className="font-mono tabular-nums text-sm text-[var(--sf-text-secondary)]">{killRatios[src].toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="h-[220px] rounded-2xl border border-[rgba(34,211,238,0.18)] bg-[rgba(2,6,23,0.55)] p-3" data-testid="defect-bar-chart">
          <div className="mb-2 text-xs uppercase tracking-[0.16em] text-[var(--sf-text-secondary)]">
            Defect density + Pareto
          </div>
          {clientReady ? (
            <ResponsiveContainer width="100%" height="85%">
              <ComposedChart data={barData} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid stroke={GRID_STROKE} vertical={false} />
                <XAxis dataKey="step" stroke={AXIS_STROKE} fontSize={9} tickLine={false} axisLine={false} interval={0} />
                <YAxis yAxisId="d0" stroke={AXIS_STROKE} fontSize={10} tickLine={false} axisLine={false} />
                <YAxis yAxisId="pct" orientation="right" stroke={AXIS_STROKE} fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={(v: number) => `${v.toFixed(0)}%`} />
                <Tooltip cursor={{ fill: 'rgba(34,211,238,0.08)' }} contentStyle={TOOLTIP_STYLE} />
                <ReferenceLine yAxisId="d0" y={ceiling} stroke="#EF4444" strokeDasharray="4 4" />
                {enabledSources.map((src) => (
                  <Bar key={src} yAxisId="d0" dataKey={src} stackId="d0" fill={DEFECT_SOURCE_COLORS[src]} fillOpacity={0.65} />
                ))}
                <Line yAxisId="pct" type="monotone" dataKey="cumPct" stroke="#F47920" strokeWidth={2} dot={{ r: 2, fill: '#F47920' }} isAnimationActive={false} />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <ChartLoading />
          )}
        </div>

        <div className="h-[220px] rounded-2xl border border-[rgba(34,211,238,0.18)] bg-[rgba(2,6,23,0.55)] p-3" data-testid="defect-wafer-chart">
          <div className="mb-2 text-xs uppercase tracking-[0.16em] text-[var(--sf-text-secondary)]">
            Wafer defect map
          </div>
          {clientReady ? (
            <ResponsiveContainer width="100%" height="85%">
              <ScatterChart margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid stroke={GRID_STROKE} />
                <XAxis type="number" dataKey="x" domain={[-1, 1]} hide />
                <YAxis type="number" dataKey="y" domain={[-1, 1]} hide />
                <ZAxis range={[16, 16]} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={TOOLTIP_STYLE} formatter={(_v, _n, item) => [(item?.payload as { source?: string } | undefined)?.source ?? '', 'Defect']} />
                <Scatter data={waferData} isAnimationActive={false}>
                  {waferData.map((d) => (
                    <Cell key={d.key} fill={WAFER_COLORS[d.source] ?? '#94A3B8'} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          ) : (
            <ChartLoading />
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-6 text-sm text-[var(--sf-text-secondary)]">
        <span>
          Total D{SYM.sub0}: <strong className="font-mono text-[var(--sf-text-primary)]">{defects.totalD0.toFixed(2)} /cm{SYM.sup2}</strong>
        </span>
        <span>
          Killer: <strong className="font-mono text-[var(--sf-text-primary)]">{defects.totalKillerD0.toFixed(2)} /cm{SYM.sup2}</strong>
        </span>
        <span>
          Yield Impact: <strong className="font-mono text-[#FF6B6B]">{SYM.dash}{(defects.totalYieldImpact * 100).toFixed(1)}%</strong>
        </span>
      </div>
    </div>
  );
}

function ChartLoading() {
  return (
    <div className="flex h-[85%] items-center justify-center text-sm text-[var(--sf-text-secondary)]">
      Rendering...
    </div>
  );
}
