// equipment-monitor/src/lib/lens-sim/simulation-engine.ts
import type { PresetId, SimulationParams, SimulationState, WaferState } from './types';
import { DEFAULT_PARAMS, EXPOSURE_TIME_PER_WAFER, LOT_SIZE } from './constants';
import { computeWaferMetrics } from './wafer-metrics';
import { getPreset } from './presets';

/**
 * Create a fresh simulation state.
 */
export function createSimulation(params: SimulationParams = DEFAULT_PARAMS): SimulationState {
  return {
    params: { ...params },
    wafers: [],
    currentIndex: -1,
    lotSize: LOT_SIZE,
  };
}

/**
 * Advance the simulation by one wafer.
 * Returns a new state (immutable update).
 */
export function stepWafer(state: SimulationState): SimulationState {
  const nextIndex = state.currentIndex + 1;
  if (nextIndex >= state.lotSize) return state;

  const elapsedTime = (nextIndex + 1) * EXPOSURE_TIME_PER_WAFER;
  const metrics = computeWaferMetrics(state.params, elapsedTime);

  const waferState: WaferState = {
    waferIndex: nextIndex,
    elapsedTime,
    ...metrics,
  };

  return {
    ...state,
    wafers: [...state.wafers, waferState],
    currentIndex: nextIndex,
  };
}

/**
 * Apply a what-if preset to the current simulation state.
 */
export function applyPreset(state: SimulationState, presetId: PresetId): SimulationState {
  const preset = getPreset(presetId);
  if (!preset) return state;

  if (presetId === 'cold-start') {
    return createSimulation(preset.apply(state.params, 0));
  }

  return {
    ...state,
    params: preset.apply(state.params, state.currentIndex),
  };
}
