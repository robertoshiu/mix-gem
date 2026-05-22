import { create } from 'zustand';
import type { AnalyticsTab, DriftType, RbdTopology, ObjectiveId, ReplicationParam } from '@/lib/analytics/types';
import {
  DEFAULT_DIE_AREA, DEFAULT_ALPHA,
  DEFAULT_LAMBDA, DEFAULT_LAMBDA_SLOPE, DEFAULT_NOISE,
  DEFAULT_APC_TARGET,
} from '@/lib/analytics/constants';

interface AnalyticsState {
  activeTab: AnalyticsTab;

  // Yield
  yieldArea: number;
  yieldAlpha: number;

  // APC
  apcTarget: number;
  apcLambda: number;
  apcLambdaSlope: number;
  apcNoise: number;
  apcDriftType: DriftType;
  apcRunCount: number;

  // Reliability
  rbdTopology: RbdTopology;
  reliabilityEa: number;
  reliabilityHumidity: number;
  reliabilityUseTemp: number;

  // Optimization
  optimizationObjectives: ObjectiveId[];

  // Replication
  replicationParam: ReplicationParam;
  replicationMargin: number;
  replicationConfidence: number;
  replicationSampleSize: number;

  // Actions
  setTab: (tab: AnalyticsTab) => void;
  setYieldArea: (area: number) => void;
  setYieldAlpha: (alpha: number) => void;
  setApcLambda: (lambda: number) => void;
  setApcLambdaSlope: (lambdaSlope: number) => void;
  setApcDriftType: (drift: DriftType) => void;
  setApcRunCount: (count: number) => void;
  setRbdTopology: (topology: RbdTopology) => void;
  setReliabilityEa: (ea: number) => void;
  setOptimizationObjectives: (objectives: ObjectiveId[]) => void;
  setReplicationParam: (param: ReplicationParam) => void;
  setReplicationMargin: (margin: number) => void;
  setReplicationSampleSize: (size: number) => void;
}

export const INITIAL_ANALYTICS_STATE: Omit<AnalyticsState,
  | 'setTab' | 'setYieldArea' | 'setYieldAlpha'
  | 'setApcLambda' | 'setApcLambdaSlope' | 'setApcDriftType' | 'setApcRunCount'
  | 'setRbdTopology' | 'setReliabilityEa'
  | 'setOptimizationObjectives'
  | 'setReplicationParam' | 'setReplicationMargin' | 'setReplicationSampleSize'
> = {
  activeTab: 'yield',
  yieldArea: DEFAULT_DIE_AREA,
  yieldAlpha: DEFAULT_ALPHA,
  apcTarget: DEFAULT_APC_TARGET,
  apcLambda: DEFAULT_LAMBDA,
  apcLambdaSlope: DEFAULT_LAMBDA_SLOPE,
  apcNoise: DEFAULT_NOISE,
  apcDriftType: 'none',
  apcRunCount: 50,
  rbdTopology: 'series',
  reliabilityEa: 0.7,
  reliabilityHumidity: 0,
  reliabilityUseTemp: 65,
  optimizationObjectives: ['yield', 'throughput'],
  replicationParam: 'cd',
  replicationMargin: 2,
  replicationConfidence: 0.95,
  replicationSampleSize: 50,
};

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  ...INITIAL_ANALYTICS_STATE,
  setTab: (tab) => set({ activeTab: tab }),
  setYieldArea: (area) => set({ yieldArea: area }),
  setYieldAlpha: (alpha) => set({ yieldAlpha: alpha }),
  setApcLambda: (lambda) => set({ apcLambda: lambda }),
  setApcLambdaSlope: (lambdaSlope) => set({ apcLambdaSlope: lambdaSlope }),
  setApcDriftType: (drift) => set({ apcDriftType: drift }),
  setApcRunCount: (count) => set({ apcRunCount: count }),
  setRbdTopology: (topology) => set({ rbdTopology: topology }),
  setReliabilityEa: (ea) => set({ reliabilityEa: ea }),
  setOptimizationObjectives: (objectives) => set({ optimizationObjectives: objectives }),
  setReplicationParam: (param) => set({ replicationParam: param }),
  setReplicationMargin: (margin) => set({ replicationMargin: margin }),
  setReplicationSampleSize: (size) => set({ replicationSampleSize: size }),
}));
