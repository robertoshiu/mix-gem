# Smart Factory War Room — WebGL 3D + Subsystem Expansion

## TL;DR

> **Quick Summary**: Redesign all gauge charts to eliminate overflow, add 4 industrial subsystem monitoring panels (Power, Building Automation, Gas Detection, Fire Alarm), and create a WebGL 3D war room page with interactive factory visualization using React Three Fiber.
> 
> **Deliverables**:
> - Overflow-proof GaugeCard and KpiGaugeCard redesign (larger containers, dynamic scaling)
> - 4 subsystem overlay panels (Power Monitoring, Building Automation, Gas Detection, Fire Alarm)
> - War room 3D scene at `/mes/war-room` with interactive factory zones
> - WebGL replacement for FabFloorMap on `/mes/equipment`
> - Mock data generators and types for all 4 subsystems
> - Zustand war-room store for subsystem state management
> - WebGL detection hook with non-WebGL fallback
> - All changes verified via `next build` and agent-executed QA
> 
> **Estimated Effort**: XL
> **Parallel Execution**: YES - 5 waves
> **Critical Path**: Task 1 (spike) → Task 5 (deps) → Wave 3 (3D + panels) → Wave 4 (integration) → F1-F4

---

## Context

### Original Request
1. All Gauge Chart redesign/optimization/enlargement — numbers still overflow gauges
2. Integrate Power Monitoring/Energy Management subsystem functional screens
3. Integrate Building Automation, Gas Detection, Fire Alarm subsystem functional screens
4. Use WebGL 3D to redesign Smart Factory subsystem war room/command center screens

### Interview Summary
**Key Discussions**:
- **Plan type**: New separate plan (not extending previous mes-ui-reconstruction.md)
- **Subsystem layout**: One war room overview with 4 interactive 3D zones, drill-down via 2D overlay panels
- **War room route**: New page at `/mes/war-room`, existing pages stay as-is
- **3D interactivity**: Full interactive 3D (orbit/zoom/pan, clickable zones, animated data overlays, particles for alerts)
- **Gauge approach**: Complete redesign — larger containers, better scaling, overflow-proof for any numeric value
- **FabFloorMap**: Replace CSS isometric with WebGL 3D on `/mes/equipment`
- **Test strategy**: No automated tests, agent-executed QA only
- **Dark theme**: Keep existing SmartFactory CSS tokens

**Research Findings**:
- **Codebase**: All previous plan components exist (WaferBinMap, HeatmapTable, etc.). GaugeCard has partial overflow fix. KpiGaugeCard has zero overflow protection. FabFloorMap is CSS isometric only. Three.js NOT installed.
- **React 19 + R3F**: R3F v9 needed for React 19 support. Requires compatibility spike before committing.
- **Libraries**: React Three Fiber, @react-three/drei, @react-three/postprocessing recommended.
- **Performance**: frameloop="demand", DPR cap, instancing, WebGL fallback detection all required.
- **Industrial patterns**: 4 subsystems have well-defined data models, KPIs, and visualization patterns.

### Metis Review
**Identified Gaps** (addressed):
- **React 19 + R3F compatibility**: CRITICAL — spike task before implementation (Task 1)
- **Next.js static export + basePath `/mix-gem`**: All 3D components must use `dynamic(ssr:false)`, asset paths must prepend `/mix-gem`
- **KpiGaugeCard has ZERO overflow protection**: Complete redesign needed, not a patch
- **Tailwind v4 config**: New styles via CSS variables in globals.css, not tailwind.config.ts
- **Event propagation**: 3D canvas click must not propagate to overlay panels
- **Alert priority**: Fire > Gas > Power > Building Auto for visual prominence
- **Store pollution**: New `war-room-store.ts` separate from existing stores
- **Non-WebGL fallback**: Must provide CSS isometric fallback or graceful message

---

## Work Objectives

### Core Objective
Create a WebGL 3D Smart Factory war room with interactive subsystem zones (Power, Building Auto, Gas, Fire), fix all gauge overflow issues, and replace the CSS isometric FabFloorMap with WebGL 3D.

### Concrete Deliverables
- `equipment-monitor/src/components/charts/gauge-card.tsx` — Redesigned overflow-proof gauge
- `equipment-monitor/src/components/spc/KpiGaugeCard.tsx` — Redesigned overflow-proof speedometer
- `equipment-monitor/src/lib/war-room-mock-data.ts` — Mock data for 4 subsystems
- `equipment-monitor/src/lib/war-room-types.ts` — Type definitions for 4 subsystems
- `equipment-monitor/src/stores/war-room-store.ts` — Zustand store for war room state
- `equipment-monitor/src/hooks/use-webgl-support.ts` — WebGL detection hook
- `equipment-monitor/src/components/three/` — Directory for all 3D components
- `equipment-monitor/src/components/three/FactoryCanvas.tsx` — Main R3F Canvas wrapper
- `equipment-monitor/src/components/three/FactoryScene.tsx` — 3D scene with subsystem zones
- `equipment-monitor/src/components/three/SubsystemZone.tsx` — Interactive 3D zone component
- `equipment-monitor/src/components/three/WebGLFallback.tsx` — Non-WebGL fallback
- `equipment-monitor/src/components/war-room/SubsystemOverlay.tsx` — Overlay panel container
- `equipment-monitor/src/components/war-room/PowerMonitoringPanel.tsx` — Power monitoring UI
- `equipment-monitor/src/components/war-room/BuildingAutoPanel.tsx` — Building automation UI
- `equipment-monitor/src/components/war-room/GasDetectionPanel.tsx` — Gas detection UI
- `equipment-monitor/src/components/war-room/FireAlarmPanel.tsx` — Fire alarm UI
- `equipment-monitor/src/app/mes/war-room/page.tsx` — War room page route
- `equipment-monitor/src/components/equipment/FabFloorMap.tsx` — Replaced with WebGL version

### Definition of Done
- [ ] `cd equipment-monitor && npm run build` exits 0
- [ ] All gauge values display without overflow for values from -999,999.99 to +999,999.99
- [ ] `/mes/war-room` renders a 3D factory scene with 4 interactive subsystem zones
- [ ] Clicking each 3D zone opens a subsystem overlay panel with gauges, charts, and status
- [ ] `/mes/equipment` FabFloorMap renders as WebGL 3D (with CSS isometric fallback)
- [ ] Non-WebGL browsers show fallback message, not a blank screen
- [ ] OrbitControls work: drag to rotate, scroll to zoom, right-drag to pan
- [ ] Escape key and outside-click close overlay panels
- [ ] MesNavBar includes link to `/mes/war-room`

### Must Have
- GaugeCard and KpiGaugeCard display any value from -999,999.99 to +999,999.99 without text overflow
- All colors use SmartFactory CSS variable tokens (no hardcoded hex)
- All asset paths account for `basePath: '/mix-gem'`
- Static export (`next build`) succeeds with zero errors
- `dynamic(() => import(...), { ssr: false })` for ALL 3D components
- Canvas uses `frameloop="demand"` and `dpr={[1, 2]}`
- Non-WebGL fallback renders when WebGL is unavailable

### Must NOT Have (Guardrails)
- No changes to existing `/mes/spc` page structure or components (except gauge overflow fix)
- No new page routes beyond `/mes/war-room`
- No backend API changes or database schema changes
- No new chart libraries (Recharts only for 2D, Three.js/R3F for 3D)
- No external 3D model files (GLTF/GLB) — procedural geometry only
- No physics, post-processing, or shadow effects (scope inflation)
- No unit test files (agent-executed QA only)
- No breaking changes to existing Zustand store interfaces (add new stores instead)
- No `next.config.ts` modifications beyond `transpilePackages` addition for Three.js

---

## Verification Strategy (MANDATORY)

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: YES (Jest/Vitest test files exist)
- **Automated tests**: NO (per user request)
- **Framework**: None (no new test files)
- **Existing tests**: Leave untouched

### QA Policy
Every task MUST include agent-executed QA scenarios. Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Frontend/3D**: Use Playwright — navigate, interact, assert DOM, screenshot
- **Build verification**: Use Bash — `cd equipment-monitor && npm run build`
- **Asset verification**: Use Bash — check file sizes, paths, references
- **Performance**: Use Bash — Lighthouse CI or `next build` output analysis

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — foundation + spike + gauge fix):
├── Task 1: React 19 + R3F compatibility spike [quick]
├── Task 2: Redesign GaugeCard for overflow-proof display [deep]
├── Task 3: Redesign KpiGaugeCard for overflow-proof display [deep]
├── Task 4: Create war-room mock data generators & types [quick]
└── Task 5: Add SmartFactory CSS tokens for 4 subsystems [quick]

Wave 2 (After Task 1 validates — 3D foundation + overlays, MAX PARALLEL):
├── Task 6: Install Three.js/R3F dependencies + configure next.config.ts [quick]
├── Task 7: Create WebGL detection hook + fallback component [quick]
├── Task 8: Create FactoryCanvas + FactoryScene foundation [deep]
├── Task 9: Build Power Monitoring overlay panel (2D) [unspecified-high]
└── Task 10: Build Building Automation overlay panel (2D) [unspecified-high]

Wave 3 (After Wave 2 — remaining panels + 3D zones):
├── Task 11: Build Gas Detection overlay panel (2D) [unspecified-high]
├── Task 12: Build Fire Alarm overlay panel (2D) [unspecified-high]
├── Task 13: Build 3D subsystem zones (Power, BA, Gas, Fire) [deep]
└── Task 14: Build War Room page route + integration [visual-engineering]

Wave 4 (After Wave 3 — FabFloorMap replacement + final integration):
├── Task 15: Replace FabFloorMap with WebGL version on /mes/equipment [deep]
└── Task 16: Update MesNavBar + wire war-room link [quick]

Wave FINAL (After ALL tasks — 4 parallel reviews):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real manual QA with Playwright (unspecified-high)
└── Task F4: Scope fidelity check (deep)
-> Present results -> Get explicit user okay

Critical Path: Task 1 → Task 6 → Task 8 → Task 14 → Task 15 → F1-F4
Parallel Speedup: ~65% faster than sequential
Max Concurrent: 5 (Wave 1 & 2)
```

### Dependency Matrix

| Task | Depends On | Blocks |
|------|-----------|--------|
| 1 | — | 6, 7, 8 |
| 2 | — | — |
| 3 | — | — |
| 4 | — | 9, 10, 11, 12 |
| 5 | — | 9, 10, 11, 12 |
| 6 | 1 | 8, 13, 14, 15 |
| 7 | 1 | 8, 14, 15 |
| 8 | 6, 7 | 13, 14, 15 |
| 9 | 4, 5 | 14 |
| 10 | 4, 5 | 14 |
| 11 | 4, 5 | 14 |
| 12 | 4, 5 | 14 |
| 13 | 8 | 14 |
| 14 | 8, 9, 10, 11, 12, 13 | 15, 16 |
| 15 | 8, 14 | F1-F4 |
| 16 | 14 | F1-F4 |
| F1-F4 | 15, 16 | — |

### Agent Dispatch Summary

- **Wave 1**: **5** — T1 → `quick`, T2 → `deep`, T3 → `deep`, T4 → `quick`, T5 → `quick`
- **Wave 2**: **5** — T6 → `quick`, T7 → `quick`, T8 → `deep`, T9 → `unspecified-high`, T10 → `unspecified-high`
- **Wave 3**: **4** — T11 → `unspecified-high`, T12 → `unspecified-high`, T13 → `deep`, T14 → `visual-engineering`
- **Wave 4**: **2** — T15 → `deep`, T16 → `quick`
- **FINAL**: **4** — F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high`, F4 → `deep`

---

## TODOs

