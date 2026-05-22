/**
 * simulation-engine.ts — Coupled Physics Loop for Oxidation Simulation
 *
 * Orchestrates the 6-step coupled physics loop per timestep:
 *   1. Thermal profile lookup
 *   2. Thermal FEA (2D heat equation on mesh)
 *   3. Deal-Grove oxidation with Kao stress feedback
 *   4. Stress field update (CTE + volume expansion + relaxation)
 *   5. Wafer metrics computation
 *   6. Snapshot into immutable StepState
 *
 * Uses a WeakMap<SimulationState, SolverState> cache so that immutable
 * state objects carry their mutable solver forward. Cache miss replays
 * all previous steps from scratch.
 */

import type {
  SimulationParams,
  SimulationState,
  StepState,
  SolverState,
} from './types';
import { DEFAULT_PARAMS, DEFAULT_TOTAL_STEPS, T_AMBIENT, KAO_VA, KAO_VD } from './constants';
import { createMesh } from './mesh-templates';
import { solveThermalStep, createThermalProfile } from './thermal-fea';
import { computeBA, computeB, advanceOxideThickness, adjustForHcl, adjustForPressure } from './deal-grove';
import { computeStressField } from './stress-model';
import { computeMetrics } from './wafer-metrics';
import { getPreset } from './presets';

// ─── WeakMap Solver Cache ───
const solverCache = new WeakMap<SimulationState, SolverState>();

// ─── Create Simulation ───

export function createSimulation(params: SimulationParams = DEFAULT_PARAMS): SimulationState {
  const totalSteps = params.totalSteps ?? DEFAULT_TOTAL_STEPS;
  const thermalProfile = createThermalProfile(params);
  const mesh = createMesh(params.geometryType, params);

  const state: SimulationState = {
    params: { ...params },
    steps: [],
    currentIndex: -1,
    totalSteps,
    thermalProfile,
    mesh,
  };

  // Initialize mutable solver state (separate mesh instance for in-place mutation)
  const solverMesh = createMesh(params.geometryType, params);
  const nr = solverMesh.nr;

  const solver: SolverState = {
    mesh: solverMesh,
    oxideThickness: new Array(nr).fill(params.initialOxideThickness),
    interfaceStress: new Array(nr).fill(0),
    oxidationRate: new Array(nr).fill(0),
    temperature: T_AMBIENT,
    time: 0,
    thermalBudget: 0,
  };

  solverCache.set(state, solver);
  return state;
}

// ─── Step Forward ───

export function stepForward(state: SimulationState): SimulationState {
  const nextIndex = state.currentIndex + 1;
  if (nextIndex >= state.totalSteps) return state;

  // Get or replay solver state
  let solver = solverCache.get(state);
  if (!solver) {
    solver = replaySolver(state);
  }

  // Run one coupled physics step
  const thermalStep = state.thermalProfile[nextIndex];
  if (!thermalStep) return state;

  runCoupledStep(solver, thermalStep, state.params);

  // Build snapshot
  const nr = solver.mesh.nr;
  const metrics = computeMetrics(solver, state.params);

  const midIdx = Math.floor(nr / 2);
  const edgeIdx = nr - 1;

  const stepState: StepState = {
    stepIndex: nextIndex,
    time: solver.time,
    temperature: solver.temperature,
    thermalPhase: thermalStep.phase,

    oxideThicknessCenter: solver.oxideThickness[0],
    oxideThicknessMid: solver.oxideThickness[midIdx],
    oxideThicknessEdge: solver.oxideThickness[edgeIdx],

    temperatureCenter: solver.mesh.nodes[0].T,
    temperatureMid: solver.mesh.nodes[midIdx]?.T ?? solver.temperature,
    temperatureEdge: solver.mesh.nodes[edgeIdx]?.T ?? solver.temperature,

    peakStress: metrics.peakStress,
    birdBeakLength: metrics.birdBeakLength,
    oxidationRate: metrics.oxidationRate,
    oxideUniformity: metrics.oxideUniformity,
    trenchCornerStress: metrics.trenchCornerStress,
    thermalBudget: solver.thermalBudget,

    nodeTemperatures: solver.mesh.nodes.map(n => n.T),
    nodeStresses: solver.mesh.nodes.map(n => n.stress),
    nodeOxideThicknesses: solver.oxideThickness.map(ox => ox),
  };

  const newState: SimulationState = {
    ...state,
    steps: [...state.steps, stepState],
    currentIndex: nextIndex,
  };

  solverCache.set(newState, solver);
  return newState;
}

