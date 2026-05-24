import { useMesSpcStore, INITIAL_MES_SPC_STATE } from '@/stores/mes-spc-store';
import { generateSeedMeasurements } from '@/lib/mes-mock-data';
import type { SpcViolation, SecsEvent, AiRecommendation, ConfidenceSnapshot } from '@/lib/mes-types';

beforeEach(() => {
  useMesSpcStore.setState(INITIAL_MES_SPC_STATE);
});

describe('initial state', () => {
  it('has empty measurements', () => {
    expect(useMesSpcStore.getState().measurements).toHaveLength(0);
  });

  it('has equipmentState idle', () => {
    expect(useMesSpcStore.getState().equipmentState).toBe('idle');
  });
});

describe('startProcessing', () => {
  it('sets activeLotId and equipmentState to processing', () => {
    useMesSpcStore.getState().startProcessing('LOT-2026-001', 'LITHO-193nm-v4');
    const state = useMesSpcStore.getState();
    expect(state.activeLotId).toBe('LOT-2026-001');
    expect(state.equipmentState).toBe('processing');
  });
});

describe('addMeasurement', () => {
  it('appends measurement to array', () => {
    const m = generateSeedMeasurements('LOT-2026-001', 1)[0];
    useMesSpcStore.getState().addMeasurement(m);
    expect(useMesSpcStore.getState().measurements).toHaveLength(1);
  });
});

describe('addViolation', () => {
  it('appends violation and sets equipmentState to inhibited', () => {
    const v: SpcViolation = {
      id: 'v1', lotId: 'LOT-2026-001', waferNumber: 5,
      parameter: 'cd', rule: 'rule_1', value: 49.0, limit: 48.0,
      acknowledged: false, timestamp: new Date(),
    };
    useMesSpcStore.getState().addViolation(v);
    const state = useMesSpcStore.getState();
    expect(state.violations).toHaveLength(1);
    expect(state.equipmentState).toBe('inhibited');
  });
});

describe('acknowledgeViolation', () => {
  it('marks violation acknowledged and resets equipmentState', () => {
    const v: SpcViolation = {
      id: 'v1', lotId: 'LOT-2026-001', waferNumber: 5,
      parameter: 'cd', rule: 'rule_1', value: 49.0, limit: 48.0,
      acknowledged: false, timestamp: new Date(),
    };
    useMesSpcStore.setState({ violations: [v], equipmentState: 'inhibited' });
    useMesSpcStore.getState().acknowledgeViolation('v1');
    const state = useMesSpcStore.getState();
    expect(state.violations[0].acknowledged).toBe(true);
    expect(state.equipmentState).toBe('processing');
  });
});

describe('addEvent', () => {
  it('caps events at 300 for the scroll-list buffer', () => {
    const store = useMesSpcStore.getState();
    for (let i = 0; i < 305; i++) {
      const e: SecsEvent = {
        id: `e${i}`, type: 's6f11_spc_data', label: `event ${i}`,
        timestamp: new Date(), secsMessage: {},
      };
      store.addEvent(e);
    }
    expect(useMesSpcStore.getState().events).toHaveLength(300);
  });
});

describe('injectFault / clearFault', () => {
  it('sets and clears activeFault', () => {
    useMesSpcStore.getState().injectFault({ type: 'sudden_shift', parameter: 'cd', severity: 1.0, startedAtWafer: 5 });
    expect(useMesSpcStore.getState().activeFault).not.toBeNull();
    useMesSpcStore.getState().clearFault();
    expect(useMesSpcStore.getState().activeFault).toBeNull();
  });
});

function createMockRecommendation(overrides: Partial<AiRecommendation> = {}): AiRecommendation {
  return {
    id: 'rec-001',
    type: 'quality',
    source: 'trend-drift',
    title: 'Test Recommendation',
    description: 'Test description',
    confidence: 85,
    impact: 'High impact',
    status: 'pending',
    createdAt: new Date(),
    confidenceHistory: [{ timestamp: new Date(), confidence: 85 }],
    ...overrides,
  };
}

