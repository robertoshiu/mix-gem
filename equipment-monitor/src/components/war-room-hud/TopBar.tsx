import { Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FabTwinFaultId, Subsystem } from '@/lib/fab-twin-data';
import { FAB_TWIN_FAULT_SCENES, SUBSYSTEM_META, getKpisForFault } from '@/lib/fab-twin-data';

const KPI_ROWS = [
  ['OEE', 'oee'],
  ['Uptime', 'uptime'],
  ['Alarm rate', 'alarmRate'],
  ['Energy intensity', 'energyIntensity'],
  ['Particle trend', 'particleTrend'],
  ['HVAC load', 'hvacLoad'],
] as const;

function kpiStatus(value: number, key: (typeof KPI_ROWS)[number][1]) {
  if (key === 'alarmRate' || key === 'particleTrend' || key === 'energyIntensity' || key === 'hvacLoad') {
    return value > (key === 'alarmRate' ? 2 : key === 'particleTrend' ? 55 : key === 'hvacLoad' ? 82 : 46) ? 'var(--sf-status-red)' : value > (key === 'alarmRate' ? 1.2 : key === 'particleTrend' ? 28 : key === 'hvacLoad' ? 75 : 44) ? 'var(--sf-status-amber)' : 'var(--sf-status-green)';
  }
  return value < 82 ? 'var(--sf-status-red)' : value < 92 ? 'var(--sf-status-amber)' : 'var(--sf-status-green)';
}

export function TopBar({
  faultId,
  activeSubsystem,
  onFaultChange,
  onSubsystemToggle,
}: {
  faultId: FabTwinFaultId;
  activeSubsystem: Subsystem | null;
  onFaultChange: (faultId: FabTwinFaultId) => void;
  onSubsystemToggle: (subsystem: Subsystem) => void;
}) {
  const kpis = getKpisForFault(faultId);

  return (
    <header className="fixed inset-x-0 top-[101px] z-40 border-b border-[rgba(34,211,238,0.2)] bg-[rgba(2,6,23,0.88)] px-4 py-2 backdrop-blur-xl md:px-6">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Activity className="h-5 w-5 shrink-0 text-[var(--sf-accent-cyan)]" aria-hidden="true" />
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold tracking-[0.22em] text-[var(--sf-text-primary)]">WAR ROOM 3D</h1>
            <p className="hidden text-[10px] uppercase tracking-[0.18em] text-[var(--sf-text-muted)] md:block">Babylon HUD smart factory</p>
          </div>
        </div>

        <div className="grid flex-1 grid-cols-2 gap-2 md:grid-cols-3 xl:max-w-4xl xl:grid-cols-6">
          {KPI_ROWS.map(([label, key]) => {
            const item = kpis[key];
            const color = kpiStatus(item.value, key);
            return (
              <div key={key} className="rounded-xl border bg-white/[0.035] px-3 py-2 font-mono" style={{ borderColor: color, boxShadow: `0 0 16px color-mix(in srgb, ${color} 24%, transparent)` }}>
                <p className="truncate text-[9px] uppercase tracking-wider text-[var(--sf-text-muted)]">{label}</p>
                <p className="text-sm font-semibold text-[var(--sf-text-primary)]">{Number(item.value).toFixed(key === 'particleTrend' || key === 'hvacLoad' ? 0 : 1)} <span className="text-[9px] text-[var(--sf-text-secondary)]">{item.unit}</span></p>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(Object.keys(SUBSYSTEM_META) as Subsystem[]).map((subsystem) => {
            const meta = SUBSYSTEM_META[subsystem];
            const active = activeSubsystem === subsystem;
            return (
              <button
                key={subsystem}
                type="button"
                onClick={() => onSubsystemToggle(subsystem)}
                aria-pressed={active}
                aria-label={`${meta.label} filter ${active ? 'active' : 'inactive'}`}
                className={cn('min-h-[44px] rounded-full border px-3 py-2 font-mono text-xs font-semibold tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-border-active)]', active ? 'text-white' : 'text-[var(--sf-text-secondary)] hover:bg-white/[0.08]')}
                style={{ borderColor: active ? meta.accent : 'rgba(148,163,184,0.25)', backgroundColor: active ? `${meta.color}33` : 'rgba(255,255,255,0.035)', boxShadow: active ? `0 0 22px ${meta.color}66` : 'none' }}
              >
                {meta.shortLabel}
              </button>
            );
          })}
          <label className="sr-only" htmlFor="war-room-fault-scene">Fault scenario</label>
          <select
            id="war-room-fault-scene"
            value={faultId}
            onChange={(event) => onFaultChange(event.target.value as FabTwinFaultId)}
            className="min-h-[44px] rounded-full border border-white/10 bg-slate-950 px-3 font-mono text-xs text-[var(--sf-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-border-active)]"
          >
            {FAB_TWIN_FAULT_SCENES.map((fault) => (
              <option key={fault.id} value={fault.id}>{fault.label}</option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
}
