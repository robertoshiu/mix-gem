# AR Tracking v3 — High-Fidelity Simulation & Tech-Flow Visuals

> **Quick Summary**: Upgrade the AR personnel tracking system from toy-like primitives to a military command center aesthetic with holographic augmentations, behavior state machines, and cinematic post-processing.
> 
> **Deliverables**:
> - Shared Babylon post-processing pipeline utility
> - Enhanced Zustand store with behavior state machine + equipment states
> - Cinematic rendering pipeline (bloom, glow, grain, vignette, chromatic aberration, SSAO)
> - Holographic personnel augmentations (scan rings, digital halos, directional indicators)
> - Zone force-field effects (vertical walls, noise texture, pulsing)
> - Holographic equipment models (wireframe + data panels + state lighting)
> - PiP with surveillance scan-line CRT overlay + AR tracking content
> - Military command center HUD styling
> - Personnel behavior state machine (patrol → observe → operate → avoid)
> - Equipment state simulation (idle → warmup → running → cooldown)
> 
> **Estimated Effort**: Large (18 tasks across 4 waves)
> **Parallel Execution**: YES — 4 waves
> **Critical Path**: Task 1 → Task 3 → Task 4 → Task 6 → Task 13 → Task 16 → Task 18

---

## Context

### Original Request
Upgrade the existing AR personnel tracking v2 system from "toy-like" (capsule primitives, simple PBR, no post-processing) to a high-fidelity simulation with military command center aesthetics. Personnel and equipment need holographic augmentation that feels "real" — AR scan rings, digital halos, force-field zones. The main view and PiP need tech-flow fluency — scan lines, data overlays, surveillance camera feel.

### Interview Summary
**Key Discussions**:
- **Simulation level**: Tech-fiction — semi-realistic with AR markers, pulse scan effects, digital halos on personnel; holographic wireframe + data panels for equipment
- **HUD style**: Military command center — dark background, scan lines, pulse borders, radar-style animations, data flow effects
- **Equipment rendering**: Holographic projection — glowing wireframe + labels + floating data panels. No high-poly 3D models needed.
- **Priority**: Sim realism first — behavior state machine for personnel, real equipment state simulation, meaningful alerts
- **PiP style**: Hybrid — surveillance camera frame (scan lines, CRT) + AR content overlays (target highlight, zone markers, tracking lines)
- **Performance budget**: 30fps acceptable — allows SSR/SSAO/DoF
- **Test strategy**: Agent-Executed QA only (Playwright screenshots + TypeScript compilation)

**Research Findings**:
- FabFloorScene.tsx already has GlowLayer + DefaultRenderingPipeline (lines 262-273) — extract as shared utility
- Babylon.js 9.6.2 has all needed APIs: GlowLayer, HighlightLayer, SSAO2, SSR, DefaultRenderingPipeline, NoiseProceduralTexture, GridMaterial, PostProcess for custom shaders
- No GLB model files exist yet — capsule fallback will remain the base, with holographic augmentations on top
- ArTrackingScene.tsx is the ONLY active Babylon scene with its own page route — no competing system conflict

### Metis Review
**Identified Gaps** (addressed):
- Post-processing is NOT "missing" — FabFloorScene.tsx has a pattern to extract, not build from scratch
- WarRoomBabylonScene.tsx exists but is not imported and not a conflict
- GLTF animation clips for new behavior states needed — will reuse existing walk/idle/look-around with overlay effects
- All 4 personnel in violation simultaneously — GlowLayer will have intensity cap
- Scene dispose with post-processing — explicit dispose() calls required in cleanup
- FPS measurement needed — add `window.__arTrackingFPS` for QA

---

## Work Objectives

### Core Objective
Transform the AR personnel tracking dashboard from a basic 3D visualization into a military-grade command center with holographic augmentations, realistic simulation behaviors, and cinematic visual fidelity — while maintaining 30fps on mid-range hardware.

### Concrete Deliverables
- `src/lib/babylon-pipeline.ts` — shared post-processing config utility
- `src/stores/ar-tracking-store.ts` — extended with behavior states, equipment states, richer alerts
- `src/components/babylon/ArTrackingScene.tsx` — enhanced with pipeline, glow, holographic FX, state-driven visuals
- `src/app/mes/ar-tracking/page.tsx` — military command center HUD styling
- `src/components/babylon/ar-tracking/` — new directory with modular scene components

### Definition of Done
- [x] `cd equipment-monitor && npx tsc --noEmit` → 0 errors
- [x] `cd equipment-monitor && npx next build` → SUCCESS
- [x] Playwright screenshot shows holographic personnel augmentations (scan rings, halos)
- [x] Playwright screenshot shows force-field zone effects (vertical walls, pulsing)
- [x] Playwright screenshot shows equipment holographic models (wireframe + data panels)
- [x] Playwright screenshot shows PiP with scan-line overlay
- [x] `window.__arTrackingFPS` reports ≥30 fps with all effects enabled
- [x] Personnel behavior state machine operates: patrol → observe → operate → avoid → patrol
- [x] Equipment state simulation cycles: idle → warmup → running → cooldown

### Must Have
- DefaultRenderingPipeline (bloom, grain, vignette, chromatic aberration) on main viewport
- GlowLayer for all emissive elements (AR glasses, zone borders, holographic overlays)
- Personnel holographic augmentations that work on BOTH GLTF models AND capsule fallback
- Zone force-field mesh effects (vertical translucent walls with noise texture + pulsing)
- Equipment holographic models with state-driven lighting
- PiP with custom PostProcess scan-line shader (not just CSS overlay)
- Personnel behavior state machine with observable transitions
- Equipment state simulation (warmup/running/cooldown)
- 30fps minimum on mid-range hardware
- Shared pipeline config (extracted from FabFloorScene.tsx)

### Must NOT Have (Guardrails)
- NO changes to FabFloorScene.tsx — only extract a shared utility
- NO deletion or modification of WarRoomBabylonScene.tsx
- NO new GLB model files required — all visual enhancements work on capsule fallback
- NO physics engine — zone avoidance = animation state change, not collision
- NO changes to ar-tracking-store.ts PUBLIC API surface — extend only
- NO `as any` or `@ts-ignore` — type-safe code throughout
- NO console.log in production code
- NO third-party dependencies beyond @babylonjs/core, @babylonjs/loaders, @babylonjs/gui (already installed), and @babylonjs/materials (installed in Task 1)
- AI slop patterns to avoid: excessive comments, over-abstraction, generic names (data/result/item/temp)

---

## Verification Strategy (MANDATORY)

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: YES (Jest configured in equipment-monitor)
- **Automated tests**: YES (tests-after) — Store logic tests, TypeScript compilation
- **Framework**: Jest + Playwright for visual QA

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Frontend/UI**: Use Playwright — Navigate, interact, assert DOM, screenshot
- **3D Scene**: Use Playwright — screenshot capture, FPS measurement via `window.__arTrackingFPS`
- **Store Logic**: Use Jest — unit tests for state machine transitions
- **Build**: Use Bash — `npx tsc --noEmit` and `npx next build`

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Foundation — 5 parallel tasks):
├── Task 1: Extract shared Babylon pipeline config [quick]
├── Task 2: Extend Zustand store — behavior state machine + equipment states [deep]
├── Task 3: Add DefaultRenderingPipeline + GlowLayer to ArTrackingScene [quick]
├── Task 4: Enhance scene lighting + GRID floor material [unspecified-high]
└── Task 5: Create PostProcess scan-line shader for PiP [deep]

Wave 2 (Core Visuals — 5 parallel tasks, some depend on Wave 1):
├── Task 6: Personnel holographic augmentations (depends: 3, 4) [visual-engineering]
├── Task 7: Zone force-field effects (depends: 3, 4) [deep]
├── Task 8: Holographic equipment models (depends: 3, 4) [visual-engineering]
├── Task 9: PiP CRT/surveillance overlay integration (depends: 5) [visual-engineering]
└── Task 10: Alert system enhancement — severity + escalation (depends: 2) [unspecified-high]

Wave 3 (Integration — 4 parallel tasks):
├── Task 11: PiP AR content overlay (depends: 9) [visual-engineering]
├── Task 12: Military command center HUD styling (depends: none) [visual-engineering]
├── Task 13: Behavior-driven animation system (depends: 2, 6) [deep]
└── Task 14: Equipment state visual integration (depends: 2, 8) [visual-engineering]

Wave 4 (Polish + QA — 4 tasks):
├── Task 15: SSR/SSAO integration + scene optimization (depends: 1, 3) [unspecified-high]
├── Task 16: FPS measurement + performance tuning (depends: all Wave 2-3) [unspecified-high]
├── Task 17: Store unit tests — behavior + equipment states (depends: 2) [quick]
└── Task 18: Full integration QA + visual regression (depends: all) [unspecified-high]

Wave FINAL (Verification — 4 parallel reviews):
├── F1: Plan compliance audit (oracle)
├── F2: Code quality review (unspecified-high)
├── F3: Real manual QA — Playwright full scenario (unspecified-high)
└── F4: Scope fidelity check (deep)
→ Present results → Get explicit user okay

