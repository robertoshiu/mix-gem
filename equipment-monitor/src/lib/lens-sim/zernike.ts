// equipment-monitor/src/lib/lens-sim/zernike.ts
import type { LensElementState } from './types';
import {
  CD_PER_DEFOCUS,
  OVERLAY_PER_COMA,
  OVERLAY_PER_TILT,
  ZERNIKE_COUNT,
  ZERNIKE_SENSITIVITY,
} from './constants';

/**
 * Compute Zernike wavefront coefficients (nm) from lens thermal state.
 * Simplified: each Zernike is proportional to the weighted sum of element deltaTsm
 * with L1 contributing most.
 *
 * Synthetic/illustrative values.
 */
export function computeZernikes(lensElements: LensElementState[]): number[] {
  // Weighted average deltaT (L1 dominates)
  const weights = [0.5, 0.25, 0.13, 0.08, 0.04];
  const weightedDeltaT = lensElements.reduce(
    (sum, el, i) => sum + el.deltaT * (weights[i] ?? 0),
    0,
  );

  return Array.from({ length: ZERNIKE_COUNT }, (_, i) => {
    return ZERNIKE_SENSITIVITY[i] * weightedDeltaT;
  });
}

/**
 * Convert Zernike coefficients to per-die CD and overlay impact.
 *
 * CD impact: dominated by Z4 (defocus) and Z9 (spherical).
 *   - Z4 contributes a uniform shift
 *   - Z9 contributes a radial bowl (center vs edge)
 *
 * Overlay impact: dominated by Z2/Z3 (tilt) and Z7/Z8 (coma).
 *   - Z2/Z3 create linear gradient
 *   - Z7/Z8 create clover-leaf pattern
 */
export function zernikeToFieldImpact(
  zernikes: number[],
  gridCols: number,
  gridRows: number,
): { cdImpact: number[]; overlayImpact: number[] } {
  const dieCount = gridCols * gridRows;
  const cdImpact = new Array<number>(dieCount);
  const overlayImpact = new Array<number>(dieCount);

  const cx = (gridCols - 1) / 2;
  const cy = (gridRows - 1) / 2;
  const maxR = Math.sqrt(cx * cx + cy * cy);

  const z4 = zernikes[3] ?? 0;  // defocus
  const z5 = zernikes[4] ?? 0;  // astig-0
  const z6 = zernikes[5] ?? 0;  // astig-45
  const z7 = zernikes[6] ?? 0;  // coma-x
  const z8 = zernikes[7] ?? 0;  // coma-y
  const z9 = zernikes[8] ?? 0;  // spherical
  const z2 = zernikes[1] ?? 0;  // tilt-x
  const z3 = zernikes[2] ?? 0;  // tilt-y

  for (let row = 0; row < gridRows; row++) {
    for (let col = 0; col < gridCols; col++) {
      const idx = row * gridCols + col;
      const rx = (col - cx) / (maxR || 1); // normalized -1..1
      const ry = (row - cy) / (maxR || 1);
      const r2 = rx * rx + ry * ry;

      // CD: defocus (uniform) + spherical (radial bowl) + astigmatism (saddle)
      const defocusContrib = z4 * CD_PER_DEFOCUS;
      const sphericalContrib = z9 * CD_PER_DEFOCUS * (2 * r2 - 1);
      const astigContrib = (z5 * (rx * rx - ry * ry) + z6 * 2 * rx * ry) * CD_PER_DEFOCUS * 0.5;
      cdImpact[idx] = defocusContrib + sphericalContrib + astigContrib;

      // Overlay: tilt (linear) + coma (clover)
      const tiltContrib = Math.sqrt((z2 * OVERLAY_PER_TILT) ** 2 + (z3 * OVERLAY_PER_TILT) ** 2) * Math.sqrt(rx * rx + ry * ry);
      const comaContrib = Math.sqrt((z7 * rx) ** 2 + (z8 * ry) ** 2) * OVERLAY_PER_COMA;
      overlayImpact[idx] = tiltContrib + comaContrib;
    }
  }

  return { cdImpact, overlayImpact };
}
