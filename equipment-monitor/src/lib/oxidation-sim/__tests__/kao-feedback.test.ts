import { kaoCorrection, computeBirdBeakLength } from '../kao-feedback';

describe('kao-feedback', () => {
  it('zero stress returns correction factor of 1', () => {
    expect(kaoCorrection(0, 1000, 0.01)).toBeCloseTo(1.0, 5);
  });

  it('compressive stress reduces rate (factor < 1)', () => {
    const factor = kaoCorrection(-500, 1000, 0.01);
    expect(factor).toBeLessThan(1);
    expect(factor).toBeGreaterThan(0);
  });

  it('tensile stress increases rate (factor > 1)', () => {
    const factor = kaoCorrection(500, 1000, 0.01);
    expect(factor).toBeGreaterThan(1);
  });

  it('higher stress produces stronger suppression', () => {
    const f1 = kaoCorrection(-200, 1000, 0.01);
    const f2 = kaoCorrection(-800, 1000, 0.01);
    expect(f2).toBeLessThan(f1);
  });

  it('bird beak length is 0 for uniform oxide thickness', () => {
    const uniform = new Array(20).fill(50);
    expect(computeBirdBeakLength(uniform, 0)).toBe(0);
  });

  it('bird beak length > 0 when oxide tapers near mask edge', () => {
    const thicknesses = new Array(20).fill(50);
    for (let i = 10; i < 20; i++) {
      thicknesses[i] = 50 * (1 - (i - 10) / 10);
    }
    const bb = computeBirdBeakLength(thicknesses, 10);
    expect(bb).toBeGreaterThan(0);
  });
});
