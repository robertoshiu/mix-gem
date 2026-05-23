# Facility Subsystem Simulation Design

> Date: 2026-05-23
> Status: Approved
> Scope: HVAC + Cleanroom CFD, Gas + Chemical, EMS Power + UPS

## Summary

Enhance and enrich three war-room facility subsystem dashboards with physics-based simulation engines, bidirectional coupling, injectable fault scenarios, SCADA-style Canvas2D panel redesign, and 3D Babylon.js scene integration (equipment health coloring, cascade connection lines, click-to-panel).

Replaces the current `Math.random()` mock data generators with stateful pure-function engines that produce realistic, continuous telemetry.

## Architecture

Three simulation engines run client-side, sharing state through a coupling matrix on each tick:

```
+---------------+    +---------------+    +---------------+
|  HVAC Engine  |<-->|  Gas Engine   |<-->| Power Engine  |
|  (lumped PN)  |    |  (transport)  |    | (electrical)  |
+-------+-------+    +-------+-------+    +-------+-------+
        |                    |                    |
        +--------+-----------+--------------------+
                 v
        +-----------------+
        | Coupling Matrix |  <- shared state bus
        | (per-tick xfer) |
        +--------+--------+
                 v
        +-----------------+
        |  Zustand Store  |  <- facility-sim-store
        | (3 subsystems)  |
        +--------+--------+
                 v
    +----------+-+--------+----------+
    | Panels     | 3D Scene| TopBar  |
    | (Canvas2D) | (Babylon)| (KPIs) |
    +------------+---------+---------+
```

Each engine is a pure function: `(prevState, dt, coupledInputs, scenario) -> nextState`. The tick loop runs at 1 Hz (1-second intervals), accumulates history into a 300-point ring buffer (5 minutes), and writes to a new `useFacilitySimStore` Zustand store. Engines have zero React dependencies.

The existing `war-room-mock-data.ts` generators are replaced entirely. The existing panel components are rewritten with Canvas2D charts.

---

## Engine 1: HVAC Lumped-Parameter Network

### 7-Node Fluid Network

```
[Chiller] -> [AHU-Supply] -> [Duct-Main] -> [Zone-CR] -> [Zone-Prod] -> [Return-Plenum] -> [Chiller]
                                                |
                                           [FFU-Array]
```

### Per-Node State Variables (5)

| Variable | Unit | Description |
|----------|------|-------------|
| T | C | Temperature |
| RH | % | Relative humidity |
| P | Pa | Pressure (gauge relative to ambient) |
| flow | kg/s | Mass flow rate |
| particleCount | particles/m3 | ISO class tracking |

### Physics Per Tick (dt = 1s)

**Energy balance:**
```
T_new = T + dt * (Q_in - Q_out) / (m * Cp)
```
Where `Q_in` includes equipment heat load, occupant load, and upstream node temperature; `Q_out` is cooling capacity (chiller COP model) or downstream transfer.

**Pressure network:**
Flow between nodes follows `dP = R * flow^2` (resistance model). AHU fan provides pressure head. FFUs have fixed resistance.

**Humidity:**
Psychrometric model. Cooling coil dehumidifies when coil temp < dewpoint. Occupants add ~50 g/hr moisture each.

**Particles:**
Advection with flow. FFUs filter at 99.99% efficiency (HEPA). Occupants shed ~10^5 particles/min. Door breach injects ambient particle load.

### Cleanroom Targets

- Zone-CR: ISO 5 (3,520 particles/m3 at 0.5 um)
- Zone-Prod: ISO 7

### Key Constants

| Parameter | Value |
|-----------|-------|
| Chiller capacity | 150 kW |
| AHU fan | 15,000 CFM |
| Zone volume | 400 m3 |
| Positive pressure differential | 20 Pa |

---

## Engine 2: Gas & Chemical Delivery

### Gas Cabinet Model (H2, NH3, Cl2)

Cabinet holds bulk gas at supply pressure. Micro-leak rate:
```
leak = k * P_supply * (1 + alpha * dT)
```
Leak increases with temperature (coupled from HVAC).

