# Diffusion 3D Digital Twin — Full Pair-Diffusion + Point Defect Model

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:writing-plans to create the implementation plan from this design.

**Goal:** Build a diffusion digital twin at `/mes/fab-floor/diffusion/diffusion-sim` that solves coupled 1D PDEs for dopant transport and point defects with charge-state-dependent diffusivity, five thermal process modes, and real-time 3D visualization.

**Architecture:** Crank-Nicolson PDE solver on 200-bin depth grid, driven by pre-computed thermal profiles spanning six orders of magnitude in timescale (furnace minutes → laser microseconds). Six dopant species with full vacancy-interstitial pair diffusion, {311} TED, OED, clustering, and segregation. Split 70/30 Babylon.js 3D wafer slab + Canvas2D multi-species concentration plots.

**Tech Stack:** TypeScript, Next.js 15.1, Babylon.js v9.6.2, Canvas2D, Vitest

---

## 1. Architecture Overview

**Route:** `/mes/fab-floor/diffusion/diffusion-sim`
**Accent color:** Amber `#F59E0B` (matching existing diffusion process)
**Library:** `equipment-monitor/src/lib/diffusion-sim/` (11 modules + tests)
**Components:** `equipment-monitor/src/components/diffusion-sim/` (4 components)

**Physics engine** solves coupled 1D partial differential equations on a depth grid (200 bins). Six dopant species (B, P, As, Sb, In, Ge) each with charge-state-dependent diffusivity (`D⁺, D⁻, D⁰, D²⁻`) mediated by vacancy-interstitial pair transport. Point defects (vacancies V, interstitials I) tracked as separate concentration fields with generation, recombination, and surface boundary conditions. Fick's second law extended to `dC/dt = d/dx[D_eff(C,T,n_i,V,I) * dC/dx]` where effective diffusivity depends on Fermi level, point defect supersaturation, and temperature.

**Five thermal modes** define the temperature profile T(t): furnace (minutes), RTA (seconds), spike (sub-second), flash (milliseconds), laser (microseconds). Each mode generates a distinct T(t) curve that drives the diffusion solver at each simulation step.

**Simulation engine** follows the established pattern: immutable `SimulationState` with `WeakMap<SimulationState, SolverState>` cache for mutable PDE grid arrays. Each `stepForward()` advances one thermal timestep, solves the coupled diffusion + point defect PDEs, and snapshots concentrations into a `StepState`.

**Layout:** 70/30 flex split. Left: Babylon.js 3D wafer slab with volumetric dopant color + point defect particles + junction isosurface. Right: Canvas2D log-concentration vs depth plot with animated multi-species curves + thermal budget gauge.

---

## 2. Physics Module 1 — Point Defect Model (`point-defects.ts`)

Track vacancy (V) and interstitial (I) concentrations across depth, governing all dopant transport.

**Equilibrium concentrations** follow Arrhenius:
```
C_V*(T) = C_V0 * exp(-E_fV / kT)
C_I*(T) = C_I0 * exp(-E_fI / kT)
```
where `E_fV ~ 2.0 eV`, `E_fI ~ 3.0 eV` are formation energies, `C_V0, C_I0 ~ 5e22 cm^-3` (silicon lattice density).

**Supersaturation ratio** drives TED:
```
S_I = C_I / C_I*(T)
S_V = C_V / C_V*(T)
```

**Bulk recombination** (V + I -> null) via Gilmer-type rate:
```
R_IV = k_IV(T) * (C_I * C_V - C_I* * C_V*)
k_IV = 4*pi * (D_I + D_V) * a0 * exp(-E_rec/kT)
```
where `a0 ~ 0.235 nm` (Si lattice spacing), `E_rec ~ 0.5 eV`.

