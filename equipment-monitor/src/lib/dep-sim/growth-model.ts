import type { SimulationParams } from './types';
import {
  DIE_GRID_COLS,
  DIE_GRID_ROWS,
  DIE_MASK,
  GPC_MAX,
  SHOWERHEAD_NONUNIFORMITY,
} from './constants';
import { gpcThermalFactor } from './thermal-model';

/**
 * Compute growth per cycle (Angstrom).
 * GPC = GPC_MAX * coverageA * coverageB * thermalFactor * o3Fraction
 */
export function computeGpc(
  coverageA: number,
  coverageB: number,
  o3Fraction: number,
  pedestalTemp: number,
): number {
  if (coverageA <= 0 || coverageB <= 0) return 0;
  const thermal = gpcThermalFactor(pedestalTemp);
  return GPC_MAX * coverageA * coverageB * o3Fraction * thermal;
}

/**
 * Compute per-die thickness for this cycle.
 * Applies showerhead flow non-uniformity: center gets more precursor than edge.
 * Returns cumulative thickness per die (Angstrom), masked to zero for inactive dies.
 */
export function computeThicknessMap(
  params: SimulationParams,
  coverageA: number,
  coverageB: number,
  cumulativeThickness: number,
  o3Fraction: number,
): number[] {
  const cols = DIE_GRID_COLS;
  const rows = DIE_GRID_ROWS;
  const dieCount = cols * rows;
  const cx = (cols - 1) / 2;
  const cy = (rows - 1) / 2;
  const maxR = Math.sqrt(cx * cx + cy * cy);

  const baseGpc = computeGpc(coverageA, coverageB, o3Fraction, params.pedestalTemp);
  const map = new Array<number>(dieCount);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const idx = row * cols + col;
      if (!DIE_MASK[idx]) {
        map[idx] = 0;
        continue;
      }
      const rx = (col - cx) / maxR;
      const ry = (row - cy) / maxR;
      const r = Math.sqrt(rx * rx + ry * ry);
      const uniformityFactor = 1 - SHOWERHEAD_NONUNIFORMITY * r * r;
      map[idx] = cumulativeThickness + baseGpc * uniformityFactor;
    }
  }

  return map;
}
