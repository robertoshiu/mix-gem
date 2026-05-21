import type { SimulationParams, DopantSpecies, ThermalMode } from './types';

// ─── Physical Constants ───
export const BOLTZMANN_EV = 8.617e-5;
export const ELECTRON_CHARGE = 1.602e-19;
export const SI_LATTICE_DENSITY = 5.0e22;
export const SI_LATTICE_SPACING = 0.235;
export const T_AMBIENT = 25;

// ─── Simulation Grid ───
export const DEPTH_BINS = 200;
export const DEFAULT_TOTAL_STEPS = 200;

// ─── Point Defect Formation Energies ───
export const E_FORM_V = 2.0;
export const E_FORM_I = 3.0;
export const C_EQUIL_PREFACTOR = 5.0e22;
export const E_RECOMBINATION = 0.5;
export const D_DEFECT_PREFACTOR = 1.0e-3;
export const E_DEFECT_MIGRATION = 0.5;

// ─── {311} Defect Dissolution ───
export const E_311 = 3.6;
export const TAU_311_0 = 1e-13;

// ─── OED Parameters ───
export const K_OX_DRY = 0.01;
export const K_OX_WET = 0.1;

// ─── Intrinsic Carrier Concentration ───
export const NI_PREFACTOR = 3.87e16;
export const NI_ACTIVATION = 0.605;

// ─── Dopant Database ───
export interface DopantData {
  symbol: string;
  dI: { d0: number; ea: number }[];
  dV: { d0: number; ea: number }[];
  fI: number;
  cSol0: number;
  eSol: number;
  segregationCoeff: number;
  rangeCoeff: number;
  straggleRatio: number;
  isNtype: boolean;
  color: string;
}

export const DOPANT_DB: Record<DopantSpecies, DopantData> = {
  B: {
    symbol: 'B',
    dI: [
      { d0: 0.037, ea: 3.46 },
      { d0: 0.72,  ea: 3.46 },
      { d0: 0,     ea: 0 },
      { d0: 0,     ea: 0 },
    ],
    dV: [
      { d0: 0, ea: 0 },
      { d0: 0, ea: 0 },
      { d0: 0, ea: 0 },
      { d0: 0, ea: 0 },
    ],
    fI: 1.0,
    cSol0: 5.5e23, eSol: 0.73,
    segregationCoeff: 0.3,
    rangeCoeff: 1.0, straggleRatio: 0.4,
    isNtype: false,
    color: '#3b82f6',
  },
  P: {
    symbol: 'P',
    dI: [
      { d0: 3.85, ea: 3.66 },
      { d0: 0,    ea: 0 },
      { d0: 0,    ea: 0 },
      { d0: 0,    ea: 0 },
    ],
    dV: [
      { d0: 0,    ea: 0 },
      { d0: 0,    ea: 0 },
      { d0: 3.85, ea: 3.66 },
      { d0: 0,    ea: 0 },
    ],
    fI: 0.5,
    cSol0: 2.5e23, eSol: 0.62,
    segregationCoeff: 10,
    rangeCoeff: 0.6, straggleRatio: 0.35,
    isNtype: true,
    color: '#22c55e',
  },
  As: {
    symbol: 'As',
    dI: [
      { d0: 0, ea: 0 },
      { d0: 0, ea: 0 },
      { d0: 0, ea: 0 },
      { d0: 0, ea: 0 },
    ],
    dV: [
      { d0: 0.066, ea: 3.44 },
      { d0: 0,     ea: 0 },
      { d0: 12.0,  ea: 4.05 },
      { d0: 0,     ea: 0 },
    ],
    fI: 0.3,
    cSol0: 1.5e23, eSol: 0.42,
    segregationCoeff: 10,
    rangeCoeff: 0.3, straggleRatio: 0.3,
    isNtype: true,
    color: '#ef4444',
  },
  Sb: {
    symbol: 'Sb',
    dI: [
      { d0: 0, ea: 0 },
      { d0: 0, ea: 0 },
      { d0: 0, ea: 0 },
      { d0: 0, ea: 0 },
    ],
    dV: [
      { d0: 0.214, ea: 3.65 },
      { d0: 0,     ea: 0 },
      { d0: 15.0,  ea: 4.08 },
      { d0: 0,     ea: 0 },
    ],
    fI: 0.0,
    cSol0: 8.0e22, eSol: 0.40,
    segregationCoeff: 10,
    rangeCoeff: 0.2, straggleRatio: 0.25,
    isNtype: true,
    color: '#f97316',
  },
  In: {
    symbol: 'In',
    dI: [
      { d0: 0.6, ea: 3.5 },
      { d0: 0,   ea: 0 },
      { d0: 1.2, ea: 3.9 },
      { d0: 0,   ea: 0 },
    ],
    dV: [
      { d0: 0, ea: 0 },
      { d0: 0, ea: 0 },
      { d0: 0, ea: 0 },
      { d0: 0, ea: 0 },
    ],
    fI: 1.0,
    cSol0: 1.0e22, eSol: 0.50,
    segregationCoeff: 0.5,
    rangeCoeff: 0.15, straggleRatio: 0.25,
    isNtype: false,
    color: '#8b5cf6',
  },
  Ge: {
    symbol: 'Ge',
    dI: [
      { d0: 6.2, ea: 5.28 },
      { d0: 0,   ea: 0 },
      { d0: 0,   ea: 0 },
      { d0: 0,   ea: 0 },
    ],
    dV: [
      { d0: 0.28, ea: 4.65 },
      { d0: 0,    ea: 0 },
      { d0: 0,    ea: 0 },
      { d0: 0,    ea: 0 },
    ],
    fI: 0.5,
    cSol0: 1e24, eSol: 0.0,
    segregationCoeff: 1.0,
    rangeCoeff: 0.25, straggleRatio: 0.3,
    isNtype: false,
    color: '#6b7280',
  },
};

