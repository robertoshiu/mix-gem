'use client';
import { useMesSpcStore } from '@/stores/mes-spc-store';
import { SPC_PARAMETERS, SPC_PARAM_KEYS } from '@/lib/spc-parameters';
import type { SpcParameter } from '@/lib/mes-types';

export function CpkPanel() {
  const capabilityResults = useMesSpcStore((s) => s.capabilityResults);
  
  const statusColors: Record<string, string> = {
    capable: 'var(--smartfactory-status-green)',
    marginal: 'var(--smartfactory-status-amber)',
    incapable: 'var(--smartfactory-status-red)',
  };
  
  return (
    <div data-testid="cpk-panel" className="grid grid-cols-5 gap-2">
      {SPC_PARAM_KEYS.map((param) => {
        const result = capabilityResults[param as SpcParameter];
        const config = SPC_PARAMETERS[param as SpcParameter];
        const color = result ? statusColors[result.status] : 'var(--smartfactory-text-muted)';
        return (
          <div key={param}
            data-testid={`cpk-row-${param}`}
            className="rounded p-2 text-center border"
            style={{ borderColor: color, backgroundColor: 'var(--smartfactory-surface-card)' }}>
            <div className="text-xs font-semibold" style={{ color: 'var(--smartfactory-text-secondary)' }}>{config.label}</div>
            <div className="text-lg font-bold font-mono" style={{ color }}>{result ? result.cpk.toFixed(2) : '—'}</div>
            <div className="text-[10px]" style={{ color }}>
              {result ? result.status.toUpperCase() : 'NO DATA'}
            </div>
            {result && (
              <div className="text-[10px] font-mono mt-0.5" style={{ color: 'var(--smartfactory-text-muted)' }}>
                Cp:{result.cp.toFixed(2)} Pp:{result.pp.toFixed(2)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
