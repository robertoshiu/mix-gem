# Advanced Analytics Hub — Design Document

> **Date:** 2026-05-22
> **Route:** `/mes/analytics`
> **Status:** Approved

## 1. Page Architecture

Single page at `/mes/analytics` with a **tabbed layout** (6 tabs). Each tab has:
- Executive **KPI strip** at top (4–5 gauges)
- **Left panel** with controls/sliders/dropdowns
- **Right panel** with 2–3 Canvas2D charts

Tabs: **VPP** | **APC R2R** | **Yield Forecast** | **Reliability** | **Cross-Process Optimization** | **Multi-Fab Replication**

Audiences: portfolio demo, operational insights, executive dashboards.

All 6 capabilities use full simulation engines with real math — not lightweight mocks.

---

## 2. VPP (Virtual Process Platform)

**KPI Strip:** Active Sims | Pipeline Steps | Cumulative Yield | Total Thickness | Cycle Time

**Left Panel — Federation Dashboard:**
- Pipeline builder: ordered list of process steps, each mapped to an existing sim engine
  - Oxidation → `oxidation-sim`
  - CMP → `cmp-sim`
  - Implant → `implant-sim`
  - Diffusion → `diffusion-sim`
  - Litho / Etch / Dep / Metal → lightweight parametric stubs
- Per-step config: link to sim preset dropdown, key override slider (e.g., temp, dose)
- Film stack visualizer: vertical bar showing accumulated layers (SiO2 / Si3N4 / Cu / etc.) with thickness labels
- Run Federation button — executes pipeline sequentially, passing output metrics as input context to next step

**Right Panel — 3 Canvas Charts:**
1. **Pipeline Waterfall** — per-step yield contribution (stacked bar, 100% → final)
2. **Film Stack Cross-Section** — layered rectangle plot with material colors and thickness annotations
3. **Metric Trend** — line chart of selected metric across pipeline steps (thickness, stress, defect density)

**Engine:** `src/lib/analytics/vpp-engine.ts`
- `createPipeline(steps[])` → Pipeline
- `runFederatedSim(pipeline, overrides)` → `{perStepResults[], aggregated}`
- `computeFilmStack(stepResults[])` → `{layers: {material, thickness}[]}`
- `computePipelineYield(stepResults[])` → `{perStep[], cumulative}`
- Imports real sim engines — does NOT reimplement physics

---

## 3. APC R2R (Run-to-Run Control)

**KPI Strip:** Current Offset | EWMA λ | Drift Rate | Runs Since Reset | Cpk

**Left Panel — Controller Config:**
- **Mode toggle:** Single EWMA | d-EWMA (double EWMA, default)
- Target value input (default from active recipe)
- EWMA weight λ slider (0.01–1.0, default 0.3)
- d-EWMA slope weight λ_slope slider (0.01–0.5, default 0.1) — disabled when mode = Single EWMA
- Drift injection selector: **None** | **Linear** (slope/run) | **Sinusoidal** (amplitude + period) | **Step-shift** (magnitude + trigger run) | **Mixed**
- Run count slider (20–200, default 50)
- Reset button — clears controller state

**Right Panel — 3 Canvas Charts:**
1. **Controlled vs Uncontrolled** (top) — dual trace: blue = APC-corrected output, red = uncontrolled (drift only). Target line + ±3σ bands. Shows how controller tracks/compensates drift.
2. **EWMA State** (middle) — plots EWMA level estimate + slope estimate (d-EWMA) over runs. Shows controller's internal model of the process.
3. **Residual Histogram** (bottom) — distribution of (output − target) for controlled runs. Overlaid Gaussian fit. Cpk annotation.

**Engine:** `src/lib/analytics/apc-engine.ts`
- d-EWMA math:
  - Level: `L_t = λ·y_t + (1−λ)·(L_{t-1} + S_{t-1})`
  - Slope: `S_t = λ_s·(L_t − L_{t-1}) + (1−λ_s)·S_{t-1}`
  - Forecast: `ŷ_{t+1} = L_t + S_t`
  - Correction: `u_t = target − ŷ_{t+1}`
  - When λ_slope = 0: degenerates to single EWMA (S_t = 0 always)
