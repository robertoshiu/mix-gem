import { create } from 'zustand';
import type {
  Lot, Recipe, SpcMeasurement, SpcViolation, SecsEvent, FaultConfig,
} from '@/lib/mes-types';
import { MOCK_LOTS, MOCK_RECIPES } from '@/lib/mes-mock-data';

interface MesSpcState {
  lots: Lot[];
  recipes: Recipe[];
  activeLotId: string | null;
  activeRecipeId: string | null;
  waferNumber: number;
  equipmentState: 'idle' | 'processing' | 'inhibited';
  activeFault: FaultConfig | null;
  measurements: SpcMeasurement[];
  violations: SpcViolation[];
  events: SecsEvent[];

  updateLot: (lotId: string, patch: Partial<Lot>) => void;
  startProcessing: (lotId: string, recipeId: string) => void;
  stopProcessing: () => void;
  addMeasurement: (m: SpcMeasurement) => void;
  addViolation: (v: SpcViolation) => void;
  acknowledgeViolation: (violationId: string) => void;
  resumeEquipment: () => void;
  addEvent: (e: SecsEvent) => void;
  injectFault: (fault: FaultConfig) => void;
  clearFault: () => void;
  incrementWafer: () => void;
}

export const INITIAL_MES_SPC_STATE: Omit<MesSpcState,
  | 'updateLot' | 'startProcessing' | 'stopProcessing'
  | 'addMeasurement' | 'addViolation' | 'acknowledgeViolation'
  | 'resumeEquipment' | 'addEvent' | 'injectFault' | 'clearFault'
  | 'incrementWafer'
> = {
  lots: MOCK_LOTS,
  recipes: MOCK_RECIPES,
  activeLotId: null,
  activeRecipeId: null,
  waferNumber: 1,
  equipmentState: 'idle',
  activeFault: null,
  measurements: [],
  violations: [],
  events: [],
};

export const useMesSpcStore = create<MesSpcState>((set, get) => ({
  ...INITIAL_MES_SPC_STATE,

  updateLot: (lotId, patch) =>
    set((s) => ({ lots: s.lots.map((l) => l.id === lotId ? { ...l, ...patch } : l) })),

  startProcessing: (lotId, recipeId) =>
    set({ activeLotId: lotId, activeRecipeId: recipeId, equipmentState: 'processing', waferNumber: 1 }),

  stopProcessing: () =>
    set({ equipmentState: 'idle' }),

  addMeasurement: (m) =>
    set((s) => ({ measurements: [...s.measurements, m] })),

  addViolation: (v) =>
    set((s) => ({
      violations: [...s.violations, v],
      equipmentState: 'inhibited' as const,
    })),

  acknowledgeViolation: (violationId) =>
    set((s) => ({
      violations: s.violations.map((v) =>
        v.id === violationId ? { ...v, acknowledged: true } : v
      ),
      equipmentState: 'processing' as const,
    })),

  resumeEquipment: () =>
    set({ equipmentState: 'processing', activeFault: null }),

  addEvent: (e) =>
    set((s) => ({
      events: [e, ...s.events].slice(0, 100),
    })),

  injectFault: (fault) =>
    set({ activeFault: fault }),

  clearFault: () =>
    set({ activeFault: null }),

  incrementWafer: () =>
    set((s) => ({ waferNumber: s.waferNumber + 1 })),
}));
