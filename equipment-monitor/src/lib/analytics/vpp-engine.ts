import type {
  PipelineStep, PipelineStepResult, PipelineResult, FilmLayer, ProcessStepId,
  SubstrateType, StressMode, StressLayerResult, StressProfileResult,
  DefectSource, DefectSourceBreakdown, DefectStepResult, DefectMapResult,
  DopantSpeciesId, DopantProfilePoint, DopantSpeciesResult, DopantProfileResult,
} from './types';
import { PROCESS_STEPS, FILM_MATERIALS, DEFAULT_D0, mulberry32, hashCode } from './constants';
import {
  SUBSTRATE_PROPERTIES, FILM_STRESS_PROPERTIES, WAFER_RADIUS_MM, WAFER_THICKNESS_UM,
  DEFECT_SOURCE_FRACTIONS, DEFECT_SOURCE_COLORS, DEFECT_SOURCES,
  DOPANT_IMPLANT_DATA, BOLTZMANN_EV as VPP_BOLTZMANN_EV, DEFAULT_BACKGROUND_DOPING,
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

export function computeDefectMap(
  perStep: PipelineStepResult[],
  killRatios: Record<DefectSource, number>,
  enabledSources: DefectSource[],
): DefectMapResult {
  const enabledSet = new Set(enabledSources);
  const stepResults: DefectStepResult[] = [];
  let totalD0 = 0;
  let totalKillerD0 = 0;

  for (const step of perStep) {
    const sources: DefectSourceBreakdown[] = DEFECT_SOURCES.map((src) => {
      const density = enabledSet.has(src) ? step.defectDensity * DEFECT_SOURCE_FRACTIONS[src] : 0;
      const killerDensity = density * (killRatios[src] ?? 0);
      return { source: src, density, killerDensity, color: DEFECT_SOURCE_COLORS[src] };
    });

    const stepTotal = sources.reduce((s, src) => s + src.density, 0);
    const stepKiller = sources.reduce((s, src) => s + src.killerDensity, 0);
    const yieldImpact = 1 - Math.pow(1 + (stepKiller * 100) / 2, -2);

    stepResults.push({
      stepId: step.stepId,
      totalD0: stepTotal,
      killerD0: stepKiller,
      sources,
      yieldImpact,
    });

    totalD0 += stepTotal;
    totalKillerD0 += stepKiller;
  }

  const sorted = [...stepResults].sort((a, b) => b.killerD0 - a.killerD0);
  let cumSum = 0;
  const paretoPoints = sorted.map((step) => {
    cumSum += step.killerD0;
    return { stepId: step.stepId, cumPct: totalKillerD0 > 0 ? (cumSum / totalKillerD0) * 100 : 0 };
  });

  const rng = mulberry32(hashCode('defect-wafer-map'));
  const dotCount = Math.min(200, Math.round(totalD0 * 100));
  const waferDots: { x: number; y: number; source: DefectSource }[] = [];
  const enabledSourcesList = DEFECT_SOURCES.filter((s) => enabledSet.has(s));

  for (let i = 0; i < dotCount; i++) {
    let x: number, y: number;
    do {
      x = rng() * 2 - 1;
      y = rng() * 2 - 1;
    } while (x * x + y * y > 1);

    const r = rng();
    let cumFrac = 0;
    let source: DefectSource = enabledSourcesList[0] ?? 'particles';
    for (const src of enabledSourcesList) {
      cumFrac += DEFECT_SOURCE_FRACTIONS[src];
      if (r < cumFrac) { source = src; break; }
    }
    waferDots.push({ x, y, source });
  }

  const totalYieldImpact = 1 - Math.pow(1 + (totalKillerD0 * 100) / 2, -2);

  return { perStep: stepResults, totalD0, totalKillerD0, totalYieldImpact, paretoPoints, waferDots };
}

export function computeDopantProfile(
  speciesList: DopantSpeciesId[],
  depthMin: number,
  depthMax: number,
  annealTempC: number,
  annealTimeMin: number,
  showActive: boolean,
): DopantProfileResult {
  const nPoints = 200;
  const depthStep = (depthMax - depthMin) / (nPoints - 1);
  const annealTimeSec = annealTimeMin * 60;
  const T_K = annealTempC + 273.15;

  const speciesResults: DopantSpeciesResult[] = speciesList.map((id) => {
    const data = DOPANT_IMPLANT_DATA[id];
    const Rp = data.rangeCoeff * data.defaultEnergy;
    const sigma0 = data.straggleRatio * Rp;

    const D_cm2s = data.D0 * Math.exp(-data.Ea / (VPP_BOLTZMANN_EV * T_K));
    const D_nm2s = D_cm2s * 1e14;
    const Dt = D_nm2s * annealTimeSec;
    const sigmaEff = Math.sqrt(sigma0 * sigma0 + 2 * Dt);

    const dose = data.defaultDose;
    const doseNm = dose * 1e-14;
    const prefactor = doseNm / (Math.sqrt(2 * Math.PI) * sigmaEff);

    let peakConc = 0;
    let junctionDepth = 0;
    let foundJunction = false;

    const profile: DopantProfilePoint[] = [];
    for (let i = 0; i < nPoints; i++) {
      const depth = depthMin + i * depthStep;
      const dx = depth - Rp;
      const concentration = prefactor * Math.exp(-(dx * dx) / (2 * sigmaEff * sigmaEff)) * 1e21;
      const activeConcentration = showActive
        ? Math.min(concentration, data.solidSolubilityCeiling)
        : concentration;

      profile.push({ depth, concentration, activeConcentration });
      if (concentration > peakConc) peakConc = concentration;

      if (!foundJunction && i > 0 && depth > Rp && concentration < DEFAULT_BACKGROUND_DOPING) {
        const prev = profile[i - 1];
        const frac = (DEFAULT_BACKGROUND_DOPING - concentration) / (prev.concentration - concentration);
        junctionDepth = depth - frac * depthStep;
        foundJunction = true;
      }
    }

    if (!foundJunction) junctionDepth = depthMax;

    return {
      species: id,
      profile,
      peakConcentration: peakConc,
      junctionDepth,
      dose,
      color: data.color,
    };
  });

  return { species: speciesResults, backgroundDoping: DEFAULT_BACKGROUND_DOPING };
}
