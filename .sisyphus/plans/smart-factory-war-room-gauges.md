# Smart Factory War Room 3D and Gauge Synchronization

## TL;DR
> **Summary**: Upgrade `equipment-monitor/` war-room 3D from a minimal grid-and-zone model into a procedural semiconductor smart-factory twin, and synchronize SPC and war-room gauge visuals through shared gauge tokens/helpers without merging their distinct domain semantics.
> **Deliverables**:
> - Procedural cleanroom/fab 3D details, lighting, data-flow visuals, and alert hierarchy for `war-room-3d`.
> - Shared gauge design tokens/geometry helpers used by `GaugeCard` and `KpiGaugeCard`.
> - Accessibility, reduced-motion, panel consistency, and Playwright static-export QA coverage.
> - CI updates so lint/Jest/Playwright checks run before GitHub Pages deploy.
> **Effort**: Large
> **Parallel**: YES - 3 implementation waves + final verification wave
> **Critical Path**: Task 1 + Task 2 + Task 3 → Tasks 4-8 → Task 9 → Final Verification Wave

## Context
### Original Request
1. "make WebGL model of war-room-3d in equipment-monitor/ more like a real smart factory design."
2. "make gauge charts of SPC dashboard sync with war-room-3d gauge design in equipment-monitor/."

### Interview Summary
- 3D visual direction confirmed: semiconductor fab smart-factory twin with cleanroom/tool-bay/utility corridor cues.
- Gauge synchronization depth confirmed: shared design system via tokens/constants/helpers while preserving domain-specific logic.
- Test strategy confirmed: add Playwright browser QA infrastructure, plus Jest/Testing Library coverage.

### Metis Review (gaps addressed)
- Do not merge `GaugeCard` and `KpiGaugeCard`; they have different semantics: passive meter vs interactive SPC parameter selector.
- Do not change gauge percentage math: `GaugeCard` remains spec-window position; `KpiGaugeCard` remains deviation-from-target.
- Scope 3D redesign to procedural visual/geometry improvements only; do not add backend, WebSocket/SSE, or numeric 3D overlays by default.
- Do not add GLTF/GLB assets or WebGL screenshot comparisons; procedural geometry and DOM/ARIA/browser-state tests are safer.
- Playwright must serve static export from `out/` through a `/mix-gem` URL prefix because `next.config.ts` uses `output: 'export'` and `basePath: '/mix-gem'`; a custom test static server must map `/mix-gem/*` to `out/*` and `/mix-gem/_next/*` to `out/_next/*`.
- Fix duplicated/under-specified gauge tokens and low-contrast muted text while extending existing `--smartfactory-*` → `--sf-*` convention.

## Work Objectives
### Core Objective
Make the war-room 3D page feel like a professional semiconductor smart-factory control-room twin, and make SPC gauges visually cohesive with war-room/equipment gauges through shared design language.

### Deliverables
- Shared gauge token set in `equipment-monitor/src/app/globals.css`.
- Shared gauge geometry/format helpers in `equipment-monitor/src/lib/gauge-geometry.ts` with Jest coverage.
- Updated `equipment-monitor/src/components/charts/gauge-card.tsx` using shared gauge design while keeping `role="meter"` semantics.
- Updated `equipment-monitor/src/components/spc/KpiGaugeCard.tsx` using shared gauge design while keeping interactive selector behavior.
- Procedural 3D cleanroom/fab shell, tool bays, utility corridor, status lights, flow lines, and zone-level alert hierarchy.
- War-room DOM accessibility upgrades and panel-width/focus consistency across subsystem overlays.
- Playwright config/specs and CI workflow gates.

### Definition of Done (verifiable conditions with commands)
- `cd equipment-monitor && npm run lint` exits 0.
- `cd equipment-monitor && npm test -- --runInBand` exits 0.
- `cd equipment-monitor && npm run build` exits 0 and produces `out/` for static export.
- `cd equipment-monitor && npx playwright test --list` lists the new specs without config/basePath errors.
- `cd equipment-monitor && npx playwright test` exits 0.
- `cd equipment-monitor && npx playwright test --grep "gauge|war room|webgl"` exits 0.
- No `.glb` or `.gltf` references exist under `equipment-monitor/src/`.
- `--smartfactory-text-muted` is no longer `#475569` in `equipment-monitor/src/app/globals.css`.
- `--gauge-value-color` appears exactly once in `equipment-monitor/src/app/globals.css`.

### Must Have
- Preserve existing Next.js/R3F/Drei/Recharts/Zustand stack.
- Keep all new 3D factory detail procedural and reusable; no asset pipeline.
- Keep `GaugeCard` and `KpiGaugeCard` separate.
- Preserve `GaugeCard` data contract: `ProcessParameter` from `equipment-monitor/src/types/equipment.ts:32-40`.
- Preserve `KpiGaugeCard` data contract: `SpcMeasurement`, `SpcParameter`, and `SpcParamConfig` from `equipment-monitor/src/lib/spc-parameters.ts:3-20`.
- Respect `prefers-reduced-motion` using existing patterns in `equipment-monitor/src/lib/animation.ts` and CSS at `equipment-monitor/src/app/globals.css:281-290`.
- Use `--smartfactory-gauge-*` full tokens and `--sf-gauge-*` shorthand aliases, matching the current token pattern at `equipment-monitor/src/app/globals.css:164-261`.

### Must NOT Have (guardrails, AI slop patterns, scope boundaries)
- MUST NOT introduce backend/API/WebSocket/SSE changes.
- MUST NOT import `.glb` or `.gltf` assets.
- MUST NOT add WebGL screenshot comparison tests.
- MUST NOT use `next dev` for Playwright; serve static `out/` only through the `/mix-gem`-aware test static server.
- MUST NOT create a separate design-system package.
- MUST NOT change SPC measurement generation, control-limit logic, or equipment mock data semantics.
- MUST NOT rewrite unrelated SPC components (`ControlChart`, `WaferBinMap`, `HeatmapTable`) except test selectors/ARIA if directly required.
- MUST NOT add broad page-object or custom-fixture Playwright architecture beyond simple specs.