- [x] 1. **React 19 + R3F Compatibility Spike**

  **What to do**:
  - Create a minimal Next.js page at `equipment-monitor/src/app/mes/webgl-test/page.tsx` that renders a simple 3D box using React Three Fiber
  - Use `dynamic(() => import(...), { ssr: false })` pattern since the project uses `output: 'export'` (static export)
  - Verify it compiles and runs with React 19.2.3 (check peer dependency compatibility)
  - Test that `next build` succeeds with Three.js in the bundle
  - Test that `basePath: '/mix-gem'` doesn't break asset loading
  - Document findings: which R3F version works with React 19, any required polyfills, any Next.js config changes needed
  - If R3F v9 is NOT yet released stable, identify the exact @canary or @rc version that works and document the exact install command
  - Delete the test page after validation (it's a spike, not production code)

  **Must NOT do**:
  - Do NOT install packages globally — only in `equipment-monitor/`
  - Do NOT create a reusable component yet — this is a throwaway spike
  - Do NOT modify any existing pages or components

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Spike/proof-of-concept — narrow scope, single validation goal
  - **Skills**: [`fastapi-patterns`]
    - Not needed — this is frontend 3D work, no backend

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3, 4, 5)
  - **Blocks**: Tasks 6, 7, 8 (all 3D work depends on this validation)
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References** (existing code to follow):
  - `equipment-monitor/next.config.ts` — Current config with `basePath: '/mix-gem'` and `output: 'export'`
  - `equipment-monitor/package.json` — Current dependencies (React 19.2.3, no Three.js yet)
  - `equipment-monitor/src/app/mes/spc/page.tsx` — Example of how MES pages are structured (route pattern, imports, Layout usage)

  **API/Type References** (contracts to implement against):
  - `@react-three/fiber` — Must use version compatible with React 19; check npm for v9 or latest @rc
  - `three` — Core 3D library, must match R3F peer dependency
  - `@react-three/drei` — Helper components (OrbitControls, etc.), must match R3F version

  **External References**:
  - React Three Fiber docs: https://docs.pmnd.rs/react-three-fiber/getting-started/introduction
  - R3F + React 19 compatibility: https://github.com/pmndrs/react-three-fiber/issues (search "React 19")
  - Next.js static export + R3F: `dynamic(() => import('./Scene'), { ssr: false })` pattern

  **WHY Each Reference Matters**:
  - `next.config.ts`: The `output: 'export'` and `basePath` constraints are the hardest parts of R3F integration — they determine dynamic import strategy
  - `package.json`: Must verify exact React version (19.2.3) has compatible R3F version
  - R3F docs: Need canonical setup pattern, not tutorial patterns

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: R3F renders a 3D box in Next.js static export
    Tool: Playwright
    Preconditions: `cd equipment-monitor && npm run build` succeeded; dev server running
    Steps:
      1. Navigate to `http://localhost:3000/mix-gem/mes/webgl-test`
      2. Wait for canvas element to appear (timeout: 10s)
      3. Assert canvas element has width > 0 and height > 0
      4. Screenshot the page
      5. Assert no console errors contain "WebGL" or "Three"
    Expected Result: A 3D box renders on screen, interactive via OrbitControls
    Failure Indicators: Blank page, WebGL context errors, React hydration mismatch
    Evidence: .sisyphus/evidence/task-1-r3f-spike.png

  Scenario: Next.js build succeeds with Three.js in bundle
    Tool: Bash
    Preconditions: All dependencies installed
    Steps:
      1. Run `cd equipment-monitor && npm run build`
      2. Assert exit code 0
      3. Check that `out/mes/webgl-test/index.html` exists in build output
    Expected Result: Build completes with zero errors
    Failure Indicators: Build fails, TypeScript errors, webpack bundle errors
    Evidence: .sisyphus/evidence/task-1-build-success.txt
  ```

  **Commit**: YES (Wave 1 commit)
  - Message: `chore(3d): validate React 19 + R3F compatibility spike`
  - Files: `equipment-monitor/src/app/mes/webgl-test/page.tsx` (spike, delete after)
  - Pre-commit: `cd equipment-monitor && npm run build`

- [x] 2. **Redesign GaugeCard for Overflow-Proof Display**

  **What to do**:
  - Read and understand the current `gauge-card.tsx` implementation thoroughly
  - Identify all places where text overflows: value display, label, unit, percentage
  - **Redesign strategy**: Make the SVG gauge container larger with proper padding; implement dynamic text scaling that shrinks font size based on character count (not just `text-sm` for >6 chars); use `textLength` SVG attribute with `lengthAdjust="spacingAndGlyphs"` for precise fit; add `overflow="hidden"` on SVG text elements as safety net
  - The gauge must display ANY value from -999,999.99 to +999,999.99 without overflow, including units like "kW", "A", "V", "°C", "%"
  - Add a CSS custom property `--gauge-value-color` so subsystem themes can override the value color
  - Use existing SmartFactory CSS tokens (e.g., `var(--sf-surface)`, `var(--sf-text-primary)`) for all colors
  - Increase the overall gauge card size — the current component is too small, causing text to overflow
  - Test with mock values: `-999999.99`, `0`, `1205.0`, `99.99%`, `-0.001`, `1234567kW`

  **Must NOT do**:
  - Do NOT add Three.js/WebGL imports to this component — it stays pure SVG
  - Do NOT change the component's external API (props interface should remain compatible)
  - Do NOT use hardcoded hex colors — only CSS variable tokens
  - Do NOT break existing usages of GaugeCard in other pages

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: CSS/SVG layout redesign requires careful iterative work; overflow-proof rendering is tricky with dynamic values
  - **Skills**: [`ui-ux-pro-max`]
    - `ui-ux-pro-max`: Gauge visualization redesign with proper sizing, scaling, and dark theme colors

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3, 4, 5)
  - **Blocks**: None
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References** (existing code to follow):
  - `equipment-monitor/src/components/charts/gauge-card.tsx` — Current GaugeCard with partial overflow fix (overflow-hidden, max-w-full). Study how the SVG arcs, text positioning, and value labels work
  - `equipment-monitor/src/app/globals.css` — SmartFactory CSS tokens (lines with `--sf-*` variables). Use these for ALL colors
  - `equipment-monitor/src/app/mes/spc/page.tsx` — See how GaugeCard is currently used (what props are passed, what values are displayed)

  **API/Type References** (contracts to implement against):
  - `GaugeCardProps` interface in `gauge-card.tsx` — Must remain compatible (extend, don't break)

  **External References**:
  - SVG `textLength` attribute: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/textLength
  - SVG `lengthAdjust`: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/lengthAdjust

  **WHY Each Reference Matters**:
  - Current gauge-card.tsx: Has the exact overflow bug — need to understand how arc radius, text positioning, and container size relate
  - globals.css: Must use `--sf-*` tokens so subsystem themes can override colors later
  - SVG textLength: The key technique for overflow-proof text rendering — constrains text to exact width

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: GaugeCard displays large values without overflow
    Tool: Playwright
    Preconditions: Dev server running, GaugeCard renders on /mes/spc
    Steps:
      1. Navigate to any page using GaugeCard (e.g., /mes/spc)
      2. Inspect the gauge value display area
      3. Test with values: -999999.99, 1205.0, 99.99%, 1234567kW
      4. For each value, assert that NO text element extends beyond the gauge's SVG container boundary
      5. Screenshot each value
    Expected Result: All values render fully inside the gauge boundary with no text clipping or overflow
    Failure Indicators: Text clipped, text extending beyond the arc, value not fully visible
    Evidence: .sisyphus/evidence/task-2-gauge-large-values.png

  Scenario: GaugeCard displays extreme values (near-zero and negative)
    Tool: Playwright
    Preconditions: Dev server running
    Steps:
      1. Navigate to page with GaugeCard
      2. Test with values: -0.001, 0, 0.01, -100
      3. Assert each value renders visibly with proper sign prefix
      4. Assert gauge arc animates to correct position
    Expected Result: All extreme values display correctly with proper formatting
    Failure Indicators: "0" not visible, minus sign clipped, decimal place wrong
    Evidence: .sisyphus/evidence/task-2-gauge-extreme-values.png

  Scenario: GaugeCard uses SmartFactory CSS tokens (no hardcoded colors)
    Tool: Bash
    Preconditions: Build succeeded
    Steps:
      1. Run `grep -r "#[0-9a-fA-F]\{3,6\}" equipment-monitor/src/components/charts/gauge-card.tsx`
      2. Assert zero matches (no hardcoded hex colors)
      3. Run `grep "var(--sf-" equipment-monitor/src/components/charts/gauge-card.tsx`
      4. Assert multiple matches (using CSS tokens)
    Expected Result: Zero hardcoded hex colors, multiple CSS variable references
    Failure Indicators: Hardcoded colors found in component
    Evidence: .sisyphus/evidence/task-2-gauge-css-tokens.txt
  ```

  **Commit**: YES (Wave 1 commit)
  - Message: `fix(ui): redesign GaugeCard for overflow-proof display with dynamic text scaling`
  - Files: `equipment-monitor/src/components/charts/gauge-card.tsx`
  - Pre-commit: `cd equipment-monitor && npm run build`

