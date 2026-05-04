'use client';

import { motion } from 'framer-motion';
import { useMesSpcStore } from '@/stores/mes-spc-store';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { scaleIn, useReducedMotion } from '@/lib/animation';

const STATUS_CONFIG = {
  in_process: { label: 'Running', color: 'var(--smartfactory-status-green)' },
  pending: { label: 'Idle', color: 'var(--smartfactory-status-amber)' },
  on_hold: { label: 'On Hold', color: 'var(--smartfactory-status-red)' },
  completed: { label: 'Completed', color: 'var(--smartfactory-text-muted)' },
} as const;

type StatusKey = keyof typeof STATUS_CONFIG;

export function WipDonutChart() {
  const { lots } = useMesSpcStore();
  const reduced = useReducedMotion();
  const scaleInProps = reduced ? {} : { variants: scaleIn, initial: 'initial' as const, animate: 'animate' as const };

  const distribution = lots.reduce(
    (acc, lot) => {
      const status = lot.status as StatusKey;
      if (status in STATUS_CONFIG) {
        acc[status] = (acc[status] || 0) + 1;
      }
      return acc;
    },
    {} as Record<StatusKey, number>,
  );

  const pieData = (Object.keys(STATUS_CONFIG) as StatusKey[]).map((key) => ({
    name: STATUS_CONFIG[key].label,
    value: distribution[key] || 0,
    color: STATUS_CONFIG[key].color,
  }));

  const total = lots.length;

  if (total === 0) {
    return (
      <motion.div {...scaleInProps}>
        <div
          data-testid="wip-donut"
          className="bg-[var(--smartfactory-surface-card)] rounded border border-[var(--smartfactory-border-default)] p-4"
        >
          <h3 className="text-sm font-semibold text-[var(--smartfactory-text-primary)] mb-4">
            WIP Status
          </h3>
          <div className="flex items-center justify-center h-40 text-sm text-[var(--smartfactory-text-muted)]">
            No lots
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div {...scaleInProps}>
      <div
        data-testid="wip-donut"
        className="bg-[var(--smartfactory-surface-card)] rounded border border-[var(--smartfactory-border-default)] p-4"
      >
      <h3 className="text-sm font-semibold text-[var(--smartfactory-text-primary)] mb-4">
        WIP Status
      </h3>

      <div className="flex items-center gap-6">
        {/* Donut Chart */}
        <div className="relative w-[150px] h-[150px] flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                dataKey="value"
                isAnimationActive={false}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* Center Label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="font-mono font-semibold text-lg text-[var(--smartfactory-text-primary)]">
              {total}
            </span>
            <span className="text-xs text-[var(--smartfactory-text-secondary)]">Total Lots</span>
          </div>
        </div>

        {/* Side Legend */}
        <div className="flex flex-col gap-2">
          {pieData
            .filter((entry) => entry.value > 0)
            .map((entry) => (
              <div key={entry.name} className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-xs text-[var(--smartfactory-text-secondary)] min-w-[60px]">
                  {entry.name}
                </span>
                <span className="text-xs font-mono font-semibold text-[var(--smartfactory-text-primary)] min-w-[24px] text-right">
                  {entry.value}
                </span>
                <span className="text-xs text-[var(--smartfactory-text-muted)]">
                  ({((entry.value / total) * 100).toFixed(0)}%)
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
    </motion.div>
  );
}
