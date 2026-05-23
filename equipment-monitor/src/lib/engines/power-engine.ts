// src/lib/engines/power-engine.ts
// Power Distribution Engine — 6-node electrical network with transformer thermal model and UPS battery
// Pure functions, no side effects, no randomness.

import type {
  PowerEngineState,
  PowerNodeId,
  PowerNodeState,
  UpsState,
  CoupledVariables,
  FacilityScenarioId,
  FacilityAlarm,
} from './facility-types';

import {
  INITIAL_POWER_NODES,
  INITIAL_UPS,
  UTILITY_VOLTAGE,
  TRANSFORMER_KVA,
  TRANSFORMER_Z_PCT,
  TRANSFORMER_TURNS_RATIO,
  TRANSFORMER_THETA_RISE_MAX,
  TRANSFORMER_TAU_S,
  AMBIENT_TEMP_C,
  TRANSFORMER_ALARM_TEMP,
  UPS_BATTERY_V,
  UPS_CAPACITY_AH,
  UPS_SOC_CRITICAL,
  UPS_TRANSFER_V,
  LIGHTING_LOAD_KW,
  PROCESS_TOOLS_LOAD_KW,
  PF_ALARM_THRESHOLD,
} from './facility-constants';

// ── Helpers ──

/** Deep-clone power nodes */
function cloneNodes(nodes: Record<PowerNodeId, PowerNodeState>): Record<PowerNodeId, PowerNodeState> {
  const result: Partial<Record<PowerNodeId, PowerNodeState>> = {};
  for (const key of Object.keys(nodes) as PowerNodeId[]) {
    result[key] = { ...nodes[key] };
  }
  return result as Record<PowerNodeId, PowerNodeState>;
}

/** Clone UPS state */
function cloneUps(ups: UpsState): UpsState {
  return { ...ups };
}

/** Clamp a value to [lo, hi] */
function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

// ── Transformer rated current (derived) ──
// KVA = V * I / 1000 => I_rated = KVA * 1000 / V
const TRANSFORMER_I_RATED = (TRANSFORMER_KVA * 1000) / UTILITY_VOLTAGE; // ~2174 A

// ── Public API ──

/**
 * Create the initial power engine state with 6 network nodes and UPS.
 */
export function createInitialPowerState(): PowerEngineState {
  return {
    nodes: cloneNodes(INITIAL_POWER_NODES),
    ups: { ...INITIAL_UPS },
    totalLoad: LIGHTING_LOAD_KW + PROCESS_TOOLS_LOAD_KW, // 97 kW base
    t1Online: true,
    t2Online: true,
  };
}

/**
 * Advance the power engine state by dt seconds.
 *
 * Physics per tick:
 * - Load aggregation from fixed loads + coupled HVAC and gas draws
 * - Transformer voltage drop model with impedance
 * - Transformer thermal model (first-order exponential approach)
 * - Transformer trip at 95 C (N+1 redundancy: T2 absorbs load)
 * - UPS battery model with voltage sag transfer and trickle charge
 * - Power factor computation from active/reactive power
 * - Scenario overrides for ups-depletion and transformer-overload
 */
