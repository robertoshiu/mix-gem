// src/lib/engines/hvac-engine.ts
// HVAC Lumped-Parameter Network Engine — 7-node fluid network for cleanroom HVAC
// Pure functions, no side effects, no randomness.

import type {
  HvacEngineState,
  HvacNetworkState,
  HvacNodeId,
  HvacNodeState,
  CoupledVariables,
  FacilityScenarioId,
  FacilityAlarm,
} from './facility-types';

import {
  INITIAL_HVAC_NODES,
  AHU_FAN_FLOW_KGS,
  AHU_FAN_POWER_KW,
  CHILLER_CAPACITY_KW,
  AIR_CP,
  ZONE_MASS_KG,
  EQUIPMENT_HEAT_W,
  OCCUPANT_HEAT_W,
  OCCUPANT_COUNT,
  OCCUPANT_PARTICLES,
  FFU_EFFICIENCY,
  ZONE_CR_PRESSURE_PA,
  AMBIENT_PARTICLE_COUNT,
  ISO5_LIMIT,
  UTILITY_VOLTAGE,
} from './facility-constants';

// ── Helpers ──

/** Deep-clone an HvacNetworkState (simple JSON round-trip) */
function cloneNodes(nodes: HvacNetworkState): HvacNetworkState {
  const result: Partial<HvacNetworkState> = {};
  for (const key of Object.keys(nodes) as HvacNodeId[]) {
    result[key] = { ...nodes[key] };
  }
  return result as HvacNetworkState;
}

/** Clamp a value to [lo, hi] */
function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

// ── Public API ──

/**
 * Create the initial HVAC engine state with 7 network nodes.
 */
export function createInitialHvacState(): HvacEngineState {
  return {
    nodes: cloneNodes(INITIAL_HVAC_NODES),
    chillerOnline: true,
    ahuFanOnline: true,
    doorBreached: false,
  };
}

/**
 * Advance the HVAC state by dt seconds.
 *
 * Physics per tick:
 * - AHU motor speed proportional to coupled.power_voltage / UTILITY_VOLTAGE
 * - Chiller cools supply air: deltaT = coolingPower / (flow * Cp)
 * - Zone-CR heat gain from equipment (45kW * 0.6) and occupants (120W * 8)
 * - Cooling from airflow: coolRate = flow * Cp * (T_zone - T_supply)
 * - Particles: occupant generation, FFU HEPA removal, ambient ingress on breach
 * - Pressure: positive differential maintained by AHU fan
 * - Scenario overrides for failure modes
 */
