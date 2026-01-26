import { create } from "zustand";
import { Equipment, Alarm } from "@/types/equipment";
import { AuditEntry } from "@/types/audit";

interface EquipmentState {
  equipment: Equipment[];
  selectedEquipmentId: string | null;
  alarms: Alarm[];
  auditTrail: AuditEntry[];

  // Actions
  setEquipment: (equipment: Equipment[]) => void;
  selectEquipment: (id: string | null) => void;
  updateEquipmentStatus: (id: string, status: Equipment["status"]) => void;
  addAlarm: (alarm: Alarm) => void;
  acknowledgeAlarm: (id: string, userId?: string) => void;
  addAuditEntry: (entry: Omit<AuditEntry, 'id' | 'timestamp'>) => void;
  getAuditEntriesByAlarm: (alarmId: string) => AuditEntry[];
  getAuditEntriesByEquipment: (equipmentId: string) => AuditEntry[];
  getAuditEntriesByUser: (userId: string) => AuditEntry[];
}

export const useEquipmentStore = create<EquipmentState>((set, get) => ({
  equipment: [],
  selectedEquipmentId: null,
  alarms: [],
  auditTrail: [],

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

  acknowledgeAlarm: (id, userId = 'system') =>
    set((state) => {
      const alarm = state.alarms.find((a) => a.id === id);
      if (!alarm || alarm.acknowledged) {
        return state;
      }

      // Add audit entry
      const auditEntry: AuditEntry = {
        id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        action: 'ACKNOWLEDGE',
        alarmId: id,
        equipmentId: alarm.equipmentId,
        severity: alarm.severity,
        message: alarm.message,
        userId,
        timestamp: new Date(),
      };

      return {
        alarms: state.alarms.map((a) =>
          a.id === id ? { ...a, acknowledged: true } : a
        ),
        auditTrail: [auditEntry, ...state.auditTrail],
      };
    }),

  addAuditEntry: (entry) =>
    set((state) => {
      const auditEntry: AuditEntry = {
        ...entry,
        id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
      };
      return {
        auditTrail: [auditEntry, ...state.auditTrail],
      };
    }),

  getAuditEntriesByAlarm: (alarmId) => {
    const state = get();
    return state.auditTrail.filter((entry) => entry.alarmId === alarmId);
  },

  getAuditEntriesByEquipment: (equipmentId) => {
    const state = get();
    return state.auditTrail.filter((entry) => entry.equipmentId === equipmentId);
  },

  getAuditEntriesByUser: (userId) => {
    const state = get();
    return state.auditTrail.filter((entry) => entry.userId === userId);
  },
}));
