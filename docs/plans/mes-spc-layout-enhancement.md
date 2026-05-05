# MES SPC Dashboard Layout Enhancement — SmartFactory Design

## TL;DR

> **Quick Summary**: Overhaul the MES SPC Dashboard layout to match Applied SmartFactory reference design — adding circular gauge KPIs, 3D isometric fab floor map, AI recommendations panel, interactive header (notifications/settings/profile), process flow, WIP donut, footer status bar, and Framer Motion animations. Make ALL interactive elements functional with real Zustand state changes and mock SECS messages.
>
> **Deliverables**:
> - Enhanced SPC Dashboard with SmartFactory-style layout (gauge KPIs, AI panel, process flow, WIP donut)
> - New `/mes/equipment` page with 3D isometric fab floor map
> - Fully interactive header (Bell notifications, Settings panel, User profile dropdown)
> - Footer status bar with live clock, AI engine status, device count
> - Extracted design token system (CSS variables replacing inline colors)
> - Framer Motion animations on gauges, cards, transitions
> - Test suite for all new interactive flows
>
> **Estimated Effort**: Large
> **Parallel Execution**: YES — 5 waves
> **Critical Path**: Wave 1 (foundation) → Wave 2 (layout shell + KPIs) → Wave 3 (core features) → Wave 4 (fab map + integration) → Wave 5 (animation + tests)

---

## Context

### Original Request
Enhance the MES SPC Dashboard layout design using 3 reference images (MES_Applied, CoWoS_Applied, Applied_SmartFactory_Dashboard_EMS) and make all button/menu/icon click actions interactive.

### Interview Summary
**Key Discussions**:
- Design target: Applied SmartFactory (Image 3) as primary inspiration — dark ops dashboard with 3D fab map, circular gauges, AI panel
- Interactivity: FULL — every clickable element triggers real behavior
- New page: `/mes/equipment` with 3D isometric fab floor map (CSS 3D transforms, not Three.js)
- AI panel: Interactive Apply/Override buttons that change simulator state + generate SECS messages
- Animation: Add Framer Motion for gauge animations, transitions, hover effects
- Test strategy: Tests after implementation (Jest + agent QA scenarios)

**Research Findings**:
- Existing SPC dashboard is **mostly functional** — simulator, Zustand store, Recharts charts all work
- Header icons (Bell/Settings/User) are **stubs** with no onClick handlers
- KPI strip is **plain text cards** — needs circular gauge rings + sparklines
- No AI recommendations panel exists yet
- No 3D fab floor map exists yet
- Colors are **hardcoded inline** (not in CSS variables) — need token extraction
- Static export (`output: 'export'`) — no SSR issues with Framer Motion
- Lot Tracker is **display-only** — needs clickable rows
- EventLog is **functional but plain** — needs colored icons, search/filter

### Metis Review
**Identified Gaps** (addressed):
- Data source for new components → Zustand store + new mock data slices
- Bell notification content → Mock notification array in store
- Settings panel contents → Slide-out drawer with display settings (refresh rate, animation toggle)
- User dropdown contents → Profile info + Logout (mock, no auth)
- AI Apply/Override SECS messages → S2F49/S2F50 variants already defined in secs-message-log.ts
- 3D map technology → CSS 3D transforms (explicitly not Three.js)
- Responsive strategy → Desktop-first 1920×1080, basic tablet scaling, no mobile-specific UI
- Dark theme → Permanent dark (not toggleable)
- Multiple panels open simultaneously → Only one panel open at a time (Bell/Settings/User close others)

---

## Work Objectives

### Core Objective
Redesign the MES SPC Dashboard to match the Applied SmartFactory visual design while making every interactive element functional with real state changes.

### Concrete Deliverables
- 9 new/replaced components: GaugeKPI, AiRecommendations, FabFloorMap, FooterStatusBar, ProcessFlow, WIPDonutChart, NotificationPanel, UserProfileDropdown, SettingsPanel
- 1 new route: `/mes/equipment`
- Redesigned `/mes/spc` layout integrating all new components
- Enhanced `/mes/lots` with interactive rows
- Redesigned Header component with full interactivity
- Design token CSS variable system
- Framer Motion animation system
- Complete test suite

### Definition of Done
- [ ] All 9 new components render on dashboard at 1920×1080 without horizontal scroll
- [ ] Every clickable element (buttons, icons, menu items, cards) has a non-empty onClick handler
- [ ] Dashboard matches Applied SmartFactory reference layout (dark navy, gauge KPIs, AI panel, footer)
- [ ] `/mes/equipment` route renders FabFloorMap with equipment status badges
- [ ] Framer Motion animations respect `prefers-reduced-motion`
- [ ] Zero inline color hex values in new component files (use CSS variables)
- [ ] All new interactive flows have both Jest tests and Playwright QA scenarios
- [ ] `npm run build` succeeds (static export)
- [ ] Existing SPC simulator flow still works end-to-end (inject fault → violation → acknowledge → resume)

### Must Have
- Circular gauge KPI tiles with progress rings and sparklines
- AI Recommendations panel with Apply/Override buttons wired to Zustand + SECS messages
- 3D isometric fab floor map on `/mes/equipment`
- Bell icon opens notification panel with mock notifications
- Settings gear opens settings drawer
- User icon opens profile dropdown
- Footer status bar with clock, AI engine status, device count
- Process flow step indicator on SPC page
- WIP donut chart showing lot distribution
- Enhanced EventLog with colored icons and search/filter
- Enhanced Lot Tracker with clickable rows and status pills
- Framer Motion entrance animations on gauges and cards
- Design token CSS variables replacing inline hex colors
- All header/menu/button clicks produce real state changes

### Must NOT Have (Guardrails)
- NO Three.js or WebGL for fab map (CSS 3D transforms or SVG only)
- NO real-time SSE/WebSocket for notifications (mock data array only)
- NO authentication/login/logout logic (UI-only dropdown)
- NO backend API endpoints or database persistence
- NO i18n framework (English only)
- NO mobile-specific hamburger menus or touch gestures
- NO chart library migration (keep Recharts 3.7)
- NO premature component abstraction (keep NotificationPanel, SettingsPanel, AIPanel separate)
- NO JSDoc on every new component (document non-obvious props only)
- NO error boundaries per component (one top-level dashboard boundary is sufficient)

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: YES (Jest configured)
- **Automated tests**: YES — Tests after implementation
- **Framework**: Jest + React Testing Library
- **If Tests-after**: Each task will have test files added after implementation is complete

### QA Policy
Every task MUST include agent-executed QA scenarios (see TODO template below).
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Frontend/UI**: Use Playwright — Navigate, interact, assert DOM, screenshot
- **State/Logic**: Use Jest — Test Zustand store actions, component rendering, event handlers
- **Build**: Use Bash — `npm run build` to verify static export succeeds

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — foundation + scaffolding):
├── Task 1: Design token extraction (CSS variables) [quick]
├── Task 2: Zustand store expansion (ai, ui, equipment slices) [quick]
├── Task 3: Install + configure Framer Motion [quick]
├── Task 4: Mock data expansion (AI recommendations, equipment, notifications) [quick]
├── Task 5: SECS message expansion (AI action S2F49/S2F50 variants) [quick]

Wave 2 (After Wave 1 — layout shell + core UI, MAX PARALLEL):
├── Task 6: Enhanced Header (Bell dropdown, Settings drawer, User profile) [unspecified-high]
├── Task 7: GaugeKPI component (circular progress ring + sparkline + trend delta) [visual-engineering]
├── Task 8: FooterStatusBar component [quick]
├── Task 9: ProcessFlow component (horizontal step indicator) [visual-engineering]
├── Task 10: WIPDonutChart component (lot status distribution) [visual-engineering]

Wave 3 (After Wave 2 — interactive panels + enhanced views, MAX PARALLEL):
├── Task 11: AiRecommendations panel (interactive Apply/Override) [deep]
├── Task 12: NotificationPanel (Bell dropdown with mock notifications) [unspecified-high]
├── Task 13: Enhanced EventLog (colored icons, search/filter, auto-scroll) [unspecified-high]
├── Task 14: Enhanced Lot Tracker (clickable rows, status pills) [unspecified-high]

Wave 4 (After Wave 3 — major new page + integration):
├── Task 15: FabFloorMap component (CSS 3D isometric equipment visualization) [deep]
├── Task 16: /mes/equipment page (route + layout + FabFloorMap) [unspecified-high]
├── Task 17: SPC Dashboard layout overhaul (integrate all new components) [deep]
├── Task 18: Framer Motion animation polish (gauges, cards, transitions) [visual-engineering]

Wave 5 (After Wave 4 — tests):
├── Task 19: Component tests (Jest + RTL for all new components) [unspecified-high]
├── Task 20: Integration tests (interactive flows end-to-end) [unspecified-high]

Wave FINAL (After ALL tasks — 4 parallel reviews):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real manual QA (unspecified-high + playwright)
├── Task F4: Scope fidelity check (deep)
→ Present results → Get explicit user okay

Critical Path: Task 1 → Task 7 → Task 17 → Task 20 → F1-F4 → user okay
Parallel Speedup: ~65% faster than sequential
Max Concurrent: 5 (Waves 1 & 2)
```

### Dependency Matrix

| Task | Depends On | Blocks |
|------|-----------|--------|
| 1 | — | 6, 7, 8, 9, 10 |
| 2 | — | 11, 12, 15, 16 |
| 3 | — | 18 |
| 4 | 2 | 11, 15, 16 |
| 5 | — | 11 |
| 6 | 1 | 17 |
| 7 | 1, 4 | 17 |
| 8 | 1 | 17 |
| 9 | 1 | 17 |
| 10 | 2, 4 | 17 |
| 11 | 2, 4, 5 | 17 |
| 12 | 2, 4 | 17 |
| 13 | 1 | 17 |
| 14 | 2 | 17 |
| 15 | 2, 4 | 16, 17 |
| 16 | 15 | 17 |
| 17 | 6, 7, 8, 9, 10, 11, 12, 13, 14, 15 | 18, 19, 20 |
| 18 | 3, 17 | 19, 20 |
| 19 | 17, 18 | — |
| 20 | 17 | — |

### Agent Dispatch Summary

- **Wave 1**: 5 tasks — T1-T4 → `quick`, T5 → `quick`
- **Wave 2**: 5 tasks — T6 → `unspecified-high`, T7 → `visual-engineering`, T8 → `quick`, T9 → `visual-engineering`, T10 → `visual-engineering`
- **Wave 3**: 4 tasks — T11 → `deep`, T12 → `unspecified-high`, T13 → `unspecified-high`, T14 → `unspecified-high`
- **Wave 4**: 4 tasks — T15 → `deep`, T16 → `unspecified-high`, T17 → `deep`, T18 → `visual-engineering`
- **Wave 5**: 2 tasks — T19 → `unspecified-high`, T20 → `unspecified-high`
- **FINAL**: 4 tasks — F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high`, F4 → `deep`