- `createController(config)` → EwmaState
- `stepController(state, measurement)` → `{newState, correction}`
- `generateDrift(type, params, runIndex)` → offset
- `simulateRuns(controller, driftConfig, nRuns)` → `{controlled[], uncontrolled[], ewmaStates[]}`
- `computeResidualStats(controlled[], target)` → `{mean, std, cpk, histogram[]}`

---

## 4. Yield Forecast

**KPI Strip:** Line Yield | Worst Step (name + yield%) | D0 avg | Die Area | alpha_cluster

**Left Panel — Model Configuration:**
- Die area slider (50–300 mm², default 100)
- Per-step D0 override sliders (8 steps: OX/LITHO/ETCH/DEP/IMP/DIFF/CMP/MET), range 0.01–2.0 /cm²
- Cluster factor alpha slider (0.5–10, default 2.0)
- Scenario presets: **Baseline** (from fab-process-data) | **10% D0 improvement** (all ×0.9) | **New tool** (worst step −40%) | **Custom**
- Forecast lots slider (10–100)

**Right Panel — 3 Canvas Charts:**
1. **Stacked Bar** — per-step yield loss contributions (8 stacked segments per bar)
2. **Y vs D0 Curve** — yield as function of D0 for selected step, current operating point marker, 100 plotted points
3. **Waterfall** — 100% → cumulative yield through 8 steps → line yield

**Engine:** `src/lib/analytics/yield-engine.ts`
- Core: `Y_step = (1 + D0 * A / alpha)^(-alpha)` (Negative Binomial)
- Line yield: `Y_line = product(Y_step_i)`
- `computeStepYield(d0, area, alpha)` → number
- `computeLineYield(steps[])` → `{perStep[], lineYield}`
- `generateYieldWaterfall(steps[])` → `{step, cumulative}[]`
- `generateYieldCurve(area, alpha, d0Range, points=100)` → `{d0, yield}[]`
- `generateForecastLots(steps[], nLots, seed)` → lot-level yield with PRNG variance

---

## 5. Reliability

**KPI Strip:** System Availability | MTBF (system) | Worst Subsystem (name + availability%) | Test Hours Simulated | Activation Energy (eV)

**Left Panel — System RBD Builder:**
- Topology selector: **Series** (default) | **Parallel** | **Series-Parallel** (k-of-n voting)
- 8 subsystem blocks (one per process step from fab-process-data), each showing:
  - Name, failure rate lambda (failures/1000h), repair rate mu (repairs/1000h)
  - Editable lambda and mu sliders (lambda: 0.1–10, mu: 1–50)
  - Calculated availability `A = mu/(lambda+mu)` inline
- For Series-Parallel: k-of-n slider per redundancy group
- System availability formulas:
  - Series: `A_sys = product(A_i)`
  - Parallel: `A_sys = 1 - product(1 - A_i)`
  - k-of-n: `sum C(n,i) * A^i * (1-A)^(n-i)` for i=k..n
- Presets: **Baseline** | **Single point of failure** | **Full redundancy** (2-of-3) | **Custom**

**Right Panel — 3 Canvas Charts:**
1. **RBD Block Diagram** — visual block layout (series=horizontal, parallel=vertical, k-of-n=bracketed). Color: green (A>0.99), amber (0.95–0.99), red (<0.95). Clickable blocks.
2. **Arrhenius/Eyring Life Projection** — X: temperature (50–250C), Y: median life (log). Two curves. Sliders: Ea (0.3–1.2 eV), humidity stress b (0–0.05), use temp Tu (default 65C). Confidence band +/-20%.
3. **Acceleration Factor** — AF vs test temperature. Reference line at AF=1. Annotation: "1000h test at 125C = X hours field life at 65C".

**Engine:** `src/lib/analytics/reliability-engine.ts`
- `computeSubsystemAvailability(lambda, mu)` → A
- `computeSeriesAvailability(availabilities[])` → A_sys
- `computeParallelAvailability(availabilities[])` → A_sys
- `computeKofNAvailability(k, n, A)` → A_sys
- `arrheniusLife(A, Ea, T_kelvin)` → median hours
- `eyringLife(A, Ea, T_kelvin, b, S)` → median hours
- `accelerationFactor(Ea, T_use, T_test)` → AF
- `generateLifeProjection(Ea, b, S, T_use, points=100)` → `{tempC, arrhenius, eyring}[]`
- `generateSystemRBD(subsystems[], topology)` → `{systemAvail, subsystemAvails[], bottleneck}`