export function stepHvac(
  prev: HvacEngineState,
  dt: number,
  coupled: CoupledVariables,
  scenario: FacilityScenarioId,
): HvacEngineState {
  const nodes = cloneNodes(prev.nodes);
  let chillerOnline = prev.chillerOnline;
  let ahuFanOnline = prev.ahuFanOnline;
  let doorBreached = prev.doorBreached;

  // ── Scenario overrides ──
  if (scenario === 'chiller-failure') {
    chillerOnline = false;
  }
  if (scenario === 'ahu-fan-failure') {
    ahuFanOnline = false;
  }
  if (scenario === 'pressure-breach') {
    doorBreached = true;
  }

  // ── Voltage derating ──
  const voltageRatio = coupled.power_available
    ? clamp(coupled.power_voltage / UTILITY_VOLTAGE, 0, 1)
    : 0;

  // ── AHU fan flow ──
  const effectiveFlow = ahuFanOnline ? AHU_FAN_FLOW_KGS * voltageRatio : 0;

  // Update flow through network
  nodes['ahu-supply'].flow = effectiveFlow;
  nodes['duct-main'].flow = effectiveFlow;
  nodes['zone-cr'].flow = effectiveFlow * 0.6;
  nodes['zone-prod'].flow = effectiveFlow * 0.4;
  nodes['return-plenum'].flow = effectiveFlow;
  nodes['ffu-array'].flow = effectiveFlow * 0.6;
  nodes['chiller'].flow = effectiveFlow;

  // ── Chiller ──
  // The chiller regulates to a setpoint temperature (7 C output).
  // Max cooling capacity limits the delta-T it can achieve.
  const CHILLER_SETPOINT = 7; // target chiller output temp (C)
  if (chillerOnline && effectiveFlow > 0.01) {
    const returnT = nodes['return-plenum'].T;
    const maxDeltaT = (CHILLER_CAPACITY_KW * 1000) / (effectiveFlow * AIR_CP);
    const desiredDeltaT = returnT - CHILLER_SETPOINT;
    const actualDeltaT = Math.min(desiredDeltaT, maxDeltaT);
    nodes['chiller'].T = Math.max(4, returnT - actualDeltaT);
  } else {
    // No cooling: chiller temperature drifts toward return temperature
    const returnT = nodes['return-plenum'].T;
    nodes['chiller'].T += (returnT - nodes['chiller'].T) * 0.1 * dt;
  }

  // ── AHU Supply ──
  if (effectiveFlow > 0.01) {
    // AHU reheat coil + fan motor heat (~7 C rise, matching initial 14-7=7)
    nodes['ahu-supply'].T = nodes['chiller'].T + 7;
  } else {
    // No flow: AHU temp drifts toward ambient
    nodes['ahu-supply'].T += (25 - nodes['ahu-supply'].T) * 0.01 * dt;
  }

  // ── Duct Main ──
  if (effectiveFlow > 0.01) {
    // Duct heat gain (~2 C, matching initial 16-14=2)
    nodes['duct-main'].T = nodes['ahu-supply'].T + 2;
  } else {
    nodes['duct-main'].T += (25 - nodes['duct-main'].T) * 0.01 * dt;
  }

  // ── Zone-CR: Energy balance ──
  const zoneCR = nodes['zone-cr'];
  const equipmentHeatW = EQUIPMENT_HEAT_W * 0.6; // 60% of total in CR
  const occupantHeatW = OCCUPANT_HEAT_W * OCCUPANT_COUNT;
  const totalHeatGainW = equipmentHeatW + occupantHeatW; // 27000 + 960 = 27960 W

  if (effectiveFlow > 0.01) {
    const supplyT = nodes['duct-main'].T;
    const coolRateW = zoneCR.flow * AIR_CP * (zoneCR.T - supplyT);
    const netHeatW = totalHeatGainW - coolRateW;
    zoneCR.T += dt * netHeatW / (ZONE_MASS_KG * AIR_CP);
  } else {
    // No cooling: zone heats up from equipment
    zoneCR.T += dt * totalHeatGainW / (ZONE_MASS_KG * AIR_CP);
  }

  // ── Zone-Prod: Similar but less equipment heat ──
  const zoneProd = nodes['zone-prod'];
  const prodHeatW = EQUIPMENT_HEAT_W * 0.4; // 40% in prod
  if (effectiveFlow > 0.01) {
    const supplyT = nodes['duct-main'].T;
    const coolRateW = zoneProd.flow * AIR_CP * (zoneProd.T - supplyT);
    const netHeatW = prodHeatW - coolRateW;
    zoneProd.T += dt * netHeatW / (ZONE_MASS_KG * AIR_CP);
  } else {
    zoneProd.T += dt * prodHeatW / (ZONE_MASS_KG * AIR_CP);
  }

  // ── Return Plenum ──
  if (effectiveFlow > 0.01) {
    // Weighted mix of zone-cr and zone-prod return air
    nodes['return-plenum'].T =
      (zoneCR.T * zoneCR.flow + zoneProd.T * zoneProd.flow) /
      (zoneCR.flow + zoneProd.flow + 1e-9);
  } else {
    nodes['return-plenum'].T += (zoneCR.T - nodes['return-plenum'].T) * 0.05 * dt;
  }

  // ── Particles: Zone-CR ──
  // Generation: occupants emit particles
  const particleGeneration = OCCUPANT_PARTICLES * OCCUPANT_COUNT * dt; // particles/m3 * dt

  if (effectiveFlow > 0.01) {
    // FFU removes particles at HEPA efficiency
    const ffuRemoval = zoneCR.particleCount * FFU_EFFICIENCY * dt * 0.1;
    // Fresh supply dilution
    const dilutionRate = (zoneCR.flow / ZONE_MASS_KG) * dt;
    const dilution = zoneCR.particleCount * dilutionRate;

    zoneCR.particleCount += particleGeneration - ffuRemoval - dilution;
  } else {
    // No FFU, no dilution — particles accumulate
    zoneCR.particleCount += particleGeneration;
  }

  // Ambient ingress on door breach
  if (doorBreached) {
    // Large ambient particle influx
    const ingressRate = 0.05 * dt; // fraction of ambient per second
    zoneCR.particleCount += AMBIENT_PARTICLE_COUNT * ingressRate;
  }

  // Clamp particles >= 0
  zoneCR.particleCount = Math.max(0, zoneCR.particleCount);

  // ── FFU Array particles ──
  if (effectiveFlow > 0.01) {
    nodes['ffu-array'].particleCount = zoneCR.particleCount * (1 - FFU_EFFICIENCY);
  } else {
    nodes['ffu-array'].particleCount = zoneCR.particleCount;
  }

  // ── Particles: Zone-Prod (less critical) ──
  if (effectiveFlow > 0.01) {
    const prodDilution = (zoneProd.flow / ZONE_MASS_KG) * dt;
    zoneProd.particleCount *= (1 - prodDilution * 0.5);
  }
  zoneProd.particleCount += OCCUPANT_PARTICLES * 2 * dt; // fewer controls in prod

  // Return plenum particles
  nodes['return-plenum'].particleCount =
    (zoneCR.particleCount * 0.6 + zoneProd.particleCount * 0.4);

  // ── Pressure ──
  if (doorBreached) {
    // Pressure collapses rapidly
    zoneCR.P *= Math.max(0, 1 - 0.3 * dt);
    if (zoneCR.P < 0.01) zoneCR.P = 0;
  } else if (effectiveFlow > 0.01) {
    // Maintain positive differential proportional to flow
    const targetP = ZONE_CR_PRESSURE_PA * (effectiveFlow / AHU_FAN_FLOW_KGS);
    zoneCR.P += (targetP - zoneCR.P) * 0.2 * dt;
  } else {
    // Fan off: pressure decays
    zoneCR.P *= Math.max(0, 1 - 0.1 * dt);
  }

  // AHU supply pressure proportional to flow
  nodes['ahu-supply'].P = effectiveFlow > 0.01 ? 250 * (effectiveFlow / AHU_FAN_FLOW_KGS) : 0;
  nodes['duct-main'].P = effectiveFlow > 0.01 ? 120 * (effectiveFlow / AHU_FAN_FLOW_KGS) : 0;
  nodes['ffu-array'].P = effectiveFlow > 0.01 ? 50 * (effectiveFlow / AHU_FAN_FLOW_KGS) : 0;
  zoneProd.P = effectiveFlow > 0.01 ? 15 * (effectiveFlow / AHU_FAN_FLOW_KGS) : 0;
  nodes['return-plenum'].P = effectiveFlow > 0.01 ? -5 : 0;

  // ── Humidity ──
  // Chiller dehumidifies; no chiller = humidity rises
  if (chillerOnline && effectiveFlow > 0.01) {
    // Dehumidification brings zone toward 45%
    zoneCR.RH += (45 - zoneCR.RH) * 0.05 * dt;
  } else {
    // Without chiller: occupant moisture adds humidity
    zoneCR.RH += 0.05 * dt; // slow drift up
  }
  // Clamp humidity
  for (const key of Object.keys(nodes) as HvacNodeId[]) {
    nodes[key].RH = clamp(nodes[key].RH, 0, 100);
  }

  // ── Update upstream node temperatures for consistency ──
  nodes['ffu-array'].T = zoneCR.T;

  return {
    nodes,
    chillerOnline,
    ahuFanOnline,
    doorBreached,
  };
}

