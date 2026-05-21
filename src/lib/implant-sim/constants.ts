import type { SimulationParams, IonSpecies, TargetMaterial, CrystalOrientation } from './types';

// ─── Physical Constants (units: nm, eV, amu) ───
export const BOHR_RADIUS_NM = 0.0529177;
export const COULOMB_CONST = 1.44;  // e²/(4πε₀) in eV·nm

// ─── ZBL Universal Screening Function Coefficients ───
export const ZBL_A = [0.1818, 0.5099, 0.2802, 0.02817] as const;
export const ZBL_B = [3.2, 0.9423, 0.4029, 0.2016] as const;

// ─── Ion Species Database ───
export interface IonData {
  Z: number;
  M: number;
  symbol: string;
  color: string;
  /** For BF2: effective mass of molecular ion (energy partition) */
  molecularMass?: number;
}

export const ION_DB: Record<IonSpecies, IonData> = {
  B:   { Z: 5,  M: 11.01,  symbol: 'B',   color: '#3b82f6' },
  P:   { Z: 15, M: 30.97,  symbol: 'P',   color: '#22c55e' },
  As:  { Z: 33, M: 74.92,  symbol: 'As',  color: '#ef4444' },
  BF2: { Z: 5,  M: 11.01,  symbol: 'BF\u2082', color: '#f59e0b', molecularMass: 49.01 },
};

// ─── Target Material Database ───
export interface MaterialData {
  Z: number;
  M: number;
  density: number;  // atoms/nm³
  Ed: number;       // displacement energy (eV)
  name: string;
  color: string;
  /** true if crystalline (allows channeling) */
  crystalline: boolean;
}

export const MATERIAL_DB: Record<TargetMaterial, MaterialData> = {
  Si:          { Z: 14,  M: 28.09, density: 50.0,  Ed: 15, name: 'Silicon',       color: '#60a5fa', crystalline: true  },
  SiO2:        { Z: 10,  M: 20.0,  density: 66.0,  Ed: 20, name: 'Silicon Oxide',  color: '#a78bfa', crystalline: false },
  photoresist: { Z: 6.5, M: 12.5,  density: 55.0,  Ed: 28, name: 'Photoresist',    color: '#fbbf24', crystalline: false },
};

// ─── Crystal Channel Spacings ───
export interface ChannelData {
  rowSpacing: number;   // nm — atomic row spacing d
  planeSpacing: number; // nm — planar channel half-width
}

export const CHANNEL_DB: Record<CrystalOrientation, ChannelData> = {
  '100': { rowSpacing: 0.5431, planeSpacing: 0.1358 },
  '110': { rowSpacing: 0.3840, planeSpacing: 0.1920 },
  '111': { rowSpacing: 0.3139, planeSpacing: 0.1570 },
};

// ─── Simulation Constants ───
export const DEPTH_BINS = 200;
export const DEFAULT_TOTAL_STEPS = 200;
export const DEFAULT_ION_COUNT = 500;
export const E_CUTOFF_EV = 5;
export const MAX_TRAJECTORY_POINTS = 400;
export const MAX_RECOIL_CASCADES = 3;
export const P_MAX_FACTOR = 1.2;

// ─── Empirical LSS Range Coefficients (for max depth estimation) ───
// Rp(nm) ≈ C * E(keV)^alpha  — rough fit per species in Si
export const LSS_RANGE_FIT: Record<IonSpecies, { C: number; alpha: number }> = {
  B:   { C: 3.0,  alpha: 0.85 },
  P:   { C: 1.3,  alpha: 0.85 },
  As:  { C: 0.55, alpha: 0.85 },
  BF2: { C: 3.0,  alpha: 0.85 }, // uses effective B energy
};

/** Estimate max simulation depth based on ion/energy */
export function estimateMaxDepth(species: IonSpecies, energyKeV: number): number {
  let effectiveE = energyKeV;
  if (species === 'BF2') {
    effectiveE = energyKeV * (ION_DB.BF2.M / ION_DB.BF2.molecularMass!);
  }
  const fit = LSS_RANGE_FIT[species];
  const Rp = fit.C * Math.pow(effectiveE, fit.alpha);
  return Math.max(50, Rp * 4);
}

// ─── Parameter Bounds ───
export const PARAM_BOUNDS = {
  beamEnergy:             { min: 1,    max: 800,  default: 50,   step: 1,    unit: 'keV',       label: 'Beam Energy' },
  dose:                   { min: 11,   max: 16,   default: 13,   step: 0.5,  unit: 'ions/cm\u00B2', label: 'Dose (10\u02E3)' },
  beamCurrent:            { min: 0.1,  max: 20,   default: 5,    step: 0.1,  unit: 'mA',        label: 'Beam Current' },
  tiltAngle:              { min: 0,    max: 60,   default: 7,    step: 1,    unit: '\u00B0',    label: 'Tilt Angle' },
  twistAngle:             { min: 0,    max: 360,  default: 0,    step: 5,    unit: '\u00B0',    label: 'Twist Angle' },
  screenOxideThickness:   { min: 0,    max: 100,  default: 0,    step: 1,    unit: 'nm',        label: 'Screen Oxide' },
  photoresistThickness:   { min: 0,    max: 2000, default: 0,    step: 10,   unit: 'nm',        label: 'Resist Thick' },
  substrateTemperature:   { min: 25,   max: 600,  default: 25,   step: 5,    unit: '\u00B0C',   label: 'Substrate T' },
  amorphizationThreshold: { min: 1,    max: 20,   default: 5,    step: 0.5,  unit: '\u00D710\u00B2\u00B9', label: 'Amorph Thresh' },
  damageAnnealingRate:    { min: 0,    max: 1,    default: 0,    step: 0.05, unit: 'a.u.',      label: 'Anneal Rate' },
} as const;

export const DEFAULT_PARAMS: SimulationParams = {
  ionSpecies: 'B',
  beamEnergy: PARAM_BOUNDS.beamEnergy.default,
  dose: Math.pow(10, PARAM_BOUNDS.dose.default),
  beamCurrent: PARAM_BOUNDS.beamCurrent.default,
  tiltAngle: PARAM_BOUNDS.tiltAngle.default,
  twistAngle: PARAM_BOUNDS.twistAngle.default,
  crystalOrientation: '100',
  screenOxideThickness: PARAM_BOUNDS.screenOxideThickness.default,
  photoresistThickness: PARAM_BOUNDS.photoresistThickness.default,
  substrateTemperature: PARAM_BOUNDS.substrateTemperature.default,
  amorphizationThreshold: PARAM_BOUNDS.amorphizationThreshold.default,
  damageAnnealingRate: PARAM_BOUNDS.damageAnnealingRate.default,
  totalSteps: DEFAULT_TOTAL_STEPS,
};

// ─── Seeded PRNG (Mulberry32) for reproducible MC ───
export function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