## Verification Strategy
> ZERO HUMAN INTERVENTION - all verification is agent-executed.
- Test decision: Add Playwright + tests-after with existing Jest/Testing Library.
- QA policy: Every task has agent-executed scenarios.
- Evidence: `.sisyphus/evidence/task-{N}-{slug}.{ext}`

## Execution Strategy
### Parallel Execution Waves
> Target: 5-8 tasks per wave. <3 per wave (except final) = under-splitting.
> Extract shared dependencies as Wave-1 tasks for max parallelism.

Wave 1: Tasks 1-3 — Playwright foundation, SmartFactory token foundation, shared gauge helpers.
Wave 2: Tasks 4-8 — Gauge refactors, 3D fab scene, subsystem zone alert visuals, war-room accessibility/panel consistency.
Wave 3: Task 9 — Browser specs + CI wiring after implementation targets exist.

### Dependency Matrix (full, all tasks)
| Task | Depends On | Blocks |
|---|---|---|
| 1. Add Playwright static-export QA foundation | None | 9 |
| 2. Extend SmartFactory gauge and scene tokens | None | 3, 4, 5, 6, 7, 8 |
| 3. Create shared gauge geometry helpers | 2 | 4, 5 |
| 4. Refactor war-room/equipment GaugeCard | 2, 3 | 9 |
| 5. Refactor SPC KpiGaugeCard | 2, 3 | 9 |
| 6. Add procedural semiconductor fab scene details | 2 | 7, 9 |
| 7. Upgrade SubsystemZone alert hierarchy and labels | 2, 6 | 9 |
| 8. Improve war-room accessibility and panel consistency | 2 | 9 |
| 9. Add Playwright specs and CI gates | 1, 4, 5, 6, 7, 8 | Final verification |

### Agent Dispatch Summary (wave → task count → categories)
| Wave | Task Count | Categories |
|---|---:|---|
| Wave 1 | 3 | `uiux-master`, `visual-engineering` |
| Wave 2 | 5 | `visual-engineering`, `uiux-master` |
| Wave 3 | 1 | `uiux-master` |
| Final | 4 | `oracle`, `unspecified-high`, `deep` |

## TODOs
> Implementation + Test = ONE task. Never separate.
> EVERY task MUST have: Agent Profile + Parallelization + QA Scenarios.

- [x] 1. Add Playwright static-export QA foundation

  **What to do**: Add browser QA infrastructure without writing final specs yet. In `equipment-monitor/package.json`, add devDependency `@playwright/test`, and add scripts: `test:e2e` = `playwright test`, `test:e2e:list` = `playwright test --list --pass-with-no-tests`, `test:e2e:install` = `playwright install --with-deps chromium`, and `test:e2e:serve` = `node tests/e2e/static-server.mjs --dir out --basePath /mix-gem --port 3000`. Create `equipment-monitor/tests/e2e/static-server.mjs`, a small Node HTTP server that serves static export files with basePath mapping: requests to `/mix-gem/_next/*` read from `out/_next/*`; requests to `/mix-gem/<route>/` read from `out/<route>/index.html`; `/mix-gem/` reads `out/index.html`; missing files return `out/404.html` if present, otherwise 404. Create `equipment-monitor/playwright.config.ts` with `testDir: './tests/e2e'`, Chromium-only project, `baseURL: 'http://127.0.0.1:3000/mix-gem'`, `webServer.command: 'npm run test:e2e:serve'`, `webServer.url: 'http://127.0.0.1:3000/mix-gem/'`, `reuseExistingServer: !process.env.CI`, `timeout: 120000`, `retries: process.env.CI ? 1 : 0`, `workers: process.env.CI ? 1 : undefined`, `trace: 'retain-on-failure'`, `screenshot: 'only-on-failure'`, and `video: 'retain-on-failure'`. Do not add screenshot assertion helpers.
  **Must NOT do**: Do not use `next dev`; do not use plain `npx serve out -l 3000` because it does not map `/mix-gem/_next/*` to `out/_next/*`; do not add page-object abstractions; do not add visual snapshot dependencies.

  **Recommended Agent Profile**:
  - Category: `uiux-master` - Reason: Browser QA setup for UI pages with static export constraints.
  - Skills: [`playwright`] - Required for browser test configuration patterns.
  - Omitted: [`docker-compose-generator`] - No container orchestration changes.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 9 | Blocked By: None

  **References** (executor has NO interview context - be exhaustive):
  - Package scripts/deps: `equipment-monitor/package.json:5-53` - Existing scripts and dependency blocks to extend.
  - Static export/base path: `equipment-monitor/next.config.ts:3-11` - Requires serving `out/` and using `/mix-gem` in `baseURL`.
  - Current CI: `.github/workflows/nextjs.yml:78-83` - Build currently happens before artifact upload; Playwright will hook after implementation in Task 9.
  - Test infra baseline: `equipment-monitor/jest.config.mjs:10-17` - Existing unit test config remains separate.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `cd equipment-monitor && npm install` exits 0 and updates `package-lock.json`.
  - [ ] `cd equipment-monitor && npx playwright test --list --pass-with-no-tests` exits 0; it may list 0 tests until Task 9 adds specs.
  - [ ] `cd equipment-monitor && npm run build` exits 0 and produces `equipment-monitor/out/`.

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```
  Scenario: Playwright config loads against static export base path
    Tool: Bash
    Steps: cd equipment-monitor; npm run build; npm run test:e2e:list
    Expected: Exit code 0; command does not complain about missing config, invalid baseURL, or missing browser project.
    Evidence: .sisyphus/evidence/task-1-playwright-list.txt

  Scenario: Misconfigured dev server is not used
    Tool: Bash
    Steps: cd equipment-monitor; node -e "const fs=require('fs'); const cfg=fs.readFileSync('playwright.config.ts','utf8'); const srv=fs.readFileSync('tests/e2e/static-server.mjs','utf8'); if(cfg.includes('next dev')) process.exit(1); if(cfg.includes('serve out -l 3000')) process.exit(2); if(!cfg.includes('npm run test:e2e:serve')) process.exit(3); if(!srv.includes('/_next/') || !srv.includes('basePath')) process.exit(4);"
    Expected: Exit code 0.
    Evidence: .sisyphus/evidence/task-1-no-next-dev.txt
  ```

  **Commit**: NO | Message: `feat(equipment-monitor): add static playwright qa foundation` | Files: [`equipment-monitor/package.json`, `equipment-monitor/package-lock.json`, `equipment-monitor/playwright.config.ts`, `equipment-monitor/tests/e2e/static-server.mjs`]

