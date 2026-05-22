import type { SolverState, SimulationParams, OxidationMetric } from './types';
import { computeBirdBeakLength } from './kao-feedback';

export function computeMetrics(
  state: SolverState,
  params: SimulationParams,
): Record<OxidationMetric, number> {
  const nr = state.mesh.nr;
  const ox = state.oxideThickness;
  const centerIdx = 0;

  const oxideThickness = ox[centerIdx] ?? 0;
  const temperature = state.mesh.nodes[centerIdx]?.T ?? state.temperature;
  const peakStress = Math.max(...state.mesh.nodes.map(n => Math.abs(n.stress)));

  let birdBeakLength = 0;
  if (params.geometryType === 'locos' || params.geometryType === 'sti') {
    const maskEdgeIdx = Math.floor(nr / 2);
    birdBeakLength = computeBirdBeakLength(ox, maskEdgeIdx);
  }

  const oxidationRate = state.oxidationRate.reduce((s, r) => s + r, 0) / Math.max(1, state.oxidationRate.length);

  const oxMin = Math.min(...ox);
  const oxMax = Math.max(...ox);
  const oxAvg = ox.reduce((s, v) => s + v, 0) / Math.max(1, ox.length);
  const oxideUniformity = oxAvg > 0 ? ((oxMax - oxMin) / oxAvg) * 100 : 0;

  let trenchCornerStress = 1.0;
  if (params.geometryType === 'sti') {
    const surfaceStress = Math.abs(state.mesh.nodes[0]?.stress ?? 1);
    const cornerNodes = state.mesh.nodes.filter(n => n.z > params.trenchDepth * 0.5 && n.z < params.trenchDepth * 1.5);
    if (cornerNodes.length > 0 && surfaceStress > 0) {
      const maxCorner = Math.max(...cornerNodes.map(n => Math.abs(n.stress)));
      trenchCornerStress = maxCorner / surfaceStress;
    }
  }

  return {
    oxideThickness,
    temperature,
    peakStress,
    birdBeakLength,
    oxidationRate,
    oxideUniformity,
    trenchCornerStress,
    thermalBudget: state.thermalBudget,
  };
}