---

## TODOs

- [x] 1. Design Token Extraction (CSS Variables)

  **What to do**:
  - Extract all inline hex colors from existing components into CSS custom properties in `globals.css` using `--smartfactory-*` prefix
  - Define token categories: `--smartfactory-bg-*`, `--smartfactory-surface-*`, `--smartfactory-border-*`, `--smartfactory-text-*`, `--smartfactory-accent-*`, `--smartfactory-status-*`
  - Map existing colors: `#0A1628` → `--smartfactory-bg-base`, `#111D2E` → `--smartfactory-surface-card`, `#182840` → `--smartfactory-surface-elevated`, `#1E3A5F` → `--smartfactory-border-default`, `#2563EB` → `--smartfactory-border-active`, `#F47920` → `--smartfactory-accent-orange`, `#3B82F6` → `--smartfactory-accent-blue`, `#14B8A6` → `--smartfactory-accent-teal`, `#22D3EE` → `--smartfactory-accent-cyan`, `#8B5CF6` → `--smartfactory-accent-violet`, `#10B981` → `--smartfactory-status-green`, `#F59E0B` → `--smartfactory-status-amber`, `#EF4444` → `--smartfactory-status-red`, `#F1F5F9` → `--smartfactory-text-primary`, `#94A3B8` → `--smartfactory-text-secondary`, `#475569` → `--smartfactory-text-muted`
  - Add new SmartFactory tokens from reference: `#0B0F19` (canvas), `#151B2B` (panel), `#1A2236` (panel-alt), `#00E676` (neon-green), `#2979FF` (electric-blue), `#FF1744` (neon-red), `#FFC107` (neon-amber)
  - Update existing components to use CSS variables instead of inline hex values (KpiStrip, ControlChart, ThumbnailChart, ViolationCard, FaultInjector, EventLog, spc/page.tsx)
  - Add Tailwind config to reference CSS variables where needed
  - Verify existing SPC demo flow still works after token extraction

  **Must NOT do**:
  - Do NOT change any visual appearance — pure refactor, pixel-identical before and after
  - Do NOT add new components (that's later tasks)
  - Do NOT modify simulator logic or store behavior

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Refactoring task with clear 1:1 mapping between inline colors and CSS variables
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3, 4, 5)
  - **Blocks**: Tasks 6, 7, 8, 9, 10 (all UI components need tokens)
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References** (existing code to follow):
  - `equipment-monitor/src/app/globals.css` — Current CSS variable pattern (oklch-based `:root` and `.dark` blocks); add new `--smartfactory-*` tokens following this pattern
  - `equipment-monitor/src/components/spc/KpiStrip.tsx` — Inline color usage (`bg-[#111D2E]`, `text-[#94A3B8]`, etc.) that needs token replacement
  - `equipment-monitor/src/components/spc/ControlChart.tsx` — Inline color usage for chart elements (`#EF4444`, `#F59E0B`, `#3B82F6`)
  - `equipment-monitor/src/components/spc/ViolationCard.tsx` — Inline color usage (`bg-red-950`, `border-[#EF4444]`)

  **API/Type References**:
  - `equipment-monitor/tailwind.config.ts` — Tailwind v4 config; may need theme extension to reference CSS variables

  **Why Each Reference Matters**:
  - `globals.css`: Establishes the pattern for CSS custom properties — new tokens must follow the same oklch/var approach
  - `KpiStrip.tsx`, `ControlChart.tsx`, `ViolationCard.tsx`: These are the primary files with inline hex colors that need extraction; understanding their color usage patterns ensures no visual regression

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Design tokens defined and used
    Tool: Bash (grep)
    Preconditions: Design token extraction complete
    Steps:
      1. Run: `grep -r "#0A1628\|#111D2E\|#182840\|#1E3A5F\|#F47920\|#3B82F6\|#14B8A6\|#EF4444\|#F59E0B\|#F1F5F9\|#94A3B8\|#475569" equipment-monitor/src/components/ equipment-monitor/src/app/mes/` | grep -v "globals.css"
      2. Assert: grep returns 0 lines (all inline hex replaced with CSS vars)
    Expected Result: Zero inline hex color values in component files
    Failure Indicators: Any grep matches mean inline colors remain
    Evidence: .sisyphus/evidence/task-1-token-grep.txt

  Scenario: Existing SPC flow still works after refactor
    Tool: Playwright
    Preconditions: npm run build succeeds
    Steps:
      1. Navigate to /mes/spc
      2. Assert: KPI strip displays 5 parameter cards
      3. Assert: Control chart renders with data points
      4. Click "Inject Fault" → select "Sudden Shift" → click Inject
      5. Assert: Red violation dot appears on chart
      6. Assert: Violation card appears below chart
    Expected Result: SPC demo flow works identically to pre-refactor
    Failure Indicators: Missing components, broken colors, white backgrounds
    Evidence: .sisyphus/evidence/task-1-spc-flow.png
  ```

  **Commit**: YES (groups with Wave 1)
  - Message: `feat(mes): extract design tokens to CSS variables`
  - Files: `globals.css`, `KpiStrip.tsx`, `ControlChart.tsx`, `ThumbnailChart.tsx`, `ViolationCard.tsx`, `FaultInjector.tsx`, `EventLog.tsx`, `spc/page.tsx`, `tailwind.config.ts`
  - Pre-commit: `cd equipment-monitor && npm run build`

- [x] 2. Zustand Store Expansion (ai, ui, equipment slices)

  **What to do**:
  - Add `ai` slice to `mes-spc-store.ts` with: `recommendations: AiRecommendation[]`, `addRecommendation()`, `applyRecommendation(id)`, `overrideRecommendation(id)`, `dismissRecommendation(id)`
  - Add `ui` slice: `notifications: Notification[]`, `isNotificationPanelOpen: boolean`, `isSettingsPanelOpen: boolean`, `isUserDropdownOpen: boolean`, `settings: { refreshInterval: number, showAnimations: boolean, compactMode: boolean }`, `toggleNotificationPanel()`, `toggleSettingsPanel()`, `toggleUserDropdown()`, `closeAllPanels()`, `addNotification()`, `dismissNotification()`, `updateSettings()`
  - Add `equipment` slice: `equipments: Equipment[]`, `selectedEquipmentId: string | null`, `setSelectedEquipment()`
  - Define types in `mes-types.ts`: `AiRecommendation` (id, type, title, description, confidence, impact, status, createdAt), `Notification` (id, type, severity, title, message, timestamp, read), `Equipment` (id, name, type, status, x, y, zone, powerKw, recipe, currentWafer, totalWafers)
  - Ensure backward compatibility — existing store actions (startProcessing, injectFault, etc.) must continue working unchanged

  **Must NOT do**:
  - Do NOT remove or modify existing store fields or actions
  - Do NOT change existing type definitions for Lot, Recipe, SpcMeasurement, etc.
  - Do NOT add backend persistence (all in-memory)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Additive changes to existing Zustand store with clear type definitions
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3, 4, 5)
  - **Blocks**: Tasks 4, 11, 12, 14, 15, 16
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References**:
  - `equipment-monitor/src/stores/mes-spc-store.ts` — Current Zustand store pattern; follow the same `create()` with typed interface approach
  - `equipment-monitor/src/lib/mes-types.ts` — Current type definitions; add new types following established naming conventions

  **Why Each Reference Matters**:
  - Store file shows the exact pattern for adding new slices without breaking existing ones
  - Types file shows the naming conventions (PascalCase for interfaces, camelCase for fields)

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Store slices work without breaking existing functionality
    Tool: Jest
    Preconditions: Store expansion complete
    Steps:
      1. Import `useMesSpcStore` in a test file
      2. Test: `store.ai.recommendations` starts as empty array
      3. Test: `store.ai.addRecommendation({type: 'energy', ...})` adds to array
      4. Test: `store.ai.applyRecommendation(id)` sets status to 'applied'
      5. Test: `store.ui.toggleNotificationPanel()` flips boolean
      6. Test: `store.ui.closeAllPanels()` sets all booleans to false
      7. Test: existing `store.startProcessing()` still works
      8. Test: existing `store.injectFault()` still works
    Expected Result: All new slices initialize correctly, all existing slices unchanged
    Failure Indicators: Any existing action throws or returns unexpected value
    Evidence: .sisyphus/evidence/task-2-store-test.txt

  Scenario: TypeScript compilation succeeds
    Tool: Bash
    Preconditions: Store and types added
    Steps:
      1. Run: `cd equipment-monitor && npx tsc --noEmit`
      2. Assert: Exit code 0, no type errors
    Expected Result: Clean TypeScript compilation
    Failure Indicators: Type errors in store or types
    Evidence: .sisyphus/evidence/task-2-tsc.txt
  ```

  **Commit**: YES (groups with Wave 1)
  - Message: `feat(mes): add ai, ui, and equipment store slices`
  - Files: `mes-spc-store.ts`, `mes-types.ts`
  - Pre-commit: `cd equipment-monitor && npx tsc --noEmit`