export function stepPower(
  prev: PowerEngineState,
  dt: number,
  coupled: CoupledVariables,
  scenario: FacilityScenarioId,
): PowerEngineState {
  const nodes = cloneNodes(prev.nodes);
  const ups = cloneUps(prev.ups);
  let t1Online = prev.t1Online;
  let t2Online = prev.t2Online;

  // ── Load aggregation ──
  const totalLoad = LIGHTING_LOAD_KW
    + PROCESS_TOOLS_LOAD_KW
    + coupled.hvac_ahu_power_draw
    + coupled.gas_scrubber_power_draw;

  // Load fraction relative to transformer rated capacity
  let loadFraction = totalLoad / TRANSFORMER_KVA;

  // ── Scenario overrides ──
  let utilityV = UTILITY_VOLTAGE;

  if (scenario === 'ups-depletion') {
    utilityV = 205; // voltage sag
  }

  if (scenario === 'transformer-overload') {
    loadFraction = 1.1; // force 110% rated
  }

  // ── Utility node ──
  nodes['utility'].V = utilityV;
  nodes['utility'].P_active = totalLoad;
  nodes['utility'].P_reactive = totalLoad * 0.33;
  const pActive = nodes['utility'].P_active;
  const pReactive = nodes['utility'].P_reactive;
  const apparentPower = Math.sqrt(pActive * pActive + pReactive * pReactive);
  nodes['utility'].PF = apparentPower > 0 ? pActive / apparentPower : 1;
  nodes['utility'].I = (totalLoad * 1000) / (utilityV + 1e-9);
  nodes['utility'].theta = AMBIENT_TEMP_C;

  // ── Transformer load current ──
  const I_load = loadFraction * TRANSFORMER_I_RATED;

  // ── Determine which transformer is active ──
  // T1 is primary; if T1 tripped, T2 absorbs load
  const activeTransformer: PowerNodeId = t1Online ? 'transformer-t1' : 'transformer-t2';
  const standbyTransformer: PowerNodeId = t1Online ? 'transformer-t2' : 'transformer-t1';

  // ── Active transformer: voltage drop model ──
  // V_out = V_in * turns_ratio * (1 - I_load/I_rated * Z%)
  const dropFactor = clamp(I_load / TRANSFORMER_I_RATED, 0, 2);
  const V_xfmr = utilityV * TRANSFORMER_TURNS_RATIO * (1 - dropFactor * TRANSFORMER_Z_PCT);
  nodes[activeTransformer].V = Math.max(0, V_xfmr);
  nodes[activeTransformer].I = I_load;
  nodes[activeTransformer].P_active = totalLoad;
  nodes[activeTransformer].P_reactive = totalLoad * 0.33;
  nodes[activeTransformer].PF = nodes['utility'].PF;

  // ── Active transformer: thermal model ──
  // theta_target = theta_amb + theta_rise_max * (I/I_rated)^2
  const loadRatio = I_load / TRANSFORMER_I_RATED;
  const thetaTarget = AMBIENT_TEMP_C + TRANSFORMER_THETA_RISE_MAX * loadRatio * loadRatio;
  const thetaPrev = prev.nodes[activeTransformer].theta;
  // Under overload (>100%), thermal runaway accelerates — use reduced time constant
  // Physical basis: I^2*R losses scale quadratically, oil cooling saturates
  const effectiveTau = loadRatio > 1.0
    ? TRANSFORMER_TAU_S / (loadRatio * loadRatio * 10)
    : TRANSFORMER_TAU_S;
  const thetaNew = thetaPrev + dt * (thetaTarget - thetaPrev) / effectiveTau;
  nodes[activeTransformer].theta = thetaNew;

  // ── Transformer trip at 95 C ──
  if (nodes[activeTransformer].theta > 95) {
    if (activeTransformer === 'transformer-t1') {
      t1Online = false;
    } else {
      t2Online = false;
    }
  }

  // ── Standby transformer: idle or newly active ──
  if ((activeTransformer === 'transformer-t1' && !t1Online) ||
      (activeTransformer === 'transformer-t2' && !t2Online)) {
    // Active transformer just tripped; standby absorbs load next tick
    // For this tick, use standby values
    nodes[standbyTransformer].V = utilityV * TRANSFORMER_TURNS_RATIO * (1 - dropFactor * TRANSFORMER_Z_PCT);
    nodes[standbyTransformer].V = Math.max(0, nodes[standbyTransformer].V);
    nodes[standbyTransformer].I = I_load;
    nodes[standbyTransformer].P_active = totalLoad;
    nodes[standbyTransformer].P_reactive = totalLoad * 0.33;
    nodes[standbyTransformer].PF = nodes['utility'].PF;
    // Standby thermal starts from its previous temp (uses same effective tau)
    const standbyThetaPrev = prev.nodes[standbyTransformer].theta;
    const standbyThetaTarget = AMBIENT_TEMP_C + TRANSFORMER_THETA_RISE_MAX * loadRatio * loadRatio;
    const standbyEffTau = loadRatio > 1.0 ? TRANSFORMER_TAU_S / (loadRatio * loadRatio * 10) : TRANSFORMER_TAU_S;
    nodes[standbyTransformer].theta = standbyThetaPrev + dt * (standbyThetaTarget - standbyThetaPrev) / standbyEffTau;
  } else {
    // Standby is idle: cool toward ambient
    const standbyThetaPrev = prev.nodes[standbyTransformer].theta;
    nodes[standbyTransformer].theta = standbyThetaPrev + dt * (AMBIENT_TEMP_C - standbyThetaPrev) / TRANSFORMER_TAU_S;
    nodes[standbyTransformer].I = 0;
    nodes[standbyTransformer].P_active = 0;
    nodes[standbyTransformer].P_reactive = 0;
    nodes[standbyTransformer].PF = 1;
    nodes[standbyTransformer].V = utilityV;
  }

  // ── Downstream voltage: derive from active transformer output ──
  // Determine which transformer is effectively feeding downstream
  const feedV = t1Online
    ? nodes['transformer-t1'].V
    : (t2Online ? nodes['transformer-t2'].V : 0);

  // ── Switchgear: small voltage drop (~0.5%) ──
  nodes['switchgear'].V = Math.max(0, feedV * 0.995);
  nodes['switchgear'].I = I_load;
  nodes['switchgear'].P_active = totalLoad;
  nodes['switchgear'].P_reactive = totalLoad * 0.33;
  nodes['switchgear'].PF = nodes['utility'].PF;
  nodes['switchgear'].theta = AMBIENT_TEMP_C + 5; // switchgear runs slightly warm

  // ── PDU-A: small additional drop (~0.5%) ──
  nodes['pdu-a'].V = Math.max(0, nodes['switchgear'].V * 0.995);
  nodes['pdu-a'].I = I_load;
  nodes['pdu-a'].P_active = totalLoad;
  nodes['pdu-a'].P_reactive = totalLoad * 0.33;
  nodes['pdu-a'].PF = nodes['utility'].PF;
  nodes['pdu-a'].theta = AMBIENT_TEMP_C + 7; // PDU runs warm

  // ── UPS model ──
  if (utilityV < UPS_TRANSFER_V || scenario === 'ups-depletion') {
    // Transfer to battery
    ups.online = true;

    if (scenario === 'ups-depletion') {
      // Accelerated drain: SOC drops at 0.03/s (heavy load on undersized UPS bank)
      ups.soc = Math.max(0, ups.soc - dt * 0.03);
    } else {
      // Normal battery drain: SOC = SOC - dt * P_load / (V_bat * C_rated * 3600)
      const P_load_w = totalLoad * 1000; // convert kW to W
      ups.soc = Math.max(0, ups.soc - dt * P_load_w / (UPS_BATTERY_V * UPS_CAPACITY_AH * 3600));
    }

    // UPS output voltage degrades with SOC
    ups.outputV = UPS_BATTERY_V * clamp(ups.soc, 0, 1) / 1.6; // scale to ~230V at full SOC
    // When SOC is very low, UPS can't maintain voltage
    if (ups.soc <= 0) {
      ups.outputV = 0;
    }
  } else {
    // Normal: bypass mode
    ups.online = false;
    // Trickle charge when utility is good
    ups.soc = Math.min(1.0, ups.soc + dt * 0.0001);
    ups.outputV = utilityV;
  }

  // ── Load Bus: fed by PDU or UPS ──
  if (ups.online && ups.soc > 0) {
    // UPS feeds the load bus
    nodes['load-bus'].V = Math.max(0, Math.min(ups.outputV, nodes['pdu-a'].V));
  } else {
    // Utility bypass feeds load bus
    nodes['load-bus'].V = nodes['pdu-a'].V;
  }
  nodes['load-bus'].I = I_load;
  nodes['load-bus'].P_active = totalLoad;
  nodes['load-bus'].P_reactive = totalLoad * 0.33;
  // Compute PF at load bus
  const lbPA = nodes['load-bus'].P_active;
  const lbPR = nodes['load-bus'].P_reactive;
  const lbApparent = Math.sqrt(lbPA * lbPA + lbPR * lbPR);
  nodes['load-bus'].PF = lbApparent > 0 ? lbPA / lbApparent : 1;
  nodes['load-bus'].theta = AMBIENT_TEMP_C + 5;

  return {
    nodes,
    ups,
    totalLoad,
    t1Online,
    t2Online,
  };
}