**Surface boundary conditions:** At SiO2/Si interface, interstitial injection during oxidation (OED):
```
J_I_surface = k_ox * oxidation_rate(T, ambient)
```
where `k_ox` scales with wet vs dry O2. Free surface (no oxide) acts as perfect sink: `C_I = C_I*`, `C_V = C_V*`.

**{311} defect dissolution** (TED source): Excess interstitials from implant damage stored in {311} rod-like defects, released with time constant:
```
dN_311/dt = -N_311 / tau_311(T)
tau_311(T) = tau0 * exp(E_311/kT)     // E_311 ~ 3.6 eV
```
Released interstitials feed into `C_I` field, driving transient enhanced diffusion.

**Exported interface:**
```typescript
interface PointDefectState {
  vacancies: number[];      // C_V[bin], cm^-3
  interstitials: number[];  // C_I[bin], cm^-3
  defect311: number[];      // N_311[bin], stored interstitials
}
function createPointDefectState(bins: number, implantDamage: number[]): PointDefectState;
function stepPointDefects(state: PointDefectState, T: number, dt: number, ambient: AmbientGas, binSize: number): void;
function getSuperSaturation(state: PointDefectState, T: number): { sI: number[]; sV: number[] };
```

---

## 3. Physics Module 2 — Diffusivity Model (`diffusivity.ts`)

Compute effective dopant diffusivity `D_eff(x)` at each depth bin, accounting for charge state, Fermi level, and point defect supersaturation.

**Charge-state-dependent diffusivity:**
```
D_total = D_I + D_V
D_I = h_I * [D_I0 + D_I+ * (p/n_i) + D_I- * (n/n_i) + D_I2- * (n/n_i)^2]
D_V = h_V * [D_V0 + D_V+ * (p/n_i) + D_V- * (n/n_i) + D_V2- * (n/n_i)^2]
```
where `h_I = C_I/C_I*`, `h_V = C_V/C_V*`, and each `D_X^q = D0_X^q * exp(-E_X^q / kT)`.

**Intrinsic carrier concentration:**
```
n_i(T) = 3.87e16 * T^(3/2) * exp(-0.605 eV / kT)   // cm^-3
```

**Fermi level / carrier concentrations** from charge neutrality:
```
n = (N_D - N_A)/2 + sqrt[(N_D - N_A)^2/4 + n_i^2]
p = n_i^2 / n
```

**Dopant parameter database** (6 species):

| Species | Mechanism | Key D0 (cm^2/s) | Ea (eV) | Notes |
|---------|-----------|------------------|---------|-------|
| B | Interstitial-dominated | D_I0=0.037, D_I+=0.72 | 3.46, 3.46 | f_I~1.0, TED-sensitive |
| P | Dual (V+I) | D_V-=3.85, D_I0=3.85 | 3.66, 3.66 | f_I~0.5 |
| As | Vacancy-dominated | D_V0=0.066, D_V-=12.0 | 3.44, 4.05 | f_V~0.7, clusters above 2e20 |
| Sb | Pure vacancy | D_V0=0.214, D_V-=15.0 | 3.65, 4.08 | f_V~1.0, no TED |
| In | Interstitial-dominated | D_I0=0.6, D_I-=1.2 | 3.5, 3.9 | Deep acceptor |
| Ge | Mixed (strain marker) | D_I0=6.2, D_V0=0.28 | 5.28, 4.65 | Minimal electrical activity |

**Clustering model:**
```
C_active = C_sol(T) * [1 - exp(-C_total/C_sol(T))]
C_clustered = C_total - C_active
```
Clustered dopant is immobile (D = 0).

**Exported interface:**
```typescript
interface DopantDB { d0: Record<string, number>; ea: Record<string, number>; fI: number; fV: number; cSol0: number; eSol: number; }
function intrinsicCarrier(T: number): number;
function carrierConcentrations(netDoping: number, ni: number): { n: number; p: number };
function effectiveDiffusivity(species: DopantSpecies, T: number, ni: number, n: number, p: number, sI: number, sV: number): number;
function activeFraction(C_total: number, species: DopantSpecies, T: number): number;
```