Critical Path: T1 → T3 → T6 → T13 → T16 → T18
Parallel Speedup: ~65% faster than sequential
Max Concurrent: 5 (Waves 1 & 2)
```

### Dependency Matrix

| Task | Depends On | Blocks | Wave |
|------|-----------|--------|------|
| 1 | — | 3, 15 | 1 |
| 2 | — | 10, 13, 14, 17 | 1 |
| 3 | 1 | 4, 6, 7, 8, 15 | 1 |
| 4 | 3 | 6, 7, 8 | 1 |
| 5 | — | 9, 11 | 1 |
| 6 | 3, 4 | 13 | 2 |
| 7 | 3, 4 | — | 2 |
| 8 | 3, 4 | 14 | 2 |
| 9 | 5 | 11 | 2 |
| 10 | 2 | — | 2 |
| 11 | 9 | — | 3 |
| 12 | — | — | 3 |
| 13 | 2, 6 | 16 | 3 |
| 14 | 2, 8 | 16 | 3 |
| 15 | 1, 3 | 16 | 4 |
| 16 | all W2-3 | 18 | 4 |
| 17 | 2 | — | 4 |
| 18 | all | FINAL | 4 |

### Agent Dispatch Summary

- **Wave 1**: 5 tasks — T1 `quick`, T2 `deep`, T3 `quick`, T4 `unspecified-high`, T5 `deep`
- **Wave 2**: 5 tasks — T6 `visual-engineering`, T7 `deep`, T8 `visual-engineering`, T9 `visual-engineering`, T10 `unspecified-high`
- **Wave 3**: 4 tasks — T11 `visual-engineering`, T12 `visual-engineering`, T13 `deep`, T14 `visual-engineering`
- **Wave 4**: 4 tasks — T15 `unspecified-high`, T16 `unspecified-high`, T17 `quick`, T18 `unspecified-high`
- **FINAL**: 4 reviews — F1 `oracle`, F2 `unspecified-high`, F3 `unspecified-high`, F4 `deep`

---

## TODOs

- [x] 1. Extract shared Babylon post-processing pipeline config + install @babylonjs/materials

  **What to do**:
  - Install `@babylonjs/materials@^9.6.2` package (needed for GridMaterial in Task 4): `cd equipment-monitor && npm install @babylonjs/materials@^9.6.2`
  - Create `src/lib/babylon-pipeline.ts` — extract the DefaultRenderingPipeline + GlowLayer setup from `FabFloorScene.tsx` into a reusable function
  - Function signature: `createCinematicPipeline(scene: BABYLON.Scene, camera: BABYLON.Camera, options?: PipelineOptions): { pipeline: DefaultRenderingPipeline; glow: GlowLayer }`
  - PipelineOptions: configurable bloom (threshold, weight, kernel), grain (intensity), chromatic aberration (amount), vignette (weight), glow (intensity, kernel)
  - Export defaults matching current FabFloorScene config: bloomThreshold=0.78, bloomWeight=0.32, grainIntensity=4, chromaticAberration=8, glowIntensity=0.62, glowKernel=32
  - Add SSR and SSAO2 as opt-in options (disabled by default, enabled via flag)
  - FabFloorScene.tsx should NOT be modified — this is just extracting the pattern for reuse

  **Must NOT do**:
  - Do not modify FabFloorScene.tsx
  - Do not modify WarRoomBabylonScene.tsx
  - Do not add SSR/SSAO by default

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Small, focused extraction task with clear source material
  - **Skills**: [`fastapi-patterns`]
    - Not needed — this is pure Babylon.js utility extraction

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3, 4, 5)
  - **Blocks**: Tasks 3, 15
  - **Blocked By**: None

  **References**:

  **Pattern References** (existing code to follow):
  - `src/components/babylon/FabFloorScene.tsx:262-273` — Post-processing config to extract (GlowLayer + DefaultRenderingPipeline with bloom, grain, chromatic aberration)
  - `src/components/babylon/FabFloorScene.tsx:22-29` — createPbr helper pattern (factory function, consistent naming)

  **API/Type References**:
  - Babylon.js DefaultRenderingPipeline docs: https://doc.babylonjs.com/features/featuresDeepDive/postProcesses/defaultRenderingPipeline
  - Babylon.js GlowLayer docs: https://doc.babylonjs.com/features/featuresDeepDive/mesh/glowLayer

  **WHY Each Reference Matters**:
  - FabFloorScene lines 262-273 contain the exact pipeline configuration we need to extract and parameterize — this is our source of truth for defaults
  - FabFloorScene lines 22-29 show the helper function pattern (createPbr) we should follow for our pipeline helper

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY)**

  ```
  Scenario: Shared pipeline utility compiles correctly
    Tool: Bash
    Preconditions: Equipment-monitor project cloned, dependencies installed
    Steps:
      1. Run `cd equipment-monitor && npx tsc --noEmit`
      2. Grep for "babylon-pipeline" in src/lib/ — verify file exists
      3. Grep for "createCinematicPipeline" — verify exported
    Expected Result: TypeScript compiles with 0 errors, file exists, function exported
    Failure Indicators: TypeScript errors, missing file, missing export
    Evidence: .sisyphus/evidence/task-1-compile-check.txt

  Scenario: Pipeline config values match FabFloorScene defaults
    Tool: Bash
    Preconditions: babylon-pipeline.ts created
    Steps:
      1. Read babylon-pipeline.ts default config values
      2. Compare with FabFloorScene.tsx lines 262-273 values
    Expected Result: bloomThreshold=0.78, bloomWeight=0.32, grainIntensity=4, chromaticAberration=8, glowIntensity=0.62, glowKernel=32
    Failure Indicators: Values don't match defaults
    Evidence: .sisyphus/evidence/task-1-config-check.txt
  ```

  **Commit**: YES (groups with 1)
  - Message: `refactor(babylon): extract shared post-processing pipeline config and install @babylonjs/materials`
  - Files: `src/lib/babylon-pipeline.ts`, `package.json`, `package-lock.json`
  - Pre-commit: `cd equipment-monitor && npx tsc --noEmit`

- [x] 2. Extend Zustand store — behavior state machine + equipment states

  **What to do**:
  - Add `PersonnelState` type: `'patrolling' | 'observing' | 'operating' | 'avoiding' | 'idle'`
  - Add state to Personnel interface: `state: PersonnelState` (default `idle`)
  - Add `stateTimer: number` to Personnel (seconds in current state)
  - Add `equipmentState` type: `'idle' | 'warmup' | 'running' | 'cooldown'`
  - Add `EquipmentInfo` interface: `{ id: string; name: string; bay: string; state: EquipmentState; stateTimer: number; temperature: number }`
  - Add `equipment: EquipmentInfo[]` to store (8 bays mapped from existing station positions)
  - Add `alertSeverity: 'info' | 'warning' | 'critical'` to ArAlert interface
  - Add store actions: `setPersonnelState(id, state)`, `tickPersonnelTimers(deltaMs)`, `setEquipmentState(id, state)`, `tickEquipmentTimers(deltaMs)`
  - Add severity escalation: after 5s in zone → warning, after 15s → critical
  - Keep ALL existing store API — extend only

  **Must NOT do**:
  - Do not remove or rename any existing store exports
  - Do not change existing Personnel field names
  - Do not add third-party dependencies

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Complex state machine with multiple interacting types, careful API design
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3, 4, 5)
  - **Blocks**: Tasks 10, 13, 14, 17
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/stores/ar-tracking-store.ts:1-154` — Current store structure, all interfaces, zone definitions, patrol routes, initial data
  - `src/stores/ar-tracking-store.ts:99-127` — DYNAMIC_ZONES definition (map equipment IDs to dynamic zone anchors)
  - `src/stores/ar-tracking-store.test.ts:1-175` — Existing test patterns (beforeEach, useArTrackingStore.setState, expect patterns)

  **API/Type References**:
  - Zustand 5.0 create API: https://github.com/pmndrs/zustand

  **WHY Each Reference Matters**:
  - Current store (1-154): Must understand the existing API to extend it without breaking changes
  - DYNAMIC_ZONES (99-127): Equipment IDs map to dynamic zone anchors — the new equipment state system builds on this
  - Test patterns (1-175): Must follow existing test conventions when writing new tests

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY)**

  ```
  Scenario: New store fields compile and default correctly
    Tool: Bash (Jest)
    Preconditions: Store updated
    Steps:
      1. Run `cd equipment-monitor && npx jest src/stores/ar-tracking-store.test.ts --no-cache --verbose`
      2. Verify new test cases cover: personnel default state='idle', equipment array length, alert severity
      3. Run `cd equipment-monitor && npx tsc --noEmit`
    Expected Result: All tests pass, TypeScript compiles with 0 errors, personnel[0].state defaults to 'idle'
    Failure Indicators: TypeScript errors, test failures, missing fields
    Evidence: .sisyphus/evidence/task-2-store-defaults.txt

  Scenario: State machine transitions work correctly
    Tool: Bash (Jest)
    Preconditions: Tests written
    Steps:
      1. Run `cd equipment-monitor && npx jest src/stores/ar-tracking-store.test.ts --no-cache --verbose`
      2. Check for new test cases: setPersonnelState, tickPersonnelTimers, setEquipmentState, tickEquipmentTimers, alert severity escalation
    Expected Result: All tests PASS, including new behavior state machine tests
    Failure Indicators: Any test FAIL, missing test cases
    Evidence: .sisyphus/evidence/task-2-test-results.txt
  ```

  **Commit**: YES (groups with 2)
  - Message: `feat(ar-tracking): add behavior state machine and equipment state to store`
  - Files: `src/stores/ar-tracking-store.ts`, `src/stores/ar-tracking-store.test.ts`
  - Pre-commit: `cd equipment-monitor && npx jest src/stores/ar-tracking-store.test.ts --no-cache`