- [x] 3. Install + Configure Framer Motion

  **What to do**:
  - Run `npm install framer-motion` in `equipment-monitor/`
  - Add Framer Motion to `package.json` dependencies
  - Create `equipment-monitor/src/lib/animation.ts` utility file with:
    - `springConfig` preset (stiffness: 300, damping: 25)
    - `transitionConfig` for page transitions
    - `variants` for common animations: `fadeInUp`, `fadeIn`, `slideInRight`, `scaleIn`, `pulseGlow`
    - `useReducedMotion` hook that checks `prefers-reduced-motion` and returns static variants when true
  - Verify that Framer Motion works with `output: 'export'` in `next.config.ts` (it should, since all pages use `'use client'`)
  - Add Framer Motion to any existing component that needs entrance animation (deferred to Task 18)

  **Must NOT do**:
  - Do NOT add Three.js or any other 3D library
  - Do NOT add animation to existing components yet (Task 18)
  - Do NOT modify `next.config.ts` output setting

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Package install + utility file creation, straightforward
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 4, 5)
  - **Blocks**: Task 18 (animation polish)
  - **Blocked By**: None (can start immediately)

  **References**:

  **External References**:
  - Framer Motion docs: https://www.framer.com/motion/ — API for `motion`, `variants`, `AnimatePresence`
  - Next.js static export + Framer Motion: verify `'use client'` directive compatibility

  **Why Each Reference Matters**:
  - Ensures animation utilities follow Framer Motion idioms correctly

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Framer Motion installed and importable
    Tool: Bash
    Preconditions: Package installed
    Steps:
      1. Run: `cd equipment-monitor && node -e "require('framer-motion'); console.log('OK')"`
      2. Assert: Output is "OK"
      3. Run: `cd equipment-monitor && npm run build`
      4. Assert: Build succeeds without Framer Motion errors
    Expected Result: Package installed and builds successfully
    Failure Indicators: Import errors, build errors
    Evidence: .sisyphus/evidence/task-3-framer-install.txt

  Scenario: Animation utilities work with reduced motion
    Tool: Jest
    Preconditions: animation.ts utility file created
    Steps:
      1. Import `useReducedMotion`, `springConfig`, `variants` from animation.ts
      2. Test: `useReducedMotion` returns static variants when `prefers-reduced-motion: reduce`
      3. Test: `variants.fadeInUp` has correct `initial` and `animate` keys
    Expected Result: All utilities export correctly and respect reduced motion
    Failure Indicators: Missing exports, incorrect variant structure
    Evidence: .sisyphus/evidence/task-3-animation-utils.txt
  ```

  **Commit**: YES (groups with Wave 1)
  - Message: `feat(mes): install framer-motion and add animation utilities`
  - Files: `package.json`, `package-lock.json`, `src/lib/animation.ts`
  - Pre-commit: `cd equipment-monitor && npm run build`

- [x] 4. Mock Data Expansion (AI recommendations, equipment, notifications)

  **What to do**:
  - Add mock AI recommendations to `mes-mock-data.ts` (6 items covering each type: energy, predictive-maintenance, production-optimization, carbon-reduction, quality, scheduling)
  - Each recommendation has: id, type, title, description, confidence (85-97%), impact statement, status ('pending'), createdAt timestamp
  - Add mock equipment data: 8 equipment entries (2 lithography scanners, 2 coaters, 2 developers, 1 inspection metrology, 1 CMP) with x/y positions for fab map layout, zone assignments, power consumption, status (running/idle/down)
  - Add mock notifications: 5 items covering different severities (critical, warning, info) with realistic semiconductor content (SECS events, SPC alerts, lot status changes)
  - All mock data must be deterministic (no random values that change between renders)

  **Must NOT do**:
  - Do NOT create new files — add to existing `mes-mock-data.ts`
  - Do NOT import from external APIs
  - Do NOT modify existing mock data structures

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Data structure creation with clear schema from user requirements
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (but needs Task 2 types first for type safety)
  - **Parallel Group**: Wave 1 (with Tasks 1, 3, 5)
  - **Blocks**: Tasks 7, 10, 11, 12, 15
  - **Blocked By**: Task 2 (needs type definitions)

  **References**:

  **Pattern References**:
  - `equipment-monitor/src/lib/mes-mock-data.ts` — Existing mock data pattern (seed measurements with FNV-1a deterministic noise); follow same structure and naming conventions

  **API/Type References**:
  - `equipment-monitor/src/lib/mes-types.ts` — Type definitions (to be expanded in Task 2); use the same PascalCase interface naming

  **Why Each Reference Matters**:
  - Mock data file shows the established pattern for creating realistic deterministic data

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Mock data exports correctly
    Tool: Jest
    Preconditions: Mock data added
    Steps:
      1. Import mock data from mes-mock-data.ts
      2. Assert: `MOCK_AI_RECOMMENDATIONS` has 6 items
      3. Assert: Each item has id, type, title, description, confidence, impact, status, createdAt
      4. Assert: `MOCK_EQUIPMENT` has 8 items
      5. Assert: Each equipment has id, name, type, status, x, y, zone, powerKw
      6. Assert: `MOCK_NOTIFICATIONS` has 5 items
      7. Assert: Each notification has id, type, severity, title, message, timestamp, read
    Expected Result: All mock data arrays have correct length and structure
    Failure Indicators: Missing fields, wrong array lengths, undefined values
    Evidence: .sisyphus/evidence/task-4-mock-data.txt
  ```

  **Commit**: YES (groups with Wave 1)
  - Message: `feat(mes): add mock data for AI recommendations, equipment, and notifications`
  - Files: `mes-mock-data.ts`
  - Pre-commit: `cd equipment-monitor && npx tsc --noEmit`

- [x] 5. SECS Message Expansion (AI action S2F49/S2F50 variants)

  **What to do**:
  - Add to `secs-message-log.ts`: `makeS2F49ApplyRecommendation(recommendationId, rcmd)` — generates S2F49 with RCMD for applying an AI recommendation (e.g., "SHIFT_MAINTENANCE", "ADJUST_RECIPE", "OPTIMIZE_BATCH")
  - Add: `makeS2F50ApplyAck(recommendationId)` — S2F50 acknowledgment with HCACK=0 (accepted)
  - Add: `makeS2F49OverrideRecommendation(recommendationId, rcmd)` — S2F49 for manual override
  - Add: `makeS2F50OverrideAck(recommendationId)` — S2F50 with HCACK=1 (override acknowledged)
  - Add: `makeS6F11Notification(eventType, data)` — S6F11 for notification events (alarm, warning, info)
  - Each function returns the same typed structure as existing `makeS2F41*` and `makeS2F42*` functions
  - Ensure all new functions follow the existing pattern in `secs-message-log.ts`

  **Must NOT do**:
  - Do NOT modify existing S2F41/S2F42/S2F49/S2F50 functions
  - Do NOT add real HSMS connection logic
  - Do NOT change the existing `SecsEvent` type

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Additive functions following existing pattern
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 3, 4)
  - **Blocks**: Task 11 (AI panel needs these messages)
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References**:
  - `equipment-monitor/src/lib/secs-message-log.ts` — Existing SECS message factory functions (`makeS2F41Stop`, `makeS2F41Resume`, `makeS2F42Ack`, `makeS2F49`, `makeS2F50`); follow exact same pattern

  **Why Each Reference Matters**:
  - Must follow the exact function signature and return type pattern for consistency

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: New SECS message generators produce correct structure
    Tool: Jest
    Preconditions: Functions added
    Steps:
      1. Import new functions from secs-message-log.ts
      2. Call `makeS2F49ApplyRecommendation('rec-001', 'SHIFT_MAINTENANCE')`
      3. Assert: result.type === 's2f49_apply'
      4. Assert: result.secsMessage.stream === 2 && result.secsMessage.function === 49
      5. Call `makeS2F50ApplyAck('rec-001')`
      6. Assert: result.secsMessage.hcack === 0
      7. Call `makeS2F49OverrideRecommendation('rec-002', 'MANUAL_OVERRIDE')`
      8. Assert: result.type === 's2f49_override'
      9. Call `makeS6F11Notification('alarm', {equipmentId: 'LITHO-01', message: 'Test'})
      10. Assert: result.secsMessage.stream === 6
    Expected Result: All functions return correct SECS message structures
    Failure Indicators: Wrong stream/function numbers, missing fields
    Evidence: .sisyphus/evidence/task-5-secs-messages.txt
  ```

  **Commit**: YES (groups with Wave 1)
  - Message: `feat(mes): add SECS message generators for AI actions and notifications`
  - Files: `secs-message-log.ts`
  - Pre-commit: `cd equipment-monitor && npx tsc --noEmit`

