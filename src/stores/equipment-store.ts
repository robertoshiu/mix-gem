import { create } from "zustand";
import { Equipment, Alarm } from "@/types/equipment";

interface EquipmentState {
  equipment: Equipment[];
  selectedEquipmentId: string | null;
  alarms: Alarm[];

  // Actions
  setEquipment: (equipment: Equipment[]) => void;
  selectEquipment: (id: string | null) => void;
  updateEquipmentStatus: (id: string, status: Equipment["status"]) => void;
  addAlarm: (alarm: Alarm) => void;
  acknowledgeAlarm: (id: string) => void;
}

export const useEquipmentStore = create<EquipmentState>((set) => ({
  equipment: [],
  selectedEquipmentId: null,
  alarms: [],

  setEquipment: (equipment) => set({ equipment }),

  selectEquipment: (id) => set({ selectedEquipmentId: id }),

  updateEquipmentStatus: (id, status) =>
    set((state) => ({
      equipment: state.equipment.map((eq) =>
        eq.id === id ? { ...eq, status } : eq
      ),
    })),

  addAlarm: (alarm) =>
    set((state) => ({
      alarms: [alarm, ...state.alarms],
    })),

  acknowledgeAlarm: (id) =>
    set((state) => ({
      alarms: state.alarms.map((a) =>
        a.id === id ? { ...a, acknowledged: true } : a
      ),
    })),
}));