// ─── Step N ───

export function stepN(state: SimulationState, n: number): SimulationState {
  let current = state;
  for (let i = 0; i < n; i++) {
    const next = stepForward(current);
    if (next === current) break; // capped
    current = next;
  }
  return current;
}

// ─── Apply Preset ───

export function applyPreset(state: SimulationState, presetId: string): SimulationState {
  const preset = getPreset(presetId);
  if (!preset) return state;
  const newParams = preset.apply(state.params);
  return createSimulation(newParams);
}

// ─── Internal: Replay solver from scratch on cache miss ───

function replaySolver(state: SimulationState): SolverState {
  const params = state.params;
  const solverMesh = createMesh(params.geometryType, params);
  const nr = solverMesh.nr;

  const solver: SolverState = {
    mesh: solverMesh,
    oxideThickness: new Array(nr).fill(params.initialOxideThickness),
    interfaceStress: new Array(nr).fill(0),
    oxidationRate: new Array(nr).fill(0),
    temperature: T_AMBIENT,
    time: 0,
    thermalBudget: 0,
  };

  // Replay all previous steps
  for (let i = 0; i <= state.currentIndex; i++) {
    const thermalStep = state.thermalProfile[i];
    if (thermalStep) {
      runCoupledStep(solver, thermalStep, params);
    }
  }

  return solver;
}

// ─── Internal: One Coupled Physics Step ───

import type { ThermalStep } from './types';

function runCoupledStep(
  solver: SolverState,
  thermalStep: ThermalStep,
  params: SimulationParams,
): void {
  const nr = solver.mesh.nr;

  // 1. Thermal FEA — update mesh node temperatures
  solveThermalStep(
    solver.mesh,
    thermalStep.temperature,
    thermalStep.dt,
    params.lampBalance,
    solver.oxidationRate,
    params.oxidationType,
  );

  // 2. Deal-Grove oxidation per surface node (iz=0, first nr nodes)
  for (let ir = 0; ir < nr; ir++) {
    const nodeT = solver.mesh.nodes[ir].T; // surface node temperature
    const stress = solver.interfaceStress[ir];

    let ba = computeBA(
      params.oxidationType,
      nodeT,
      params.substrateOrientation,
      stress,
      KAO_VA,
    );
    let b = computeB(
      params.oxidationType,
      nodeT,
      stress,
      KAO_VD,
    );

    // HCl enhancement
    if (params.oxidationType === 'hcl') {
      ba = adjustForHcl(ba, params.hclConcentration);
    }

    // HIBOX pressure scaling
    if (params.oxidationType === 'hibox') {
      ba = adjustForPressure(ba, params.pressure, 'ba');
      b = adjustForPressure(b, params.pressure, 'b');
    }

    solver.oxideThickness[ir] = advanceOxideThickness(
      solver.oxideThickness[ir],
      ba,
      b,
      thermalStep.dt,
    );

    solver.oxidationRate[ir] = ba; // approximate surface reaction rate
  }

  // 3. Stress field — update mesh node stresses
  computeStressField(solver.mesh, solver.oxideThickness, thermalStep.dt);

  // 4. Update interface stress from surface nodes
  for (let ir = 0; ir < nr; ir++) {
    solver.interfaceStress[ir] = solver.mesh.nodes[ir].stress;
  }

  // 5. Update solver scalar state
  solver.temperature = thermalStep.temperature;
  solver.time += thermalStep.dt;
  solver.thermalBudget += thermalStep.temperature * thermalStep.dt;
}
