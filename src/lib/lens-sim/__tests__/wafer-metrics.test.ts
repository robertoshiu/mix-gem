// equipment-monitor/src/lib/lens-sim/__tests__/wafer-metrics.test.ts
import { computeWaferMetrics } from '../wafer-metrics';
import { DEFAULT_PARAMS, DIE_MASK } from '../constants';

describe('wafer-metrics', () => {
  it('returns correct die count for 9x9 grid', () => {
    const result = computeWaferMetrics(DEFAULT_PARAMS, 60);
    expect(result.dieCount).toBe(81);
    expect(result.dieGridCols).toBe(9);
    expect(result.dieGridRows).toBe(9);
  });

  it('CD map has correct length', () => {
    const result = computeWaferMetrics(DEFAULT_PARAMS, 60);
    expect(result.cdMap).toHaveLength(81);
  });

  it('first-wafer effect: wafer 1 CD differs from wafer 25', () => {
    const w1 = computeWaferMetrics(DEFAULT_PARAMS, 12);   // first wafer
    const w25 = computeWaferMetrics(DEFAULT_PARAMS, 300);  // last wafer
    const maxCd1 = Math.max(...w1.cdMap.map(Math.abs));
    const maxCd25 = Math.max(...w25.cdMap.map(Math.abs));
    // Thermal drift causes measurable CD shift across the lot
    expect(maxCd25).toBeGreaterThan(maxCd1);
    expect(Math.abs(maxCd25 - maxCd1)).toBeGreaterThan(0.01);
  });

  it('overlay map values are non-negative', () => {
    const result = computeWaferMetrics(DEFAULT_PARAMS, 100);
    result.overlayMap.forEach((v) => expect(v).toBeGreaterThanOrEqual(0));
  });

  it('LER values are within plausible range (1-6 nm) for active dies', () => {
    const result = computeWaferMetrics(DEFAULT_PARAMS, 100);
    result.lerMap.forEach((v, i) => {
      if (!DIE_MASK[i]) {
        expect(v).toBe(0); // inactive dies are masked to zero
      } else {
        expect(v).toBeGreaterThan(1);
        expect(v).toBeLessThan(6);
      }
    });
  });

  it('defect map values are non-negative', () => {
    const result = computeWaferMetrics(DEFAULT_PARAMS, 100);
    result.defectMap.forEach((v) => expect(v).toBeGreaterThanOrEqual(0));
  });
});
