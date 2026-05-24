import { SPC_PARAMETERS, SPC_PARAM_KEYS } from './spc-parameters';
import type { SpcMeasurement, FaultConfig, SpcParameter, MetrologyConfig } from './mes-types';

function gaussianRandom(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function generateValue(
  parameter: SpcParameter,
  waferNumber: number,
  fault: FaultConfig | null,
): number {
  const { target, sigma, ucl, lcl } = SPC_PARAMETERS[parameter];

  // Base noise plus bounded process dither keeps normal data in spec without
  // looking artificially stratified to Nelson Rule 7.
  let value = target + gaussianRandom() * sigma * 0.6;

  if (fault && fault.parameter === parameter) {
    const wafersSinceFault = waferNumber - fault.startedAtWafer;
    switch (fault.type) {
      case 'sudden_shift':
        value += 4.0 * fault.severity;
        break;
      case 'gradual_drift':
        value += 0.3 * wafersSinceFault * fault.severity;
        break;
      case 'increased_variance':
        value = target + gaussianRandom() * sigma * 2.0;
        break;
      case 'overlay_excursion':
        value += 0.5 * wafersSinceFault * fault.severity;
        break;
      case 'focus_degradation':
        value = target + gaussianRandom() * sigma * 2.4;
        break;
    }
  } else if (!fault) {
    const phase = SPC_PARAM_KEYS.indexOf(parameter);
    value += Math.sin((waferNumber + phase) * Math.PI / 3) * sigma * 1.2;
    value = Math.min(ucl - sigma * 0.05, Math.max(lcl + sigma * 0.05, value));
  }

  return value;
}

const DEFAULT_CONFIG: MetrologyConfig = {
  exposureDose: 38,
  focusOffset: 0,
  pebDriftRate: 0,
  reticleError: 0,
};

export function generateMeasurementWithConfig(
  waferNumber: number,
  fault: FaultConfig | null,
  config: MetrologyConfig = {},
): Omit<SpcMeasurement, 'id' | 'lotId' | 'timestamp'> {
  const merged = { ...DEFAULT_CONFIG, ...config };
  const values: Record<string, number> = {};
  SPC_PARAM_KEYS.forEach((param) => {
    values[param] = generateValue(param, waferNumber, fault);
  });

  // Dose/CD correlation: deviation from default 38 mJ/cm², ~0.3 nm per mJ/cm²
  values.cd += ((merged.exposureDose ?? 38) - 38) * 0.3;

  // PEB drift: linear CD drift over wafers
  values.cd += waferNumber * (merged.pebDriftRate ?? 0);

  // Reticle error: systematic CD bias
  values.cd += merged.reticleError ?? 0;

  // Focus/CDU correlation: defocus degrades CDU uniformity
  const focusAbs = Math.abs(merged.focusOffset ?? 0);
  if (focusAbs > 0) {
    values.cdu += gaussianRandom() * focusAbs * 0.02;
  }

  return {
    waferNumber,
    cd:    values.cd,
    cdu:   values.cdu,
    ovl_x: values.ovl_x,
    ovl_y: values.ovl_y,
    ler:   values.ler,
  };
}

export function generateMeasurement(
  waferNumber: number,
  fault: FaultConfig | null,
): Omit<SpcMeasurement, 'id' | 'lotId' | 'timestamp'> {
  return generateMeasurementWithConfig(waferNumber, fault, DEFAULT_CONFIG);
}