- [x] 2. Extend SmartFactory gauge and scene tokens

  **What to do**: Update `equipment-monitor/src/app/globals.css` to make SmartFactory tokens the single source for gauge and 3D visual language. Change `--smartfactory-text-muted` from `#475569` to `#64748B`. Remove the duplicate early `--gauge-value-color` definition at line 219 and keep one consolidated gauge token block near the existing shared overlay tokens at lines 254-260. Add full tokens and aliases: `--smartfactory-gauge-bg-gradient`, `--smartfactory-gauge-arc-track`, `--smartfactory-gauge-arc-width`, `--smartfactory-gauge-needle-width`, `--smartfactory-gauge-needle-glow`, `--smartfactory-gauge-zone-green`, `--smartfactory-gauge-zone-amber`, `--smartfactory-gauge-zone-red`, `--smartfactory-gauge-value-color`, `--smartfactory-gauge-unit-color`, `--smartfactory-gauge-label-color`, and matching `--sf-gauge-*` aliases. Add scene tokens: `--smartfactory-scene-grid-color`, `--smartfactory-scene-grid-accent`, `--smartfactory-scene-building-color`, `--smartfactory-scene-flow-color`, `--smartfactory-scene-tool-color`, and matching `--sf-scene-*` aliases. Add overlay width tokens: `--sf-overlay-width: min(45vw, 520px)` and `--sf-overlay-min-width: min(100vw, 360px)`.
  **Must NOT do**: Do not replace shadcn tokens; do not rename existing `--smartfactory-*` or `--sf-*` tokens; do not introduce light-mode work.

  **Recommended Agent Profile**:
  - Category: `uiux-master` - Reason: Design-token and accessibility contrast changes.
  - Skills: [`ui-ux-pro-max`] - Required for contrast, chart, and dark industrial design guardrails.
  - Omitted: [`playwright`] - Browser specs are Task 9.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 3, 4, 5, 6, 7, 8 | Blocked By: None

  **References**:
  - Token definitions: `equipment-monitor/src/app/globals.css:164-261` - Existing SmartFactory tokens, aliases, subsystem colors, and duplicate gauge token.
  - Reduced motion CSS: `equipment-monitor/src/app/globals.css:281-290` - Preserve this behavior.
  - Gauge usage of current tokens: `equipment-monitor/src/components/charts/gauge-card.tsx:84-88`, `equipment-monitor/src/components/charts/gauge-card.tsx:177-204`.
  - SPC usage of full tokens: `equipment-monitor/src/components/spc/KpiGaugeCard.tsx:121-142`, `equipment-monitor/src/components/spc/KpiGaugeCard.tsx:169-295`.

  **Acceptance Criteria**:
  - [ ] `cd equipment-monitor && node -e "const fs=require('fs'); const s=fs.readFileSync('src/app/globals.css','utf8'); if((s.match(/--gauge-value-color/g)||[]).length!==1) process.exit(1); if(s.includes('--smartfactory-text-muted: #475569')) process.exit(2); if(!s.includes('--sf-gauge-arc-track')) process.exit(3); if(!s.includes('--sf-scene-flow-color')) process.exit(4);"` exits 0.
  - [ ] `cd equipment-monitor && npm run lint` exits 0.

  **QA Scenarios**:
  ```
  Scenario: Gauge token block is consolidated
    Tool: Bash
    Steps: cd equipment-monitor; node -e "const fs=require('fs'); const s=fs.readFileSync('src/app/globals.css','utf8'); console.log((s.match(/--gauge-value-color/g)||[]).length); if((s.match(/--gauge-value-color/g)||[]).length!==1) process.exit(1);"
    Expected: Prints 1 and exits 0.
    Evidence: .sisyphus/evidence/task-2-gauge-token-count.txt

  Scenario: Muted text contrast token changed
    Tool: Bash
    Steps: cd equipment-monitor; node -e "const fs=require('fs'); const s=fs.readFileSync('src/app/globals.css','utf8'); if(!s.includes('--smartfactory-text-muted: #64748B')) process.exit(1); if(s.includes('--smartfactory-text-muted: #475569')) process.exit(2);"
    Expected: Exit code 0.
    Evidence: .sisyphus/evidence/task-2-muted-contrast.txt
  ```

  **Commit**: NO | Message: `style(equipment-monitor): add shared smartfactory gauge tokens` | Files: [`equipment-monitor/src/app/globals.css`]

