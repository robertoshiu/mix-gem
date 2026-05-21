# Ion Implantation Monte Carlo Digital Twin — Design Document

> Date: 2026-05-21
> Process: Ion Implantation (BCA Monte Carlo with channeling + amorphization)
> Route: `/mes/fab-floor/implant/implant-sim`
> Library: `src/lib/implant-sim/`

## 1. Architecture Overview

The implant-sim follows the established digital twin pattern with the deepest single-particle physics yet: full Binary Collision Approximation with channeling and dose-dependent amorphization.

```
src/lib/implant-sim/                     <- Physics engine (pure TS, no React)
  types.ts                                <- Ion, Material, SimulationParams, StepState, etc.
  constants.ts                            <- ZBL coefficients, stopping power tables, material DB
  zbl-potential.ts                        <- Ziegler-Biersack-Littmark screened Coulomb potential
  stopping-power.ts                       <- Nuclear (ZBL) + electronic (Lindhard-Scharff) stopping
  bca-engine.ts                           <- Binary Collision Approximation: single-ion trajectory
  channeling-model.ts                     <- Crystal channeling: critical angle, aligned trajectory detection
  damage-model.ts                         <- Vacancy/interstitial accumulation, amorphous pocket formation
  monte-carlo.ts                          <- Orchestrator: N-ion ensemble, profile binning, statistics
  simulation-engine.ts                    <- 200-step state machine, dose accumulation
  presets.ts                              <- 10 what-if scenarios
  index.ts                                <- Barrel export
  __tests__/                              <- One test file per module (TDD)

src/components/implant-sim/
  TimelineBar.tsx                         <- With backHref="/mes/fab-floor/implant"
  ParameterPanel.tsx                      <- 12 controls (10 sliders + 2 dropdowns) + 10 presets
  TrajectoryScene.tsx                     <- Babylon.js: 3D ion trajectories + layer stack
  ProfilePanel.tsx                        <- 8-metric depth profile + damage density + sparklines

src/app/mes/fab-floor/implant/implant-sim/page.tsx
```

Route: `/mes/fab-floor/implant/implant-sim`
Back button: -> `/mes/fab-floor/implant` (via TimelineBar `backHref`)

## 2. Physics Models

### 2.1 ZBL Screened Coulomb Potential (`zbl-potential.ts`)

The interaction between an incoming ion and a target atom is modeled as a screened Coulomb potential — the nuclear charge is shielded by surrounding electrons:

```
V(r) = (Z1 * Z2 * e^2) / (4*pi*eps0*r) * phi(r/a)
```

Where phi(x) is the ZBL universal screening function:
```
phi(x) = 0.1818*exp(-3.2x) + 0.5099*exp(-0.9423x) + 0.2802*exp(-0.4029x) + 0.02817*exp(-0.2016x)
```

The screening length `a = 0.8854 * a0 / (Z1^0.23 + Z2^0.23)` where a0 is the Bohr radius. This determines the scattering angle for each binary collision — heavier ions (As, Z=33) scatter less per collision than light ions (B, Z=5), so they travel straighter but deposit more energy per collision.

### 2.2 Stopping Power (`stopping-power.ts`)

Two energy loss mechanisms operate simultaneously:

- **Nuclear stopping** `Sn(E)`: Energy transferred to target atom nuclei via ZBL collisions. Dominates at low energies (<10 keV/amu). Creates lattice damage (displaced atoms). Computed from the ZBL scattering cross-section via the "magic formula" fit.

- **Electronic stopping** `Se(E)`: Continuous energy loss to target electrons (like friction). Dominates at high energies. Modeled via Lindhard-Scharff: `Se = k * sqrt(E)` where k depends on Z1, Z2, and target density. No lattice damage — just slows the ion.

The module exports `computeScatteringAngle(E, impactParam, Z1, Z2, M1, M2)` and `computeElectronicLoss(E, dx, material)`.

