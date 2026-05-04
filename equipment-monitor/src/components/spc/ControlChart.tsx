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
        fill="#EF4444"
        style={{ filter: 'drop-shadow(0 0 4px rgba(239,68,68,0.7))' }}
      />
    );
  }
  return <Dot cx={cx} cy={cy} r={3} fill="#3B82F6" />;
}

export function ControlChart({ paramLabel, config, data }: ControlChartProps) {
  const { target, sigma, ucl, lcl } = config;
  const twoSigmaPos = target + 2 * sigma;
  const twoSigmaNeg = target - 2 * sigma;

  const yPad = sigma * 0.5;
  const yDomain = [lcl - yPad, ucl + yPad];

  return (
    <div className="bg-[#111D2E] rounded border border-[#1E3A5F] p-4 border-l-2 border-l-[#2563EB]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-[#F1F5F9]">{paramLabel}</h3>
        <div className="flex gap-4 text-xs text-[#94A3B8] font-['Fira_Code',monospace]">
          <span>UCL <span className="text-[#EF4444]">{ucl.toFixed(1)}</span></span>
          <span>CL <span className="text-[#F59E0B]">{target.toFixed(1)}</span></span>
          <span>LCL <span className="text-[#EF4444]">{lcl.toFixed(1)}</span></span>
        </div>
      </div>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" />
            <XAxis dataKey="waferNumber" tick={{ fill: '#475569', fontSize: 10 }} />
            <YAxis domain={yDomain} tick={{ fill: '#475569', fontSize: 10 }} width={40} />
            <Tooltip
              contentStyle={{ background: '#111D2E', border: '1px solid #1E3A5F', fontSize: 12 }}
              labelStyle={{ color: '#94A3B8' }}
              itemStyle={{ color: '#F1F5F9', fontFamily: 'Fira Code, monospace' }}
              cursor={{ stroke: '#2563EB', strokeWidth: 1 }}
            />

            {/* 3-sigma bands */}
            <ReferenceArea y1={ucl} y2={ucl + sigma} fill="#EF4444" fillOpacity={0.05} />
            <ReferenceArea y1={lcl - sigma} y2={lcl} fill="#EF4444" fillOpacity={0.05} />

            {/* 2-sigma bands */}
            <ReferenceArea y1={twoSigmaPos} y2={ucl} fill="#F59E0B" fillOpacity={0.08} />
            <ReferenceArea y1={lcl} y2={twoSigmaNeg} fill="#F59E0B" fillOpacity={0.08} />

            {/* Control lines */}
            <ReferenceLine y={ucl} stroke="#EF4444" strokeDasharray="5 5" strokeOpacity={0.6} />
            <ReferenceLine y={lcl} stroke="#EF4444" strokeDasharray="5 5" strokeOpacity={0.6} />
            <ReferenceLine y={target} stroke="#F59E0B" strokeOpacity={0.7} />
            <ReferenceLine y={twoSigmaPos} stroke="#F59E0B" strokeDasharray="3 3" strokeOpacity={0.4} />
            <ReferenceLine y={twoSigmaNeg} stroke="#F59E0B" strokeDasharray="3 3" strokeOpacity={0.4} />

            <Line
              type="linear"
              dataKey="value"
              stroke="#3B82F6"
              strokeWidth={1.5}
              dot={<CustomDot />}
              activeDot={{ r: 6, fill: '#3B82F6' }}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}