- [x] 3. Create shared gauge geometry helpers with Jest coverage

  **What to do**: Add `equipment-monitor/src/lib/gauge-geometry.ts` exporting the shared constants and pure helpers used by both gauge components: `GAUGE_VIEWBOX = { width: 240, height: 160 }`, `GAUGE_ARC = { centerX: 120, centerY: 130, radius: 88, startAngle: -180, endAngle: 0 }`, `GAUGE_TEXT = { valueWidth: 160, labelWidth: 72, unitWidth: 100 }`, `polarToCartesian(angle, radius = GAUGE_ARC.radius)`, `describeGaugeArc(startAngle, endAngle, radius?)`, `clampPercentage(value)`, `safeRange(min, max)`, `computeGaugeValueFontSize(text, availableWidth = GAUGE_TEXT.valueWidth, min = 14, max = 30)`, `formatGaugeValue(value)`, and `sanitizeSvgId(input)`. Add `equipment-monitor/src/lib/gauge-geometry.test.ts` covering arc path generation, percentage clamping, zero-width ranges, font-size bounds, value formatting, and ID sanitization.
  **Must NOT do**: Do not import React, Recharts, Three.js, or DOM APIs in `gauge-geometry.ts`; keep it pure and deterministic.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: Shared visual math for SVG gauge consistency.
  - Skills: [] - Pure TypeScript helper implementation.
  - Omitted: [`playwright`] - Unit-level math only.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 4, 5 | Blocked By: 2

  **References**:
  - Existing GaugeCard math: `equipment-monitor/src/components/charts/gauge-card.tsx:14-37`, `equipment-monitor/src/components/charts/gauge-card.tsx:48-62`.
  - Existing KpiGaugeCard math: `equipment-monitor/src/components/spc/KpiGaugeCard.tsx:21-67`, `equipment-monitor/src/components/spc/KpiGaugeCard.tsx:108-124`.
  - Test config: `equipment-monitor/jest.config.mjs:10-17`.

  **Acceptance Criteria**:
  - [ ] `cd equipment-monitor && npm test -- src/lib/gauge-geometry.test.ts --runInBand` exits 0.
  - [ ] `cd equipment-monitor && npm run lint` exits 0.

  **QA Scenarios**:
  ```
  Scenario: Shared gauge helpers pass deterministic unit tests
    Tool: Bash
    Steps: cd equipment-monitor; npm test -- src/lib/gauge-geometry.test.ts --runInBand
    Expected: Jest reports all tests in gauge-geometry.test.ts passed.
    Evidence: .sisyphus/evidence/task-3-gauge-geometry-jest.txt

  Scenario: Helper remains browser-independent
    Tool: Bash
    Steps: cd equipment-monitor; node -e "const fs=require('fs'); const s=fs.readFileSync('src/lib/gauge-geometry.ts','utf8'); if(/from ['\"]react|from ['\"]three|document\.|window\./.test(s)) process.exit(1);"
    Expected: Exit code 0.
    Evidence: .sisyphus/evidence/task-3-pure-helper.txt
  ```

  **Commit**: NO | Message: `feat(equipment-monitor): add shared gauge geometry helpers` | Files: [`equipment-monitor/src/lib/gauge-geometry.ts`, `equipment-monitor/src/lib/gauge-geometry.test.ts`]

- [x] 4. Refactor war-room/equipment GaugeCard to shared gauge design

  **What to do**: Update `equipment-monitor/src/components/charts/gauge-card.tsx` to import and use `GAUGE_VIEWBOX`, `GAUGE_ARC`, `GAUGE_TEXT`, `describeGaugeArc`, `polarToCartesian`, `safeRange`, `clampPercentage`, `computeGaugeValueFontSize`, `formatGaugeValue`, and `sanitizeSvgId` from `@/lib/gauge-geometry`. Keep the `ProcessParameter` prop shape and `getStatus` warning/alarm logic. Update visual style to read Task 2 tokens: card background from `var(--sf-gauge-bg-gradient)`, arc track from `var(--sf-gauge-arc-track)`, arc width via `var(--sf-gauge-arc-width)`, status colors via `--sf-gauge-zone-*`, text colors via `--sf-gauge-value-color`, `--sf-gauge-unit-color`, and `--sf-gauge-label-color`. Add `textLength` + `lengthAdjust="spacingAndGlyphs"` to value, unit, LSL, and USL text. Add `aria-valuetext` with `${name}: ${formatted} ${unit || 'ratio'}, status ${status}, spec ${lsl} to ${usl}`. Preserve `role="meter"` and the sr-only polite live region.
  **Must NOT do**: Do not change `ProcessParameter`; do not change status thresholds; do not remove the live region at lines 214-216; do not change consumers.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: SVG gauge refactor with visual consistency and accessibility.
  - Skills: [`ui-ux-pro-max`] - Chart and accessibility guidance.
  - Omitted: [`playwright`] - Browser coverage is Task 9.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: 9 | Blocked By: 2, 3

  **References**:
  - Current component: `equipment-monitor/src/components/charts/gauge-card.tsx:55-219`.
  - Current ARIA meter pattern: `equipment-monitor/src/components/charts/gauge-card.tsx:110-118`.
  - Current text overflow gaps: `equipment-monitor/src/components/charts/gauge-card.tsx:177-204`.
  - Power panel consumer: `equipment-monitor/src/components/war-room/PowerMonitoringPanel.tsx:191-356`.
  - Data type contract: `equipment-monitor/src/types/equipment.ts:32-40`.

  **Acceptance Criteria**:
  - [ ] `cd equipment-monitor && npm test -- tests/integration/equipment-flow.test.tsx --runInBand` exits 0.
  - [ ] `cd equipment-monitor && npm run lint` exits 0.
  - [ ] `cd equipment-monitor && node -e "const fs=require('fs'); const s=fs.readFileSync('src/components/charts/gauge-card.tsx','utf8'); if(!s.includes('aria-valuetext')) process.exit(1); if(!s.includes('textLength')) process.exit(2); if(!s.includes('@/lib/gauge-geometry')) process.exit(3);"` exits 0.

  **QA Scenarios**:
  ```
  Scenario: Equipment dashboard gauge integration still renders
    Tool: Bash
    Steps: cd equipment-monitor; npm test -- tests/integration/equipment-flow.test.tsx --runInBand
    Expected: Jest reports Equipment Selection Flow tests passed.
    Evidence: .sisyphus/evidence/task-4-equipment-gauge-jest.txt

  Scenario: GaugeCard exposes accessible meter text
    Tool: Bash
    Steps: cd equipment-monitor; node -e "const fs=require('fs'); const s=fs.readFileSync('src/components/charts/gauge-card.tsx','utf8'); if(!/role=\"meter\"/.test(s) || !/aria-valuetext/.test(s)) process.exit(1);"
    Expected: Exit code 0.
    Evidence: .sisyphus/evidence/task-4-gauge-meter-aria.txt
  ```

  **Commit**: NO | Message: `refactor(equipment-monitor): align equipment gauge visuals` | Files: [`equipment-monitor/src/components/charts/gauge-card.tsx`]