- [x] 6. Enhanced Header (Bell dropdown, Settings drawer, User profile)

  **What to do**:
  - Rewrite `equipment-monitor/src/components/layout/header.tsx` with full SmartFactory design
  - Replace plain text "EM" logo with Styled "AM" box (Applied Materials style) with wordmark
  - Add live clock display ( HH:MM:SS ) next to date
  - Bell icon: onClick toggles `useMesSpcStore().ui.isNotificationPanelOpen`, shows notification count badge, renders `NotificationPanel` dropdown
  - Settings gear icon: onClick toggles `useMesSpcStore().ui.isSettingsPanelOpen`, renders `SettingsPanel` drawer
  - User icon: onClick toggles `useMesSpcStore().ui.isUserDropdownOpen`, renders `UserProfileDropdown`
  - Mutual exclusion: opening one panel closes others (use `closeAllPanels()` before toggling)
  - Close panels on outside click (useEffect with document click listener)
  - Use design tokens for all colors (no inline hex)
  - Add `data-testid` attributes for QA: `bell-icon`, `settings-icon`, `user-icon`, `notification-panel`, `settings-panel`, `user-dropdown`

  **Must NOT do**:
  - Do NOT add real authentication or logout logic
  - Do NOT add real notification backend (use mock data)
  - Do NOT add routing for settings (just a slide-out UI panel)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Multi-component integration with state management and click-outside patterns
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 7, 8, 9, 10)
  - **Blocks**: Task 17 (SPC dashboard assembly)
  - **Blocked By**: Task 1 (design tokens), Task 2 (store slices)

  **References**:

  **Pattern References**:
  - `equipment-monitor/src/components/layout/header.tsx` — Current header structure; preserve layout but add interactive behavior
  - `equipment-monitor/src/components/ui/button.tsx` — Use existing Button component for icon buttons
  - `equipment-monitor/src/components/ui/badge.tsx` — Use existing Badge component for notification count

  **API/Type References**:
  - `equipment-monitor/src/stores/mes-spc-store.ts` — New `ui` slice with `toggleNotificationPanel()`, `toggleSettingsPanel()`, `toggleUserDropdown()`, `closeAllPanels()`

  **Why Each Reference Matters**:
  - Header is the primary navigation component and must integrate with existing layout
  - Store UI slice provides the state management for panel visibility

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Bell icon opens notification panel
    Tool: Playwright
    Preconditions: Dashboard loaded at /mes/spc
    Steps:
      1. Click element with data-testid="bell-icon"
      2. Assert: Element with data-testid="notification-panel" is visible
      3. Assert: Notification panel contains at least 1 notification item
      4. Click element with data-testid="bell-icon" again
      5. Assert: Notification panel is NOT visible
    Expected Result: Bell toggles notification panel visibility
    Failure Indicators: Panel doesn't appear, or doesn't close on second click
    Evidence: .sisyphus/evidence/task-6-bell-toggle.png

  Scenario: Settings gear opens settings panel, closes notification panel
    Tool: Playwright
    Preconditions: Dashboard loaded
    Steps:
      1. Click data-testid="bell-icon" (panel opens)
      2. Click data-testid="settings-icon"
      3. Assert: data-testid="settings-panel" is visible
      4. Assert: data-testid="notification-panel" is NOT visible
    Expected Result: Opening settings closes notifications (mutual exclusion)
    Failure Indicators: Both panels visible simultaneously
    Evidence: .sisyphus/evidence/task-6-mutual-exclusion.png

  Scenario: User profile dropdown shows menu items
    Tool: Playwright
    Preconditions: Dashboard loaded
    Steps:
      1. Click data-testid="user-icon"
      2. Assert: data-testid="user-dropdown" is visible
      3. Assert: Dropdown contains at least "Profile" and "Settings" items
      4. Click outside the dropdown
      5. Assert: Dropdown is NOT visible
    Expected Result: User dropdown shows menu and closes on outside click
    Failure Indicators: Dropdown doesn't appear or doesn't close
    Evidence: .sisyphus/evidence/task-6-user-dropdown.png
  ```

  **Commit**: YES (groups with Wave 2)
  - Message: `feat(mes): enhance header with interactive notification, settings, and profile panels`
  - Files: `header.tsx`, new `NotificationPanel.tsx`, `SettingsPanel.tsx`, `UserProfileDropdown.tsx`
  - Pre-commit: `cd equipment-monitor && npm run build`

- [x] 7. GaugeKPI Component (circular progress ring + sparkline + trend delta)

  **What to do**:
  - Create `equipment-monitor/src/components/spc/KpiGaugeCard.tsx`
  - Design: SmartFactory-style gauge card with circular progress ring (SVG-based), large metric value in center (Fira Code 600), trend delta with colored triangle (▲ green / ▼ red), sparkline (last 10 values), sub-metrics footer row (3 columns with dividers)
  - Take `SpcParameter` type and render 5 parameter cards in a row replacing `KpiStrip`
  - Each card shows: parameter label, current value + unit, OK/OOC status pill, circular progress ring (% to target), sparkline of recent measurements, trend delta vs previous wafer
  - Progress ring color: green when OK, red when OOC, amber when within 2-sigma
  - Use design tokens for all colors
  - Use Framer Motion `motion.div` with `fadeInUp` variant for entrance animation
  - Responsive: 5 columns at ≥1280px, 3 at ≥768px, 2 at ≥375px
  - Add `data-testid="kpi-gauge-{param}"` for each card

  **Must NOT do**:
  - Do NOT delete `KpiStrip.tsx` yet (it's replaced in Task 17)
  - Do NOT use Canvas or WebGL for gauges — SVG only
  - Do NOT add animation library other than Framer Motion

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Complex visual component with SVG, animation, responsive layout
  - **Skills**: [`ui-ux-pro-max`]
    - `ui-ux-pro-max`: Gauge card design follows specific reference layout patterns

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 6, 8, 9, 10)
  - **Blocks**: Task 17 (SPC dashboard assembly)
  - **Blocked By**: Task 1 (design tokens), Task 4 (mock data for sparkline values)

  **References**:

  **Pattern References**:
  - `equipment-monitor/src/components/spc/KpiStrip.tsx` — Current KPI component being replaced; replicate data flow but with new visual design
  - `equipment-monitor/src/lib/spc-parameters.ts` — Parameter config with target/sigma/ucl/lcl for progress ring calculation

  **API/Type References**:
  - `equipment-monitor/src/lib/mes-types.ts` — `SpcParameter` type, `SpcMeasurement` for measurement data

  **External References**:
  - Reference Image 3 (Applied SmartFactory): Gauge cards with circular progress ring, large centered metric, sub-metric footer, trend arrows
  - Recharts `<PieChart>` with inner radius for donut/ring effect (alternative to raw SVG)

  **Why Each Reference Matters**:
  - KpiStrip shows the current data interface; KpiGaugeCard must accept the same props pattern for easy replacement
  - SPC parameters provide target/sigma values needed to compute progress ring percentage

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Gauge KPI cards render with correct data
    Tool: Playwright
    Preconditions: Dashboard loaded at /mes/spc with seeded data
    Steps:
      1. Assert: 5 gauge cards visible (CD, CDU, OVL-X, OVL-Y, LER)
      2. Assert: Each card shows circular progress ring (SVG circle element)
      3. Assert: Each card shows current value with unit (e.g., "45.02 nm")
      4. Assert: Each card shows OK/OOC status
      5. Assert: Cards use design tokens (no inline hex colors)
    Expected Result: 5 gauge cards render with correct visual hierarchy
    Failure Indicators: Missing cards, no progress rings, wrong colors, blank values
    Evidence: .sisyphus/evidence/task-7-gauge-kpi.png

  Scenario: Gauge KPI responds to parameter active state
    Tool: Playwright
    Preconditions: Dashboard loaded
    Steps:
      1. Click on CD gauge card
      2. Assert: CD card has active/focused visual state (border highlight)
      3. Assert: Control chart below shows CD data
      4. Click on OVL-X gauge card
      5. Assert: OVL-X card shows active state
      6. Assert: Control chart switches to OVL-X data
    Expected Result: Clicking gauge card switches active parameter
    Failure Indicators: Chart doesn't update, no active state indication
    Evidence: .sisyphus/evidence/task-7-gauge-click.png
  ```

  **Commit**: YES (groups with Wave 2)
  - Message: `feat(mes): add GaugeKPI component with circular progress ring`
  - Files: `KpiGaugeCard.tsx`
  - Pre-commit: `cd equipment-monitor && npx tsc --noEmit`

- [x] 8. FooterStatusBar Component

  **What to do**:
  - Create `equipment-monitor/src/components/spc/FooterStatusBar.tsx`
  - SmartFactory-style dark footer strip: full width, `h-10`, dark navy background
  - Content in 4 segments separated by pipe dividers:
    1. "SmartFactory Intelligence Platform v1.0" (left)
    2. Green dot + "AI Engine: Active" (center-left)
    3. Blue dot + "Data Refresh: 2s" (center-right)
    4. Green dot + "Connected: X devices" (right)
  - Live clock updating every second (HH:MM:SS) at far right
  - Use design tokens for all colors
  - Add `data-testid="footer-status-bar"`

  **Must NOT do**:
  - Do NOT add real WebSocket/SSE connection status
  - Do NOT make footer height larger than `h-10`

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple display component with static content and a live clock
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 6, 7, 9, 10)
  - **Blocks**: Task 17 (SPC dashboard assembly)
  - **Blocked By**: Task 1 (design tokens)

  **References**:

  **Pattern References**:
  - Reference Image 3 (Applied SmartFactory): Footer bar with version, AI status, data refresh, device count, uptime

  **Why Each Reference Matters**:
  - Provides exact visual target for footer layout and content

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Footer status bar renders with all segments
    Tool: Playwright
    Preconditions: Dashboard loaded
    Steps:
      1. Assert: data-testid="footer-status-bar" is visible
      2. Assert: Contains "SmartFactory Intelligence Platform"
      3. Assert: Contains "AI Engine:"
      4. Assert: Contains "Data Refresh:"
      5. Assert: Contains "Connected:"
      6. Assert: Live clock shows current time in HH:MM:SS format
      7. Wait 2 seconds, assert clock time has updated
    Expected Result: Footer renders all 4 segments with live clock
    Failure Indicators: Missing segments, static clock, wrong colors
    Evidence: .sisyphus/evidence/task-8-footer.png
  ```

  **Commit**: YES (groups with Wave 2)
  - Message: `feat(mes): add FooterStatusBar component`
  - Files: `FooterStatusBar.tsx`
  - Pre-commit: `cd equipment-monitor && npx tsc --noEmit`

- [x] 9. ProcessFlow Component (horizontal step indicator)

  **What to do**:
  - Create `equipment-monitor/src/components/spc/ProcessFlow.tsx`
  - SmartFactory-style process flow: 5 horizontal step nodes with arrows between them
  - Steps: COAT → EXPOSE → DEVELOP → METROLOGY → SPC EVAL
  - Each node is a rounded rectangle with: step icon (Lucide), step name, equipment name, status badge (Running green / Idle amber / Down red)
  - Active step has blue border glow, completed steps have green checkmark
  - Arrows between nodes using SVG or CSS
  - Use design tokens and Framer Motion entrance animation
  - Add `data-testid="process-flow"`

  **Must NOT do**:
  - Do NOT make nodes clickable routing targets (display only)
  - Do NOT add real process execution logic

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Visual component with custom layout and animations
  - **Skills**: [`ui-ux-pro-max`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 6, 7, 8, 10)
  - **Blocks**: Task 17 (SPC dashboard assembly)
  - **Blocked By**: Task 1 (design tokens), Task 2 (equipment data)

  **References**:

  **Pattern References**:
  - Reference Image 1 (MES Applied): Process flow nodes with green/amber/red backgrounds and status badges
  - Reference Image 3 (SmartFactory): Footer strip style and step tracker pattern

  **Why Each Reference Matters**:
  - Shows exact visual style for step nodes with colored backgrounds

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Process flow renders 5 steps with correct status colors
    Tool: Playwright
    Preconditions: Dashboard loaded with simulator running
    Steps:
      1. Assert: data-testid="process-flow" is visible
      2. Assert: 5 step nodes visible (COAT, EXPOSE, DEVELOP, METROLOGY, SPC EVAL)
      3. Assert: Arrows/connectors between each node
      4. Assert: Each node shows equipment name and status badge
      5. Assert: Status badge colors match equipment state (green=running, amber=idle, red=down)
    Expected Result: 5-step process flow with status badges
    Failure Indicators: Missing nodes, no arrows, wrong status colors
    Evidence: .sisyphus/evidence/task-9-process-flow.png
  ```

  **Commit**: YES (groups with Wave 2)
  - Message: `feat(mes): add ProcessFlow component with step indicators`
  - Files: `ProcessFlow.tsx`
  - Pre-commit: `cd equipment-monitor && npx tsc --noEmit`

