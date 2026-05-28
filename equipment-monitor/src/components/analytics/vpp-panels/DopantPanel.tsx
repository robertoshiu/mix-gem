'use client';

import { useMemo, useState } from 'react';
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import type { DopantSpeciesId } from '@/lib/analytics/types';
import { computeDopantProfile } from '@/lib/analytics/vpp-engine';
import { ALL_DOPANT_SPECIES, DOPANT_IMPLANT_DATA } from '@/lib/analytics/vpp-constants';
import { SYM } from '@/lib/analytics/symbols';
import { useClientReady } from '@/hooks/use-client-ready';

interface Props {
  /** Called when the user explores via a control — pauses the parent tab's live updates. */
  onExplore?: () => void;
}

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

function toggleClass(active: boolean): string {
  return [
    'inline-flex min-h-[44px] items-center rounded-full px-3 py-2 text-sm font-medium outline-none transition-colors',
    'focus-visible:ring-2 focus-visible:ring-[var(--sf-accent-cyan)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0F19]',
    active
      ? 'border border-[rgba(34,211,238,0.5)] bg-[rgba(34,211,238,0.16)] text-[var(--sf-accent-cyan)]'
      : 'border border-[rgba(34,211,238,0.18)] bg-[rgba(2,6,23,0.5)] text-[var(--sf-text-secondary)] hover:bg-[rgba(34,211,238,0.08)]',
  ].join(' ');
}