### 2.3 Binary Collision Approximation (`bca-engine.ts`)

The core of the simulation. Traces a single ion through the target:

1. **Free flight**: Ion travels a distance lambda (mean free path) determined by target atomic density: `lambda = 1 / (n * pi * r_max^2)` where n is atomic density and r_max is the maximum impact parameter.

2. **Collision partner selection**: Random impact parameter p from uniform distribution [0, p_max]. In crystalline regions, the impact parameter is biased toward lattice site positions (enabling channeling). In amorphous regions, purely random.

3. **Scattering**: ZBL potential determines the scattering angle theta in the center-of-mass frame. Energy transfer to target atom: `T = 4*M1*M2/(M1+M2)^2 * E * sin^2(theta/2)`. If T > Ed (displacement energy, ~15 eV for Si), the target atom is knocked off its lattice site -> vacancy + interstitial pair (Frenkel defect).

4. **Electronic loss**: Between collisions, ion loses energy continuously: `dE_e = Se(E) * dx`. Applied along the free-flight path.

5. **Cascade tracking**: If a recoiling target atom has enough energy (T > Ed), it becomes a secondary projectile tracked recursively. This creates branching damage cascades — especially dramatic for heavy ions (As creates ~1000 Frenkel pairs per ion; B creates ~10).

6. **Termination**: Ion stops when E < E_cutoff (5 eV). Its final (x, y, z) position is recorded.

Output per ion: `IonTrajectory { points: Vec3[], collisions: CollisionEvent[], finalPosition: Vec3, recoilCascades: Vec3[][] }`.

### 2.4 Channeling Model (`channeling-model.ts`)

When an ion's velocity aligns within a critical angle psi_c of a crystal axis or plane, it enters a "channel" — guided between rows of atoms by correlated small-angle deflections:

- **Critical angle** (Lindhard): `psi_c = sqrt(2 * Z1 * Z2 * e^2 / (E * d))` where d is the atomic row spacing. Higher energy -> smaller critical angle -> harder to channel.

- **Channel detection**: At each step, compute angle between ion velocity and nearest <110>, <100>, <111> axis. If angle < psi_c, ion enters channeled mode.

- **Channeled flight**: Ion experiences only electronic stopping (no nuclear collisions). Oscillates between channel walls with wavelength lambda_ch. Can be "dechanneled" by: (a) encountering an amorphous pocket, (b) electronic scattering accumulation, (c) thermal vibration of lattice atoms (Debye model, scaled by substrate temperature).

- **Effect on profile**: Channeled ions penetrate 2-5x deeper than random-trajectory ions, creating the characteristic "channeling tail". This is the primary reason Monte Carlo is needed over analytical Gaussian models.

- **Tilt/twist angles**: User parameters tilt (angle from surface normal) and twist (rotation around normal) control beam orientation relative to crystal. 7 deg tilt is standard "off-channel"; 0 deg tilt into <100> Si produces dramatic channeling.

### 2.5 Damage Model (`damage-model.ts`)

Tracks cumulative lattice damage as ions accumulate:

- **Vacancy map**: 1D array binned by depth (same bins as depth profile). Each Frenkel defect increments the local bin. Stored as vacancies/cm^3.

- **Amorphization threshold**: When local vacancy density exceeds n_amorph (~5x10^21 cm^-3 for Si, tunable via slider), that bin transitions crystalline -> amorphous. Key dose-dependent feedback loop.

- **Channeling suppression**: Amorphous regions block channeling — ions entering an amorphous pocket scatter randomly. At high doses, surface amorphizes first, deepening progressively. This "self-amorphization" causes profile to evolve from channeled (deep tail) at low dose to Gaussian (no tail) at high dose.

- **Temperature-dependent annealing**: At elevated substrate temperatures, Frenkel pairs recombine: `R_anneal = k0 * exp(-Ea_anneal / kT) * n_vacancy`. Competes with damage creation — hot implants (>400 deg C) maintain crystallinity at high doses.

