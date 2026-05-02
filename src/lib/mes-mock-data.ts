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
  const seed = (lotId + wafer + param).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const t = ((seed * 9301 + 49297) % 233280) / 233280;
  // Map [0, 1] → [-1.5, 1.5]
  return (t - 0.5) * 3;
}

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
      timestamp: new Date(Date.now() - (count - waferNumber) * 2000),
      cd:    base.cd,
      cdu:   base.cdu,
      ovl_x: base.ovl_x,
      ovl_y: base.ovl_y,
      ler:   base.ler,
    };
  });
}
