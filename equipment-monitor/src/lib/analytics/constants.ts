// src/lib/analytics/constants.ts
import type {
  AnalyticsTab, ProcessStepId, FabId, FabConfig, RecipeKnob,
  Objective, ReplicationParam, Subsystem,
} from './types';

export const ANALYTICS_TABS: { id: AnalyticsTab; label: string }[] = [
  { id: 'vpp', label: 'VPP' },
  { id: 'apc', label: 'APC R2R' },
  { id: 'yield', label: 'Yield Forecast' },
  { id: 'reliability', label: 'Reliability' },
  { id: 'optimization', label: 'Cross-Process Opt' },
  { id: 'replication', label: 'Multi-Fab' },
];

export const PROCESS_STEPS: ProcessStepId[] = [
  'oxidation', 'lithography', 'etching', 'deposition',
  'implant', 'diffusion', 'cmp', 'metallization',
];

export const STEP_SHORT_NAMES: Record<ProcessStepId, string> = {
  oxidation: 'OX', lithography: 'LITHO', etching: 'ETCH', deposition: 'DEP',
  implant: 'IMP', diffusion: 'DIFF', cmp: 'CMP', metallization: 'MET',
};

export const DEFAULT_D0: Record<ProcessStepId, number> = {
  oxidation: 0.12, lithography: 0.25, etching: 0.18, deposition: 0.10,
  implant: 0.22, diffusion: 0.15, cmp: 0.14, metallization: 0.13,
};

export const DEFAULT_DIE_AREA = 100;
export const DEFAULT_ALPHA = 2.0;

export const DEFAULT_APC_TARGET = 100;
export const DEFAULT_LAMBDA = 0.3;
export const DEFAULT_LAMBDA_SLOPE = 0.1;
export const DEFAULT_NOISE = 1.5;

export const DEFAULT_SUBSYSTEMS: Subsystem[] = [
  { id: 'oxidation',     name: 'Oxidation',     lambda: 1.2, mu: 24 },
  { id: 'lithography',   name: 'Lithography',   lambda: 2.0, mu: 18 },
  { id: 'etching',       name: 'Etching',       lambda: 1.8, mu: 20 },
  { id: 'deposition',    name: 'Deposition',    lambda: 1.0, mu: 22 },
  { id: 'implant',       name: 'Implant',       lambda: 2.5, mu: 15 },
  { id: 'diffusion',     name: 'Diffusion',     lambda: 1.1, mu: 25 },
  { id: 'cmp',           name: 'CMP',           lambda: 1.5, mu: 20 },
  { id: 'metallization', name: 'Metal',         lambda: 1.3, mu: 22 },
];

export const BOLTZMANN_EV = 8.617333e-5;

export const OBJECTIVES: Objective[] = [
  { id: 'yield', direction: 'maximize' },
  { id: 'throughput', direction: 'maximize' },
  { id: 'cost', direction: 'minimize' },
  { id: 'defectDensity', direction: 'minimize' },
];

export const DEFAULT_RECIPE_KNOBS: RecipeKnob[] = [
  { stepId: 'oxidation',     label: 'Temp',       unit: '°C',    min: 900,  max: 1100, value: 1000 },
  { stepId: 'lithography',   label: 'Dose',       unit: 'mJ/cm²', min: 20, max: 40,   value: 30 },
  { stepId: 'etching',       label: 'Pressure',   unit: 'mTorr', min: 5,    max: 50,   value: 25 },
  { stepId: 'deposition',    label: 'Dep Rate',   unit: 'nm/s',  min: 1,    max: 6,    value: 3.2 },
  { stepId: 'implant',       label: 'Energy',     unit: 'keV',   min: 10,   max: 200,  value: 80 },
  { stepId: 'diffusion',     label: 'Anneal Temp', unit: '°C',   min: 800,  max: 1100, value: 1000 },
  { stepId: 'cmp',           label: 'Downforce',  unit: 'psi',   min: 1,    max: 7,    value: 4 },
  { stepId: 'metallization', label: 'Sputter Pwr', unit: 'kW',   min: 1,    max: 10,   value: 5 },
];

export const DEFAULT_CONSTRAINTS = {
  minYield: 85,
  maxD0: 0.5,
  minThroughput: 40,
  maxCost: 150,
};

export const FAB_CONFIGS: Record<FabId, FabConfig> = {
  hq:         { id: 'hq',         name: 'HQ Fab',        location: 'Hsinchu',   maturity: 'Mature',      bias: 0,    spreadFactor: 1.0 },
  satellite:  { id: 'satellite',  name: 'Satellite Fab',  location: 'Tainan',    maturity: 'Established', bias: 0.02, spreadFactor: 1.1 },
  'new-build': { id: 'new-build', name: 'New-Build Fab',  location: 'Kaohsiung', maturity: 'Ramping',     bias: 0.05, spreadFactor: 1.3 },
};

export const FAB_IDS: FabId[] = ['hq', 'satellite', 'new-build'];

export const REPLICATION_PARAMS: { id: ReplicationParam; label: string; unit: string; target: number; usl: number; lsl: number }[] = [
  { id: 'cd',             label: 'CD',              unit: 'nm',     target: 45,   usl: 48,   lsl: 42 },
  { id: 'overlay',        label: 'Overlay',         unit: 'nm',     target: 2.0,  usl: 3.0,  lsl: -3.0 },
  { id: 'thickness',      label: 'Film Thickness',  unit: 'nm',     target: 100,  usl: 108,  lsl: 92 },
  { id: 'dose',           label: 'Implant Dose',    unit: '×10¹²',  target: 5.0,  usl: 5.4,  lsl: 4.6 },
  { id: 'etchDepth',      label: 'Etch Depth',      unit: 'nm',     target: 200,  usl: 215,  lsl: 185 },
  { id: 'implantDepth',   label: 'Implant Depth',   unit: 'nm',     target: 60,   usl: 66,   lsl: 54 },
  { id: 'diffusionDepth', label: 'Junction Depth',  unit: 'nm',     target: 62,   usl: 68,   lsl: 56 },
  { id: 'cmpRemoval',     label: 'CMP Removal',     unit: 'nm',     target: 350,  usl: 380,  lsl: 320 },
];

export const FILM_MATERIALS: Record<ProcessStepId, { material: string; color: string; baseThickness: number }> = {
  oxidation:     { material: 'SiO₂',    color: '#60A5FA', baseThickness: 100 },
  lithography:   { material: 'Resist',   color: '#F472B6', baseThickness: 200 },
  etching:       { material: '(removed)', color: '#6B7280', baseThickness: -50 },
  deposition:    { material: 'Si₃N₄',   color: '#34D399', baseThickness: 55 },
  implant:       { material: '(doped)',   color: '#F87171', baseThickness: 0 },
  diffusion:     { material: '(annealed)', color: '#FBBF24', baseThickness: 0 },
  cmp:           { material: '(planarized)', color: '#A78BFA', baseThickness: -30 },
  metallization: { material: 'Cu',       color: '#FB923C', baseThickness: 150 },
};

// mulberry32 now lives in '@/lib/prng'. Re-exported here so existing importers
// (analytics index + engines) keep working with byte-identical output.
export { mulberry32 } from '@/lib/prng';

export function hashCode(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}
