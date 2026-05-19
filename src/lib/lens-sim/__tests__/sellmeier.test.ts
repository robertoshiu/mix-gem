// equipment-monitor/src/lib/lens-sim/__tests__/sellmeier.test.ts
import { silicaDnDt, waterDnDt, waterRefractiveIndex } from '../sellmeier';

describe('sellmeier', () => {
  it('silica dn/dT is ~10e-6 /C at 193nm', () => {
    const result = silicaDnDt(22.5);
    expect(result).toBeCloseTo(10e-6, 7);
  });

  it('water dn/dT is negative (~-100e-6 /C)', () => {
    const result = waterDnDt(22.5);
    expect(result).toBeLessThan(0);
    expect(Math.abs(result)).toBeCloseTo(100e-6, 6);
  });

  it('water refractive index at baseline is ~1.437', () => {
    const result = waterRefractiveIndex(22.5);
    expect(result).toBeCloseTo(1.437, 2);
  });

  it('water refractive index decreases with temperature', () => {
    const n1 = waterRefractiveIndex(22.0);
    const n2 = waterRefractiveIndex(23.0);
    expect(n2).toBeLessThan(n1);
  });
});
