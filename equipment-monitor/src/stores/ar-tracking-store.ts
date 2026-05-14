import { create } from 'zustand';

export interface Personnel {
  id: string;
  name: string;
  waypointIndex: number;
  position: [number, number];
  inZone: string | null;
  status: 'normal' | 'violation';
}

export interface RestrictedZone {
  id: string;
  name: string;
  center: [number, number];
  size: [number, number];
}

export interface ArAlert {
  id: string;
  personnelId: string;
  zoneId: string;
  zoneName: string;
  timestamp: number;
  acknowledged: boolean;
}

export type ActiveView = 'overview' | { type: 'ar'; personnelId: string };

interface ArTrackingState {
  personnel: Personnel[];
  alerts: ArAlert[];
  activeView: ActiveView;
  focusPersonnelId: string | null;
  triggerAlert: (personnelId: string, zoneId: string) => void;
  acknowledgeAlert: (alertId: string) => void;
  switchToArView: (personnelId: string) => void;
  switchToOverview: () => void;
  updatePersonnelPosition: (id: string, x: number, z: number, waypointIndex?: number) => void;
  setPersonnelZoneStatus: (id: string, zoneId: string | null) => void;
  focusPersonnel: (id: string) => void;
  clearFocusPersonnel: () => void;
}

export const RESTRICTED_ZONES: RestrictedZone[] = [
  { id: 'HV-ZONE', name: 'High Voltage Area', center: [20, 12], size: [12, 8] },
  { id: 'CHEM-STORE', name: 'Chemical Storage', center: [-22, -8], size: [10, 12] },
  { id: 'MAINT-BAY', name: 'Maintenance Bay', center: [2, 13], size: [13, 8] },
];

export const PATROL_ROUTES: Record<string, [number, number][]> = {
  'OP-01': [[-24, -14], [-8, -14], [4, -6], [17, 9], [24, 14], [4, 15], [-16, 8], [-24, -14]],
  'OP-02': [[22, -14], [10, -8], [-2, 1], [-21, -7], [-24, -13], [-4, -15], [18, -12], [22, -14]],
  'OP-03': [[-18, 15], [-4, 14], [5, 14], [16, 13], [24, 9], [14, 2], [-5, 4], [-18, 15]],
  'OP-04': [[-27, 1], [-15, 1], [-4, -4], [8, -4], [18, -2], [26, 4], [8, 7], [-14, 6], [-27, 1]],
};

export const INITIAL_PERSONNEL: Personnel[] = [
  { id: 'OP-01', name: 'Chen Wei', waypointIndex: 0, position: PATROL_ROUTES['OP-01'][0], inZone: null, status: 'normal' },
  { id: 'OP-02', name: 'Maya Patel', waypointIndex: 0, position: PATROL_ROUTES['OP-02'][0], inZone: null, status: 'normal' },
  { id: 'OP-03', name: 'Luis Ortega', waypointIndex: 0, position: PATROL_ROUTES['OP-03'][0], inZone: null, status: 'normal' },
  { id: 'OP-04', name: 'Aiko Tanaka', waypointIndex: 0, position: PATROL_ROUTES['OP-04'][0], inZone: null, status: 'normal' },
];

const zoneNameById = new Map(RESTRICTED_ZONES.map((zone) => [zone.id, zone.name]));

export const useArTrackingStore = create<ArTrackingState>((set) => ({
  personnel: INITIAL_PERSONNEL,
  alerts: [],
  activeView: 'overview',
  focusPersonnelId: null,

  triggerAlert: (personnelId, zoneId) => set((state) => {
    const alert: ArAlert = {
      id: `${personnelId}-${zoneId}-${Date.now()}`,
      personnelId,
      zoneId,
      zoneName: zoneNameById.get(zoneId) ?? zoneId,
      timestamp: Date.now(),
      acknowledged: false,
    };
    return { alerts: [alert, ...state.alerts].slice(0, 20) };
  }),

  acknowledgeAlert: (alertId) => set((state) => ({
    alerts: state.alerts.map((alert) => (
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    )),
  })),

  switchToArView: (personnelId) => set({ activeView: { type: 'ar', personnelId } }),
  switchToOverview: () => set({ activeView: 'overview' }),

  updatePersonnelPosition: (id, x, z, waypointIndex) => set((state) => ({
    personnel: state.personnel.map((person) => (
      person.id === id
        ? { ...person, position: [x, z], waypointIndex: waypointIndex ?? person.waypointIndex }
        : person
    )),
  })),

  setPersonnelZoneStatus: (id, zoneId) => set((state) => ({
    personnel: state.personnel.map((person) => (
      person.id === id
        ? { ...person, inZone: zoneId, status: zoneId ? 'violation' : 'normal' }
        : person
    )),
  })),

  focusPersonnel: (id) => set({ focusPersonnelId: id }),
  clearFocusPersonnel: () => set({ focusPersonnelId: null }),
}));
