import type { Preset } from './types';

export const PRESETS: Preset[] = [
  {
    id: 'dry-gate-oxide',
    label: 'Dry Gate Oxide',
    labelCN: '\u4E7E\u6C27\u95D8\u6975\u6C27\u5316',
    color: '#3b82f6',
    apply: (p) => ({ ...p, oxidationType: 'dry' as const, geometryType: 'blanket' as const, peakTemperature: 1000, soakTime: 1800, pressure: 1 }),
  },
  {
    id: 'wet-field-oxide',
    label: 'Wet Field Oxide',
    labelCN: '\u6FD5\u6C27\u5834\u6C27\u5316',
    color: '#06b6d4',
    apply: (p) => ({ ...p, oxidationType: 'wet' as const, geometryType: 'blanket' as const, peakTemperature: 1050, soakTime: 3600 }),
  },
  {
    id: 'pad-oxide',
    label: 'Pad Oxide',
    labelCN: '\u588A\u6C27\u5316\u5C64',
    color: '#64748b',
    apply: (p) => ({ ...p, oxidationType: 'dry' as const, geometryType: 'blanket' as const, peakTemperature: 900, soakTime: 600 }),
  },
  {
    id: 'locos-isolation',
    label: 'LOCOS Isolation',
    labelCN: 'LOCOS\u96A8\u96E2',
    color: '#f97316',
    apply: (p) => ({ ...p, oxidationType: 'wet' as const, geometryType: 'locos' as const, peakTemperature: 1000, soakTime: 2700, nitrideMaskWidth: 500 }),
  },
  {
    id: 'sti-liner',
    label: 'STI Liner Oxide',
    labelCN: 'STI\u896F\u6C27\u5316',
    color: '#ef4444',
    apply: (p) => ({ ...p, oxidationType: 'dry' as const, geometryType: 'sti' as const, peakTemperature: 1050, soakTime: 900, trenchDepth: 300, trenchWidth: 200 }),
  },
  {
    id: 'n2o-oxynitride',
    label: 'N\u2082O Oxynitride',
    labelCN: 'N\u2082O\u6C27\u6C2E\u5316',
    color: '#8b5cf6',
    apply: (p) => ({ ...p, oxidationType: 'n2o' as const, geometryType: 'blanket' as const, peakTemperature: 1050, soakTime: 1200 }),
  },
  {
    id: 'pyrogenic-wet',
    label: 'Pyrogenic Wet',
    labelCN: '\u71B1\u89E3\u6FD5\u6C27',
    color: '#10b981',
    apply: (p) => ({ ...p, oxidationType: 'pyrogenic' as const, geometryType: 'blanket' as const, peakTemperature: 1000, soakTime: 1800 }),
  },
  {
    id: 'hcl-gettering',
    label: 'HCl Gettering',
    labelCN: 'HCl\u53BB\u6C61\u6C27\u5316',
    color: '#eab308',
    apply: (p) => ({ ...p, oxidationType: 'hcl' as const, geometryType: 'blanket' as const, peakTemperature: 1100, soakTime: 2700, hclConcentration: 3 }),
  },
  {
    id: 'hibox-thick',
    label: 'HIBOX Thick Oxide',
    labelCN: '\u9AD8\u58D3\u539A\u6C27\u5316',
    color: '#a855f7',
    apply: (p) => ({ ...p, oxidationType: 'hibox' as const, geometryType: 'blanket' as const, peakTemperature: 950, soakTime: 1200, pressure: 10 }),
  },
  {
    id: 'thermal-stress-overshoot',
    label: 'Stress Overshoot',
    labelCN: '\u71B1\u61C9\u529B\u8D85\u6A19',
    color: '#dc2626',
    apply: (p) => ({ ...p, oxidationType: 'dry' as const, geometryType: 'sti' as const, peakTemperature: 1150, rampRate: 200, trenchDepth: 300 }),
  },
  {
    id: 'edge-nonuniformity',
    label: 'Edge Non-Uniformity',
    labelCN: '\u908A\u7DE3\u4E0D\u5747\u52FB',
    color: '#f59e0b',
    apply: (p) => ({ ...p, oxidationType: 'wet' as const, geometryType: 'blanket' as const, peakTemperature: 1000, soakTime: 1800, lampBalance: 60 }),
  },
  {
    id: 'ultra-thin-rto',
    label: 'Ultra-Thin RTO',
    labelCN: '\u8D85\u8584RTO\u95D8\u6975\u6C27\u5316',
    color: '#ec4899',
    apply: (p) => ({ ...p, oxidationType: 'dry' as const, geometryType: 'blanket' as const, peakTemperature: 1050, soakTime: 5, rampRate: 150 }),
  },
];

export function getPreset(id: string): Preset | undefined {
  return PRESETS.find((p) => p.id === id);
}
