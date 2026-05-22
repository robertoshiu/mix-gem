import type {
  PipelineStep, PipelineStepResult, PipelineResult, FilmLayer, ProcessStepId,
  SubstrateType, StressMode, StressLayerResult, StressProfileResult,
} from './types';
import { PROCESS_STEPS, FILM_MATERIALS, DEFAULT_D0, mulberry32, hashCode } from './constants';
import {
  SUBSTRATE_PROPERTIES, FILM_STRESS_PROPERTIES, WAFER_RADIUS_MM, WAFER_THICKNESS_UM,
} from './vpp-constants';

export function createDefaultPipeline(): PipelineStep[] {
  return PROCESS_STEPS.map((stepId) => ({
    stepId,
    presetName: 'default',
    overrides: {},
  }));
}

export function runFederatedSim(pipeline: PipelineStep[]): PipelineResult {
  const perStep: PipelineStepResult[] = [];
  let cumulativeYield = 1;
  for (const step of pipeline) {
    const result = simulateStep(step);
    cumulativeYield *= result.yield;
    perStep.push(result);
  }
  const filmStack = computeFilmStack(perStep);
  return { perStep, filmStack, cumulativeYield };
}

function simulateStep(step: PipelineStep): PipelineStepResult {
  const { stepId, overrides } = step;
  const rng = mulberry32(hashCode(stepId + JSON.stringify(overrides)));
  const filmDef = FILM_MATERIALS[stepId];
  const baseD0 = DEFAULT_D0[stepId];
  let thickness = Math.abs(filmDef.baseThickness);
  let stress = 0;
  let defectDensity = baseD0;
  if (overrides.temperature != null) {
    const tempFactor = overrides.temperature / 1000;
    thickness *= tempFactor;
    stress = (tempFactor - 1) * 200;
    defectDensity *= 1 + (tempFactor - 1) * 0.5;
  }
  if (overrides.dose != null) {
    thickness *= 1 + (overrides.dose - 30) / 100;
  }
  if (overrides.pressure != null) {
    defectDensity *= 1 + (overrides.pressure - 25) / 200;
  }
  thickness += (rng() - 0.5) * thickness * 0.02;
  defectDensity = Math.max(0.01, defectDensity + (rng() - 0.5) * 0.02);
  const area = 100;
  const alpha = 2;
  const yieldVal = Math.pow(1 + (defectDensity * area) / alpha, -alpha);
  return {
    stepId,
    yield: yieldVal,
    thickness: Math.max(0, thickness),
    stress,
    defectDensity,
  };
}

export function computeFilmStack(stepResults: PipelineStepResult[]): FilmLayer[] {
  return stepResults
    .filter((r) => r.thickness > 0 && FILM_MATERIALS[r.stepId].baseThickness !== 0)
    .map((r) => ({
      material: FILM_MATERIALS[r.stepId].material,
      thickness: r.thickness,
      color: FILM_MATERIALS[r.stepId].color,
    }));
}

export function computePipelineYield(
  stepResults: PipelineStepResult[],
): { perStep: { stepId: ProcessStepId; yield: number }[]; cumulative: number } {
  let cumulative = 1;
  const perStep = stepResults.map((r) => {
    cumulative *= r.yield;
    return { stepId: r.stepId, yield: r.yield };
  });
  return { perStep, cumulative };
}

export function computeStressProfile(
  perStep: PipelineStepResult[],
  substrate: SubstrateType,
  tempC: number,
  mode: StressMode,
): StressProfileResult {
  const sub = SUBSTRATE_PROPERTIES[substrate];
  const deltaT = tempC - 25;

  const layers: StressLayerResult[] = [];
  let totalStressThickness = 0;
  let totalThickness = 0;

  for (const step of perStep) {
    const fp = FILM_STRESS_PROPERTIES[step.stepId];
    if (fp.E === 0 || step.thickness <= 0) continue;

    let Eeff: number;
    if (mode === 'biaxial') Eeff = fp.E / (1 - fp.nu);
    else if (mode === 'plane-strain') Eeff = fp.E / (1 - fp.nu * fp.nu);
    else Eeff = fp.E;

    const thermalStress = Eeff * (sub.alpha - fp.cte) * deltaT * 1000;
    const totalStress = fp.intrinsicStress + thermalStress;

    layers.push({
      stepId: step.stepId,
      material: FILM_MATERIALS[step.stepId].material,
      intrinsicStress: fp.intrinsicStress,
      thermalStress,
      totalStress,
      thickness: step.thickness,
    });

    totalStressThickness += totalStress * step.thickness;
    totalThickness += step.thickness;
  }

  const netStress = totalThickness > 0 ? totalStressThickness / totalThickness : 0;

  const L = WAFER_RADIUS_MM * 1000;
  const tSub = WAFER_THICKNESS_UM;
  const tFilm = totalThickness / 1000;
  const Ms = (sub.E / (1 - sub.nu)) * 1000;
  const waferBow = totalThickness > 0
    ? Math.abs(3 * netStress * tFilm * L * L / (Ms * tSub * tSub))
    : 0;

  const cumulativeStress: { depth: number; stress: number }[] = [{ depth: 0, stress: 0 }];
  let cumDepth = 0;
  let cumStress = 0;
  for (const layer of layers) {
    cumDepth += layer.thickness;
    cumStress += layer.totalStress;
    cumulativeStress.push({ depth: cumDepth, stress: cumStress });
  }

  return { layers, netStress, waferBow, cumulativeStress };
}