Diffusion from leak point:
```
C(r,t) = (Q / 4*pi*D*t) * exp(-r^2 / (4*D*t))
```
Concentration decays with distance from source. Each sensor has a fixed position `r` from its nearest cabinet.

### Scrubber Model

- Inlet flow from process exhaust + cabinet leaks
- Removal efficiency: `eta = eta_max * (1 - flow/flow_max)` (degrades as flow approaches capacity)
- Power draw: `P = P_base + k * flow^2` (feeds into Power engine via coupling matrix)
- At >90% capacity, downstream gas concentrations rise

### O2 Displacement Model

```
O2% = 20.9 * (1 - sum(C_gas / C_total))
```
O2 below 19.5% triggers low-oxygen alarm.

### Sensor Physics

- Response time: first-order lag, tau = 3s (electrochemical sensors)
- `C_measured = C_prev + dt/tau * (C_actual - C_prev)`
- Sensor drift: +/-0.1% per hour baseline drift
- Fault mode: stuck reading or zero output

### Thresholds (OSHA PELs)

| Gas | TWA | STEL/Ceiling |
|-----|-----|-------------|
| H2S | 10 ppm | 15 ppm |
| NH3 | 25 ppm | 35 ppm |
| Cl2 | — | 0.5 ppm ceiling |
| CO | 25 ppm | — |
| H2 | — | LEL 40,000 ppm |
| O2 | 19.5% low | 23.5% high |

---

## Engine 3: EMS Power & UPS

### Network Topology (6 nodes)

```
[Utility Feed] -> [Transformer T1/T2] -> [Main Switchgear] -> [PDU-A] -> [Load Bus]
                                                |
                                           [UPS Bank] <- [Battery]
```

### Per-Node State Variables

| Variable | Unit | Description |
|----------|------|-------------|
| V | V | Voltage |
| I | A | Current |
| P_active | kW | Active power |
| P_reactive | kVAr | Reactive power |
| PF | — | Power factor |
| theta | C | Temperature (thermal derating) |

### Physics Per Tick

**Load aggregation:**
Total load = HVAC AHU motors + scrubber pumps + lighting + process tools. HVAC and Gas engines feed their power draw into the coupling matrix.

**Transformer model:**
```
V_out = V_in * turns_ratio * (1 - I_load / I_rated * Z%)
theta_new = theta_amb + theta_rise_max * (I / I_rated)^2    [tau = 300s, oil-cooled]
```
Over 85 C triggers thermal alarm.

**UPS model:**
Normal mode: bypass (utility feeds load directly). On voltage sag (<210V): transfer to battery in 4ms.
```
SOC_new = SOC - dt * P_load / (V_bat * C_rated)
```
At SOC < 20%, critical alarm.

**Power factor:**
```
PF = P_active / sqrt(P_active^2 + P_reactive^2)
```
Motor-heavy loads (AHU, scrubbers) contribute lagging reactive power. PF below 0.85 triggers correction alarm.

### Key Specs

| Parameter | Value |
|-----------|-------|
| Utility | 230V / 50Hz |
| Transformers | 500 kVA each (N+1 redundancy) |
| UPS | 120 kVA, 15-min battery at full load |
| PDU rated | 400A |

---

## Coupling Matrix

Bidirectional state variable subscriptions between engines. Each tick, after all three engines compute their next state, coupled outputs are exchanged.

### Coupled Variables

```typescript
type CoupledVariables = {
  // HVAC exports
  hvac_zone_cr_temp: number;        // C -> Gas (leak rate), Power (cooling load)
  hvac_ahu_flow: number;            // kg/s -> Gas (dilution rate)
  hvac_ahu_power_draw: number;      // kW -> Power (load)
  hvac_pressure_diff: number;       // Pa -> Gas (ingress rate)

  // Gas exports
  gas_scrubber_power_draw: number;  // kW -> Power (load)
  gas_total_leak_rate: number;      // mol/s -> HVAC (contaminant load)
  gas_scrubber_exhaust_temp: number; // C -> HVAC (return air temp)

  // Power exports
  power_voltage: number;            // V -> HVAC (motor speed), Gas (sensor accuracy)
  power_available: boolean;         // -> HVAC (AHU on/off), Gas (scrubber on/off)
  power_ups_active: boolean;        // -> HVAC (shed non-critical zones)
};
```

