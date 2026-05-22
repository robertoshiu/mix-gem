// src/lib/analytics/vpp-constants.ts
import type { ProcessStepId, SubstrateType, DefectSource, DopantSpeciesId } from './types';

// ── Substrate Mechanical Properties ──
export interface SubstrateProperties {
  E: number;
  nu: number;
  alpha: number;
  yieldStrength: number;
}

export const SUBSTRATE_PROPERTIES: Record<SubstrateType, SubstrateProperties> = {
  'Si(100)': { E: 130, nu: 0.28, alpha: 2.6e-6, yieldStrength: 7000 },
  'Si(111)': { E: 187, nu: 0.26, alpha: 2.6e-6, yieldStrength: 7000 },
  'SiGe':    { E: 120, nu: 0.27, alpha: 3.5e-6, yieldStrength: 5000 },
  'SOI':     { E: 130, nu: 0.28, alpha: 2.6e-6, yieldStrength: 7000 },
};

// ── Film Stress Properties ──
export interface FilmStressProperties {
  intrinsicStress: number;
  cte: number;
  E: number;
  nu: number;
  yieldStrength: number;
}

export const FILM_STRESS_PROPERTIES: Record<ProcessStepId, FilmStressProperties> = {
  oxidation:     { intrinsicStress: -300, cte: 0.5e-6,  E: 70,  nu: 0.17, yieldStrength: 8400 },
  lithography:   { intrinsicStress: 0,    cte: 60e-6,   E: 3,   nu: 0.35, yieldStrength: 50 },
  etching:       { intrinsicStress: 0,    cte: 0,        E: 0,   nu: 0,    yieldStrength: 0 },
  deposition:    { intrinsicStress: 200,  cte: 3.0e-6,  E: 250, nu: 0.23, yieldStrength: 14000 },
  implant:       { intrinsicStress: 0,    cte: 0,        E: 0,   nu: 0,    yieldStrength: 0 },
  diffusion:     { intrinsicStress: 0,    cte: 0,        E: 0,   nu: 0,    yieldStrength: 0 },
  cmp:           { intrinsicStress: 0,    cte: 0,        E: 0,   nu: 0,    yieldStrength: 0 },
  metallization: { intrinsicStress: 100,  cte: 17e-6,   E: 120, nu: 0.34, yieldStrength: 250 },
};

// ── Default Process Times (seconds) ──
export const DEFAULT_PROCESS_TIMES: Record<ProcessStepId, number> = {
  oxidation: 3600,
  lithography: 30,
  etching: 120,
  deposition: 300,
  implant: 60,
  diffusion: 1800,
  cmp: 180,
  metallization: 600,
};

// ── Process Temperatures (°C) ──
export const DEFAULT_PROCESS_TEMPS: Record<ProcessStepId, number> = {
  oxidation: 1000,
  lithography: 25,
  etching: 25,
  deposition: 350,
  implant: 25,
  diffusion: 1000,
  cmp: 25,
  metallization: 200,
};

// ── Thermal Budget Ceiling ──
export const DEFAULT_THERMAL_BUDGET_CEILING = 5.0e6;

// ── Wafer Geometry ──
export const WAFER_RADIUS_MM = 100;
export const WAFER_THICKNESS_UM = 725;

// ── Defect Source Distribution ──
export const DEFECT_SOURCE_FRACTIONS: Record<DefectSource, number> = {
  particles: 0.40,
  scratches: 0.20,
  voids: 0.25,
  inclusions: 0.15,
};

export const DEFECT_SOURCE_COLORS: Record<DefectSource, string> = {
  particles: '#22D3EE',
  scratches: '#F59E0B',
  voids: '#A855F7',
  inclusions: '#EF4444',
};

export const DEFECT_SOURCES: DefectSource[] = ['particles', 'scratches', 'voids', 'inclusions'];

export const DEFAULT_KILL_RATIOS: Record<DefectSource, number> = {
  particles: 0.8,
  scratches: 0.5,
  voids: 0.95,
  inclusions: 0.7,
};

// ── Dopant Implant Data ──
export interface DopantImplantData {
  rangeCoeff: number;
  straggleRatio: number;
  defaultDose: number;
  defaultEnergy: number;
  color: string;
  D0: number;
  Ea: number;
  solidSolubilityCeiling: number;
}

export const DOPANT_IMPLANT_DATA: Record<DopantSpeciesId, DopantImplantData> = {
  B:  { rangeCoeff: 1.0,  straggleRatio: 0.40, defaultDose: 1e14, defaultEnergy: 30,  color: '#3B82F6', D0: 0.037, Ea: 3.46, solidSolubilityCeiling: 4e20 },
  P:  { rangeCoeff: 0.6,  straggleRatio: 0.35, defaultDose: 1e14, defaultEnergy: 80,  color: '#22C55E', D0: 3.85,  Ea: 3.66, solidSolubilityCeiling: 1.5e21 },
  As: { rangeCoeff: 0.3,  straggleRatio: 0.30, defaultDose: 5e14, defaultEnergy: 80,  color: '#EF4444', D0: 0.066, Ea: 3.44, solidSolubilityCeiling: 2e20 },
  Sb: { rangeCoeff: 0.2,  straggleRatio: 0.25, defaultDose: 1e14, defaultEnergy: 120, color: '#F97316', D0: 0.214, Ea: 3.65, solidSolubilityCeiling: 7e19 },
  In: { rangeCoeff: 0.15, straggleRatio: 0.25, defaultDose: 1e13, defaultEnergy: 100, color: '#8B5CF6', D0: 0.6,   Ea: 3.50, solidSolubilityCeiling: 1e18 },
  Ga: { rangeCoeff: 0.25, straggleRatio: 0.30, defaultDose: 1e13, defaultEnergy: 60,  color: '#6B7280', D0: 0.28,  Ea: 4.65, solidSolubilityCeiling: 5e19 },
};

export const ALL_DOPANT_SPECIES: DopantSpeciesId[] = ['B', 'P', 'As', 'Sb', 'In', 'Ga'];

// ── Boltzmann constant (eV/K) ──
export const BOLTZMANN_EV = 8.617333e-5;

// ── Background doping ──
export const DEFAULT_BACKGROUND_DOPING = 1e15;
