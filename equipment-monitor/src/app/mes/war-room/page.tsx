'use client';

import { useEffect, useCallback, useSyncExternalStore } from 'react';
import dynamic from 'next/dynamic';
import { Activity, AlertTriangle } from 'lucide-react';
import { useWarRoomStore } from '@/stores/war-room-store';
import { cn } from '@/lib/utils';
import { PowerMonitoringPanel } from '@/components/war-room/PowerMonitoringPanel';
import { BuildingAutoPanel } from '@/components/war-room/BuildingAutoPanel';
import { GasDetectionPanel } from '@/components/war-room/GasDetectionPanel';
import { FireAlarmPanel } from '@/components/war-room/FireAlarmPanel';

const FactoryCanvas = dynamic(
  () => import('@/components/three/FactoryCanvas').then((mod) => ({ default: mod.FactoryCanvas })),
  { ssr: false },
);

const FactoryScene = dynamic(
  () => import('@/components/three/FactoryScene').then((mod) => ({ default: mod.FactoryScene })),
  { ssr: false },
);

const SubsystemZone = dynamic(
  () => import('@/components/three/SubsystemZone').then((mod) => ({ default: mod.SubsystemZone })),
  { ssr: false },
);

type ZoneType = 'power' | 'building-auto' | 'gas' | 'fire';

const ZONE_META: Array<{
  id: ZoneType;
  label: string;
  shortLabel: string;
  description: string;
  position: [number, number, number];
  colorVar: string;
}> = [
  {
    id: 'power',
    label: 'Power Monitoring',
    shortLabel: 'PWR',
    description: 'Substation load, voltage quality, PF',
    position: [-6.5, 0.12, -6.5],
    colorVar: 'var(--sf-power-primary)',
  },
  {
    id: 'building-auto',
    label: 'Building Auto',
    shortLabel: 'BAS',
    description: 'HVAC, cleanroom pressure, lighting',
    position: [6.5, 0.12, -6.5],
    colorVar: 'var(--sf-ba-primary)',
  },
  {
    id: 'gas',
    label: 'Gas Detection',
    shortLabel: 'GAS',
    description: 'Toxic gas sensors and exhaust zones',
    position: [-6.5, 0.12, 6.5],
    colorVar: 'var(--sf-gas-primary)',
  },
  {
    id: 'fire',
    label: 'Fire Alarm',
    shortLabel: 'FIRE',
    description: 'Detector loops and suppression status',
    position: [6.5, 0.12, 6.5],
    colorVar: 'var(--sf-fire-primary)',
  },
];

const PANEL_MAP = {
  power: PowerMonitoringPanel,
  'building-auto': BuildingAutoPanel,
  gas: GasDetectionPanel,
  fire: FireAlarmPanel,
} as const;

