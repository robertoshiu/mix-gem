import { criticalAngle, angleToChannel, canChannel, dechannelingProbability } from '../channeling-model';

describe('channeling-model', () => {
  test('critical angle decreases with energy', () => {
    const psi_low = criticalAngle(10000, 5, 14, '100');
    const psi_high = criticalAngle(100000, 5, 14, '100');
    expect(psi_low).toBeGreaterThan(psi_high);
  });

  test('critical angle is positive and reasonable', () => {
    const psi = criticalAngle(50000, 5, 14, '100');
    expect(psi).toBeGreaterThan(0);
    expect(psi).toBeLessThan(0.5);
  });

  test('0° tilt on <100> produces zero angle to channel', () => {
    const angle = angleToChannel(0, 0, '100');
    expect(angle).toBeCloseTo(0, 5);
  });

  test('7° tilt exceeds critical angle for high energy B', () => {
    const can = canChannel(50000, 'B', 7, 0, '100', false);
    expect(can).toBe(false);
  });

  test('0° tilt enables channeling for B at 50 keV', () => {
    const can = canChannel(50000, 'B', 0, 0, '100', false);
    expect(can).toBe(true);
  });

  test('amorphous region blocks channeling', () => {
    const can = canChannel(50000, 'B', 0, 0, '100', true);
    expect(can).toBe(false);
  });

  test('dechanneling probability increases with temperature', () => {
    const p_cold = dechannelingProbability(25, 0, 0.5);
    const p_hot = dechannelingProbability(500, 0, 0.5);
    expect(p_hot).toBeGreaterThan(p_cold);
  });

  test('dechanneling probability increases with damage', () => {
    const p_clean = dechannelingProbability(25, 0, 0.5);
    const p_damaged = dechannelingProbability(25, 0.8, 0.5);
    expect(p_damaged).toBeGreaterThan(p_clean);
  });
});