- [x] 3. Add DefaultRenderingPipeline + GlowLayer to ArTrackingScene

  **What to do**:
  - Import `createCinematicPipeline` from `src/lib/babylon-pipeline.ts`
  - In `createScene`, after scene creation and camera setup, call `createCinematicPipeline(scene, overviewCamera, { glowIntensity: 0.5, bloomWeight: 0.28, grainIntensity: 3, chromaticAberration: 5, vignetteWeight: 1.2 })`
  - Add `GlowLayer` custom emissive color selector: cyan (#22d3ee) for AR glasses and zone borders, amber (#f59e0b) for warning labels, red (#ef4444) for violation elements
  - Add personnel mesh names to GlowLayer included meshes (AR glasses, scan rings, halos — added later in Task 6)
  - Add `HighlightLayer` for selected/tracked personnel (cyan outline)
  - Wire the PiP camera to use the same pipeline (or separate pipeline without DoF)
  - Expose `window.__arTrackingFPS = engine.getFps()` in the render loop for QA measurement
  - Expose `window.__arTrackingStore = useArTrackingStore` for Playwright-based QA testing (personnel state manipulation, zone state changes)
  - Ensure proper dispose() calls for pipeline and glow layer in cleanup

  **Must NOT do**:
  - Do not modify FabFloorScene.tsx
  - Do not add SSR or SSAO yet (Task 15)
  - Do not change existing camera behavior

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Focused integration task, well-defined API from Task 1
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 2, 4, 5 — but depends on Task 1)
  - **Parallel Group**: Wave 1
  - **Blocks**: Tasks 4, 6, 7, 8, 15
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `src/components/babylon/FabFloorScene.tsx:262-273` — Reference implementation for pipeline + GlowLayer setup
  - `src/components/babylon/FabFloorScene.tsx:286-294` — Scene dispose pattern (dispose guard, stopRenderLoop, scene.dispose, engine.dispose)

  **API/Type References**:
  - `src/lib/babylon-pipeline.ts` — Our shared pipeline utility (created in Task 1)
  - Babylon.js GlowLayer customEmissiveColorSelector: https://doc.babylonjs.com/features/featuresDeepDive/mesh/glowLayer

  **WHY Each Reference Matters**:
  - FabFloorScene lines 262-273 show the exact pipeline configuration pattern we need to invoke
  - FabFloorScene lines 317-322 show the cleanup pattern we must follow to prevent memory leaks
  - Our babylon-pipeline.ts is the API we're calling

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY)**

  ```
  Scenario: Post-processing pipeline renders with glow effects
    Tool: Playwright
    Preconditions: AR tracking page loads
    Steps:
      1. Navigate to http://localhost:3000/mes/ar-tracking
      2. Wait 3 seconds for scene to initialize
      3. Take screenshot of full page
      4. Check that AR glasses glow effect is visible (cyan glow around personnel)
      5. Check that zone borders have glow effect
    Expected Result: Screenshot shows visible glow around emissive elements (AR glasses, zone borders, labels)
    Failure Indicators: No glow visible, flat rendering, pipeline errors in console
    Evidence: .sisyphus/evidence/task-3-pipeline-glow.png

  Scenario: FPS measurement is accessible
    Tool: Playwright
    Preconditions: Scene running
    Steps:
      1. Navigate to page
      2. Wait 5 seconds for FPS to stabilize
      3. Evaluate `window.__arTrackingFPS` in browser context
      4. Assert value is a number > 0
    Expected Result: `window.__arTrackingFPS` returns a number ≥ 15
    Failure Indicators: Undefined value, 0, or error
    Evidence: .sisyphus/evidence/task-3-fps-check.txt
  ```

  **Commit**: YES (groups with 3)
  - Message: `feat(ar-tracking): add DefaultRenderingPipeline and GlowLayer to scene`
  - Files: `src/components/babylon/ArTrackingScene.tsx`
  - Pre-commit: `cd equipment-monitor && npx tsc --noEmit`

- [x] 4. Enhance scene lighting + GridMaterial floor

  **What to do**:
  - Replace the current flat grid lines (LinesMesh) with `GridMaterial` from `@babylonjs/materials` — major unit lines in bright cyan, minor lines in subtle blue
  - Configure GridMaterial: `mainColor`=#0A1628, `lineColor`=#12324f, `minorUnitVisibility`=0.35, `majorUnitFrequency`=5, `gridRatio`=0.8, `opacity`=0.96
  - Upgrade HemisphericLight intensity from 0.76 to match FabFloorScene (0.15) — let bloom and glow do the atmosphere work instead of flat ambient
  - Add colored point lights at each equipment bay position (subtle cyan/amber, low intensity 0.3-0.5, range 8-12)
  - Add volumetric light cones or spot lights for dynamic zone entry points
  - Adjust `scene.clearColor` to `Color4(0.02, 0.02, 0.06, 1)` — darker base for better glow contrast
  - All lighting changes must preserve the PiP camera's view quality

  **Must NOT do**:
  - Do not remove existing lighting entirely — enhance it
  - Do not add shadow generators (performance concern for 30fps target)
  - Do not modify FabFloorScene.tsx

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Multi-step scene enhancement requiring lighting design decisions
  - **Skills**: [`babylonjs-engine`]
    - Babylon.js lighting and material configuration is domain-specific

  **Parallelization**:
  - **Can Run In Parallel**: YES (but depends on Task 3 for pipeline)
  - **Parallel Group**: Wave 1
  - **Blocks**: Tasks 6, 7, 8
  - **Blocked By**: Task 3

  **References**:

  **Pattern References**:
  - `src/components/babylon/ArTrackingScene.tsx:82-124` — Current floor and equipment bay positions (these stay fixed, lighting goes here)
  - `src/components/babylon/FabFloorScene.tsx:22-29` — createPbr defaults (roughness=0.42, metallic=0.26, emissive=0.14 — slightly different from ArTracking's 0.58/0.12/0.08)

  **API/Type References**:
  - Babylon.js GridMaterial: https://doc.babylonjs.com/features/featuresDeepDive/materials/gridMaterial
  - Babylon.js PointLight: https://doc.babylonjs.com/features/featuresDeepDive/lights/lights_introduction

  **WHY Each Reference Matters**:
  - ArTrackingScene lines 82-124 have the exact equipment bay positions we need to place point lights at
  - FabFloorScene createPbr shows proven PBR parameter values for this type of scene

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY)**

  ```
  Scenario: Enhanced lighting and GridMaterial render correctly
    Tool: Playwright
    Preconditions: AR tracking page loads with pipeline
    Steps:
      1. Navigate to http://localhost:3000/mes/ar-tracking
      2. Wait 3 seconds for scene initialization
      3. Take screenshot of full page
      4. Verify grid floor shows major (5-unit) and minor grid lines
      5. Verify point light highlights are visible at equipment bay positions
      6. Compare background color is notably darker than before
    Expected Result: Grid floor shows distinct major grid lines, equipment bays have subtle light highlights, scene atmosphere is darker with better glow contrast
    Failure Indicators: No grid visible, flat lighting, wrong background color
    Evidence: .sisyphus/evidence/task-4-lighting-grid.png

  Scenario: GridMaterial does not crash or cause Z-fighting
    Tool: Bash
    Preconditions: Scene compiles and runs
    Steps:
      1. Run `cd equipment-monitor && npx tsc --noEmit`
      2. Check console errors in Playwright screenshot
    Expected Result: No TypeScript errors, no WebGL console errors
    Failure Indicators: TypeScript errors, WebGL warnings about Z-fighting or material issues
    Evidence: .sisyphus/evidence/task-4-compile-check.txt
  ```

  **Commit**: YES (groups with 4)
  - Message: `feat(ar-tracking): enhance scene lighting and add GridMaterial floor`
  - Files: `src/components/babylon/ArTrackingScene.tsx`
  - Pre-commit: `cd equipment-monitor && npx tsc --noEmit`

- [x] 5. Create PostProcess scan-line CRT shader for PiP

  **What to do**:
  - Create a custom PostProcess shader that adds surveillance camera effects to a viewport
  - Shader effects: horizontal scan lines (configurable intensity), subtle CRT curvature distortion, vignette darkening, slight chromatic shift at edges, static noise grain overlay
  - Create `src/components/babylon/ar-tracking/pip-scanline-shader.ts` — Babylon.js PostProcess with custom fragment shader
  - Fragment shader uniform parameters: `scanLineIntensity` (0.0-1.0), `curvature` (0.0-2.0), `vignetteIntensity` (0.0-2.0), `noiseAmount` (0.0-0.1), `time` (for animation)
  - Scan lines: sin-based horizontal lines at fixed pixel intervals, with slight brightness variation
  - CRT curvature: subtle UV distortion toward edges
  - Vignette: distance-based darkening from center
  - Noise: procedural random noise perturbation
  - Time-driven animation: scan line position drifts slowly upward
  - The PostProcess is applied ONLY to the PiP camera (arCamera), not the overview camera

  **Must NOT do**:
  - Do not apply scan-line shader to the main overview camera
  - Do not use CSS/HTML overlay for scan lines (must be a real shader for authenticity)
  - Do not add third-party shader libraries

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Custom shader authoring requires GLSL knowledge and careful parameterization
  - **Skills**: [`webgl-craft`]
    - WebGL shader expertise needed for custom PostProcess

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: Tasks 9, 11
  - **Blocked By**: None

  **References**:

  **API/Type References**:
  - Babylon.js PostProcess: https://doc.babylonjs.com/features/featuresDeepDive/postProcesses/usePostProcesses
  - Babylon.js CRT shader reference: https://babylonjs.medium.com/retro-crt-shader-a-post-processing-effect-study-1cb3f783afbc
  - Babylon.js Custom PostProcess with custom fragment shader: https://doc.babylonjs.com/features/featuresDeepDive/postProcesses/customPostProcesses

  **WHY Each Reference Matters**:
  - Custom PostProcess is the mechanism for adding the surveillance camera effect to the PiP viewport
  - CRT shader reference provides proven scan-line + curvature + vignette patterns

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY)**

  ```
  Scenario: Scan-line PostProcess renders on PiP viewport
    Tool: Playwright
    Preconditions: AR tracking page loads, PiP is visible (trigger an alert or double-click personnel row)
    Steps:
      1. Navigate to http://localhost:3000/mes/ar-tracking
      2. Wait 5 seconds for scene initialization
      3. Double-click a personnel row to open PiP
      4. Wait 2 seconds for PiP to stabilize
      5. Take screenshot showing both main view and PiP
      6. Verify PiP shows scan line effect (visible horizontal lines)
      7. Verify main view does NOT show scan lines
    Expected Result: PiP viewport shows subtle CRT scan lines; main viewport is clean
    Failure Indicators: No scan lines visible, scan lines on main view, shader compilation error
    Evidence: .sisyphus/evidence/task-5-pip-scanlines.png

  Scenario: Shader compiles without WebGL errors
    Tool: Bash
    Preconditions: Shader file created
    Steps:
      1. Run `cd equipment-monitor && npx tsc --noEmit`
      2. Check for shader compilation errors in browser console logs
    Expected Result: TypeScript compiles, no WebGL shader compilation errors
    Failure Indicators: TypeScript errors, GLSL compilation errors
    Evidence: .sisyphus/evidence/task-5-shader-compile.txt
  ```

  **Commit**: YES (groups with 5)
  - Message: `feat(ar-tracking): create custom PostProcess scan-line CRT shader for PiP`
  - Files: `src/components/babylon/ar-tracking/pip-scanline-shader.ts`
  - Pre-commit: `cd equipment-monitor && npx tsc --noEmit`

