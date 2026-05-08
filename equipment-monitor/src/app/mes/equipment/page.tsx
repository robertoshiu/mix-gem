'use client';

import dynamic from 'next/dynamic';
import { useSyncExternalStore } from 'react';
import { useMesSpcStore } from '@/stores/mes-spc-store';
import { FabFloorMap } from '@/components/equipment/FabFloorMap';
import { ProcessFlow } from '@/components/spc/ProcessFlow';
import { useWebGLSupport } from '@/hooks/use-webgl-support';
import { cn } from '@/lib/utils';

const FabFloorMap3D = dynamic(
  () =>
    import('@/components/equipment/FabFloorMap3D').then((mod) => ({
      default: mod.FabFloorMap3D,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-sm text-[var(--smartfactory-text-muted)]">
        Loading 3D view…
      </div>
    ),
  },
);

const STATUS_BADGE: Record<string, string> = {
  running: 'bg-green-950/80 border border-[var(--smartfactory-status-green)] text-green-300',
  idle: 'bg-amber-950/80 border border-[var(--smartfactory-status-amber)] text-amber-300',
  down: 'bg-red-950/80 border border-[var(--smartfactory-status-red)] text-red-300',
};

const subscribeToClientHydration = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

function useClientHydrated() {
  return useSyncExternalStore(
    subscribeToClientHydration,
    getClientSnapshot,
    getServerSnapshot,
  );
}

export default function EquipmentPage() {
  const { selectedEquipmentId, equipments } = useMesSpcStore();
  const { supported: webglSupported } = useWebGLSupport();
  const isClientHydrated = useClientHydrated();
  const selectedEquipment = equipments.find((e) => e.id === selectedEquipmentId);

  return (
    <div data-testid="equipment-page" className="flex flex-col h-full">
      {/* Breadcrumb + title */}
      <div className="px-4 pt-4 pb-0">
        <div className="text-xs text-[var(--smartfactory-text-muted)]">MES / Equipment</div>
        <h2 className="text-lg font-semibold text-[var(--smartfactory-text-primary)]">
          Equipment Monitor
        </h2>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 p-4 gap-4 min-h-0">
        {/* Left: ProcessFlow + map */}
        <div className="flex flex-col flex-1 gap-4 min-w-0">
          <ProcessFlow />
          <div className="flex-1 min-h-0">
            {isClientHydrated && webglSupported ? <FabFloorMap3D /> : <FabFloorMap />}
          </div>
        </div>

        {/* Right: equipment detail panel */}
        <div
          data-testid="equipment-detail-panel"
          className={cn(
            'w-72 shrink-0 rounded-lg border border-[var(--smartfactory-border-default)] bg-[var(--smartfactory-surface-card)] p-4 transition-all duration-200 overflow-y-auto',
            selectedEquipmentId
              ? 'opacity-100 visible'
              : 'opacity-0 invisible w-0 p-0 border-0 overflow-hidden'
          )}
        >
          {selectedEquipment ? (
            <div className="space-y-4">
              {/* Header */}
              <div>
                <div
                  data-testid="equipment-detail-name"
                  className="text-base font-semibold text-[var(--smartfactory-text-primary)]"
                >
                  {selectedEquipment.name}
                </div>
                <div className="text-xs text-[var(--smartfactory-text-muted)]">
                  {selectedEquipment.id}
                </div>
              </div>

              {/* Status badge */}
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'inline-flex items-center text-xs px-2 py-0.5 rounded border font-medium',
                    STATUS_BADGE[selectedEquipment.status] ?? STATUS_BADGE.idle
                  )}
                >
                  {selectedEquipment.status.toUpperCase()}
                </span>
              </div>

              {/* Equipment info grid */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--smartfactory-text-secondary)]">Type</span>
                  <span className="text-[var(--smartfactory-text-primary)] capitalize">
                    {selectedEquipment.type}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--smartfactory-text-secondary)]">Zone</span>
                  <span className="text-[var(--smartfactory-text-primary)]">
                    {selectedEquipment.zone}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--smartfactory-text-secondary)]">Recipe</span>
                  <span className="text-[var(--smartfactory-text-primary)] font-['Fira_Code',monospace] text-xs">
                    {selectedEquipment.recipe}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--smartfactory-text-secondary)]">Wafers</span>
                  <span className="text-[var(--smartfactory-text-primary)] font-['Fira_Code',monospace] text-xs">
                    {selectedEquipment.currentWafer} / {selectedEquipment.totalWafers}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--smartfactory-text-secondary)]">Power</span>
                  <span className="text-[var(--smartfactory-text-primary)]">
                    {selectedEquipment.powerKw} kW
                  </span>
                </div>
              </div>

              {/* Wafer progress bar */}
              {selectedEquipment.totalWafers > 0 && (
                <div>
                  <div className="flex justify-between text-xs text-[var(--smartfactory-text-secondary)] mb-1">
                    <span>Wafer Progress</span>
                    <span>
                      {Math.round(
                        (selectedEquipment.currentWafer / selectedEquipment.totalWafers) * 100
                      )}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded h-1.5">
                    <div
                      className="bg-emerald-500 rounded h-1.5 transition-all"
                      style={{
                        width: `${Math.min(
                          (selectedEquipment.currentWafer / selectedEquipment.totalWafers) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-[var(--smartfactory-text-muted)]">
              Select equipment on the map
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
