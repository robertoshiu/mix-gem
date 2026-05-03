import { SPC_PARAMETERS, SPC_PARAM_KEYS } from './spc-parameters';
import type { SpcMeasurement, FaultConfig, SpcParameter } from './mes-types';

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
  const { target, sigma } = SPC_PARAMETERS[parameter];

  // Base noise: 0.6x sigma keeps normal data well within +/-2 sigma
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
  }

  return value;
}

export function generateMeasurement(
  waferNumber: number,
  fault: FaultConfig | null,
): Omit<SpcMeasurement, 'id' | 'lotId' | 'timestamp'> {
  const values: Record<string, number> = {};
  SPC_PARAM_KEYS.forEach((param) => {
    values[param] = generateValue(param, waferNumber, fault);
  });

  return {
    waferNumber,
    cd:    values.cd,
    cdu:   values.cdu,
    ovl_x: values.ovl_x,
    ovl_y: values.ovl_y,
    ler:   values.ler,
  };
}
