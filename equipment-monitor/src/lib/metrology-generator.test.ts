import { generateMeasurement } from './metrology-generator';
import { SPC_PARAMETERS } from './spc-parameters';

describe('generateMeasurement — no fault', () => {
  it('CD stays within UCL/LCL across 1000 samples', () => {
    const { ucl, lcl } = SPC_PARAMETERS.cd;
    for (let i = 0; i < 1000; i++) {
      const result = generateMeasurement(1, null);
      expect(result.cd).toBeGreaterThan(lcl);
      expect(result.cd).toBeLessThan(ucl);
    }
  });
});

describe('generateMeasurement — sudden_shift fault', () => {
  it('shifts CD above UCL', () => {
    const { ucl } = SPC_PARAMETERS.cd;
    const fault = { type: 'sudden_shift' as const, parameter: 'cd' as const, severity: 1.0, startedAtWafer: 1 };
    let foundExceedance = false;
    for (let i = 0; i < 50; i++) {
      const result = generateMeasurement(2, fault);
      if (result.cd > ucl) { foundExceedance = true; break; }
    }
    expect(foundExceedance).toBe(true);
  });
});

describe('generateMeasurement — gradual_drift fault', () => {
  it('CD increases with each wafer', () => {
    const fault = { type: 'gradual_drift' as const, parameter: 'cd' as const, severity: 1.0, startedAtWafer: 1 };
    const w5 = Array.from({ length: 10 }, () => generateMeasurement(5, fault)).map((m) => m.cd);
    const w15 = Array.from({ length: 10 }, () => generateMeasurement(15, fault)).map((m) => m.cd);
    const avg5 = w5.reduce((a, b) => a + b) / w5.length;
    const avg15 = w15.reduce((a, b) => a + b) / w15.length;
    expect(avg15).toBeGreaterThan(avg5);
  });
});
