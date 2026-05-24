import { generateMeasurement, generateMeasurementWithConfig } from './metrology-generator';
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

// Helper: sample standard deviation
function stdev(values: number[]): number {
  const n = values.length;
  const mean = values.reduce((a, b) => a + b) / n;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (n - 1);
  return Math.sqrt(variance);
}

describe('generateMeasurementWithConfig — backward compatibility', () => {
  it('returns same shape as generateMeasurement', () => {
    const result = generateMeasurementWithConfig(1, null);
    expect(result).toHaveProperty('waferNumber', 1);
    expect(typeof result.cd).toBe('number');
    expect(typeof result.cdu).toBe('number');
    expect(typeof result.ovl_x).toBe('number');
    expect(typeof result.ovl_y).toBe('number');
    expect(typeof result.ler).toBe('number');
  });

  it('default config produces values within UCL/LCL for CD', () => {
    const { ucl, lcl } = SPC_PARAMETERS.cd;
    for (let i = 0; i < 1000; i++) {
      const result = generateMeasurementWithConfig(1, null);
      expect(result.cd).toBeGreaterThan(lcl);
      expect(result.cd).toBeLessThan(ucl);
    }
  });

  it('sudden_shift still works with default config', () => {
    const { ucl } = SPC_PARAMETERS.cd;
    const fault = { type: 'sudden_shift' as const, parameter: 'cd' as const, severity: 1.0, startedAtWafer: 1 };
    let foundExceedance = false;
    for (let i = 0; i < 50; i++) {
      const result = generateMeasurementWithConfig(2, fault);
      if (result.cd > ucl) { foundExceedance = true; break; }
    }
    expect(foundExceedance).toBe(true);
  });
});

describe('generateMeasurementWithConfig — dose/CD correlation', () => {
  it('higher dose increases CD proportionally', () => {
    const N = 500;
    const samplesLow = Array.from({ length: N }, () =>
      generateMeasurementWithConfig(1, null, { exposureDose: 36 }).cd
    );
    const samplesHigh = Array.from({ length: N }, () =>
      generateMeasurementWithConfig(1, null, { exposureDose: 44 }).cd
    );
    const avgLow = samplesLow.reduce((a, b) => a + b) / N;
    const avgHigh = samplesHigh.reduce((a, b) => a + b) / N;
    // 8 mJ/cm² difference × 0.3 nm/mJ = 2.4 nm expected shift
    expect(avgHigh).toBeGreaterThan(avgLow + 1.5);
  });

  it('lower dose decreases CD', () => {
    const N = 500;
    const samplesDefault = Array.from({ length: N }, () =>
      generateMeasurementWithConfig(1, null).cd
    );
    const samplesLow = Array.from({ length: N }, () =>
      generateMeasurementWithConfig(1, null, { exposureDose: 34 }).cd
    );
    const avgDefault = samplesDefault.reduce((a, b) => a + b) / N;
    const avgLow = samplesLow.reduce((a, b) => a + b) / N;
    // 4 mJ/cm² below default × 0.3 = -1.2 nm
    expect(avgLow).toBeLessThan(avgDefault - 0.5);
  });

  it('dose at default 38 has no effect', () => {
    const N = 300;
    const samples1 = Array.from({ length: N }, () =>
      generateMeasurementWithConfig(1, null, { exposureDose: 38 }).cd
    );
    const samples2 = Array.from({ length: N }, () =>
      generateMeasurementWithConfig(1, null).cd
    );
    const avg1 = samples1.reduce((a, b) => a + b) / N;
    const avg2 = samples2.reduce((a, b) => a + b) / N;
    // Should be statistically indistinguishable (within 0.3nm)
    expect(Math.abs(avg1 - avg2)).toBeLessThan(0.3);
  });
});