- [x] 10. WIPDonutChart Component (lot status distribution)

  **What to do**:
  - Create `equipment-monitor/src/components/spc/WipDonutChart.tsx`
  - SmartFactory-style donut chart: total lot count in center, colored segments around
  - Segments: Running (green), Idle (amber), On Hold (red), Completed (blue-gray)
  - Legend on right side: colored dot + label + count + percentage
  - Center shows "N Total Lots" in large font
  - Uses Recharts `<PieChart>` with inner radius for donut effect
  - Reads from `useMesSpcStore().lots` to compute status distribution
  - Framer Motion entrance animation (scaleIn variant)
  - Use design tokens for colors
  - Add `data-testid="wip-donut"`

  **Must NOT do**:
  - Do NOT add real-time polling or backend connection
  - Do NOT use Canvas/WebGL — Recharts PieChart only

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Chart component with Recharts integration and animation
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 6, 7, 8, 9)
  - **Blocks**: Task 17 (SPC dashboard assembly)
  - **Blocked By**: Task 2 (store with lots data), Task 4 (mock lot data)

  **References**:

  **Pattern References**:
  - `equipment-monitor/src/components/spc/ControlChart.tsx` — Existing Recharts usage pattern; follow same import style and data binding approach
  - Reference Image 3 (SmartFactory): WIP donut chart with Running/Idle/Hold segments

  **API/Type References**:
  - `equipment-monitor/src/stores/mes-spc-store.ts` — `lots` array with `status` field ('in_process', 'on_hold', 'completed', 'queued')

  **Why Each Reference Matters**:
  - ControlChart shows the established Recharts pattern; WipDonut must use same approach
  - Store lots data provides the real-time status distribution

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: WIP donut shows lot distribution correctly
    Tool: Playwright
    Preconditions: Dashboard loaded with 3 mock lots
    Steps:
      1. Assert: data-testid="wip-donut" is visible
      2. Assert: Center shows "3 Total Lots"
      3. Assert: Legend shows Running, Idle, On Hold, Completed entries
      4. Verify segment colors match design tokens
    Expected Result: Donut chart shows correct lot distribution
    Failure Indicators: Missing chart, wrong lot count, missing legend
    Evidence: .sisyphus/evidence/task-10-wip-donut.png

  Scenario: WIP donut updates when lot status changes
    Tool: Playwright
    Preconditions: Dashboard loaded, simulator running
    Steps:
      1. Assert: Initial donut shows 1 Running, 2 other statuses
      2. Click "Inject Fault" → "Sudden Shift" → "Inject"
      3. Wait for violation to occur
      4. Assert: Donut now shows 1 On Hold (lot status changed)
    Expected Result: Donut chart reflects real-time lot status changes
    Failure Indicators: Donut doesn't update, shows stale data
    Evidence: .sisyphus/evidence/task-10-wip-update.png
  ```

  **Commit**: YES (groups with Wave 2)
  - Message: `feat(mes): add WIP donut chart for lot status distribution`
  - Files: `WipDonutChart.tsx`
  - Pre-commit: `cd equipment-monitor && npx tsc --noEmit`

- [x] 11. AiRecommendations Panel (interactive Apply/Override)

  **What to do**:
  - Create `equipment-monitor/src/components/spc/AiRecommendations.tsx`
  - SmartFactory-style AI panel: rounded card with light blue-gray border, icon-led subheadings
  - Shows 4-6 recommendation cards from `useMesSpcStore().ai.recommendations`
  - Each card shows: type icon (lightbulb/warning/chart/leaf), title, description, impact/prediction, confidence % badge (top-right), status badge (pending/applied/overridden)
  - Two action buttons per pending recommendation:
    - "Apply" (primary, solid blue-teal bg, white text) — calls `store.ai.applyRecommendation(id)`, adds S2F49+S2F50 to event log, changes status to 'applied', triggers simulator state change
    - "Override" (secondary, bordered, dark text) — calls `store.ai.overrideRecommendation(id)`, adds S2F49+S2F50 to event log, changes status to 'overridden', triggers different simulator response
  - Applied cards show green checkmark + "Applied" badge
  - Overridden cards show amber triangle + "Overridden" badge
  - Panel has "AI Insights" header with robot/gear icon
  - Framer Motion: cards animate in with `fadeInUp` variant, staggered by 100ms
  - Use design tokens, `data-testid="ai-recommendations"`, `data-testid="ai-apply-btn-{id}"`, `data-testid="ai-override-btn-{id}"`

  **Must NOT do**:
  - Do NOT connect to real AI/ML service — recommendations come from mock data
  - Do NOT add real scheduling or recipe modification logic — just Zustand state changes + SECS messages
  - Do NOT make recommendations dismissable (only Apply/Override)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Complex interactive component with state management, multiple actions, and SECS message integration
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 12, 13, 14)
  - **Blocks**: Task 17 (SPC dashboard assembly)
  - **Blocked By**: Task 2 (store ai slice), Task 4 (mock recommendations), Task 5 (SECS messages)

  **References**:

  **Pattern References**:
  - `equipment-monitor/src/components/spc/ViolationCard.tsx` — Similar card-with-action-button pattern (Acknowledge button); follow same approach for Apply/Override
  - `equipment-monitor/src/components/spc/FaultInjector.tsx` — Example of component that triggers store actions on button click

  **API/Type References**:
  - `equipment-monitor/src/stores/mes-spc-store.ts` — `ai.applyRecommendation(id)`, `ai.overrideRecommendation(id)`
  - `equipment-monitor/src/lib/secs-message-log.ts` — `makeS2F49ApplyRecommendation()`, `makeS2F50ApplyAck()`, `makeS2F49OverrideRecommendation()`, `makeS2F50OverrideAck()`

  **Why Each Reference Matters**:
  - ViolationCard shows the established pattern for action buttons in cards
  - FaultInjector shows store action + SECS message integration pattern
  - Store and SECS functions are the API this component must call

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: AI panel renders recommendation cards
    Tool: Playwright
    Preconditions: Dashboard loaded
    Steps:
      1. Assert: data-testid="ai-recommendations" is visible
      2. Assert: 4-6 recommendation cards visible
      3. Assert: Each card shows title, description, confidence %, status "pending"
      4. Assert: Each pending card shows "Apply" and "Override" buttons
    Expected Result: AI panel shows all mock recommendations with action buttons
    Failure Indicators: Missing panel, wrong card count, missing buttons
    Evidence: .sisyphus/evidence/task-11-ai-panel.png

  Scenario: Apply button triggers state change and SECS messages
    Tool: Playwright
    Preconditions: Dashboard loaded, at least one pending recommendation
    Steps:
      1. Click data-testid="ai-apply-btn-{id}" on first recommendation
      2. Assert: Card status changes to "Applied" with green checkmark
      3. Assert: "Apply" and "Override" buttons disappear from this card
      4. Scroll to EventLog
      5. Assert: EventLog contains new S2F49 and S2F50 messages
    Expected Result: Apply button changes recommendation status and logs SECS messages
    Failure Indicators: Status doesn't change, no SECS messages in log
    Evidence: .sisyphus/evidence/task-11-ai-apply.png

  Scenario: Override button triggers different state change
    Tool: Playwright
    Preconditions: Dashboard loaded, at least one pending recommendation
    Steps:
      1. Click data-testid="ai-override-btn-{id}" on a recommendation
      2. Assert: Card status changes to "Overridden" with amber triangle
      3. Assert: EventLog contains S2F49 (override) and S2F50 messages
    Expected Result: Override button changes status differently from Apply
    Failure Indicators: Same behavior as Apply, no override-specific messages
    Evidence: .sisyphus/evidence/task-11-ai-override.png
  ```

  **Commit**: YES (groups with Wave 3)
  - Message: `feat(mes): add AI recommendations panel with Apply/Override actions`
  - Files: `AiRecommendations.tsx`
  - Pre-commit: `cd equipment-monitor && npx tsc --noEmit`

- [x] 12. NotificationPanel (Bell dropdown with mock notifications)

  **What to do**:
  - Create `equipment-monitor/src/components/spc/NotificationPanel.tsx`
  - Dropdown panel from Bell icon: slides down with Framer Motion `slideInDown`
  - Header: "Notifications" with count badge, "Mark all read" button
  - List of notifications from `useMesSpcStore().ui.notifications` (max 5 visible, scrollable)
  - Each notification: colored severity icon (red circle for critical, amber triangle for warning, blue info for info), timestamp, title, message preview
  - Click notification mark as read (add `read: true`)
  - "Clear all" button removes all notifications
  - Auto-adds: SPC violation triggers add critical notification, lot hold triggers add warning, equipment state change adds info
  - Connect to existing simulator event flow (when violations occur, auto-add notification)
  - Use design tokens, `data-testid="notification-panel"`, `data-testid="notification-item-{id}"`, `data-testid="mark-all-read"`

  **Must NOT do**:
  - Do NOT add real push notification infrastructure
  - Do NOT connect to WebSocket/SSE
  - Do NOT persist notifications to localStorage (in-memory only)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Interactive panel with state management, click handlers, animations
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 11, 13, 14)
  - **Blocks**: Task 17 (SPC dashboard assembly)
  - **Blocked By**: Task 2 (store ui slice), Task 4 (mock notifications)

  **References**:

  **Pattern References**:
  - `equipment-monitor/src/components/ui/dialog.tsx` — Radix UI Dialog pattern; use similar overlay/portal approach for dropdown positioning

  **API/Type References**:
  - `equipment-monitor/src/stores/mes-spc-store.ts` — `ui.notifications`, `ui.addNotification()`, `ui.dismissNotification()`
  - `equipment-monitor/src/lib/mes-types.ts` — `Notification` type with severity, title, message, timestamp

  **Why Each Reference Matters**:
  - Dialog component shows Radix UI overlay pattern for reference
  - Store provides notification data and actions

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Bell icon shows notification count and opening panel
    Tool: Playwright
    Preconditions: Dashboard loaded, mock notifications seeded
    Steps:
      1. Assert: Bell icon shows badge with notification count
      2. Click bell icon
      3. Assert: data-testid="notification-panel" is visible
      4. Assert: Panel shows notification items with severity icons
      5. Click bell icon again
      6. Assert: Panel is hidden
    Expected Result: Bell badge shows count, panel toggles correctly
    Failure Indicators: No badge, panel doesn't toggle
    Evidence: .sisyphus/evidence/task-12-notifications.png

  Scenario: Mark all read clears unread indicators
    Tool: Playwright
    Preconditions: Notification panel open with unread items
    Steps:
      1. Assert: Some notification items show unread indicator (bold or dot)
      2. Click data-testid="mark-all-read"
      3. Assert: All notification items now show read state
      4. Assert: Badge count on Bell icon updates
    Expected Result: Mark all read changes notification read state
    Failure Indicators: Items stay unread after clicking
    Evidence: .sisyphus/evidence/task-12-mark-read.png

  Scenario: Violation auto-adds critical notification
    Tool: Playwright
    Preconditions: Dashboard loaded, simulator running
    Steps:
      1. Click "Inject Fault" → "Sudden Shift" → "Inject"
      2. Wait for violation to occur
      3. Click bell icon to open notifications
      4. Assert: New notification with "critical" severity icon about SPC violation
    Expected Result: SPC violations automatically create notification entries
    Failure Indicators: No new notification after violation
    Evidence: .sisyphus/evidence/task-12-violation-notification.png
  ```

  **Commit**: YES (groups with Wave 3)
  - Message: `feat(mes): add notification panel with mock notifications and auto-event creation`
  - Files: `NotificationPanel.tsx`, modified `simulator-engine.ts` (auto-add notifications on violation)
  - Pre-commit: `cd equipment-monitor && npx tsc --noEmit`

- [x] 13. Enhanced EventLog (colored icons, search/filter, auto-scroll)

  **What to do**:
  - Rewrite `equipment-monitor/src/components/spc/EventLog.tsx` with SmartFactory-style enhancements
  - Add colored severity icons per event: lightning bolt for SPC data, red circle for violations, amber triangle for warnings, green check for resumes, blue info for state changes
  - Add search input at top: filters events by text content (case-insensitive)
  - Add filter buttons: "All", "SPC", "Violations", "Commands" — filter by event type
  - Auto-scroll to bottom on new event (use `useRef` + `scrollTop`)
  - Monospaced timestamp (JetBrains Mono)
  - Event rows alternate subtle background tint for readability
  - Use design tokens, `data-testid="event-log"`, `data-testid="event-search"`, `data-testid="event-filter-{type}"`

  **Must NOT do**:
  - Do NOT add real event streaming (SSE/WebSocket)
  - Do NOT add event export/download (separate feature)
  - Do NOT change the `SecsEvent` type structure

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Component rewrite with search/filter state, auto-scroll, icon mapping
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 11, 12, 14)
  - **Blocks**: Task 17 (SPC dashboard assembly)
  - **Blocked By**: Task 1 (design tokens)

  **References**:

  **Pattern References**:
  - `equipment-monitor/src/components/spc/EventLog.tsx` — Current event log; preserve data source but enhance visuals and add search/filter
  - Reference Image 3 (SmartFactory): "Real-Time Events" section showing colored icons per event type

  **API/Type References**:
  - `equipment-monitor/src/stores/mes-spc-store.ts` — `events` array (capped at 100)
  - `equipment-monitor/src/lib/mes-types.ts` — `SecsEvent` type with stream, function, and label fields

  **Why Each Reference Matters**:
  - Current EventLog provides the data flow pattern; new version enhances visuals without breaking it
  - Store events provide the data; search/filter operates on this array

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Event log shows colored icons and auto-scrolls
    Tool: Playwright
    Preconditions: Dashboard loaded, simulator running
    Steps:
      1. Assert: data-testid="event-log" is visible
      2. Assert: Events display with colored severity icons
      3. Wait 4 seconds for new events
      4. Assert: Event log has auto-scrolled to bottom
    Expected Result: Colored icons render, auto-scroll works
    Failure Indicators: No icons, no auto-scroll
    Evidence: .sisyphus/evidence/task-13-eventlog.png

  Scenario: Search filters events by text
    Tool: Playwright
    Preconditions: Dashboard with events
    Steps:
      1. Click data-testid="event-search"
      2. Type "S6F11"
      3. Assert: Only events containing "S6F11" are visible
      4. Clear search
      5. Assert: All events visible again
    Expected Result: Search filters event list correctly
    Failure Indicators: Search doesn't filter or shows wrong results
    Evidence: .sisyphus/evidence/task-13-event-search.png

  Scenario: Filter buttons filter by event type
    Tool: Playwright
    Preconditions: Dashboard with various event types
    Steps:
      1. Click data-testid="event-filter-Violations"
      2. Assert: Only violation events visible
      3. Click data-testid="event-filter-All"
      4. Assert: All event types visible
    Expected Result: Filter buttons correctly filter event list
    Failure Indicators: Wrong events shown, filter doesn't work
    Evidence: .sisyphus/evidence/task-13-event-filter.png
  ```

  **Commit**: YES (groups with Wave 3)
  - Message: `feat(mes): enhance event log with colored icons, search, and filter`
  - Files: `EventLog.tsx`
  - Pre-commit: `cd equipment-monitor && npx tsc --noEmit`