- Pre-commit: `cd equipment-monitor && npx tsc --noEmit`

- [x] 6. Personnel holographic augmentations

  **What to do**:
  - Add holographic augmentations to each personnel that work on BOTH GLTF models AND capsule fallback:
    1. **Scan Ring**: A pulsing torus mesh around the person at waist height (y=0.9), cyan emissive, scaling animation (scale 0.9→1.1 over 2s cycle)
    2. **Digital Halo**: A thin glowing ring above the head (y=2.3 for capsule, y=2.0 for GLTF), billboarded, with "scanning" rotation animation
    3. **Directional Indicator**: A small arrow/triangle mesh in front of the person showing facing direction, cyan emissive, attached to node.rotation.y
    4. **Status Glow Color**: When `state === 'normal'` → cyan (#22d3ee), `state === 'operating'` → amber (#f59e0b), `state === 'avoiding'` → red (#ef4444), `state === 'observing'` → blue (#3b82f6)
    5. **Tracking ID Label Enhancement**: Replace simple DynamicTexture label with a "data card" — small panel behind the name tag showing personnel ID, state, and zone status
  - Add these meshes to the GlowLayer's included meshes list for proper bloom
  - State transitions should change the emissive color of all augmentation meshes with a 300ms transition
  - When in violation state, all augmentations intensify (emissive scale 2x, scan ring pulse frequency doubles)

  **Must NOT do**:
  - Do not require GLTF models — all augmentations must work on capsule+sphere primitives
  - Do not modify the GLTF loading logic
  - Do not use `as any` for mesh materials

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: 3D visual effects with animation, color, and timing — core visual work
  - **Skills**: [`babylonjs-engine`]
    - Babylon.js mesh creation, animation, and GlowLayer integration

  **Parallelization**:
  - **Can Run In Parallel**: YES (with 7, 8, 9, 10)
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 13
  - **Blocked By**: Tasks 3, 4

  **References**:

  **Pattern References**:
  - `src/components/babylon/ArTrackingScene.tsx:184-302` — Current personnel creation (capsule+sphere+glasses) — augmentations must parent to node
  - `src/components/babylon/ArTrackingScene.tsx:517-524` — Violation state color change pattern (pulsing red emissive) — reuse for augmentation state transitions

  **API/Type References**:
  - Babylon.js MeshBuilder.CreateTorus: for scan rings
  - Babylon.js GlowLayer.addIncludedOnlyMesh: for selective bloom
  - Babylon.js Animation: for pulsing/scaling animations

  **WHY Each Reference Matters**:
  - Lines 184-302 show the exact personnel mesh structure — new augmentations must parent to the same TransformNode
  - Lines 517-524 show the proven pattern for state-driven color changes — we extend this for all augmentation meshes

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY)**

  ```
  Scenario: Holographic augmentations appear on personnel
    Tool: Playwright
    Preconditions: AR tracking page loads with pipeline
    Steps:
      1. Navigate to http://localhost:3000/mes/ar-tracking
      2. Wait 5 seconds for scene initialization and GLTF fallback
      3. Take screenshot
      4. Verify scan ring torus appears around at least 1 personnel member
      5. Verify digital halo appears above at least 1 personnel head
      6. Verify directional indicator shows facing direction
    Expected Result: Cyan glowing scan rings and halos are clearly visible around each personnel figure
    Failure Indicators: No augmentations visible, flat rendering without glow, mesh creation errors in console
    Evidence: .sisyphus/evidence/task-6-holographic-augmentations.png

  Scenario: Augmentation state color changes on zone violation
    Tool: Playwright
    Preconditions: Personnel enters restricted zone (dynamic zone recipe running)
    Steps:
      1. Wait for a dynamic zone to become active (recipe running)
      2. Wait for personnel to enter the active zone
      3. Take screenshot showing violation state
      4. Verify augmentation colors change from cyan to red
      5. Verify scan ring pulse frequency increases
    Expected Result: Augmentations change from gentle cyan to intense red when personnel enter restricted zone
    Failure Indicators: No color change, augmentation colors stuck at cyan
    Evidence: .sisyphus/evidence/task-6-violation-state.png
  ```

  **Commit**: YES (groups with 6)
  - Message: `feat(ar-tracking): add holographic personnel augmentations`
  - Files: `src/components/babylon/ArTrackingScene.tsx`
  - Pre-commit: `cd equipment-monitor && npx tsc --noEmit`

- [x] 7. Zone force-field effects

  **What to do**:
  - Replace the flat ground markers (`CreateGround` + PBR at alpha 0.12) for restricted zones with vertical force-field walls:
    1. **Vertical Wall Mesh**: For each zone, create 4 thin box meshes forming walls at zone boundaries (height ~3m, thickness ~0.02m), positioned at zone edges
    2. **Force-Field Material**: `PBRMaterial` with `albedoColor=#ef4444`, `emissiveColor=#ef4444.scale(0.4)`, `alpha=0.08`, `roughness=0.1`, `metallic=0.9`, `transparencyMode=PBRMATERIAL_ALPHABLEND`
    3. **Noise Texture Overlay**: Use `NoiseProceduralTexture` with low persistence, mapped to emissive channel of force-field material, animated at `animationSpeedFactor=2`
    4. **Pulse Animation**: Alpha oscillates between 0.06 and 0.14 on a 520ms sine wave (existing pattern)
    5. **Entry Zone Detection Floor**: Keep a subtle floor marker (alpha 0.04) for ground-level visibility
  - Dynamic zones: same force-field effect, but fades in over 1.5s and out over 2s (existing pattern)
  - Add zone border lines to GlowLayer for bloom effect on zone boundaries
  - Add `RECIPE ACTIVE` pulsing label (existing pattern) at y=2.2

  **Must NOT do**:
  - Do not remove the existing border LinesMesh — enhance it, don't replace it
  - Do not use ShaderMaterial — stick with PBRMaterial + NoiseProceduralTexture
  - Do not change zone collision logic

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Complex 3D mesh creation with animated materials and texture mapping
  - **Skills**: [`babylonjs-engine`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (with 6, 8, 9, 10)
  - **Parallel Group**: Wave 2
  - **Blocks**: None directly
  - **Blocked By**: Tasks 3, 4

  **References**:

  **Pattern References**:
  - `src/components/babylon/ArTrackingScene.tsx:126-183` — Current restricted zone creation (ground marker + border + label) — enhance this, don't replace
  - `src/components/babylon/ArTrackingScene.tsx:377-409` — Dynamic zone fade animation pattern (alpha interpolation) — reuse for force-field walls
  - `src/components/babylon/ArTrackingScene.tsx:159-183` — Dynamic zone creation with `DynamicZoneRuntime` type — extend this for wall meshes

  **API/Type References**:
  - Babylon.js NoiseProceduralTexture: https://doc.babylonjs.com/features/featuresDeepDive/materials/using/proceduralTextures
  - Babylon.js PBRMaterial transparency: PBRMATERIAL_ALPHABLEND constant

  **WHY Each Reference Matters**:
  - Lines 126-183 show the existing zone creation pattern — force-field walls must be added alongside, not replacing
  - Lines 377-409 show the alpha interpolation pattern for dynamic zones — force-field walls follow the same pattern

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY)**

  ```
  Scenario: Force-field walls appear on restricted zones
    Tool: Playwright
    Preconditions: AR tracking page loads with pipeline
    Steps:
      1. Navigate to http://localhost:3000/mes/ar-tracking
      2. Wait 5 seconds for scene
      3. Take screenshot showing all visible zones
      4. Verify vertical semi-transparent wall meshes at zone boundaries
      5. Verify red glow on zone borders (GlowLayer bloom)
      6. Verify subtle pulsing animation on zone walls
    Expected Result: Restricted zones have visible vertical force-field walls with red glow and pulsing
    Failure Indicators: No vertical walls visible, flat ground markers only, no glow
    Evidence: .sisyphus/evidence/task-7-force-field.png

  Scenario: Dynamic zones fade in/out with force-field walls
    Tool: Playwright
    Preconditions: Wait for dynamic zone to activate
    Steps:
      1. Navigate to page
      2. Wait for IMPLANT-BEAM or LITHO-EUV dynamic zone to become active (could take 5-30 seconds)
      3. Take screenshot when active
      4. Wait for zone to deactivate
      5. Take screenshot when inactive
    Expected Result: Force-field walls appear with fade-in, disappear with fade-out when recipe state changes
    Failure Indicators: No fade animation, walls appear/disappear instantly
    Evidence: .sisyphus/evidence/task-7-dynamic-zone-fade.png
  ```

  **Commit**: YES (groups with 7)
  - Message: `feat(ar-tracking): add zone force-field effects`
  - Files: `src/components/babylon/ArTrackingScene.tsx`
  - Pre-commit: `cd equipment-monitor && npx tsc --noEmit`

