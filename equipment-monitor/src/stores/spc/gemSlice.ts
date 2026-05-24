// ── GEM Slice ───────────────────────────────────────────────────────
// GEM state machine integration: tracks gemState and stateHistory.
// Driven by GemStateMachine in SimulatorEngine.

import type { GemState } from '@/lib/mes-types';
import type { StateTransition } from '@/lib/gem-state-machine';

type SliceSetter<TState> = (fn: (state: TState) => Partial<TState>) => void;

// ── Initial State ──────────────────────────────────────────────────

export const INITIAL_GEM_STATE = {
  gemState: 'INIT' as GemState,
  stateHistory: [] as StateTransition[],
};

// ── Type Definitions ───────────────────────────────────────────────

export interface GemSliceState {
  gemState: GemState;
  stateHistory: StateTransition[];
}

export interface GemSliceActions {
  setGemState: (state: GemState) => void;
  addStateTransition: (transition: StateTransition) => void;
}

export type GemSlice = GemSliceState & GemSliceActions;

// ── Slice Creator ──────────────────────────────────────────────────

export const createGemSlice = (
  set: SliceSetter<GemSliceState>,
): GemSlice => ({
  ...INITIAL_GEM_STATE,

  setGemState: (gemState: GemState) =>
    set(() => ({ gemState })),

  addStateTransition: (transition: StateTransition) =>
    set((s: GemSliceState) => ({
      stateHistory: [...s.stateHistory, transition],
    })),
});
