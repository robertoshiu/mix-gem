import { describe, it, expect } from 'vitest';
import { generateInitialProfile, generateImplantDamage } from '../initial-profile';

describe('initial-profile', () => {
  const bins = 200;
  const binSize = 2.0;

  it('generates Gaussian-shaped profile', () => {
    const profile = generateInitialProfile('B', 1e14, 50, bins, binSize);
    expect(profile).toHaveLength(bins);
    const peakBin = Math.floor(50 / binSize);
    const maxVal = Math.max(...profile);
    const maxIdx = profile.indexOf(maxVal);
    expect(Math.abs(maxIdx - peakBin)).toBeLessThan(5);
  });

  it('integral approximately equals dose', () => {
    const dose = 1e14;
    const profile = generateInitialProfile('B', dose, 50, bins, binSize);
    const integral = profile.reduce((s, c) => s + c * binSize * 1e-7, 0);
    expect(integral).toBeGreaterThan(dose * 0.5);
    expect(integral).toBeLessThan(dose * 2.0);
  });

  it('peak is near initialDepth', () => {
    const profile = generateInitialProfile('P', 1e14, 100, bins, binSize);
    const maxIdx = profile.indexOf(Math.max(...profile));
    const peakDepth = (maxIdx + 0.5) * binSize;
    expect(Math.abs(peakDepth - 100)).toBeLessThan(20);
  });

  it('has channeling tail beyond 2*Rp', () => {
    const profile = generateInitialProfile('B', 1e14, 40, bins, binSize);
    const tailBin = Math.floor(100 / binSize);
    const deepBin = Math.floor(150 / binSize);
    expect(profile[tailBin]).toBeGreaterThan(0);
    if (deepBin < bins) {
      expect(profile[deepBin]).toBeLessThan(profile[tailBin]);
    }
  });

  it('implant damage is proportional to profile', () => {
    const profile = generateInitialProfile('B', 1e14, 50, bins, binSize);
    const damage = generateImplantDamage(profile, 'B');
    expect(damage).toHaveLength(bins);
    for (let i = 0; i < bins; i++) {
      expect(damage[i]).toBeCloseTo(profile[i], -1);
    }
  });

  it('heavier species produce more damage per ion', () => {
    const profile = generateInitialProfile('Sb', 1e14, 30, bins, binSize);
    const damageSb = generateImplantDamage(profile, 'Sb');
    const damageB = generateImplantDamage(profile, 'B');
    expect(damageSb[Math.floor(30 / binSize)]).toBeGreaterThan(damageB[Math.floor(30 / binSize)]);
  });
});
