'use client';

import { SPC_PARAMETERS, SPC_PARAM_KEYS } from '@/lib/spc-parameters';
import type { SpcMeasurement, SpcParameter } from '@/lib/mes-types';
import { cn } from '@/lib/utils';

interface KpiStripProps {
  latest: SpcMeasurement | null;
  hasViolation: boolean;
  violatedParam?: SpcParameter;
}

export function KpiStrip({ latest, hasViolation, violatedParam }: KpiStripProps) {
  if (!latest) {
    return (
      <div data-testid="kpi-strip-skeleton" className="grid grid-cols-2 md:grid-cols-5 gap-2 p-3 bg-[#111D2E] rounded border border-[#1E3A5F] animate-pulse">
        {SPC_PARAM_KEYS.map((param) => (
          <div key={param} className="h-14 bg-[#182840] rounded" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 p-3 bg-[#111D2E] rounded border border-[#1E3A5F]">
      {SPC_PARAM_KEYS.map((param) => {
        const config = SPC_PARAMETERS[param];
        const value = latest[param as keyof SpcMeasurement] as number;
        const isViolating = hasViolation && violatedParam === param;
        const isOk = value > config.lcl && value < config.ucl;

        return (
          <div
            key={param}
            className={cn(
              'flex flex-col gap-0.5 px-3 py-2 rounded',
              isViolating ? 'bg-red-950/40 border border-[#EF4444]' : 'bg-[#182840]'
            )}
          >
            <span className="text-xs text-[#94A3B8] truncate">{config.label}</span>
            <span className="font-['Fira_Code',monospace] text-lg font-semibold text-[#F1F5F9]">
              {value.toFixed(2)}
              <span className="text-xs font-normal text-[#94A3B8] ml-1">{config.unit}</span>
            </span>
            <span className={cn('text-xs font-medium', isOk ? 'text-[#10B981]' : 'text-[#EF4444]')}>
              {isOk ? 'OK' : 'OOC'}
            </span>
          </div>
        );
      })}
    </div>
  );
}