---

## 4. Physics Module 3 — Thermal Profile Generator (`thermal-profile.ts`)

Generate the temperature-vs-time curve T(t) for each of the five thermal process modes.

**Five thermal modes:**

**1. Furnace Anneal** (minutes timescale):
```
Ramp:  T(t) = T_ambient + rampRate * t           // 5-15 C/min
Soak:  T(t) = T_peak                              // 30-120 min hold
Cool:  T(t) = T_peak - coolRate * (t - t_soak)    // 2-5 C/min
```

**2. RTA** (seconds):
```
Ramp:  T(t) = T_ambient + rampRate * t           // 50-200 C/s
Soak:  T(t) = T_peak                              // 1-60 s hold
Cool:  T(t) = T_peak * exp(-t/tau_cool)           // tau ~ 5-20 s
```

**3. Spike Anneal** (sub-second):
```
T(t) = T_ambient + (T_peak - T_ambient) * exp(-(t - t_peak)^2 / (2*sigma^2))
sigma = FWHM / 2.355     // FWHM ~ 0.5-2 s
```

**4. Flash Anneal** (milliseconds):
```
T(t) = T_preheat + (T_peak - T_preheat) * exp(-t/tau_flash)
tau_flash ~ 0.5-3 ms
T_preheat ~ 600-800 C
```

**5. Laser Anneal** (microseconds):
```
T(t) = T_base + (T_peak - T_base) * rect(t/tau_laser) * exp(-z/delta_thermal)
tau_laser ~ 0.1-1 ms
delta_thermal = sqrt(alpha * tau_laser)    // alpha_Si ~ 0.9 cm^2/s
```
Depth-dependent temperature unique to this mode.

**Time discretization adapts to mode:**
```
Furnace:  dt = 1-10 s     (200 steps -> ~30 min)
RTA:      dt = 50-200 ms  (200 steps -> ~20 s)
Spike:    dt = 5-20 ms    (200 steps -> ~2 s)
Flash:    dt = 10-50 us   (200 steps -> ~5 ms)
Laser:    dt = 0.5-5 us   (200 steps -> ~0.5 ms)
```

**Exported interface:**
```typescript
type ThermalMode = 'furnace' | 'rta' | 'spike' | 'flash' | 'laser';
interface ThermalStep {
  time: number;          // seconds since start
  temperature: number;   // C (surface temperature)
  tempProfile: number[]; // T(z) per bin
  dt: number;            // timestep size
  phase: 'ramp' | 'soak' | 'cool' | 'pulse';
}
function generateThermalProfile(mode: ThermalMode, params: SimulationParams): ThermalStep[];
function thermalBudget(steps: ThermalStep[], species: DopantSpecies): number;
function thermalDiffusionLength(T: number, dt: number, species: DopantSpecies): number;
```

---

## 5. Physics Module 4 — PDE Diffusion Solver (`diffusion-solver.ts`)

Core numerical engine solving coupled 1D diffusion PDEs.

**Governing equation:**
```
dC/dt = d/dx [D_eff(C,T,n_i,V,I) * dC/dx] + G(x,t) - L(x,t)
```

**Crank-Nicolson semi-implicit scheme** (unconditionally stable, 2nd-order accurate):
```
(C^(n+1) - C^n) / dt = 0.5 * [L(C^(n+1)) + L(C^n)]
```
Discretized as tridiagonal system solved by Thomas algorithm O(N).

**Tridiagonal coefficients:**
```
r_i = D_(i+1/2) * dt / (2*dx^2)
a_i = -r_(i-1/2)
c_i = -r_(i+1/2)
b_i = 1 + r_(i-1/2) + r_(i+1/2)
d_i = explicit half contribution from C^n
```

