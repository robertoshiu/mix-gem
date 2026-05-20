import type { SimulationParams } from './types';
import {
  ELECTROLYTE_CONDUCTIVITY,
  EXCHANGE_CURRENT_DENSITY,
  CHARACTERISTIC_LENGTH,
  TERMINAL_EFFECT_STRENGTH,
  DIE_GRID_COLS,
  DIE_GRID_ROWS,
  DIE_MASK,
} from './constants';

export function computeWagnerNumber(): number {
  return ELECTROLYTE_CONDUCTIVITY / (EXCHANGE_CURRENT_DENSITY * CHARACTERISTIC_LENGTH);
}

export function computeRadialCurrentDensity(
  params: SimulationParams,
  normalizedRadius: number,
): number {
  const seedFactor = 50 / Math.max(params.seedThickness, 1);
  const terminalBoost = 1 + TERMINAL_EFFECT_STRENGTH * seedFactor * normalizedRadius * normalizedRadius;
  return params.appliedCurrent * terminalBoost;
}

export function computeCurrentDensityMap(params: SimulationParams): number[] {
  const cols = DIE_GRID_COLS;
  const rows = DIE_GRID_ROWS;
  const cx = (cols - 1) / 2;
  const cy = (rows - 1) / 2;
  const maxR = Math.hypot(cx, cy);

  const map = new Array<number>(cols * rows);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      if (!DIE_MASK[idx]) {
        map[idx] = 0;
        continue;
      }
      const normR = Math.hypot(r - cy, c - cx) / maxR;
      map[idx] = computeRadialCurrentDensity(params, normR);
    }
  }
  return map;
}