/**
 * Extract coupled output variables from HVAC state for other engines.
 */
export function getHvacCoupledOutputs(
  state: HvacEngineState,
): Pick<CoupledVariables, 'hvac_zone_cr_temp' | 'hvac_ahu_flow' | 'hvac_ahu_power_draw' | 'hvac_pressure_diff'> {
  const ahuFlow = state.nodes['ahu-supply'].flow;
  // AHU power scales with cube of flow ratio (fan affinity law)
  const flowRatio = ahuFlow / AHU_FAN_FLOW_KGS;
  const ahuPower = AHU_FAN_POWER_KW * flowRatio * flowRatio * flowRatio;

  return {
    hvac_zone_cr_temp: state.nodes['zone-cr'].T,
    hvac_ahu_flow: ahuFlow,
    hvac_ahu_power_draw: ahuPower,
    hvac_pressure_diff: state.nodes['zone-cr'].P,
  };
}

/**
 * Compute HVAC alarms based on current state.
 * Returns an array of alarms (may be empty for nominal operation).
 */
export function computeHvacAlarms(
  state: HvacEngineState,
  tick: number,
): FacilityAlarm[] {
  const alarms: FacilityAlarm[] = [];
  const zoneCR = state.nodes['zone-cr'];

  // Temperature alarm: warning at 26 C, critical at 30 C
  if (zoneCR.T >= 30) {
    alarms.push({
      subsystem: 'hvac',
      message: 'Zone-CR temperature critical (>30 C)',
      severity: 'critical',
      tick,
    });
  } else if (zoneCR.T >= 26) {
    alarms.push({
      subsystem: 'hvac',
      message: 'Zone-CR temperature warning (>26 C)',
      severity: 'warning',
      tick,
    });
  }

  // ISO 5 particle alarm
  if (zoneCR.particleCount > ISO5_LIMIT) {
    alarms.push({
      subsystem: 'hvac',
      message: `ISO 5 violation: ${Math.round(zoneCR.particleCount)} particles/m3`,
      severity: 'critical',
      tick,
    });
  }

  // Pressure alarm: warning below 10 Pa, critical below 2 Pa
  if (zoneCR.P < 2) {
    alarms.push({
      subsystem: 'hvac',
      message: 'Zone-CR pressure loss critical (<2 Pa)',
      severity: 'critical',
      tick,
    });
  } else if (zoneCR.P < 10) {
    alarms.push({
      subsystem: 'hvac',
      message: 'Zone-CR pressure low warning (<10 Pa)',
      severity: 'warning',
      tick,
    });
  }

  // Chiller offline alarm
  if (!state.chillerOnline) {
    alarms.push({
      subsystem: 'hvac',
      message: 'Chiller offline',
      severity: 'warning',
      tick,
    });
  }

  // AHU fan offline alarm
  if (!state.ahuFanOnline) {
    alarms.push({
      subsystem: 'hvac',
      message: 'AHU fan offline — no airflow',
      severity: 'critical',
      tick,
    });
  }

  return alarms;
}
