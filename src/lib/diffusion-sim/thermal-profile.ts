import type { SimulationParams, ThermalStep, ThermalMode } from './types';
import { DEPTH_BINS, DEFAULT_TOTAL_STEPS, T_AMBIENT, THERMAL_MODES } from './constants';

type ThermalPhase = 'ramp' | 'soak' | 'cool' | 'pulse';

/**
 * Generate the complete T(t) thermal profile as an array of ThermalStep.
 * Each step maps to one simulation timestep.
 */
export function generateThermalProfile(
  mode: ThermalMode,
  params: SimulationParams,
): ThermalStep[] {
  const totalSteps = params.totalSteps ?? DEFAULT_TOTAL_STEPS;
  const cfg = THERMAL_MODES[mode];
  const dt = cfg.totalTimeScale / totalSteps;
  const steps: ThermalStep[] = [];

  for (let i = 0; i < totalSteps; i++) {
    const time = (i + 0.5) * dt;
    const { temperature, phase, tempProfile } = computeThermalState(mode, params, time, dt);
    steps.push({ time, temperature, tempProfile, dt, phase });
  }

  return steps;
}

function computeThermalState(
  mode: ThermalMode,
  params: SimulationParams,
  time: number,
  _dt: number,
): { temperature: number; phase: ThermalPhase; tempProfile: number[] } {
  void _dt;
  let temperature: number;
  let phase: ThermalPhase;
  let depthDependent = false;

  const Tpeak = params.peakTemperature;
  const ramp = params.rampRate;
  const soak = params.soakTime;
  const cool = params.coolingRate;

  switch (mode) {
    case 'furnace': {
      const tRamp = (Tpeak - T_AMBIENT) / ramp;
      const tSoakEnd = tRamp + soak;
      if (time < tRamp) {
        temperature = T_AMBIENT + ramp * time;
        phase = 'ramp';
      } else if (time < tSoakEnd) {
        temperature = Tpeak;
        phase = 'soak';
      } else {
        temperature = Math.max(T_AMBIENT, Tpeak - cool * (time - tSoakEnd));
        phase = 'cool';
      }
      break;
    }
    case 'rta': {
      const tRamp = (Tpeak - T_AMBIENT) / ramp;
      const tSoakEnd = tRamp + soak;
      if (time < tRamp) {
        temperature = T_AMBIENT + ramp * time;
        phase = 'ramp';
      } else if (time < tSoakEnd) {
        temperature = Tpeak;
        phase = 'soak';
      } else {
        const tauCool = (Tpeak - T_AMBIENT) / cool;
        temperature = T_AMBIENT + (Tpeak - T_AMBIENT) * Math.exp(-(time - tSoakEnd) / Math.max(1e-6, tauCool));
        phase = 'cool';
      }
      break;
    }
    case 'spike': {
      const tPeak = THERMAL_MODES.spike.totalTimeScale / 2;
      const sigma = 0.3;
      temperature = T_AMBIENT + (Tpeak - T_AMBIENT) * Math.exp(-Math.pow(time - tPeak, 2) / (2 * sigma * sigma));
      phase = time < tPeak ? 'ramp' : 'cool';
      break;
    }
    case 'flash': {
      const Tpreheat = 700;
      const tauFlash = 1.5e-3;
      const tPulse = THERMAL_MODES.flash.totalTimeScale * 0.3;
      if (time < tPulse) {
        temperature = Tpreheat + (Tpeak - Tpreheat) * (time / tPulse);
        phase = 'pulse';
      } else {
        temperature = Tpreheat + (Tpeak - Tpreheat) * Math.exp(-(time - tPulse) / tauFlash);
        phase = 'cool';
      }
      break;
    }
    case 'laser': {
      const tPulse = THERMAL_MODES.laser.totalTimeScale * 0.4;
      const Tbase = 400;
      depthDependent = true;
      if (time < tPulse) {
        temperature = Tbase + (Tpeak - Tbase) * (time / tPulse);
        phase = 'pulse';
      } else {
        temperature = Tbase + (Tpeak - Tbase) * Math.exp(-(time - tPulse) / (tPulse * 0.5));
        phase = 'cool';
      }
      break;
    }
    default:
      temperature = T_AMBIENT;
      phase = 'ramp';
  }

  temperature = Math.max(T_AMBIENT, Math.min(Tpeak, temperature));

  // Build depth-resolved temperature profile
  const tempProfile = new Array(DEPTH_BINS);
  if (depthDependent) {
    const alphaSi = 0.9;
    const tauLaser = THERMAL_MODES.laser.totalTimeScale * 0.4;
    const deltaThermal = Math.sqrt(alphaSi * tauLaser) * 1e7;
    const maxDepthNm = params.initialDepth * 5;
    const binSize = maxDepthNm / DEPTH_BINS;
    for (let i = 0; i < DEPTH_BINS; i++) {
      const depth = (i + 0.5) * binSize;
      const atten = Math.exp(-depth / Math.max(1, deltaThermal));
      tempProfile[i] = T_AMBIENT + (temperature - T_AMBIENT) * atten;
    }
  } else {
    tempProfile.fill(temperature);
  }

  return { temperature, phase, tempProfile };
}

/** Compute cumulative thermal budget Dt from a sequence of thermal steps */
export function thermalBudget(
  steps: ThermalStep[],
  D_at_T: (T: number) => number,
): number {
  let Dt = 0;
  for (const step of steps) {
    Dt += D_at_T(step.temperature) * step.dt;
  }
  return Dt;
}