describe('generateMeasurementWithConfig — focus/CDU correlation', () => {
  it('defocus increases CDU standard deviation', () => {
    const N = 500;
    const samplesFocused = Array.from({ length: N }, () =>
      generateMeasurementWithConfig(1, null, { focusOffset: 0 }).cdu
    );
    const samplesDefocused = Array.from({ length: N }, () =>
      generateMeasurementWithConfig(1, null, { focusOffset: 30 }).cdu
    );
    expect(stdev(samplesDefocused)).toBeGreaterThan(stdev(samplesFocused));
  });

  it('larger defocus produces larger CDU degradation', () => {
    const N = 500;
    const samplesMild = Array.from({ length: N }, () =>
      generateMeasurementWithConfig(1, null, { focusOffset: 10 }).cdu
    );
    const samplesSevere = Array.from({ length: N }, () =>
      generateMeasurementWithConfig(1, null, { focusOffset: 50 }).cdu
    );
    expect(stdev(samplesSevere)).toBeGreaterThan(stdev(samplesMild));
  });

  it('CDU mean is not shifted by focus (only noise increases)', () => {
    const N = 500;
    const samplesFocus0 = Array.from({ length: N }, () =>
      generateMeasurementWithConfig(1, null, { focusOffset: 0 }).cdu
    );
    const samplesFocus20 = Array.from({ length: N }, () =>
      generateMeasurementWithConfig(1, null, { focusOffset: 20 }).cdu
    );
    const avg0 = samplesFocus0.reduce((a, b) => a + b) / N;
    const avg20 = samplesFocus20.reduce((a, b) => a + b) / N;
    // Mean should stay near target (2.0), not drastically shift
    expect(Math.abs(avg20 - avg0)).toBeLessThan(0.3);
  });
});

describe('generateMeasurementWithConfig — PEB drift', () => {
  it('later wafers shift CD with positive drift rate', () => {
    const N = 200;
    const driftRate = 0.1;
    const samplesEarly = Array.from({ length: N }, () =>
      generateMeasurementWithConfig(2, null, { pebDriftRate: driftRate }).cd
    );
    const samplesLater = Array.from({ length: N }, () =>
      generateMeasurementWithConfig(20, null, { pebDriftRate: driftRate }).cd
    );
    const avgEarly = samplesEarly.reduce((a, b) => a + b) / N;
    const avgLater = samplesLater.reduce((a, b) => a + b) / N;
    // 18 wafers × 0.1 = 1.8 nm expected shift
    expect(avgLater).toBeGreaterThan(avgEarly + 1.0);
  });

  it('zero drift rate has no effect', () => {
    const N = 200;
    const samplesEarly = Array.from({ length: N }, () =>
      generateMeasurementWithConfig(2, null, { pebDriftRate: 0 }).cd
    );
    const samplesLater = Array.from({ length: N }, () =>
      generateMeasurementWithConfig(20, null, { pebDriftRate: 0 }).cd
    );
    const avgEarly = samplesEarly.reduce((a, b) => a + b) / N;
    const avgLater = samplesLater.reduce((a, b) => a + b) / N;
    expect(Math.abs(avgLater - avgEarly)).toBeLessThan(0.3);
  });

  it('negative drift rate decreases CD over wafers', () => {
    const N = 200;
    const driftRate = -0.1;
    const samplesEarly = Array.from({ length: N }, () =>
      generateMeasurementWithConfig(2, null, { pebDriftRate: driftRate }).cd
    );
    const samplesLater = Array.from({ length: N }, () =>
      generateMeasurementWithConfig(20, null, { pebDriftRate: driftRate }).cd
    );
    const avgEarly = samplesEarly.reduce((a, b) => a + b) / N;
    const avgLater = samplesLater.reduce((a, b) => a + b) / N;
    // 18 wafers × -0.1 = -1.8 nm
    expect(avgLater).toBeLessThan(avgEarly - 1.0);
  });
});