### Execution

All three engines run with previous tick's coupled values (explicit Euler). Effects propagate with a 1-second delay, which is physically realistic for these time scales.

### Safety Guards

Each coupled variable is clamped to physical limits (temperature <= 80 C, voltage >= 0, etc.) to prevent runaway feedback loops during multi-fault scenarios.

Coupling strength is scenario-aware: nominal mode has weak coupling (small perturbations); faults drive large swings.

---

## Fault Scenarios (7 + Nominal)

Each scenario injects a step change into one engine at t=0. Cascading effects propagate naturally through the coupling matrix over ~60 seconds.

| # | Name | Origin | Injection | Cascade Path |
|---|------|--------|-----------|--------------|
| 0 | Nominal | — | None | Steady-state baseline |
| 1 | UPS Battery Depletion | Power | SOC forced to 18%, utility voltage sag to 205V | AHU motors slow (reduced airflow) -> CR temp rises 2-3 C -> gas leak rates increase |
| 2 | Transformer Overload | Power | Load spike to 110% rated, T1 temp ramp to 95 C | T1 trips offline, T2 absorbs full load -> voltage dip -> AHU partial power |
| 3 | Chiller Failure | HVAC | Chiller cooling capacity -> 0 | Zone temps climb ~0.5 C/min -> gas outgassing accelerates -> scrubber load rises -> power draw spikes |
| 4 | AHU Fan Failure | HVAC | AHU flow -> 0, fan power -> 0 | Particle counts spike (no HEPA filtration) -> pressure differential collapses -> ambient gas ingress -> O2 displacement |
| 5 | Cleanroom Pressure Breach | HVAC | Pressure differential forced to 0 Pa | Ambient particles flood in -> ISO class violation -> gas sensors detect external contaminants |
| 6 | Chemical Leak (NH3) | Gas | NH3 cabinet leak rate x50 | NH3 concentration ramp -> scrubber overload -> power surge -> HVAC return air contaminated |
| 7 | Scrubber Failure | Gas | Scrubber efficiency -> 0% | Exhaust gases accumulate -> multi-gas alarm -> HVAC recirculates contaminated air -> power load drops (scrubber off) but toxic risk rises |

### Recovery

After 60s the fault can be "cleared," and engines return to nominal along realistic decay curves (not instant reset).

---

## Panel Redesign: SCADA-Style Canvas2D

Each of the 3 panels is a full-height side panel with consistent SCADA layout. Raw Canvas2D replaces Recharts.

### Common Panel Anatomy (top to bottom)

1. **Header** — Subsystem icon, name, severity badge, close button
2. **KPI strip** — 4-6 key metrics in compact cards with mini-sparklines (30s real-time)
3. **Network schematic** — Canvas2D rendering of the lumped-parameter nodes with live values on each node. Animated flow direction arrows. Node colors reflect health (green/amber/red).
4. **Trend charts** — Expandable Canvas2D strip charts (5-min window, 300 points). Vertical markers for fault injection and cascade arrival. 2-3 charts per panel.
5. **Equipment status** — Hardware cards with status indicators
6. **Alarm feed** — Scrollable list fed from engine state

### Per-Panel Specifics

| Panel | Network Schematic | KPIs | Trend Charts |
|-------|------------------|------|-------------|
| HVAC | 7-node loop with T/RH/P at each node, FFU array | Temp, RH, dP, Particle Count, AHU Flow, Chiller Load | Zone temp, particle count |
| Gas | Cabinet -> sensor positions -> scrubber, concentration halos | O2%, worst-gas ppm, scrubber load, sensor health | NH3/H2S concentration, scrubber efficiency |
| Power | Utility -> T1/T2 -> switchgear -> PDU -> UPS/battery tree | Voltage, Current, PF, Load%, UPS SOC, Energy | Voltage trend, load% trend, battery SOC |