- [x] 14. Enhanced Lot Tracker (clickable rows, status pills)

  **What to do**:
  - Rewrite `equipment-monitor/src/app/mes/lots/page.tsx` with SmartFactory-style enhancements
  - Add status pills (PASS green / MONITOR amber / HOLD red) inline in status column — matching Reference Image 1 style
  - Make table rows clickable to expand lot details (accordion-style)
  - Expanded view shows: wafer progress bar, recipe name, SPC parameter summary (last measured values)
  - Add column for "Last Activity" timestamp
  - Add hover state on rows (background tint `--smartfactory-surface-elevated`)
  - Add "Select Lot" button that navigates to `/mes/spc` with that lot as active lot
  - Use design tokens, `data-testid="lot-row-{id}"`, `data-testid="lot-status-{id}"`, `data-testid="lot-select-{id}"`

  **Must NOT do**:
  - Do NOT add real backend/API calls
  - Do NOT add lot creation or editing (display + select only)
  - Do NOT remove existing table columns

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Page rewrite with interactive table, status pills, expandable rows
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 11, 12, 13)
  - **Blocks**: Task 17 (minor — lot tracker only needs reference, not blocking)
  - **Blocked By**: Task 2 (store lots data)

  **References**:

  **Pattern References**:
  - `equipment-monitor/src/app/mes/lots/page.tsx` — Current lot tracker; preserve data connections while enhancing visuals and adding interactivity
  - Reference Image 1 (MES Applied): Status pills style (PASS/MONITOR/HOLD with colored backgrounds and icons)

  **API/Type References**:
  - `equipment-monitor/src/stores/mes-spc-store.ts` — `lots` array with `id`, `status`, `recipeId`, `waferCount`
  - `equipment-monitor/src/lib/mes-types.ts` — `Lot` type

  **Why Each Reference Matters**:
  - Current page shows the data fields available; enhancement adds visual and interactive improvements
  - Store lots provide real-time status updates

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Lot tracker shows status pills and clickable rows
    Tool: Playwright
    Preconditions: Dashboard loaded at /mes/lots
    Steps:
      1. Assert: Table rows visible for each lot
      2. Assert: Status column shows colored pills (IN_PROCESS=green, ON_HOLD=red, COMPLETED=blue-gray)
      3. Click on a lot row
      4. Assert: Row expands to show lot details (wafer progress, recipe, SPC summary)
      5. Click again to collapse
      6. Assert: Row collapses
    Expected Result: Rows expand/collapse, status pills show correct colors
    Failure Indicators: No expand/collapse, wrong pill colors
    Evidence: .sisyphus/evidence/task-14-lot-tracker.png

  Scenario: Select Lot button navigates to SPC dashboard
    Tool: Playwright
    Preconditions: /mes/lots loaded
    Steps:
      1. Click data-testid="lot-select-{id}" on a lot row
      2. Assert: URL changed to /mes/spc
      3. Assert: SPC dashboard shows the selected lot as active
    Expected Result: Selecting a lot navigates to SPC with that lot active
    Failure Indicators: No navigation, wrong lot active
    Evidence: .sisyphus/evidence/task-14-lot-select.png
  ```

  **Commit**: YES (groups with Wave 3)
  - Message: `feat(mes): enhance lot tracker with status pills and expandable rows`
  - Files: `lots/page.tsx`
  - Pre-commit: `cd equipment-monitor && npx tsc --noEmit`

- [x] 15. FabFloorMap Component (CSS 3D isometric equipment visualization)

  **What to do**:
  - Create `equipment-monitor/src/components/equipment/FabFloorMap.tsx`
  - SmartFactory-style 3D isometric fab floor map using **CSS 3D transforms only** (no Three.js, no WebGL)
  - Dark navy background with glowing blue grid floor
  - 8 equipment nodes positioned on the grid using CSS `transform: perspective(1000px) rotateX(60deg) rotateZ(-45deg)` for isometric effect
  - Each equipment node: floating status badge (rounded rectangle with color border) showing equipment name + power (e.g., "LITHO-01 285 kW")
  - Status colors: Running=green, Idle=amber, Down=red
  - Left gradient scale bar: "Power Intensity" (blue Low → red High)
  - Bottom strip: "Equipment 8 | Running 5 (63%) | Idle 2 (25%) | Down 1 (12%)"
  - Right-side toolbar: 3 dark circular buttons (Refresh, Layers, Fullscreen icons)
  - Read equipment data from `useMesSpcStore().equipment.equipments`
  - Click on equipment node → sets `selectedEquipmentId` in store → highlights node
  - Use design tokens, Framer Motion for node entrance (staggered), `data-testid="fab-floor-map"`
  - Responsive: Horizontal scroll on tablet, simplified grid on mobile

  **Must NOT do**:
  - Do NOT install Three.js, React Three Fiber, or any WebGL library
  - Do NOT add real equipment connection (data from store + mock data only)
  - Do NOT make map draggable/pannable (that's a v2 feature)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Complex CSS 3D transform component with isometric layout, click handling, and staggered animations
  - **Skills**: [`ui-ux-pro-max`]

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on Tasks 2, 4)
  - **Parallel Group**: Wave 4
  - **Blocks**: Task 16 (equipment page), Task 17 (dashboard integration)
  - **Blocked By**: Task 2 (store equipment slice), Task 4 (mock equipment data)

  **References**:

  **Pattern References**:
  - `equipment-monitor/src/components/spc/ControlChart.tsx` — Complex component pattern with Recharts; FabFloorMap uses similar data-binding approach but with CSS instead of charts
  - Reference Image 3 (SmartFactory): 3D isometric fab floor with floating status badges, grid floor, toolbar buttons

  **API/Type References**:
  - `equipment-monitor/src/stores/mes-spc-store.ts` — `equipment.equipments` array, `equipment.selectedEquipmentId`, `equipment.setSelectedEquipment()`
  - `equipment-monitor/src/lib/mes-types.ts` — `Equipment` type with id, name, type, status, x, y, zone, powerKw

  **Why Each Reference Matters**:
  - Reference image provides exact visual target for isometric map
  - Store provides equipment data and selection state

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Fab floor map renders 8 equipment nodes
    Tool: Playwright
    Preconditions: /mes/equipment loaded
    Steps:
      1. Assert: data-testid="fab-floor-map" is visible
      2. Assert: 8 equipment status badges visible on the map
      3. Assert: Status colors match equipment state (green/amber/red)
      4. Assert: Bottom strip shows equipment count "8 | Running 5 | Idle 2 | Down 1"
      5. Assert: Left gradient scale bar visible
      6. Assert: Right toolbar with 3 buttons visible
    Expected Result: Isometric fab map with 8 nodes, status badges, and info strip
    Failure Indicators: Missing nodes, wrong colors, no 3D transform effect
    Evidence: .sisyphus/evidence/task-15-fab-map.png

  Scenario: Equipment node click selects and highlights
    Tool: Playwright
    Preconditions: /mes/equipment loaded
    Steps:
      1. Click on "LITHO-01" equipment badge
      2. Assert: LITHO-01 node has highlighted/selected state
      3. Assert: Store shows selectedEquipmentId === 'litho-01'
      4. Click on "COAT-01" equipment badge
      5. Assert: COAT-01 now highlighted, LITHO-01 unhighlighted
    Expected Result: Clicking equipment selects it with visual feedback
    Failure Indicators: No highlight change, store doesn't update
    Evidence: .sisyphus/evidence/task-15-fab-select.png
  ```

  **Commit**: YES (groups with Wave 4)
  - Message: `feat(mes): add 3D isometric fab floor map component`
  - Files: `FabFloorMap.tsx`
  - Pre-commit: `cd equipment-monitor && npx tsc --noEmit`

