'use client';

import { useMemo, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';
import type { PipelineStepResult, SubstrateType, StressMode } from '@/lib/analytics/types';
import { computeStressProfile } from '@/lib/analytics/vpp-engine';
import { STEP_SHORT_NAMES } from '@/lib/analytics/constants';
import { SYM } from '@/lib/analytics/symbols';
import { useClientReady } from '@/hooks/use-client-ready';

interface Props {
  perStep: PipelineStepResult[];
  /** Called when the user explores via a control — pauses the parent tab's live updates. */
  onExplore?: () => void;
}

const SUBSTRATE_OPTIONS: SubstrateType[] = ['Si(100)', 'Si(111)', 'SiGe', 'SOI'];
const MODE_OPTIONS: { value: StressMode; label: string }[] = [
  { value: 'biaxial', label: 'Biaxial' },
  { value: 'plane-stress', label: 'Plane Stress' },
  { value: 'plane-strain', label: 'Plane Strain' },
];

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

/** Pill button shared style — real button, >=44px target, visible cyan focus ring. */
function toggleClass(active: boolean): string {
  return [
    'inline-flex min-h-[44px] items-center rounded-full px-3 py-2 text-sm font-medium outline-none transition-colors',
    'focus-visible:ring-2 focus-visible:ring-[var(--sf-accent-cyan)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0F19]',
    active
      ? 'border border-[rgba(34,211,238,0.5)] bg-[rgba(34,211,238,0.16)] text-[var(--sf-accent-cyan)]'
      : 'border border-[rgba(34,211,238,0.18)] bg-[rgba(2,6,23,0.5)] text-[var(--sf-text-secondary)] hover:bg-[rgba(34,211,238,0.08)]',
  ].join(' ');
}

export function StressPanel({ perStep, onExplore }: Props) {
  const clientReady = useClientReady();
  const [mode, setMode] = useState<StressMode>('biaxial');
  const [substrate, setSubstrate] = useState<SubstrateType>('Si(100)');
  const [tempC, setTempC] = useState(25);
  const [hiddenSteps, setHiddenSteps] = useState<Set<string>>(new Set());

  const profile = useMemo(
    () => computeStressProfile(perStep, substrate, tempC, mode),
    [perStep, substrate, tempC, mode],
  );
  const visibleLayers = profile.layers.filter((l) => !hiddenSteps.has(l.stepId));

  const barData = useMemo(
    () =>
      visibleLayers.map((l) => ({
        step: STEP_SHORT_NAMES[l.stepId] ?? l.stepId,
        totalStress: Number(l.totalStress.toFixed(0)),
        color: l.totalStress >= 0 ? '#3B82F6' : '#EF4444',
      })),
    [visibleLayers],
  );

  const cumData = useMemo(
    () => profile.cumulativeStress.map((p) => ({ depth: Number(p.depth.toFixed(1)), stress: Number(p.stress.toFixed(0)) })),
    [profile],
  );

  const bowColor =
    profile.waferBow < 25 ? 'text-[#10B981]' : profile.waferBow < 50 ? 'text-[#F59E0B]' : 'text-[#FF6B6B]';

  // Controls that change the simulation explore-state → pause the live tab.
  const explore = (fn: () => void) => {
    onExplore?.();
    fn();
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {MODE_OPTIONS.map((m) => (
          <button key={m.value} type="button" onClick={() => explore(() => setMode(m.value))} className={toggleClass(mode === m.value)}>
            {m.label}
          </button>
        ))}
        <label className="flex items-center gap-2 text-sm text-[var(--sf-text-secondary)]">
          <span>Substrate</span>
          <select
            value={substrate}
            onChange={(e) => explore(() => setSubstrate(e.target.value as SubstrateType))}
            className="min-h-[44px] rounded-lg border border-[rgba(34,211,238,0.22)] bg-[rgba(2,6,23,0.6)] px-3 text-sm text-[var(--sf-text-primary)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-accent-cyan)]"
          >
            {SUBSTRATE_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-[var(--sf-text-secondary)]">
          <span>Temp</span>
          <input
            type="range"
            min={25}
            max={400}
            value={tempC}
            aria-label="Process temperature"
            onChange={(e) => explore(() => setTempC(Number(e.target.value)))}
            className="h-2 w-24 accent-[var(--sf-accent-cyan)]"
          />
          <span className="font-mono tabular-nums text-[var(--sf-text-primary)]">
            {tempC}
            {SYM.deg}C
          </span>
        </label>
      </div>

      <div className="flex flex-wrap gap-3">
        {profile.layers.map((l) => (
          <label key={l.stepId} className="flex items-center gap-1.5 text-sm text-[var(--sf-text-secondary)]">
            <input
              type="checkbox"
              checked={!hiddenSteps.has(l.stepId)}
              className="h-4 w-4 accent-[var(--sf-accent-cyan)]"
              onChange={(e) =>
                explore(() => {
                  const next = new Set(hiddenSteps);
                  if (e.target.checked) next.delete(l.stepId);
                  else next.add(l.stepId);
                  setHiddenSteps(next);
                })
              }
            />
            {STEP_SHORT_NAMES[l.stepId]}
          </label>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="h-[200px] rounded-2xl border border-[rgba(34,211,238,0.18)] bg-[rgba(2,6,23,0.55)] p-3" data-testid="stress-bar-chart">
          <div className="mb-2 text-xs uppercase tracking-[0.16em] text-[var(--sf-text-secondary)]">
            Per-layer stress (MPa)
          </div>
          {clientReady ? (
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
                <CartesianGrid stroke={GRID_STROKE} horizontal={false} />
                <XAxis type="number" stroke={AXIS_STROKE} fontSize={10} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="step" stroke={AXIS_STROKE} fontSize={10} tickLine={false} axisLine={false} width={44} />
                <Tooltip
                  cursor={{ fill: 'rgba(34,211,238,0.08)' }}
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(v: number | undefined) => {
                    const n = v ?? 0;
                    return [`${n > 0 ? '+' : ''}${n} MPa`, n >= 0 ? 'Tensile' : 'Compressive'];
                  }}
                />
                <ReferenceLine x={0} stroke="rgba(148,163,184,0.5)" />
                <Bar dataKey="totalStress" radius={[0, 4, 4, 0]}>
                  {barData.map((d) => (
                    <Cell key={d.step} fill={d.color} fillOpacity={0.65} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ChartLoading />
          )}
        </div>

        <div className="h-[200px] rounded-2xl border border-[rgba(34,211,238,0.18)] bg-[rgba(2,6,23,0.55)] p-3" data-testid="stress-cumulative-chart">
          <div className="mb-2 text-xs uppercase tracking-[0.16em] text-[var(--sf-text-secondary)]">
            Cumulative stress vs depth
          </div>
          {clientReady ? (
            <ResponsiveContainer width="100%" height="85%">
              <LineChart data={cumData} margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={GRID_STROKE} vertical={false} />
                <XAxis dataKey="depth" stroke={AXIS_STROKE} fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v: number) => v.toFixed(0)} />
                <YAxis stroke={AXIS_STROKE} fontSize={10} tickLine={false} axisLine={false} width={44} />
                <Tooltip
                  cursor={{ stroke: 'rgba(34,211,238,0.45)', strokeWidth: 1 }}
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(v: number | undefined) => [`${v ?? 0} MPa`, 'Cumulative']}
                  labelFormatter={(d) => `Depth ${d} nm`}
                />
                <Line type="monotone" dataKey="stress" stroke="#22D3EE" strokeWidth={2} dot={{ r: 2, fill: '#22D3EE' }} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <ChartLoading />
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-6 text-sm">
        <span className="text-[var(--sf-text-secondary)]">
          Net:{' '}
          <strong className="font-mono text-[var(--sf-text-primary)]">
            {profile.netStress > 0 ? '+' : ''}
            {profile.netStress.toFixed(0)} MPa
          </strong>{' '}
          ({profile.netStress > 0 ? 'tensile' : 'compressive'})
        </span>
        <span className="text-[var(--sf-text-secondary)]">
          Bow:{' '}
          <strong className={`font-mono ${bowColor}`}>
            {profile.waferBow.toFixed(1)} {SYM.mu}m
          </strong>
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
