import { create } from 'zustand';
import type { SubsystemZoneType, WarRoomState } from '@/lib/war-room-types';
import { generateMockWarRoomState } from '@/lib/war-room-mock-data';

interface WarRoomActions {
  setActiveZone: (zone: SubsystemZoneType) => void;
  closeOverlay: () => void;
  refreshData: () => void;
}

export const useWarRoomStore = create<WarRoomState & WarRoomActions>((set) => ({
  activeZone: null,
  overlayOpen: false,
  subsystemData: generateMockWarRoomState().subsystemData,
  lastUpdated: new Date(),

  setActiveZone: (zone) =>
    set({ activeZone: zone, overlayOpen: true }),

  closeOverlay: () =>
    set({ activeZone: null, overlayOpen: false }),

  refreshData: () =>
    set({
      subsystemData: generateMockWarRoomState().subsystemData,
      lastUpdated: new Date(),
    }),
}));