- [x] 3. **Redesign KpiGaugeCard for Overflow-Proof Display**

  **What to do**:
  - Read and understand the current `KpiGaugeCard.tsx` implementation thoroughly — it's a speedometer-style gauge with arc, needle, and value display
  - Identify all overflow points: the large centered value text, the min/max labels, the unit label, the KPI title
  - The current `getValueFontSize()` function only switches to `text-sm` for values > 6 chars — this is INSUFFICIENT
  - **Redesign strategy**: Implement continuous font-size scaling based on character count and container width; use SVG `textLength` with `lengthAdjust="spacingAndGlyphs"` as primary overflow prevention; add proper padding around the value text area; make the speedometer arc and needle proportionally sized relative to the text area
  - Must display ANY value from -999,999.99 to +999,999.99 without overflow, with units (kW, A, V, RPM, °C, %)
  - Use existing SmartFactory CSS tokens for all colors (no hardcoded hex)
  - Add `--kpi-value-color` and `--kpi-arc-color` CSS custom properties for subsystem theme overrides
  - Increase overall component size for readability — the speedometer needs more visual space

  **Must NOT do**:
  - Do NOT add Three.js/WebGL imports — stays pure SVG/CSS
  - Do NOT change the KpiGaugeCardProps interface in a breaking way (extend, don't break)
  - Do NOT use hardcoded hex colors
  - Do NOT break existing usages in SPC or other pages

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Speedometer gauge redesign with needle positioning, arc scaling, and dynamic text — complex SVG layout work
  - **Skills**: [`ui-ux-pro-max`]
    - `ui-ux-pro-max`: Complex gauge visualization redesign with circular layout, needle animation, and dark theme

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 4, 5)
  - **Blocks**: None
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References** (existing code to follow):
  - `equipment-monitor/src/components/spc/KpiGaugeCard.tsx` — Current speedometer with inadequate `getValueFontSize()`. Study the SVG arc path calculations, needle rotation math, and text positioning
  - `equipment-monitor/src/components/charts/gauge-card.tsx` — Reference for how the sibling gauge component handles overflow (apply similar patterns here)
  - `equipment-monitor/src/app/globals.css` — SmartFactory CSS tokens to use for ALL colors

  **API/Type References**:
  - `KpiGaugeCardProps` interface in `KpiGaugeCard.tsx` — Must remain compatible

  **External References**:
  - SVG arc path math: https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths
  - SVG `textLength` attribute: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/textLength

  **WHY Each Reference Matters**:
  - KpiGaugeCard.tsx: The exact file with the overflow bug — need to understand arc math and text positioning to fix properly
  - gauge-card.tsx: The redesigned sibling gauge component (from Task 2) — follow same overflow-proof patterns
  - globals.css: CSS tokens for dark theme consistency

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: KpiGaugeCard displays large values without overflow
    Tool: Playwright
    Preconditions: Dev server running
    Steps:
      1. Navigate to page with KpiGaugeCard (e.g., /mes/spc)
      2. Test with values: -999999.99, 1205.0, 99.99%, 1234567kW, -0.001
      3. For each value, assert NO text element extends beyond the speedometer boundary
      4. Assert needle rotates to correct position for each value
      5. Screenshot each value
    Expected Result: All values render fully inside the gauge, needle positions correctly, unit displays properly
    Failure Indicators: Value text clipped, overlapping needle, unit text outside boundary
    Evidence: .sisyphus/evidence/task-3-kpi-large-values.png

  Scenario: KpiGaugeCard uses SmartFactory CSS tokens
    Tool: Bash
    Preconditions: Build succeeded
    Steps:
      1. Run `grep -r "#[0-9a-fA-F]\{3,6\}" equipment-monitor/src/components/spc/KpiGaugeCard.tsx`
      2. Assert zero hardcoded hex colors
      3. Run `grep "var(--sf-" equipment-monitor/src/components/spc/KpiGaugeCard.tsx`
      4. Assert multiple CSS token references
    Expected Result: Zero hardcoded colors, proper CSS variable usage
    Failure Indicators: Any hex color codes found in the component
    Evidence: .sisyphus/evidence/task-3-kpi-css-tokens.txt
  ```

  **Commit**: YES (Wave 1 commit, grouped with Task 2)
  - Message: `fix(ui): redesign KpiGaugeCard for overflow-proof display with dynamic scaling`
  - Files: `equipment-monitor/src/components/spc/KpiGaugeCard.tsx`
  - Pre-commit: `cd equipment-monitor && npm run build`

- [x] 4. **Create War-Room Mock Data Generators & Types**

  **What to do**:
  - Create `equipment-monitor/src/lib/war-room-types.ts` with TypeScript interfaces for all 4 subsystems:
    - `PowerSubsystemData`: voltage (V), current (A), power factor, active power (kW), reactive power (kVAr), energy consumption (kWh), transformer status, load percentage, alarm state
    - `BuildingAutoSubsystemData`: HVAC zones (temperature, humidity, setpoint, mode), lighting zones (brightness, schedule), elevator status, door lock status, energy usage per zone
    - `GasDetectionSubsystemData`: sensor ID, gas type (O2, H2, NH3, CO, etc.), concentration (ppm), threshold levels (low/med/high alarm), sensor status (normal/alarm/fault), location zone
    - `FireAlarmSubsystemData`: detector ID, detector type (smoke/heat/flame/manual), zone, status (normal/alarm/fault), alarm timestamp, suppression system status, evacuation zone
    - `SubsystemZoneType`: union type = 'power' | 'building-auto' | 'gas' | 'fire'
    - `WarRoomState`: active zone, selected subsystem, overlay open/closed, alert states per zone
  - Create `equipment-monitor/src/lib/war-room-mock-data.ts` with realistic mock data generators:
    - Each generator function returns data with realistic ranges and units
    - Include random fluctuation to simulate live data (values change slightly on each call)
    - Include alarm/fault states that trigger at configurable thresholds
    - Export a `generateMockSubsystemData(zone: SubsystemZoneType)` function that returns the appropriate type
    - Export a `generateMockWarRoomState()` function that returns all 4 subsystems' data at once

  **Must NOT do**:
  - Do NOT create Zustand store yet (that's Task 8 territory)
  - Do NOT create UI components
  - Do NOT import any Three.js or R3F modules
  - Do NOT create real API calls or fetch logic

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Pure TypeScript type definitions and mock data generators — well-defined data structure work
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 3, 5)
  - **Blocks**: Tasks 9, 10, 11, 12 (overlay panels need these types)
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References** (existing code to follow):
  - `equipment-monitor/src/lib/mes-types.ts` — Existing type definitions for MES data. Follow the same export pattern, naming conventions, and documentation style
  - `equipment-monitor/src/lib/mock-data.ts` — Existing mock data generators (if exists; if not, follow the pattern from mes-types.ts for type exports)

  **API/Type References**:
  - Industrial standards: IEC 61850 for power monitoring, IEC 60848 for building automation, EN 54 for fire alarm

  **External References**:
  - IEC 61850 power monitoring fields: voltage, current, power factor, active/reactive power
  - Building automation KPIs: HVAC zone control, lighting groups, elevator status
  - Gas detection thresholds: O2 (19.5-23.5% safe), H2 (<1000 ppm safe), NH3 (<25 ppm safe)
  - Fire alarm: EN 54 detector types (smoke, heat, flame, manual call point)

  **WHY Each Reference Matters**:
  - `spc-types.ts`: Establishes the project's TypeScript pattern for typed data structures
  - `mock-data.ts`: Establishes the project's mock data pattern — follow this for consistency
  - Industrial standards: Ensure realistic data ranges so the UI renders meaningful values during development

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Types compile without errors
    Tool: Bash
    Preconditions: TypeScript available
    Steps:
      1. Run `cd equipment-monitor && npx tsc --noEmit src/lib/war-room-types.ts src/lib/war-room-mock-data.ts`
      2. Assert exit code 0
    Expected Result: Zero TypeScript errors
    Failure Indicators: Type errors, missing imports
    Evidence: .sisyphus/evidence/task-4-types-compile.txt

  Scenario: Mock data generators produce valid data
    Tool: Bash
    Preconditions: Node.js available
    Steps:
      1. Run a quick Node script: `npx tsx -e "import { generateMockSubsystemData } from './src/lib/war-room-mock-data'; const d = generateMockSubsystemData('power'); console.log(JSON.stringify(d, null, 2))"`
      2. Assert output contains expected fields: voltage, current, powerFactor, activePower, etc.
      3. Run for each subsystem type: 'power', 'building-auto', 'gas', 'fire'
      4. Assert each returns its specific fields
    Expected Result: All 4 subsystem types return correctly typed data with realistic value ranges
    Failure Indicators: Missing fields, wrong types, values outside realistic ranges
    Evidence: .sisyphus/evidence/task-4-mock-data-output.txt

  Scenario: Build succeeds with new types
    Tool: Bash
    Preconditions: All files saved
    Steps:
      1. Run `cd equipment-monitor && npm run build`
      2. Assert exit code 0
    Expected Result: Build passes with zero errors
    Failure Indicators: TypeScript or bundling errors
    Evidence: .sisyphus/evidence/task-4-build-success.txt
  ```

  **Commit**: YES (Wave 1 commit)
  - Message: `feat(types): add war-room subsystem types and mock data generators`
  - Files: `equipment-monitor/src/lib/war-room-types.ts`, `equipment-monitor/src/lib/war-room-mock-data.ts`
  - Pre-commit: `cd equipment-monitor && npm run build`

