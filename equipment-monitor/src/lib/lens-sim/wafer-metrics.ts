// equipment-monitor/src/lib/lens-sim/wafer-metrics.ts
import type { SimulationParams, WaferState } from './types';
import {
  BASE_LER,
  DIE_GRID_COLS,
  DIE_GRID_ROWS,
  DIE_MASK,
  LER_PER_DOSE_PCT,
} from './constants';
import { computeLensTemperatures } from './thermal-model';
import { computeZernikes, zernikeToFieldImpact } from './zernike';
import { computeFluidState, computeDefectProbabilities } from './fluid-model';

/**
 * Compute all wafer metrics for a given set of params at a given elapsed time.
 * Orchestrates thermal -> zernike -> field impact -> fluid -> defects.
 */
export function computeWaferMetrics(
  params: SimulationParams,
  elapsedSeconds: number,
): Omit<WaferState, 'waferIndex' | 'elapsedTime'> {
  const cols = DIE_GRID_COLS;
  const rows = DIE_GRID_ROWS;
  const dieCount = cols * rows;

  // 1. Lens temperatures
  const lensElements = computeLensTemperatures(params, elapsedSeconds);

  // 2. Zernike wavefront
  const zernikes = computeZernikes(lensElements);

  // 3. CD and overlay from Zernikes
  const { cdImpact, overlayImpact } = zernikeToFieldImpact(zernikes, cols, rows);

  // 4. Fluid state and defects
  const fluid = computeFluidState(params, lensElements[0].deltaT);
  const defectMap = computeDefectProbabilities(fluid, params, cols, rows);

  // 5. LER: base + dose-margin degradation + slight edge effect
  const doseError = ((params.dose - 30) / 30) * 100; // % deviation from nominal
  const lerBase = BASE_LER + Math.abs(doseError) * LER_PER_DOSE_PCT;
  const lerMap = Array.from({ length: dieCount }, (_, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const rx = Math.abs(col - (cols - 1) / 2) / ((cols - 1) / 2);
    const ry = Math.abs(row - (rows - 1) / 2) / ((rows - 1) / 2);
    const edgePenalty = (rx * rx + ry * ry) * 0.3;
    return lerBase + edgePenalty;
  });

  // 6. Apply die mask (zero out inactive dies)
  const cdMap = cdImpact.map((v, i) => (DIE_MASK[i] ? v : 0));
  const overlayMapMasked = overlayImpact.map((v, i) => (DIE_MASK[i] ? v : 0));
  const lerMapMasked = lerMap.map((v, i) => (DIE_MASK[i] ? v : 0));
  const defectMapMasked = defectMap.map((v, i) => (DIE_MASK[i] ? v : 0));

  return {
    lensElements,
    zernikes,
    cdMap,
    overlayMap: overlayMapMasked,
    lerMap: lerMapMasked,
    defectMap: defectMapMasked,
    dieCount,
    dieGridCols: cols,
    dieGridRows: rows,
  };
}