describe('AI recommendation store actions', () => {
  describe('updateRecommendationConfidence', () => {
    it('updates confidence and appends to history', () => {
      const rec = createMockRecommendation();
      useMesSpcStore.setState({ recommendations: [rec] });

      useMesSpcStore.getState().updateRecommendationConfidence('rec-001', 92);

      const state = useMesSpcStore.getState();
      expect(state.recommendations[0].confidence).toBe(92);
      expect(state.recommendations[0].confidenceHistory.length).toBe(2);
      expect(state.recommendations[0].confidenceHistory[1].confidence).toBe(92);
    });

    it('keeps history capped at 20 entries', () => {
      const history: ConfidenceSnapshot[] = Array.from({ length: 20 }, (_, i) => ({
        timestamp: new Date(Date.now() - i * 1000),
        confidence: 80 + i,
      }));
      const rec = createMockRecommendation({ confidenceHistory: history });
      useMesSpcStore.setState({ recommendations: [rec] });

      useMesSpcStore.getState().updateRecommendationConfidence('rec-001', 95);

      const state = useMesSpcStore.getState();
      expect(state.recommendations[0].confidenceHistory.length).toBe(20);
      expect(state.recommendations[0].confidenceHistory[19].confidence).toBe(95);
    });

    it('does not affect other recommendations', () => {
      const rec1 = createMockRecommendation({ id: 'rec-001', confidence: 80 });
      const rec2 = createMockRecommendation({ id: 'rec-002', confidence: 90 });
      useMesSpcStore.setState({ recommendations: [rec1, rec2] });

      useMesSpcStore.getState().updateRecommendationConfidence('rec-001', 95);

      const state = useMesSpcStore.getState();
      expect(state.recommendations[0].confidence).toBe(95);
      expect(state.recommendations[1].confidence).toBe(90);
    });
  });

  describe('supersedeRecommendation', () => {
    it('sets status to superseded and links new recommendation', () => {
      const rec = createMockRecommendation();
      useMesSpcStore.setState({ recommendations: [rec] });

      useMesSpcStore.getState().supersedeRecommendation('rec-001', 'rec-002');

      const state = useMesSpcStore.getState();
      expect(state.recommendations[0].status).toBe('superseded');
      expect(state.recommendations[0].supersededById).toBe('rec-002');
    });
  });

  describe('setAiEngineConfig', () => {
    it('merges partial config without overwriting other fields', () => {
      useMesSpcStore.getState().setAiEngineConfig({ driftThreshold: 0.5 });

      const state = useMesSpcStore.getState();
      expect(state.aiEngineConfig.driftThreshold).toBe(0.5);
      expect(state.aiEngineConfig.minDataPoints).toBe(5);
      expect(state.aiEngineConfig.maxRecommendations).toBe(10);
    });

    it('accepts multiple partial updates', () => {
      useMesSpcStore.getState().setAiEngineConfig({ analysisInterval: 5 });
      useMesSpcStore.getState().setAiEngineConfig({ maxRecommendations: 15 });

      const state = useMesSpcStore.getState();
      expect(state.aiEngineConfig.analysisInterval).toBe(5);
      expect(state.aiEngineConfig.maxRecommendations).toBe(15);
      expect(state.aiEngineConfig.driftThreshold).toBe(0.3);
    });
  });

  describe('clearStaleRecommendations', () => {
    it('removes old non-pending recommendations', () => {
      const oldRec = createMockRecommendation({
        id: 'old-001',
        status: 'applied',
        createdAt: new Date(Date.now() - 7200000),
      });
      const pendingRec = createMockRecommendation({
        id: 'pending-001',
        status: 'pending',
        createdAt: new Date(Date.now() - 7200000),
      });
      useMesSpcStore.setState({ recommendations: [oldRec, pendingRec] });

      useMesSpcStore.getState().clearStaleRecommendations(3600000);

      const state = useMesSpcStore.getState();
      expect(state.recommendations.length).toBe(1);
      expect(state.recommendations[0].id).toBe('pending-001');
    });

    it('keeps recent recommendations regardless of status', () => {
      const recentApplied = createMockRecommendation({
        id: 'recent-001',
        status: 'applied',
        createdAt: new Date(Date.now() - 1000),
      });
      useMesSpcStore.setState({ recommendations: [recentApplied] });

      useMesSpcStore.getState().clearStaleRecommendations(3600000);

      const state = useMesSpcStore.getState();
      expect(state.recommendations.length).toBe(1);
    });
  });

  describe('addRecommendation', () => {
    it('adds recommendation to list', () => {
      const rec = createMockRecommendation();
      useMesSpcStore.getState().addRecommendation(rec);

      const state = useMesSpcStore.getState();
      expect(state.recommendations.length).toBe(1);
      expect(state.recommendations[0].id).toBe('rec-001');
    });

    it('does not exceed maxRecommendations', () => {
      useMesSpcStore.setState({
        aiEngineConfig: { ...INITIAL_MES_SPC_STATE.aiEngineConfig, maxRecommendations: 2 },
      });

      const rec1 = createMockRecommendation({ id: 'rec-001' });
      const rec2 = createMockRecommendation({ id: 'rec-002' });
      const rec3 = createMockRecommendation({ id: 'rec-003' });

      useMesSpcStore.getState().addRecommendation(rec1);
      useMesSpcStore.getState().addRecommendation(rec2);
      useMesSpcStore.getState().addRecommendation(rec3);

      const state = useMesSpcStore.getState();
      expect(state.recommendations.length).toBe(2);
    });
  });

  describe('lastAnalysisTimestamp', () => {
    it('initializes as null', () => {
      const state = useMesSpcStore.getState();
      expect(state.lastAnalysisTimestamp).toBeNull();
    });

    it('can be set', () => {
      const ts = Date.now();
      useMesSpcStore.getState().setLastAnalysisTimestamp(ts);

      const state = useMesSpcStore.getState();
      expect(state.lastAnalysisTimestamp).toBe(ts);
    });
  });
});
