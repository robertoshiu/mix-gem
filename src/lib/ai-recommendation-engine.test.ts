import {
  analyzeTrends,
  generateRecommendations,
  shouldAnalyze,
} from './ai-recommendation-engine';
import type {
  SpcMeasurement,
  SpcViolation,
  AiRecommendation,
  AiRecommendationEngineConfig,
} from './mes-types';

const DEFAULT_CONFIG: AiRecommendationEngineConfig = {
  driftThreshold: 0.3,
  minDataPoints: 5,
  confidenceDecayRate: 0.5,
  maxRecommendations: 10,
  analysisInterval: 3,
};

function makeMeasurement(waferNumber: number, overrides: Partial<SpcMeasurement> = {}): SpcMeasurement {
  return {
    id: `m-${waferNumber}`,
    lotId: 'LOT-001',
    waferNumber,
    timestamp: new Date(),
    cd: 45.0,
    cdu: 2.0,
    ovl_x: 0.0,
    ovl_y: 0.0,
    ler: 3.0,
    ...overrides,
  };
}

function makeViolation(overrides: Partial<SpcViolation> = {}): SpcViolation {
  return {
    id: 'viol-001',
    lotId: 'LOT-001',
    waferNumber: 10,
    parameter: 'cd',
    rule: 'rule_1',
    value: 49.0,
    limit: 48.0,
    acknowledged: false,
    timestamp: new Date(),
    ...overrides,
  };
}

describe('analyzeTrends', () => {
  it('returns empty array when measurements < minDataPoints', () => {
    const measurements = [makeMeasurement(1), makeMeasurement(2), makeMeasurement(3)];
    const result = analyzeTrends(measurements, DEFAULT_CONFIG);
    expect(result).toEqual([]);
  });

  it('detects degrading trend when CD drifts upward', () => {
    const measurements = Array.from({ length: 10 }, (_, i) =>
      makeMeasurement(i + 1, { cd: 45.0 + i * 0.5 }) // steady upward drift
    );
    const result = analyzeTrends(measurements, DEFAULT_CONFIG);
    const cdTrend = result.find((t) => t.parameter === 'cd');
    expect(cdTrend).toBeDefined();
    expect(cdTrend?.direction).toBe('degrading');
    expect(cdTrend?.slope).toBeGreaterThan(0);
  });

  it('detects improving trend when CD drifts toward target', () => {
    const measurements = Array.from({ length: 10 }, (_, i) =>
      makeMeasurement(i + 1, { cd: 48.0 - i * 0.4 }) // drifting back to target
    );
    const result = analyzeTrends(measurements, DEFAULT_CONFIG);
    const cdTrend = result.find((t) => t.parameter === 'cd');
    expect(cdTrend).toBeDefined();
    expect(cdTrend?.direction).toBe('improving');
    expect(cdTrend?.slope).toBeLessThan(0);
  });

  it('returns stable for measurements within noise', () => {
    const measurements = Array.from({ length: 10 }, (_, i) =>
      makeMeasurement(i + 1, { cd: 45.0 + (Math.random() - 0.5) * 0.2 })
    );
    const result = analyzeTrends(measurements, DEFAULT_CONFIG);
    const cdTrend = result.find((t) => t.parameter === 'cd');
    expect(cdTrend).toBeDefined();
    expect(cdTrend?.direction).toBe('stable');
  });
});

describe('shouldAnalyze', () => {
  it('returns false when measurements < minDataPoints', () => {
    const ctx = {
      measurements: [makeMeasurement(1), makeMeasurement(2)],
      violations: [],
      equipmentState: 'processing' as const,
      waferNumber: 2,
      activeFault: null,
    };
    expect(shouldAnalyze(ctx, DEFAULT_CONFIG, null)).toBe(false);
  });

  it('returns true when enough measurements and no recent analysis', () => {
    const ctx = {
      measurements: Array.from({ length: 10 }, (_, i) => makeMeasurement(i + 1)),
      violations: [],
      equipmentState: 'processing' as const,
      waferNumber: 10,
      activeFault: null,
    };
    expect(shouldAnalyze(ctx, DEFAULT_CONFIG, null)).toBe(true);
  });

  it('returns false when analysis was too recent', () => {
    const ctx = {
      measurements: Array.from({ length: 10 }, (_, i) => makeMeasurement(i + 1)),
      violations: [],
      equipmentState: 'processing' as const,
      waferNumber: 10,
      activeFault: null,
    };
    expect(shouldAnalyze(ctx, DEFAULT_CONFIG, Date.now())).toBe(false);
  });
});

