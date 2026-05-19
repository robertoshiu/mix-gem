// equipment-monitor/src/lib/lens-sim/presets.ts
import type { Preset, SimulationParams } from './types';
import { DEFAULT_PARAMS } from './constants';

export const PRESETS: Preset[] = [
  {
    id: 'cooling-failure',
    label: 'Cooling Failure',
    labelCN: '\u51B7\u5374\u5931\u6548',
    color: '#ef4444',
    apply: (params) => ({ ...params, coolingPower: 0 }),
  },
  {
    id: 'flow-drop',
    label: 'Flow Rate Drop',
    labelCN: '\u6D41\u91CF\u4E0B\u964D',
    color: '#f59e0b',
    apply: (params) => ({ ...params, fluidFlowRate: 0.3 }),
  },
  {
    id: 'dose-drift',
    label: 'Dose Drift +15%',
    labelCN: '\u5242\u91CF\u6F02\u79FB',
    color: '#f97316',
    apply: (params, waferIndex) => ({
      ...params,
      dose: params.dose * (1 + 0.15 * Math.min((waferIndex + 1) / 5, 1)),
    }),
  },
  {
    id: 'cold-start',
    label: 'Cold Start',
    labelCN: '\u51B7\u542F\u52A8',
    color: '#3b82f6',
    apply: () => ({ ...DEFAULT_PARAMS }),
  },
];

export function getPreset(id: string): Preset | undefined {
  return PRESETS.find((p) => p.id === id);
}
