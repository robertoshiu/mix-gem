'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { WarRoomPickedAsset } from '@/components/babylon/WarRoomBabylonScene';
import { AssetMetadataPopup } from '@/components/war-room-hud/AssetMetadataPopup';
import { FaultBanner } from '@/components/war-room-hud/FaultBanner';
import { ModeSelector } from '@/components/war-room-hud/ModeSelector';
import { SubsystemDetailOverlay } from '@/components/war-room-hud/SubsystemDetailOverlay';
import { TopBar } from '@/components/war-room-hud/TopBar';
import { ViewpointSelector } from '@/components/war-room-hud/ViewpointSelector';
import type { FabTwinFaultId, FabTwinMode, FabTwinView, Subsystem } from '@/lib/fab-twin-data';
import { SUBSYSTEM_EQUIPMENT } from '@/lib/fab-twin-data';
import { HvacPanel } from '@/components/war-room/HvacPanel';
import { GasChemicalPanel } from '@/components/war-room/GasChemicalPanel';
import { PowerUpsPanel } from '@/components/war-room/PowerUpsPanel';
import { useFacilitySimStore } from '@/stores/facility-sim-store';
import type { FacilityScenarioId } from '@/lib/engines/facility-types';

const WarRoomBabylonScene = dynamic(
  () => import('@/components/babylon/WarRoomBabylonScene').then((mod) => ({ default: mod.WarRoomBabylonScene })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[calc(100dvh-104px)] items-center justify-center bg-[var(--sf-bg-canvas)]">
        <div className="rounded-2xl border border-[rgba(34,211,238,0.28)] bg-[rgba(8,18,31,0.88)] px-6 py-5 text-center shadow-2xl backdrop-blur-xl">
          <p className="animate-pulse font-mono text-sm text-[var(--sf-text-secondary)] motion-reduce:animate-none">Initializing Babylon.js war room HUD...</p>
        </div>
      </div>
    ),
  },
);