**Boundary conditions:**
- Surface (i=0): Reflective (dC/dx = 0) or segregation sink
- Substrate (i=N-1): Zero-flux (dC/dx = 0)

**Coupled solve order per timestep:**
1. Update temperature from thermal profile
2. Compute n_i(T), carrier concentrations
3. Compute D_eff per bin (charge state + supersaturation)
4. Step point defects ({311} dissolution -> recombination)
5. Solve dopant diffusion PDE (Crank-Nicolson)
6. Apply clustering (cap active at solid solubility)
7. Update segregation at interfaces
8. Snapshot profiles into StepState

**Segregation at SiO2/Si interface:**
```
m_B ~ 0.3 (B piles into oxide)
m_P ~ 10  (P piles into silicon)
m_As ~ 10 (As piles into silicon)
```
Flux boundary: `J = k_seg * (C_Si - C_Ox/m)`.

**Exported interface:**
```typescript
interface SolverState {
  dopantProfile: number[];
  activeProfile: number[];
  clusteredProfile: number[];
  defects: PointDefectState;
  carrierProfile: number[];
  temperature: number;
  time: number;
  thermalBudget: number;
}
function createSolverState(params: SimulationParams, bins: number, binSize: number): SolverState;
function solveDiffusionStep(state: SolverState, thermalStep: ThermalStep, params: SimulationParams, binSize: number): void;
function tridiagonalSolve(a: number[], b: number[], c: number[], d: number[]): number[];
```

---

## 6. Initial Profile Generator + Wafer Metrics

### `initial-profile.ts`

Generates starting dopant concentration C(x,0) from as-implanted Gaussian:
```
C(x) = (dose / (sqrt(2*pi) * dRp)) * exp(-(x - Rp)^2 / (2*dRp^2))
```
with channeling tail: `C_tail(x) = C(2*Rp) * exp(-(x - 2*Rp) / lambda_ch)` for x > 2*Rp.

Initial point defect damage: `I_excess(x) = dose_fraction * C(x)` loaded into {311} storage.

```typescript
function generateInitialProfile(species: DopantSpecies, dose: number, depth: number, bins: number, binSize: number): number[];
function generateImplantDamage(profile: number[], species: DopantSpecies): number[];
```

### `wafer-metrics.ts`

10 metrics computed from solver state:

| Metric | Formula | Unit |
|--------|---------|------|
| Junction depth Xj | Deepest x where C_active = C_bg | nm |
| Sheet resistance Rs | 1 / integral(q*mu(C)*C_active dx), Masetti mobility | ohm/sq |
| Peak concentration | max(C_active) | cm^-3 |
| Thermal budget Dt | Cumulative sum(D_eff*dt) | cm^2 |
| Activation fraction | integral(C_active)/integral(C_total) | % |
| Interstitial supersaturation | max(C_I/C_I*) | ratio |
| Profile abruptness | dx/d(log10 C) at junction | nm/decade |
| Segregation ratio | C(x=0)/C(x=2nm) | ratio |
| Vacancy concentration | max(C_V/C_V*) normalized | ratio |
| Diffusion length | sqrt(Dt) | nm |

Masetti mobility model: `mu(C) = mu_min + (mu_max - mu_min)/(1 + (C/C_ref)^alpha) - mu1/(1 + (C_ref2/C)^beta)`.

```typescript
type DiffusionMetric = 'junctionDepth' | 'sheetResistance' | 'peakConcentration' | 'thermalBudget'
  | 'activationFraction' | 'interstitialSupersaturation' | 'profileAbruptness'
  | 'segregationRatio' | 'vacancyConcentration' | 'diffusionLength';
function computeMetrics(state: SolverState, params: SimulationParams, binSize: number): Record<DiffusionMetric, number>;
function sheetResistance(activeProfile: number[], species: DopantSpecies, binSize: number): number;
function mobilityMasetti(C: number, isNtype: boolean): number;
```

---

## 7. Simulation Engine + Types

### `types.ts`