- **Pre-amorphization (PAI)**: Damage map can be initialized with pre-existing amorphous layer for PAI preset.

### 2.6 Monte Carlo Orchestrator (`monte-carlo.ts`)

Runs the N-ion ensemble and produces statistical outputs:

- **Batch execution**: Ions simulated in batches of 1-5 per step. After each batch, depth profile and damage map updated.

- **Depth profile binning**: Substrate divided into 200 depth bins (0 to max_depth). Each stopped ion increments its bin. Lateral position binned separately.

- **Multi-layer handling**: When ion crosses material interface (SiO2->Si), stopping power coefficients switch. Interface scattering adds small random angular kick.

- **Statistics per batch**: Rp (mean projected range), dRp (straggle), Xj (junction depth at 1e17 cm^-3), Cp (peak concentration), channeling tail depth, damage peak, lateral straggle, retained dose fraction.

- **Backscattering**: Ions that exit the surface are counted but not plotted. Retained dose fraction captures this.

## 3. Simulation Engine

200 steps total. Dose accumulation model — each step adds a batch of ions:

- **Batch size**: Total ions (200-1000 from ionCount slider mapping) / 200 steps.
- **Progressive visualization**: Early steps show sparse trajectories with channeling. As dose accumulates, amorphous pockets form, channeling suppresses, profile tightens.
- **No explicit phases**: Single continuous process. Emergent regimes: crystalline (low dose, channeling dominant) -> transition (partial amorphization) -> amorphous (full surface amorphization, Gaussian profile).

### 3.1 Types

```typescript
type IonSpecies = 'B' | 'P' | 'As' | 'BF2';
type CrystalOrientation = '100' | '110' | '111';
type TargetMaterial = 'Si' | 'SiO2' | 'photoresist';

interface Vec3 { x: number; y: number; z: number; }

interface CollisionEvent {
  position: Vec3;
  energyTransfer: number;     // eV
  isDisplacement: boolean;    // T > Ed
  recoilCreated: boolean;
}

interface IonTrajectory {
  points: Vec3[];             // path vertices
  collisions: CollisionEvent[];
  finalPosition: Vec3;
  recoilCascades: Vec3[][];   // secondary recoil paths
  channeled: boolean;         // did this ion channel?
  backscattered: boolean;     // did ion exit surface?
  energy: number[];           // kinetic energy at each point (for color mapping)
}

interface SimulationParams {
  ionSpecies: IonSpecies;             // B/P/As/BF2
  beamEnergy: number;                 // keV (1-800, default 50)
  dose: number;                       // ions/cm^2 (1e11-1e16, default 1e13)
  beamCurrent: number;                // mA (0.1-20, default 5)
  tiltAngle: number;                  // degrees (0-60, default 7)
  twistAngle: number;                 // degrees (0-360, default 0)
  crystalOrientation: CrystalOrientation; // 100/110/111
  screenOxideThickness: number;       // nm (0-100, default 0)
  photoresistThickness: number;       // nm (0-2000, default 0)
  substrateTemperature: number;       // C (25-600, default 25)
  amorphizationThreshold: number;     // x10^21/cm^3 (1-20, default 5)
  damageAnnealingRate: number;        // a.u. (0-1, default 0)
  totalSteps: number;
}

interface StepState {
  stepIndex: number;
  ionsSimulated: number;
  totalIons: number;
  // Latest batch trajectories (for 3D rendering)
  trajectories: IonTrajectory[];
  // Accumulated profiles (200 depth bins)
  depthProfile: number[];           // dopant concentration vs depth
  damageProfile: number[];          // vacancy density vs depth
  lateralProfile: number[];         // lateral spread vs depth
  amorphousMap: boolean[];          // which depth bins are amorphous
  // Layer stack
  layers: { material: TargetMaterial; startNm: number; endNm: number }[];
  maxDepthNm: number;
  // 8 metrics
  projectedRange: number;           // Rp (nm)
  straggle: number;                 // dRp (nm)
  junctionDepth: number;            // Xj at 1e17 (nm)
  peakConcentration: number;        // Cp (cm^-3)
  channelingTailDepth: number;      // nm
  damagePeakDensity: number;        // vacancies/cm^3
  lateralStraggle: number;          // nm
  retainedDoseFraction: number;     // 0-1
}

interface SimulationState {
  params: SimulationParams;
  steps: StepState[];
  currentIndex: number;
  totalSteps: number;
}

type ImplantMetric =
  | 'projectedRange' | 'straggle' | 'junctionDepth' | 'peakConcentration'
  | 'channelingTailDepth' | 'damagePeakDensity' | 'lateralStraggle' | 'retainedDoseFraction';

type PresetId =
  | 'channeling-implant'
  | 'high-dose-amorphization'
  | 'implant-through-oxide'
  | 'shallow-junction'
  | 'retrograde-well'
  | 'dose-rate-heating'
  | 'resist-punch-through'
  | 'pre-amorphization'
  | 'twin-well-cmos'
  | 'high-tilt-halo';
```

