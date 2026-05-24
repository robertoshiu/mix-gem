import type {
  AggregatedMeasurement,
  AiRecommendation,
  AiRecommendationEngineConfig,
  ConfidenceSnapshot,
  CUSUMResult,
  EWMAResult,
  TrendSignal,
  SpcCapabilityResult,
  SpcParameter,
} from '@/lib/mes-types';

type SliceSetter<TState> = (fn: (state: TState) => Partial<TState>) => void;

// ── Initial State ──────────────────────────────────────────────────

export const INITIAL_TREND_STATE = {
  recommendations: [] as AiRecommendation[],
  aiEngineConfig: {
    driftThreshold: 0.3,
    minDataPoints: 5,
    confidenceDecayRate: 0.5,
    maxRecommendations: 10,
    analysisInterval: 3,
  } as AiRecommendationEngineConfig,
  lastAnalysisTimestamp: null as number | null,
  hourlyAggregates: [] as AggregatedMeasurement[],
  capabilityResults: {
    cd: null,
    cdu: null,
    ovl_x: null,
    ovl_y: null,
    ler: null,
  } as Record<SpcParameter, SpcCapabilityResult | null>,
  cusumResults: {
    cd: null, cdu: null, ovl_x: null, ovl_y: null, ler: null,
  } as Record<SpcParameter, CUSUMResult | null>,
  ewmaResults: {
    cd: null, cdu: null, ovl_x: null, ovl_y: null, ler: null,
  } as Record<SpcParameter, EWMAResult | null>,
  trendSignals: [] as TrendSignal[],
};

// ── Type Definitions ───────────────────────────────────────────────

export interface TrendSliceState {
  recommendations: AiRecommendation[];
  aiEngineConfig: AiRecommendationEngineConfig;
  lastAnalysisTimestamp: number | null;
  hourlyAggregates: AggregatedMeasurement[];
  capabilityResults: Record<SpcParameter, SpcCapabilityResult | null>;
  cusumResults: Record<SpcParameter, CUSUMResult | null>;
  ewmaResults: Record<SpcParameter, EWMAResult | null>;
  trendSignals: TrendSignal[];
}

export interface TrendSliceActions {
  addRecommendation: (r: AiRecommendation) => void;
  applyRecommendation: (id: string) => void;
  overrideRecommendation: (id: string) => void;
  updateRecommendationConfidence: (id: string, confidence: number) => void;
  supersedeRecommendation: (supersededId: string, newRecId: string) => void;
  clearStaleRecommendations: (maxAgeMs?: number) => void;
  setAiEngineConfig: (patch: Partial<AiRecommendationEngineConfig>) => void;
  setLastAnalysisTimestamp: (ts: number) => void;
  setHourlyAggregates: (aggregates: AggregatedMeasurement[]) => void;
  setCapabilityResult: (param: SpcParameter, result: SpcCapabilityResult | null) => void;
  setCUSUMResult: (param: SpcParameter, result: CUSUMResult | null) => void;
  setEWMAResult: (param: SpcParameter, result: EWMAResult | null) => void;
  addTrendSignal: (signal: TrendSignal) => void;
}

export type TrendSlice = TrendSliceState & TrendSliceActions;

// ── Slice Creator ──────────────────────────────────────────────────

export const createTrendSlice = (
  set: SliceSetter<TrendSliceState>,
): TrendSlice => ({
  ...INITIAL_TREND_STATE,

  addRecommendation: (r) =>
    set((s: TrendSliceState) => {
      if (s.recommendations.length >= s.aiEngineConfig.maxRecommendations) {
        return s;
      }
      return { recommendations: [...s.recommendations, r] };
    }),

  applyRecommendation: (id) =>
    set((s: TrendSliceState) => ({
      recommendations: s.recommendations.map((r) =>
        r.id === id ? { ...r, status: 'applied' as const } : r,
      ),
    })),

  overrideRecommendation: (id) =>
    set((s: TrendSliceState) => ({
      recommendations: s.recommendations.map((r) =>
        r.id === id ? { ...r, status: 'overridden' as const } : r,
      ),
    })),

  updateRecommendationConfidence: (id, confidence) =>
    set((s: TrendSliceState) => ({
      recommendations: s.recommendations.map((r) => {
        if (r.id !== id) return r;
        const snapshot: ConfidenceSnapshot = {
          timestamp: new Date(),
          confidence,
        };
        return {
          ...r,
          confidence,
          confidenceHistory: [...r.confidenceHistory, snapshot].slice(-20),
        };
      }),
    })),

  supersedeRecommendation: (supersededId, newRecId) =>
    set((s: TrendSliceState) => ({
      recommendations: s.recommendations.map((r) =>
        r.id === supersededId
          ? { ...r, status: 'superseded' as const, supersededById: newRecId }
          : r,
      ),
    })),

  clearStaleRecommendations: (maxAgeMs = 3600000) =>
    set((s: TrendSliceState) => ({
      recommendations: s.recommendations.filter((r) => {
        const age = Date.now() - r.createdAt.getTime();
        return r.status === 'pending' || age < maxAgeMs;
      }),
    })),

  setAiEngineConfig: (patch) =>
    set((s: TrendSliceState) => ({
      aiEngineConfig: { ...s.aiEngineConfig, ...patch },
    })),

  setLastAnalysisTimestamp: (ts) => set(() => ({ lastAnalysisTimestamp: ts })),

  setHourlyAggregates: (aggregates) => set(() => ({ hourlyAggregates: aggregates })),

  setCapabilityResult: (param, result) =>
    set((s: TrendSliceState) => ({
      capabilityResults: { ...s.capabilityResults, [param]: result },
    })),

  setCUSUMResult: (param, result) =>
    set((s: TrendSliceState) => ({
      cusumResults: { ...s.cusumResults, [param]: result },
    })),

  setEWMAResult: (param, result) =>
    set((s: TrendSliceState) => ({
      ewmaResults: { ...s.ewmaResults, [param]: result },
    })),

  addTrendSignal: (signal) =>
    set((s: TrendSliceState) => ({
      trendSignals: [...s.trendSignals, signal],
    })),
});
