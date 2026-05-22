import {
  createDefaultPipeline,
  runFederatedSim,
  computeFilmStack,
  computePipelineYield,
} from '../vpp-engine';

describe('createDefaultPipeline', () => {
  test('returns 8 steps matching PROCESS_ORDER', () => {
    const pipeline = createDefaultPipeline();
    expect(pipeline).toHaveLength(8);
    expect(pipeline[0].stepId).toBe('oxidation');
    expect(pipeline[7].stepId).toBe('metallization');
  });
});

describe('runFederatedSim', () => {
  test('returns per-step results for each pipeline step', () => {
    const pipeline = createDefaultPipeline();
    const result = runFederatedSim(pipeline);
    expect(result.perStep).toHaveLength(8);
  });

  test('each step has yield between 0 and 1', () => {
    const pipeline = createDefaultPipeline();
    const result = runFederatedSim(pipeline);
    for (const step of result.perStep) {
      expect(step.yield).toBeGreaterThanOrEqual(0);
      expect(step.yield).toBeLessThanOrEqual(1);
    }
  });

  test('cumulative yield is product of step yields', () => {
    const pipeline = createDefaultPipeline();
    const result = runFederatedSim(pipeline);
    const product = result.perStep.reduce((acc, s) => acc * s.yield, 1);
    expect(result.cumulativeYield).toBeCloseTo(product, 6);
  });

  test('overrides affect result', () => {
    const pipeline = createDefaultPipeline();
    const base = runFederatedSim(pipeline);
    pipeline[0].overrides = { temperature: 1200 };
    const modified = runFederatedSim(pipeline);
    expect(modified.perStep[0].thickness).not.toBe(base.perStep[0].thickness);
  });
});

describe('computeFilmStack', () => {
  test('returns layers with positive or zero thickness', () => {
    const pipeline = createDefaultPipeline();
    const result = runFederatedSim(pipeline);
    const stack = computeFilmStack(result.perStep);
    for (const layer of stack) {
      expect(layer.thickness).toBeGreaterThanOrEqual(0);
    }
  });

  test('filters out zero-thickness layers', () => {
    const pipeline = createDefaultPipeline();
    const result = runFederatedSim(pipeline);
    const stack = computeFilmStack(result.perStep);
    expect(stack.length).toBeLessThan(8);
  });
});

describe('computePipelineYield', () => {
  test('returns per-step and cumulative', () => {
    const pipeline = createDefaultPipeline();
    const result = runFederatedSim(pipeline);
    const yieldData = computePipelineYield(result.perStep);
    expect(yieldData.perStep).toHaveLength(8);
    expect(yieldData.cumulative).toBeLessThanOrEqual(1);
  });
});
