// equipment-monitor/src/lib/lens-sim/__tests__/zernike.test.ts
import { computeZernikes, zernikeToFieldImpact } from '../zernike';
import type { LensElementState } from '../types';
import { LENS_COUNT, ZERNIKE_COUNT } from '../constants';

function makeLensState(l1DeltaT: number): LensElementState[] {
  // Create a lens state where L1 has the given deltaT, others proportionally less
  return Array.from({ length: LENS_COUNT }, (_, i) => ({
    index: i,
    temperature: 22.5 + l1DeltaT * (1 - i * 0.2),
    deltaT: l1DeltaT * (1 - i * 0.2),
    deltaOPL: 0, // not used by zernike model directly
  }));
}

describe('zernike', () => {
  it('returns ZERNIKE_COUNT coefficients', () => {
    const result = computeZernikes(makeLensState(0.1));
    expect(result).toHaveLength(ZERNIKE_COUNT);
  });

  it('Z4 (defocus) is the dominant coefficient under symmetric heating', () => {
    const z = computeZernikes(makeLensState(0.1));
    const z4 = Math.abs(z[3]); // Z4 at index 3
    // Z4 should be larger than any other
    z.forEach((val, i) => {
      if (i !== 3) expect(z4).toBeGreaterThan(Math.abs(val));
    });
  });

  it('cold lens produces near-zero Zernikes', () => {
    const z = computeZernikes(makeLensState(0));
    z.forEach((val) => expect(Math.abs(val)).toBeLessThan(0.001));
  });

  it('hotter lens produces larger Zernikes', () => {
    const cool = computeZernikes(makeLensState(0.05));
    const hot = computeZernikes(makeLensState(0.15));
    expect(Math.abs(hot[3])).toBeGreaterThan(Math.abs(cool[3]));
  });

  it('zernikeToFieldImpact returns per-die CD and overlay values', () => {
    const z = computeZernikes(makeLensState(0.1));
    const impact = zernikeToFieldImpact(z, 9, 9);
    expect(impact.cdImpact).toHaveLength(81);
    expect(impact.overlayImpact).toHaveLength(81);
  });
});
