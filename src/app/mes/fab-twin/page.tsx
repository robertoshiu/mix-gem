'use client';

import dynamic from 'next/dynamic';
import { Activity, AlertTriangle, Database } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  FAB_TWIN_FAULT_SCENES,
  FAB_TWIN_SENSORS,
  FAB_TWIN_TOOLS,
  FAB_TWIN_UNITS,
  FAB_TWIN_ZONES,
  type FabTwinFaultId,
  type FabTwinMode,
  type FabTwinView,
  getFaultScene,
  getKpisForFault,
} from '@/lib/fab-twin-data';

const FabTwinBabylonScene = dynamic(
  () => import('@/components/babylon/FabTwinBabylonScene').then((mod) => ({ default: mod.FabTwinBabylonScene })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[620px] items-center justify-center bg-[var(--sf-bg-canvas)]">
        <div className="rounded-2xl border border-[var(--sf-border-default)] bg-[rgba(17,29,46,0.9)] px-6 py-5 text-center shadow-2xl">
          <p className="animate-pulse text-sm text-[var(--sf-text-secondary)] motion-reduce:animate-none">Initializing Babylon.js fab twin...</p>
        </div>
      </div>
    ),
  },
);

interface PickedAsset {
  id: string;
  path: string;
  type: string;
  metadata: unknown;
}

const VIEW_OPTIONS: Array<{ id: FabTwinView; label: string; description: string }> = [
  { id: 'overview', label: '俯視總覽', description: 'Bay / chase / subfab cascade' },
  { id: 'operator', label: '操作員視角', description: 'Load port and operator zones' },
  { id: 'maintenance', label: '維修視角', description: 'Doors, panels, clearance' },
  { id: 'pipe-rack', label: '管廊視角', description: 'Rack levels and utilities' },
  { id: 'control-room', label: '中控台視角', description: 'Console and KPI command' },
];

const MODE_OPTIONS: Array<{ id: FabTwinMode; label: string; icon: typeof Activity }> = [
  { id: 'normal', label: 'Normal', icon: Activity },
  { id: 'maintenance', label: 'Maintenance', icon: Activity },
  { id: 'lot-transfer', label: 'Lot Transfer', icon: Activity },
  { id: 'alarm', label: 'Alarm Flash', icon: AlertTriangle },
];

function MetadataPreview({ asset }: { asset: PickedAsset | null }) {
  if (!asset) {
    return (
      <div className="rounded-2xl border border-[var(--sf-border-default)] bg-[rgba(17,29,46,0.78)] p-4">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--sf-text-primary)]">
          <Database className="h-4 w-4 text-[var(--sf-accent-cyan)]" aria-hidden="true" />
          Queryable Asset Metadata
        </div>
        <p className="text-xs leading-relaxed text-[var(--sf-text-secondary)]">
          Click any tool, zone, pipe, power panel, sensor, carrier, clearance envelope, or collision proxy in the Babylon scene to inspect its unique ID and hierarchy path.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[rgba(34,211,238,0.35)] bg-[rgba(8,18,31,0.88)] p-4 shadow-[0_18px_48px_rgba(0,0,0,0.3)]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-mono text-sm font-semibold text-[var(--sf-text-primary)]">{asset.id}</p>
          <p className="truncate font-mono text-[11px] text-[var(--sf-text-secondary)]">{asset.path}</p>
        </div>
        <span className="shrink-0 rounded-full bg-[rgba(34,211,238,0.12)] px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--sf-accent-cyan)]">{asset.type}</span>
      </div>
      <pre className="max-h-52 overflow-auto rounded-xl border border-white/10 bg-black/30 p-3 text-[10px] leading-relaxed text-slate-200">
        {JSON.stringify(asset.metadata, null, 2)}
      </pre>
    </div>
  );
}