export default function WarRoomPage() {
  const showLiveData = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const activeZone = useWarRoomStore((s) => s.activeZone);
  const overlayOpen = useWarRoomStore((s) => s.overlayOpen);
  const subsystemData = useWarRoomStore((s) => s.subsystemData);
  const setActiveZone = useWarRoomStore((s) => s.setActiveZone);
  const closeOverlay = useWarRoomStore((s) => s.closeOverlay);
  const refreshData = useWarRoomStore((s) => s.refreshData);

  useEffect(() => {
    refreshData();
    const id = setInterval(refreshData, 5000);
    return () => clearInterval(id);
  }, [refreshData]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && overlayOpen) closeOverlay();
    },
    [overlayOpen, closeOverlay],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const hasAlerts: Record<ZoneType, boolean> = {
    power: subsystemData.power.alarms.length > 0,
    'building-auto': subsystemData['building-auto'].alarms.length > 0,
    gas: subsystemData.gas.alarms.length > 0,
    fire: subsystemData.fire.alarms.length > 0,
  };
  const displayedAlerts: Record<ZoneType, boolean> = showLiveData
    ? hasAlerts
    : { power: false, 'building-auto': false, gas: false, fire: false };

  const ActivePanel = activeZone ? PANEL_MAP[activeZone] : null;

  return (
    <div
      className="relative flex min-h-dvh flex-col overflow-hidden"
      style={{ backgroundColor: 'var(--sf-bg-canvas, #0B0F19)' }}
    >
      <header
        className="z-30 flex shrink-0 flex-col gap-3 border-b px-4 py-3 backdrop-blur-xl md:flex-row md:items-center md:justify-between md:px-6"
        style={{
          backgroundColor: 'rgba(11, 15, 25, 0.88)',
          borderColor: 'rgba(59, 130, 246, 0.18)',
        }}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4" style={{ color: 'var(--sf-accent-cyan)' }} aria-hidden="true" />
            <h1 className="text-lg font-semibold tracking-[0.22em]" style={{ color: 'var(--sf-text-primary)' }}>
              WAR ROOM 3D
            </h1>
          </div>
          <p className="mt-1 text-xs" style={{ color: 'var(--sf-text-secondary)' }}>
            Live facility subsystems with resilient 3D and fallback controls
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {ZONE_META.map((zone) => {
            const alert = displayedAlerts[zone.id];
            return (
              <button
                key={zone.id}
                type="button"
                onClick={() => setActiveZone(zone.id)}
                className={cn(
                  'flex min-w-0 items-center gap-2 rounded-full border px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 motion-reduce:transition-none',
                  activeZone === zone.id ? 'bg-white/10' : 'bg-white/[0.03] hover:bg-white/[0.07]',
                )}
                style={{
                  borderColor: activeZone === zone.id ? zone.colorVar : 'var(--sf-border-default)',
                  color: activeZone === zone.id ? 'var(--sf-text-primary)' : 'var(--sf-text-secondary)',
                }}
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{
                    backgroundColor: alert ? zone.colorVar : 'var(--sf-text-muted)',
                    boxShadow: alert ? `0 0 14px ${zone.colorVar}` : 'none',
                  }}
                />
                <span className="truncate">{zone.shortLabel}</span>
                {alert && <AlertTriangle className="h-3 w-3 shrink-0" style={{ color: zone.colorVar }} aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      </header>

      <main className="relative flex min-h-[640px] flex-1 overflow-hidden md:min-h-[720px]">
        <FactoryCanvas className="h-full min-h-[640px] w-full md:min-h-[720px]">
          <FactoryScene />
          {ZONE_META.map((zone) => (
            <SubsystemZone
              key={zone.id}
              zoneType={zone.id}
              position={zone.position}
              onClick={() => setActiveZone(zone.id)}
              hasAlert={displayedAlerts[zone.id]}
            />
          ))}
        </FactoryCanvas>

        <section
          aria-label="War room subsystem controls"
          className="pointer-events-none absolute inset-x-3 bottom-3 z-20 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          {ZONE_META.map((zone) => (
            <button
              key={zone.id}
              type="button"
              onClick={() => setActiveZone(zone.id)}
              className={cn(
                'pointer-events-auto min-w-0 rounded-2xl border p-4 text-left shadow-[0_18px_48px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 motion-reduce:transition-none motion-reduce:hover:translate-y-0',
                activeZone === zone.id ? 'bg-white/12' : 'bg-[rgba(17,29,46,0.78)]',
              )}
              style={{
                borderColor: activeZone === zone.id ? zone.colorVar : 'var(--sf-border-default)',
              }}
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="truncate text-sm font-semibold" style={{ color: 'var(--sf-text-primary)' }}>
                  {zone.label}
                </span>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase"
                  style={{
                    color: displayedAlerts[zone.id] ? zone.colorVar : 'var(--sf-status-green)',
                    backgroundColor: 'rgba(255,255,255,0.06)',
                  }}
                >
                  {displayedAlerts[zone.id] ? 'Alert' : 'Nominal'}
                </span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--sf-text-secondary)' }}>
                {zone.description}
              </p>
            </button>
          ))}
        </section>

        {overlayOpen && (
          <button
            type="button"
            className="absolute inset-0 z-30 cursor-default"
            onClick={closeOverlay}
            aria-label="Close overlay"
          />
        )}
      </main>

      {ActivePanel && <ActivePanel isOpen={overlayOpen} onClose={closeOverlay} />}
    </div>
  );
}
