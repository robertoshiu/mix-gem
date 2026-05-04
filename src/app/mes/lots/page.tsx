'use client';

import { useMesSpcStore } from '@/stores/mes-spc-store';
import type { LotStatus } from '@/lib/mes-types';
import { cn } from '@/lib/utils';

const STATUS_STYLES: Record<LotStatus, string> = {
  in_process: 'bg-blue-900/40 text-blue-300 border-blue-700',
  completed:  'bg-emerald-900/40 text-emerald-300 border-emerald-700',
  on_hold:    'bg-amber-900/40 text-amber-300 border-amber-700',
  pending:    'bg-slate-800 text-slate-400 border-slate-600',
};

export default function LotsPage() {
  const { lots, recipes, measurements } = useMesSpcStore();

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold text-[#F1F5F9]">Lot Tracker</h2>

      <div className="bg-[#111D2E] rounded border border-[#1E3A5F] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1E3A5F]">
              {['Lot ID', 'Product', 'Recipe', 'Wafers Run', 'Status', 'Started'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#94A3B8] uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lots.map((lot, i) => {
              const recipe = recipes.find((r) => r.id === lot.recipeId);
              const wafersRun = measurements.filter((m) => m.lotId === lot.id).length;
              return (
                <tr
                  key={lot.id}
                  className={cn(
                    'border-b border-[#1E3A5F] last:border-0 hover:bg-[#182840] transition-colors',
                    i % 2 === 0 ? '' : 'bg-[#0D1825]'
                  )}
                >
                  <td className="px-4 py-3 font-['Fira_Code',monospace] text-[#F1F5F9]">{lot.id}</td>
                  <td className="px-4 py-3 text-[#94A3B8]">{lot.product}</td>
                  <td className="px-4 py-3 text-[#94A3B8]">{recipe?.name ?? lot.recipeId}</td>
                  <td className="px-4 py-3 font-['Fira_Code',monospace] text-[#F1F5F9]">{wafersRun} / {lot.waferCount}</td>
                  <td className="px-4 py-3">
                    <span className={cn('text-xs px-2 py-0.5 rounded border font-medium', STATUS_STYLES[lot.status])}>
                      {lot.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#475569] font-['Fira_Code',monospace]">
                    {lot.startedAt.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
