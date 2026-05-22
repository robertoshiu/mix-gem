import {
  FDC_PARAMS,
  FDC_PARAM_IDS,
  WEIBULL_DEFAULTS,
  PERF_THRESHOLDS,
  PM_THRESHOLDS,
  ANOMALY_WINDOW,
} from '../constants';

describe('FDC_PARAMS', () => {
  test('has all 6 entries with valid bounds', () => {
    const ids = Object.keys(FDC_PARAMS);
    expect(ids).toHaveLength(6);
    for (const p of Object.values(FDC_PARAMS)) {
      expect(p.fdcUpper).toBeGreaterThan(p.setpoint);
      expect(p.fdcLower).toBeLessThan(p.setpoint);
      expect(p.label.length).toBeGreaterThan(0);
      expect(p.unit.length).toBeGreaterThan(0);
    }
  });

  test('FDC_PARAM_IDS matches FDC_PARAMS keys', () => {
    const keys = Object.keys(FDC_PARAMS).sort();
    expect([...FDC_PARAM_IDS].sort()).toEqual(keys);
  });
});

describe('WEIBULL_DEFAULTS', () => {
  test('has DEFAULT key', () => {
    expect(WEIBULL_DEFAULTS.DEFAULT).toBeDefined();
    expect(WEIBULL_DEFAULTS.DEFAULT.shape).toBeGreaterThan(0);
    expect(WEIBULL_DEFAULTS.DEFAULT.scale).toBeGreaterThan(0);
    expect(WEIBULL_DEFAULTS.DEFAULT.pmIntervalDays).toBeGreaterThan(0);
  });

  test('all entries have positive shape, scale, pmIntervalDays', () => {
    for (const val of Object.values(WEIBULL_DEFAULTS)) {
      expect(val.shape).toBeGreaterThan(0);
      expect(val.scale).toBeGreaterThan(0);
      expect(val.pmIntervalDays).toBeGreaterThan(0);
    }
  });
});

describe('Thresholds', () => {
  test('PERF green > amber, PM green > amber, ANOMALY start < end', () => {
    expect(PERF_THRESHOLDS.green).toBeGreaterThan(PERF_THRESHOLDS.amber);
    expect(PM_THRESHOLDS.green).toBeGreaterThan(PM_THRESHOLDS.amber);
    expect(ANOMALY_WINDOW.start).toBeLessThan(ANOMALY_WINDOW.end);
  });
});
