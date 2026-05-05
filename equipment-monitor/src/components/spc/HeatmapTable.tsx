'use client';

import { generateHeatmapData } from '@/lib/mes-mock-data';
import type { HeatmapCell } from '@/lib/mes-types';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

const PARAM_LABELS: Record<string, string> = {
  CD: 'CD',
  CDU: 'CDU',
  OVL_X: 'OVL-X',
  OVL_Y: 'OVL-Y',
};

const CELL_BG: Record<HeatmapCell['status'], string> = {
  ok: 'bg-[var(--smartfactory-status-green)]/10',
  warning: 'bg-[var(--smartfactory-status-amber)]/10',
  alarm: 'bg-[var(--smartfactory-status-red)]/10',
};

const CELL_TEXT: Record<HeatmapCell['status'], string> = {
  ok: 'text-[var(--smartfactory-status-green)]',
  warning: 'text-[var(--smartfactory-status-amber)]',
  alarm: 'text-[var(--smartfactory-status-red)]',
};

const BADGE_CONFIG: Record<string, { label: string; bg: string }> = {
  PASS: { label: 'PASS', bg: 'bg-[var(--smartfactory-status-green)]/20 text-[var(--smartfactory-status-green)] border border-[var(--smartfactory-status-green)]/40' },
  MONITOR: { label: 'MONITOR', bg: 'bg-[var(--smartfactory-status-amber)]/20 text-[var(--smartfactory-status-amber)] border border-[var(--smartfactory-status-amber)]/40' },
  HOLD: { label: 'HOLD', bg: 'bg-[var(--smartfactory-status-red)]/20 text-[var(--smartfactory-status-red)] border border-[var(--smartfactory-status-red)]/40' },
};

interface LotStatus {
  lot: string;
  cells: HeatmapCell[];
  overall: 'PASS' | 'MONITOR' | 'HOLD';
}

function computeLotStatus(cells: HeatmapCell[]): LotStatus['overall'] {
  const hasAlarm = cells.some((c) => c.status === 'alarm');
  const hasWarning = cells.some((c) => c.status === 'warning');
  if (hasAlarm) return 'HOLD';
  if (hasWarning) return 'MONITOR';
  return 'PASS';
}

export function HeatmapTable() {
  const allCells = useMemo(() => generateHeatmapData(), []);

  const lots: LotStatus[] = useMemo(() => {
    const lotNames = [...new Set(allCells.map((c) => c.lot))];
    return lotNames.map((lot) => {
      const cells = allCells.filter((c) => c.lot === lot);
      return { lot, cells, overall: computeLotStatus(cells) };
    });
  }, [allCells]);

  const params = useMemo(() => [...new Set(allCells.map((c) => c.param))], [allCells]);

  return (
    <div className="bg-[var(--smartfactory-surface-card)] rounded border border-[var(--smartfactory-border-default)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm" aria-label="Lot parameter heatmap showing CD, CDU, and overlay values">
          <thead>
            <tr className="border-b border-[var(--smartfactory-border-default)]">
              <th className="sticky left-0 z-10 bg-[var(--smartfactory-surface-card)] px-4 py-3 text-left text-xs font-semibold text-[var(--smartfactory-text-secondary)] uppercase tracking-wide">
                Lot ID
              </th>
              {params.map((param) => (
                <th
                  key={param}
                  className="px-4 py-3 text-center text-xs font-semibold text-[var(--smartfactory-text-secondary)] uppercase tracking-wide"
                >
                  {PARAM_LABELS[param] ?? param}
                </th>
              ))}
              <th className="sticky right-0 z-10 bg-[var(--smartfactory-surface-card)] px-4 py-3 text-center text-xs font-semibold text-[var(--smartfactory-text-secondary)] uppercase tracking-wide">
                Overall Status
              </th>
            </tr>
          </thead>
          <tbody>
            {lots.map((lot, i) => (
              <tr
                key={lot.lot}
                className={cn(
                  'border-b border-[var(--smartfactory-border-default)] last:border-0',
                  i % 2 === 0 ? '' : 'bg-[var(--smartfactory-surface-row-alt)]'
                )}
              >
                <td className="sticky left-0 z-10 bg-inherit px-4 py-3 font-['Fira_Code',monospace] text-[var(--smartfactory-text-primary)]">
                  {lot.lot}
                </td>
                {lot.cells.map((cell) => (
                  <td
                    key={cell.param}
                    className={cn('px-4 py-3 text-center font-["Fira_Code",monospace] text-sm', CELL_BG[cell.status], CELL_TEXT[cell.status])}
                  >
                    {cell.value.toFixed(2)}
                  </td>
                ))}
                <td className="sticky right-0 z-10 bg-inherit px-4 py-3 text-center">
                  <span className={cn('inline-flex items-center text-xs px-2 py-0.5 rounded font-medium', BADGE_CONFIG[lot.overall].bg)}>
                    {BADGE_CONFIG[lot.overall].label}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
