import { computeThermalState } from '../thermal-model';
import { DEFAULT_PARAMS } from '../constants';

describe('thermal-model', () => {
  it('frictional heating raises temperature above ambient', () => {
    const result = computeThermalState(DEFAULT_PARAMS, 5);
    expect(result.temperature).toBeGreaterThan(25);
  });

  it('higher RPM produces more heating', () => {
    const slow = computeThermalState({ ...DEFAULT_PARAMS, waferRpm: 20, platenRpm: 20 }, 10);
    const fast = computeThermalState({ ...DEFAULT_PARAMS, waferRpm: 120, platenRpm: 120 }, 10);
    expect(fast.temperature).toBeGreaterThan(slow.temperature);
  });

  it('higher down-force produces more heating', () => {
    const low = computeThermalState({ ...DEFAULT_PARAMS, downForce: 1 }, 10);
    const high = computeThermalState({ ...DEFAULT_PARAMS, downForce: 8 }, 10);
    expect(high.temperature).toBeGreaterThan(low.temperature);
  });

  it('temperature affects Arrhenius rate factor', () => {
    const result = computeThermalState(DEFAULT_PARAMS, 10);
    expect(result.arrheniusFactor).toBeGreaterThan(1);
  });

  it('temperature stays in reasonable range (25-80C)', () => {
    const extreme = computeThermalState(
      { ...DEFAULT_PARAMS, downForce: 10, waferRpm: 150, platenRpm: 150 }, 50
    );
    expect(extreme.temperature).toBeLessThan(80);
    expect(extreme.temperature).toBeGreaterThan(25);
  });
});