export function DopantPanel({ onExplore }: Props) {
  const clientReady = useClientReady();
  const [selected, setSelected] = useState<DopantSpeciesId[]>(['B', 'P', 'As']);
  const [depthMax, setDepthMax] = useState(500);
  const [scale, setScale] = useState<'log' | 'linear'>('log');
  const [annealTemp, setAnnealTemp] = useState(1000);
  const [annealTime, setAnnealTime] = useState(30);
  const [showActive, setShowActive] = useState(false);
  const [showJunction, setShowJunction] = useState(true);

  const explore = (fn: () => void) => {
    onExplore?.();
    fn();
  };

  const result = useMemo(
    () => computeDopantProfile(selected, 0, depthMax, annealTemp, annealTime, showActive),
    [selected, depthMax, annealTemp, annealTime, showActive],
  );

  // Merge per-species profiles into one row-per-depth dataset keyed by species id.
  const chartData = useMemo(() => {
    if (result.species.length === 0) return [];
    const nPoints = result.species[0].profile.length;
    const rows: Record<string, number>[] = [];
    for (let i = 0; i < nPoints; i++) {
      const row: Record<string, number> = { depth: Number(result.species[0].profile[i].depth.toFixed(1)) };
      for (const sp of result.species) {
        const pt = sp.profile[i];
        const c = showActive ? pt.activeConcentration : pt.concentration;
        // Floor for log axis so zeros don't break log10.
        row[sp.species] = Math.max(c, 1e14);
      }
      rows.push(row);
    }
    return rows;
  }, [result, showActive]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        {ALL_DOPANT_SPECIES.map((sp) => (
          <label key={sp} className="flex items-center gap-1.5 text-sm text-[var(--sf-text-secondary)]">
            <input
              type="checkbox"
              aria-label={sp}
              checked={selected.includes(sp)}
              className="h-4 w-4 accent-[var(--sf-accent-cyan)]"
              onChange={(e) =>
                explore(() => {
                  if (e.target.checked) setSelected([...selected, sp]);
                  else setSelected(selected.filter((s) => s !== sp));
                })
              }
            />
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: DOPANT_IMPLANT_DATA[sp].color }} />
            {sp}
          </label>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-[var(--sf-text-secondary)]">
          <span>Depth</span>
          <input
            type="range"
            min={100}
            max={2000}
            step={50}
            value={depthMax}
            aria-label="Maximum depth"
            onChange={(e) => explore(() => setDepthMax(Number(e.target.value)))}
            className="h-2 w-24 accent-[var(--sf-accent-cyan)]"
          />
          <span className="font-mono tabular-nums text-[var(--sf-text-primary)]">{depthMax} nm</span>
        </label>
        {([['log', 'Log'], ['linear', 'Linear']] as const).map(([val, label]) => (
          <button key={val} type="button" onClick={() => explore(() => setScale(val))} className={toggleClass(scale === val)}>
            {label}
          </button>
        ))}
        {([['Total', false], ['Active', true]] as const).map(([label, val]) => (
          <button key={label} type="button" onClick={() => explore(() => setShowActive(val as boolean))} className={toggleClass(showActive === val)}>
            {label}
          </button>
        ))}
        <label className="flex items-center gap-1.5 text-sm text-[var(--sf-text-secondary)]">
          <input
            type="checkbox"
            checked={showJunction}
            className="h-4 w-4 accent-[var(--sf-accent-cyan)]"
            onChange={(e) => explore(() => setShowJunction(e.target.checked))}
          />
          Junction Xj
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-[var(--sf-text-secondary)]">
          <span>Anneal T</span>
          <input
            type="range"
            min={800}
            max={1200}
            step={10}
            value={annealTemp}
            aria-label="Anneal temperature"
            onChange={(e) => explore(() => setAnnealTemp(Number(e.target.value)))}
            className="h-2 w-24 accent-[var(--sf-accent-cyan)]"
          />
          <span className="font-mono tabular-nums text-[var(--sf-text-primary)]">
            {annealTemp}
            {SYM.deg}C
          </span>
        </label>
        <label className="flex items-center gap-2 text-sm text-[var(--sf-text-secondary)]">
          <span>Time</span>
          <input
            type="range"
            min={1}
            max={120}
            step={1}
            value={annealTime}
            aria-label="Anneal time"
            onChange={(e) => explore(() => setAnnealTime(Number(e.target.value)))}
            className="h-2 w-24 accent-[var(--sf-accent-cyan)]"
          />
          <span className="font-mono tabular-nums text-[var(--sf-text-primary)]">{annealTime} min</span>
        </label>
      </div>

      <div className="h-[260px] rounded-2xl border border-[rgba(34,211,238,0.18)] bg-[rgba(2,6,23,0.55)] p-3" data-testid="dopant-profile-chart">
        {clientReady ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
              <CartesianGrid stroke={GRID_STROKE} />
              <XAxis
                dataKey="depth"
                type="number"
                stroke={AXIS_STROKE}
                fontSize={10}
                tickLine={false}
                axisLine={false}
                label={{ value: 'Depth (nm)', position: 'insideBottom', offset: -4, fill: '#94A3B8', fontSize: 10 }}
              />
              <YAxis
                stroke={AXIS_STROKE}
                fontSize={10}
                tickLine={false}
                axisLine={false}
                scale={scale === 'log' ? 'log' : 'linear'}
                domain={scale === 'log' ? [1e14, 1e21] : ['auto', 'auto']}
                tickFormatter={(v: number) => (v > 0 ? `1e${Math.round(Math.log10(v))}` : '0')}
                width={48}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(v: number | undefined, name) => [`${(v ?? 0).toExponential(1)} cm${SYM.dash}${SYM.sup2}`, name]}
                labelFormatter={(d) => `Depth ${d} nm`}
              />
              <ReferenceLine y={result.backgroundDoping} stroke="rgba(148,163,184,0.5)" strokeDasharray="4 4" label={{ value: 'N_sub', position: 'right', fill: '#94A3B8', fontSize: 9 }} />
              {result.species.map((sp) => (
                <Line
                  key={sp.species}
                  type="monotone"
                  dataKey={sp.species}
                  stroke={sp.color}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              ))}
              {showJunction &&
                result.species.map((sp) =>
                  sp.junctionDepth > 0 && sp.junctionDepth < depthMax ? (
                    <ReferenceLine
                      key={`xj-${sp.species}`}
                      x={Number(sp.junctionDepth.toFixed(1))}
                      stroke={sp.color}
                      strokeDasharray="2 2"
                      label={{ value: `Xj ${sp.junctionDepth.toFixed(0)}`, position: 'top', fill: sp.color, fontSize: 9 }}
                    />
                  ) : null,
                )}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-[var(--sf-text-secondary)]">
            Rendering dopant profile...
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-[var(--sf-text-secondary)]">
        {result.species.map((sp) => (
          <span key={sp.species}>
            <span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: sp.color }} />
            {sp.species}: Peak {sp.peakConcentration.toExponential(1)} cm{SYM.dash}{SYM.sup2} {SYM.dash} Xj{' '}
            {sp.junctionDepth.toFixed(0)} nm {SYM.dash} Dose {sp.dose.toExponential(1)} cm{SYM.sup2}
          </span>
        ))}
      </div>
    </div>
  );
}