describe('generateMeasurementWithConfig — reticle error', () => {
  it('positive reticle error shifts CD upward', () => {
    const N = 500;
    const samplesNormal = Array.from({ length: N }, () =>
      generateMeasurementWithConfig(1, null).cd
    );
    const samplesBias = Array.from({ length: N }, () =>
      generateMeasurementWithConfig(1, null, { reticleError: 3.0 }).cd
    );
    const avgNormal = samplesNormal.reduce((a, b) => a + b) / N;
    const avgBias = samplesBias.reduce((a, b) => a + b) / N;
    expect(avgBias).toBeGreaterThan(avgNormal + 2.0);
  });

  it('negative reticle error shifts CD downward', () => {
    const N = 500;
    const samplesNormal = Array.from({ length: N }, () =>
      generateMeasurementWithConfig(1, null).cd
    );
    const samplesBias = Array.from({ length: N }, () =>
      generateMeasurementWithConfig(1, null, { reticleError: -3.0 }).cd
    );
    const avgNormal = samplesNormal.reduce((a, b) => a + b) / N;
    const avgBias = samplesBias.reduce((a, b) => a + b) / N;
    expect(avgBias).toBeLessThan(avgNormal - 2.0);
  });

  it('zero reticle error has no systematic bias', () => {
    const N = 500;
    const samples1 = Array.from({ length: N }, () =>
      generateMeasurementWithConfig(1, null, { reticleError: 0 }).cd
    );
    const samples2 = Array.from({ length: N }, () =>
      generateMeasurementWithConfig(1, null).cd
    );
    const avg1 = samples1.reduce((a, b) => a + b) / N;
    const avg2 = samples2.reduce((a, b) => a + b) / N;
    expect(Math.abs(avg1 - avg2)).toBeLessThan(0.3);
  });
});

describe('generateMeasurementWithConfig — guard against NaN/Infinity', () => {
  it('all values are finite numbers with defaults', () => {
    for (let i = 0; i < 100; i++) {
      const result = generateMeasurementWithConfig(i + 1, null);
      expect(Number.isFinite(result.cd)).toBe(true);
      expect(Number.isFinite(result.cdu)).toBe(true);
      expect(Number.isFinite(result.ovl_x)).toBe(true);
      expect(Number.isFinite(result.ovl_y)).toBe(true);
      expect(Number.isFinite(result.ler)).toBe(true);
    }
  });

  it('all values are finite with extreme config', () => {
    const extreme: Parameters<typeof generateMeasurementWithConfig>[2] = {
      exposureDose: 100,
      focusOffset: 200,
      pebDriftRate: 2.0,
      reticleError: 10,
    };
    for (let i = 0; i < 100; i++) {
      const result = generateMeasurementWithConfig(25, null, extreme);
      expect(Number.isFinite(result.cd)).toBe(true);
      expect(Number.isFinite(result.cdu)).toBe(true);
      expect(Number.isFinite(result.ovl_x)).toBe(true);
      expect(Number.isFinite(result.ovl_y)).toBe(true);
      expect(Number.isFinite(result.ler)).toBe(true);
    }
  });

  it('CD stays finite even at wafer 0', () => {
    const result = generateMeasurementWithConfig(0, null, { pebDriftRate: 5.0 });
    expect(Number.isFinite(result.cd)).toBe(true);
  });

  it('no NaN with negative focus offset', () => {
    for (let i = 0; i < 100; i++) {
      const result = generateMeasurementWithConfig(1, null, { focusOffset: -50 });
      expect(Number.isFinite(result.cdu)).toBe(true);
      expect(isNaN(result.cdu)).toBe(false);
    }
  });
});

describe('generateMeasurementWithConfig — combined config', () => {
  it('dose, drift, and reticle all stack additively on CD', () => {
    const N = 300;
    const samplesCombined = Array.from({ length: N }, () =>
      generateMeasurementWithConfig(10, null, {
        exposureDose: 42,    // +4 from default → +1.2 nm
        pebDriftRate: 0.1,   // wafer 10 → +1.0 nm
        reticleError: 2.0,   // +2.0 nm
        // Total expected shift: +4.2 nm
      }).cd
    );
    const avgCombined = samplesCombined.reduce((a, b) => a + b) / N;
    // Default CD target is 45; with +4.2 shift and noise we expect ~49.2
    expect(avgCombined).toBeGreaterThan(48);
    expect(avgCombined).toBeLessThan(51);
  });
});