### Design Tokens

- Background: Navy `#0A1628`
- Data lines: Cyan `#22D3EE`
- Warnings: AMAT Orange `#F47920`
- Numeric readouts: Fira Code

---

## 3D Scene Integration

### Equipment Health Coloring

Each subsystem equipment mesh gets its PBR emissive color updated per tick:

| State | Emissive Color | Intensity | Pulse |
|-------|---------------|-----------|-------|
| Normal | Current color | 12% | None |
| Warning | Amber `#F59E0B` | 30% | 1 Hz sine |
| Alarm | Red `#EF4444` | 50% | 2 Hz sine |

### Cascade Connection Lines

When a fault is active, glowing lines connect the origin equipment to each affected equipment in cascade order:

- Built with `BABYLON.MeshBuilder.CreateTube` using curved paths between mesh positions
- Color matches severity (amber -> red as cascade deepens)
- Animated dash pattern using texture offset (flows from cause -> effect)
- Opacity ramps up as the cascade arrives at each node
- Lines disappear when fault is cleared and engines return to nominal

### Click-to-Panel Wiring

Clicking any subsystem equipment mesh in the 3D scene opens the corresponding panel (HVAC, Gas, or Power). The existing `onAssetPick` callback is extended: if the picked asset belongs to a subsystem with a facility panel, open that panel instead of the metadata popup. The panel's network schematic highlights the clicked node.

### Performance Budget

- Max 6 tube meshes for cascade lines, reused via object pool
- Emissive updates are uniform changes only (no material recreation)
- Target: zero frame drop from current baseline

---

## File Structure

### New Files (engine layer, no React)

```
src/lib/engines/
  hvac-engine.ts          -- 7-node lumped-parameter network
  gas-engine.ts           -- sensor transport + scrubber model
  power-engine.ts         -- electrical distribution network
  coupling-matrix.ts      -- bidirectional state exchange
  facility-scenarios.ts   -- 7 fault definitions + injection/recovery
  facility-constants.ts   -- physical constants, node configs, thresholds
  facility-types.ts       -- shared types for all 3 engines
  history-buffer.ts       -- 300-point ring buffer for trend data
```

### New Files (React layer)

```
src/stores/facility-sim-store.ts     -- Zustand: tick loop, engine state, scenario control
src/components/war-room/
  HvacPanel.tsx                      -- replaces BuildingAutoPanel
  GasChemicalPanel.tsx               -- replaces GasDetectionPanel
  PowerUpsPanel.tsx                  -- replaces PowerMonitoringPanel
  canvas/
    NetworkSchematic.tsx             -- reusable Canvas2D node-graph renderer
    TrendChart.tsx                   -- reusable Canvas2D strip chart with markers
    MiniSparkline.tsx                -- 30s real-time sparkline for KPI cards
```

### Modified Files

- `war-room/page.tsx` — import 3 new panels, wire to facility-sim-store
- `WarRoomBabylonScene.tsx` — add health coloring, cascade lines, click-to-panel
- `TopBar.tsx` — add scenario dropdown for 7 facility faults (separate from existing 6 fab-twin faults)

---

## Testing (~90 tests)

| Category | Count | Focus |
|----------|-------|-------|
| HVAC engine | ~20 | Steady-state convergence, energy balance, pressure network, particle transport |
| Gas engine | ~20 | Diffusion model, scrubber efficiency curve, O2 displacement, sensor lag |
| Power engine | ~20 | Transformer thermal model, UPS transfer/SOC, load aggregation, PF calculation |
| Coupling matrix | ~10 | Propagation delay, clamp guards, bidirectional flow, explicit Euler correctness |
| Scenarios | ~7 | One per scenario verifying cascade reaches expected endpoints within 60s |
| History buffer | ~5 | Ring wrap, marker insertion, window queries |
| Store integration | ~8 | Tick advances state, scenario injection/recovery, selector performance |

All engine tests are pure-function tests (no React, no DOM). Store tests use the established `INITIAL_STATE + setState() + getState()` pattern.