- [x] 5. Refactor SPC KpiGaugeCard to shared gauge design while preserving selector semantics

  **What to do**: Update `equipment-monitor/src/components/spc/KpiGaugeCard.tsx` to use `@/lib/gauge-geometry` constants/helpers for viewBox, arc, text sizing, and path generation. Keep the outer tile as `role="button"`, `tabIndex={0}`, `aria-pressed={isActive}`, click handler, and Enter/Space key handler. Improve the button `aria-label` to include parameter label, selected state, current value/unit, target, LCL/UCL, and status (`OK`/`OOC`). Add an `sr-only` detail span inside each tile with the same status details and use `aria-describedby` from the tile to that span. Change visual tokens from mixed `--smartfactory-*`/`--kpi-*` to the shared `--sf-gauge-*` token set for arc, needle, labels, and values while leaving existing grid layout, sparkline, trend delta, and footer metrics intact.
  **Must NOT do**: Do not convert the outer tile to `role="meter"`; do not change `calculateZonePercentage`; do not remove sparklines or footer sub-metrics; do not change SPC parameter configuration.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: Interactive gauge visual refactor with accessibility constraints.
  - Skills: [`ui-ux-pro-max`] - Chart consistency and keyboard/a11y guardrails.
  - Omitted: [`playwright`] - Browser coverage is Task 9.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: 9 | Blocked By: 2, 3

  **References**:
  - Current component: `equipment-monitor/src/components/spc/KpiGaugeCard.tsx:69-360`.
  - Current selector ARIA/keyboard behavior: `equipment-monitor/src/components/spc/KpiGaugeCard.tsx:128-135`.
  - Current gauge SVG: `equipment-monitor/src/components/spc/KpiGaugeCard.tsx:162-296`.
  - SPC page consumer: `equipment-monitor/src/app/mes/spc/page.tsx:68-79`.
  - SPC config: `equipment-monitor/src/lib/spc-parameters.ts:3-20`.
  - Existing SPC page test: `equipment-monitor/src/app/mes/spc/page.test.tsx:20-38`.

  **Acceptance Criteria**:
  - [ ] `cd equipment-monitor && npm test -- src/app/mes/spc/page.test.tsx --runInBand` exits 0.
  - [ ] `cd equipment-monitor && npm run lint` exits 0.
  - [ ] `cd equipment-monitor && node -e "const fs=require('fs'); const s=fs.readFileSync('src/components/spc/KpiGaugeCard.tsx','utf8'); if(!s.includes('@/lib/gauge-geometry')) process.exit(1); if(!s.includes('aria-describedby')) process.exit(2); if(!/role=\"button\"/.test(s)) process.exit(3);"` exits 0.

  **QA Scenarios**:
  ```
  Scenario: SPC page still renders KPI gauge cards
    Tool: Bash
    Steps: cd equipment-monitor; npm test -- src/app/mes/spc/page.test.tsx --runInBand
    Expected: Jest reports SpcPage tests passed.
    Evidence: .sisyphus/evidence/task-5-spc-gauge-jest.txt

  Scenario: SPC gauge remains an accessible keyboard selector
    Tool: Bash
    Steps: cd equipment-monitor; node -e "const fs=require('fs'); const s=fs.readFileSync('src/components/spc/KpiGaugeCard.tsx','utf8'); if(!/onKeyDown/.test(s) || !/aria-pressed/.test(s) || !/aria-describedby/.test(s)) process.exit(1);"
    Expected: Exit code 0.
    Evidence: .sisyphus/evidence/task-5-spc-selector-aria.txt
  ```

  **Commit**: NO | Message: `refactor(equipment-monitor): align spc gauge visuals` | Files: [`equipment-monitor/src/components/spc/KpiGaugeCard.tsx`]