---

## 6. Cross-Process Optimization

**KPI Strip:** Pareto Solutions Found | Current Yield | Current Throughput | Constraint Violations | Optimization Iterations

**Left Panel — Optimization Controls:**
- Objective selectors (pick 2–3): Yield (max), Throughput (max), Cost (min), Defect density D0 (min)
- Decision variables: 8 process-step recipe knobs with sliders (temp, dose, pressure, downforce, energy, etc.)
- Constraints (toggleable): min yield >= X%, max D0 <= Y, throughput >= Z wph, cost <= W $/wafer
- Presets: **Baseline** | **Yield-First** | **Throughput-First** | **Cost-Optimized** | **Custom**
- Run button with iteration progress

**Right Panel — 3 Canvas Charts:**
1. **Pareto Frontier** — scatter of objective 1 vs 2, frontier line, dominated points faded, current operating point crosshair. Clickable Pareto points load recipe.
2. **RSM Contour Plot** — 2D heatmap of objective vs 2 selected decision variables. Iso-lines, constraint boundaries (red dashed), current point marker. Quadratic fit: `y = B0 + sum(Bi*xi) + sum(Bii*xi^2) + sum(Bij*xi*xj)`.
3. **Sensitivity Tornado** — horizontal bars showing +/-10% perturbation impact per variable, sorted by absolute impact.

**Engine:** `src/lib/analytics/optimization-engine.ts`
- `evaluateObjectives(recipeVector[])` → `{yield, throughput, cost, defectDensity}`
- `generateParetoFrontier(objectives[2], constraints, gridPoints=500)` → `ParetoPoint[]`
- `fitResponseSurface(samples[])` → `{coefficients, rSquared}`
- `evaluateRSM(coefficients, x1Range, x2Range, gridSize=50)` → `number[][]`
- `computeSensitivity(baseRecipe, objective, perturbation=0.1)` → `{variable, impact}[]`
- `checkConstraints(objectives, constraints)` → `{feasible, violations[]}`
- `optimizeConstrained(objectives, constraints, maxIter=200)` → `{bestPoint, paretoSet[], iterations}`

Pareto search: grid-scan + non-dominated sort (deterministic). RSM: least-squares quadratic fit over Latin Hypercube sample.

---

## 7. Multi-Fab Replication

**KPI Strip:** Fab Count | Parameters Matched | Equivalence Pass Rate | Max Bias (nm) | Transfer R2

**Left Panel — Fab Configuration:**
- 3 fab cards: **HQ Fab** (reference, mature), **Satellite Fab** (established, slight offsets), **New-Build Fab** (ramping, wider distributions + bias)
- Parameter selector: 8 process parameters (CD, overlay, thickness, dose, etch depth, implant depth, diffusion depth, CMP removal)
- Equivalence config: margin delta (default +/-2%), confidence (90/95/99%), sample size (30/50/100)
- Transfer function: Linear | Quadratic model type, calibration button
- Presets: **Matched** | **Offset** (+5% Satellite bias) | **Drift** (New-Build ramp) | **Custom**

**Right Panel — 3 Canvas Charts:**
1. **TOST Equivalence Plot** — 3 rows (fab pairs), mean difference with 90% CI, equivalence bounds as dashed lines. Green PASS / red FAIL. Cpk per fab.
2. **Distribution Overlay** — Gaussian curves for 3 fabs overlaid, spec limits (USL/LSL), legend with mu/sigma per fab.
3. **Transfer Function Plot** — HQ (X) vs target fab (Y) scatter with regression line, 45-degree reference, R2 + bias annotation, residual band.

**Engine:** `src/lib/analytics/replication-engine.ts`
- `generateFabData(fabId, parameter, sampleSize, bias, spreadFactor)` → `number[]`
  - HQ: bias=0, spread=1x; Satellite: bias=+0.02x, spread=1.1x; New-Build: bias=+0.05x, spread=1.3x