function KpiPanel({ faultId }: { faultId: FabTwinFaultId }) {
  const kpis = getKpisForFault(faultId);
  const rows = [
    ['OEE', kpis.oee.value, kpis.oee.unit],
    ['Uptime', kpis.uptime.value, kpis.uptime.unit],
    ['Alarm rate', kpis.alarmRate.value, kpis.alarmRate.unit],
    ['Energy intensity', kpis.energyIntensity.value, kpis.energyIntensity.unit],
    ['Particle trend', kpis.particleTrend.value, kpis.particleTrend.unit],
    ['HVAC load', kpis.hvacLoad.value, kpis.hvacLoad.unit],
  ] as const;

  return (
    <section aria-label="KPI panel schema" className="grid grid-cols-2 gap-2 lg:grid-cols-3">
      {rows.map(([label, value, unit]) => (
        <div key={label} className="rounded-2xl border border-[var(--sf-border-default)] bg-[rgba(17,29,46,0.76)] p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--sf-text-muted)]">{label}</p>
          <p className="mt-1 font-mono text-lg font-semibold text-[var(--sf-text-primary)]">{Number(value).toFixed(label === 'Particle trend' || label === 'HVAC load' ? 0 : 1)}</p>
          <p className="font-mono text-[10px] text-[var(--sf-text-secondary)]">{unit}</p>
        </div>
      ))}
    </section>
  );
}