// ─── Thermal Mode Timescale Configuration ───
export interface ThermalModeConfig {
  label: string;
  labelCN: string;
  typicalDt: number;
  totalTimeScale: number;
}

export const THERMAL_MODES: Record<ThermalMode, ThermalModeConfig> = {
  furnace: { label: 'Furnace',  labelCN: '爐管退火', typicalDt: 9,      totalTimeScale: 1800 },
  rta:     { label: 'RTA',      labelCN: '快速熱退火', typicalDt: 0.1,    totalTimeScale: 20 },
  spike:   { label: 'Spike',    labelCN: '尖峰退火', typicalDt: 0.01,   totalTimeScale: 2 },
  flash:   { label: 'Flash',    labelCN: '閃光退火', typicalDt: 2.5e-5, totalTimeScale: 0.005 },
  laser:   { label: 'Laser',    labelCN: '激光退火', typicalDt: 2.5e-6, totalTimeScale: 0.0005 },
};

// ─── Masetti Mobility Parameters ───
export const MASETTI_ELECTRONS = {
  muMin: 52.2, muMax: 1417, cRef: 9.68e16, alpha: 0.68,
  mu1: 43.4, cRef2: 3.43e20, beta: 2.0,
};
export const MASETTI_HOLES = {
  muMin: 44.9, muMax: 470.5, cRef: 2.23e17, alpha: 0.719,
  mu1: 29.0, cRef2: 6.1e20, beta: 2.0,
};

// ─── Depth Estimation ───
export function estimateMaxDepth(species: DopantSpecies, depthNm: number): number {
  return Math.max(200, depthNm * 5);
}

// ─── Parameter Bounds ───
export const PARAM_BOUNDS = {
  peakTemperature:      { min: 700,  max: 1410, default: 1000, step: 10,   unit: '°C',        label: 'Peak T' },
  rampRate:             { min: -1,   max: 6,    default: 1.7,  step: 0.1,  unit: '°C/s',      label: 'Ramp Rate', isLog: true },
  soakTime:             { min: -4,   max: 3.86, default: 1.48, step: 0.1,  unit: 's',         label: 'Soak Time', isLog: true },
  coolingRate:          { min: -1,   max: 6,    default: 1.7,  step: 0.1,  unit: '°C/s',      label: 'Cool Rate', isLog: true },
  initialDose:          { min: 12,   max: 16,   default: 14,   step: 0.1,  unit: 'cm⁻²',      label: 'Dose (10ˣ)', isLog: true },
  initialDepth:         { min: 5,    max: 500,  default: 50,   step: 5,    unit: 'nm',        label: 'Init Depth' },
  screenOxideThickness: { min: 0,    max: 50,   default: 5,    step: 1,    unit: 'nm',        label: 'Screen Oxide' },
  backgroundDoping:     { min: 14,   max: 17,   default: 15,   step: 0.1,  unit: 'cm⁻³',      label: 'Bg Doping (10ˣ)', isLog: true },
  interstitialFactor:   { min: 0.1,  max: 10,   default: 1.0,  step: 0.1,  unit: '×',         label: 'I Factor' },
  vacancyFactor:        { min: 0.1,  max: 10,   default: 1.0,  step: 0.1,  unit: '×',         label: 'V Factor' },
  clusteringThreshold:  { min: 19,   max: 21,   default: 20,   step: 0.1,  unit: 'cm⁻³',      label: 'Cluster (10ˣ)', isLog: true },
} as const;

export const DEFAULT_PARAMS: SimulationParams = {
  peakTemperature: PARAM_BOUNDS.peakTemperature.default,
  rampRate: Math.pow(10, PARAM_BOUNDS.rampRate.default),
  soakTime: Math.pow(10, PARAM_BOUNDS.soakTime.default),
  coolingRate: Math.pow(10, PARAM_BOUNDS.coolingRate.default),
  dopantSpecies: 'B',
  thermalMode: 'rta',
  ambientGas: 'N2',
  initialDose: Math.pow(10, PARAM_BOUNDS.initialDose.default),
  initialDepth: PARAM_BOUNDS.initialDepth.default,
  screenOxideThickness: PARAM_BOUNDS.screenOxideThickness.default,
  substrateOrientation: '100',
  backgroundDoping: Math.pow(10, PARAM_BOUNDS.backgroundDoping.default),
  interstitialFactor: PARAM_BOUNDS.interstitialFactor.default,
  vacancyFactor: PARAM_BOUNDS.vacancyFactor.default,
  clusteringThreshold: Math.pow(10, PARAM_BOUNDS.clusteringThreshold.default),
  totalSteps: DEFAULT_TOTAL_STEPS,
};

// ─── Seeded PRNG ───
export function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
