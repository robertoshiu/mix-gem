'use client';

import { Fragment, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMesSpcStore } from '@/stores/mes-spc-store';
import type { LotStatus } from '@/lib/mes-types';
import { cn } from '@/lib/utils';
import { Play, Pause, Check, Clock, FlaskConical } from 'lucide-react';

const STATUS_CONFIG: Record<LotStatus, { label: string; bg: string; Icon: React.ComponentType<{ className?: string }> }> = {
  in_process: { label: 'IN PROCESS', bg: 'bg-blue-900/40 text-blue-300 border-blue-700', Icon: Play },
  on_hold:    { label: 'ON HOLD',    bg: 'bg-amber-900/40 text-amber-300 border-amber-700', Icon: Pause },
  completed:  { label: 'COMPLETED',  bg: 'bg-emerald-900/40 text-emerald-300 border-emerald-700', Icon: Check },
  pending:    { label: 'PENDING',    bg: 'bg-slate-800 text-slate-400 border-slate-600', Icon: Clock },
};

const SPC_SUMMARY_PARAMS: { label: string; key: 'cd' | 'cdu' | 'ovl_x' | 'ovl_y' | 'ler' }[] = [
  { label: 'CD',    key: 'cd' },
  { label: 'CDU',   key: 'cdu' },
  { label: 'OVL-X', key: 'ovl_x' },
  { label: 'OVL-Y', key: 'ovl_y' },
  { label: 'LER',   key: 'ler' },
];

export default function LotsPage() {
  const { lots, recipes, measurements, startProcessing } = useMesSpcStore();
  const router = useRouter();
  const [expandedLotId, setExpandedLotId] = useState<string | null>(null);

  function handleRowClick(lotId: string) {
    setExpandedLotId((prev) => (prev === lotId ? null : lotId));
  }

  function handleSelectLot(lotId: string, recipeId: string) {
    startProcessing(lotId, recipeId);
    router.push(`/mes/spc?lotId=${lotId}`);
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold text-[var(--smartfactory-text-primary)]">Lot Tracker</h2>

      <div className="bg-[var(--smartfactory-surface-card)] rounded border border-[var(--smartfactory-border-default)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--smartfactory-border-default)]">
              {['Lot ID', 'Product', 'Recipe', 'Wafers Run', 'Status', 'Started'].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold text-[var(--smartfactory-text-secondary)] uppercase tracking-wide"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lots.map((lot, i) => {
              const recipe = recipes.find((r) => r.id === lot.recipeId);
              const wafersRun = measurements.filter((m) => m.lotId === lot.id).length;
              const pct = lot.waferCount > 0 ? Math.round((wafersRun / lot.waferCount) * 100) : 0;
              const { label, bg, Icon } = STATUS_CONFIG[lot.status];
              const isExpanded = expandedLotId === lot.id;
              const lotMeasurements = measurements.filter((m) => m.lotId === lot.id);
              const latestMeasurement = lotMeasurements[lotMeasurements.length - 1] ?? null;

              return (
                <Fragment key={lot.id}>
                  <tr
                    data-testid={`lot-row-${lot.id}`}
                    onClick={() => handleRowClick(lot.id)}
                    className={cn(
                      'border-b border-[var(--smartfactory-border-default)] last:border-0 hover:bg-[var(--smartfactory-surface-elevated)] transition-colors cursor-pointer',
                      i % 2 === 0 ? '' : 'bg-[#0D1825]'
                    )}
                  >
                    <td className="px-4 py-3 font-['Fira_Code',monospace] text-[var(--smartfactory-text-primary)]">
                      {lot.id}
                    </td>
                    <td className="px-4 py-3 text-[var(--smartfactory-text-secondary)]">
                      {lot.product}
                    </td>
                    <td className="px-4 py-3 text-[var(--smartfactory-text-secondary)]">
                      {recipe?.name ?? lot.recipeId}
                    </td>
                    <td className="px-4 py-3 font-['Fira_Code',monospace] text-[var(--smartfactory-text-primary)]">
                      {wafersRun} / {lot.waferCount}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        data-testid={`lot-status-${lot.id}`}
                        className={cn('inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded border font-medium', bg)}
                      >
                        <Icon className="w-3 h-3" />
                        {label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--smartfactory-text-muted)] font-['Fira_Code',monospace]">
                      {lot.startedAt.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr data-testid={`lot-expand-${lot.id}`}>
                      <td
                        colSpan={6}
                        className="px-4 py-4 bg-[var(--smartfactory-surface-card)]/60 border-b border-[var(--smartfactory-border-default)]"
                      >
                        <div className="space-y-3">
                          {/* Wafer Progress */}
                          <div>
                            <div className="flex justify-between text-xs text-[var(--smartfactory-text-secondary)] mb-1">
                              <span>Wafers: {wafersRun} / {lot.waferCount} ({pct}%)</span>
                            </div>
                            <div className="w-full bg-slate-700 rounded h-1.5">
                              <div
                                className="bg-emerald-500 rounded h-1.5 transition-all"
                                style={{ width: `${Math.min(pct, 100)}%` }}
                              />
                            </div>
                          </div>

                          {/* Recipe */}
                          <div className="flex items-center gap-2 text-xs text-[var(--smartfactory-text-secondary)]">
                            <FlaskConical className="w-3.5 h-3.5 text-[var(--smartfactory-accent-blue)]" />
                            <span className="font-['Fira_Code',monospace]">{recipe?.name ?? lot.recipeId}</span>
                          </div>

                          {/* SPC Mini Grid */}
                          {latestMeasurement && (
                            <div className="grid grid-cols-3 gap-2 pt-1">
                              {SPC_SUMMARY_PARAMS.map((p) => (
                                <div key={p.label} className="bg-slate-800/50 rounded p-2">
                                  <div className="text-[10px] text-[var(--smartfactory-text-muted)] uppercase tracking-wide">
                                    {p.label}
                                  </div>
                                  <div className="text-xs font-['Fira_Code',monospace] text-[var(--smartfactory-text-primary)]">
                                    {latestMeasurement[p.key].toFixed(2)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Select Lot */}
                          <button
                            data-testid={`lot-select-${lot.id}`}
                            onClick={() => handleSelectLot(lot.id, lot.recipeId)}
                            className="bg-[var(--smartfactory-accent-blue)] text-white text-xs px-3 py-1.5 rounded hover:opacity-90 transition-opacity"
                          >
                            Select Lot
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