/**
 * Extract coupled output variables from Power state for other engines.
 */
export function getPowerCoupledOutputs(
  state: PowerEngineState,
): Pick<CoupledVariables, 'power_voltage' | 'power_available' | 'power_ups_active'> {
  return {
    power_voltage: state.nodes['load-bus'].V,
    power_available: state.nodes['load-bus'].V > 0,
    power_ups_active: state.ups.online,
  };
}

/**
 * Compute power alarms based on current state.
 * Returns an array of alarms (may be empty for nominal operation).
 */
export function computePowerAlarms(
  state: PowerEngineState,
  tick: number,
): FacilityAlarm[] {
  const alarms: FacilityAlarm[] = [];

  // ── UPS SOC critical alarm ──
  if (state.ups.online && state.ups.soc < UPS_SOC_CRITICAL) {
    alarms.push({
      subsystem: 'power',
      message: `UPS battery SOC critical: ${(state.ups.soc * 100).toFixed(1)}% (<${UPS_SOC_CRITICAL * 100}%)`,
      severity: 'critical',
      tick,
    });
  }

  // ── Transformer temperature alarms ──
  for (const id of ['transformer-t1', 'transformer-t2'] as PowerNodeId[]) {
    if (state.nodes[id].theta > TRANSFORMER_ALARM_TEMP) {
      alarms.push({
        subsystem: 'power',
        message: `Transformer ${id} temperature critical: ${state.nodes[id].theta.toFixed(1)}C (>${TRANSFORMER_ALARM_TEMP}C)`,
        severity: 'critical',
        tick,
      });
    }
  }

  // ── Transformer offline alarms ──
  if (!state.t1Online) {
    alarms.push({
      subsystem: 'power',
      message: 'Transformer T1 tripped offline',
      severity: 'critical',
      tick,
    });
  }
  if (!state.t2Online) {
    alarms.push({
      subsystem: 'power',
      message: 'Transformer T2 tripped offline',
      severity: 'critical',
      tick,
    });
  }

  // ── Power factor warning ──
  if (state.nodes['load-bus'].PF < PF_ALARM_THRESHOLD) {
    alarms.push({
      subsystem: 'power',
      message: `Power factor low: ${state.nodes['load-bus'].PF.toFixed(2)} (<${PF_ALARM_THRESHOLD})`,
      severity: 'warning',
      tick,
    });
  }

  // ── Low voltage alarm ──
  if (state.nodes['load-bus'].V < UPS_TRANSFER_V && state.nodes['load-bus'].V > 0) {
    alarms.push({
      subsystem: 'power',
      message: `Load bus voltage low: ${state.nodes['load-bus'].V.toFixed(1)}V (<${UPS_TRANSFER_V}V)`,
      severity: 'warning',
      tick,
    });
  }

  return alarms;
}
