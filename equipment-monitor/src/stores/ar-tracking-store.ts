import { create } from 'zustand';

export type RecipeState = 'idle' | 'running';
export type PersonnelState = 'patrolling' | 'observing' | 'operating' | 'avoiding' | 'idle';
export type EquipmentState = 'idle' | 'warmup' | 'running' | 'cooldown';
export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface Personnel {
  id: string;
  name: string;
  waypointIndex: number;
  position: [number, number];
  inZone: string | null;
  status: 'normal' | 'violation';
  state: PersonnelState;
  stateTimer: number;
}

export interface EquipmentInfo {
  id: string;
  name: string;
  bay: string;
  state: EquipmentState;
  stateTimer: number;
  temperature: number;
}

export interface RestrictedZone {
  id: string;
  name: string;
  center: [number, number];
  size: [number, number];
}

export interface DynamicZone extends RestrictedZone {
  anchoredTo: string;
}

export interface ArAlert {
  id: string;
  personnelId: string;
  zoneId: string;
  zoneName: string;
  timestamp: number;
  acknowledged: boolean;
  severity: AlertSeverity;
}

interface ArTrackingState {
  personnel: Personnel[];
  equipment: EquipmentInfo[];
  alerts: ArAlert[];

  pipTarget: string | null;
  openPip: (personnelId: string) => void;
  closePip: () => void;
  switchPipTarget: (personnelId: string) => void;

  recipeStates: Record<string, RecipeState>;
  setRecipeState: (zoneId: string, state: RecipeState) => void;

  focusPersonnelId: string | null;
  triggerAlert: (personnelId: string, zoneId: string) => void;
  acknowledgeAlert: (alertId: string) => void;
  updatePersonnelPosition: (id: string, x: number, z: number, waypointIndex?: number) => void;
  setPersonnelZoneStatus: (id: string, zoneId: string | null) => void;
  setPersonnelState: (id: string, state: PersonnelState) => void;
  tickPersonnelTimers: (deltaMs: number) => void;
  setEquipmentState: (id: string, state: EquipmentState) => void;
  tickEquipmentTimers: (deltaMs: number) => void;
  focusPersonnel: (id: string) => void;
  clearFocusPersonnel: () => void;
}

export const RESTRICTED_ZONES: RestrictedZone[] = [
  { id: 'HV-ZONE', name: 'High Voltage Area', center: [20, 12], size: [12, 8] },
  { id: 'CHEM-STORE', name: 'Chemical Storage', center: [-22, -8], size: [10, 12] },
];

export const DYNAMIC_ZONES: DynamicZone[] = [
  {
    id: 'IMPLANT-BEAM',
    name: 'Implant Beam Active',
    center: [-2, 5],
    size: [10, 6],
    anchoredTo: 'Implant',
  },
  {
    id: 'LITHO-EUV',
    name: 'EUV Exposure Active',
    center: [-18, 10],
    size: [11, 7],
    anchoredTo: 'Litho Bay',
  },
];

export const ALL_ZONES: RestrictedZone[] = [...RESTRICTED_ZONES, ...DYNAMIC_ZONES];

export const PATROL_ROUTES: Record<string, [number, number][]> = {
  'OP-01': [[-24, -14], [-8, -14], [4, -6], [17, 9], [24, 14], [4, 15], [-16, 8], [-24, -14]],
  'OP-02': [[22, -14], [10, -8], [-2, 1], [-21, -7], [-24, -13], [-4, -15], [18, -12], [22, -14]],
  'OP-03': [[-18, 15], [-4, 14], [5, 14], [16, 13], [24, 9], [14, 2], [-5, 4], [-18, 15]],
  'OP-04': [[-27, 1], [-15, 1], [-4, -4], [8, -4], [18, -2], [26, 4], [8, 7], [-14, 6], [-27, 1]],
};

export const INITIAL_PERSONNEL: Personnel[] = [
  { id: 'OP-01', name: 'Chen Wei', waypointIndex: 0, position: PATROL_ROUTES['OP-01'][0], inZone: null, status: 'normal', state: 'idle', stateTimer: 0 },
  { id: 'OP-02', name: 'Maya Patel', waypointIndex: 0, position: PATROL_ROUTES['OP-02'][0], inZone: null, status: 'normal', state: 'idle', stateTimer: 0 },
  { id: 'OP-03', name: 'Luis Ortega', waypointIndex: 0, position: PATROL_ROUTES['OP-03'][0], inZone: null, status: 'normal', state: 'idle', stateTimer: 0 },
  { id: 'OP-04', name: 'Aiko Tanaka', waypointIndex: 0, position: PATROL_ROUTES['OP-04'][0], inZone: null, status: 'normal', state: 'idle', stateTimer: 0 },
];