- [x] 5. **Add SmartFactory CSS Tokens for 4 Subsystems**

  **What to do**:
  - Edit `equipment-monitor/src/app/globals.css` to add new CSS custom properties under the existing `--sf-*` namespace for 4 subsystem themes:
    - **Power Monitoring** (`--sf-power-*`): Electric blue tones (`--sf-power-primary`, `--sf-power-secondary`, `--sf-power-bg`, `--sf-power-glow`, `--sf-power-warning`, `--sf-power-danger`)
    - **Building Automation** (`--sf-ba-*`): Green/teal tones (same variants)
    - **Gas Detection** (`--sf-gas-*`): Amber/yellow tones (same variants)
    - **Fire Alarm** (`--sf-fire-*`): Red/orange tones (same variants, highest visual priority)
  - Each subsystem gets: primary, secondary, bg, glow, warning, danger tokens
  - Add `--sf-subsystem-border-radius`, `--sf-subsystem-padding`, `--sf-overlay-backdrop` for shared overlay styles
  - Add `--gauge-value-color` and `--kpi-value-color` override variables (default to `--sf-text-primary`)
  - Colors MUST work on dark backgrounds (current SmartFactory dark theme)
  - Fire alarm colors must have highest visual prominence (brightest/warmest)

  **Must NOT do**:
  - Do NOT change any existing `--sf-*` tokens (they're already in use)
  - Do NOT add any hardcoded hex colors in component files (all colors must go through these tokens)
  - Do NOT create a separate CSS file — everything goes in `globals.css`

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: CSS custom property additions — straightforward token definitions
  - **Skills**: [`ui-ux-pro-max`]
    - `ui-ux-pro-max`: Color design for industrial monitoring dark themes with proper contrast ratios

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 3, 4)
  - **Blocks**: Tasks 9, 10, 11, 12 (overlay panels need these tokens)
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References** (existing code to follow):
  - `equipment-monitor/src/app/globals.css` — Existing SmartFactory CSS tokens. Follow the exact naming pattern (`--sf-*`), indentation, and section organization. Add new tokens in a new `/* Subsystem Colors */` section after the existing tokens

  **External References**:
  - WCAG 2.1 contrast ratios for dark mode: https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html
  - Industrial color coding standards: ISA-101 (human machine interfaces)

  **WHY Each Reference Matters**:
  - `globals.css`: Must match the exact token naming pattern and section structure for consistency
  - WCAG contrast: All subsystem colors must be readable on dark backgrounds (#0a0a1a or similar)

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: CSS tokens exist and compile in build
    Tool: Bash
    Preconditions: Files saved
    Steps:
      1. Run `cd equipment-monitor && npm run build`
      2. Assert exit code 0
      3. Run `grep -- '--sf-power-primary\|--sf-ba-primary\|--sf-gas-primary\|--sf-fire-primary' equipment-monitor/src/app/globals.css | wc -l`
      4. Assert count >= 4 (one primary token per subsystem)
    Expected Result: Build passes, all 4 subsystem primary tokens exist in globals.css
    Failure Indicators: Missing tokens, build errors, CSS parse errors
    Evidence: .sisyphus/evidence/task-5-css-tokens.txt

  Scenario: Colors have proper contrast on dark background
    Tool: Playwright
    Preconditions: Dev server running with a test page that uses the new tokens
    Steps:
      1. Navigate to any page using the new tokens
      2. For each subsystem color (--sf-power-primary, --sf-ba-primary, --sf-gas-primary, --sf-fire-primary):
         a. Get computed style value
         b. Calculate contrast ratio against dark background (--sf-bg or similar)
      3. Assert contrast ratio >= 4.5:1 for all primary colors (WCAG AA)
    Expected Result: All subsystem primary colors have sufficient contrast on dark background
    Failure Indicators: Low contrast, colors blend into background
    Evidence: .sisyphus/evidence/task-5-contrast-check.png
  ```

  **Commit**: YES (Wave 1 commit)
  - Message: `feat(tokens): add SmartFactory CSS tokens for 4 subsystem themes`
  - Files: `equipment-monitor/src/app/globals.css`
  - Pre-commit: `cd equipment-monitor && npm run build`

- [x] 6. **Install Three.js/R3F Dependencies + Configure next.config.ts**

  **What to do**:
  - Install the exact Three.js packages validated in Task 1's spike (the versions that work with React 19):
    - `three` (core 3D library)
    - `@react-three/fiber` (React renderer for Three.js)
    - `@react-three/drei` (helper components: OrbitControls, Text, etc.)
    - `@types/three` (TypeScript types)
  - Use the EXACT versions identified in Task 1's spike — if spike found `@react-three/fiber@9.0.0-rc.3` works, install that version
  - Update `equipment-monitor/next.config.ts` to add Three.js packages to `transpilePackages` list:
    ```typescript
    transpilePackages: ['three', '@react-three/fiber', '@react-three/drei']
    ```
  - Verify `npm run build` still passes after dependency additions
  - Verify tree-shaking — check that `next build` output doesn't include unused Three.js modules that bloat the bundle excessively. If Three.js bundle > 500KB gzipped for the war-room page, investigate dynamic imports

  **Must NOT do**:
  - Do NOT install `@react-three/postprocessing` (not in scope — no shadow/physics/bloom effects per guardrails)
  - Do NOT install any GLTF/GLB loaders (`@react-three/drei` already includes `useGLTF` if needed later, but no model files in this plan)
  - Do NOT modify any existing page components (only config changes)
  - Do NOT add Three.js imports to any existing component files

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Dependency installation and config change — mechanical, well-defined
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 7)
  - **Parallel Group**: Wave 2
  - **Blocks**: Tasks 8, 13, 14 (all components that import R3F)
  - **Blocked By**: Task 1 (spike must validate React 19 compatibility first)

  **References**:

  **Pattern References** (existing code to follow):
  - `equipment-monitor/next.config.ts` — Current config. Note the `basePath: '/mix-gem'` and `output: 'export'` — these affect how Three.js assets are resolved
  - `equipment-monitor/package.json` — Current dependency list. The spike from Task 1 will have identified the exact working versions

  **External References**:
  - Next.js `transpilePackages`: https://nextjs.org/docs/app/api-reference/config/next-config-js/transpilePackages
  - R3F installation: https://docs.pmnd.rs/react-three-fiber/getting-started/installation

  **WHY Each Reference Matters**:
  - `next.config.ts`: Must add transpilePackages correctly to avoid "Module not found" errors in static export
  - `package.json`: Must use EXACT versions from Task 1 spike — wrong version = React 19 incompatibility

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Dependencies install and build succeeds
    Tool: Bash
    Preconditions: Task 1 spike completed and validated versions
    Steps:
      1. Run `cd equipment-monitor && npm install` (installs new deps)
      2. Run `cd equipment-monitor && npm run build`
      3. Assert exit code 0
      4. Run `grep '"three"\|"@react-three/fiber"\|"@react-three/drei"\|"@types/three"' equipment-monitor/package.json`
      5. Assert all 4 packages appear
    Expected Result: Build succeeds, all 4 packages in package.json
    Failure Indicators: Build errors, missing packages, React version conflicts
    Evidence: .sisyphus/evidence/task-6-deps-install.txt

  Scenario: Three.js tree-shaking is reasonable
    Tool: Bash
    Preconditions: Build succeeded
    Steps:
      1. Run `cd equipment-monitor && npm run build 2>&1 | grep -i "three\|fiber\|drei"`
      2. Check the build output for war-room page chunk size
      3. If Three.js chunk > 500KB gzipped, document it as a flag
    Expected Result: War-room page chunk with Three.js is under 500KB gzipped (or documented if larger)
    Failure Indicators: Build fails, massive bundle size (>1MB gzipped)
    Evidence: .sisyphus/evidence/task-6-bundle-size.txt
  ```

  **Commit**: YES (Wave 2 commit)
  - Message: `chore(deps): add Three.js and React Three Fiber dependencies`
  - Files: `equipment-monitor/package.json`, `equipment-monitor/package-lock.json`, `equipment-monitor/next.config.ts`
  - Pre-commit: `cd equipment-monitor && npm run build`

- [x] 7. **Create WebGL Detection Hook + Fallback Component**

  **What to do**:
  - Create `equipment-monitor/src/hooks/use-webgl-support.ts`:
    - Custom React hook that detects WebGL support on the client
    - Check for `HTMLCanvasElement.prototype.getContext('webgl2')` first, fallback to `'webgl'`
    - Also check for `WEBGL_debug_renderer_info` extension to detect software renderers (flag as reduced capability)
    - Return: `{ supported: boolean, version: 'webgl' | 'webgl2' | null, isSoftwareRenderer: boolean }`
    - Use `useMemo` to avoid re-running detection, cache result
    - Handle SSR gracefully — return `{ supported: false, version: null, isSoftwareRenderer: false }` during SSR
  - Create `equipment-monitor/src/components/three/WebGLFallback.tsx`:
    - Non-WebGL fallback component that renders a styled message card
    - Message: "WebGL is required for 3D visualization. Please use a modern browser or enable hardware acceleration."
    - Use SmartFactory CSS tokens for styling (dark theme)
    - Include a "View 2D Version" link that could navigate to an alternative (just a `#` placeholder for now)
    - Make it accessible: proper ARIA labels, keyboard navigable

  **Must NOT do**:
  - Do NOT import any Three.js or R3F modules in these files
  - Do NOT use `window` directly without SSR guard
  - Do NOT create a CSS isometric fallback implementation (that's a placeholder link only)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Small utility hook + simple fallback component — well-defined, narrow scope
  - **Skills**: [`ui-ux-pro-max`]
    - `ui-ux-pro-max`: Styled error/fallback component with accessibility

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 6)
  - **Parallel Group**: Wave 2
  - **Blocks**: Tasks 8 (FactoryCanvas uses this hook), 14 (war-room page uses fallback), 15 (FabFloorMap uses this hook)
  - **Blocked By**: Task 1 (spike must validate approach first)

  **References**:

  **Pattern References** (existing code to follow):
  - `equipment-monitor/src/hooks/` — Look at existing hooks for naming conventions, export patterns, and JSDoc style. If no hooks directory exists, create it following the `src/lib/` pattern

  **External References**:
  - WebGL detection best practice: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/By_example/Detect_WebGL
  - Next.js SSR-safe hooks pattern: `typeof window !== 'undefined'` guard or `useEffect` for client-only code

  **WHY Each Reference Matters**:
  - Hooks directory: Must match project conventions for new utility hooks
  - WebGL detection: Critical for graceful degradation — must handle both WebGL1-only devices and software-renderers

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Hook detects WebGL correctly on supported browser
    Tool: Playwright
    Preconditions: Dev server running
    Steps:
      1. Create a temporary test page that renders `useWebGLSupport()` result
      2. Navigate to the test page
      3. Assert `supported` is `true` for Chrome/Chromium
      4. Assert `version` is `'webgl2'`
      5. Assert `isSoftwareRenderer` is `false`
    Expected Result: Hook correctly detects WebGL2 support in a real browser
    Failure Indicators: Returns `supported: false` on WebGL-capable browser, or crashes during SSR
    Evidence: .sisyphus/evidence/task-7-webgl-detection.png

  Scenario: Fallback component renders correctly
    Tool: Playwright
    Preconditions: Dev server running
    Steps:
      1. Create a temporary test page that renders `<WebGLFallback />`
      2. Navigate to the test page
      3. Assert fallback message text is visible
      4. Assert "View 2D Version" link exists
      5. Assert component uses SmartFactory dark theme tokens
    Expected Result: Fallback renders styled message with link
    Failure Indicators: Unstyled content, missing text, broken layout
    Evidence: .sisyphus/evidence/task-7-fallback-render.png
  ```

  **Commit**: YES (Wave 2 commit)
  - Message: `feat(3d): add WebGL detection hook and fallback component`
  - Files: `equipment-monitor/src/hooks/use-webgl-support.ts`, `equipment-monitor/src/components/three/WebGLFallback.tsx`
  - Pre-commit: `cd equipment-monitor && npm run build`

- [x] 8. **Create FactoryCanvas + FactoryScene Foundation**

  **What to do**:
  - **Create `equipment-monitor/src/components/three/FactoryCanvas.tsx`**:
    - Main React Three Fiber Canvas wrapper component
    - MUST use `dynamic(() => import(...), { ssr: false })` pattern for Next.js static export compatibility
    - Canvas props: `frameloop="demand"` for performance, `dpr={[1, 2]}` for DPR capping, `gl={{ antialias: true, alpha: false }}`
    - Canvas background color: `var(--sf-bg)` (dark theme background)
    - Wrap in error boundary that renders `<WebGLFallback />` on WebGL errors
    - Accept `children` prop for composing scene elements
    - Accept `className` prop for layout sizing (parent must set explicit width/height)
    - Add `<Suspense fallback={<LoadingSpinner />}>` around children for async 3D assets
  - Create `equipment-monitor/src/components/three/FactoryScene.tsx`:
    - The main 3D scene component rendered inside FactoryCanvas
    - Lighting: `<ambientLight intensity={0.4} />` + `<directionalLight intensity={0.8} position={[10, 10, 5]} />` (industrial lighting)
    - Camera: perspective, positioned at `[20, 20, 20]` looking at origin, fov 50
    - `<OrbitControls>` from drei: enable rotate, zoom, pan. Set `minDistance={5}`, `maxDistance={80}`, `maxPolarAngle={Math.PI / 2}` (no going underground)
    - Layout: 4 zone placeholders arranged in a grid (2×2) — Power (front-left), Building Auto (front-right), Gas Detection (back-left), Fire Alarm (back-right)
    - Each zone is a subtle floor plane (`<mesh rotation={[-Math.PI/2, 0, 0]}>`) with colored border glow matching its subsystem token
    - Center area: subtle factory building outline (procedural geometry, no GLTF)
    - Grid helper on the floor for spatial reference
    - Use `useFrame` for demand-based animation loop — no unnecessary continuous rendering

  **Must NOT do**:
  - Do NOT import Three.js directly — always use R3F JSX primitives (`<mesh>`, `<boxGeometry>`, etc.)
  - Do NOT load any GLTF/GLB models — procedural geometry only
  - Do NOT add post-processing (no bloom, no SSAO, no shadows)
  - Do NOT add physics or collision detection
  - Do NOT use `frameloop="always"` — must be `"demand"`

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Core 3D scene setup with lighting, camera, controls, and zone layout — foundational for all 3D work, needs careful implementation
  - **Skills**: [`ui-ux-pro-max`]
    - `ui-ux-pro-max`: 3D scene composition with proper lighting and dark theme integration

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on Tasks 6 and 7)
  - **Parallel Group**: Wave 2 (sequential after T6, T7)
  - **Blocks**: Tasks 13 (SubsystemZone uses FactoryScene), 14 (war-room page renders FactoryCanvas), 15 (FabFloorMap uses FactoryCanvas)
  - **Blocked By**: Task 6 (need Three.js packages installed), Task 7 (need WebGL hook and fallback)

  **References**:

  **Pattern References** (existing code to follow):
  - `equipment-monitor/src/app/mes/spc/page.tsx` — See how MES pages are structured. War-room page will follow similar pattern with `dynamic(() => import(...), { ssr: false })` for the 3D component
  - `equipment-monitor/src/app/globals.css` — SmartFactory dark theme tokens. Use `--sf-bg` for canvas background, `--sf-surface` for zone floors

  **API/Type References**:
  - `@react-three/fiber` Canvas component API: https://docs.pmnd.rs/react-three-fiber/api/canvas
  - `@react-three/drei` OrbitControls: https://docs.pmnd.rs/drei/controls/orbit-controls

  **External References**:
  - R3F performance best practices: https://docs.pmnd.rs/react-three-fiber/advanced/scaling-performance
  - `frameloop="demand"`: https://docs.pmnd.rs/react-three-fiber/api/canvas#frameloop

  **WHY Each Reference Matters**:
  - SPC page pattern: Must follow the same dynamic import pattern for Next.js static export
  - Canvas API props: `frameloop` and `dpr` directly affect performance — wrong settings = battery drain
  - Performance docs: Demand rendering is critical — this is an industrial dashboard, not a game

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: FactoryCanvas renders the 3D scene without errors
    Tool: Playwright
    Preconditions: Dev server running, dependencies installed (Task 6)
    Steps:
      1. Create a temporary test page that imports FactoryCanvas with `dynamic(ssr:false)`
      2. Navigate to the test page
      3. Wait for canvas element to appear (timeout: 15s)
      4. Assert canvas element has non-zero dimensions
      5. Screenshot the scene
      6. Check browser console for errors
    Expected Result: 3D scene renders with 4 colored zone floor planes, lighting, and orbit controls
    Failure Indicators: Blank canvas, WebGL errors, Three.js errors in console, missing zones
    Evidence: .sisyphus/evidence/task-8-factory-canvas.png

  Scenario: OrbitControls work for rotate, zoom, pan
    Tool: Playwright
    Preconditions: FactoryCanvas renders
    Steps:
      1. Navigate to the test page with FactoryCanvas
      2. Click on canvas and drag (rotate)
      3. Use mouse wheel (zoom)
      4. Right-click and drag (pan)
      5. Assert camera position changes after each interaction
    Expected Result: All three orbit control modes work correctly
    Failure Indicators: No response to mouse input, camera stuck at initial position
    Evidence: .sisyphus/evidence/task-8-orbit-controls.png

  Scenario: FactoryCanvas shows WebGL fallback when WebGL is unavailable
    Tool: Playwright
    Preconditions: WebGL can be disabled in test browser
    Steps:
      1. Launch browser with WebGL disabled (Chrome flags: --disable-webgl)
      2. Navigate to test page with FactoryCanvas
      3. Assert <WebGLFallback /> renders instead of canvas
      4. Assert fallback message is visible
    Expected Result: Fallback component renders with helpful message, no blank screen
    Failure Indicators: Blank page, error in console, no fallback message
    Evidence: .sisyphus/evidence/task-8-webgl-fallback.png

  Scenario: Static export build succeeds with Three.js components
    Tool: Bash
    Preconditions: All Three.js files saved
    Steps:
      1. Run `cd equipment-monitor && npm run build`
      2. Assert exit code 0
    Expected Result: Build completes without errors
    Failure Indicators: Webpack bundle errors, SSR failures, missing module errors
    Evidence: .sisyphus/evidence/task-8-build.txt
  ```

  **Commit**: YES (Wave 2 commit)
  - Message: `feat(3d): add FactoryCanvas and FactoryScene foundation components`
  - Files: `equipment-monitor/src/components/three/FactoryCanvas.tsx`, `equipment-monitor/src/components/three/FactoryScene.tsx`
  - Pre-commit: `cd equipment-monitor && npm run build`

- [x] 9. **Build Power Monitoring Overlay Panel (2D)**

  **What to do**:
  - Create `equipment-monitor/src/components/war-room/PowerMonitoringPanel.tsx`
  - This is a 2D overlay panel that appears when user clicks the Power zone in the 3D scene
  - Panel layout (vertical stack):
    - **Header**: Zone name "電力監控 / Power Monitoring" with status indicator (green/yellow/red)
    - **KPI Row**: 4 key metrics in a flex row — Active Power (kW), Voltage (V), Current (A), Power factor
    - **Gauge Grid**: 2×2 grid of GaugeCards showing voltage, current, power factor, load percentage
    - **Trend Sparkline**: Mini line chart showing power consumption trend (last 24h mock data)
    - **Transformer Status**: Status cards for 2 transformers (online/offline/alarm)
    - **Alarm List**: Scrollable list of recent power alarms (max 5 items)
  - Use SmartFactory CSS tokens (`--sf-power-*` tokens from Task 5)
  - Use redesigned `GaugeCard` from Task 2 for gauges (import from `charts/gauge-card`)
  - Use Recharts `<LineChart>` for sparkline (existing dependency)
  - Data comes from `war-room-mock-data.ts` (Task 4) via Zustand store (Task 8)
  - Panel should animate in from the right side (CSS transition)
  - Close button (×) + Escape key closes the panel
  - Click outside panel on canvas closes the panel
  - Panel width: ~40% of viewport, max-width 480px, positioned on the right side
  - Semi-transparent backdrop behind panel (z-index management with Three.js canvas)

  **Must NOT do**:
  - Do NOT add Three.js imports — this is a pure 2D React component
  - Do NOT hardcode hex colors — use `--sf-power-*` CSS tokens
  - Do NOT create a separate route/page for this — it's an overlay only
  - Do NOT add API fetch calls — use mock data only

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Complex 2D dashboard panel with gauges, charts, status cards, alarm list — multiple UI subsystems
  - **Skills**: [`ui-ux-pro-max`]
    - `ui-ux-pro-max`: Dashboard panel design with dark theme, gauges, charts, alarm indicators

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 10, Tasks 11-12 later can follow same pattern)
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 14 (war-room page integrates this panel)
  - **Blocked By**: Task 4 (needs types), Task 5 (needs CSS tokens), Task 2 (needs redesigned GaugeCard)

  **References**:

  **Pattern References** (existing code to follow):
  - `equipment-monitor/src/components/charts/gauge-card.tsx` — Redesigned GaugeCard from Task 2. Use this for the 4 gauge components in the KPI grid
  - `equipment-monitor/src/app/mes/spc/page.tsx` — See how existing dashboard panels are structured — layout, sizing, grid patterns
  - `equipment-monitor/src/components/spc/FooterStatusBar.tsx` — Pattern for status indicator (green/yellow/red) styling

  **API/Type References** (contracts to implement against):
  - `equipment-monitor/src/lib/war-room-types.ts` — `PowerSubsystemData` interface for all data fields
  - `equipment-monitor/src/lib/war-room-mock-data.ts` — `generateMockSubsystemData('power')` for sample data

  **External References**:
  - Recharts LineChart: https://recharts.org/en-US/api/LineChart
  - CSS backdrop-filter for overlay: https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter

  **WHY Each Reference Matters**:
  - GaugeCard: Must use the redesigned version for overflow-proof display
  - SPC page: Pattern for how MES dashboard panels are structured in this project
  - FooterStatusBar: Pattern for status indicators — reuse this pattern for transformer status

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Power panel renders with all sections
    Tool: Playwright
    Preconditions: Dev server running, panel component available
    Steps:
      1. Create a test route that renders `<PowerMonitoringPanel data={mockData} onClose={() => {}} />`
      2. Navigate to test route
      3. Assert header text contains "Power Monitoring" or "電力監控"
      4. Assert 4 GaugeCards are visible (voltage, current, power factor, load)
      5. Assert sparkline chart is visible
      6. Assert transformer status cards are visible
      7. Assert alarm list section is visible
      8. Screenshot the panel
    Expected Result: All 6 sections render correctly with mock data
    Failure Indicators: Missing sections, broken layout, gauges overflow, chart errors
    Evidence: .sisyphus/evidence/task-9-power-panel.png

  Scenario: Panel uses SmartFactory CSS tokens (no hardcoded colors)
    Tool: Bash
    Preconditions: Build succeeded
    Steps:
      1. Run `grep -rn "#[0-9a-fA-F]\{3,6\}" equipment-monitor/src/components/war-room/PowerMonitoringPanel.tsx`
      2. Assert zero matches (no hardcoded hex)
      3. Run `grep "var(--sf-power-\|var(--sf-surface\|var(--sf-text\|var(--sf-bg" equipment-monitor/src/components/war-room/PowerMonitoringPanel.tsx`
      4. Assert multiple CSS token references
    Expected Result: Zero hardcoded hex colors, multiple SmartFactory token references
    Failure Indicators: Hardcoded color values found
    Evidence: .sisyphus/evidence/task-9-power-tokens.txt

  Scenario: Close button and Escape key dismiss the panel
    Tool: Playwright
    Preconditions: Panel is open
    Steps:
      1. Render the panel
      2. Click the close (×) button
      3. Assert panel is no longer visible
      4. Re-open the panel
      5. Press Escape key
      6. Assert panel is no longer visible
    Expected Result: Panel closes via both close button and Escape key
    Failure Indicators: Panel stays open after close actions
    Evidence: .sisyphus/evidence/task-9-panel-close.png
  ```

  **Commit**: YES (Wave 2 commit, grouped with T10)
  - Message: `feat(war-room): add Power Monitoring overlay panel`
  - Files: `equipment-monitor/src/components/war-room/PowerMonitoringPanel.tsx`
  - Pre-commit: `cd equipment-monitor && npm run build`

- [x] 10. **Build Building Automation Overlay Panel (2D)**

  **What to do**:
  - Create `equipment-monitor/src/components/war-room/BuildingAutoPanel.tsx`
  - This is a 2D overlay panel for the Building Automation subsystem (appears when clicking BA zone in 3D)
  - Panel layout (vertical stack):
    - **Header**: Zone name "樓宇自動化 / Building Automation" with status indicator
    - **KPI Row**: 3 key metrics — HVAC zones active, lighting groups, energy usage (kWh)
    - **HVAC Grid**: Cards for 4 HVAC zones showing current temp, setpoint, humidity, mode (heating/cooling/auto)
    - **Lighting Status**: Grid of lighting zone statuses (on/off/scheduled) with brightness percentages
    - **Elevator Status**: 2 elevator status cards (running/maintenance/fault)
    - **Alarm List**: Recent BA alarms (max 5)
  - Use SmartFactory CSS tokens (`--sf-ba-*` tokens from Task 5)
  - Use redesigned `GaugeCard` from Task 2 for KPI metrics
  - Data comes from mock data generators (Task 4)
  - Same animation, close, and backdrop patterns as PowerMonitoringPanel (Task 9)
  - Extract shared overlay behavior into a reusable pattern (but NOT a separate abstract component — just copy the animation/close CSS)

  **Must NOT do**:
  - Do NOT create an abstract `OverlayPanel` component — each panel is self-contained
  - Do NOT add Three.js imports
  - Do NOT hardcode hex colors — use `--sf-ba-*` CSS tokens
  - Do NOT create a separate route — overlay only

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Complex 2D dashboard panel, similar pattern to Task 9 but with different data sections
  - **Skills**: [`ui-ux-pro-max`]
    - `ui-ux-pro-max`: Building automation dashboard with HVAC cards, lighting grid, status indicators

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 9)
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 14
  - **Blocked By**: Task 4 (types), Task 5 (CSS tokens), Task 2 (GaugeCard)

  **References**:

  **Pattern References** (existing code to follow):
  - `equipment-monitor/src/components/war-room/PowerMonitoringPanel.tsx` — Task 9's panel. Follow the same overlay animation pattern, close button, Escape key handling, and layout structure for consistency
  - `equipment-monitor/src/components/charts/gauge-card.tsx` — Redesigned GaugeCard for KPI metrics
  - `equipment-monitor/src/app/globals.css` — `--sf-ba-*` tokens for Building Automation theme

  **API/Type References**:
  - `equipment-monitor/src/lib/war-room-types.ts` — `BuildingAutoSubsystemData` interface
  - `equipment-monitor/src/lib/war-room-mock-data.ts` — `generateMockSubsystemData('building-auto')`

  **WHY Each Reference Matters**:
  - PowerMonitoringPanel: Must follow the same overlay pattern for visual consistency across all 4 panels
  - CSS tokens: Each subsystem has its own color theme — BA uses green/teal

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Building Automation panel renders with all sections
    Tool: Playwright
    Preconditions: Dev server running
    Steps:
      1. Create test route rendering `<BuildingAutoPanel data={mockData} onClose={() => {}} />`
      2. Navigate to test route
      3. Assert header contains "Building Automation" or "樓宇自動化"
      4. Assert HVAC zone cards are visible (4 zones)
      5. Assert lighting status grid is visible
      6. Assert elevator status cards are visible
      7. Assert alarm list is visible
      8. Screenshot the panel
    Expected Result: All sections render with green/teal theme using --sf-ba-* tokens
    Failure Indicators: Missing sections, wrong colors, broken layout
    Evidence: .sisyphus/evidence/task-10-ba-panel.png

  Scenario: Panel uses BA theme CSS tokens (no hardcoded colors)
    Tool: Bash
    Preconditions: Build succeeded
    Steps:
      1. Run `grep -rn "#[0-9a-fA-F]\{3,6\}" equipment-monitor/src/components/war-room/BuildingAutoPanel.tsx`
      2. Assert zero matches
      3. Run `grep "var(--sf-ba-" equipment-monitor/src/components/war-room/BuildingAutoPanel.tsx`
      4. Assert multiple BA token references
    Expected Result: Only CSS variable references, no hardcoded hex colors
    Failure Indicators: Any hardcoded hex found
    Evidence: .sisyphus/evidence/task-10-ba-tokens.txt

  Scenario: Close actions work (button + Escape)
    Tool: Playwright
    Preconditions: Panel is open
    Steps:
      1. Render panel
      2. Click close button → assert panel disappears
      3. Re-open → press Escape → assert panel disappears
    Expected Result: Both close mechanisms work
    Failure Indicators: Panel remains visible after close actions
    Evidence: .sisyphus/evidence/task-10-ba-close.png
  ```

  **Commit**: YES (Wave 2 commit, grouped with T9)
  - Message: `feat(war-room): add Building Automation overlay panel`
  - Files: `equipment-monitor/src/components/war-room/BuildingAutoPanel.tsx`
  - Pre-commit: `cd equipment-monitor && npm run build`