## 4. Babylon.js Scene — Split View

### 4.1 Main View: 3D Trajectory Volume (~70% viewport)

- **Substrate block**: Semi-transparent box showing target stack. Layer boundaries (photoresist / SiO2 / Si) as colored translucent planes. Si region has subtle crystal lattice wireframe overlay that fades as amorphization progresses.
- **Ion trajectories**: Each ion path rendered as thin tube/line mesh, color-coded by kinetic energy (red=high -> blue=stopped). Last N batches visible (older fade out). Branching recoil cascades as dimmer secondary lines.
- **Damage clouds**: Amorphous pockets as semi-transparent purple/violet volumetric blobs at depth bins exceeding amorphization threshold. Grow and merge as dose accumulates.
- **Collision events**: Small sphere flash at each nuclear collision site. Size proportional to energy transfer.
- **Beam entry**: Particle emitter at top showing incoming ion beam at tilt/twist angle. Beam cone visible.
- **Camera**: ArcRotateCamera, default angled to show beam entry and cross-section depth. Constrained beta 10-80 degrees.

### 4.2 Right Panel: 2D Analysis (DOM, ~30% viewport)

- **Depth profile histogram**: Dopant concentration vs. depth, log scale Y-axis. Updates progressively. Gaussian fit overlay for comparison (highlighting channeling tail deviation).
- **Damage density plot**: Vacancies/cm^3 vs. depth. Amorphization threshold as horizontal dashed line. Regions above threshold highlighted.
- **8 metric readouts**: Rp, dRp, Xj, Cp, channeling tail depth, damage peak, lateral straggle, retained dose %. Each with sparkline showing evolution across batches.

## 5. Presets

| ID | Label | Color | Effect |
|----|-------|-------|--------|
| `channeling-implant` | Channeling Implant | `#3B82F6` blue | Tilt->0 deg, twist->0 deg, B 50keV into <100> Si. Maximum channeling tail |
| `high-dose-amorphization` | High-Dose Amorphization | `#EF4444` red | As 80keV, dose->1e15, ionCount high. Surface amorphizes, Gaussian profile |
| `implant-through-oxide` | Implant Through Oxide | `#F59E0B` amber | Screen oxide->30nm, B 30keV. Ions lose energy in oxide, shallower junction |
| `shallow-junction` | Shallow Junction | `#8B5CF6` purple | BF2 5keV, tilt->7 deg. Ultra-shallow <20nm Xj |
| `retrograde-well` | Retrograde Well | `#06B6D4` cyan | P 400keV, dose->5e12. Deep buried peak, low surface concentration |
| `dose-rate-heating` | Dose-Rate Heating | `#F97316` orange | High beam current, temperature rises. Annealing competes with damage |
| `resist-punch-through` | Resist Punch-Through | `#EC4899` pink | Thin resist (200nm), P 200keV. Ions penetrate through resist into substrate |
| `pre-amorphization` | Pre-Amorphization (PAI) | `#10B981` green | Amorphous layer pre-initialized, then B 3keV. No channeling -> ultra-shallow |
| `twin-well-cmos` | Twin-Well CMOS | `#6366F1` indigo | Sequential P 600keV + B 200keV. Complementary profiles overlaid |
| `high-tilt-halo` | High-Tilt Halo | `#A855F7` violet | B 30keV, tilt->45 deg. Asymmetric profile for pocket implant |

