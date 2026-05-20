import { computeGpc, computeThicknessMap } from '../growth-model';
import { DEFAULT_PARAMS, GPC_MAX, DIE_GRID_COLS, DIE_GRID_ROWS, DIE_MASK } from '../constants';

describe('growth-model', () => {
  it('GPC equals GPC_MAX when both coverages are 1.0 at reference temp', () => {
    const gpc = computeGpc(1.0, 1.0, 1.0, 200);
    expect(gpc).toBeCloseTo(GPC_MAX, 2);
  });

  it('GPC is 0 when coverageA is 0', () => {
    const gpc = computeGpc(0, 1.0, 1.0, 200);
    expect(gpc).toBe(0);
  });

  it('GPC is 0 when coverageB is 0', () => {
    const gpc = computeGpc(1.0, 0, 1.0, 200);
    expect(gpc).toBe(0);
  });

  it('thickness map has correct length and center > edge for active dies', () => {
    const map = computeThicknessMap(DEFAULT_PARAMS, 0.95, 0.92, 0, 1.0);
    expect(map).toHaveLength(DIE_GRID_COLS * DIE_GRID_ROWS);
    const centerIdx = 4 * DIE_GRID_COLS + 4;
    const edgeIdx = 3 * DIE_GRID_COLS + 0;
    if (DIE_MASK[centerIdx] && DIE_MASK[edgeIdx]) {
      expect(map[centerIdx]).toBeGreaterThan(map[edgeIdx]);
    }
  });

  it('inactive dies have zero thickness', () => {
    const map = computeThicknessMap(DEFAULT_PARAMS, 1.0, 1.0, 0, 1.0);
    map.forEach((v, i) => {
      if (!DIE_MASK[i]) expect(v).toBe(0);
    });
  });
});
