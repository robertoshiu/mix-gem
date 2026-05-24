'use client';

import {
  ComposedChart, Line, ReferenceLine, ReferenceArea,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Dot,
} from 'recharts';
import type { SpcParamConfig } from '@/lib/spc-parameters';

interface ChartDataPoint {
  waferNumber: number;
  value: number;
  isViolation: boolean;
}

interface ControlChartProps {
  paramLabel: string;
  config: SpcParamConfig;
  data: ChartDataPoint[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomDot(props: any) {
  const { cx, cy, payload } = props;
  if (payload?.isViolation) {
    return (
      <circle
        cx={cx} cy={cy} r={5}
        fill="var(--smartfactory-status-red)"
        style={{ filter: 'drop-shadow(0 0 4px rgba(239,68,68,0.7))' }}
      />
    );
  }
  return <Dot cx={cx} cy={cy} r={3} fill="var(--smartfactory-accent-blue)" />;
}

export function ControlChart({ paramLabel, config, data }: ControlChartProps) {
  const { target, sigma, ucl, lcl } = config;
  const twoSigmaPos = target + 2 * sigma;
  const twoSigmaNeg = target - 2 * sigma;

  const yPad = sigma * 0.5;
  const yDomain = [lcl - yPad, ucl + yPad];

  return (
    <div className="bg-[var(--smartfactory-surface-card)] rounded border border-[var(--smartfactory-border-default)] p-4 border-l-2 border-l-[var(--smartfactory-border-active)]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-[var(--smartfactory-text-primary)]">{paramLabel}</h3>
        <div className="flex gap-4 text-xs text-[var(--smartfactory-text-secondary)] font-['Fira_Code',monospace]">
          <span>UCL <span className="text-[var(--smartfactory-status-red)]">{ucl.toFixed(1)}</span></span>
          <span>CL <span className="text-[var(--smartfactory-status-amber)]">{target.toFixed(1)}</span></span>
          <span>LCL <span className="text-[var(--smartfactory-status-red)]">{lcl.toFixed(1)}</span></span>
        </div>
      </div>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 1, height: 192 }}>
          <ComposedChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--smartfactory-border-default)" />
            <XAxis dataKey="waferNumber" tick={{ fill: 'var(--smartfactory-text-muted)', fontSize: 10 }} />
            <YAxis domain={yDomain} tick={{ fill: 'var(--smartfactory-text-muted)', fontSize: 10 }} width={40} />
            <Tooltip
              contentStyle={{ background: 'var(--smartfactory-surface-card)', border: '1px solid var(--smartfactory-border-default)', fontSize: 12 }}
              labelStyle={{ color: 'var(--smartfactory-text-secondary)' }}
              itemStyle={{ color: 'var(--smartfactory-text-primary)', fontFamily: 'Fira Code, monospace' }}
              cursor={{ stroke: 'var(--smartfactory-border-active)', strokeWidth: 1 }}
            />

            {/* 3-sigma bands */}
            <ReferenceArea y1={ucl} y2={ucl + sigma} fill="var(--smartfactory-status-red)" fillOpacity={0.05} />
            <ReferenceArea y1={lcl - sigma} y2={lcl} fill="var(--smartfactory-status-red)" fillOpacity={0.05} />

            {/* 2-sigma bands */}
            <ReferenceArea y1={twoSigmaPos} y2={ucl} fill="var(--smartfactory-status-amber)" fillOpacity={0.08} />
            <ReferenceArea y1={lcl} y2={twoSigmaNeg} fill="var(--smartfactory-status-amber)" fillOpacity={0.08} />

            {/* Control lines */}
            <ReferenceLine y={ucl} stroke="var(--smartfactory-status-red)" strokeDasharray="5 5" strokeOpacity={0.6} />
            <ReferenceLine y={lcl} stroke="var(--smartfactory-status-red)" strokeDasharray="5 5" strokeOpacity={0.6} />
            <ReferenceLine y={target} stroke="var(--smartfactory-status-amber)" strokeOpacity={0.7} />
            <ReferenceLine y={twoSigmaPos} stroke="var(--smartfactory-status-amber)" strokeDasharray="3 3" strokeOpacity={0.4} />
            <ReferenceLine y={twoSigmaNeg} stroke="var(--smartfactory-status-amber)" strokeDasharray="3 3" strokeOpacity={0.4} />

            <Line
              type="linear"
              dataKey="value"
              stroke="var(--smartfactory-accent-blue)"
              strokeWidth={1.5}
              dot={<CustomDot />}
              activeDot={{ r: 6, fill: 'var(--smartfactory-accent-blue)' }}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
