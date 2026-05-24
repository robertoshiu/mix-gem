import { SPC_PARAMETERS, SPC_PARAM_KEYS } from './spc-parameters';
import type { FaultConfig, MetrologyConfig, SpcMeasurement, SpcParameter } from './mes-types';

export const PLAYBACK_TICK_MS = 2000;
export const PLAYBACK_DURATION_MS = 180000;
export const PLAYBACK_FRAME_COUNT = PLAYBACK_DURATION_MS / PLAYBACK_TICK_MS;

type MeasurementValues = Pick<SpcMeasurement, 'waferNumber' | 'cd' | 'cdu' | 'ovl_x' | 'ovl_y' | 'ler'>;

const PLAYBACK_ANCHOR = new Date('2026-05-02T08:00:00').getTime();
const SCHEDULED_EXCURSIONS: Partial<Record<number, SpcParameter>> = {
  18: 'cd',
  37: 'ovl_x',
  56: 'cdu',
  74: 'ler',
  88: 'ovl_y',
};

function hashUnit(seed: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

function hashSigned(seed: string): number {
  return hashUnit(seed) * 2 - 1;
}

function clampInControl(value: number, parameter: SpcParameter): number {
  const { sigma, ucl, lcl } = SPC_PARAMETERS[parameter];
  return Math.min(ucl - sigma * 0.12, Math.max(lcl + sigma * 0.12, value));
}

function applyFault(
  value: number,
  parameter: SpcParameter,
  frameNumber: number,
  fault: FaultConfig | null,
): number {
  if (!fault || fault.parameter !== parameter) return value;

  const { target, sigma } = SPC_PARAMETERS[parameter];
  const framesSinceFault = Math.max(0, frameNumber - fault.startedAtWafer);
  switch (fault.type) {
    case 'sudden_shift':
      return value + sigma * 3.2 * fault.severity;
    case 'gradual_drift':
      return value + framesSinceFault * sigma * 0.18 * fault.severity;
    case 'increased_variance':
      return target + hashSigned(`fault:${parameter}:${frameNumber}`) * sigma * 2.4;
    case 'overlay_excursion':
      return value + framesSinceFault * sigma * 0.28 * fault.severity;
    case 'focus_degradation':
      return target + hashSigned(`focus:${parameter}:${frameNumber}`) * sigma * 2.6;
  }
}

export function playbackFrameFromWafer(waferNumber: number): number {
  return ((waferNumber - 1) % PLAYBACK_FRAME_COUNT) + 1;
}

export function generatePlaybackValues(
  frameNumber: number,
  fault: FaultConfig | null = null,
  config: MetrologyConfig = {},
): MeasurementValues {
  const values = {} as Record<SpcParameter, number>;
  const recipeSeed = `${config.exposureDose ?? 38}:${config.focusOffset ?? 0}:${config.pebDriftRate ?? 0}:${config.reticleError ?? 0}`;

  SPC_PARAM_KEYS.forEach((parameter) => {
    const { target, sigma, ucl, lcl } = SPC_PARAMETERS[parameter];
    const phase = SPC_PARAM_KEYS.indexOf(parameter) + 1;
    const hashNoise = hashSigned(`spc:${frameNumber}:${parameter}`) * sigma * 0.58;
    const waveNoise = Math.sin((frameNumber + phase * 3) * 0.37) * sigma * 0.72;
    const toolBias = hashSigned(`recipe:${recipeSeed}:${parameter}`) * sigma * 0.22;
    let value = target + hashNoise + waveNoise + toolBias;

    if (parameter === 'cd') {
      value += ((config.exposureDose ?? 38) - 38) * 0.3;
      value += frameNumber * (config.pebDriftRate ?? 0);
      value += config.reticleError ?? 0;
    }

    if (parameter === 'cdu') {
      value += Math.abs(config.focusOffset ?? 0) * hashSigned(`focus-offset:${frameNumber}`) * 0.012;
    }

    const excursionParam = SCHEDULED_EXCURSIONS[frameNumber];
    if (!fault && excursionParam === parameter) {
      const direction = hashUnit(`excursion:${frameNumber}:${parameter}`) > 0.5 ? 1 : -1;
      value = direction > 0 ? ucl + sigma * 0.45 : lcl - sigma * 0.45;
    } else {
      value = clampInControl(value, parameter);
    }

    values[parameter] = applyFault(value, parameter, frameNumber, fault);
  });

  return {
    waferNumber: frameNumber,
    cd: values.cd,
    cdu: values.cdu,
    ovl_x: values.ovl_x,
    ovl_y: values.ovl_y,
    ler: values.ler,
  };
}

export function generatePlaybackMeasurement(
  lotId: string,
  frameNumber: number,
  cycleNumber: number,
  fault: FaultConfig | null = null,
  config: MetrologyConfig = {},
  timestamp: Date = new Date(PLAYBACK_ANCHOR + (cycleNumber * PLAYBACK_FRAME_COUNT + frameNumber) * PLAYBACK_TICK_MS),
): SpcMeasurement {
  return {
    id: `${lotId}-cycle${cycleNumber}-frame${frameNumber}`,
    lotId,
    timestamp,
    ...generatePlaybackValues(frameNumber, fault, config),
  };
}

export function generatePlaybackSeedMeasurements(lotId: string, count: number): SpcMeasurement[] {
  return Array.from({ length: count }, (_, index) =>
    generatePlaybackMeasurement(lotId, index + 1, 0),
  );
}
