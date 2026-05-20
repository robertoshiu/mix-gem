import type { SimulationParams } from './types';
import {
  IONIZATION_EFFICIENCY, CHAMBER_VOLUME, ELECTRON_TEMP_EV,
  CF4_ION_MASS_KG, ELECTRON_CHARGE,
  DIE_MASK, DIE_GRID_COLS, DIE_GRID_ROWS,
} from './constants';

export interface PlasmaState {
  electronDensity: number;
  ionFlux: number;
  gasRatio: number;
}

export function computePlasmaState(params: SimulationParams): PlasmaState {
  const electronDensity = IONIZATION_EFFICIENCY * params.icpPower
    / (params.chamberPressure * CHAMBER_VOLUME);
  const Te_J = ELECTRON_TEMP_EV * ELECTRON_CHARGE;
  const vBohm = Math.sqrt(Te_J / CF4_ION_MASS_KG);
  const ionFlux = electronDensity * vBohm;
  const totalFlow = params.cf4Flow + params.o2Flow;
  const gasRatio = totalFlow > 0 ? params.cf4Flow / totalFlow : 0.5;
  return { electronDensity, ionFlux, gasRatio };
}

export function computeIonFluxMap(params: SimulationParams): number[] {
  const { ionFlux } = computePlasmaState(params);
  const totalDies = DIE_GRID_COLS * DIE_GRID_ROWS;
  const centerCol = (DIE_GRID_COLS - 1) / 2;
  const centerRow = (DIE_GRID_ROWS - 1) / 2;
  const maxR = Math.sqrt(centerCol ** 2 + centerRow ** 2);
  const map = new Array(totalDies).fill(0);
  for (let i = 0; i < totalDies; i++) {
    if (!DIE_MASK[i]) continue;
    const col = i % DIE_GRID_COLS;
    const row = Math.floor(i / DIE_GRID_COLS);
    const r = Math.sqrt((col - centerCol) ** 2 + (row - centerRow) ** 2);
    map[i] = ionFlux * (1 - 0.1 * (r / maxR));
  }
  return map;
}