- [x] 11. **Build Gas Detection Overlay Panel (2D)**

  **What to do**:
  - Create `equipment-monitor/src/components/war-room/GasDetectionPanel.tsx`
  - 2D overlay panel for the Gas Detection subsystem (appears when clicking Gas zone in 3D)
  - Panel layout (vertical stack):
    - **Header**: Zone name "気體偵測 / Gas Detection" with status indicator (uses `--sf-gas-*` amber/yellow theme)
    - **Overall Status Banner**: Large banner showing overall gas safety status (SAFE / WARNING / DANGER) with corresponding color
    - **Sensor Grid**: 2×3 grid of sensor cards, each showing: gas type (O2, H2, NH3, CO, etc.), concentration (ppm or %), threshold bar (visual indicator of how close to alarm threshold), status icon (●normal / ▲alarm / ✕fault)
    - **Threshold Reference**: Collapsible section showing alarm thresholds per gas type (low alarm, high alarm, STEL, TWA values)
    - **Zone Map**: Simplified 2D floor plan showing sensor positions with color-coded status dots
    - **Alarm List**: Recent gas detection alarms (max 5), sorted by severity
  - Use SmartFactory CSS tokens (`--sf-gas-*` tokens from Task 5)
  - Use redesigned `GaugeCard` from Task 2 for concentration displays
  - Same overlay animation, close, and backdrop patterns as Tasks 9-10
  - **Alert priority**: Gas detection alarms should be visually prominent (amber glow on alarm cards)

  **Must NOT do**:
  - Do NOT add Three.js imports — pure 2D React component
  - Do NOT hardcode hex colors — use `--sf-gas-*` CSS tokens
  - Do NOT create a separate route/page
  - Do NOT add real sensor data fetching — mock data only

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Complex panel with sensor grid, threshold bars, zone map — unique data visualization
  - **Skills**: [`ui-ux-pro-max`]
    - `ui-ux-pro-max`: Safety-critical dashboard design with color-coded alarm states and threshold visualizations

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 12)
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 14
  - **Blocked By**: Task 4 (types), Task 5 (CSS tokens), Task 2 (GaugeCard)

  **References**:

  **Pattern References** (existing code to follow):
  - `equipment-monitor/src/components/war-room/PowerMonitoringPanel.tsx` — Task 9's panel. Follow the same overlay pattern, animation, close behavior, and section structure
  - `equipment-monitor/src/components/charts/gauge-card.tsx` — Redesigned GaugeCard for concentration displays
  - `equipment-monitor/src/components/spc/FooterStatusBar.tsx` — Status indicator pattern for alarm states

  **API/Type References**:
  - `equipment-monitor/src/lib/war-room-types.ts` — `GasDetectionSubsystemData` interface (sensor ID, gas type, concentration, thresholds)
  - `equipment-monitor/src/lib/war-room-mock-data.ts` — `generateMockSubsystemData('gas')`

  **External References**:
  - Gas detection thresholds: O2 (19.5-23.5% safe), H2 (<1000 ppm), NH3 (<25 ppm), CO (<35 ppm)
  - ISA-101 alarm management: color coding for severity levels

  **WHY Each Reference Matters**:
  - PowerMonitoringPanel: Consistent overlay pattern — all 4 panels must share the same UX for close/animate
  - FooterStatusBar: Alarm state color coding pattern — reuse for gas sensor status icons
  - Threshold reference: Must use realistic industry values so the UI renders meaningful data

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Gas Detection panel renders with all sections
    Tool: Playwright
    Preconditions: Dev server running
    Steps:
      1. Create test route rendering `<GasDetectionPanel data={mockData} onClose={() => {}} />`
      2. Navigate to test route
      3. Assert header contains "Gas Detection" or "気體偵測"
      4. Assert overall status banner is visible (SAFE/WARNING/DANGER)
      5. Assert sensor grid shows 6 sensor cards
      6. Assert threshold reference section exists
      7. Assert alarm list is visible
      8. Screenshot the panel
    Expected Result: All sections render with amber/yellow theme using --sf-gas-* tokens
    Failure Indicators: Missing sections, wrong theme colors, broken layout
    Evidence: .sisyphus/evidence/task-11-gas-panel.png

  Scenario: Gas panel uses theme CSS tokens (no hardcoded colors)
    Tool: Bash
    Preconditions: Build succeeded
    Steps:
      1. Run `grep -rn "#[0-9a-fA-F]\{3,6\}" equipment-monitor/src/components/war-room/GasDetectionPanel.tsx`
      2. Assert zero matches
      3. Run `grep "var(--sf-gas-" equipment-monitor/src/components/war-room/GasDetectionPanel.tsx`
      4. Assert multiple gas theme token references
    Expected Result: Only CSS variable references, no hardcoded hex
    Failure Indicators: Hardcoded hex colors found
    Evidence: .sisyphus/evidence/task-11-gas-tokens.txt

  Scenario: Close actions work (button + Escape)
    Tool: Playwright
    Steps:
      1. Render panel → click close → assert panel hidden
      2. Re-open → press Escape → assert panel hidden
    Expected Result: Both close mechanisms work identically to other panels
    Failure Indicators: Panel remains visible after close actions
    Evidence: .sisyphus/evidence/task-11-gas-close.png
  ```

  **Commit**: YES (Wave 3 commit, grouped with T12)
  - Message: `feat(war-room): add Gas Detection overlay panel`
  - Files: `equipment-monitor/src/components/war-room/GasDetectionPanel.tsx`
  - Pre-commit: `cd equipment-monitor && npm run build`

- [x] 12. **Build Fire Alarm Overlay Panel (2D)**

  **What to do**:
  - Create `equipment-monitor/src/components/war-room/FireAlarmPanel.tsx`
  - 2D overlay panel for the Fire Alarm subsystem (appears when clicking Fire zone in 3D)
  - Panel layout (vertical stack):
    - **Header**: Zone name "火災警報 / Fire Alarm" with status indicator (uses `--sf-fire-*` red/orange theme — HIGHEST visual priority among all 4 subsystems)
    - **Emergency Status Banner**: Large banner showing overall fire status (NORMAL / ALERT / EVACUATE) with pulsing animation on ALERT/EVACUATE states — red glow animation using `--sf-fire-danger`
    - **Detector Grid**: 2×3 grid of detector cards: detector ID, detector type (smoke/heat/flame/manual), zone, status (●normal / ▲alarm / ✕fault), last test date
    - **Zone Status Map**: Simplified floor plan showing fire zones with color-coded overlay (green=safe, amber=alert, red=alarm)
    - **Suppression System**: Status cards for suppression systems (sprinkler, gas suppression) — armed/discharged/fault
    - **Evacuation Status**: Current evacuation zone status, area occupancy (if available from mock data)
    - **Alarm Timeline**: Chronological list of fire events (most recent first, max 10 items)
  - Use SmartFactory CSS tokens (`--sf-fire-*` tokens from Task 5)
  - **Alert priority**: Fire alarm visual prominence must be HIGHEST — red pulsing on alarm, larger alarm cards, bold status text
  - Same overlay animation, close, and backdrop patterns as Tasks 9-11

  **Must NOT do**:
  - Do NOT add Three.js imports — pure 2D React component
  - Do NOT hardcode hex colors — use `--sf-fire-*` CSS tokens exclusively
  - Do NOT create a separate route/page
  - Do NOT add real alarm system integration — mock data only

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Safety-critical alarm panel with highest visual priority requirements, pulsing animations, and complex status grid
  - **Skills**: [`ui-ux-pro-max`]
    - `ui-ux-pro-max`: Emergency/safety-critical UI design with alarm animations and high-contrast dark theme

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 11)
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 14
  - **Blocked By**: Task 4 (types), Task 5 (CSS tokens), Task 2 (GaugeCard)

  **References**:

  **Pattern References** (existing code to follow):
  - `equipment-monitor/src/components/war-room/PowerMonitoringPanel.tsx` — Task 9's panel. Same overlay pattern for consistency
  - `equipment-monitor/src/components/charts/gauge-card.tsx` — Redesigned GaugeCard
  - `equipment-monitor/src/components/spc/FooterStatusBar.tsx` — Alarm state indicator pattern

  **API/Type References**:
  - `equipment-monitor/src/lib/war-room-types.ts` — `FireAlarmSubsystemData` interface
  - `equipment-monitor/src/lib/war-room-mock-data.ts` — `generateMockSubsystemData('fire')`

  **External References**:
  - EN 54 fire alarm standard: detector types (smoke, heat, flame, manual call point)
  - NFPA 72: fire alarm notification appliances and zoning

  **WHY Each Reference Matters**:
  - PowerMonitoringPanel: Must follow same overlay UX pattern for consistency
  - Fire alarm standards: Must use correct terminology and detector types for realistic UI
  - Alert priority requirement: Fire panel must be visually more prominent than other 3 panels

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Fire Alarm panel renders with all sections and highest visual priority
    Tool: Playwright
    Preconditions: Dev server running
    Steps:
      1. Create test route rendering `<FireAlarmPanel data={mockData} onClose={() => {}} />`
      2. Navigate to test route
      3. Assert header contains "Fire Alarm" or "火災警報"
      4. Assert emergency status banner is visible (NORMAL/ALERT/EVACUATE)
      5. Assert detector grid shows detector cards with type and status
      6. Assert suppression system status cards are visible
      7. Assert alarm timeline is visible
      8. Assert red/orange theme using --sf-fire-* tokens (inspect CSS)
      9. Screenshot the panel
    Expected Result: All sections render with red/orange theme, highest visual prominence among all panels
    Failure Indicators: Missing sections, wrong colors, layout breaks, low visual contrast
    Evidence: .sisyphus/evidence/task-12-fire-panel.png

  Scenario: Fire alarm pulsing animation on ALERT/EVACUATE states
    Tool: Playwright
    Preconditions: Panel rendering with alarm data
    Steps:
      1. Render FireAlarmPanel with `mockData` where status = 'ALERT'
      2. Assert emergency banner has a pulsing CSS animation
      3. Check computed style for animation property on the banner element
      4. Screenshot during pulsing animation
    Expected Result: Emergency banner pulses with red glow animation on ALERT/EVACUATE states
    Failure Indicators: No animation, static banner, missing glow effect
    Evidence: .sisyphus/evidence/task-12-fire-pulse.png

  Scenario: Fire panel uses theme CSS tokens (no hardcoded colors)
    Tool: Bash
    Steps:
      1. Run `grep -rn "#[0-9a-fA-F]\{3,6\}" equipment-monitor/src/components/war-room/FireAlarmPanel.tsx`
      2. Assert zero matches
      3. Run `grep "var(--sf-fire-" equipment-monitor/src/components/war-room/FireAlarmPanel.tsx`
      4. Assert multiple fire theme token references
    Expected Result: Only CSS variable references, no hardcoded hex
    Failure Indicators: Any hardcoded hex colors
    Evidence: .sisyphus/evidence/task-12-fire-tokens.txt
  ```

  **Commit**: YES (Wave 3 commit, grouped with T11)
  - Message: `feat(war-room): add Fire Alarm overlay panel`
  - Files: `equipment-monitor/src/components/war-room/FireAlarmPanel.tsx`
  - Pre-commit: `cd equipment-monitor && npm run build`

