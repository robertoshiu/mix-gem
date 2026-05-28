'use client';

import { useMemo } from 'react';
import {
  BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList,
} from 'recharts';
import type { FilmLayer } from '@/lib/analytics/types';
import { SYM } from '@/lib/analytics/symbols';
import { useClientReady } from '@/hooks/use-client-ready';

interface Props {
  filmStack: FilmLayer[];
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

export function FilmStackPanel({ filmStack }: Props) {
  const clientReady = useClientReady();
  const totalThickness = filmStack.reduce((s, l) => s + l.thickness, 0);

  // Bottom-up stack order (substrate at bottom): reverse so the X axis reads
  // from the deepest layer outward, matching the physical wafer cross-section.
  const data = useMemo(
    () =>
      filmStack
        .map((l, i) => ({
          material: l.material,
          thickness: Number(l.thickness.toFixed(1)),
          color: l.color,
          key: `${l.material}-${i}`,
        }))
        .reverse(),
    [filmStack],
  );

  const thickest =
    filmStack.length > 0
      ? filmStack.reduce((a, b) => (a.thickness > b.thickness ? a : b)).material
      : SYM.dash;

  return (
    <div className="space-y-3">
      <div className="h-[200px] rounded-2xl border border-[rgba(34,211,238,0.18)] bg-[rgba(2,6,23,0.55)] p-3">
        {clientReady ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 16, right: 12, left: -8, bottom: 0 }}>
              <CartesianGrid stroke={GRID_STROKE} vertical={false} />
              <XAxis dataKey="material" stroke={AXIS_STROKE} fontSize={10} tickLine={false} axisLine={false} interval={0} />
              <YAxis
                stroke={AXIS_STROKE}
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `${v.toFixed(0)}`}
              />
              <Tooltip
                cursor={{ fill: 'rgba(34,211,238,0.08)' }}
                contentStyle={TOOLTIP_STYLE}
                formatter={(v: number | undefined) => [`${(v ?? 0).toFixed(1)} nm`, 'Thickness']}
              />
              <Bar dataKey="thickness" radius={[4, 4, 0, 0]} data-testid="film-stack-chart">
                <LabelList
                  dataKey="thickness"
                  position="top"
                  fontSize={10}
                  fill="#94A3B8"
                  formatter={(v: React.ReactNode) => `${Number(v ?? 0).toFixed(0)}`}
                />
                {data.map((d) => (
                  <Cell key={d.key} fill={d.color} fillOpacity={0.7} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-[var(--sf-text-secondary)]">
            Rendering film stack...
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3 text-sm text-[var(--sf-text-secondary)]">
        {filmStack.map((l, i) => (
          <span key={i} className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: l.color }} />
            {l.material} {SYM.dash} {l.thickness.toFixed(0)} nm
          </span>
        ))}
      </div>
      <div className="text-sm text-[var(--sf-text-secondary)]">
        Total: {totalThickness.toFixed(0)} nm {SYM.dash} {filmStack.length} layers {SYM.dash} Thickest:{' '}
        {thickest}
      </div>
    </div>
  );
}