```typescript
type DopantSpecies = 'B' | 'P' | 'As' | 'Sb' | 'In' | 'Ge';
type ThermalMode = 'furnace' | 'rta' | 'spike' | 'flash' | 'laser';
type AmbientGas = 'N2' | 'O2' | 'N2O2';
type SubstrateOrientation = '100' | '110' | '111';
type ThermalPhase = 'ramp' | 'soak' | 'cool' | 'pulse';

interface SimulationParams {
  peakTemperature: number;        // C, 700-1410
  rampRate: number;               // C/s, log scale
  soakTime: number;               // s, log scale
  coolingRate: number;            // C/s, log scale
  dopantSpecies: DopantSpecies;
  thermalMode: ThermalMode;
  ambientGas: AmbientGas;
  initialDose: number;            // cm^-2, log scale
  initialDepth: number;           // nm
  screenOxideThickness: number;   // nm
  substrateOrientation: SubstrateOrientation;
  backgroundDoping: number;       // cm^-3, log scale
  interstitialFactor: number;     // multiplier
  vacancyFactor: number;          // multiplier
  clusteringThreshold: number;    // cm^-3, log scale
  totalSteps?: number;
}

interface StepState {
  stepIndex: number;
  time: number;
  temperature: number;
  thermalPhase: ThermalPhase;
  dopantProfile: number[];
  activeProfile: number[];
  clusteredProfile: number[];
  interstitialProfile: number[];
  vacancyProfile: number[];
  carrierProfile: number[];
  temperatureProfile: number[];
  junctionDepth: number;
  sheetResistance: number;
  peakConcentration: number;
  thermalBudget: number;
  activationFraction: number;
  interstitialSupersaturation: number;
  profileAbruptness: number;
  segregationRatio: number;
  vacancyConcentration: number;
  diffusionLength: number;
  maxDepthNm: number;
  layers: LayerDef[];
}

interface SimulationState {
  params: SimulationParams;
  steps: StepState[];
  currentIndex: number;
  totalSteps: number;
  thermalProfile: ThermalStep[];
}

type DiffusionMetric = 'junctionDepth' | 'sheetResistance' | 'peakConcentration'
  | 'thermalBudget' | 'activationFraction' | 'interstitialSupersaturation'
  | 'profileAbruptness' | 'segregationRatio' | 'vacancyConcentration' | 'diffusionLength';

type PresetId = 'furnace-drive-in' | 'rta-activation' | 'spike-anneal'
  | 'flash-anneal' | 'laser-anneal' | 'ted-showcase' | 'oed-effect'
  | 'retrograde-well' | 'dopant-pile-up' | 'high-conc-clustering'
  | 'co-diffusion' | 'thermal-budget-overshoot';
```

### `simulation-engine.ts`

```typescript
const solverCache = new WeakMap<SimulationState, SolverState>();

createSimulation(params): SimulationState
  // 1. Generate thermal profile T(t) from mode + params
  // 2. Create initial dopant profile from dose/depth
  // 3. Initialize point defect state from implant damage
  // 4. Package into SimulationState + cache SolverState

stepForward(state): SimulationState
  // 1. Get/rebuild SolverState from cache
  // 2. Get next ThermalStep from pre-computed profile
  // 3. solveDiffusionStep() - one Crank-Nicolson iteration
  // 4. computeMetrics() -> snapshot into StepState
  // 5. Return new immutable SimulationState

stepN(state, n): SimulationState
applyPreset(state, presetId): SimulationState
```

Key difference: thermal profile is pre-computed at createSimulation() since T(t) is deterministic.

---

## 8. Babylon.js DiffusionScene Component

**Wafer slab geometry:** 100x20x200 unit box (width x thickness x depth). Depth axis Y pointing down maps to 200-bin grid.