- [x] 13. **Build 3D Subsystem Zones (Power, BA, Gas, Fire)**

  **What to do**:
  - Create `equipment-monitor/src/components/three/SubsystemZone.tsx` — a reusable 3D zone component
  - Each `SubsystemZone` represents one subsystem area in the 3D factory scene:
    - **Geometry**: A floor plane (procedural `PlaneGeometry`) with raised edges/border to define the zone boundary
    - **Color**: Zone border glow uses the subsystem's CSS token color (`--sf-power-primary`, etc.) — CSS variables must be read at React level and passed to Three.js as `THREE.Color` values
    - **Label**: Zone name text rendered above the zone using drei's `<Text>` component (float above center of zone, face camera with `<Billboard>`)
    - **Data Overlay**: Animated floating numbers showing the subsystem's primary KPI (e.g., Power shows active kW, Gas shows O2 level) — update via zustand store
    - **Click Handler**: `onClick` opens the corresponding 2D overlay panel (communicated via zustand store `setActiveZone`)
    - **Hover Effect**: Zone border brightens on hover (emissive intensity increase) — use `onPointerOver`/`onPointerOut` with state
    - **Alert Animation**: When subsystem has active alarms, zone border pulses with the subsystem's danger color (`--sf-power-danger`, etc.) using `useFrame` animated emissive intensity
  - Position each zone in the FactoryScene (2×2 grid layout):
    - Power: front-left `[-8, 0, -8]`
    - Building Auto: front-right `[8, 0, -8]`
    - Gas Detection: back-left `[-8, 0, 8]`
    - Fire Alarm: back-right `[8, 0, 8]`
  - Each zone floor: ~12×12 units, with subtle grid lines
  - Center area: procedural factory building outline (simple box geometry: `BoxGeometry(8, 3, 8)` at origin, with metallic material)
  - **Particles for alerts**: When a zone has active alarms, render small floating particles above the zone using drei's `<Sparkles>` component in the subsystem's danger color

  **Must NOT do**:
  - Do NOT load any GLTF/GLB model files — all geometry is procedural
  - Do NOT add shadow maps or post-processing
  - Do NOT add physics or collision detection
  - Do NOT use continuous `frameloop="always"` — demand rendering with animation triggers
  - Do NOT hardcode hex colors in Three.js materials — read CSS tokens and convert to `THREE.Color`

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Core 3D component with multiple concerns — geometry, lighting, animation, interaction, data binding, event handling
  - **Skills**: [`ui-ux-pro-max`]
    - `ui-ux-pro-max`: 3D interaction design with hover states, click handlers, and animated data overlays

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on FactoryScene from Task 8)
  - **Parallel Group**: Wave 3 (sequential after T8)
  - **Blocks**: Task 14 (war-room page integrates zones)
  - **Blocked By**: Task 8 (needs FactoryCanvas/FactoryScene), Task 5 (needs CSS tokens for zone colors)

  **References**:

  **Pattern References** (existing code to follow):
  - `equipment-monitor/src/components/three/FactoryScene.tsx` — Task 8's scene. SubsystemZone components will be rendered inside this scene as children
  - `equipment-monitor/src/app/globals.css` — `--sf-power-*`, `--sf-ba-*`, `--sf-gas-*`, `--sf-fire-*` CSS tokens for zone colors, glow, and danger states

  **API/Type References**:
  - `equipment-monitor/src/lib/war-room-types.ts` — `SubsystemZoneType` union type and subsystem data interfaces
  - `@react-three/drei` — `<Text>`, `<Billboard>`, `<Sparkles>`, `<OrbitControls>` components for 3D helpers

  **External References**:
  - drei Text component: https://docs.pmnd.rs/drei/misc/text
  - drei Billboard: https://docs.pmnd.rs/drei/misc/billboard
  - drei Sparkles: https://docs.pmnd.rs/drei/particles/sparkles
  - Reading CSS variables in React: `getComputedStyle(element).getPropertyValue('--sf-power-primary')` → convert hex to `THREE.Color`

  **WHY Each Reference Matters**:
  - FactoryScene: SubsystemZones must integrate into the existing scene layout and lighting
  - CSS tokens → THREE.Color: Critical for keeping colors in sync with 2D panels — must dynamically read CSS variables
  - drei components: Specific helper components for text, particles, and camera-facing elements

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: 3D subsystem zones render in the factory scene
    Tool: Playwright
    Preconditions: Dev server running, FactoryCanvas rendering
    Steps:
      1. Create a test route with FactoryCanvas containing 4 SubsystemZones
      2. Navigate to the test route
      3. Wait for canvas to render (timeout: 15s)
      4. Assert canvas has non-zero dimensions
      5. Assert 4 zone floor planes are visible (screenshot)
      6. Assert zone labels are visible (text above each zone using drei <Text>)
      7. Assert center factory building outline is visible
    Expected Result: 4 colored zones visible in 2×2 layout with center building, each with label text
    Failure Indicators: Missing zones, labels not rendering, zones overlapping, canvas blank
    Evidence: .sisyphus/evidence/task-13-zones-render.png

  Scenario: Zone hover effect brightens border
    Tool: Playwright
    Preconditions: Scene rendered with zones
    Steps:
      1. Navigate to test route
      2. Hover mouse over one zone
      3. Assert zone border visually brightens (compare screenshots before/after hover)
      4. Move mouse away from zone
      5. Assert zone border returns to normal brightness
    Expected Result: Hover causes visible brightness increase on zone border
    Failure Indicators: No visual change on hover, brightness stays same
    Evidence: .sisyphus/evidence/task-13-zone-hover.png

  Scenario: Zone click updates store and signals overlay
    Tool: Bash
    Preconditions: Component renders
    Steps:
      1. Simulate click on a zone (or verify via zustand store that `setActiveZone` is called)
      2. Read zustand store state
      3. Assert `activeZone` is set to the clicked zone type
      4. Assert `overlayOpen` is `true`
    Expected Result: Clicking a zone updates the store with the zone type and opens the overlay signal
    Failure Indicators: Store not updated, overlay not triggered
    Evidence: .sisyphus/evidence/task-13-zone-click.txt

  Scenario: Alert animation pulses zone border on active alarm
    Tool: Playwright
    Preconditions: Scene rendered with alarm data in mock store
    Steps:
      1. Set mock store data to include an active alarm for the Power zone
      2. Screenshot the Power zone
      3. Assert zone border has pulsing/animated visual (compare 2 screenshots 500ms apart)
      4. Assert Sparkles particles appear above the zone with alarm
    Expected Result: Zone with active alarm shows pulsing border glow and floating particles
    Failure Indicators: No animation, no particles, static zone appearance
    Evidence: .sisyphus/evidence/task-13-alert-animation.png
  ```

  **Commit**: YES (Wave 3 commit)
  - Message: `feat(3d): add SubsystemZone components with interactive zones and alert animations`
  - Files: `equipment-monitor/src/components/three/SubsystemZone.tsx`
  - Pre-commit: `cd equipment-monitor && npm run build`

- [x] 14. **Build War Room Page Route + Integration**

  **What to do**:
  - Create `equipment-monitor/src/app/mes/war-room/page.tsx` — the war room page route
  - Page layout (full viewport, no scroll):
    - **Top bar**: Title "智慧工廠戰情中心 / Smart Factory War Room" + current time + subsystem status indicators (4 small colored dots showing each subsystem's health)
    - **Main area**: FactoryCanvas with FactoryScene containing 4 SubsystemZones (fills remaining viewport)
    - **Overlay area**: When a zone is clicked, the corresponding 2D overlay panel slides in from the right (positioned over the 3D canvas, not replacing it)
  - Import all components with `dynamic(() => import(...), { ssr: false })`:
    - `FactoryCanvas` → dynamic import
    - `SubsystemZone` → dynamic import
    - All 4 overlay panels → dynamic import
  - Create `equipment-monitor/src/stores/war-room-store.ts` — Zustand store:
    - `activeZone: SubsystemZoneType | null` — which zone is selected
    - `overlayOpen: boolean` — whether a panel overlay is showing
    - `subsystemData: Record<SubsystemZoneType, SubsystemData>` — mock data for all 4, updated on interval (5s refresh)
    - `setActiveZone(zone)` — set active zone and open overlay
    - `closeOverlay()` — close overlay panel
    - `refreshData()` — regenerate mock data for all subsystems (called by interval)
  - Wire up the click flow:
    1. User clicks SubsystemZone in 3D scene
    2. Zone calls `war-room-store.setActiveZone('power')`
    3. Store updates `activeZone` and `overlayOpen`
    4. Page renders `PowerMonitoringPanel` in overlay
    5. User presses Escape or clicks close → `closeOverlay()`
  - Add Escape key handler: global `keydown` listener for Escape → `closeOverlay()`
  - Add click-outside handler: click on canvas area (not overlay) → `closeOverlay()`
  - Ensure overlay has `z-index` above the 3D canvas

  **Must NOT do**:
  - Do NOT create a separate route for each subsystem — all 4 overlays are on this one page
  - Do NOT add any backend API calls — data comes from mock generators + zustand store
  - Do NOT import Three.js or R3F directly in the page file — always via dynamic imports
  - Do NOT add navigation sidebar or tabs — everything is in the 3D view + overlay

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Full-page layout integrating 3D scene, overlays, state management, animations, and responsive design
  - **Skills**: [`ui-ux-pro-max`]
    - `ui-ux-pro-max`: Page integration, layout composition, overlay animation, z-index stacking, responsive dark theme dashboard

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3 (after all Wave 2 tasks complete)
  - **Blocks**: Tasks 15, 16
  - **Blocked By**: Task 8 (FactoryCanvas/FactoryScene), Tasks 9-12 (overlay panels), Task 13 (SubsystemZones)

  **References**:

  **Pattern References** (existing code to follow):
  - `equipment-monitor/src/app/mes/spc/page.tsx` — Existing MES page pattern. Follow similar import structure, layout approach, and dynamic import wrapping
  - `equipment-monitor/src/app/mes/equipment/page.tsx` — Another MES page. See how FabFloorMap is currently integrated
  - `equipment-monitor/src/components/war-room/PowerMonitoringPanel.tsx` — Overlay panel to integrate
  - `equipment-monitor/src/components/three/FactoryCanvas.tsx` — 3D canvas to render as main content
  - `equipment-monitor/src/components/three/SubsystemZone.tsx` — 3D zones inside the scene

  **API/Type References**:
  - `equipment-monitor/src/lib/war-room-types.ts` — All type definitions for the store
  - `equipment-monitor/src/lib/war-room-mock-data.ts` — Mock data generators
  - `zustand` — State management library (check if already in package.json, add if not)

  **External References**:
  - Zustand docs: https://github.com/pmndrs/zustand
  - Next.js dynamic imports: https://nextjs.org/docs/app/building-your-webapp/optimizing/lazy-loading
  - React Three Fiber + Zustand integration: https://docs.pmnd.rs/react-three-fiber/recipes/using-with-zustand

  **WHY Each Reference Matters**:
  - SPC page: Must follow the same MES page layout pattern for consistency
  - Dynamic imports: CRITICAL for static export — Three.js must NOT be SSR'd
  - Zustand: The state glue connecting 3D zone clicks to 2D overlay panels

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: War room page renders with 3D scene and overlays
    Tool: Playwright
    Preconditions: Dev server running, all components built
    Steps:
      1. Navigate to `/mix-gem/mes/war-room`
      2. Wait for canvas to render (timeout: 15s)
      3. Assert page title is visible ("Smart Factory War Room" or "智慧工廠戰情中心")
      4. Assert 3D canvas fills viewport
      5. Assert 4 colored zone indicators are visible in top bar
      6. Screenshot the full page
    Expected Result: War room page renders with 3D scene, 4 zones visible, top bar with status
    Failure Indicators: Blank page, canvas errors, missing zones, no top bar
    Evidence: .sisyphus/evidence/task-14-warroom-page.png

  Scenario: Clicking a zone opens the corresponding overlay panel
    Tool: Playwright
    Preconditions: War room page rendered
    Steps:
      1. Navigate to `/mix-gem/mes/war-room`
      2. Click on the Power zone in the 3D scene
      3. Wait for overlay to appear (timeout: 3s)
      4. Assert Power Monitoring panel is visible
      5. Assert panel shows mock data (gauge values, status indicators)
      6. Close the panel (click close button)
      7. Click on Gas Detection zone
      8. Assert Gas Detection panel is visible
      9. Close panel via Escape key
    Expected Result: Each zone click opens the correct subsystem panel, Escape closes it
    Failure Indicators: Panel doesn't appear, wrong panel appears, panel doesn't close
    Evidence: .sisyphus/evidence/task-14-zone-click-overlay.png

  Scenario: Overlay slides in from right with animation
    Tool: Playwright
    Preconditions: War room page rendered
    Steps:
      1. Navigate to `/mix-gem/mes/war-room`
      2. Click on a zone
      3. Watch for CSS transition animation (overlay slides from right)
      4. Screenshot during animation if possible, or after transition completes
    Expected Result: Overlay panel animates in from the right side with a smooth CSS transition
    Failure Indicators: Panel appears instantly without animation, panel appears from wrong direction
    Evidence: .sisyphus/evidence/task-14-overlay-animation.png

  Scenario: Static export build succeeds with war-room page
    Tool: Bash
    Steps:
      1. Run `cd equipment-monitor && npm run build`
      2. Assert exit code 0
      3. Check that `out/mes/war-room/index.html` exists in build output
    Expected Result: Build succeeds, war-room page is in static export output
    Failure Indicators: Build fails, war-room page missing from output
    Evidence: .sisyphus/evidence/task-14-build.txt

  Scenario: Mock data refreshes on interval
    Tool: Playwright
    Preconditions: War room page rendered
    Steps:
      1. Navigate to `/mix-gem/mes/war-room`
      2. Open a subsystem overlay panel
      3. Note the initial gauge values
      4. Wait 6 seconds (data refreshes every 5s)
      5. Check gauge values again
      6. Assert at least one value has changed slightly (mock data fluctuation)
    Expected Result: Data values update periodically with realistic fluctuations
    Failure Indicators: Values never change, error in console during refresh
    Evidence: .sisyphus/evidence/task-14-data-refresh.png
  ```

  **Commit**: YES (Wave 3 commit)
  - Message: `feat(war-room): add war room page route with 3D scene, overlays, and state management`
  - Files: `equipment-monitor/src/app/mes/war-room/page.tsx`, `equipment-monitor/src/stores/war-room-store.ts`
  - Pre-commit: `cd equipment-monitor && npm run build`

