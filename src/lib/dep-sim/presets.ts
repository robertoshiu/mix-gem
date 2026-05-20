import type { Preset } from './types';
import { DEFAULT_PARAMS } from './constants';

export const PRESETS: Preset[] = [
  {
    id: 'precursor-starvation',
    label: 'Precursor Starvation',
    labelCN: '\u524D\u9A45\u7269\u8655\u7F3A',
    color: '#ef4444',
    apply: (params) => ({ ...params, bdeasFlowRate: params.bdeasFlowRate * 0.4 }),
  },
  {
    id: 'purge-leak-through',
    label: 'Purge Leak-Through',
    labelCN: '\u5439\u6383\u6B98\u7559',
    color: '#f59e0b',
    apply: (params) => ({ ...params, purgeTime: params.purgeTime * 0.3 }),
  },
  {
    id: 'temperature-excursion',
    label: 'Temperature Excursion',
    labelCN: '\u6EAB\u5EA6\u5931\u63A7',
    color: '#f97316',
    apply: (params) => ({ ...params, pedestalTemp: params.pedestalTemp + 80 }),
  },
  {
    id: 'o3-degradation',
    label: 'O\u2083 Generator Degradation',
    labelCN: '\u81ED\u6C27\u8870\u6E1B',
    color: '#8b5cf6',
    apply: (params, cycleIndex) => ({
      ...params,
      o3FlowRate: params.o3FlowRate * Math.max(0.2, 1 - 0.05 * Math.min(cycleIndex, 16)),
    }),
  },
  {
    id: 'chamber-seasoning',
    label: 'Chamber Seasoning Drift',
    labelCN: '\u8155\u9AD4\u8ABF\u8CEA\u6F02\u79FB',
    color: '#3b82f6',
    apply: (params) => ({ ...DEFAULT_PARAMS, totalCycles: params.totalCycles }),
  },
];

export function getPreset(id: string): Preset | undefined {
  return PRESETS.find((p) => p.id === id);
}