- `tostEquivalence(sample1[], sample2[], margin, confidence)` → `{meanDiff, ci90, pass}`
- `computeCpk(samples[], usl, lsl)` → number
- `fitTransferFunction(xData[], yData[], order: 1|2)` → `{coefficients[], rSquared, residuals[]}`
- `generateDistributionCurve(mean, std, points=200)` → `{x, pdf}[]`
- `generateFabComparison(parameter, config)` → `{fabData, tostResults[], transferFits[]}`

New-Build has time-dependent drift (first 20 samples biased more than last 30) to simulate ramp-up.

---

## 8. Data Layer Architecture

```
src/lib/analytics/
  types.ts              — shared types for all 6 engines
  constants.ts          — shared constants (process params, defaults)
  yield-engine.ts       — Negative Binomial yield model
  apc-engine.ts         — d-EWMA run-to-run controller
  reliability-engine.ts — RBD + Arrhenius/Eyring
  optimization-engine.ts— Pareto + RSM + sensitivity
  replication-engine.ts — TOST + transfer functions
  vpp-engine.ts         — Federation orchestrator (imports existing sims)
  index.ts              — barrel exports
  __tests__/
    yield-engine.test.ts
    apc-engine.test.ts
    reliability-engine.test.ts
    optimization-engine.test.ts
    replication-engine.test.ts
    vpp-engine.test.ts
```

- `AnalyticsTab = 'vpp' | 'apc' | 'yield' | 'reliability' | 'optimization' | 'replication'`
- All generator functions are pure — no store dependency, no side effects
- Each engine exports standalone functions (no classes)
- Store: `src/stores/analytics-store.ts` (Zustand) with INITIAL_STATE export for testing
- VPP engine imports real sim engines, does not duplicate physics

---

## 9. Testing Strategy

~120 tests total: ~90 engine + ~30 component.

| Engine | Tests | Key Assertions |
|--------|-------|----------------|
| yield-engine | ~15 | Hand-calc match, D0=0 yields 1, waterfall sums |
| apc-engine | ~18 | EWMA convergence, d-EWMA drift tracking, lambda_slope=0 degenerates |
| reliability-engine | ~15 | Series < min, parallel > max, Arrhenius temp dependence, AF bounds |
| optimization-engine | ~15 | Non-dominated Pareto, RSM R2 on quadratic data, sensitivity ranking |
| replication-engine | ~15 | Identical samples TOST pass, biased fail, transfer R2, Cpk bounds |
| vpp-engine | ~12 | Federation calls through, pipeline aggregation, film stack summation |

Jest globals, `npx jest` from `equipment-monitor/`, `mulberry32` PRNG for deterministic assertions.

---

## 10. File Inventory & Task Breakdown

**New files (~28):** 9 engine library + 6 engine tests + 2 store + 1 page + 6 tab components + 6 tab tests + 1 shared UI = 31 files

**Modified files (3):** `fab-process-data.ts` (add spec limits), navigation config (add route), sidebar (add nav item)

**22 tasks with parallelization:**

| # | Task | Deps |
|---|------|------|
| 1 | types.ts + constants.ts | — |
| 2 | yield-engine.ts + tests | 1 |
| 3 | apc-engine.ts + tests | 1 |
| 4 | reliability-engine.ts + tests | 1 |
| 5 | optimization-engine.ts + tests | 1 |
| 6 | replication-engine.ts + tests | 1 |
| 7 | vpp-engine.ts + tests | 1 |
| 8 | index.ts barrel | 2–7 |
| 9 | analytics-store.ts + tests | 8 |
| 10 | TabShell.tsx | 9 |
| 11 | YieldTab.tsx + tests | 2, 10 |
| 12 | ApcTab.tsx + tests | 3, 10 |
| 13 | ReliabilityTab.tsx + tests | 4, 10 |
| 14 | OptimizationTab.tsx + tests | 5, 10 |
| 15 | ReplicationTab.tsx + tests | 6, 10 |
| 16 | VppTab.tsx + tests | 7, 10 |
| 17 | Page + route registration | 10–16 |
| 18 | fab-process-data.ts additions | — |
| 19 | Nav integration | 17 |
| 20 | Lint + type check pass | all |
| 21 | Full test run | all |
| 22 | Final commit | all |

Parallel waves: Tasks 2–7 (6 engines), Tasks 11–16 (6 tabs).
