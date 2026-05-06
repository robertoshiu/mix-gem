'use client';

import { useEffect, useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWarRoomStore } from '@/stores/war-room-store';
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

const ZONES = ['power', 'building-auto', 'gas', 'fire'] as const;

const ZONE_POSITIONS: Record<string, [number, number, number]> = {
  power: [-7, 0.05, -7],
  'building-auto': [7, 0.05, -7],
  gas: [-7, 0.05, 7],
  fire: [7, 0.05, 7],
};

const ZONE_LABELS: Record<string, string> = {
  power: 'POWER',
  'building-auto': 'AUTO',
  gas: 'GAS',
  fire: 'FIRE',
};

const PANEL_MAP = {
  power: PowerMonitoringPanel,
  'building-auto': BuildingAutoPanel,
  gas: GasDetectionPanel,
  fire: FireAlarmPanel,
} as const;

/** Resolve a CSS custom property to a colour string at mount time. */
function useCssZoneColour(zoneType: string, fallback: string): string {
  const [value, setValue] = useState(fallback);
  useEffect(() => {
    const varName =
      zoneType === 'power'
        ? '--sf-power-primary'
        : zoneType === 'building-auto'
          ? '--sf-ba-primary'
          : zoneType === 'gas'
            ? '--sf-gas-primary'
            : '--sf-fire-primary';
    const resolved = getComputedStyle(document.documentElement)
      .getPropertyValue(varName)
      .trim();
    setValue(resolved || fallback);
  }, [zoneType, fallback]);
  return value;
}

const ZONE_FALLBACKS: Record<string, string> = {
  power: '#3b82f6',
  'building-auto': '#10b981',
  gas: '#f59e0b',
  fire: '#ef4444',
};

export default function WarRoomPage() {
  const activeZone = useWarRoomStore((s) => s.activeZone);
  const overlayOpen = useWarRoomStore((s) => s.overlayOpen);
  const subsystemData = useWarRoomStore((s) => s.subsystemData);
  const setActiveZone = useWarRoomStore((s) => s.setActiveZone);
  const closeOverlay = useWarRoomStore((s) => s.closeOverlay);
  const refreshData = useWarRoomStore((s) => s.refreshData);

  // Pre-resolve zone colours from CSS variables (one-time at mount)
  const zoneColours = Object.fromEntries(
    ZONES.map((zone) => [
      zone,
      useCssZoneColour(zone, ZONE_FALLBACKS[zone]),
    ]),
  ) as Record<string, string>;

  // Refresh mock data every 5 seconds
  useEffect(() => {
    refreshData();
    const id = setInterval(refreshData, 5000);
    return () => clearInterval(id);
  }, [refreshData]);

  // Escape key closes overlay
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

  const hasAlerts: Record<string, boolean> = {
    power: subsystemData.power.alarms.length > 0,
    'building-auto': subsystemData['building-auto'].alarms.length > 0,
    gas: subsystemData.gas.alarms.length > 0,
    fire: subsystemData.fire.alarms.length > 0,
  };

  const ActivePanel = activeZone ? PANEL_MAP[activeZone] : null;

  return (
    <div
      className="relative flex flex-col h-full overflow-hidden"
      style={{ backgroundColor: 'var(--sf-bg-canvas, #0B0F19)' }}
    >
      {/* Top Bar */}
      <div
        className="flex items-center justify-between px-6 py-3 shrink-0 z-30"
        style={{
          backgroundColor: 'rgba(11, 15, 25, 0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(59, 130, 246, 0.15)',
        }}
      >
        <h1
          className="text-lg font-semibold tracking-wide"
          style={{ color: 'var(--sf-text-primary, #e2e8f0)' }}
        >
          WAR ROOM
        </h1>

        <div className="flex items-center gap-5">
          {ZONES.map((zone) => {
            const alert = hasAlerts[zone];
            const zoneColor = zoneColours[zone];
            return (
              <div key={zone} className="flex items-center gap-1.5">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full"
                  style={{
                    backgroundColor: alert
                      ? zoneColor
                      : 'var(--sf-text-muted, #475569)',
                    boxShadow: alert ? `0 0 8px ${zoneColor}` : 'none',
                    animation: alert ? 'pulse 2s infinite' : 'none',
                  }}
                />
                <span
                  className="text-[10px] uppercase tracking-widest font-medium"
                  style={{ color: 'var(--sf-text-muted, #475569)' }}
                >
                  {ZONE_LABELS[zone]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="flex-1 relative">
        <FactoryCanvas className="w-full h-full">
          <FactoryScene />
          {ZONES.map((zone) => (
            <SubsystemZone
              key={zone}
              zoneType={zone}
              position={ZONE_POSITIONS[zone]}
              onClick={() => setActiveZone(zone)}
              hasAlert={hasAlerts[zone]}
            />
          ))}
        </FactoryCanvas>

        {/* Click-outside backdrop to close overlay */}
        {overlayOpen && (
          <div
            className="absolute inset-0 z-30 cursor-default"
            onClick={closeOverlay}
            aria-label="Close overlay"
            role="button"
            tabIndex={-1}
          />
        )}
      </div>

      {/* Overlay Panel */}
      {ActivePanel && (
        <ActivePanel isOpen={overlayOpen} onClose={closeOverlay} />
      )}
    </div>
  );
}
