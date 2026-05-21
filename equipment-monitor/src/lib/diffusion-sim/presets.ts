import type { Preset } from './types';

export const PRESETS: Preset[] = [
  {
    id: 'furnace-drive-in',
    label: 'Furnace Drive-In',
    labelCN: '\u7210\u7BA1\u63A8\u9032',
    color: '#f97316',
    apply: (p) => ({ ...p, thermalMode: 'furnace' as const, peakTemperature: 1050, soakTime: 3600, dopantSpecies: 'B' as const, ambientGas: 'N2' as const, rampRate: 5, coolingRate: 3 }),
  },
  {
    id: 'rta-activation',
    label: 'RTA Activation',
    labelCN: '\u5FEB\u901F\u71B1\u9000\u706B\u6D3B\u5316',
    color: '#ef4444',
    apply: (p) => ({ ...p, thermalMode: 'rta' as const, peakTemperature: 1050, soakTime: 10, dopantSpecies: 'As' as const, ambientGas: 'N2' as const, rampRate: 100 }),
  },
  {
    id: 'spike-anneal',
    label: 'Spike Anneal',
    labelCN: '\u5C16\u5CF0\u9000\u706B',
    color: '#f59e0b',
    apply: (p) => ({ ...p, thermalMode: 'spike' as const, peakTemperature: 1080, soakTime: 0, dopantSpecies: 'B' as const, ambientGas: 'N2' as const }),
  },
  {
    id: 'flash-anneal',
    label: 'Flash Anneal',
    labelCN: '\u9583\u5149\u9000\u706B',
    color: '#eab308',
    apply: (p) => ({ ...p, thermalMode: 'flash' as const, peakTemperature: 1300, soakTime: 0.002, dopantSpecies: 'B' as const, ambientGas: 'N2' as const }),
  },
  {
    id: 'laser-anneal',
    label: 'Laser Anneal',
    labelCN: '\u6FC0\u5149\u9000\u706B',
    color: '#06b6d4',
    apply: (p) => ({ ...p, thermalMode: 'laser' as const, peakTemperature: 1400, soakTime: 0.0005, dopantSpecies: 'As' as const, ambientGas: 'N2' as const }),
  },
  {
    id: 'ted-showcase',
    label: 'TED Showcase',
    labelCN: '\u66AB\u614B\u589E\u5F37\u64F4\u6563',
    color: '#8b5cf6',
    apply: (p) => ({ ...p, thermalMode: 'rta' as const, peakTemperature: 800, soakTime: 60, dopantSpecies: 'B' as const, interstitialFactor: 5, ambientGas: 'N2' as const }),
  },
  {
    id: 'oed-effect',
    label: 'OED Effect',
    labelCN: '\u6C27\u5316\u589E\u5F37\u64F4\u6563',
    color: '#10b981',
    apply: (p) => ({ ...p, thermalMode: 'furnace' as const, peakTemperature: 1000, soakTime: 1800, dopantSpecies: 'B' as const, ambientGas: 'O2' as const, rampRate: 5, coolingRate: 3 }),
  },
  {
    id: 'retrograde-well',
    label: 'Retrograde Well',
    labelCN: '\u9006\u884C\u4E95',
    color: '#3b82f6',
    apply: (p) => ({ ...p, thermalMode: 'rta' as const, peakTemperature: 1050, soakTime: 15, dopantSpecies: 'In' as const, initialDose: 1e13, initialDepth: 300 }),
  },
  {
    id: 'dopant-pile-up',
    label: 'Dopant Pile-Up',
    labelCN: '\u96DC\u8CEA\u5806\u7A4D',
    color: '#ec4899',
    apply: (p) => ({ ...p, thermalMode: 'furnace' as const, peakTemperature: 1100, soakTime: 1800, dopantSpecies: 'B' as const, screenOxideThickness: 30, rampRate: 5, coolingRate: 3 }),
  },
  {
    id: 'high-conc-clustering',
    label: 'High-Conc Clustering',
    labelCN: '\u9AD8\u6FC3\u5EA6\u5718\u7C07',
    color: '#a855f7',
    apply: (p) => ({ ...p, thermalMode: 'rta' as const, peakTemperature: 1000, soakTime: 20, dopantSpecies: 'As' as const, initialDose: 1e16, clusteringThreshold: 5e19 }),
  },
  {
    id: 'co-diffusion',
    label: 'Co-Diffusion',
    labelCN: '\u5171\u64F4\u6563',
    color: '#6366f1',
    apply: (p) => ({ ...p, thermalMode: 'furnace' as const, peakTemperature: 1050, soakTime: 3600, dopantSpecies: 'P' as const, backgroundDoping: 1e16, rampRate: 5, coolingRate: 3 }),
  },
  {
    id: 'thermal-budget-overshoot',
    label: 'Budget Overshoot',
    labelCN: '\u71B1\u9810\u7B97\u8D85\u6A19',
    color: '#dc2626',
    apply: (p) => ({ ...p, thermalMode: 'furnace' as const, peakTemperature: 1150, soakTime: 7200, dopantSpecies: 'B' as const, rampRate: 5, coolingRate: 3 }),
  },
];

export function getPreset(id: string): Preset | undefined {
  return PRESETS.find((p) => p.id === id);
}