- [x] 6. Add procedural semiconductor fab scene details

  **What to do**: Add `equipment-monitor/src/components/three/FabScenePrimitives.tsx` with reusable procedural components: `CleanroomShell`, `ToolBay`, `UtilityCorridor`, `DataFlowLine`, `StatusBeacon`, and `ZoneAccentLight`. Update `FactoryScene.tsx` to use these primitives around the existing grid: cleanroom perimeter walls, central utility/service core, four tool-bay clusters aligned with current zone positions, overhead/raised utility corridor cues, cyan data-flow lines from each zone to center, and subsystem-colored point lights. Set lighting exactly to: `<ambientLight intensity={0.35} color="#1a2744" />`, key directional light at `[15, 25, 10]` with `intensity={0.9}` and `color="#e8edf5"`, fill directional light at `[-10, 12, -8]` with `intensity={0.3}` and `color="#4a90d9"`, and subsystem accent point lights at each zone center. Update `FactoryCanvas.tsx` camera to `position: [22, 18, 22]` and `fov: 50` for a fuller 4-zone fab overview.
  **Must NOT do**: Do not add GLTF/GLB imports; do not add textures; do not attach store data to `FactoryScene`; do not remove `Grid`, `Line`, or OrbitControls.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: React Three Fiber scene composition and visual design.
  - Skills: [`ui-ux-pro-max`] - Smart factory visual hierarchy and reduced-motion guardrails.
  - Omitted: [`secs-gem-open-source-docs`] - No protocol/domain backend work.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: 7, 9 | Blocked By: 2

  **References**:
  - Canvas wrapper/camera: `equipment-monitor/src/components/three/FactoryCanvas.tsx:50-67`.
  - Current scene: `equipment-monitor/src/components/three/FactoryScene.tsx:18-61`.
  - Current zone positions: `equipment-monitor/src/app/mes/war-room/page.tsx:30-70`.
  - Static export/Three transpile: `equipment-monitor/next.config.ts:3-11`.

  **Acceptance Criteria**:
  - [ ] `cd equipment-monitor && npm run build` exits 0.
  - [ ] `cd equipment-monitor && npm run lint` exits 0.
  - [ ] `cd equipment-monitor && node -e "const fs=require('fs'); const files=['src/components/three/FactoryScene.tsx','src/components/three/FabScenePrimitives.tsx']; const s=files.map(f=>fs.readFileSync(f,'utf8')).join('\n'); if(!s.includes('CleanroomShell')||!s.includes('ToolBay')||!s.includes('UtilityCorridor')||!s.includes('DataFlowLine')) process.exit(1); if(/\.glb|\.gltf/.test(s)) process.exit(2);"` exits 0.

  **QA Scenarios**:
  ```
  Scenario: Procedural fab scene builds for static export
    Tool: Bash
    Steps: cd equipment-monitor; npm run build
    Expected: Next build exits 0 and writes out/.
    Evidence: .sisyphus/evidence/task-6-fab-scene-build.txt

  Scenario: No model asset pipeline was introduced
    Tool: Bash
    Steps: cd equipment-monitor; node -e "const fs=require('fs'), path=require('path'); function walk(d){for(const f of fs.readdirSync(d)){const p=path.join(d,f); const st=fs.statSync(p); if(st.isDirectory()) walk(p); else if(/\.(tsx|ts|js|jsx)$/.test(p)){const s=fs.readFileSync(p,'utf8'); if(/\.glb|\.gltf/.test(s)){console.error(p); process.exit(1);}}}} walk('src');"
    Expected: Exit code 0; no .glb/.gltf references printed.
    Evidence: .sisyphus/evidence/task-6-no-gltf.txt
  ```

  **Commit**: NO | Message: `feat(equipment-monitor): add procedural fab war room scene` | Files: [`equipment-monitor/src/components/three/FactoryScene.tsx`, `equipment-monitor/src/components/three/FabScenePrimitives.tsx`, `equipment-monitor/src/components/three/FactoryCanvas.tsx`]