**Dopant volumetric color:** Horizontal strips per ~5 bins, color from log10(C):
- log10(C) >= 20: bright amber #F59E0B
- log10(C) ~ 17: orange #EA580C
- log10(C) ~ 14: dark red #7F1D1D
- log10(C) < 14: substrate blue #1E3A5F

**Junction depth isosurface:** Flat glowing plane at Y=Xj, emissive amber, alpha 0.6, "Xj" label via GUI.

**Point defect particles:** Two pools of 50 reusable spheres each:
- Interstitials: cyan, diameter 1.5, in high-supersaturation bins, gentle upward drift
- Vacancies: purple, diameter 1.5, static/random walk

**Layer stack:** Screen oxide as semi-transparent violet box. Segregation zone highlight at interface.

**Temperature overlay:** Vertical gradient bar on slab left edge, blue->red mapping T(z). Dramatic for laser mode.

**Camera:** ArcRotateCamera, 45 degrees, radius 100-800.

**Thermal mode indicator:** Text overlay with mode name, elapsed time, phase, phase-colored background.

Uses propsRef pattern for render loop updates without remount.

---

## 9. Canvas2D ProfilePanel Component

Three stacked canvas sections:

### Canvas 1: Concentration Profile (flex-1, ~220px)
Log-scale Y (10^8 to 10^22 cm^-3) vs depth X (0 to maxDepthNm). Six curves:
- Total dopant: Amber #F59E0B (solid)
- Active dopant: Green #22C55E (solid)
- Clustered dopant: Red #EF4444 (dashed)
- Interstitials: Cyan #06B6D4 (solid)
- Vacancies: Purple #A855F7 (solid)
- Background doping: Gray #64748B (dashed horizontal)

Junction marker (vertical dashed red at Xj). Solid solubility line (horizontal dashed orange).

### Canvas 2: Temperature Profile (h=80px)
T(t) thermal history curve with phase color coding (ramp=amber, soak=red, cool=blue, pulse=white). Current T as large text overlay. Laser mode shows T(z) gradient bar.

### Canvas 3: Metric Sparkline (h=70px)
Selected metric trend. 10 pill selector buttons (amber active). 5x2 readout grid.

Legend strip below concentration canvas showing all 6 curve colors.

---

## 10. 12 Presets + 14 Parameters

### Parameters (PARAM_BOUNDS)

| Key | Min | Max | Default | Unit | Control |
|-----|-----|-----|---------|------|---------|
| peakTemperature | 700 | 1410 | 1000 | C | slider |
| rampRate | 0.1 | 1e6 | 50 | C/s | slider (log) |
| soakTime | 0 | 7200 | 30 | s | slider (log) |
| coolingRate | 0.1 | 1e6 | 50 | C/s | slider (log) |
| dopantSpecies | — | — | B | — | dropdown |
| thermalMode | — | — | rta | — | dropdown |
| ambientGas | — | — | N2 | — | dropdown |
| initialDose | 12 | 16 | 14 | log10(cm^-2) | slider (log) |
| initialDepth | 5 | 500 | 50 | nm | slider |
| screenOxideThickness | 0 | 50 | 5 | nm | slider |
| substrateOrientation | — | — | 100 | — | dropdown |
| backgroundDoping | 14 | 17 | 15 | log10(cm^-3) | slider (log) |
| interstitialFactor | 0.1 | 10 | 1.0 | x | slider |
| vacancyFactor | 0.1 | 10 | 1.0 | x | slider |
| clusteringThreshold | 19 | 21 | 20 | log10(cm^-3) | slider (log) |

### 12 Presets

