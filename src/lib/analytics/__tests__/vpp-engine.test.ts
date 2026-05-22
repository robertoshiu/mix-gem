import {
  createDefaultPipeline,
  runFederatedSim,
  computeFilmStack,
  computePipelineYield,
  computeStressProfile,
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

describe('computeStressProfile', () => {
  const pipeline = createDefaultPipeline();
  const result = runFederatedSim(pipeline);

  test('returns layers only for steps with E > 0 and thickness > 0', () => {
    const stress = computeStressProfile(result.perStep, 'Si(100)', 25, 'biaxial');
    expect(stress.layers.length).toBeGreaterThan(0);
    expect(stress.layers.length).toBeLessThan(8);
    for (const layer of stress.layers) {
      expect(layer.thickness).toBeGreaterThan(0);
    }
  });

  test('intrinsic stress matches FILM_STRESS_PROPERTIES', () => {
    const stress = computeStressProfile(result.perStep, 'Si(100)', 25, 'biaxial');
    const oxLayer = stress.layers.find((l) => l.stepId === 'oxidation');
    expect(oxLayer).toBeDefined();
    expect(oxLayer!.intrinsicStress).toBe(-300);
  });

  test('thermal stress is zero at room temperature', () => {
    const stress = computeStressProfile(result.perStep, 'Si(100)', 25, 'biaxial');
    for (const layer of stress.layers) {
      expect(layer.thermalStress).toBeCloseTo(0, 1);
    }
  });

  test('thermal stress increases with temperature', () => {
    const s25 = computeStressProfile(result.perStep, 'Si(100)', 25, 'biaxial');
    const s400 = computeStressProfile(result.perStep, 'Si(100)', 400, 'biaxial');
    const ox25 = s25.layers.find((l) => l.stepId === 'oxidation')!;
    const ox400 = s400.layers.find((l) => l.stepId === 'oxidation')!;
    expect(Math.abs(ox400.thermalStress)).toBeGreaterThan(Math.abs(ox25.thermalStress));
  });

  test('stress mode affects effective modulus', () => {
    const biax = computeStressProfile(result.perStep, 'Si(100)', 200, 'biaxial');
    const plane = computeStressProfile(result.perStep, 'Si(100)', 200, 'plane-stress');
    const oxBiax = biax.layers.find((l) => l.stepId === 'oxidation')!;
    const oxPlane = plane.layers.find((l) => l.stepId === 'oxidation')!;
    expect(Math.abs(oxBiax.thermalStress)).toBeGreaterThan(Math.abs(oxPlane.thermalStress));
  });

  test('substrate type affects thermal stress via CTE', () => {
    const si = computeStressProfile(result.perStep, 'Si(100)', 300, 'biaxial');
    const sige = computeStressProfile(result.perStep, 'SiGe', 300, 'biaxial');
    const siOx = si.layers.find((l) => l.stepId === 'oxidation')!;
    const sigeOx = sige.layers.find((l) => l.stepId === 'oxidation')!;
    expect(siOx.thermalStress).not.toBeCloseTo(sigeOx.thermalStress, 1);
  });

  test('wafer bow is non-negative', () => {
    const stress = computeStressProfile(result.perStep, 'Si(100)', 200, 'biaxial');
    expect(stress.waferBow).toBeGreaterThanOrEqual(0);
  });

  test('wafer bow increases with film stress', () => {
    const s25 = computeStressProfile(result.perStep, 'Si(100)', 25, 'biaxial');
    const s400 = computeStressProfile(result.perStep, 'Si(100)', 400, 'biaxial');
    expect(s400.waferBow).toBeGreaterThanOrEqual(s25.waferBow);
  });

  test('cumulative stress profile starts at zero', () => {
    const stress = computeStressProfile(result.perStep, 'Si(100)', 200, 'biaxial');
    expect(stress.cumulativeStress[0]).toEqual({ depth: 0, stress: 0 });
    expect(stress.cumulativeStress.length).toBe(stress.layers.length + 1);
  });

  test('net stress is thickness-weighted average', () => {
    const stress = computeStressProfile(result.perStep, 'Si(100)', 200, 'biaxial');
    const totalST = stress.layers.reduce((s, l) => s + l.totalStress * l.thickness, 0);
    const totalT = stress.layers.reduce((s, l) => s + l.thickness, 0);
    expect(stress.netStress).toBeCloseTo(totalST / totalT, 2);
  });
});