- [x] 16. /mes/equipment Page (route + layout + FabFloorMap)

  **What to do**:
  - Create `equipment-monitor/src/app/mes/equipment/page.tsx`
  - Page layout: Header (shared MES layout) → ProcessFlow bar at top → FabFloorMap (main content) → Equipment detail panel on right (shows selected equipment info)
  - Equipment detail panel: Shows name, type, status, recipe, current wafer/total wafers, power consumption, zone
  - Panel slides in from right with Framer Motion when equipment is selected
  - Page title: "Equipment Monitor" with breadcrumb "MES / Equipment"
  - Add "Equipment" tab to `MesNavBar.tsx` navigation (4th position: Equipment, table, Lot Tracker, Recipe Manager, SPC Dashboard)
  - Use design tokens throughout
  - Add `data-testid="equipment-page"`, `data-testid="equipment-detail-panel"`

  **Must NOT do**:
  - Do NOT create a separate layout — reuse `app/mes/layout.tsx`
  - Do NOT add equipment management (CRUD) — display only
  - Do NOT connect to real equipment service

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: New page route with layout integration and detail panel
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on Task 15)
  - **Parallel Group**: Wave 4
  - **Blocks**: Task 17 (dashboard integration)
  - **Blocked By**: Task 15 (FabFloorMap component)

  **References**:

  **Pattern References**:
  - `equipment-monitor/src/app/mes/spc/page.tsx` — Existing MES page layout pattern; follow same approach for page structure
  - `equipment-monitor/src/app/mes/layout.tsx` — Shared layout with Header + Nav; equipment page inherits this

  **API/Type References**:
  - `equipment-monitor/src/stores/mes-spc-store.ts` — `equipment.equipments`, `equipment.selectedEquipmentId`
  - `equipment-monitor/src/components/mes/MesNavBar.tsx` — Navigation tabs; add new "Equipment" tab

  **Why Each Reference Matters**:
  - SPC page shows the established pattern for MES pages
  - Nav bar needs the new tab for navigation to work

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Equipment page renders with fab map and nav
    Tool: Playwright
    Preconditions: Navigate to /mes/equipment
    Steps:
      1. Assert: data-testid="equipment-page" is visible
      2. Assert: MES nav bar shows "Equipment" tab
      3. Assert: ProcessFlow bar at top of page
      4. Assert: FabFloorMap renders 8 equipment nodes
      5. Assert: URL is /mes/equipment
    Expected Result: Equipment page with all elements renders correctly
    Failure Indicators: 404, missing nav tab, empty page
    Evidence: .sisyphus/evidence/task-16-equipment-page.png

  Scenario: Equipment selection shows detail panel
    Tool: Playwright
    Preconditions: /mes/equipment loaded
    Steps:
      1. Click on "LITHO-01" equipment on the map
      2. Assert: data-testid="equipment-detail-panel" slides in from right
      3. Assert: Panel shows equipment name, type, status, recipe, wafer progress
      4. Click on different equipment
      5. Assert: Panel updates to show new equipment info
    Expected Result: Detail panel appears on equipment selection
    Failure Indicators: No panel, wrong data, no slide animation
    Evidence: .sisyphus/evidence/task-16-detail-panel.png

  Scenario: Navigation between pages works
    Tool: Playwright
    Preconditions: /mes/equipment loaded
    Steps:
      1. Click "SPC Dashboard" in nav bar
      2. Assert: URL changes to /mes/spc
      3. Click "Equipment" in nav bar
      4. Assert: URL changes to /mes/equipment
      5. Assert: Page renders without full reload (SPA navigation)
    Expected Result: Navigation between equipment and SPC pages works smoothly
    Failure Indicators: 404, full page reload, missing nav tab
    Evidence: .sisyphus/evidence/task-16-navigation.png
  ```

  **Commit**: YES (groups with Wave 4)
  - Message: `feat(mes): add equipment page with 3D fab map and detail panel`
  - Files: `equipment/page.tsx`, modified `MesNavBar.tsx` (add Equipment tab)
  - Pre-commit: `cd equipment-monitor && npm run build`

- [x] 17. SPC Dashboard Layout Overhaul (integrate all new components)

  **What to do**:
  - Rewrite `equipment-monitor/src/app/mes/spc/page.tsx` to assemble the SmartFactory-style dashboard layout
  - **New layout structure** (top to bottom):
    1. KPI Gauge Row: 5 `KpiGaugeCard` components (replace `KpiStrip`)
    2. Main content split (70/30):
       - Left (70%): `ProcessFlow` bar at top, then `ControlChart` (main chart), then `ThumbnailChart` row
       - Right (30%): `WipDonutChart` (top), then `AiRecommendations` panel (middle, scrollable)
    3. Bottom row (50/50):
       - Left: `EventLog` (enhanced)
       - Right: `ViolationCard` stack + `FaultInjector`
    4. `FooterStatusBar` at bottom of page
  - Wire all components to Zustand store
  - Replace `KpiStrip` with `KpiGaugeCard` row
  - Remove inline colors, use design tokens exclusively
  - Ensure existing SPC demo flow still works: seed data → streaming → inject fault → violation → acknowledge → resume
  - Add `data-testid="spc-dashboard"` wrapper

  **Must NOT do**:
  - Do NOT remove ControlChart, ThumbnailChart, FaultInjector, ViolationCard (keep, reposition)
  - Do NOT break existing SPC simulator flow
  - Do NOT add new backend calls
  - Do NOT change the URL structure / routing

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Critical integration task — assembling all new components into a cohesive dashboard while preserving existing functionality
  - **Skills**: [`ui-ux-pro-max`]

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on Tasks 6-15)
  - **Parallel Group**: Wave 4 (after Tasks 6-16)
  - **Blocks**: Tasks 18, 19, 20
  - **Blocked By**: Tasks 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16

  **References**:

  **Pattern References**:
  - `equipment-monitor/src/app/mes/spc/page.tsx` — Current SPC page structure; completely reconstruct layout but preserve data flow and simulator wiring
  - Reference Images 1-3: All three show different layouts; fusion them into SmartFactory-style with gauge KPIs, split content area, footer

  **API/Type References**:
  - `equipment-monitor/src/stores/mes-spc-store.ts` — All store slices needed for wiring
  - All new components: KpiGaugeCard, ProcessFlow, WipDonutChart, AiRecommendations, EventLog, ViolationCard, FaultInjector, FooterStatusBar

  **Why Each Reference Matters**:
  - Current page provides data flow pattern that MUST be preserved
  - All new components must be wired correctly to the same store

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: SPC dashboard renders all new components
    Tool: Playwright
    Preconditions: Navigate to /mes/spc
    Steps:
      1. Assert: data-testid="spc-dashboard" is visible
      2. Assert: 5 KpiGaugeCard components visible (CD, CDU, OVL-X, OVL-Y, LER)
      3. Assert: ProcessFlow visible at top of main content
      4. Assert: ControlChart visible with data
      5. Assert: ThumbnailChart row visible
      6. Assert: WipDonutChart visible in right panel
      7. Assert: AiRecommendations panel visible
      8. Assert: EventLog visible with events
      9. Assert: FooterStatusBar at bottom
    Expected Result: All new components render in SmartFactory layout
    Failure Indicators: Missing components, broken layout, white spaces
    Evidence: .sisyphus/evidence/task-17-dashboard-integration.png

  Scenario: Full SPC hero demo flow still works
    Tool: Playwright
    Preconditions: /mes/spc loaded, simulator running
    Steps:
      1. Wait for 3-4 wafers to stream (6-8 seconds)
      2. Assert: Chart shows data points, KPIs show values
      3. Click "Inject Fault" → "Sudden Shift" → "Inject"
      4. Wait for violation to occur
      5. Assert: Violation card appears
      6. Assert: KPI shows red OOC status
      7. Assert: Event log shows S2F41 STOP message
      8. Click "Acknowledge" on violation card
      9. Assert: Equipment resumes processing
      10. Assert: Event log shows S2F41 RESUME message
    Expected Result: Full hero demo flow works unchanged after layout overhaul
    Failure Indicators: Violations don't fire, chart doesn't stream, acknowledge fails
    Evidence: .sisyphus/evidence/task-17-hero-flow.png

  Scenario: Responsive layout at 1280px and 768px
    Tool: Playwright
    Preconditions: Dashboard loaded
    Steps:
      1. Set viewport to 1920×1080
      2. Assert: Full layout renders (KPIs in row, split content)
      3. Set viewport to 1280px wide
      4. Assert: Layout adapts (KPIs still visible, content stacks)
      5. Set viewport to 768px wide
      6. Assert: Layout adapts (KPIs in 2 rows, single column content)
    Expected Result: Responsive layout works at all breakpoints
    Failure Indicators: Horizontal scroll, overlapping elements, hidden content
    Evidence: .sisyphus/evidence/task-17-responsive.png
  ```

  **Commit**: YES (groups with Wave 4)
  - Message: `feat(mes): overhaul SPC dashboard layout with SmartFactory design`
  - Files: `spc/page.tsx`, remove `KpiStrip.tsx` imports (component file kept for backward compat)
  - Pre-commit: `cd equipment-monitor && npm run build`