- [x] 15. **Replace FabFloorMap with WebGL Version on /mes/equipment**

  **What to do**:
  - The current `equipment-monitor/src/components/equipment/FabFloorMap.tsx` uses CSS transforms (rotateX/rotateZ) for an isometric factory floor view
  - **Replace it** with a WebGL 3D version using React Three Fiber, following the same patterns established in FactoryCanvas/FactoryScene
  - Create `equipment-monitor/src/components/equipment/FabFloorMap3D.tsx` (new file):
    - Use `dynamic(() => import(...), { ssr: false })` for the 3D component
    - Wrap in `<WebGLFallback>` for non-WebGL browsers
    - Camera: top-down isometric view (angled 30° from horizontal, rotated 45° azimuth)
    - Show equipment bays as 3D boxes arranged in the current floor map layout
    - Each equipment bay: `BoxGeometry` with color based on status (running=warm, idle=cool, alarm=red)
    - Hover on equipment: highlight with emissive glow + show tooltip with equipment name/status
    - Click on equipment: navigate to or show equipment detail (same behavior as current FabFloorMap)
    - Use `<OrbitControls>` with restricted angles (can't go underground, limited zoom)
    - Use `frameloop="demand"` for performance
  - Update `equipment-monitor/src/app/mes/equipment/page.tsx`:
    - Import `FabFloorMap3D` via dynamic import (ssr: false)
    - Replace the current FabFloorMap component with FabFloorMap3D
    - Keep the `<WebGLFallback>` pattern — if WebGL is not available, render the original CSS isometric FabFloorMap as fallback
    - Use the `useWebGLSupport()` hook from Task 7 to detect WebGL availability
  - Keep the original `FabFloorMap.tsx` file (don't delete it) — it becomes the non-WebGL fallback

  **Must NOT do**:
  - Do NOT delete the original CSS FabFloorMap — keep it as the non-WebGL fallback
  - Do NOT change the `/mes/equipment` route structure — just replace the component
  - Do NOT add GLTF/GLB model loading — procedural geometry only
  - Do NOT add post-processing effects
  - Do NOT change any other page's route or layout

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Replacing an existing working component with a 3D version — must preserve existing behavior while adding 3D. Risk of regression.
  - **Skills**: [`ui-ux-pro-max`]
    - `ui-ux-pro-max`: 3D equipment floor map with isometric camera, equipment status visualization, and hover/click interactions

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on Task 8 FactoryCanvas patterns and Task 14 integration)
  - **Parallel Group**: Wave 4 (after Wave 3)
  - **Blocks**: Tasks F1-F4 (final verification)
  - **Blocked By**: Task 8 (needs FactoryCanvas/3D patterns), Task 14 (needs war-room page pattern for reference)

  **References**:

  **Pattern References** (existing code to follow):
  - `equipment-monitor/src/components/equipment/FabFloorMap.tsx` — Current CSS isometric floor map. Study: equipment bay layout, status colors, click handlers, tooltip content. The 3D version must preserve this behavior
  - `equipment-monitor/src/components/three/FactoryCanvas.tsx` — Task 8's 3D canvas wrapper. Reuse the same dynamic import pattern, error boundary, and frameloop settings
  - `equipment-monitor/src/components/three/FactoryScene.tsx` — Task 8's scene setup. Follow the same lighting, OrbitControls, and demand-rendering patterns
  - `equipment-monitor/src/hooks/use-webgl-support.ts` — Task 7's WebGL detection hook. Use for fallback detection

  **API/Type References**:
  - `equipment-monitor/src/app/mes/equipment/page.tsx` — Current equipment page. Must update this to use FabFloorMap3D with fallback
  - Equipment status types: whatever FabFloorMap currently uses for status colors and click handling

  **External References**:
  - R3F isometric camera: Set `position={[20, 20, 20]}` and `lookAt` center, or use `OrbitControls` with `minPolarAngle`/`maxPolarAngle` for restricted rotation
  - drei `<Html>` component for hover tooltips in 3D space: https://docs.pmnd.rs/drei/abstract/html

  **WHY Each Reference Matters**:
  - Current FabFloorMap: Must preserve equipment bay layout, status colors, and click behavior — regression risk
  - FactoryCanvas/Scene patterns: Reuse proven 3D setup patterns for consistency
  - WebGL hook: Must provide CSS isometric fallback for non-WebGL browsers

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: FabFloorMap3D renders on /mes/equipment with WebGL
    Tool: Playwright
    Preconditions: Dev server running, WebGL available
    Steps:
      1. Navigate to `/mix-gem/mes/equipment`
      2. Wait for 3D canvas to render (timeout: 15s)
      3. Assert equipment bays are visible as 3D boxes
      4. Assert bays have status-colored materials (warm/cool/red)
      5. Assert orbit controls work (drag to rotate, scroll to zoom)
      6. Screenshot the 3D floor map
    Expected Result: Equipment page shows 3D factory floor with colored equipment bays, interactive camera
    Failure Indicators: CSS isometric view (fallback rendered when WebGL should work), blank canvas, errors
    Evidence: .sisyphus/evidence/task-15-fabfloor3d.png

  Scenario: Fallback CSS FabFloorMap renders when WebGL is unavailable
    Tool: Playwright
    Preconditions: WebGL disabled (Chrome --disable-webgl flags)
    Steps:
      1. Launch browser with WebGL disabled
      2. Navigate to `/mix-gem/mes/equipment`
      3. Assert the CSS isometric FabFloorMap renders (not the 3D version)
      4. Assert equipment bays are visible and interactive
    Expected Result: Original CSS isometric floor map renders as fallback
    Failure Indicators: Blank page, WebGL error, no fallback rendered
    Evidence: .sisyphus/evidence/task-15-fabfloor-fallback.png

  Scenario: Equipment hover shows tooltip with name and status
    Tool: Playwright
    Preconditions: 3D floor map rendered
    Steps:
      1. Navigate to `/mix-gem/mes/equipment`
      2. Hover mouse over an equipment bay
      3. Assert tooltip appears with equipment name and status
      4. Assert equipment highlights with emissive glow on hover
    Expected Result: Hover shows tooltip, equipment highlights
    Failure Indicators: No tooltip, no highlight, tooltip misplaced
    Evidence: .sisyphus/evidence/task-15-hover-tooltip.png

  Scenario: Static export build succeeds with FabFloorMap3D
    Tool: Bash
    Steps:
      1. Run `cd equipment-monitor && npm run build`
      2. Assert exit code 0
    Expected Result: Build passes with both 3D FabFloorMap and CSS fallback included
    Failure Indicators: Build fails, missing imports, Three.js bundling errors
    Evidence: .sisyphus/evidence/task-15-build.txt
  ```

  **Commit**: YES (Wave 4 commit)
  - Message: `feat(3d): replace FabFloorMap with WebGL 3D version on /mes/equipment`
  - Files: `equipment-monitor/src/components/equipment/FabFloorMap3D.tsx`, `equipment-monitor/src/app/mes/equipment/page.tsx`
  - Pre-commit: `cd equipment-monitor && npm run build`

- [x] 16. **Update MesNavBar + Wire War-Room Link**

  **What to do**:
  - Read `equipment-monitor/src/components/mes/MesNavBar.tsx` (find the actual navigation component via explore if path differs)
  - Add a new navigation link for "戰情中心 / War Room" pointing to `/mes/war-room`
  - Place the war-room link prominently — it should be one of the first/main navigation items (after or before the dashboard link)
  - Use an appropriate icon (3D/model/monitor icon from the existing icon set used in navigation)
  - Ensure the link routes correctly with `basePath: '/mix-gem'` (use Next.js `<Link>` component with `href="/mes/war-room"`)
  - Verify that clicking the link navigates to the war-room page that renders the 3D scene

  **Must NOT do**:
  - Do NOT change the layout or styling of existing navigation items
  - Do NOT add a new navigation bar — just add a link to the existing one
  - Do NOT change any existing page routes or links
  - Do NOT import any Three.js or R3F modules into the navigation component

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple navigation link addition — well-defined, narrow scope
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 15)
  - **Parallel Group**: Wave 4
  - **Blocks**: Tasks F1-F4 (final verification)
  - **Blocked By**: Task 14 (war-room page must exist for the link to work)

  **References**:

  **Pattern References** (existing code to follow):
  - `equipment-monitor/src/components/mes/MesNavBar.tsx` (find actual path via explore) — See how existing navigation links are structured: icon import, label format, href pattern, active state handling
  - `equipment-monitor/src/app/mes/spc/page.tsx` or `equipment-monitor/src/app/mes/equipment/page.tsx` — See how pages link to the navigation

  **WHY Each Reference Matters**:
  - Nav component: Must follow the exact same pattern for link addition — icons, styling, active state detection, href format
  - Page files: Confirm `/mes/war-room` is the correct route after basePath

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: War Room link appears in MesNavBar
    Tool: Playwright
    Preconditions: Dev server running
    Steps:
      1. Navigate to any MES page (e.g., `/mix-gem/mes/spc`)
      2. Assert MesNavBar is visible
      3. Assert a navigation item for "War Room" or "戰情中心" exists
      4. Assert the link has href="/mes/war-room"
      5. Screenshot the navigation bar
    Expected Result: War Room link is visible in navigation with correct href
    Failure Indicators: Link missing, wrong href, link not visible
    Evidence: .sisyphus/evidence/task-16-navbar-link.png

  Scenario: Clicking War Room link navigates to war-room page
    Tool: Playwright
    Preconditions: Dev server running
    Steps:
      1. Navigate to any MES page
      2. Click the "War Room" / "戰情中心" navigation link
      3. Wait for page to load (timeout: 15s for 3D scene)
      4. Assert URL is `/mix-gem/mes/war-room`
      5. Assert 3D canvas is visible on the page
    Expected Result: Navigation link correctly routes to war-room page with 3D content
    Failure Indicators: 404 error, redirects to wrong page, no 3D content
    Evidence: .sisyphus/evidence/task-16-navbar-navigation.png

  Scenario: Build succeeds with updated navigation
    Tool: Bash
    Steps:
      1. Run `cd equipment-monitor && npm run build`
      2. Assert exit code 0
    Expected Result: Build passes with updated navigation
    Failure Indicators: Build fails, TypeScript errors
    Evidence: .sisyphus/evidence/task-16-build.txt
  ```

  **Commit**: YES (Wave 4 commit, grouped with T15)
  - Message: `feat(nav): add War Room link to MesNavBar`
  - Files: `equipment-monitor/src/components/mes/MesNavBar.tsx` (find actual path)
  - Pre-commit: `cd equipment-monitor && npm run build`

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.

- [x] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, curl endpoint, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [x] F2. **Code Quality Review** — `unspecified-high`
  Run `tsc --noEmit` + linter + `bun test`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names. Verify no Three.js imports in non-3D files (gauge components must stay SVG).
  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Types [N pass/N fail] | Files [N clean/N issues] | VERDICT`

- [x] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill)
  Start from clean state. Execute EVERY QA scenario from EVERY task. Test cross-task integration (war room → click zone → overlay → data display → close). Test edge cases: non-WebGL browser, resize window, extreme gauge values. Save to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [x] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff. Verify 1:1 — everything in spec was built, nothing beyond spec was built. Check "Must NOT do" compliance. Detect: Three.js imports in gauge files, hardcoded colors, external GLTF models, new routes beyond /mes/war-room, changes to /mes/spc page structure.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

- **Wave 1**: `feat(ui): redesign gauges for overflow-proof display and add war-room types` — gauge-card.tsx, KpiGaugeCard.tsx, war-room-types.ts, war-room-mock-data.ts, globals.css
- **Wave 2**: `feat(3d): add R3F foundation and subsystem overlay panels` — FactoryCanvas.tsx, FactoryScene.tsx, WebGLFallback.tsx, PowerMonitoringPanel.tsx, BuildingAutoPanel.tsx, use-webgl-support.ts
- **Wave 3**: `feat(3d): add gas/fire panels, 3D zones, and war-room page` — GasDetectionPanel.tsx, FireAlarmPanel.tsx, SubsystemZone.tsx, war-room/page.tsx
- **Wave 4**: `feat(3d): replace FabFloorMap with WebGL and add nav link` — FabFloorMap.tsx, MesNavBar.tsx

---

## Success Criteria

### Verification Commands
```bash
cd equipment-monitor && npm run build  # Expected: exit 0, no errors
```

### Final Checklist
- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
- [ ] Static export `out/` directory contains `/mes/war-room/index.html`
- [ ] Gauge text never overflows at 1920×1080 for values up to ±999,999.99
- [ ] 3D war room renders with 4 colored subsystem zones
- [ ] Subsystem overlays open on zone click and close on Escape/outside-click
- [ ] FabFloorMap on /mes/equipment renders as WebGL 3D
- [ ] Non-WebGL fallback displays when WebGL is unavailable