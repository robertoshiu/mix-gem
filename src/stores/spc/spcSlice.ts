import type {
  Lot, Recipe, SpcMeasurement, SpcViolation, SecsEvent, FaultConfig, Equipment,
} from '@/lib/mes-types';
import { MOCK_LOTS, MOCK_RECIPES } from '@/lib/mes-mock-data';

type SliceSetter<TState> = (fn: (state: TState) => Partial<TState>) => void;

// ── Initial State ──────────────────────────────────────────────────

export const INITIAL_SPC_STATE = {
  lots: MOCK_LOTS,
  recipes: MOCK_RECIPES,
  activeLotId: null as string | null,
  activeRecipeId: null as string | null,
  waferNumber: 1,
  equipmentState: 'idle' as 'idle' | 'processing' | 'inhibited',
  activeFault: null as FaultConfig | null,
  measurements: [] as SpcMeasurement[],
  violations: [] as SpcViolation[],
  events: [] as SecsEvent[],
  equipments: [] as Equipment[],
  selectedEquipmentId: null as string | null,
};

// ── Type Definitions ───────────────────────────────────────────────

export interface SpcSliceState {
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
  equipments: Equipment[];
  selectedEquipmentId: string | null;
}

export interface SpcSliceActions {
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
  setSelectedEquipment: (id: string | null) => void;
}

export type SpcSlice = SpcSliceState & SpcSliceActions;

// ── Slice Creator ──────────────────────────────────────────────────

export const createSpcSlice = (
  set: SliceSetter<SpcSliceState>,
): SpcSlice => ({
  ...INITIAL_SPC_STATE,

  updateLot: (lotId, patch) =>
    set((s: SpcSliceState) => ({
      lots: s.lots.map((l) => (l.id === lotId ? { ...l, ...patch } : l)),
    })),

  startProcessing: (lotId, recipeId) =>
    set(() => ({
      activeLotId: lotId,
      activeRecipeId: recipeId,
      equipmentState: 'processing' as const,
      waferNumber: 1,
    })),

  stopProcessing: () => set(() => ({ equipmentState: 'idle' as const })),

  addMeasurement: (m) =>
    set((s: SpcSliceState) => ({ measurements: [...s.measurements, m] })),

  addViolation: (v) =>
    set((s: SpcSliceState) => ({
      violations: [...s.violations, v],
      equipmentState: 'inhibited' as const,
    })),

  acknowledgeViolation: (violationId) =>
    set((s: SpcSliceState) => ({
      violations: s.violations.map((v) =>
        v.id === violationId ? { ...v, acknowledged: true } : v,
      ),
      equipmentState: 'processing' as const,
    })),

  resumeEquipment: () =>
    set(() => ({ equipmentState: 'processing' as const, activeFault: null })),

  addEvent: (e) =>
    set((s: SpcSliceState) => ({
      events: [e, ...s.events].slice(0, 300),
    })),

  injectFault: (fault) => set(() => ({ activeFault: fault })),

  clearFault: () => set(() => ({ activeFault: null })),

  incrementWafer: () =>
    set((s: SpcSliceState) => ({ waferNumber: s.waferNumber + 1 })),

  setSelectedEquipment: (id) => set(() => ({ selectedEquipmentId: id })),
});
