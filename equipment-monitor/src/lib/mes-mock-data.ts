import type { Lot, Recipe, SpcMeasurement } from './mes-types';
import { SPC_PARAMETERS, SPC_PARAM_KEYS } from './spc-parameters';

export const MOCK_RECIPES: Recipe[] = [
  { id: 'LITHO-193nm-v4',  name: 'LITHO-193nm-v4',  process: 'Lithography', chamber: 'LITHO01', exposure: 38, focus: 0 },
  { id: 'COAT-std-v2',     name: 'COAT-std-v2',     process: 'Coat',        chamber: 'COAT01',  exposure: 0,  focus: 0 },
  { id: 'DEV-alkaline-v1', name: 'DEV-alkaline-v1', process: 'Develop',     chamber: 'DEV01',   exposure: 0,  focus: 0 },
];

export const MOCK_LOTS: Lot[] = [
  { id: 'LOT-2026-001', product: 'LOGIC-7NM', recipeId: 'LITHO-193nm-v4',  waferCount: 25, status: 'in_process', startedAt: new Date('2026-05-02T08:00:00') },
  { id: 'LOT-2026-002', product: 'SRAM-7NM',  recipeId: 'COAT-std-v2',     waferCount: 25, status: 'pending',    startedAt: new Date('2026-05-02T10:00:00') },
  { id: 'LOT-2026-003', product: 'LOGIC-5NM', recipeId: 'DEV-alkaline-v1', waferCount: 25, status: 'pending',    startedAt: new Date('2026-05-02T12:00:00') },
];

// Deterministic pseudo-noise using a string hash — NOT Math.random()
// Returns a value in [-1.5, 1.5]
function stableNoise(lotId: string, wafer: number, param: string): number {
  const str = `${lotId}:${wafer}:${param}`;
  let hash = 2166136261; // FNV-1a offset basis
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619) >>> 0; // FNV prime, keep 32-bit unsigned
  }
  // Normalize to [-1.5, 1.5]
  const t = (hash / 0xffffffff);
  return (t - 0.5) * 3;
}

const SEED_ANCHOR = new Date('2026-05-02T08:00:00').getTime();

export function generateSeedMeasurements(lotId: string, count: number): SpcMeasurement[] {
  return Array.from({ length: count }, (_, i) => {
    const waferNumber = i + 1;
    const base: Record<string, number> = {};
    SPC_PARAM_KEYS.forEach((param) => {
      const { target, sigma } = SPC_PARAMETERS[param];
      base[param] = target + stableNoise(lotId, waferNumber, param) * sigma * 0.6;
    });

    return {
      id: `${lotId}-w${waferNumber}`,
      lotId,
      waferNumber,
      timestamp: new Date(SEED_ANCHOR + waferNumber * 2000),
      cd:    base.cd,
      cdu:   base.cdu,
      ovl_x: base.ovl_x,
      ovl_y: base.ovl_y,
      ler:   base.ler,
    };
  });
}
