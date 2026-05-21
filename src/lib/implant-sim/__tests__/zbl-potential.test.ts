import { screeningFunction, screeningLength, computeCollision } from '../zbl-potential';

describe('zbl-potential', () => {
  test('screening function phi(0) equals 1', () => {
    expect(screeningFunction(0)).toBeCloseTo(1.0, 3);
  });

  test('screening function decays with distance', () => {
    const phi1 = screeningFunction(1);
    const phi5 = screeningFunction(5);
    const phi10 = screeningFunction(10);
    expect(phi1).toBeLessThan(1);
    expect(phi5).toBeLessThan(phi1);
    expect(phi10).toBeLessThan(phi5);
    expect(phi10).toBeGreaterThan(0);
  });

  test('screening length scales inversely with Z sum', () => {
    const a_BinSi = screeningLength(5, 14);
    const a_AsinSi = screeningLength(33, 14);
    expect(a_AsinSi).toBeLessThan(a_BinSi);
    expect(a_BinSi).toBeGreaterThan(0.005);
    expect(a_BinSi).toBeLessThan(0.05);
  });

  test('head-on collision (p≈0) transfers maximum energy', () => {
    const { T_eV } = computeCollision(50000, 0.0001, 5, 14, 11, 28);
    const T_max = (4 * 11 * 28) / ((11 + 28) ** 2) * 50000;
    expect(T_eV).toBeGreaterThan(T_max * 0.5);
  });

  test('glancing collision (large p) transfers little energy', () => {
    const { T_eV, theta } = computeCollision(50000, 0.1, 5, 14, 11, 28);
    expect(T_eV).toBeLessThan(1000);
    expect(theta).toBeLessThan(0.5);
  });

  test('lower energy increases scattering angle', () => {
    const p = 0.01;
    const { theta: thetaHi } = computeCollision(100000, p, 5, 14, 11, 28);
    const { theta: thetaLo } = computeCollision(5000, p, 5, 14, 11, 28);
    expect(thetaLo).toBeGreaterThan(thetaHi);
  });
});