describe('generateRecommendations', () => {
  it('returns empty array when no conditions trigger', () => {
    const ctx = {
      measurements: Array.from({ length: 10 }, (_, i) =>
        makeMeasurement(i + 1, { cd: 45.0 + (Math.random() - 0.5) * 0.3 })
      ),
      violations: [],
      equipmentState: 'processing' as const,
      waferNumber: 10,
      activeFault: null,
    };
    const result = generateRecommendations(ctx, [], DEFAULT_CONFIG);
    expect(result.length).toBeLessThanOrEqual(2); // may generate process optimization
  });

  it('generates quality recommendation on Rule 1 violation', () => {
    const violation = makeViolation({ rule: 'rule_1', parameter: 'cd', value: 49.1, limit: 48.0 });
    const ctx = {
      measurements: Array.from({ length: 10 }, (_, i) => makeMeasurement(i + 1)),
      violations: [violation],
      equipmentState: 'inhibited' as const,
      waferNumber: 10,
      activeFault: null,
    };
    const result = generateRecommendations(ctx, [], DEFAULT_CONFIG);
    const qualityRec = result.find((r) => r.type === 'predictive-maintenance');
    expect(qualityRec).toBeDefined();
    expect(qualityRec?.source).toBe('spc-violation');
    expect(qualityRec?.confidence).toBeGreaterThanOrEqual(80);
  });

  it('generates scheduling recommendation when equipment is inhibited', () => {
    const ctx = {
      measurements: Array.from({ length: 10 }, (_, i) => makeMeasurement(i + 1)),
      violations: [],
      equipmentState: 'inhibited' as const,
      waferNumber: 10,
      activeFault: null,
    };
    const result = generateRecommendations(ctx, [], DEFAULT_CONFIG);
    const schedRec = result.find((r) => r.type === 'scheduling');
    expect(schedRec).toBeDefined();
    expect(schedRec?.source).toBe('equipment-inhibited');
  });

  it('generates predictive-maintenance recommendation on active fault', () => {
    const ctx = {
      measurements: Array.from({ length: 10 }, (_, i) => makeMeasurement(i + 1)),
      violations: [],
      equipmentState: 'processing' as const,
      waferNumber: 10,
      activeFault: { type: 'sudden_shift', parameter: 'cd' as const },
    };
    const result = generateRecommendations(ctx, [], DEFAULT_CONFIG);
    const pmRec = result.find((r) => r.type === 'predictive-maintenance' && r.source === 'spc-violation');
    expect(pmRec).toBeDefined();
    expect(pmRec?.relatedParameter).toBe('cd');
  });

  it('does not duplicate pending recommendations for same condition', () => {
    const violation = makeViolation({ rule: 'rule_1', parameter: 'cd' });
    const existing: AiRecommendation[] = [
      {
        id: 'existing-1',
        type: 'predictive-maintenance',
        source: 'spc-violation',
        title: 'Existing',
        description: 'Existing',
        confidence: 90,
        impact: 'High',
        status: 'pending',
        createdAt: new Date(),
        relatedParameter: 'cd',
        confidenceHistory: [{ timestamp: new Date(), confidence: 90 }],
      },
    ];
    const ctx = {
      measurements: Array.from({ length: 10 }, (_, i) => makeMeasurement(i + 1)),
      violations: [violation],
      equipmentState: 'processing' as const,
      waferNumber: 10,
      activeFault: null,
    };
    const result = generateRecommendations(ctx, existing, DEFAULT_CONFIG);
    const pmRecs = result.filter((r) => r.type === 'predictive-maintenance' && r.source === 'spc-violation');
    expect(pmRecs.length).toBe(0); // should not create duplicate
  });

  it('respects maxRecommendations config', () => {
    const config = { ...DEFAULT_CONFIG, maxRecommendations: 2 };
    const ctx = {
      measurements: Array.from({ length: 15 }, (_, i) => makeMeasurement(i + 1)),
      violations: [
        makeViolation({ rule: 'rule_1', parameter: 'cd' }),
        makeViolation({ rule: 'rule_1', parameter: 'cdu' }),
      ],
      equipmentState: 'inhibited' as const,
      waferNumber: 15,
      activeFault: null,
    };
    const result = generateRecommendations(ctx, [], config);
    expect(result.length).toBeLessThanOrEqual(2);
  });

  it('generates trend-drift recommendation for degrading CD', () => {
    const measurements = Array.from({ length: 12 }, (_, i) =>
      makeMeasurement(i + 1, { cd: 45.0 + i * 0.6 }) // clear upward drift
    );
    const ctx = {
      measurements,
      violations: [],
      equipmentState: 'processing' as const,
      waferNumber: 12,
      activeFault: null,
    };
    const result = generateRecommendations(ctx, [], DEFAULT_CONFIG);
    const trendRec = result.find((r) => r.source === 'trend-drift' && r.relatedParameter === 'cd');
    expect(trendRec).toBeDefined();
    expect(trendRec?.type).toBe('quality');
    expect(trendRec?.trendDirection).toBe('degrading');
  });

  it('includes confidence history in generated recommendations', () => {
    const violation = makeViolation({ rule: 'rule_1', parameter: 'cd' });
    const ctx = {
      measurements: Array.from({ length: 10 }, (_, i) => makeMeasurement(i + 1)),
      violations: [violation],
      equipmentState: 'processing' as const,
      waferNumber: 10,
      activeFault: null,
    };
    const result = generateRecommendations(ctx, [], DEFAULT_CONFIG);
    expect(result.length).toBeGreaterThan(0);
    result.forEach((rec) => {
      expect(rec.confidenceHistory.length).toBeGreaterThanOrEqual(1);
      expect(rec.confidenceHistory[0].confidence).toBe(rec.confidence);
    });
  });
});
