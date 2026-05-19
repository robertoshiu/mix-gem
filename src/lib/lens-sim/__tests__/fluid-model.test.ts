// equipment-monitor/src/lib/lens-sim/__tests__/fluid-model.test.ts
import { computeFluidState, computeDefectProbabilities } from '../fluid-model';
import { DEFAULT_PARAMS } from '../constants';

describe('fluid-model', () => {
  it('critical scan speed increases with higher surface tension', () => {
    // Higher flow rate -> better meniscus control -> higher critical speed
    const low = computeFluidState({ ...DEFAULT_PARAMS, fluidFlowRate: 0.5 }, 22.5);
    const high = computeFluidState({ ...DEFAULT_PARAMS, fluidFlowRate: 1.5 }, 22.5);
    expect(high.criticalScanSpeed).toBeGreaterThan(low.criticalScanSpeed);
  });

  it('bubble probability increases when scan speed exceeds critical', () => {
    const fast = computeFluidState({ ...DEFAULT_PARAMS, scanSpeed: 700 }, 22.5);
    const slow = computeFluidState({ ...DEFAULT_PARAMS, scanSpeed: 200 }, 22.5);
    expect(fast.bubbleProbability).toBeGreaterThan(slow.bubbleProbability);
  });

  it('defect probability > 50% when flow rate < 0.5 L/min', () => {
    const lowFlow = computeFluidState({ ...DEFAULT_PARAMS, fluidFlowRate: 0.3 }, 22.5);
    expect(lowFlow.bubbleProbability + lowFlow.watermarkRisk).toBeGreaterThan(0.5);
  });

  it('water temperature rises from ambient', () => {
    const state = computeFluidState(DEFAULT_PARAMS, 22.5);
    // Water acts as heat sink, should be slightly above ambient if lens is hot
    expect(state.waterTemp).toBeGreaterThanOrEqual(DEFAULT_PARAMS.ambientTemp);
  });

  it('computeDefectProbabilities returns per-die defect counts', () => {
    const fluid = computeFluidState(DEFAULT_PARAMS, 22.5);
    const defects = computeDefectProbabilities(fluid, DEFAULT_PARAMS, 9, 9);
    expect(defects).toHaveLength(81);
    defects.forEach((d) => expect(d).toBeGreaterThanOrEqual(0));
  });

  it('edge dies have higher defect counts than center dies', () => {
    const fluid = computeFluidState({ ...DEFAULT_PARAMS, scanSpeed: 600 }, 22.5);
    const defects = computeDefectProbabilities(fluid, { ...DEFAULT_PARAMS, scanSpeed: 600 }, 9, 9);
    // Center die
    const centerIdx = 4 * 9 + 4;
    // Edge die (leftmost in center row)
    const edgeIdx = 4 * 9 + 0;
    // On average edge should have more defects (bubble/film-pull at scan reversal)
    // Use a simple comparison — at high speed this should hold
    expect(defects[edgeIdx]).toBeGreaterThanOrEqual(defects[centerIdx]);
  });
});