- [x] 18. Framer Motion Animation Polish (gauges, cards, transitions)

  **What to do**:
  - Apply Framer Motion animations to all new components using utilities from `animation.ts` (Task 3)
  - **KpiGaugeCard**: `fadeInUp` entrance with 100ms stagger between cards; progress ring animates from 0 to target value
  - **ProcessFlow**: `fadeIn` for step nodes, staggered 50ms; active step has subtle pulse
  - **WipDonutChart**: `scaleIn` entrance animation; segments animate sequentially
  - **AiRecommendations**: Each card `fadeInUp` with 150ms stagger; Apply/Override buttons have `whileHover` scale
  - **EventLog**: New events slide in from bottom (`slideInRight`); filter transitions smooth
  - **FabFloorMap**: Equipment nodes `fadeIn` with stagger; status badge has subtle shimmer for "Down" state
  - **FooterStatusBar**: `fadeIn` on mount; clock digits use `layout` animation
  - **NotificationPanel**: `slideInDown` from Bell icon; items `fadeInUp` staggered
  - **SettingsPanel**: Slide-in from right with `slideInRight` variant
  - **UserProfileDropdown**: `fadeIn` with opacity transition
  - All animations must check `useReducedMotion()` utility and return static variants when `prefers-reduced-motion: reduce`
  - Add `layout` animations for list reordering (filter changes in EventLog)
  - Wrap SPC dashboard page content in `<AnimatePresence>` for page transitions
  - Smooth data transitions on SimulationChart updates using `<motion.div layout>`

  **Must NOT do**:
  - Do NOT add animations to existing components that are not being enhanced (keep them as-is)
  - Do NOT add animation that breaks `prefers-reduced-motion`
  - Do NOT add animation that causes layout shift (all `layout` animations must use `layoutId`)
  - Do NOT add animation that slows down perceived responsiveness (max 300ms for entrance, 150ms for hover)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Animation-focused task requiring Framer Motion expertise and careful timing
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on Task 17 completion)
  - **Parallel Group**: Wave 4 (after Task 17)
  - **Blocks**: Tasks 19, 20 (tests should verify animations work)
  - **Blocked By**: Task 3 (Framer Motion install), Task 17 (all components integrated)

  **References**:

  **Pattern References**:
  - `equipment-monitor/src/lib/animation.ts` — Animation utilities (`fadeInUp`, `fadeIn`, `slideInRight`, `scaleIn`, `springConfig`, `useReducedMotion`)

  **External References**:
  - Framer Motion docs: https://www.framer.com/motion/ — `motion`, `variants`, `AnimatePresence`, `layout`

  **Why Each Reference Matters**:
  - Animation utilities provide the standardized variant names and spring configs to use consistently

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Animations work and respect reduced motion
    Tool: Playwright
    Preconditions: Dashboard loaded
    Steps:
      1. Assert: KPI gauge cards animate in with progressive delay
      2. Assert: Progress rings animate from 0 to target value
      3. Assert: AI recommendation cards stagger in
      4. Set browser to prefers-reduced-motion: reduce
      5. Reload page
      6. Assert: All elements appear instantly (no animation delays)
    Expected Result: Animations play on normal mode, disabled on reduced motion
    Failure Indicators: Animations stuck, elements invisible, or animations play on reduced motion
    Evidence: .sisyphus/evidence/task-18-animations.png

  Scenario: Hover animations on interactive elements
    Tool: Playwright
    Preconditions: Dashboard loaded
    Steps:
      1. Hover over KPI gauge card
      2. Assert: Subtle scale or shadow change on hover
      3. Hover over AI "Apply" button
      4. Assert: Button has hover scale/lift effect
      5. Hover over equipment node on fab map
      6. Assert: Node has hover highlight
    Expected Result: Hover states provide visual feedback
    Failure Indicators: No hover feedback, jittery animations
    Evidence: .sisyphus/evidence/task-18-hover.png

  Scenario: No layout shift during animations
    Tool: Playwright
    Preconditions: Dashboard loaded
    Steps:
      1. Observe dashboard layout after all animations complete
      2. Reload page
      3. Observe dashboard during animation sequence
      4. Assert: No elements shift position after animation completes
      5. Assert: Page scroll position doesn't jump during animation
    Expected Result: Smooth animations with no cumulative layout shift
    Failure Indicators: Elements jump, page scrolls unexpectedly
    Evidence: .sisyphus/evidence/task-18-layout-shift.png
  ```

  **Commit**: YES (groups with Wave 4)
  - Message: `feat(mes): add Framer Motion animations to all SmartFactory components`
  - Files: All component files modified (KpiGaugeCard, ProcessFlow, WipDonutChart, AiRecommendations, EventLog, FabFloorMap, FooterStatusBar, NotificationPanel, SettingsPanel, UserProfileDropdown)
  - Pre-commit: `cd equipment-monitor && npm run build`

---

Wave 5: Tests

- [x] 19. Component Tests (Jest + RTL for all new components)

  **What to do**:
  - Write Jest + React Testing Library tests for all 9 new components:
    - `KpiGaugeCard.test.tsx`: Renders 5 gauge cards, shows correct values, responds to parameter click, shows OK/OOC status
    - `AiRecommendations.test.tsx`: Renders recommendation cards, Apply triggers store action + SECS message, Override triggers different action
    - `NotificationPanel.test.tsx`: Toggles on Bell click, shows notifications, marks all read, auto-adds on violation
    - `FooterStatusBar.test.tsx`: Renders all 4 segments, live clock updates
    - `ProcessFlow.test.tsx`: Renders 5 steps with correct status colors
    - `WipDonutChart.test.tsx`: Shows lot distribution, updates on status change
    - `FabFloorMap.test.tsx`: Renders 8 equipment nodes, click selects equipment
    - `SettingsPanel.test.tsx`: Opens/closes, toggles settings
    - `UserProfileDropdown.test.tsx`: Opens/closes, shows menu items
  - Each test file: 3-5 tests covering render, interaction, state update
  - Use `@testing-library/react` for component rendering and `@testing-library/user-event` for interactions
  - Mock Zustand store for isolated testing
  - Place test files alongside components: `KpiGaugeCard.test.tsx` next to `KpiGaugeCard.tsx`

  **Must NOT do**:
  - Do NOT test implementation details (CSS classes, internal state)
  - Do NOT mock modules that don't need mocking (only mock external dependencies)
  - Do NOT write tests for existing components (only new ones)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Systematic test writing for 9 components
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5 (with Task 20)
  - **Blocks**: Nothing (tests are final verification before F-wave)
  - **Blocked By**: Tasks 17, 18 (all components must be integrated first)

  **References**:

  **Pattern References**:
  - `equipment-monitor/src/app/mes/spc/page.test.tsx` — Existing test pattern for SPC page
  - `equipment-monitor/src/app/page.test.tsx` — Existing test pattern for main page
  - `equipment-monitor/src/components/error-boundary.test.tsx` — Existing component test pattern

  **Why Each Reference Matters**:
  - Existing tests show the established testing patterns (RTL imports, mock approaches, assertion styles)

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: All component tests pass
    Tool: Bash (Jest)
    Preconditions: All component tests written
    Steps:
      1. Run: `cd equipment-monitor && npx jest --testPathPattern="KpiGaugeCard|AiRecommendations|NotificationPanel|FooterStatusBar|ProcessFlow|WipDonutChart|FabFloorMap|SettingsPanel|UserProfileDropdown" --verbose`
      2. Assert: All tests pass (0 failures)
      3. Assert: Coverage includes at least 3 tests per component
    Expected Result: All 9 component test suites pass with adequate coverage
    Failure Indicators: Any test failures, missing test files
    Evidence: .sisyphus/evidence/task-19-component-tests.txt
  ```

  **Commit**: YES (groups with Wave 5)
  - Message: `test(mes): add component tests for SmartFactory layout components`
  - Files: 9 `.test.tsx` files alongside each component
  - Pre-commit: `cd equipment-monitor && npx jest --passWithNoTests`

- [x] 20. Integration Tests (interactive flows end-to-end)

  **What to do**:
  - Write integration tests covering full interactive flows:
    - `spc-hero-flow.test.tsx`: Full hero demo (load → inject fault → violation → acknowledge → resume)
    - `header-interactivity.test.tsx`: Bell toggle, Settings toggle, User dropdown toggle, mutual exclusion
    - `ai-panel-interactivity.test.tsx`: Apply recommendation → SECS message logged, Override → different SECS message
    - `navigation-flow.test.tsx`: Navigate /mes/spc ↔ /mes/lots ↔ /mes/recipes ↔ /mes/equipment
  - Each test: 3-5 assertions per flow
  - Use `@testing-library/react` for rendering, `@testing-library/user-event` for interactions
  - Mock Zustand store with full state simulation
  - Place test files in `equipment-monitor/tests/integration/`

  **Must NOT do**:
  - Do NOT write E2E tests (Playwright) — those are QA scenarios
  - Do NOT test routes that don't exist
  - Do NOT mock internal Zustand actions (use real store)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Integration tests with store wiring and multi-step flows
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5 (with Task 19)
  - **Blocks**: Nothing (tests are final verification before F-wave)
  - **Blocked By**: Tasks 17, 18 (all components and flows must work first)

  **References**:

  **Pattern References**:
  - `equipment-monitor/tests/integration/alert-flow.test.tsx` — Existing integration test pattern; follow same approach
  - `equipment-monitor/tests/integration/equipment-flow.test.tsx` — Existing equipment flow test pattern

  **Why Each Reference Matters**:
  - Existing integration tests show the established pattern for full-flow testing with Zustand store

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: All integration tests pass
    Tool: Bash (Jest)
    Preconditions: All integration test files written
    Steps:
      1. Run: `cd equipment-monitor && npx jest --testPathPattern="integration" --verbose`
      2. Assert: All tests pass (0 failures)
      3. Assert: At least 3 test files with 3+ assertions each
    Expected Result: All integration test suites pass
    Failure Indicators: Any test failures
    Evidence: .sisyphus/evidence/task-20-integration-tests.txt

  Scenario: SPC hero flow integration test
    Tool: Jest
    Preconditions: hero-flow test written
    Steps:
      1. Test: Full SPC flow renders correctly
      2. Test: Inject fault triggers violation
      3. Test: Acknowledge clears violation and resumes
      4. Test: Event log shows expected SECS messages
    Expected Result: All hero flow assertions pass
    Failure Indicators: Any step fails
    Evidence: .sisyphus/evidence/task-20-hero-flow.txt
  ```

  **Commit**: YES (groups with Wave 5)
  - Message: `test(mes): add integration tests for SmartFactory interactive flows`
  - Files: 4 test files in `tests/integration/`
  - Pre-commit: `cd equipment-monitor && npx jest --passWithNoTests`

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.

- [x] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, run command). For each "Must NOT Have": search codebase for forbidden patterns. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [x] F2. **Code Quality Review** — `unspecified-high`
  Run `npm run build` + `npm test`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names. Verify zero inline hex colors in new files (use `grep -r '#[0-9A-Fa-f]\{6\}' src/components/ src/app/mes/`).
  Output: `Build [PASS/FAIL] | Tests [N pass/N fail] | Files [N clean/N issues] | VERDICT`

- [x] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill)
  Start from clean state. Execute EVERY QA scenario from EVERY task. Test the full hero demo flow: load → inject fault → violation → acknowledge → resume. Navigate to /mes/equipment and verify fab map. Click every Header icon. Verify AI Panel Apply/Override. Cross-task integration: SPC dashboard updates reflect in EventLog + KPIs. Save to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [x] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff (git log/diff). Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT Have" compliance. Detect cross-task contamination. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

- **Wave 1**: `feat(mes): add design tokens and store expansion for SmartFactory layout` — `globals.css`, `mes-spc-store.ts`, `package.json`, `mes-mock-data.ts`, `secs-message-log.ts`
- **Wave 2**: `feat(mes): add SmartFactory header, gauge KPIs, footer, process flow, WIP donut` — `header.tsx`, `KpiGaugeCard.tsx`, `FooterStatusBar.tsx`, `ProcessFlow.tsx`, `WIPDonutChart.tsx`
- **Wave 3**: `feat(mes): add AI panel, notifications, enhanced event log and lot tracker` — `AiRecommendations.tsx`, `NotificationPanel.tsx`, `EventLog.tsx`, `lots/page.tsx`
- **Wave 4**: `feat(mes): add 3D fab floor map, equipment page, and dashboard integration` — `FabFloorMap.tsx`, `equipment/page.tsx`, `spc/page.tsx`, animation files
- **Wave 5**: `test(mes): add component and integration tests for SmartFactory layout` — test files

---

## Success Criteria

### Verification Commands
```bash
cd equipment-monitor && npm run build          # Expected: Build succeeds, static export
cd equipment-monitor && npm test                 # Expected: All tests pass
cd equipment-monitor && npx playwright test       # Expected: All E2E scenarios pass
```

### Final Checklist
- [ ] All "Must Have" items present and functional
- [ ] All "Must NOT Have" items absent from codebase
- [ ] All tests pass
- [ ] Dashboard matches reference design at 1920×1080
- [ ] Every button/icon/menu click produces real state change
- [ ] `/mes/equipment` route renders 3D fab map
- [ ] Original SPC demo flow still works end-to-end