## 6. Parameter Panel — 12 Controls

| Group | Parameter | Unit | Range | Default | Control |
|-------|-----------|------|-------|---------|---------|
| Beam | Ion species | — | B/P/As/BF2 | B | dropdown |
| Beam | Beam energy | keV | 1-800 | 50 | slider |
| Beam | Dose | ions/cm^2 | 1e11-1e16 | 1e13 | log slider |
| Beam | Beam current | mA | 0.1-20 | 5 | slider |
| Geometry | Tilt angle | deg | 0-60 | 7 | slider |
| Geometry | Twist angle | deg | 0-360 | 0 | slider |
| Geometry | Crystal orientation | — | 100/110/111 | 100 | dropdown |
| Target | Screen oxide thickness | nm | 0-100 | 0 | slider |
| Target | Photoresist thickness | nm | 0-2000 | 0 | slider |
| Target | Substrate temperature | C | 25-600 | 25 | slider |
| Physics | Amorphization threshold | x10^21/cm^3 | 1-20 | 5 | slider |
| Physics | Damage annealing rate | a.u. | 0-1 | 0 | slider |

## 7. Testing Strategy

| Test file | Key assertions |
|-----------|---------------|
| `zbl-potential.test.ts` | phi(0)=1.0; potential decays with distance; screening length scales with Z1+Z2 |
| `stopping-power.test.ts` | Nuclear stopping peaks at correct energy; electronic scales as sqrt(E); Se > Sn at high energy; material-dependent |
| `bca-engine.test.ts` | Ion stops within substrate; energy conserved per collision; heavier ions shallower; recoil cascade when T > Ed; final position in bounds |
| `channeling-model.test.ts` | Critical angle decreases with energy; 0 deg tilt deeper than 7 deg; amorphous blocks channeling; temperature increases dechanneling |
| `damage-model.test.ts` | Vacancy count increases with dose; amorphization above threshold; annealing reduces vacancies; PAI initializes layer |
| `monte-carlo.test.ts` | Correct bin count; Rp within 20% of LSS; heavier ions smaller straggle ratio; backscatter < 20%; lateral straggle > 0 |
| `presets.test.ts` | 10 presets; each modifies expected params; round-trip check |
| `simulation-engine.test.ts` | 200 steps complete; ion count matches; damage evolves; statistics converge |
| `integration.test.ts` | Multi-layer crosses interfaces; channeling tail disappears after amorphization; high-tilt reduces Rp; BF2 mass effect |

## 8. Scope Boundaries

**In scope:**
- 7 physics modules, 4 components, 9 test files, 1 page route
- Pure client-side Monte Carlo, procedural Babylon.js geometry
- Back button via TimelineBar backHref
- 200-1000 ions per run (browser performance budget)

**Not in scope:**
- No WebWorker offloading (future optimization)
- No 2D dopant contour map (only 1D depth profile)
- No post-implant anneal simulation (diffusion/activation)
- No backend, no persistence

## 9. Summary

| Metric | Count |
|--------|-------|
| Physics modules | 7 |
| Components | 4 |
| Test files | 9 |
| Presets | 10 |
| Parameters | 12 (10 sliders + 2 dropdowns) |
| Metrics | 8 |
| Ion species | 4 (B, P, As, BF2) |
| Target materials | 3 (Si, SiO2, photoresist) |
| Total steps | 200 |
| Estimated source files | ~25 |
