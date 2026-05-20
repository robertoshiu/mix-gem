import type { Preset } from './types';

export const PRESETS: Preset[] = [
  {
    id: 'current-crowding',
    label: 'Current Crowding',
    labelCN: '\u96FB\u6D41\u64C1\u64E0',
    color: '#ef4444',
    apply: (params) => ({
      ...params,
      appliedCurrent: params.appliedCurrent * 1.4,
      seedThickness: params.seedThickness * 0.7,
    }),
  },
  {
    id: 'additive-depletion',
    label: 'Additive Depletion',
    labelCN: '\u6DFB\u52A0\u5291\u8017\u7D61',
    color: '#f59e0b',
    apply: (params, stepIndex) => ({
      ...params,
      additiveConc: Math.max(0.05, params.additiveConc * (1 - 0.03 * Math.min(stepIndex, 30))),
    }),
  },
  {
    id: 'seed-thinning',
    label: 'Seed Layer Thinning',
    labelCN: '\u7A2E\u5B50\u5C64\u8584\u5316',
    color: '#f97316',
    apply: (params) => ({
      ...params,
      seedThickness: params.seedThickness * 0.5,
    }),
  },
  {
    id: 'over-polish',
    label: 'Over-polish (Dishing)',
    labelCN: '\u904E\u5EA6\u62CB\u5149',
    color: '#8b5cf6',
    apply: (params) => ({
      ...params,
      padPressure: params.padPressure * 1.6,
      totalSteps: params.totalSteps + 20,
    }),
  },
  {
    id: 'under-polish',
    label: 'Under-polish (Residual Cu)',
    labelCN: '\u62CB\u5149\u4E0D\u8DB3',
    color: '#3b82f6',
    apply: (params) => ({
      ...params,
      padPressure: params.padPressure * 0.6,
    }),
  },
  {
    id: 'bath-temp-drift',
    label: 'Bath Temp Drift',
    labelCN: '\u69FD\u6EAB\u6F02\u79FB',
    color: '#10b981',
    apply: (params, stepIndex) => ({
      ...params,
      bathTemp: params.bathTemp + 15 + stepIndex * 0.5,
    }),
  },
];

export function getPreset(id: string): Preset | undefined {
  return PRESETS.find((p) => p.id === id);
}