- [x] 7. Upgrade SubsystemZone alert hierarchy and 3D labels

  **What to do**: Update `SubsystemZone.tsx` so zones expose richer, deterministic alert visuals. Extend props with `alertCount?: number` and `statusLabel?: string`; keep `hasAlert?: boolean` for compatibility and compute active alert state as `hasAlert || alertCount > 0`. Replace raw `ZONE_COLORS` usage with a `ZONE_THEME` map containing CSS token names and fallback hex colors; because Three.js materials need real colors, resolve CSS variables on the client with `getComputedStyle(document.documentElement).getPropertyValue(token)` and fallback to current hex values. Add a second Billboard text line under the zone label showing `statusLabel` or `NOMINAL` / `${alertCount} ALERTS`. Add per-zone sparkles/alert intensity caps: fire count 24 speed 0.42, gas count 20 speed 0.32, power count 16 speed 0.24, building-auto count 0. Keep reduced-motion static. Add exactly four corner L-markers and two crossing floor guide lines per zone using Drei `Line`, colored with the resolved zone color at opacity 0.42.
  **Must NOT do**: Do not rely on `var(...)` strings directly as Three.js material colors; do not make 3D mesh keyboard focus the only accessible control; DOM buttons remain the accessible alternative in Task 8.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: R3F zone interaction and alert animation polish.
  - Skills: [`ui-ux-pro-max`] - Alert hierarchy and reduced-motion rules.
  - Omitted: [`playwright`] - Browser coverage is Task 9.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: 9 | Blocked By: 2, 6

  **References**:
  - Current SubsystemZone implementation: `equipment-monitor/src/components/three/SubsystemZone.tsx:45-131`.
  - Current hardcoded colors: `equipment-monitor/src/components/three/SubsystemZone.tsx:18-23`.
  - Current alert animation: `equipment-monitor/src/components/three/SubsystemZone.tsx:60-75`, `equipment-monitor/src/components/three/SubsystemZone.tsx:118-128`.
  - War-room page zone data/alerts: `equipment-monitor/src/app/mes/war-room/page.tsx:110-118`, `equipment-monitor/src/app/mes/war-room/page.tsx:181-188`.

  **Acceptance Criteria**:
  - [ ] `cd equipment-monitor && npm run build` exits 0.
  - [ ] `cd equipment-monitor && npm run lint` exits 0.
  - [ ] `cd equipment-monitor && node -e "const fs=require('fs'); const s=fs.readFileSync('src/components/three/SubsystemZone.tsx','utf8'); if(!s.includes('alertCount')) process.exit(1); if(!s.includes('statusLabel')) process.exit(2); if(!s.includes('getComputedStyle')) process.exit(3); if(!s.includes('NOMINAL')) process.exit(4);"` exits 0.

  **QA Scenarios**:
  ```
  Scenario: Zone alert hierarchy compiles and remains reduced-motion safe
    Tool: Bash
    Steps: cd equipment-monitor; npm run build
    Expected: Exit code 0; no R3F/Three material color runtime build errors.
    Evidence: .sisyphus/evidence/task-7-zone-build.txt

  Scenario: Three.js color tokens are resolved before material usage
    Tool: Bash
    Steps: cd equipment-monitor; node -e "const fs=require('fs'); const s=fs.readFileSync('src/components/three/SubsystemZone.tsx','utf8'); if(/color=\{`?var\(/.test(s) || /new THREE\.Color\(`?var\(/.test(s)) process.exit(1); if(!s.includes('fallback')) process.exit(2);"
    Expected: Exit code 0.
    Evidence: .sisyphus/evidence/task-7-token-resolution.txt
  ```

  **Commit**: NO | Message: `feat(equipment-monitor): improve war room zone alert visuals` | Files: [`equipment-monitor/src/components/three/SubsystemZone.tsx`, `equipment-monitor/src/app/mes/war-room/page.tsx`]

- [x] 8. Improve war-room accessibility and panel consistency

  **What to do**: Update `src/app/mes/war-room/page.tsx` and all four `src/components/war-room/*Panel.tsx` files for accessible, consistent overlays. In the page, add dynamic `aria-label` text to both header pills and bottom zone cards: include zone label, description, alert/nominal state, and alert count. Track the last clicked zone button with a ref and return focus to it after overlay close. Pass `alertCount` and `statusLabel` into `SubsystemZone`. Add `aria-live="polite"` to a visually hidden war-room status region. In panels, standardize width to `width: 'var(--sf-overlay-width)'` and `minWidth: 'var(--sf-overlay-min-width)'`. Add a shared hook `equipment-monitor/src/hooks/use-dialog-focus-trap.ts` that focuses the first close button on open, traps Tab/Shift+Tab within `[role="dialog"]`, closes on Escape, and restores focus on close; use it in PowerMonitoringPanel, BuildingAutoPanel, GasDetectionPanel, and FireAlarmPanel. Keep existing close buttons and backdrop behavior.
  **Must NOT do**: Do not add a focus-trap dependency; do not alter subsystem mock data; do not change panel content ordering beyond accessibility attributes and width tokens.

  **Recommended Agent Profile**:
  - Category: `uiux-master` - Reason: Accessibility, keyboard behavior, and panel consistency.
  - Skills: [`ui-ux-pro-max`] - Focus states, keyboard navigation, and layout guardrails.
  - Omitted: [`playwright`] - Browser tests are Task 9.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: 9 | Blocked By: 2

  **References**:
  - War-room buttons and overlay: `equipment-monitor/src/app/mes/war-room/page.tsx:146-240`.
  - Power panel dialog/width: `equipment-monitor/src/components/war-room/PowerMonitoringPanel.tsx:253-268`.
  - Building panel dialog/width: `equipment-monitor/src/components/war-room/BuildingAutoPanel.tsx:177-192`.
  - Gas panel dialog/width: `equipment-monitor/src/components/war-room/GasDetectionPanel.tsx:169-184`.
  - Fire panel dialog/width: `equipment-monitor/src/components/war-room/FireAlarmPanel.tsx:232-247`.
  - Existing Escape handling in page: `equipment-monitor/src/app/mes/war-room/page.tsx:98-108`.

  **Acceptance Criteria**:
  - [ ] `cd equipment-monitor && npm run build` exits 0.
  - [ ] `cd equipment-monitor && npm run lint` exits 0.
  - [ ] `cd equipment-monitor && node -e "const fs=require('fs'); const files=['PowerMonitoringPanel.tsx','BuildingAutoPanel.tsx','GasDetectionPanel.tsx','FireAlarmPanel.tsx']; for(const f of files){const s=fs.readFileSync('src/components/war-room/'+f,'utf8'); if(!s.includes('useDialogFocusTrap')) process.exit(1); if(!s.includes('var(--sf-overlay-width)')) process.exit(2);} const page=fs.readFileSync('src/app/mes/war-room/page.tsx','utf8'); if(!page.includes('aria-live=\"polite\"')) process.exit(3);"` exits 0.

  **QA Scenarios**:
  ```
  Scenario: War-room panels share width tokens and focus hook
    Tool: Bash
    Steps: cd equipment-monitor; node -e "const fs=require('fs'); for(const f of ['PowerMonitoringPanel.tsx','BuildingAutoPanel.tsx','GasDetectionPanel.tsx','FireAlarmPanel.tsx']){const s=fs.readFileSync('src/components/war-room/'+f,'utf8'); if(!s.includes('var(--sf-overlay-width)')||!s.includes('useDialogFocusTrap')){console.error(f); process.exit(1);}}"
    Expected: Exit code 0.
    Evidence: .sisyphus/evidence/task-8-panel-consistency.txt

  Scenario: War-room page exposes status to assistive tech
    Tool: Bash
    Steps: cd equipment-monitor; node -e "const fs=require('fs'); const s=fs.readFileSync('src/app/mes/war-room/page.tsx','utf8'); if(!s.includes('aria-live=\"polite\"') || !s.includes('alertCount')) process.exit(1);"
    Expected: Exit code 0.
    Evidence: .sisyphus/evidence/task-8-war-room-aria.txt
  ```

  **Commit**: NO | Message: `fix(equipment-monitor): improve war room accessibility` | Files: [`equipment-monitor/src/app/mes/war-room/page.tsx`, `equipment-monitor/src/hooks/use-dialog-focus-trap.ts`, `equipment-monitor/src/components/war-room/PowerMonitoringPanel.tsx`, `equipment-monitor/src/components/war-room/BuildingAutoPanel.tsx`, `equipment-monitor/src/components/war-room/GasDetectionPanel.tsx`, `equipment-monitor/src/components/war-room/FireAlarmPanel.tsx`]

- [x] 9. Add Playwright specs and CI quality gates

  **What to do**: Add `equipment-monitor/tests/e2e/war-room.spec.ts`, `equipment-monitor/tests/e2e/spc-gauges.spec.ts`, and `equipment-monitor/tests/e2e/webgl-fallback.spec.ts`. War-room spec: visit `/mes/war-room/`, assert `WAR ROOM 3D`, four zone controls, accessible labels, click Power Monitoring, assert `role="dialog"` named Power Monitoring Panel, Tab remains inside dialog, Escape closes and focus returns to the triggering control. SPC spec: visit `/mes/spc/`, assert `data-testid="spc-dashboard"`, five `kpi-gauge-*` tiles, keyboard-select Overlay X using Enter/Space, and assert updated `aria-pressed`. WebGL fallback spec: before visiting war-room, use `page.addInitScript` to override `HTMLCanvasElement.prototype.getContext` so `webgl`/`webgl2` return null; assert fallback role alert with accessible name `WebGL not available` and visible text `WebGL Not Available`. Update `.github/workflows/nextjs.yml` after install to run lint, Jest, build, Playwright browser install, Playwright tests, then upload artifact. Use existing `out/` artifact path.
  **Must NOT do**: Do not assert canvas pixels; do not run Playwright against `next dev`; do not use plain `serve out`; do not broaden tests to unrelated MES pages.

  **Recommended Agent Profile**:
  - Category: `uiux-master` - Reason: Browser-level UI and accessibility verification.
  - Skills: [`playwright`, `ui-ux-pro-max`] - Browser automation and accessibility selectors.
  - Omitted: [`docker-compose-generator`] - No runtime services needed.

  **Parallelization**: Can Parallel: NO | Wave 3 | Blocks: Final verification | Blocked By: 1, 4, 5, 6, 7, 8

  **References**:
  - Playwright foundation from Task 1: `equipment-monitor/playwright.config.ts`.
  - War-room page selectors/content: `equipment-monitor/src/app/mes/war-room/page.tsx:122-240`.
  - WebGL fallback content: `equipment-monitor/src/components/three/WebGLFallback.tsx:19-56`.
  - SPC page/test IDs: `equipment-monitor/src/app/mes/spc/page.tsx:68-79`, `equipment-monitor/src/components/spc/KpiGaugeCard.tsx:127-135`.
  - Current CI workflow: `.github/workflows/nextjs.yml:78-87`.

  **Acceptance Criteria**:
  - [ ] `cd equipment-monitor && npm run lint` exits 0.
  - [ ] `cd equipment-monitor && npm test -- --runInBand` exits 0.
  - [ ] `cd equipment-monitor && npm run build` exits 0.
  - [ ] `cd equipment-monitor && npx playwright test --list` lists `war-room.spec.ts`, `spc-gauges.spec.ts`, and `webgl-fallback.spec.ts`.
  - [ ] `cd equipment-monitor && npx playwright test` exits 0.
  - [ ] `.github/workflows/nextjs.yml` contains lint, Jest, build, Playwright install, and Playwright test steps before upload-pages-artifact.

  **QA Scenarios**:
  ```
  Scenario: War-room and SPC browser QA pass
    Tool: Bash
    Steps: cd equipment-monitor; npm run build; npx playwright test
    Expected: All Playwright specs pass; no canvas screenshot comparisons are executed.
    Evidence: .sisyphus/evidence/task-9-playwright-run.txt

  Scenario: CI gates run before artifact upload
    Tool: Bash
    Steps: node -e "const fs=require('fs'); const s=fs.readFileSync('.github/workflows/nextjs.yml','utf8'); const upload=s.indexOf('upload-pages-artifact'); for(const needle of ['npm run lint','npm test','npx playwright install','npm run test:e2e']){const i=s.indexOf(needle); if(i<0||i>upload){console.error(needle); process.exit(1);}}"
    Expected: Exit code 0.
    Evidence: .sisyphus/evidence/task-9-ci-gates.txt
  ```

  **Commit**: NO | Message: `test(equipment-monitor): add war room and spc browser qa` | Files: [`equipment-monitor/tests/e2e/war-room.spec.ts`, `equipment-monitor/tests/e2e/spc-gauges.spec.ts`, `equipment-monitor/tests/e2e/webgl-fallback.spec.ts`, `.github/workflows/nextjs.yml`]

## Final Verification Wave (MANDATORY — after ALL implementation tasks)
> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.
> **Do NOT auto-proceed after verification. Wait for user's explicit approval before marking work complete.**
> **Never mark F1-F4 as checked before getting user's okay.** Rejection or user feedback -> fix -> re-run -> present again -> wait for okay.
- [x] F1. Plan Compliance Audit — oracle
- [x] F2. Code Quality Review — unspecified-high
- [x] F3. Real Manual QA — unspecified-high (+ playwright)
- [x] F4. Scope Fidelity Check — deep

## Commit Strategy
- Commit after all implementation tasks and verification pass.
- Suggested commit message: `feat(equipment-monitor): align war room 3d and spc gauge design`
- Include changed files under `equipment-monitor/` and `.github/workflows/nextjs.yml` only.

## Success Criteria
- War-room 3D presents a coherent semiconductor fab-like cleanroom model with tool bays, utility corridors, flow lines, controlled lighting, subsystem color hierarchy, and reduced-motion-safe alert effects.
- SPC and war-room/equipment gauges share geometry constants, tokenized visual styling, needle/arc language, text overflow behavior, and accessible status copy while preserving their distinct data logic.
- Playwright covers static-export browser behavior for war-room, SPC gauges, and WebGL fallback without flaky WebGL image comparisons.
- CI runs lint, Jest, build, and Playwright before Pages upload/deploy.
