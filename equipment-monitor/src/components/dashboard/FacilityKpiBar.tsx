'use client';

import type { FacilityKpis } from '@/stores/dashboard-facility-store';

interface FacilityKpiBarProps {
  kpis: FacilityKpis;
}

interface KpiCardDef {
  label: string;
  getValue: (kpis: FacilityKpis) => string;
  getStatus: (kpis: FacilityKpis) => 'green' | 'amber' | 'red';
  unit?: string;
}

const KPI_DEFS: KpiCardDef[] = [
  {
    label: 'Comfort Index',
    getValue: (k) => k.comfortIndex.toFixed(1),
    getStatus: (k) => k.comfortIndex >= 90 ? 'green' : k.comfortIndex >= 75 ? 'amber' : 'red',
    unit: '/100',
  },
  {
    label: 'Active Alarms',
    getValue: (k) => `${k.activeAlarms.warnings + k.activeAlarms.criticals}`,
    getStatus: (k) => k.activeAlarms.criticals > 0 ? 'red' : k.activeAlarms.warnings > 0 ? 'amber' : 'green',
  },
  {
    label: 'Power PUE',
    getValue: (k) => k.pue.toFixed(2),
    getStatus: (k) => k.pue <= 1.4 ? 'green' : k.pue <= 1.6 ? 'amber' : 'red',
  },
  {
    label: 'System Uptime',
    getValue: (k) => k.systemUptime.toFixed(0),
    getStatus: (k) => k.systemUptime >= 100 ? 'green' : k.systemUptime >= 80 ? 'amber' : 'red',
    unit: '%',
  },
  {
    label: 'Energy Load',
    getValue: (k) => k.energyLoad.toFixed(0),
    getStatus: (k) => k.energyLoad <= 900 ? 'green' : k.energyLoad <= 950 ? 'amber' : 'red',
    unit: 'kW',
  },
  {
    label: 'Gas Safety',
    getValue: (k) => k.gasSafety.toFixed(1),
    getStatus: (k) => k.gasSafety >= 95 ? 'green' : k.gasSafety >= 85 ? 'amber' : 'red',
    unit: '/100',
  },
];

const STATUS_COLORS = {
  green: { dot: 'bg-emerald-400', text: 'text-emerald-400', border: 'border-emerald-400/20' },
  amber: { dot: 'bg-amber-400', text: 'text-amber-400', border: 'border-amber-400/20' },
  red: { dot: 'bg-red-500 animate-pulse', text: 'text-red-400', border: 'border-red-400/20' },
};

export function FacilityKpiBar({ kpis }: FacilityKpiBarProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {KPI_DEFS.map((def) => {
        const status = def.getStatus(kpis);
        const colors = STATUS_COLORS[status];
        return (
          <div
            key={def.label}
            data-testid="kpi-card"
            className={`rounded-2xl border ${colors.border} bg-[rgba(2,6,23,0.72)] p-4 backdrop-blur-xl`}
          >
            <div className="mb-2 flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${colors.dot}`} />
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--sf-text-muted)]">
                {def.label}
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className={`font-mono text-2xl font-bold tabular-nums ${colors.text}`}>
                {def.getValue(kpis)}
              </span>
              {def.unit && (
                <span className="text-xs text-[var(--sf-text-muted)]">{def.unit}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