const EQUIPMENT_BAYS = [
  'Litho Bay',
  'Etch Bay',
  'Diffusion Bay',
  'Metrology',
  'CMP Bay',
  'Implant',
  'Stocker',
  'Photo Track',
] as const;

export const INITIAL_EQUIPMENT: EquipmentInfo[] = EQUIPMENT_BAYS.map((bay) => ({
  id: bay.toUpperCase().replaceAll(' ', '-'),
  name: bay,
  bay,
  state: 'idle',
  stateTimer: 0,
  temperature: 22,
}));

const initialRecipeStates = () => Object.fromEntries(
  DYNAMIC_ZONES.map((zone) => [zone.id, 'idle' as const]),
);

const zoneNameById = new Map(ALL_ZONES.map((zone) => [zone.id, zone.name]));

const severityForSeconds = (seconds: number): AlertSeverity => {
  if (seconds >= 15) return 'critical';
  if (seconds >= 5) return 'warning';
  return 'info';
};

export const useArTrackingStore = create<ArTrackingState>((set) => ({
  personnel: INITIAL_PERSONNEL,
  equipment: INITIAL_EQUIPMENT,
  alerts: [],
  pipTarget: null,
  focusPersonnelId: null,
  recipeStates: initialRecipeStates(),

  openPip: (personnelId) => set({ pipTarget: personnelId }),
  closePip: () => set({ pipTarget: null }),
  switchPipTarget: (personnelId) => set({ pipTarget: personnelId }),

  setRecipeState: (zoneId, state) => set((current) => ({
    recipeStates: { ...current.recipeStates, [zoneId]: state },
  })),

  triggerAlert: (personnelId, zoneId) => set((state) => {
    const alert: ArAlert = {
      id: `${personnelId}-${zoneId}-${Date.now()}`,
      personnelId,
      zoneId,
      zoneName: zoneNameById.get(zoneId) ?? zoneId,
      timestamp: Date.now(),
      acknowledged: false,
      severity: 'info',
    };

    return {
      alerts: [alert, ...state.alerts].slice(0, 20),
      pipTarget: state.pipTarget ?? personnelId,
    };
  }),

  acknowledgeAlert: (alertId) => set((state) => ({
    alerts: state.alerts.map((alert) => (
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    )),
  })),

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
        ? { ...person, inZone: zoneId, status: zoneId ? 'violation' : 'normal', stateTimer: 0 }
        : person
    )),
  })),

  setPersonnelState: (id, personnelState) => set((state) => ({
    personnel: state.personnel.map((person) => (
      person.id === id ? { ...person, state: personnelState, stateTimer: 0 } : person
    )),
  })),

  tickPersonnelTimers: (deltaMs) => set((state) => {
    const deltaSeconds = deltaMs / 1000;
    const personnel = state.personnel.map((person) => ({
      ...person,
      stateTimer: person.stateTimer + deltaSeconds,
    }));
    const personnelById = new Map(personnel.map((person) => [person.id, person]));

    return {
      personnel,
      alerts: state.alerts.map((alert) => {
        const person = personnelById.get(alert.personnelId);
        if (!person || person.inZone !== alert.zoneId) return alert;
        return { ...alert, severity: severityForSeconds(person.stateTimer) };
      }),
    };
  }),

  setEquipmentState: (id, equipmentState) => set((state) => ({
    equipment: state.equipment.map((item) => (
      item.id === id ? { ...item, state: equipmentState, stateTimer: 0 } : item
    )),
  })),

  tickEquipmentTimers: (deltaMs) => set((state) => ({
    equipment: state.equipment.map((item) => ({
      ...item,
      stateTimer: item.stateTimer + deltaMs / 1000,
    })),
  })),

  focusPersonnel: (id) => set({ focusPersonnelId: id }),
  clearFocusPersonnel: () => set({ focusPersonnelId: null }),
}));
