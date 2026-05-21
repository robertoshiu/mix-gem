import type { Preset } from './types';

export const PRESETS: Preset[] = [
  {
    id: 'channeling-implant',
    label: 'Channeling Implant',
    labelCN: '\u901A\u9053\u6548\u61C9\u690D\u5165',
    color: '#3b82f6',
    apply: (p) => ({ ...p, tiltAngle: 0, twistAngle: 0, ionSpecies: 'B', beamEnergy: 50 }),
  },
  {
    id: 'high-dose-amorphization',
    label: 'High-Dose Amorphization',
    labelCN: '\u9AD8\u5291\u91CF\u975E\u6676\u5316',
    color: '#ef4444',
    apply: (p) => ({ ...p, ionSpecies: 'As', beamEnergy: 80, dose: 1e15 }),
  },
  {
    id: 'implant-through-oxide',
    label: 'Implant Through Oxide',
    labelCN: '\u7A7F\u6C27\u5316\u7269\u690D\u5165',
    color: '#f59e0b',
    apply: (p) => ({ ...p, screenOxideThickness: 30, ionSpecies: 'B', beamEnergy: 30 }),
  },
  {
    id: 'shallow-junction',
    label: 'Shallow Junction',
    labelCN: '\u6DFA\u63A5\u9762',
    color: '#8b5cf6',
    apply: (p) => ({ ...p, ionSpecies: 'BF2', beamEnergy: 5, tiltAngle: 7 }),
  },
  {
    id: 'retrograde-well',
    label: 'Retrograde Well',
    labelCN: '\u9006\u884C\u4E95',
    color: '#06b6d4',
    apply: (p) => ({ ...p, ionSpecies: 'P', beamEnergy: 400, dose: 5e12 }),
  },
  {
    id: 'dose-rate-heating',
    label: 'Dose-Rate Heating',
    labelCN: '\u5291\u91CF\u7387\u52A0\u71B1',
    color: '#f97316',
    apply: (p) => ({ ...p, beamCurrent: 18, substrateTemperature: 200, damageAnnealingRate: 0.5 }),
  },
  {
    id: 'resist-punch-through',
    label: 'Resist Punch-Through',
    labelCN: '\u5149\u963B\u7A7F\u900F',
    color: '#ec4899',
    apply: (p) => ({ ...p, photoresistThickness: 200, ionSpecies: 'P', beamEnergy: 200 }),
  },
  {
    id: 'pre-amorphization',
    label: 'Pre-Amorphization (PAI)',
    labelCN: '\u9810\u975E\u6676\u5316',
    color: '#10b981',
    apply: (p) => ({ ...p, ionSpecies: 'B', beamEnergy: 3, tiltAngle: 0, amorphizationThreshold: 3 }),
  },
  {
    id: 'twin-well-cmos',
    label: 'Twin-Well CMOS',
    labelCN: '\u96D9\u4E95CMOS',
    color: '#6366f1',
    apply: (p) => ({ ...p, ionSpecies: 'P', beamEnergy: 600, dose: 1e13 }),
  },
  {
    id: 'high-tilt-halo',
    label: 'High-Tilt Halo',
    labelCN: '\u5927\u50BE\u659C\u66C8\u5708\u690D\u5165',
    color: '#a855f7',
    apply: (p) => ({ ...p, ionSpecies: 'B', beamEnergy: 30, tiltAngle: 45, twistAngle: 0 }),
  },
];

export function getPreset(id: string): Preset | undefined {
  return PRESETS.find((p) => p.id === id);
}
