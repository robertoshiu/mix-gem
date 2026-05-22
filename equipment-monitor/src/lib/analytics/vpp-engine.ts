import type {
  PipelineStep, PipelineStepResult, PipelineResult, FilmLayer, ProcessStepId,
} from './types';
import { PROCESS_STEPS, FILM_MATERIALS, DEFAULT_D0, mulberry32, hashCode } from './constants';

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