export default function WarRoomPage() {
  const [view, setView] = useState<FabTwinView>('overview');
  const [mode, setMode] = useState<FabTwinMode>('normal');
  const [faultId, setFaultId] = useState<FabTwinFaultId>('nominal');
  const [activeSubsystem, setActiveSubsystem] = useState<Subsystem | null>(null);
  const [pickedAsset, setPickedAsset] = useState<WarRoomPickedAsset | null>(null);
  const [pickScreenPos, setPickScreenPos] = useState<{ x: number; y: number } | null>(null);
  const [viewSelectorExpanded, setViewSelectorExpanded] = useState(true);
  const [faultBannerDismissed, setFaultBannerDismissed] = useState(false);
  const [focusAssetId, setFocusAssetId] = useState<string | null>(null);
  const [openPanel, setOpenPanel] = useState<'hvac' | 'gas' | 'power' | null>(null);

  // Facility simulation tick loop (1 Hz)
  const tick = useFacilitySimStore((s) => s.tick_);
  const setFacilityScenario = useFacilitySimStore((s) => s.setScenario);
  const facilityScenario = useFacilitySimStore((s) => s.scenario);

  const selectedEquipment = useMemo(
    () => SUBSYSTEM_EQUIPMENT.find((item) => item.id === focusAssetId) ?? null,
    [focusAssetId],
  );

  // Start 1 Hz tick loop
  useEffect(() => {
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [tick]);

  const handleSubsystemToggle = useCallback((subsystem: Subsystem) => {
    const panelMap: Record<Subsystem, 'hvac' | 'gas' | 'power' | null> = {
      bas: 'hvac', gas: 'gas', power: 'power', fire: null,
    };
    setOpenPanel((prev) => (prev === panelMap[subsystem] ? null : panelMap[subsystem]));
    setActiveSubsystem((current) => (current === subsystem ? null : subsystem));
    setPickedAsset(null);
    setPickScreenPos(null);
  }, []);

  const handleFaultChange = useCallback((nextFaultId: FabTwinFaultId) => {
    setFaultId(nextFaultId);
    setFaultBannerDismissed(false);
    if (nextFaultId !== 'nominal') setMode('alarm');
  }, []);

  const handleFacilityScenarioChange = useCallback((id: FacilityScenarioId) => {
    setFacilityScenario(id);
  }, [setFacilityScenario]);

  const handleAssetPick = useCallback((asset: WarRoomPickedAsset, screenPos: { x: number; y: number }) => {
    setPickedAsset(asset);
    setPickScreenPos(screenPos);
  }, []);

  const handleFacilityPanelOpen = useCallback((panel: 'hvac' | 'gas' | 'power') => {
    setOpenPanel(panel);
  }, []);

  const handleFlyToAsset = useCallback((assetId: string) => {
    const equipment = SUBSYSTEM_EQUIPMENT.find((item) => item.id === assetId);
    if (!equipment) return;
    setFocusAssetId(assetId);
    setPickedAsset({ id: equipment.id, path: equipment.path, type: equipment.type, metadata: equipment });
    setPickScreenPos({ x: window.innerWidth * 0.62, y: window.innerHeight * 0.34 });
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (pickedAsset) {
        setPickedAsset(null);
        setPickScreenPos(null);
        return;
      }
      if (activeSubsystem) setActiveSubsystem(null);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeSubsystem, pickedAsset]);

  useEffect(() => {
    if (!selectedEquipment) return;
    const timer = window.setTimeout(() => setFocusAssetId(null), 600);
    return () => window.clearTimeout(timer);
  }, [selectedEquipment]);

  return (
    <div className="relative min-h-[calc(100dvh-104px)] overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_32%),var(--sf-bg-canvas)] text-[var(--sf-text-primary)]">
      <TopBar
        faultId={faultId}
        activeSubsystem={activeSubsystem}
        onFaultChange={handleFaultChange}
        onSubsystemToggle={handleSubsystemToggle}
        facilityScenario={facilityScenario}
        onFacilityScenarioChange={handleFacilityScenarioChange}
      />

      <main className="relative min-h-[calc(100dvh-104px)] overflow-hidden pt-[148px] xl:pt-[72px]">
        <WarRoomBabylonScene
          view={view}
          mode={mode}
          faultId={faultId}
          activeSubsystem={activeSubsystem}
          focusAssetId={focusAssetId}
          onAssetPick={handleAssetPick}
          onFacilityPanelOpen={handleFacilityPanelOpen}
        />

        <div className="pointer-events-none fixed left-4 top-[273px] z-30 xl:top-[193px]">
          <ViewpointSelector view={view} expanded={viewSelectorExpanded} onViewChange={setView} onExpandedChange={setViewSelectorExpanded} />
        </div>

        <div className="pointer-events-none fixed bottom-4 left-4 z-30">
          <ModeSelector mode={mode} onModeChange={setMode} />
        </div>

        <div className="pointer-events-none fixed inset-x-4 bottom-4 z-30 flex flex-col items-center gap-3">
          <FaultBanner faultId={faultId} dismissed={faultBannerDismissed} onDismiss={() => setFaultBannerDismissed(true)} />
          <SubsystemDetailOverlay activeSubsystem={activeSubsystem} onClose={() => setActiveSubsystem(null)} onFlyToAsset={handleFlyToAsset} />
        </div>

        {pickedAsset && (
          <button
            type="button"
            aria-label="Dismiss picked asset metadata"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => {
              setPickedAsset(null);
              setPickScreenPos(null);
            }}
          />
        )}

        <AssetMetadataPopup
          asset={pickedAsset}
          screenPos={pickScreenPos}
          onClose={() => {
            setPickedAsset(null);
            setPickScreenPos(null);
          }}
        />

        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {activeSubsystem ? `${activeSubsystem} subsystem layer isolated` : 'War room all layers visible'}
        </div>
      </main>

      <HvacPanel isOpen={openPanel === 'hvac'} onClose={() => setOpenPanel(null)} />
      <GasChemicalPanel isOpen={openPanel === 'gas'} onClose={() => setOpenPanel(null)} />
      <PowerUpsPanel isOpen={openPanel === 'power'} onClose={() => setOpenPanel(null)} />
    </div>
  );
}
