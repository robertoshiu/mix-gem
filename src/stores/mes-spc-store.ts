import { create } from 'zustand';
import {
  createSpcSlice,
  type SpcSlice,
  type SpcSliceActions,
  INITIAL_SPC_STATE,
} from './spc/spcSlice';
import {
  createGemSlice,
  type GemSlice,
  type GemSliceActions,
  INITIAL_GEM_STATE,
} from './spc/gemSlice';
import {
  createTrendSlice,
  type TrendSlice,
  type TrendSliceActions,
  INITIAL_TREND_STATE,
} from './spc/trendSlice';
import {
  createAlarmSlice,
  type AlarmSlice,
  type AlarmSliceActions,
  INITIAL_ALARM_STATE,
} from './spc/alarmSlice';

// ── Combined State Type ────────────────────────────────────────────

export type MesSpcState = SpcSlice & GemSlice & TrendSlice & AlarmSlice;

// ── Store ──────────────────────────────────────────────────────────

export const useMesSpcStore = create<MesSpcState>()((...args) => ({
  ...createSpcSlice(args[0]),
  ...createGemSlice(args[0]),
  ...createTrendSlice(args[0]),
  ...createAlarmSlice(args[0]),
}));

// ── Initial State (for tests / reset) ──────────────────────────────

type ActionKeys = keyof (SpcSliceActions & GemSliceActions & TrendSliceActions & AlarmSliceActions);

export const INITIAL_MES_SPC_STATE: Omit<MesSpcState, ActionKeys> = {
  ...INITIAL_SPC_STATE,
  ...INITIAL_GEM_STATE,
  ...INITIAL_TREND_STATE,
  ...INITIAL_ALARM_STATE,
} as Omit<MesSpcState, ActionKeys>;
