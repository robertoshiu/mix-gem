'use client';

import { LineChart, Line, ReferenceLine, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

interface ThumbnailChartProps {
  label: string;
  unit: string;
  data: { waferNumber: number; value: number }[];
  ucl: number;
  lcl: number;
  isActive: boolean;
  onClick?: () => void;
}

export function ThumbnailChart({ label, unit, data, ucl, lcl, isActive, onClick }: ThumbnailChartProps) {
  const latest = data[data.length - 1]?.value;
  const isOk = latest !== undefined && latest > lcl && latest < ucl;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col gap-1 p-2 rounded border cursor-pointer transition-colors w-full text-left',
        isActive
          ? 'border-l-2 border-l-[#2563EB] border-[#2563EB] bg-[#182840]'
          : 'border-[#1E3A5F] bg-[#111D2E] hover:bg-[#182840]'
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[#94A3B8]">{label}</span>
        {isActive && (
          <span className="text-[10px] font-semibold text-[#2563EB] bg-blue-900/30 px-1 rounded">ACTIVE</span>
        )}
      </div>

      <div className="h-10">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <ReferenceLine y={ucl} stroke="#EF4444" strokeDasharray="3 3" strokeOpacity={0.5} />
            <ReferenceLine y={lcl} stroke="#EF4444" strokeDasharray="3 3" strokeOpacity={0.5} />
            <Line
              type="monotone"
              dataKey="value"
              stroke={isOk ? '#3B82F6' : '#EF4444'}
              dot={false}
              strokeWidth={1.5}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {latest !== undefined && (
        <span className={cn('font-[\'Fira_Code\',monospace] text-sm font-semibold', isOk ? 'text-[#10B981]' : 'text-[#EF4444]')}>
          {latest.toFixed(2)}
          <span className="text-[10px] font-normal text-[#94A3B8] ml-1">{unit}</span>
        </span>
      )}
    </button>
  );
}