| ID | Label (EN) | Label (CN) | Key Changes |
|----|-----------|------------|-------------|
| furnace-drive-in | Furnace Drive-In | 爐管推進 | mode=furnace, T=1050, soak=3600s, B, N2 |
| rta-activation | RTA Activation | 快速熱退火活化 | mode=rta, T=1050, soak=10s, As, N2 |
| spike-anneal | Spike Anneal | 尖峰退火 | mode=spike, T=1080, soakTime=0, B, N2 |
| flash-anneal | Flash Anneal | 閃光退火 | mode=flash, T=1300, soakTime=0.002, B, N2 |
| laser-anneal | Laser Anneal | 激光退火 | mode=laser, T=1400, soakTime=0.0005, As, N2 |
| ted-showcase | TED Showcase | 暫態增強擴散 | mode=rta, T=800, soak=60s, B, interstitialFactor=5 |
| oed-effect | OED Effect | 氧化增強擴散 | mode=furnace, T=1000, soak=1800s, B, O2 |
| retrograde-well | Retrograde Well | 逆行井 | mode=rta, T=1050, In, dose=1e13, depth=300nm |
| dopant-pile-up | Dopant Pile-Up | 雜質堆積 | mode=furnace, T=1100, B, oxide=30nm, soak=1800s |
| high-conc-clustering | High-Conc Clustering | 高濃度團簇 | mode=rta, T=1000, As, dose=1e16, clusteringThreshold=5e19 |
| co-diffusion | Co-Diffusion | 共擴散 | mode=furnace, T=1050, P, bgDoping=1e16(B), soak=3600s |
| thermal-budget-overshoot | Budget Overshoot | 熱預算超標 | mode=furnace, T=1150, soak=7200s, B |

---

## 11. Testing Strategy (~72 tests across 9 suites)

| Suite | Tests | Coverage |
|-------|-------|----------|
| constants.test.ts | 6 | Defaults, DB entries, estimateMaxDepth, PRNG, bounds |
| point-defects.test.ts | 8 | Equilibrium, supersaturation, recombination, {311}, OED, surface BC |
| diffusivity.test.ts | 8 | n_i(T), B/Sb/P mechanisms, charge-state, clustering, Ge, supersaturation |
| thermal-profile.test.ts | 8 | 5 modes step count, timescales, shapes, phases, laser depth-T |
| diffusion-solver.test.ts | 10 | Tridiagonal, mass conservation, broadening, Xj, T-dependence, stability, BC, segregation, clustering, monotonic |
| initial-profile.test.ts | 6 | Gaussian, dose integral, peak position, channeling tail, damage, background |
| wafer-metrics.test.ts | 8 | Xj, Rs, activation, Dt, Masetti, abruptness, diffusion length, segregation |
| simulation-engine.test.ts | 10 | State shape, step, profiles, Xj evolution, budget, cap, preset, modes, 200 steps |
| presets.test.ts | 8 | Count, valid params, furnace soak, laser dt, TED factor, all modes, co-diffusion, overshoot Xj |

## 12. Scope Boundaries

**In scope:** 1D diffusion PDE, 6 dopants, 5 thermal modes, point defects (V+I), TED, OED, clustering, segregation, Masetti mobility, 12 presets, Babylon.js 3D slab, Canvas2D profiles.

**Out of scope:** 2D/3D lateral diffusion, die-level wafer map, dopant-dopant interaction in co-diffusion, quantum effects, ab-initio parameters.

**Simplifications:** Co-diffusion uses single species with compensated background; Ge is concentration-only (no electrical); laser T(z) is analytical not full heat equation.

## 13. File Summary

| Directory | Files | Purpose |
|-----------|-------|---------|
| src/lib/diffusion-sim/ | 11 | types, constants, point-defects, diffusivity, thermal-profile, diffusion-solver, initial-profile, wafer-metrics, simulation-engine, presets, index |
| src/lib/diffusion-sim/__tests__/ | 9 | Test suites |
| src/components/diffusion-sim/ | 4 | DiffusionScene, ProfilePanel, TimelineBar, ParameterPanel |
| src/app/.../diffusion-sim/ | 1 | page.tsx |
| Modified | 1 | digital-twin-routes.ts |
| **Total** | **~26 files** | **~3000 lines** |