export default function FabTwinPage() {
  const [view, setView] = useState<FabTwinView>('overview');
  const [mode, setMode] = useState<FabTwinMode>('normal');
  const [faultId, setFaultId] = useState<FabTwinFaultId>('nominal');
  const [pickedAsset, setPickedAsset] = useState<PickedAsset | null>(null);
  const activeFault = useMemo(() => getFaultScene(faultId), [faultId]);
  const handleAssetPick = useCallback((asset: PickedAsset) => setPickedAsset(asset), []);

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-[var(--sf-bg-canvas)]">
      <header className="z-30 border-b border-[rgba(34,211,238,0.18)] bg-[rgba(2,6,23,0.92)] px-4 py-4 backdrop-blur-xl md:px-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-4xl">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Activity className="h-5 w-5 text-[var(--sf-accent-cyan)]" aria-hidden="true" />
              <h1 className="text-lg font-semibold tracking-[0.2em] text-[var(--sf-text-primary)]">FAB TWIN</h1>
              <span className="rounded-full border border-[rgba(34,211,238,0.35)] bg-[rgba(34,211,238,0.08)] px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--sf-accent-cyan)]">Babylon.js Y-up / meters + mm metadata</span>
            </div>
            <p className="text-sm leading-relaxed text-[var(--sf-text-secondary)]">
              Enterprise semiconductor cleanroom digital twin for concept demo, operator demo, engineering twin, and high-fidelity training. Every area, tool, utility, sensor, clearance envelope, collision mesh, and path exposes queryable metadata.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4 xl:min-w-[520px]">
            <div className="rounded-2xl border border-[var(--sf-border-default)] bg-white/[0.035] p-3">
              <p className="font-mono text-lg text-[var(--sf-text-primary)]">{FAB_TWIN_ZONES.length}</p>
              <p className="text-[var(--sf-text-secondary)]">zones</p>
            </div>
            <div className="rounded-2xl border border-[var(--sf-border-default)] bg-white/[0.035] p-3">
              <p className="font-mono text-lg text-[var(--sf-text-primary)]">{FAB_TWIN_TOOLS.length}</p>
              <p className="text-[var(--sf-text-secondary)]">process tools</p>
            </div>
            <div className="rounded-2xl border border-[var(--sf-border-default)] bg-white/[0.035] p-3">
              <p className="font-mono text-lg text-[var(--sf-text-primary)]">{FAB_TWIN_SENSORS.length}</p>
              <p className="text-[var(--sf-text-secondary)]">sensor points</p>
            </div>
            <div className="rounded-2xl border border-[var(--sf-border-default)] bg-white/[0.035] p-3">
              <p className="font-mono text-lg text-[var(--sf-text-primary)]">LOD0/1/2</p>
              <p className="text-[var(--sf-text-secondary)]">+ hero asset</p>
            </div>
          </div>
        </div>
      </header>

      <main className="grid flex-1 grid-cols-1 overflow-hidden xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="relative min-h-[680px] overflow-hidden">
          <FabTwinBabylonScene view={view} mode={mode === 'alarm' ? 'alarm' : mode} faultId={faultId} onAssetPick={handleAssetPick} />

          <div className="pointer-events-none absolute left-4 top-4 z-20 max-w-4xl space-y-3">
            <div className="pointer-events-auto rounded-2xl border border-[rgba(34,211,238,0.24)] bg-[rgba(8,18,31,0.78)] p-3 backdrop-blur-xl">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--sf-text-primary)]">
                <Activity className="h-4 w-4 text-[var(--sf-accent-cyan)]" aria-hidden="true" />
                Viewpoints
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-5">
                {VIEW_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setView(option.id)}
                    className={cn(
                      'min-h-[44px] rounded-xl border px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-border-active)]',
                      view === option.id ? 'border-[var(--sf-accent-cyan)] bg-[rgba(34,211,238,0.12)]' : 'border-white/10 bg-white/[0.04] hover:bg-white/[0.08]',
                    )}
                  >
                    <span className="block text-xs font-semibold text-[var(--sf-text-primary)]">{option.label}</span>
                    <span className="block text-[10px] leading-tight text-[var(--sf-text-secondary)]">{option.description}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute inset-x-4 bottom-4 z-20 grid grid-cols-1 gap-3 lg:grid-cols-3">
            <div className="pointer-events-auto rounded-2xl border border-[var(--sf-border-default)] bg-[rgba(8,18,31,0.82)] p-4 backdrop-blur-xl">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--sf-text-primary)]">
                <Activity className="h-4 w-4 text-[var(--sf-accent-cyan)]" aria-hidden="true" />
                Scene Graph Contract
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-[var(--sf-text-secondary)]">
                <span>Unit: {FAB_TWIN_UNITS.sceneUnit}</span>
                <span>Engineering: {FAB_TWIN_UNITS.engineeringUnit}</span>
                <span>Axis: {FAB_TWIN_UNITS.coordinateSystem}</span>
                <span>Export: glTF + JSON ready</span>
              </div>
            </div>

            <div className="pointer-events-auto rounded-2xl border border-[var(--sf-border-default)] bg-[rgba(8,18,31,0.82)] p-4 backdrop-blur-xl">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--sf-text-primary)]">
                <Activity className="h-4 w-4 text-[var(--sf-accent-cyan)]" aria-hidden="true" />
                Interaction Mode
              </div>
              <div className="grid grid-cols-2 gap-2">
                {MODE_OPTIONS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setMode(id)}
                    className={cn('min-h-[44px] rounded-xl border px-3 py-2 text-left text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-border-active)]', mode === id ? 'border-[var(--sf-accent-cyan)] bg-[rgba(34,211,238,0.12)] text-white' : 'border-white/10 bg-white/[0.04] text-[var(--sf-text-secondary)] hover:bg-white/[0.08]')}
                  >
                    <Icon className="mb-1 h-3.5 w-3.5" aria-hidden="true" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pointer-events-auto rounded-2xl border border-[var(--sf-border-default)] bg-[rgba(8,18,31,0.82)] p-4 backdrop-blur-xl">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--sf-text-primary)]">
                <AlertTriangle className="h-4 w-4 text-[var(--sf-status-amber)]" aria-hidden="true" />
                Fault Scene
              </div>
              <select
                value={faultId}
                onChange={(event) => setFaultId(event.target.value as FabTwinFaultId)}
                className="min-h-[44px] w-full rounded-xl border border-white/10 bg-slate-950 px-3 text-sm text-[var(--sf-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-border-active)]"
                aria-label="Select fault scene"
              >
                {FAB_TWIN_FAULT_SCENES.map((fault) => (
                  <option key={fault.id} value={fault.id}>{fault.label}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <aside className="flex min-h-[680px] flex-col gap-4 overflow-y-auto border-l border-[rgba(34,211,238,0.16)] bg-[rgba(2,6,23,0.92)] p-4">
          <KpiPanel faultId={faultId} />

          <section className="rounded-2xl border border-[var(--sf-border-default)] bg-[rgba(17,29,46,0.78)] p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--sf-text-primary)]">
              <AlertTriangle className="h-4 w-4 text-[var(--sf-status-amber)]" aria-hidden="true" />
              Fault Response
            </div>
            <dl className="space-y-3 text-xs leading-relaxed">
              <div>
                <dt className="font-semibold uppercase tracking-wider text-[var(--sf-text-muted)]">Trigger source</dt>
                <dd className="mt-1 text-[var(--sf-text-secondary)]">{activeFault.triggerSource}</dd>
              </div>
              <div>
                <dt className="font-semibold uppercase tracking-wider text-[var(--sf-text-muted)]">Impact zone</dt>
                <dd className="mt-1 text-[var(--sf-text-secondary)]">{activeFault.impactZone}</dd>
              </div>
              <div>
                <dt className="font-semibold uppercase tracking-wider text-[var(--sf-text-muted)]">Recommended action</dt>
                <dd className="mt-1 text-[var(--sf-text-secondary)]">{activeFault.recommendedAction}</dd>
              </div>
            </dl>
          </section>

          <MetadataPreview asset={pickedAsset} />

          <section className="rounded-2xl border border-[var(--sf-border-default)] bg-[rgba(17,29,46,0.78)] p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--sf-text-primary)]">
              <Activity className="h-4 w-4 text-[var(--sf-accent-cyan)]" aria-hidden="true" />
              Engineering Coverage
            </div>
            <ul className="space-y-2 text-xs leading-relaxed text-[var(--sf-text-secondary)]">
              <li>Process nodes: lithography, etch, deposition, metrology, test.</li>
              <li>Areas: bay, chase, subfab, control room, air shower, utility room.</li>
              <li>Utilities: FFU/HEPA/ULPA, return air, chilled water, exhaust, scrubber, gas, fire, power, UPS/PDU.</li>
              <li>Assets expose `metadata.path` for versionable hierarchy and data binding.</li>
              <li>Background texture budget: {FAB_TWIN_UNITS.textureBudget.background}; hero asset: {FAB_TWIN_UNITS.textureBudget.heroAsset}.</li>
            </ul>
          </section>

          <section className="rounded-2xl border border-[var(--sf-border-default)] bg-[rgba(17,29,46,0.78)] p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--sf-text-primary)]">
              <Activity className="h-4 w-4 text-[var(--sf-accent-cyan)]" aria-hidden="true" />
              Critical Quality Controls
            </div>
            <div className="space-y-2 text-xs text-[var(--sf-text-secondary)]">
              {FAB_TWIN_ZONES.filter((zone) => zone.criticalZone || zone.microclimate).map((zone) => (
                <div key={zone.id} className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
                  <p className="font-semibold text-[var(--sf-text-primary)]">{zone.label}</p>
                  <p>Particle risk: {zone.particleRisk} | AMC risk: {zone.amcRisk}</p>
                  <p>Vibration: {zone.vibrationClass} / {zone.isolationType}</p>
                  {zone.microclimate && <p>Setpoint: {zone.microclimate.temperatureSetpointC} degC, {zone.microclimate.rhSetpointPct}% RH, guard band +/-{zone.microclimate.maxTempDriftC} degC / +/-{zone.microclimate.maxRhDriftPct}% RH</p>}
                </div>
              ))}
            </div>
          </section>
        </aside>
      </main>
    </div>
  );
}
