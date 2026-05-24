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
      aria-label={`Select ${label} parameter${latest !== undefined ? `, current value ${latest.toFixed(2)} ${unit}` : ''}`}
      data-testid={`thumbnail-chart-${label.toLowerCase()}`}
      className={cn(
        'flex flex-col gap-1 p-2 rounded border cursor-pointer transition-colors w-full text-left',
        isActive
          ? 'border-l-2 border-l-[var(--smartfactory-border-active)] border-[var(--smartfactory-border-active)] bg-[var(--smartfactory-surface-elevated)]'
          : 'border-[var(--smartfactory-border-default)] bg-[var(--smartfactory-surface-card)] hover:bg-[var(--smartfactory-surface-elevated)]'
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--smartfactory-text-secondary)]">{label}</span>
        {isActive && (
          <span className="text-[10px] font-semibold text-[var(--smartfactory-border-active)] bg-blue-900/30 px-1 rounded">ACTIVE</span>
        )}
      </div>

      <div className="h-10">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 1, height: 40 }}>
          <LineChart data={data}>
            <ReferenceLine y={ucl} stroke="var(--smartfactory-status-red)" strokeDasharray="3 3" strokeOpacity={0.5} />
            <ReferenceLine y={lcl} stroke="var(--smartfactory-status-red)" strokeDasharray="3 3" strokeOpacity={0.5} />
            <Line
              type="monotone"
              dataKey="value"
              stroke={isOk ? 'var(--smartfactory-accent-blue)' : 'var(--smartfactory-status-red)'}
              dot={false}
              strokeWidth={1.5}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {latest !== undefined && (
        <span className={cn('font-[\'Fira_Code\',monospace] text-sm font-semibold', isOk ? 'text-[var(--smartfactory-status-green)]' : 'text-[var(--smartfactory-status-red)]')}>
          {latest.toFixed(2)}
          <span className="text-[10px] font-normal text-[var(--smartfactory-text-secondary)] ml-1">{unit}</span>
        </span>
      )}
    </button>
  );
}