- [x] 8. Holographic equipment models

  **What to do**:
  - Replace the current simple equipment bay boxes (Box primitives with PBR slat color) with holographic wireframe models:
    1. **Wireframe Shell**: For each bay, create a wireframe box outline using `MeshBuilder.CreateLines` (edges-only, no fill), taller and more detailed than current box
    2. **Data Panel**: A floating plane above each bay showing equipment name, state, and readings (DynamicTexture billboard)
    3. **State Lighting**: Equipment state drives the wireframe emissive color:
       - `idle`: dim cyan (#22d3ee) at emissive 0.06
       - `warmup`: amber (#f59e0b) pulsing (emissive 0.1→0.3 over 1s cycle)
       - `running`: bright green (#22c55e) at emissive 0.18
       - `cooldown`: blue (#3b82f6) fading (emissive 0.18→0.06 over 2s)
    4. **Equipment Visualization**: Add subtle internal structure lines showing key equipment components (etch chamber, wafer handling, process module — as line meshes)
    5. **Particle Hover**: Small floating particle points around active equipment (optional — only if perf allows, controlled by a feature flag)
  - Map each bay to the new `equipment` state from the store (Task 2)
  - Lines emission from state changes should be smooth (300ms transition)

  **Must NOT do**:
  - Do not create high-poly mesh models — wireframe lines only
  - Do not add particle system if FPS drops below 30
  - Do not change the existing equipment bay positions or sizes

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: 3D visual design with state-driven animations
  - **Skills**: [`babylonjs-engine`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (with 6, 7, 9, 10)
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 14
  - **Blocked By**: Tasks 3, 4

  **References**:

  **Pattern References**:
  - `src/components/babylon/ArTrackingScene.tsx:82-124` — Current equipment bay creation (8 bays, each a Box with PBR material + label)
  - `src/stores/ar-tracking-store.ts:99-127` — DYNAMIC_ZONES — map equipment IDs to anchor positions for dynamic zones
  - `src/components/babylon/FabFloorScene.tsx:66-70` — createStationBase pattern — shows how equipment stations are created

  **API/Type References**:
  - Babylon.js MeshBuilder.CreateLines: for wireframe edges
  - Babylon.js DynamicTexture: for data panel labels
  - Babylon.js GlowLayer: for wireframe glow

  **WHY Each Reference Matters**:
  - Lines 82-124 define the 8 bays we need to replace with holographic versions — positions and sizes stay the same
  - DYNAMIC_ZONES show which equipment bays have dynamic recipe states — these need state-driven lighting
  - FabFloorScene shows the station creation pattern for reference

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY)**

  ```
  Scenario: Holographic equipment models render in all 8 bays
    Tool: Playwright
    Preconditions: AR tracking page loads
    Steps:
      1. Navigate to http://localhost:3000/mes/ar-tracking
      2. Wait 5 seconds
      3. Take screenshot
      4. Count visible wireframe equipment models (should be 8)
      5. Verify data panels are visible above equipment
      6. Verify wireframe glow on emissive lines
    Expected Result: 8 holographic wireframe equipment models with floating data panels and cyan glow
    Failure Indicators: Box primitives still visible instead of wireframes, missing data panels, no glow
    Evidence: .sisyphus/evidence/task-8-holographic-equipment.png

  Scenario: Equipment state changes drive visual updates
    Tool: Playwright
    Preconditions: Equipment state simulation running
    Steps:
      1. Navigate to page
      2. Wait for a dynamic zone to transition to 'running' state
      3. Take screenshot showing green (running) equipment state
      4. Wait for transition to 'cooldown' state
      5. Take screenshot showing blue (cooldown) state
    Expected Result: Equipment wireframe color transitions from cyan (idle) → amber (warmup) → green (running) → blue (cooldown)
    Failure Indicators: Color doesn't change, stays at default cyan
    Evidence: .sisyphus/evidence/task-8-equipment-state-colors.png
  ```

  **Commit**: YES (groups with 8)
  - Message: `feat(ar-tracking): add holographic equipment models`
  - Files: `src/components/babylon/ArTrackingScene.tsx`
  - Pre-commit: `cd equipment-monitor && npx tsc --noEmit`

- [x] 9. PiP CRT/surveillance overlay integration

  **What to do**:
  - Apply the scan-line PostProcess from Task 5 to the PiP camera (arCamera)
  - Configure scan-line parameters for surveillance camera feel:
    - `scanLineIntensity`: 0.15 (subtle but visible)
    - `curvature`: 0.3 (slight barrel distortion)
    - `vignetteIntensity`: 0.8 (noticeable darkening)
    - `noiseAmount`: 0.03 (light grain)
  - Add time-based animation: scan lines drift slowly upward
  - Add a React overlay for the PiP border styling:
    - Thicker border (2px) with cyan glow
    - "REC" indicator that blinks (on for 0.5s, off for 0.5s)
    - Timestamp display (live updating `HH:MM:SS`)
    - Signal strength indicator (3 bars, animated)
    - "CAM-XX" label (where XX is the personnel ID suffix)
  - The PostProcess is attached to `arCamera` directly, so it only applies to the PiP viewport

  **Must NOT do**:
  - Do not apply PostProcess to the overview camera
  - Do not use CSS for scan-line overlay (must be a real WebGL PostProcess)
  - Do not change the PiP viewport position or size

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Combines 3D shader integration with React UI overlay styling
  - **Skills**: [`babylonjs-engine`, `ui-ux-pro-max`]
    - Babylon.js PostProcess integration + React HUD styling

  **Parallelization**:
  - **Can Run In Parallel**: YES (with 6, 7, 8, 10)
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 11
  - **Blocked By**: Task 5

  **References**:

  **Pattern References**:
  - `src/components/babylon/ArTrackingScene.tsx:426-430` — Current PiP camera setup (arCamera viewport configuration)
- `src/components/babylon/ArTrackingScene.tsx:547-562` — Current PiP target tracking logic (arCamera position + target update)
  - `src/app/mes/ar-tracking/page.tsx:130-156` — Current PipOverlay React component (border, close button, LIVE badge)

  **API/Type References**:
  - `src/components/babylon/ar-tracking/pip-scanline-shader.ts` — Custom PostProcess from Task 5
  - Babylon.js camera.attachPostProcess: for applying PostProcess to specific camera

  **WHY Each Reference Matters**:
  - ArTrackingScene lines 426-430 and 547-562 show exactly where arCamera is configured and tracked — PostProcess attaches to arCamera
  - PipOverlay in page.tsx shows the current React overlay that needs enhancement

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY)**

  ```
  Scenario: PiP shows surveillance scan-line effect
    Tool: Playwright
    Preconditions: Task 5 completed, PiP visible
    Steps:
      1. Navigate to http://localhost:3000/mes/ar-tracking
      2. Double-click a personnel row to activate PiP
      3. Wait 3 seconds
      4. Take screenshot showing both viewports
      5. Verify PiP shows horizontal scan lines (subtle visible lines)
      6. Verify main viewport does NOT show scan lines
      7. Verify slight vignette darkening at PiP edges
    Expected Result: PiP has visible scan lines and vignette; main viewport is clean
    Failure Indicators: No scan lines, scan lines on main view, distorted PiP
    Evidence: .sisyphus/evidence/task-9-pip-crt.png

  Scenario: PiP overlay shows REC, timestamp, and signal indicator
    Tool: Playwright
    Preconditions: PiP overlay enhanced
    Steps:
      1. Navigate to page
      2. Trigger PiP opening
      3. Verify "REC" indicator blinks
      4. Verify timestamp displays current time in HH:MM:SS format
      5. Verify signal strength indicator shows 3 bars
      6. Verify camera ID label (e.g., "CAM-01")
    Expected Result: PiP overlay contains blinking REC, live timestamp, signal bars, and camera ID
    Failure Indicators: Missing overlay elements, static timestamp, no REC blink
    Evidence: .sisyphus/evidence/task-9-pip-overlay.png
  ```

  **Commit**: YES (groups with 9)
  - Message: `feat(ar-tracking): integrate scan-line CRT shader into PiP viewport with surveillance overlay`
  - Files: `src/components/babylon/ArTrackingScene.tsx`, `src/app/mes/ar-tracking/page.tsx`
  - Pre-commit: `cd equipment-monitor && npx tsc --noEmit`

- [x] 10. Alert system enhancement — severity + escalation

  **What to do**:
  - Add severity escalation to the alert system:
    1. New `severity` field in ArAlert: `'info' | 'warning' | 'critical'`
    2. Auto-escalation: zone entry → `info`, after 5s in zone → `warning`, after 15s → `critical`
    3. Visual: `info` = amber border, `warning` = orange pulsing border + larger card, `critical` = red flashing border + full card width
    4. Severity drives PiP overlay highlight color (info=amber, warning=orange, critical=red border animation)
  - Update AlertToastStack to render differently based on severity:
    - `info`: compact card, amber left border, small icon
    - `warning`: wider card, orange pulsing left border, medium icon
    - `critical`: full-width card, red flashing border, large icon, auto-scroll to top
  - Store tick logic checks each person in zone and escalates their alert severity

  **Must NOT do**:
  - Do not remove existing alert functionality
  - Do not add sound effects
  - Do not change ArAlert.id format

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Store logic + React UI changes, multi-file coordination needed
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with 6, 7, 8, 9)
  - **Parallel Group**: Wave 2
  - **Blocks**: None directly
  - **Blocked By**: Task 2

  **References**:

  **Pattern References**:
  - `src/stores/ar-tracking-store.ts` — Current alert system (triggerAlert, acknowledgeAlert)
  - `src/app/mes/ar-tracking/page.tsx:74-128` — Current AlertToastStack component (card styling, buttons)

  **API/Type References**:
  - Zustand store patterns (existing)

  **WHY Each Reference Matters**:
  - Store: Must extend existing alert system without breaking current functionality
  - AlertToastStack: Must modify the existing card rendering to support severity levels

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY)**

  ```
  Scenario: Alert severity escalates over time
    Tool: Playwright
    Preconditions: Personnel enters restricted zone
    Steps:
      1. Navigate to page
      2. Wait for personnel to enter a restricted zone
      3. Verify alert appears with 'info' severity (amber)
      4. Wait 5 seconds
      5. Verify alert escalates to 'warning' (orange pulsing)
      6. Wait 10 more seconds
      7. Verify alert escalates to 'critical' (red flashing)
    Expected Result: Alert card visually changes color and size as severity escalates
    Failure Indicators: No color change, stuck at initial severity
    Evidence: .sisyphus/evidence/task-10-severity-escalation.png

  Scenario: Alert store includes severity field
    Tool: Bash (Jest)
    Preconditions: Store updated
    Steps:
      1. Run `cd equipment-monitor && npx jest src/stores/ar-tracking-store.test.ts --no-cache`
      2. Verify new test cases for severity escalation pass
    Expected Result: All tests pass including new severity escalation tests
    Failure Indicators: Any test failures
    Evidence: .sisyphus/evidence/task-10-test-results.txt
  ```

  **Commit**: YES (groups with 10)
  - Message: `feat(ar-tracking): add alert severity levels and escalation`
  - Files: `src/stores/ar-tracking-store.ts`, `src/app/mes/ar-tracking/page.tsx`
  - Pre-commit: `cd equipment-monitor && npx tsc --noEmit`

- Pre-commit: `cd equipment-monitor && npx tsc --noEmit`

- [x] 11. PiP AR content overlay

  **What to do**:
  - When PiP is showing a target person's first-person view, add AR enhancements INSIDE the PiP viewport:
    1. **Target Highlight**: If the PiP target is in a restricted zone, draw a colored border pulse in the PiP view (cyan/warning/red based on severity)
    2. **Zone Marker**: Small tracked-zone indicators at the bottom of PiP view showing which zones are in camera line-of-sight
    3. **Path Prediction**: A faint dotted line extending from the tracked person showing their next 2-3 waypoints (projected from above into first-person view)
    4. **Distance Indicator**: Text overlay showing distance to the nearest zone boundary in meters (e.g., "⚠ 2.4m to HV-ZONE")
  - These overlays are rendered as Babylon.js GUI elements attached to the PiP camera, NOT React DOM overlays, so they render inside the WebGL viewport
  - Use `AdvancedDynamicTexture.CreateFullscreenUI("pip-hud")` attached to arCamera

  **Must NOT do**:
  - Do not render AR overlays on the main overview camera
  - Do not overlay DOM elements on the PiP viewport (causes z-fighting with WebGL)
  - Do not add overlays that block the first-person view significantly

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Babylon.js GUI integration within a specific camera viewport
  - **Skills**: [`babylonjs-engine`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (with 12, 13, 14)
  - **Parallel Group**: Wave 3
  - **Blocks**: None
  - **Blocked By**: Task 9

  **References**:

  **Pattern References**:
  - `src/components/babylon/ArTrackingScene.tsx:426-430` — Current arCamera setup (viewport, FOV, minZ) and `lines 547-562` — PiP tracking logic
  - Babylon.js AdvancedDynamicTexture: https://doc.babylonjs.com/features/featuresDeepDive/gui/gui — GUI within WebGL context

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY)**

  ```
  Scenario: PiP AR overlays show zone marker and distance when in zone
    Tool: Playwright
    Preconditions: Na、vigate to page, open PiP on personnel near restricted zone
    Steps:
      1. Double-click a personnel near HV-ZONE or CHEM-STORE to open PiP
      2. Wait for personnel to approach restricted zone
      3. Take screenshot of PiP viewport
      4. Verify AR overlays appear inside PiP: zone marker, distance text
    Expected Result: PiP shows AR zone markers and distance indicator when near restricted zones
    Failure Indicators: No overlays visible inside PiP, overlays appear on main view instead
    Evidence: .sisyphus/evidence/task-11-pip-ar-overlay.png
  ```

  **Commit**: YES (groups with 11)
  - Message: `feat(ar-tracking): add AR content overlay to PiP viewport`
  - Files: `src/components/babylon/ArTrackingScene.tsx`
  - Pre-commit: `cd equipment-monitor && npx tsc --noEmit`

- [x] 12. Military command center HUD styling

  **What to do**:
  - Restyle the entire HUD overlay (`page.tsx` components) for military command center aesthetic:
    1. **PersonnelStatusPanel**: 
       - Darker background: `bg-[#060d1a]/90` instead of `bg-black/60`
       - Cyan scan-line border animation (CSS `@keyframes` scan-line sweep on border)
       - Header bar with blinking "TRACKING ACTIVE" indicator
       - Status dots with stronger glow shadows
       - Monospace data format: `OP-01 | CHEN WEI | [12.4, -3.2] | NORMAL`
    2. **AlertToastStack**:
       - Severity-colored left borders: info=amber, warning=orange, critical=red (independent of Task 10 but using same color mapping)
       - Slide-in animation from right (framer-motion or CSS transition)
       - Critical alerts: background pulse red
       - Improved typography: smaller, more compact, mono font
    3. **PipOverlay**:
       - Thicker cyan border with animated scan-line sweep
       - "REC ●" blinking red dot
       - "CAM-XX" label replacing personnel ID
       - Signal strength bars (3 bars, animated)
       - Live timestamp `HH:MM:SS`
    4. **General**:
       - Scan-line overlay on entire page (CSS pseudo-element with repeating-linear-gradient)
       - Corner brackets on panels (CSS clip-path or border tricks)
       - Font: `JetBrains Mono` for all data, `Inter` for labels only
       - Color tokens: cyan (#22d3ee) primary, amber (#f59e0b) warning, red (#ef4444) critical, slate (#64748b) dim

  **Must NOT do**:
  - Do not change ArTrackingScene.tsx (3D rendering) — this is React overlay layer only
  - Do not add new Zustand store fields — work with existing state
  - Do not use Babylon.js GUI for HUD elements — keep them as React/Tailwind

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: CSS animation and layout design for military HUD aesthetic
  - **Skills**: [`ui-ux-pro-max`]
    - UI/UX styling with animations, scan-lines, military command center theme

  **Parallelization**:
  - **Can Run In Parallel**: YES (no dependencies on other Wave 3 tasks)
  - **Parallel Group**: Wave 3
  - **Blocks**: None
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References**:
  - `src/app/mes/ar-tracking/page.tsx:38-70` — Current PersonnelStatusPanel (glassmorphism, cyan border)
  - `src/app/mes/ar-tracking/page.tsx:74-128` — Current AlertToastStack (red card, buttons)
  - `src/app/mes/ar-tracking/page.tsx:130-156` — Current PipOverlay (small, simple, LIVE badge)
  - `equipment-monitor/tailwind.config.ts` — Font families (Inter, JetBrains Mono), custom animations

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY)**

  ```
  Scenario: Military command center HUD renders with scan-line overlay and styled panels
    Tool: Playwright
    Preconditions: AR tracking page loads
    Steps:
      1. Navigate to http://localhost:3000/mes/ar-tracking
      2. Take full-page screenshot
      3. Verify scan-line overlay is subtly visible across the page
      4. Verify PersonnelStatusPanel has dark background with cyan border
      5. Verify "TRACKING ACTIVE" indicator is visible
      6. Verify JetBrains Mono monospace font for data labels
    Expected Result: Page has military command center aesthetic — dark theme, scan-line overlay, cyan accents, monospace data
    Failure Indicators: Same styling as before, missing scan-line overlay, wrong fonts
    Evidence: .sisyphus/evidence/task-12-hud-styling.png
  ```

  **Commit**: YES (groups with 12)
  - Message: `feat(ar-tracking): military command center HUD styling`
  - Files: `src/app/mes/ar-tracking/page.tsx`
  - Pre-commit: `cd equipment-monitor && npx tsc --noEmit`

- [x] 13. Behavior-driven animation system

  **What to do**:
  - Implement the personnel behavior state machine from Task 2 in the 3D scene:
    1. **Patrolling**: Walk animation (existing), directional indicator points forward, scan ring pulses normally
    2. **Observing**: Idle animation, personnel stops at waypoint for 3-5s, look-around animation plays, directional indicator dims
    3. **Operating**: Idle animation, personnel stops at equipment bay, scan ring turns amber, data panel appears above personnel showing "OPERATING"
    4. **Avoiding**: Fast walk animation (1.5x speed), personnel reroutes away from active dynamic zone, scan ring turns red, directional indicator points away from zone
    5. **Idle**: Subtle idle animation (breathing/sway), default starting state
  - Transition logic:
    - `idle` → `patrolling` after 2s
    - `patrolling` → `observing` when near a waypoint (random 30% chance each time reaching a waypoint)
    - `observing` → `patrolling` after 3-5s timer
    - `patrolling` → `operating` when near equipment bay and recipe is running (random 20% chance)
    - `operating` → `patrolling` after 8-15s timer
    - `patrolling`/`observing` → `avoiding` when dynamic zone becomes active nearby
    - `avoiding` → `patrolling` when 3m+ away from zone boundary
    - Any state → `idle` on initial load (reset behavior)
  - State transitions update: augmentation colors, animation blend, speed modifiers, directional indicator
  - Animation speed multipliers: patrolling=1.0, observing=0 (frozen), operating=0 (frozen), avoiding=1.5, idle=0

  **Must NOT do**:
  - Do not add new GLTF animation clips — use existing walk/idle/look-around with speed modulation
  - Do not break the existing patrol route system — extend it
  - Do not create new waypoint arrays — use existing PATROL_ROUTES

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Complex state machine logic with animation blending and timed transitions
  - **Skills**: [`babylonjs-engine`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (with 11, 12, 14)
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 16
  - **Blocked By**: Tasks 2, 6

  **References**:

  **Pattern References**:
  - `src/components/babylon/ArTrackingScene.tsx:315-328` — Current animation transition logic (transitionAnim function, blend weights)
  - `src/components/babylon/ArTrackingScene.tsx:330-360` — Current movement logic (updatePersonMovement, waypoint threshold, speed)
  - `src/stores/ar-tracking-store.ts` — Personnel interface with state field from Task 2

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY)**

  ```
  Scenario: Personnel state machine transitions are visible in the scene
    Tool: Playwright
    Preconditions: Scene running with behavior state machine
    Steps:
      1. Navigate to page
      2. Wait 10 seconds for state transitions
      3. Take screenshot showing personnel in different states
      4. Verify at least 1 personnel is stopped (observing or operating state)
      5. Verify augmentation colors match states (cyan=patrolling, amber=operating, red=avoiding)
    Expected Result: Personnel display different behavior states with matching visual feedback
    Failure Indicators: All personnel walk continuously (no state changes), all same color augmentations
    Evidence: .sisyphus/evidence/task-13-behavior-states.png

  Scenario: Personnel avoids dynamic zone when recipe becomes active
    Tool: Playwright
    Preconditions: Dynamic zone recipe simulation running
    Steps:
      1. Navigate to page
      2. Wait for a dynamic zone to become 'running'
      3. Observe if nearby personnel transitions to 'avoiding' state
      4. Verify personnel reroutes away from zone
      5. Verify scan ring turns red during avoidance
    Expected Result: Personnel near active dynamic zones transition to avoiding state and reroute
    Failure Indicators: Personnel walks through active zone despite avoidance logic
    Evidence: .sisyphus/evidence/task-13-avoidance.png
  ```

  **Commit**: YES (groups with 13)
  - Message: `feat(ar-tracking): behavior-driven animation system`
  - Files: `src/components/babylon/ArTrackingScene.tsx`
  - Pre-commit: `cd equipment-monitor && npx tsc --noEmit`

- [x] 14. Equipment state visual integration

  **What to do**:
  - Wire the equipment state simulation from the store (Task 2) to the holographic equipment models (Task 8):
    1. Read `equipment` array from store each frame
    2. Map each equipment's `state` to its visual properties:
       - `idle`: dim cyan wireframe, emissive 0.06, data panel shows "STANDBY"
       - `warmup`: amber pulsing wireframe, emissive oscillates 0.1→0.3, data panel shows "WARMING UP"
       - `running`: bright green wireframe, emissive 0.18, data panel shows "PROCESSING", steady glow
       - `cooldown`: blue fading wireframe, emissive transitions 0.18→0.06, data panel shows "COOLING DOWN"
    3. Wire recipe state (`recipeStates`) to corresponding equipment states:
       - IMPLANT-BEAM recipe running → Implant bay state = 'running'
       - LITHO-EUV recipe running → Litho bay state = 'running'
       - When recipe transitions to idle → equipment transitions to 'cooldown' for 10s, then 'idle'
    4. Add subtle point light color changes at each bay matching the equipment state color

  **Must NOT do**:
  - Do not create new store fields — use equipment state from Task 2
  - Do not modify the dynamic zone visual logic from Task 7

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: 3D visual integration combining store state with mesh rendering
  - **Skills**: [`babylonjs-engine`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (with 11, 12, 13)
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 16
  - **Blocked By**: Tasks 2, 8

  **References**:

  **Pattern References**:
  - `src/components/babylon/ArTrackingScene.tsx:377-409` — Dynamic zone fade animation pattern (used similarly for state transitions)
  - `src/stores/ar-tracking-store.ts:99-127` — DYNAMIC_ZONES mapping to equipment bays

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY)**

  ```
  Scenario: Equipment state drives visual state changes
    Tool: Playwright
    Preconditions: Scene running with equipment state simulation
    Steps:
      1. Navigate to page
      2. Wait for recipe state to become 'running'
      3. Verify corresponding bay changes from cyan to green (running state)
      4. Wait for recipe to end
      5. Verify bay transitions to blue (cooldown), then back to cyan (idle)
    Expected Result: Equipment wireframe color and data panel text change based on state
    Failure Indicators: No color change, no data panel text change, equipment stays at default state
    Evidence: .sisyphus/evidence/task-14-equipment-state-visual.png
  ```

  **Commit**: YES (groups with 14)
  - Message: `feat(ar-tracking): equipment state visual integration`
  - Files: `src/components/babylon/ArTrackingScene.tsx`
  - Pre-commit: `cd equipment-monitor && npx tsc --noEmit`

- [x] 15. Add SSAO and SSR rendering pipelines

  **What to do**:
  - Add SSAO (Screen Space Ambient Occlusion) and SSR (Screen Space Reflections) to the `createCinematicPipeline` utility:
    1. `SSAO2RenderingPipeline`: add contact shadows in corners and under equipment, subtle depth
       - `totalStrength`: 0.8
       - `radius`: 0.5
       - `samples`: 16
       - `maxZ`: 100
    2. `SSRRenderingPipeline`: add reflections on the dark floor and equipment surfaces
       - `maxSteps`: 64 (moderate quality for 30fps)
       - `step`: 1
       - `enableSmoothReflections`: true
       - `useFresnel`: true
       - `blurDispersionStrength`: 0.3
    3. Both are opt-in via PipelineOptions flags (default: disabled for ArTracking, can be enabled)
    4. Wire them into ArTrackingScene with ENABLED defaults (30fps target allows it)
    5. Ensure SSAO/SSR pipelines work correctly with dual-camera PiP setup (they apply to overview camera only)

  **Must NOT do**:
  - Do not apply SSAO/SSR to the PiP camera (performance concern)
  - Do not modify FabFloorScene.tsx
  - Do not set SSR maxSteps above 128 (performance budget)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Pipeline integration with multi-camera setup requires careful configuration
  - **Skills**: [`babylonjs-engine`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (with 16, 17, 18)
  - **Parallel Group**: Wave 4
  - **Blocks**: Task 16
  - **Blocked By**: Tasks 1, 3

  **References**:

  **Pattern References**:
  - `src/lib/babylon-pipeline.ts` — Shared pipeline utility (created in Task 1) — add SSAO/SSR opt-in options
  - `src/components/babylon/FabFloorScene.tsx:262-273` — Reference pipeline configuration

  **API/Type References**:
  - Babylon.js SSAO2RenderingPipeline: https://doc.babylonjs.com/features/featuresDeepDive/postProcesses/SSAORenderPipeline
  - Babylon.js SSRRenderingPipeline: https://doc.babylonjs.com/features/featuresDeepDive/postProcesses/SSRRenderingPipeline

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY)**

  ```
  Scenario: SSAO and SSR render correctly on main viewport
    Tool: Playwright
    Preconditions: Scene running with full pipeline
    Steps:
      1. Navigate to page
      2. Wait 5 seconds for pipeline initialization
      3. Take screenshot of main viewport
      4. Verify subtle shadow contact under equipment bays (SSAO)
      5. Verify floor reflections are visible (SSR)
      6. Check FPS: evaluate window.__arTrackingFPS
    Expected Result: Scene shows enhanced depth (SSAO shadows in corners) and floor reflections (SSR). FPS ≥ 30.
    Failure Indicators: No visible depth improvement, no reflections, FPS < 30, WebGL errors in console
    Evidence: .sisyphus/evidence/task-15-ssao-ssr.png

  Scenario: SSAO/SSR do not affect PiP viewport
    Tool: Playwright
    Preconditions: PiP open with SSAO/SSR enabled
    Steps:
      1. Navigate to page
      2. Open PiP by double-clicking personnel
      3. Take screenshot showing both viewports
      4. Verify PiP does NOT show SSAO shadow artifacts or SSR reflections
      5. Verify PiP shows scan-line effect (from Task 9) without post-processing artifacts
    Expected Result: PiP shows clean scan-line effect; main viewport shows SSAO+SSR+scan-line-free
    Failure Indicators: PiP shows SSAO shadows, SSR reflections in PiP, double post-processing artifacts
    Evidence: .sisyphus/evidence/task-15-pip-no-ssao.png
  ```

  **Commit**: YES (groups with 15)
  - Message: `feat(ar-tracking): add SSAO and SSR rendering pipelines`
  - Files: `src/lib/babylon-pipeline.ts`, `src/components/babylon/ArTrackingScene.tsx`
  - Pre-commit: `cd equipment-monitor && npx tsc --noEmit`

- [x] 16. FPS measurement and performance tuning

  **What to do**:
  - Verify the FPS target of ≥30 is achievable with all effects enabled:
    1. `window.__arTrackingFPS` is already exposed from Task 3 — verify it works
    2. Add `window.__arTrackingSceneStats` to expose: mesh count, draw calls, active indices, FPS
    3. Test on simulated mid-range hardware (Chrome DevTools throttling: 4x CPU slowdown)
    4. If FPS drops below 30:
       - Reduce SSAO samples from 16 → 8
       - Reduce SSR maxSteps from 64 → 32
       - Reduce GlowLayer `mainTextureFixedSize` from 1024 → 512
       - Reduce grain `intensity` from 3 → 2
    5. If still below 30:
       - Disable SSR entirely (keep SSAO)
       - Reduce shadow detail
    6. Document the final configuration values in a comment at the pipeline setup

  **Must NOT do**:
  - Do not remove features entirely — only degrade gracefully
  - Do not target above 30fps — that's the accepted threshold
  - Do not add third-party performance monitoring libraries

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Performance testing and configuration tuning requires iterative testing
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO — depends on all visual tasks being complete
  - **Parallel Group**: Wave 4 (sequential after W2-3)
  - **Blocks**: Task 18
  - **Blocked By**: All Wave 2-3 tasks

  **References**:

  **Pattern References**:
  - `src/components/babylon/ArTrackingScene.tsx` — Full scene with all effects
  - `src/lib/babylon-pipeline.ts` — Pipeline configuration utility

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY)**

  ```
  Scenario: FPS remains above 30 with all effects
    Tool: Playwright
    Preconditions: All visual effects enabled
    Steps:
      1. Navigate to page
      2. Wait 10 seconds for FPS stabilization
      3. Evaluate window.__arTrackingFPS
      4. Assert value >= 30
      5. Take screenshot showing scene with all effects
    Expected Result: FPS ≥ 30fps consistently
    Failure Indicators: FPS < 30, stuttering, visual glitches
    Evidence: .sisyphus/evidence/task-16-fps-check.txt

  Scenario: Performance stats are accessible
    Tool: Playwright
    Preconditions: Scene running
    Steps:
      1. Evaluate window.__arTrackingSceneStats
      2. Verify it contains mesh count, draw calls, active indices, FPS
    Expected Result: Stats object with numeric values for all fields
    Failure Indicators: undefined, missing fields, NaN values
    Evidence: .sisyphus/evidence/task-16-stats-check.txt
  ```

  **Commit**: YES (groups with 16)
  - Message: `feat(ar-tracking): FPS measurement and performance tuning`
  - Files: `src/components/babylon/ArTrackingScene.tsx`, `src/lib/babylon-pipeline.ts`
  - Pre-commit: `cd equipment-monitor && npx tsc --noEmit`

