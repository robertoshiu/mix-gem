import { classifyRegime, arrheniusRate, gpcThermalFactor } from '../thermal-model';

describe('thermal-model', () => {
  it('classifies temperatures below 100C as condensation', () => {
    expect(classifyRegime(50)).toBe('condensation');
    expect(classifyRegime(99)).toBe('condensation');
  });

  it('classifies temperatures 100-300C as ald-window', () => {
    expect(classifyRegime(100)).toBe('ald-window');
    expect(classifyRegime(200)).toBe('ald-window');
    expect(classifyRegime(300)).toBe('ald-window');
  });

  it('classifies temperatures above 300C as decomposition', () => {
    expect(classifyRegime(301)).toBe('decomposition');
    expect(classifyRegime(400)).toBe('decomposition');
  });

  it('Arrhenius rate increases with temperature', () => {
    const r150 = arrheniusRate(150);
    const r250 = arrheniusRate(250);
    expect(r250).toBeGreaterThan(r150);
  });

  it('GPC thermal factor is ~1.0 inside ALD window at reference temp', () => {
    const factor = gpcThermalFactor(200);
    expect(factor).toBeCloseTo(1.0, 1);
  });

  it('GPC thermal factor increases above ALD window (decomposition)', () => {
    const factor = gpcThermalFactor(380);
    expect(factor).toBeGreaterThan(1.2);
  });

  it('GPC thermal factor is reduced below ALD window (condensation)', () => {
    const factor = gpcThermalFactor(60);
    expect(factor).toBeLessThan(0.8);
  });
});
