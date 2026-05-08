'use client';

import { Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { LithoTrendPoint } from '@/lib/litho-mock-data';

interface LithoTrendChartProps {
  title: string;
  data: LithoTrendPoint[];
  unit: string;
}

export function LithoTrendChart({ title, data, unit }: LithoTrendChartProps) {
  const target = data[0]?.target ?? 0;
  const lcl = data[0]?.lcl ?? 0;
  const ucl = data[0]?.ucl ?? 0;

  return (
    <div className="rounded-2xl border border-[rgba(34,211,238,0.24)] bg-[rgba(2,6,23,0.72)] p-4 shadow-[0_0_28px_rgba(34,211,238,0.08)]">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--sf-text-primary)]">{title} Trend</h2>
      <div className="h-[360px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 20, right: 18, left: 0, bottom: 10 }}>
            <XAxis dataKey="lot" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} interval={3} />
            <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} domain={[lcl - Math.abs(ucl - lcl) * 0.18, ucl + Math.abs(ucl - lcl) * 0.18]} />
            <ReferenceLine y={ucl} stroke="#ef4444" strokeDasharray="5 5" label={{ value: 'UCL', fill: '#ef4444', fontSize: 10 }} />
            <ReferenceLine y={target} stroke="#22d3ee" strokeDasharray="4 6" label={{ value: 'TARGET', fill: '#22d3ee', fontSize: 10 }} />
            <ReferenceLine y={lcl} stroke="#ef4444" strokeDasharray="5 5" label={{ value: 'LCL', fill: '#ef4444', fontSize: 10 }} />
            <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(34,211,238,0.35)', borderRadius: 10, color: '#e2e8f0' }} formatter={(value: number | undefined) => [`${(value ?? 0).toFixed(2)} ${unit}`, title]} />
            <Line type="monotone" dataKey="value" stroke="#22d3ee" strokeWidth={2.5} dot={({ cx, cy, payload }) => {
              const point = payload as LithoTrendPoint;
              const alarm = point.value < point.lcl || point.value > point.ucl;
              return <circle cx={cx} cy={cy} r={alarm ? 5 : 3} fill={alarm ? '#ef4444' : '#22d3ee'} stroke="#020617" strokeWidth="1.5" />;
            }} activeDot={{ r: 6, fill: '#f59e0b' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