- [x] 17. Store unit tests — behavior + equipment state

  **What to do**:
  - Write Jest unit tests for the new store logic from Task 2:
    1. `PersonnelState` transitions: test all state machine transitions (idle→patrolling, patrolling→observing, etc.)
    2. `tickPersonnelTimers`: test that timers advance correctly and trigger state transitions
    3. `setPersonnelState`: test state changes persist
    4. `EquipmentState` transitions: test idle→warmup→running→cooldown→idle cycle
    5. `tickEquipmentTimers`: test timer advancement and state transitions
    6. `setEquipmentState`: test state changes persist
    7. Alert severity escalation: test info→warning→critical after timeouts
    8. Zone avoidance: test that personnel near active dynamic zones transition to `avoiding`
  - Follow existing test patterns from `ar-tracking-store.test.ts`
  - All existing tests must continue to pass

  **Must NOT do**:
  - Do not test 3D rendering — test store logic only
  - Do not add new store fields — test existing ones

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Focused unit test writing, no complex logic
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with 15, 16, 18)
  - **Parallel Group**: Wave 4
  - **Blocks**: None
  - **Blocked By**: Task 2

  **References**:

  **Pattern References**:
  - `src/stores/ar-tracking-store.test.ts` — Existing test file with patterns to follow

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY)**

  ```
  Scenario: All store unit tests pass
    Tool: Bash
    Preconditions: Tests written
    Steps:
      1. Run `cd equipment-monitor && npx jest src/stores/ar-tracking-store.test.ts --no-cache --verbose`
    Expected Result: ALL tests pass (new + existing), 0 failures
    Failure Indicators: Any test failure
    Evidence: .sisyphus/evidence/task-17-test-results.txt
  ```

  **Commit**: YES (groups with 17)
  - Message: `test(ar-tracking): add unit tests for behavior and equipment state`
  - Files: `src/stores/ar-tracking-store.test.ts`
  - Pre-commit: `cd equipment-monitor && npx jest src/stores/ar-tracking-store.test.ts --no-cache`

