import type { SimulationParams, OxidationType, MaterialType } from './types';

// ─── Physical Constants ───
export const BOLTZMANN_EV = 8.617e-5;        // eV/K
export const T_AMBIENT = 25;                  // C
export const WAFER_RADIUS_MM = 150;           // mm (300mm wafer / 2)

// ─── Simulation Grid ───
export const DEFAULT_TOTAL_STEPS = 200;

// ─── Material Properties ───
export interface MaterialProps {
  cte: number;        // coefficient of thermal expansion (1/K)
  youngsE: number;    // Young's modulus (GPa)
  poisson: number;    // Poisson's ratio
  rhoCp: number;      // volumetric heat capacity (J/m^3*K)
}

export const MATERIAL_PROPS: Record<MaterialType, MaterialProps & { kBase: number; kExponent?: number }> = {
  Si:    { cte: 2.6e-6, youngsE: 130, poisson: 0.28, rhoCp: 1.63e6, kBase: 150, kExponent: 1.3 },
  SiO2:  { cte: 0.5e-6, youngsE: 72,  poisson: 0.17, rhoCp: 1.65e6, kBase: 1.4 },
  Si3N4: { cte: 3.2e-6, youngsE: 270, poisson: 0.27, rhoCp: 2.1e6,  kBase: 30 },
};

/** Thermal conductivity (W/m*K) — Si is temperature-dependent */
export function thermalConductivity(material: MaterialType, T_celsius: number): number {
  const p = MATERIAL_PROPS[material];
  if (p.kExponent) {
    const T = Math.max(T_celsius + 273.15, 1);
    return p.kBase / Math.pow(T / 300, p.kExponent);
  }
  return p.kBase;
}

// ─── Deal-Grove Rate Constants ───
export interface DealGroveCoeffs {
  label: string;
  labelCN: string;
  baDivPrefactor: number;  // B/A prefactor (nm/s)
  baE: number;             // B/A activation energy (eV)
  bPrefactor: number;      // B prefactor (nm^2/s)
  bE: number;              // B activation energy (eV)
}

const BASE_COEFFS: Record<OxidationType, DealGroveCoeffs> = {
  dry:       { label: 'Dry O\u2082',     labelCN: '\u4E7E\u6C27\u6C27\u5316', baDivPrefactor: 3.71e6, baE: 2.00, bPrefactor: 7.72e2, bE: 1.23 },
  wet:       { label: 'Wet O\u2082',     labelCN: '\u6FD5\u6C27\u6C27\u5316', baDivPrefactor: 9.70e7, baE: 2.05, bPrefactor: 3.86e2, bE: 0.78 },
  n2o:       { label: 'N\u2082O',        labelCN: '\u6C27\u6C2E\u5316',       baDivPrefactor: 1.5e6,  baE: 2.00, bPrefactor: 3.0e2,  bE: 1.20 },
  pyrogenic: { label: 'Pyrogenic',       labelCN: '\u71B1\u89E3\u6FD5\u6C27', baDivPrefactor: 8.5e7,  baE: 2.05, bPrefactor: 3.5e2,  bE: 0.78 },
  hcl:       { label: 'HCl-Doped',      labelCN: 'HCl\u53BB\u6C61', baDivPrefactor: 3.71e6, baE: 2.00, bPrefactor: 7.72e2, bE: 1.23 },
  hibox:     { label: 'HIBOX',           labelCN: '\u9AD8\u58D3\u6C27\u5316', baDivPrefactor: 3.71e6, baE: 2.00, bPrefactor: 7.72e2, bE: 1.23 },
};

export function getDealGroveCoeffs(type: OxidationType): DealGroveCoeffs {
  return BASE_COEFFS[type];
}

// ─── Orientation Factor ───
export const ORIENTATION_FACTOR: Record<string, number> = {
  '100': 1.0,
  '110': 1.45,
  '111': 1.68,
};

// ─── Oxidation Enthalpy (eV/molecule) ───
export const OXIDATION_ENTHALPY: Record<OxidationType, number> = {
  dry: 3.6,
  wet: 1.6,
  n2o: 3.4,
  pyrogenic: 1.6,
  hcl: 3.6,
  hibox: 3.6,
};

// ─── Volume Expansion ───
export const SI_TO_SIO2_RATIO = 2.2;
export const MISMATCH_STRAIN = 1 - 1 / SI_TO_SIO2_RATIO; // ~0.545

// ─── Viscoelastic Relaxation ───
export const VISCOSITY_PREFACTOR = 4.6e-15;  // Pa*s
export const VISCOSITY_ACTIVATION = 5.2;     // eV

// ─── Kao Feedback Volumes ───
export const KAO_VA = 0.01;     // nm^3 — activation volume (surface reaction)
export const KAO_VD = 0.005;    // nm^3 — activation volume (diffusion)

// ─── Parameter Bounds ───
export const PARAM_BOUNDS = {
  peakTemperature:       { min: 700,  max: 1200, default: 1000, step: 10,   unit: '\u00B0C',  label: 'Peak T' },
  rampRate:              { min: 0,    max: 2.3,  default: 1,    step: 0.1,  unit: '\u00B0C/s', label: 'Ramp Rate', isLog: true },
  soakTime:              { min: -1,   max: 3.86, default: 3.26, step: 0.1,  unit: 's',         label: 'Soak Time', isLog: true },
  coolingRate:           { min: 0,    max: 2.3,  default: 1,    step: 0.1,  unit: '\u00B0C/s', label: 'Cool Rate', isLog: true },
  pressure:              { min: 1,    max: 25,   default: 1,    step: 1,    unit: 'atm',       label: 'Pressure' },
  hclConcentration:      { min: 0,    max: 10,   default: 3,    step: 0.5,  unit: '%',         label: 'HCl %' },
  initialOxideThickness: { min: 0,    max: 100,  default: 0,    step: 1,    unit: 'nm',        label: 'Init Oxide' },
  nitrideMaskWidth:      { min: 200,  max: 2000, default: 500,  step: 50,   unit: 'nm',        label: 'Nitride W' },
  trenchDepth:           { min: 100,  max: 500,  default: 300,  step: 10,   unit: 'nm',        label: 'Trench D' },
  trenchWidth:           { min: 50,   max: 500,  default: 200,  step: 10,   unit: 'nm',        label: 'Trench W' },
  lampBalance:           { min: 50,   max: 100,  default: 85,   step: 1,    unit: '% center',  label: 'Lamp Bal' },
} as const;

export const DEFAULT_PARAMS: SimulationParams = {
  peakTemperature: PARAM_BOUNDS.peakTemperature.default,
  rampRate: Math.pow(10, PARAM_BOUNDS.rampRate.default),
  soakTime: Math.pow(10, PARAM_BOUNDS.soakTime.default),
  coolingRate: Math.pow(10, PARAM_BOUNDS.coolingRate.default),
  oxidationType: 'dry',
  geometryType: 'blanket',
  pressure: PARAM_BOUNDS.pressure.default,
  hclConcentration: PARAM_BOUNDS.hclConcentration.default,
  initialOxideThickness: PARAM_BOUNDS.initialOxideThickness.default,
  substrateOrientation: '100',
  nitrideMaskWidth: PARAM_BOUNDS.nitrideMaskWidth.default,
  trenchDepth: PARAM_BOUNDS.trenchDepth.default,
  trenchWidth: PARAM_BOUNDS.trenchWidth.default,
  lampBalance: PARAM_BOUNDS.lampBalance.default,
  totalSteps: DEFAULT_TOTAL_STEPS,
};
