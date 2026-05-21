import { nuclearStopping, electronicStopping, totalStopping } from '../stopping-power';
import { ION_DB, MATERIAL_DB } from '../constants';

describe('stopping-power', () => {
  const Si = MATERIAL_DB.Si;
  const B = ION_DB.B;

  test('nuclear stopping is positive for B in Si', () => {
    const Sn = nuclearStopping(50000, B.Z, B.M, Si.Z, Si.M, Si.density);
    expect(Sn).toBeGreaterThan(0);
  });

  test('nuclear stopping peaks at low energy and decreases', () => {
    const Sn_low = nuclearStopping(1000, B.Z, B.M, Si.Z, Si.M, Si.density);
    const Sn_hi = nuclearStopping(500000, B.Z, B.M, Si.Z, Si.M, Si.density);
    expect(Sn_low).toBeGreaterThan(Sn_hi);
  });

  test('electronic stopping increases with sqrt(E)', () => {
    const Se_lo = electronicStopping(10000, B.Z, B.M, Si.Z, Si.M, Si.density);
    const Se_hi = electronicStopping(100000, B.Z, B.M, Si.Z, Si.M, Si.density);
    expect(Se_hi).toBeGreaterThan(Se_lo);
    const ratio = Se_hi / Se_lo;
    expect(ratio).toBeGreaterThan(2);
    expect(ratio).toBeLessThan(5);
  });

  test('electronic stopping dominates at high energy', () => {
    const E = 500000;
    const Sn = nuclearStopping(E, B.Z, B.M, Si.Z, Si.M, Si.density);
    const Se = electronicStopping(E, B.Z, B.M, Si.Z, Si.M, Si.density);
    expect(Se).toBeGreaterThan(Sn);
  });

  test('heavier target increases nuclear stopping', () => {
    const Sn_Si = nuclearStopping(50000, B.Z, B.M, Si.Z, Si.M, Si.density);
    const As = ION_DB.As;
    const Sn_As = nuclearStopping(50000, As.Z, As.M, Si.Z, Si.M, Si.density);
    expect(Sn_As).toBeGreaterThan(Sn_Si);
  });

  test('total stopping is sum of nuclear + electronic', () => {
    const E = 50000;
    const Sn = nuclearStopping(E, B.Z, B.M, Si.Z, Si.M, Si.density);
    const Se = electronicStopping(E, B.Z, B.M, Si.Z, Si.M, Si.density);
    const St = totalStopping(E, B.Z, B.M, Si.Z, Si.M, Si.density);
    expect(St).toBeCloseTo(Sn + Se, 5);
  });
});
