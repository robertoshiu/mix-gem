'use client';

import { useMemo } from 'react';
import {
  BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';
import type { ThermalBudgetStep } from '@/lib/analytics/types';
import { STEP_SHORT_NAMES } from '@/lib/analytics/constants';
import { SYM } from '@/lib/analytics/symbols';
import { useClientReady } from '@/hooks/use-client-ready';

interface Props {
  steps: ThermalBudgetStep[];
  ceiling: number;
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
const STEP_COLORS = ['#F47920', '#22D3EE', '#8B5CF6', '#3B82F6', '#F43F5E', '#F59E0B', '#10B981', '#E2E8F0'];

export function ThermalBudgetPanel({ steps, ceiling }: Props) {
  const clientReady = useClientReady();
  const totalDt = steps.length > 0 ? steps[steps.length - 1].cumulativeDt : 0;
  const exceeded = totalDt > ceiling;

  const data = useMemo(
    () =>
      steps.map((step, i) => ({
        step: STEP_SHORT_NAMES[step.stepId] ?? step.stepId,
        cumulativeDt: step.cumulativeDt,
        isHot: step.temperature > 1000,
        color: step.temperature > 1000 ? '#F59E0B' : STEP_COLORS[i % STEP_COLORS.length],
      })),
    [steps],
  );

  return (
    <div className="space-y-2">
      <div className="h-[200px] rounded-2xl border border-[rgba(34,211,238,0.18)] bg-[rgba(2,6,23,0.55)] p-3">
        {clientReady ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={GRID_STROKE} vertical={false} />
              <XAxis dataKey="step" stroke={AXIS_STROKE} fontSize={10} tickLine={false} axisLine={false} interval={0} />
              <YAxis
                stroke={AXIS_STROKE}
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => v.toExponential(0)}
                width={48}
              />
              <Tooltip
                cursor={{ fill: 'rgba(34,211,238,0.08)' }}
                contentStyle={TOOLTIP_STYLE}
                formatter={(v: number | undefined) => [`${(v ?? 0).toExponential(2)} °C·s`, 'Cumulative Dt']}
              />
              <ReferenceLine
                y={ceiling}
                stroke="#EF4444"
                strokeDasharray="4 4"
                label={{ value: `Ceiling ${ceiling.toExponential(1)}`, position: 'insideTopRight', fill: '#EF4444', fontSize: 10 }}
              />
              <Bar dataKey="cumulativeDt" radius={[4, 4, 0, 0]} data-testid="thermal-budget-chart">
                {data.map((d) => (
                  <Cell
                    key={d.step}
                    fill={d.color}
                    fillOpacity={0.65}
                    stroke={d.isHot ? '#F59E0B' : 'transparent'}
                    strokeWidth={d.isHot ? 2 : 0}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-[var(--sf-text-secondary)]">
            Rendering thermal budget...
          </div>
        )}
      </div>
      <div className="text-sm text-[var(--sf-text-secondary)]">
        Cumulative Dt: <span className="font-mono tabular-nums">{totalDt.toExponential(2)}</span> {SYM.deg}C·s
      </div>
      {exceeded && (
        <div className="text-sm font-semibold text-[#FF6B6B]">
          Budget exceeded: {totalDt.toExponential(2)} {SYM.gte} {ceiling.toExponential(2)} {SYM.deg}C·s
        </div>
      )}
    </div>
  );
}
