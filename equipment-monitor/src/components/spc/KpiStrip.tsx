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
      <div data-testid="kpi-strip-skeleton" className="grid grid-cols-2 md:grid-cols-5 gap-2 p-3 bg-[var(--smartfactory-surface-card)] rounded border border-[var(--smartfactory-border-default)] animate-pulse">
        {SPC_PARAM_KEYS.map((param) => (
          <div key={param} className="h-14 bg-[var(--smartfactory-surface-elevated)] rounded" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 p-3 bg-[var(--smartfactory-surface-card)] rounded border border-[var(--smartfactory-border-default)]">
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
              isViolating ? 'bg-red-950/40 border border-[var(--smartfactory-status-red)]' : 'bg-[var(--smartfactory-surface-elevated)]'
            )}
          >
            <span className="text-xs text-[var(--smartfactory-text-secondary)] truncate">{config.label}</span>
            <span className="font-['Fira_Code',monospace] text-lg font-semibold text-[var(--smartfactory-text-primary)]">
              {value.toFixed(2)}
              <span className="text-xs font-normal text-[var(--smartfactory-text-secondary)] ml-1">{config.unit}</span>
            </span>
            <span className={cn('text-xs font-medium', isOk ? 'text-[var(--smartfactory-status-green)]' : 'text-[var(--smartfactory-status-red)]')}>
              {isOk ? 'OK' : 'OOC'}
            </span>
          </div>
        );
      })}
    </div>
  );
}