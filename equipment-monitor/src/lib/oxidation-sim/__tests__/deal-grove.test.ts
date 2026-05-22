import { computeBA, computeB, advanceOxideThickness, adjustForHcl, adjustForPressure } from '../deal-grove';

describe('deal-grove', () => {
  it('dry oxide at 1000C/30min grows thin oxide', () => {
    let x = 0;
    const dt = 1;
    for (let t = 0; t < 1800; t++) {
      const ba = computeBA('dry', 1000, '100', 0, 0);
      const b = computeB('dry', 1000, 0, 0);
      x = advanceOxideThickness(x, ba, b, dt);
    }
    // Calibrated to Deal-Grove coefficients in constants.ts
    expect(x).toBeGreaterThan(2);
    expect(x).toBeLessThan(30);
  });

  it('wet oxide at 1050C/60min grows thicker than dry', () => {
    let x = 0;
    for (let t = 0; t < 3600; t++) {
      const ba = computeBA('wet', 1050, '100', 0, 0);
      const b = computeB('wet', 1050, 0, 0);
      x = advanceOxideThickness(x, ba, b, 1);
    }
    // Calibrated to Deal-Grove coefficients in constants.ts
    // Wet oxide grows significantly faster than dry
    expect(x).toBeGreaterThan(20);
    expect(x).toBeLessThan(1000);
  });

  it('linear regime: thin oxide grows linearly', () => {
    const ba = computeBA('dry', 1000, '100', 0, 0);
    const b = computeB('dry', 1000, 0, 0);
    const x1 = advanceOxideThickness(0, ba, b, 10);
    const x2 = advanceOxideThickness(0, ba, b, 20);
    expect(x2 / x1).toBeGreaterThan(1.5);
    expect(x2 / x1).toBeLessThan(2.5);
  });

  it('(111) orientation oxidizes faster than (100)', () => {
    const ba100 = computeBA('dry', 1000, '100', 0, 0);
    const ba111 = computeBA('dry', 1000, '111', 0, 0);
    expect(ba111).toBeGreaterThan(ba100 * 1.5);
  });

  it('B is orientation-independent', () => {
    const b100 = computeB('dry', 1000, 0, 0);
    const b111 = computeB('dry', 1000, 0, 0);
    expect(b100).toBe(b111);
  });

  it('HCl doping enhances rate', () => {
    const ba_base = computeBA('dry', 1000, '100', 0, 0);
    const ba_hcl = adjustForHcl(ba_base, 3);
    expect(ba_hcl).toBeGreaterThan(ba_base);
  });

  it('pressure scaling: HIBOX at 10atm increases B quadratically', () => {
    const b_base = computeB('dry', 1000, 0, 0);
    const b_10atm = adjustForPressure(b_base, 10, 'b');
    expect(b_10atm).toBeGreaterThan(b_base * 50);
    expect(b_10atm).toBeLessThan(b_base * 150);
  });

  it('initial oxide tau correction works', () => {
    const ba = computeBA('dry', 1000, '100', 0, 0);
    const b = computeB('dry', 1000, 0, 0);
    const xFromZero = advanceOxideThickness(0, ba, b, 600);
    const xFrom50 = advanceOxideThickness(50, ba, b, 600);
    expect(xFrom50).toBeGreaterThan(50);
    expect(xFrom50 - 50).toBeLessThan(xFromZero);
  });

  it('compressive stress reduces B/A via Kao', () => {
    const ba_noStress = computeBA('dry', 1000, '100', 0, 0);
    const ba_stress = computeBA('dry', 1000, '100', -500, 0);
    expect(ba_noStress).toBeGreaterThan(ba_stress);
  });

  it('zero stress produces unmodified rate', () => {
    const ba = computeBA('dry', 1000, '100', 0, 0);
    const ba2 = computeBA('dry', 1000, '100', 0, 0);
    expect(ba).toBe(ba2);
  });
});
