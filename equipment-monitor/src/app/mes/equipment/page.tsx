'use client';

import dynamic from 'next/dynamic';
import { useSyncExternalStore } from 'react';
import { useMesSpcStore } from '@/stores/mes-spc-store';
import { FabFloorMap } from '@/components/equipment/FabFloorMap';
import { ProcessFlow } from '@/components/spc/ProcessFlow';
import { useWebGLSupport } from '@/hooks/use-webgl-support';
import { EquipmentDrawer } from '@/components/equipment/EquipmentDrawer';

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
        <div className="relative flex flex-col flex-1 gap-4 min-w-0">
          <ProcessFlow />
          <div className="flex-1 min-h-0">
            {isClientHydrated && webglSupported ? <FabFloorMap3D /> : <FabFloorMap />}
          </div>
          <EquipmentDrawer
            equipmentId={selectedEquipmentId}
            equipment={selectedEquipment ?? null}
            onClose={() => useMesSpcStore.getState().setSelectedEquipment(null)}
          />
        </div>
      </div>
    </div>
  );
}
