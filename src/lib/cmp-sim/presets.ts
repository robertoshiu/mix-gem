import type { Preset } from './types';

export const PRESETS: Preset[] = [
  {
    id: 'slurry-starvation',
    label: 'Slurry Starvation',
    labelCN: '\u6F3F\u6DB2\u98E2\u9913',
    color: '#ef4444',
    apply: (params) => ({ ...params, slurryFlow: 80 }),
  },
  {
    id: 'pad-glazing',
    label: 'Pad Glazing',
    labelCN: '\u7814\u78E8\u588A\u920D\u5316',
    color: '#f59e0b',
    apply: (params) => ({ ...params, asperityDensity: 150, padStiffness: 20 }),
  },
  {
    id: 'over-polish',
    label: 'Over-Polish',
    labelCN: '\u904E\u5EA6\u7814\u78E8',
    color: '#8b5cf6',
    apply: (params) => ({ ...params, totalSteps: params.totalSteps + 40 }),
  },
  {
    id: 'downforce-imbalance',
    label: 'Down-Force Imbalance',
    labelCN: '\u4E0B\u58D3\u529B\u4E0D\u5747',
    color: '#ec4899',
    apply: (params) => ({ ...params, downForce: params.downForce * 1.8 }),
  },
  {
    id: 'retaining-ring-wear',
    label: 'Retaining Ring Wear',
    labelCN: '\u56FA\u5B9A\u74B0\u78E8\u640D',
    color: '#f97316',
    apply: (params) => ({ ...params, downForce: params.downForce * 0.6 }),
  },
  {
    id: 'slurry-ph-drift',
    label: 'Slurry pH Drift',
    labelCN: 'pH \u6F02\u79FB',
    color: '#06b6d4',
    apply: (params) => ({ ...params, slurryPh: params.slurryPh + 2 }),
  },
  {
    id: 'hydroplaning',
    label: 'Hydroplaning',
    labelCN: '\u6C34\u819C\u4E0A\u6D6E',
    color: '#3b82f6',
    apply: (params) => ({ ...params, platenRpm: 140, waferRpm: 140, slurryFlow: 450 }),
  },
  {
    id: 'pattern-density',
    label: 'Pattern Density Effect',
    labelCN: '\u5716\u6848\u5BC6\u5EA6\u6548\u61C9',
    color: '#10b981',
    apply: (params) => ({ ...params, patternDensity: 85 }),
  },
];

export function getPreset(id: string): Preset | undefined {
  return PRESETS.find((p) => p.id === id);
}