- [x] 18. Full integration QA and visual regression

  **What to do**:
  - Full integration testing of all features working together:
    1. Run `npx tsc --noEmit` to verify TypeScript compilation
    2. Run `npx next build` to verify production build
    3. Run all Playwright visual QA scenarios from Tasks 3-16
    4. Test cross-feature integrations:
       - Personnel behavior state machine + holographic augmentations (color changes match state)
       - Equipment state + holographic equipment models (color changes match state)
       - PiP scan-line + AR overlay (both render properly in PiP)
       - Dynamic zone force-field + alert severity (visual correlation)
       - All 4 personnel in violation simultaneously (GlowLayer over-bloom check)
       - GLB load failure fallback (capsule personnel still render with augmentations)
    5. Test edge cases:
       - Rapid state transitions (flicker check)
       - Dynamic zone disappears while personnel inside (status clears properly)
       - PiP opened/closed rapidly (no memory leak, no render glitch)
       - All 4 personnel in different states simultaneously
    6. Capture final screenshots: overview view, PiP view, zone active view, violation state

  **Must NOT do**:
  - Do not add new features — integration testing only
  - Do not modify source code unless fixing regressions

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Comprehensive testing across all features
  - **Skills**: [`playwright`]
    - Playwright for visual QA screenshots

  **Parallelization**:
  - **Can Run In Parallel**: YES (with 15, 16, 17)
  - **Parallel Group**: Wave 4
  - **Blocks**: Final Verification Wave
  - **Blocked By**: All Wave 2-3 tasks

  **References**:

  **Pattern References**:
  - All QA scenarios from Tasks 3-17 — re-run each one
  - `src/stores/ar-tracking-store.ts` — Store API surface
  - `src/components/babylon/ArTrackingScene.tsx` — Full scene
  - `src/app/mes/ar-tracking/page.tsx` — Full HUD

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY)**

  ```
  Scenario: Full build succeeds with no errors
    Tool: Bash
    Steps:
      1. Run `cd equipment-monitor && npx tsc --noEmit`
      2. Run `cd equipment-monitor && npx next build`
    Expected Result: TypeScript 0 errors, Next.js build SUCCESS
    Failure Indicators: TypeScript errors, build failure
    Evidence: .sisyphus/evidence/task-18-build.txt

  Scenario: All features work together — personnel state + augmentation colors
    Tool: Playwright
    Steps:
      1. Navigate to http://localhost:3000/mes/ar-tracking
      2. Wait 10 seconds for state transitions
      3. Take screenshot
      4. Verify personnel in different states show different augmentation colors
      5. Verify force-field zones are visible
      6. Verify holographic equipment models show state colors
      7. Verify scan-line overlay is subtle but present
    Expected Result: All features working simultaneously — holographic augmentations, force-fields, equipment states, and HUD overlays all visible
    Failure Indicators: Missing features, color mismatches, rendering errors
    Evidence: .sisyphus/evidence/task-18-full-integration.png

  Scenario: Edge case — all 4 personnel in violation simultaneously
    Tool: Playwright
    Steps:
      1. Navigate to page
      2. Use Playwright's `page.evaluate` to set all personnel into violation:
         `await page.evaluate(() => { const store = window.__arTrackingStore; if (store) { store.setPersonnelZoneStatus('OP-01', 'HV-ZONE'); store.setPersonnelZoneStatus('OP-02', 'CHEM-STORE'); store.setPersonnelZoneStatus('OP-03', 'HV-ZONE'); store.setPersonnelZoneStatus('OP-04', 'CHEM-STORE'); } });`
      3. Wait 2 seconds
      4. Take screenshot
      5. Verify no over-bloom (GlowLayer intensity is capped)
      6. Verify all 4 personnel show red augmentation
    Expected Result: 4 simultaneous violations render without visual artifacts or over-bloom
    Failure Indicators: Excessive bloom, rendering artifacts, FPS drop below 30
    Evidence: .sisyphus/evidence/task-18-all-violation.png

  Scenario: Edge case — dynamic zone disappears with personnel inside
    Tool: Playwright
    Steps:
      1. Navigate to page
      2. Wait for dynamic zone to become running (or use `page.evaluate` to force it: `await page.evaluate(() => { const store = window.__arTrackingStore; if (store) { store.setRecipeState('IMPLANT-BEAM', 'running'); } });`)
      3. Wait for personnel to enter zone
      4. Use `page.evaluate` to deactivate zone: `await page.evaluate(() => { const store = window.__arTrackingStore; if (store) { store.setRecipeState('IMPLANT-BEAM', 'idle'); } });`
      5. Wait 3 seconds for fade-out
      6. Verify personnel violation status clears and augmentation colors return to cyan
      7. Verify zone force-field fades out smoothly
    Expected Result: Dynamic zone fades out, personnel status clears to normal, augmentation colors return to cyan
    Failure Indicators: Personnel stuck in violation, zone doesn't fade, visual glitch
    Evidence: .sisyphus/evidence/task-18-zone-disappears.png
  ```

  **Commit**: YES (groups with 18)
  - Message: `chore(ar-tracking): full integration QA and visual regression`
  - Files: None (verification only, only commit if fixes needed) (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.

- [x] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, curl endpoint, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [x] F2. **Code Quality Review** — `unspecified-high`
  Run `tsc --noEmit` + `npx next build`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names (data/result/item/temp).
  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Files [N clean/N issues] | VERDICT`

- [x] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill)
  Start from clean state. Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence. Test cross-task integration (personnel behavior + zone effects, PiP + alerts, equipment state + lighting). Test edge cases: all 4 personnel in violation, dynamic zone disappears while personnel inside, GLB load failure fallback. Save to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [x] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff (git log/diff). Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance. Detect cross-task contamination: Task N touching Task M's files. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

- **Task 1**: `refactor(babylon): extract shared post-processing pipeline config from FabFloorScene`
- **Task 2**: `feat(ar-tracking): add behavior state machine and equipment state to store`
- **Task 3**: `feat(ar-tracking): add DefaultRenderingPipeline and GlowLayer to scene`
- **Task 4**: `feat(ar-tracking): enhance scene lighting and add GridMaterial floor`
- **Task 5**: `feat(ar-tracking): create custom PostProcess scan-line CRT shader`
- **Task 6**: `feat(ar-tracking): add holographic personnel augmentations`
- **Task 7**: `feat(ar-tracking): add zone force-field effects`
- **Task 8**: `feat(ar-tracking): add holographic equipment models`
- **Task 9**: `feat(ar-tracking): integrate scan-line shader into PiP viewport`
- **Task 10**: `feat(ar-tracking): add alert severity levels and escalation`
- **Task 11**: `feat(ar-tracking): add AR content overlay to PiP viewport`
- **Task 12**: `feat(ar-tracking): military command center HUD styling`
- **Task 13**: `feat(ar-tracking): behavior-driven animation system`
- **Task 14**: `feat(ar-tracking): equipment state visual integration`
- **Task 15**: `feat(ar-tracking): add SSAO and SSR rendering pipelines`
- **Task 16**: `feat(ar-tracking): FPS measurement and performance tuning`
- **Task 17**: `test(ar-tracking): add unit tests for behavior and equipment state`
- **Task 18**: `chore(ar-tracking): full integration QA and visual regression`

---

## Success Criteria

### Verification Commands
```bash
cd equipment-monitor && npx tsc --noEmit          # Expected: 0 errors
cd equipment-monitor && npx next build              # Expected: SUCCESS
cd equipment-monitor && npx jest --no-cache          # Expected: ALL PASS
cd equipment-monitor && npx playwright test           # Expected: ALL PASS
```

### Final Checklist
- [x] All "Must Have" present
- [x] All "Must NOT Have" absent
- [x] FPS ≥ 30 on mid-range hardware
- [x] All unit tests pass
- [x] Build succeeds
- [x] Visual QA screenshots captured and verified
