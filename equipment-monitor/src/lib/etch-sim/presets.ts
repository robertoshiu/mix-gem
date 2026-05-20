import type { Preset } from './types';

export const PRESETS: Preset[] = [
  {
    id: 'plasma-nonuniformity',
    label: 'Plasma Non-uniformity',
    labelCN: '\u96FB\u6F3F\u4E0D\u5747\u52FB',
    color: '#ef4444',
    apply: (params) => ({
      ...params,
      icpPower: params.icpPower * 1.3,
      chamberPressure: params.chamberPressure * 0.6,
    }),
  },
  {
    id: 'ion-bombardment',
    label: 'Ion Bombardment Damage',
    labelCN: '\u96E2\u5B50\u8F5F\u64CA\u640D\u50B7',
    color: '#f97316',
    apply: (params) => ({
      ...params,
      biasPower: params.biasPower * 1.8,
    }),
  },
  {
    id: 'micro-loading',
    label: 'Micro-loading',
    labelCN: '\u5FAE\u8CA0\u8F09\u6548\u61C9',
    color: '#f59e0b',
    apply: (params) => ({
      ...params,
      trenchWidth: params.trenchWidth * 0.5,
      aspectRatio: params.aspectRatio * 1.6,
    }),
  },
  {
    id: 'polymer-buildup',
    label: 'Polymer Buildup',
    labelCN: '\u805A\u5408\u7269\u5806\u7A4D',
    color: '#8b5cf6',
    apply: (params) => ({
      ...params,
      o2Flow: params.o2Flow * 0.3,
      cf4Flow: params.cf4Flow * 1.2,
    }),
  },
  {
    id: 'selectivity-loss',
    label: 'Selectivity Loss',
    labelCN: '\u9078\u64C7\u6BD4\u55AA\u5931',
    color: '#ec4899',
    apply: (params) => ({
      ...params,
      chamberPressure: params.chamberPressure * 0.5,
      chuckTemp: params.chuckTemp + 25,
    }),
  },
  {
    id: 'endpoint-drift',
    label: 'Endpoint Drift',
    labelCN: '\u7D42\u9EDE\u6F02\u79FB',
    color: '#10b981',
    apply: (params) => ({
      ...params,
      totalSteps: params.totalSteps + 40,
      biasPower: params.biasPower * 0.7,
    }),
  },
];

export function getPreset(id: string): Preset | undefined {
  return PRESETS.find((p) => p.id === id);
}
