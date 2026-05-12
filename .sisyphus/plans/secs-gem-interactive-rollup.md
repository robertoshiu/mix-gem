# SECS/GEM Interactive Rollup Enhancement

## TL;DR

> **Quick Summary**: Enhance the SECS/GEM simulator page with rich interactive animations — accordion rollup for scenario steps, staggered feed cascade, typewriter text effects, glowing pulse highlights, expandable SECS payload viewers, and auto-rolling recipe detail cards. All powered by framer-motion with prefers-reduced-motion fallbacks.
> 
> **Deliverables**:
> - Animation variants file with spring configs, stagger, glow, and accordion presets
> - 4 new components: ScenarioStepCard, FeedPacketCard, RecipeDetailCard, PayloadViewer
> - Refactored page.tsx integrating all components with auto-rollup state logic
> - Updated tests covering component logic and page integration
> - Fixed Python 3.12 f-string bug in ui-ux-pro-max script
> 
> **Estimated Effort**: Medium
> **Parallel Execution**: YES - 4 waves
> **Critical Path**: T1 → T2-T5 → T6 → T7-T9 → F1-F4

---

## Context

### Original Request
User wants the SECS/GEM simulator page to have "more interactive and dynamic data feeding effect on web page, every scenario, recipe can automatic rollup." Specifically: blended accordion/cascade/wave animations for scenario steps, rich streaming effects for data feed, expandable detail panels with SECS payload data, and auto-rolling recipe detail cards.

### Interview Summary
**Key Discussions**:
- Rollup behavior: Blended approach — accordion collapse for completed, wave/pack for active, staggered cascade for new data
- Feed effects: Rich streaming — typewriter text reveal, glowing border pulse, staggered row animation
- Step detail: Expandable panels showing full SECS payload, raw SML, state variables, direction arrows
- Recipe auto-roll: Recipe card auto-rolls when recipe push step activates, showing recipe ID, parameters, S2F49/S2F50 pairs

**Research Findings**:
- framer-motion v12.38.0 already installed and used in 9 other components
- `animation.ts` has spring configs (stiffness: 300, damping: 25, mass: 0.8) and standard variants
- `secs-message-log.ts` has builders for S6F11, S2F41, S2F42, S2F49, S2F50 with realistic payloads
- Current page is 486 lines with ZERO framer-motion usage — only CSS transitions
- MOCK_RECIPES has 3 recipes with id, name, process, chamber, exposure, focus fields
- SmartFactory design token system with 30+ CSS custom properties

### Metis Review
**Identified Gaps** (addressed):
- Animation timing specifics: Resolved — using animation.ts spring config, stagger 60ms, typewriter 25ms/char, glow 2s pulse cycle
- Recipe auto-roll trigger: Resolved — data-driven (S2F49 detection in message stream), not hardcoded step index
- Manual override vs auto-animation: Resolved — user click pauses auto-collapse for 5 seconds, then resumes
- Max feed packet count: Resolved — 50 visible packets with circular buffer overflow
- Long SECS payloads: Resolved — cap at 500 lines with overflow scroll, expand to full via secondary action
- Mobile responsiveness: Out of scope (control room dashboard, desktop-first)
- Testing strategy: Test component logic (expand/collapse state), not animation frames

---

## Work Objectives

### Core Objective
Transform the SECS/GEM simulator page from a static CSS-transition layout into a rich, interactive dashboard with automatic accordion rollup, staggered data feed cascade, typewriter text effects, and expandable detail panels — all while respecting prefers-reduced-motion and maintaining the existing design token system.

### Concrete Deliverables
- `src/lib/secs-simulator-animation.ts` — Animation variants, custom hooks, timing constants
- `src/components/secs-simulator/ScenarioStepCard.tsx` — Accordion step with expand/collapse + detail panel
- `src/components/secs-simulator/FeedPacketCard.tsx` — Enhanced packet with glow, typewriter, direction arrow
- `src/components/secs-simulator/RecipeDetailCard.tsx` — Auto-rolling recipe card with spring animation
- `src/components/secs-simulator/PayloadViewer.tsx` — Expandable SECS raw payload viewer with overflow handling
- `src/components/secs-simulator/TraceRow.tsx` — Animated trace table row with inline payload toggle
- Refactored `src/app/mes/secs-gem/page.tsx` — Integrated with all new components + auto-rollup state
- Updated `page.test.tsx` — Tests for new component logic and page integration

### Definition of Done
- [ ] Scenario steps auto-collapse when completed (300ms spring transition using animation.ts config)
- [ ] Active step auto-expands with full SECS detail panel (payload, direction, state variables)
- [ ] Feed packets enter with staggered cascade animation (60ms stagger, last 10 packets)
- [ ] Message summaries reveal with typewriter effect (25ms/char, instant when prefers-reduced-motion)
- [ ] Active elements display glowing border pulse (2s cycle, SmartFactory cyan accent)
- [ ] Recipe detail card auto-rolls when S2F49 message is detected in feed (data-driven trigger)
- [ ] Every trace table row has expandable payload viewer (click row to reveal raw SML, max 500 lines)
- [ ] Direction arrows on all messages (→ H2E, ← E2H)
- [ ] All animations respect prefers-reduced-motion (instant/fallback)
- [ ] Packet flood handling: max 50 visible, circular buffer overflow
- [ ] User manual expand click pauses auto-collapse for 5 seconds
- [ ] Existing test suite passes with no regressions

### Must Have
- Accordion rollup: completed steps collapse, active step expands (with content transition)
- Staggered data feed: AnimatePresence + staggerChildren for packet entrance
- Typewriter text: character-by-character reveal on message summaries
- Glow pulse: CSS box-shadow animation on active elements using SmartFactory tokens
- Recipe auto-roll: data-driven trigger on S2F49 detection, spring animation expansion
- Expandable payloads: click-to-reveal raw SML with overflow scroll
- Direction arrows: visual indicator for H2E (→) and E2H (←) on messages
- prefers-reduced-motion: all effects render instantly or disable entirely
- User override: manual click pauses auto-behavior for 5 seconds

### Must NOT Have (Guardrails)
- NO new npm packages (only framer-motion, already installed)
- NO backend changes (pure frontend enhancement)
- NO changes to data model or secs-message-log.ts builders
- NO WebSocket or real-time feed replacement (mock data stays)
- NO sound effects on incoming packets
- NO export/share functionality
- NO dark mode toggle (use existing SmartFactory tokens)
- NO component extraction to shared directories (keep in secs-simulator/)
- NO Storybook stories or documentation pages
- NO step-backward or replay-from-middle controls (existing replay is sufficient)
- NO localStorage or URL state persistence for expand/collapse states

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: YES (Jest + React Testing Library, existing test files)
- **Automated tests**: YES (tests-after — add tests after implementation)
- **Framework**: Jest (existing jest.config.mjs)

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Frontend/UI**: Use Playwright — Navigate, interact, assert DOM, screenshot
- **Component logic**: Use Bash (npx jest) — Run component tests, assert behavior
- **Build**: Use Bash (npm run build) — Verify no build errors

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — animation foundation):
├── T1: Animation variants + custom hooks [quick]

Wave 2 (After Wave 1 — component creation, MAX PARALLEL):
├── T2: ScenarioStepCard component (depends: T1) [quick]
├── T3: FeedPacketCard component (depends: T1) [quick]
├── T4: RecipeDetailCard component (depends: T1) [quick]
├── T5: PayloadViewer component (depends: T1) [quick]

Wave 3 (After Wave 2 — page integration, sequential):
├── T6: Refactor page.tsx scenario console + auto-rollup logic (depends: T2) [deep]
├── T7: Refactor page.tsx data feed + trace table (depends: T3, T5) [deep]
├── T8: Add recipe auto-roll card to page (depends: T4) [unspecified-high]
├── T9: Add prefers-reduced-motion + packet flood handling (depends: T6, T7) [unspecified-high]

Wave 4 (After Wave 3 — testing + polish):
├── T10: Update page + component tests (depends: T6-T9) [unspecified-high]
├── T11: Fix ui-ux-pro-max Python 3.12 f-string bug (depends: none) [quick]

Wave FINAL (After ALL tasks — 4 parallel reviews, then user okay):
├── F1: Plan compliance audit (oracle)
├── F2: Code quality review (unspecified-high)
├── F3: Real manual QA (unspecified-high + playwright)
└── F4: Scope fidelity check (deep)
→ Present results → Get explicit user okay

Critical Path: T1 → T2 → T6 → T9 → T10 → F1-F4 → user okay
Parallel Speedup: ~45% faster than sequential
Max Concurrent: 4 (Wave 2)
```

### Dependency Matrix

| Task | Depends On | Blocks | Wave |
|------|-----------|--------|------|
| T1   | — | T2,T3,T4,T5 | 1 |
| T2   | T1 | T6 | 2 |
| T3   | T1 | T7 | 2 |
| T4   | T1 | T8 | 2 |
| T5   | T1 | T7 | 2 |
| T6   | T2 | T9 | 3 |
| T7   | T3,T5 | T9 | 3 |
| T8   | T4 | — | 3 |
| T9   | T6,T7 | T10 | 3 |
| T10  | T6,T7,T8,T9 | F1-F4 | 4 |
| T11  | — | — | 4 |

### Agent Dispatch Summary

- **Wave 1**: 1 — T1 → `quick`
- **Wave 2**: 4 — T2 → `quick`, T3 → `quick`, T4 → `quick`, T5 → `quick`
- **Wave 3**: 4 — T6 → `deep`, T7 → `deep`, T8 → `unspecified-high`, T9 → `unspecified-high`
- **Wave 4**: 2 — T10 → `unspecified-high`, T11 → `quick`
- **FINAL**: 4 — F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high`, F4 → `deep`

---

## TODOs

- [x] 1. Animation Variants + Custom Hooks

  **What to do**:
  - Create `equipment-monitor/src/lib/secs-simulator-animation.ts` with:
    - SECS-specific framer-motion variants: `stepExpand` (accordion open), `stepCollapse` (accordion close), `packetEnter` (staggered cascade), `packetExit`, `glowPulse`, `recipeRollUp`, `payloadExpand`, `payloadCollapse`
    - Timing constants: `STAGGER_DELAY = 60` (ms between packets), `TYPEWRITER_SPEED = 25` (ms per character), `GLOW_CYCLE = 2000` (ms pulse duration), `MAX_VISIBLE_PACKETS = 50`, `USER_OVERRIDE_DURATION = 5000` (ms)
    - Custom hook `useTypewriter(text: string, speed: number)`: reveals text character-by-character, returns displayed text, completes instantly when `prefers-reduced-motion: reduce`
    - Custom hook `useReducedMotion()`: wraps the existing `prefersReducedMotion()` from `animation.ts` for React component use
    - Spring config reuse: import and extend `springConfig`, `transitionConfig` from `@/lib/animation`
    - Export all variants, constants, and hooks for use by components
  - Reference existing `src/lib/animation.ts` for pattern consistency

  **Must NOT do**:
  - Do NOT modify `animation.ts` — create a new dedicated file
  - Do NOT add any new npm packages
  - Do NOT create React context providers (hooks only)

  **Recommended Agent Profile**:
  > Component files are small and self-contained.
  - **Category**: `quick`
    - Reason: Single file, well-defined interface, follows existing animation.ts patterns
  - **Skills**: []
    - No specialized skills needed — standard TypeScript + framer-motion

  **Parallelization**:
  - **Can Run In Parallel**: NO — foundation file needed by T2-T5
  - **Parallel Group**: Wave 1 (alone)
  - **Blocks**: T2, T3, T4, T5
  - **Blocked By**: None (can start immediately)

  **References**:
  **Pattern References**:
  - `equipment-monitor/src/lib/animation.ts` — Existing animation variants pattern (Variants type, springConfig, transitionConfig, fadeInUp, staggerContainer, pulseGlow, getSafeVariants, prefersReducedMotion)

  **API/Type References**:
  - `framer-motion` v12.38.0 — `Variants`, `Transition`, `AnimatePresence`, `motion` types (already installed)

  **WHY Each Reference Matters**:
  - `animation.ts` — Copy the exact pattern for variant definitions, spring config structure, and reduced-motion support

  **Acceptance Criteria**:
  - [ ] File exists: `equipment-monitor/src/lib/secs-simulator-animation.ts`
  - [ ] Exports: `stepExpand`, `stepCollapse`, `packetEnter`, `packetExit`, `glowPulse`, `recipeRollUp`, `payloadExpand`, `payloadCollapse` variants
  - [ ] Exports: `STAGGER_DELAY`, `TYPEWRITER_SPEED`, `GLOW_CYCLE`, `MAX_VISIBLE_PACKETS`, `USER_OVERRIDE_DURATION` constants
  - [ ] Exports: `useTypewriter` hook (returns string, completes instantly on reduced-motion)
  - [ ] Exports: `useReducedMotion` hook (returns boolean)
  - [ ] All variants use spring config from `@/lib/animation`
  - [ ] TypeScript compiles without errors

  **QA Scenarios**:

  ```
  Scenario: Animation variants use correct spring config
    Tool: Bash (node)
    Preconditions: File exists
    Steps:
      1. Run: cd equipment-monitor && npx tsc --noEmit
      2. Verify exit code 0
      3. Grep for "import.*springConfig.*from.*animation" in secs-simulator-animation.ts — must find import
      4. Grep for "springConfig" usage in variant definitions — must show spring config is reused (not hardcoded stiffness/damping values)
    Expected Result: TypeScript compiles, spring config imported and reused from animation.ts
    Failure Indicators: Type errors, missing imports, hardcoded spring values instead of config reuse
    Evidence: .sisyphus/evidence/task-1-variants-compile.txt

  Scenario: useTypewriter completes instantly on reduced-motion
    Tool: Bash (jest)
    Preconditions: File exists
    Steps:
      1. Create test that mocks `window.matchMedia` to return `matches: true` for `(prefers-reduced-motion: reduce)`
      2. Call `useTypewriter("Hello World", 25)` with reduced-motion active
      3. Assert returned text equals "Hello World" immediately (no progressive reveal)
    Expected Result: Full text returned instantly when prefers-reduced-motion is active
    Failure Indicators: Text revealed character-by-character despite reduced-motion
    Evidence: .sisyphus/evidence/task-1-typewriter-reduced-motion.txt
  ```

  **Commit**: YES (group with none)
  - Message: `feat(secs-sim): add animation variants and custom hooks`
  - Files: `equipment-monitor/src/lib/secs-simulator-animation.ts`

---

- [x] 2. ScenarioStepCard Component

  **What to do**:
  - Create `equipment-monitor/src/components/secs-simulator/ScenarioStepCard.tsx`:
    - Accordion component for scenario steps with three visual states: `complete` (collapsed, shows label + status badge), `active` (expanded, shows full detail panel), `pending` (dimmed, shows label only)
    - Props: `step: DemoScenarioStep`, `isActive: boolean`, `isComplete: boolean`, `message?: DemoSecsMessage`, `snapshot?: DemoSnapshot`, `onUserExpand?: () => void`
    - When `isActive`, auto-expand with `stepExpand` framer-motion variant (uses spring config stiffness: 300, damping: 25)
    - When `isComplete`, auto-collapse with `stepCollapse` variant (smooth height transition)
    - Detail panel in active state shows: SECS message payload (rendered as key-value pairs with labels), direction arrow (→ for H2E, ← for E2H), affected state variables from snapshot, expected reply message pair
    - `AnimatePresence` for mount/unmount of detail panel content
    - Top border glow animation on active step: `glowPulse` variant with cyan accent color
    - Checkmark icon (CheckCircle) for completed, Circle for pending, pulse indicator for active
    - Manual expand: if user clicks a completed step, call `onUserExpand` to pause auto-collapse
    - All animations check `useReducedMotion()` — if true, render instantly without transitions
    - Use SmartFactory design tokens (`var(--sf-*)`) for all colors
    - Use `cn()` from `@/lib/utils` for conditional classes
    - Scan through existing SPC components (especially `ViolationCard.tsx`, `KpiGaugeCard.tsx`) for layout and transition patterns to follow

  **Must NOT do**:
  - Do NOT create React context or global state
  - Do NOT add new npm packages
  - Do NOT render raw JSON — format payload as labeled key-value pairs

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single component file, well-defined props, follows existing card pattern
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with T3, T4, T5)
  - **Parallel Group**: Wave 2
  - **Blocks**: T6
  - **Blocked By**: T1

  **References**:
  **Pattern References**:
  - `equipment-monitor/src/components/spc/ViolationCard.tsx` — Card layout with status colors and conditional rendering pattern
  - `equipment-monitor/src/components/spc/KpiGaugeCard.tsx` — framer-motion animation on card component (`motion.div` with `scaleIn` variant)
  - `equipment-monitor/src/lib/animation.ts` — spring config import pattern, getSafeVariants usage

  **API/Type References**:
  - `equipment-monitor/src/lib/secs-gem-demo-data.ts:DemoScenarioStep` — Step type with id, label, actor, action, primary, expected, status
  - `equipment-monitor/src/lib/secs-gem-demo-data.ts:DemoSecsMessage` — Message type with id, direction, sf, wbit, summary, payload
  - `equipment-monitor/src/lib/secs-gem-demo-data.ts:DemoSnapshot` — Snapshot type with stateVariables, pendingTransactions
  - `equipment-monitor/src/lib/secs-simulator-animation.ts` — Step variants (stepExpand, stepCollapse, glowPulse), useReducedMotion hook

  **Test References**:
  - `equipment-monitor/src/components/spc/KpiGaugeCard.test.tsx` — Card component test pattern

  **WHY Each Reference Matters**:
  - ViolationCard — Same visual pattern (status-colored card with conditional detail)
  - KpiGaugeCard — Same motion pattern (framer-motion on card with spring config)
  - DemoScenarioStep — Prop type definitions to match
  - animation.ts — Import pattern for existing spring config

  **Acceptance Criteria**:
  - [ ] Component renders with `complete`, `active`, `pending` visual states
  - [ ] Active state auto-expands detail panel with spring animation
  - [ ] Complete state shows collapsed view (status + label only)
  - [ ] Pending state shows dimmed label only
  - [ ] Detail panel shows SECS payload as labeled key-value pairs
  - [ ] Direction arrow displayed: → for H2E, ← for E2H
  - [ ] Active step has glowing border pulse animation
  - [ ] All animations instant when reduced-motion is active
  - [ ] TypeScript compiles without errors

  **QA Scenarios**:

  ```
  Scenario: ScenarioStepCard renders active step with expanded detail
    Tool: Bash (jest)
    Preconditions: Component file exists
    Steps:
      1. Render ScenarioStepCard with isActive=true, isComplete=false
      2. Provide mock message and snapshot props
      3. Assert detail panel is visible in DOM
      4. Assert direction arrow is rendered for the message
      5. Assert payload key-value pairs are displayed
    Expected Result: Detail panel expanded, payload visible, direction arrow correct
    Failure Indicators: Detail panel hidden, payload missing, arrow missing
    Evidence: .sisyphus/evidence/task-2-active-step.txt

  Scenario: Completed step renders collapsed (no detail panel)
    Tool: Bash (jest)
    Preconditions: Component file exists
    Steps:
      1. Render ScenarioStepCard with isActive=false, isComplete=true
      2. Assert detail panel is NOT in DOM (AnimatePresence exit)
      3. Assert collapsed view shows only label and status badge
    Expected Result: Collapsed view with CheckCircle icon, label, status text
    Failure Indicators: Detail panel still visible, full content shown
    Evidence: .sisyphus/evidence/task-2-completed-step.txt
  ```

  **Commit**: YES (group with none)
  - Message: `feat(secs-sim): add ScenarioStepCard with accordion behavior`
  - Files: `equipment-monitor/src/components/secs-simulator/ScenarioStepCard.tsx`

---

- [x] 3. FeedPacketCard Component

  **What to do**:
  - Create `equipment-monitor/src/components/secs-simulator/FeedPacketCard.tsx`:
    - Enhanced feed packet with three animation effects: (1) glow border pulse on active/latest message, (2) typewriter text reveal on summary, (3) direction arrow (→ or ←)
    - Props: `message: DemoSecsMessage`, `isActive: boolean`, `index: number`, `enableTypewriter?: boolean`
    - Use `glowPulse` variant for active state border: `box-shadow: 0 0 0px → 0 0 18px → 0 0 4px` cycling with `--sf-accent-cyan` color
    - Use `useTypewriter` hook for summary text when `enableTypewriter=true`: reveals summary character-by-character at TYPEWRITER_SPEED (25ms/char)
    - Direction badge: H2E → blue background with → arrow, E2H → teal background with ← arrow
    - Entry animation: `packetEnter` variant with `staggerChildren: STAGGER_DELAY` (60ms) applied by parent
    - Exit animation: `packetExit` variant (fade out + slide left)
    - All animations check `useReducedMotion()` — if true, render instantly
    - Use SmartFactory design tokens for all colors
    - Use `cn()` for conditional classes
    - Follow existing `FeedPacket` pattern in page.tsx (lines 60-86) but enhanced

  **Must NOT do**:
  - Do NOT add sound effects
  - Do NOT add click handlers (that's PayloadViewer's job)
  - Do NOT modify existing FeedPacket in page.tsx yet (that's T7)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single component, well-defined behavior, follows existing pattern
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with T2, T4, T5)
  - **Parallel Group**: Wave 2
  - **Blocks**: T7
  - **Blocked By**: T1

  **References**:
  **Pattern References**:
  - `equipment-monitor/src/app/mes/secs-gem/page.tsx:60-86` — Existing FeedPacket component with conditional glow, direction badge, summary text

  **API/Type References**:
  - `equipment-monitor/src/lib/secs-gem-demo-data.ts:DemoSecsMessage` — Message type
  - `equipment-monitor/src/lib/secs-simulator-animation.ts` — packetEnter, packetExit, glowPulse variants, useTypewriter, useReducedMotion

  **WHY Each Reference Matters**:
  - Existing FeedPacket — Exact structural pattern to enhance (border styling, direction badge, summary layout)

  **Acceptance Criteria**:
  - [ ] Component renders message with direction arrow (→ H2E, ← E2H)
  - [ ] Active message has glowing border pulse (cyan, 2s cycle)
  - [ ] Inactive message has default border
  - [ ] Summary text reveals with typewriter effect when enableTypewriter=true
  - [ ] Summary text displays instantly when reduced-motion is active
  - [ ] Entry animation uses packetEnter variant with stagger
  - [ ] Exit animation uses packetExit variant
  - [ ] TypeScript compiles without errors

  **QA Scenarios**:

  ```
  Scenario: Active packet renders with glow and direction arrow
    Tool: Bash (jest)
    Preconditions: Component file exists
    Steps:
      1. Render FeedPacketCard with isActive=true, mock H2E message
      2. Assert glow animation class/variant applied to container
      3. Assert direction badge shows → with blue background
      4. Render FeedPacketCard with isActive=true, mock E2H message
      5. Assert direction badge shows ← with teal background
    Expected Result: Active packet glows, direction arrows correct
    Failure Indicators: No glow class, wrong arrow direction
    Evidence: .sisyphus/evidence/task-3-active-packet.txt

  Scenario: Typewriter reveals text progressively
    Tool: Bash (jest)
    Preconditions: Component file exists
    Steps:
      1. Render with enableTypewriter=true, message summary "S1F13 Establish Comms"
      2. Assert initially only first characters visible (use fake timers, advance by 25ms increments)
      3. After full duration (25ms × character count), assert full summary visible
      4. Render with reduced-motion=true
      5. Assert full summary visible immediately
    Expected Result: Progressive reveal at 25ms/char, instant with reduced-motion
    Failure Indicators: Full text shown immediately without typewriter, or still partial after full duration
    Evidence: .sisyphus/evidence/task-3-typewriter.txt
  ```

  **Commit**: YES (group with none)
  - Message: `feat(secs-sim): add FeedPacketCard with glow and typewriter`
  - Files: `equipment-monitor/src/components/secs-simulator/FeedPacketCard.tsx`

---

- [x] 4. RecipeDetailCard Component

  **What to do**:
  - Create `equipment-monitor/src/components/secs-simulator/RecipeDetailCard.tsx`:
    - Auto-rolling card that spring-animates into view when a recipe push message (S2F49) is detected
    - Props: `recipe: Recipe | null`, `isVisible: boolean`, `messageS2F49?: DemoSecsMessage`, `messageS2F50?: DemoSecsMessage`
    - When `isVisible=true` and `recipe !== null`, animate in with `recipeRollUp` variant (slide up + fade in, using spring config)
    - When `isVisible=false`, animate out with `recipeRollUp` exit variant (slide down + fade out)
    - Display: recipe ID, name, process, chamber, exposure (mJ/cm²), focus (nm offset) from Recipe data
    - Display: S2F49 message summary (blue badge → host sends recipe), S2F50 message summary (teal badge ← equipment acknowledges)
    - Visual: border with `var(--sf-accent-violet)` accent, recipe icon from lucide-react (BookOpen or similar)
    - Spring in from bottom: initial y: 40, animate y: 0 with springConfig
    - All animations check `useReducedMotion()` — if true, render instantly
    - Use SmartFactory design tokens, `cn()` for conditional classes
    - `Recipe` type imported from `@/lib/mes-types` or `@/lib/mes-mock-data`

  **Must NOT do**:
  - Do NOT fetch recipe data from backend — use MOCK_RECIPES
  - Do NOT add WebSocket or real-time data
  - Do NOT render when recipe is null or isVisible is false (AnimatePresence handles exit)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single component, clear animation spec, few props
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with T2, T3, T5)
  - **Parallel Group**: Wave 2
  - **Blocks**: T8
  - **Blocked By**: T1

  **References**:
  **Pattern References**:
  - `equipment-monitor/src/components/spc/AiRecommendations.tsx` — Panel with icon, title, and content cards (similar layout pattern)
  - `equipment-monitor/src/lib/animation.ts:slideInRight` — Slide animation variant to reference for recipeRollUp

  **API/Type References**:
  - `equipment-monitor/src/lib/mes-types.ts:Recipe` — Recipe type (id, name, process, chamber, exposure, focus) — **Import from HERE, not mes-mock-data**
  - `equipment-monitor/src/lib/mes-mock-data.ts:MOCK_RECIPES` — Recipe array data
  - `equipment-monitor/src/lib/mes-types.ts:Recipe` — Recipe type definition (import Recipe from here)
  - `equipment-monitor/src/lib/secs-gem-demo-data.ts:DemoSecsMessage` — Message type for S2F49/S2F50
  - `equipment-monitor/src/lib/secs-simulator-animation.ts` — recipeRollUp variant, useReducedMotion

  **WHY Each Reference Matters**:
  - AiRecommendations — Card panel layout with accent border and icon
  - MOCK_RECIPES — Data structure to render (id, name, process, chamber, exposure, focus)
  - animation.ts — Slide animation pattern for recipeRollUp

  **Acceptance Criteria**:
  - [ ] Card renders recipe data (id, name, process, chamber, exposure, focus)
  - [ ] S2F49 message shown with blue → badge
  - [ ] S2F50 message shown with teal ← badge
  - [ ] Spring animates in from bottom (y: 40 → 0) when isVisible becomes true
  - [ ] AnimatePresence exits when isVisible becomes false
  - [ ] Instant render when reduced-motion is active
  - [ ] Null recipe renders nothing
  - [ ] TypeScript compiles without errors

  **QA Scenarios**:

  ```
  Scenario: Recipe card auto-rolls into view on S2F49 detection
    Tool: Bash (jest)
    Preconditions: Component file exists
    Steps:
      1. Render with isVisible=false, recipe=null — assert nothing in DOM
      2. Render with isVisible=true, recipe=MOCK_RECIPES[0], message with S2F49
      3. Assert card is visible with recipe name, process, chamber
      4. Assert → blue badge shows S2F49 summary
      5. Rerender with isVisible=false — assert card animated out (AnimatePresence)
    Expected Result: Card spring-animates in, shows recipe + message data, animates out
    Failure Indicators: Card not visible, missing recipe fields, no animation
    Evidence: .sisyphus/evidence/task-4-recipe-roll.txt

  Scenario: Recipe card hidden when recipe is null or not visible
    Tool: Bash (jest)
    Preconditions: Component file exists
    Steps:
      1. Render with isVisible=false, recipe=MOCK_RECIPES[0] — assert not in DOM
      2. Render with isVisible=true, recipe=null — assert not in DOM
      3. Render with isVisible=false, recipe=null — assert not in DOM
    Expected Result: Card not visible in any null/invisible combination
    Failure Indicators: Card visible with null recipe or when hidden
    Evidence: .sisyphus/evidence/task-4-recipe-null.txt
  ```

  **Commit**: YES (group with none)
  - Message: `feat(secs-sim): add RecipeDetailCard with auto-roll animation`
  - Files: `equipment-monitor/src/components/secs-simulator/RecipeDetailCard.tsx`

---

- [x] 5. PayloadViewer Component

  **What to do**:
  - Create `equipment-monitor/src/components/secs-simulator/PayloadViewer.tsx`:
    - Expandable panel that reveals raw SECS message payload (SML-like format) on click
    - Props: `payload: Record<string, unknown>`, `defaultExpanded?: boolean`, `maxLines?: number` (default 500)
    - Header with toggle button (chevron icon that rotates 180° on expand)
    - Uses `payloadExpand` / `payloadCollapse` framer-motion variants for height animation
    - Content area: formatted key-value pairs from payload object, with syntax highlighting (stream/function in bold, numbers highlighted)
    - Overflow handling: `max-height` with `overflow-y: auto` if payload exceeds `maxLines` lines, with scrollbar styled to match design tokens
    - "Show Full Payload" secondary expand action if content exceeds maxLines
    - AnimatePresence for expand/collapse transition (height auto with spring)
    - All animations check `useReducedMotion()` — if true, expand/collapse instantly
    - Use SmartFactory design tokens, monospace font (JetBrains Mono via `font-mono`)
    - Use `cn()` for conditional classes

  **Must NOT do**:
  - Do NOT add JSON.stringify raw dump — format as labeled key-value pairs
  - Do NOT render payloads exceeding 500 lines fully — use overflow
  - Do NOT add copy-to-clipboard (out of scope)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single component, well-defined behavior, small file
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with T2, T3, T4)
  - **Parallel Group**: Wave 2
  - **Blocks**: T7
  - **Blocked By**: T1

  **References**:
  **Pattern References**:
  - `equipment-monitor/src/components/ui/dialog.tsx` — Expand/collapse pattern from Radix Dialog

  **API/Type References**:
  - `equipment-monitor/src/lib/secs-gem-demo-data.ts:DemoSecsMessage.payload` — `Record<string, unknown>` type
  - `equipment-monitor/src/lib/secs-simulator-animation.ts` — payloadExpand, payloadCollapse variants, useReducedMotion

  **WHY Each Reference Matters**:
  - Dialog.tsx — Expand/collapse animation pattern with AnimatePresence
  - DemoSecsMessage.payload — Exact data structure to render

  **Acceptance Criteria**:
  - [ ] Toggle button expands/collapses payload content
  - [ ] Key-value pairs formatted with labels (not raw JSON)
  - [ ] Stream/function values in bold monospace
  - [ ] Content capped at 500 lines with overflow scroll
  - [ ] "Show Full Payload" secondary action for long content
  - [ ] Spring animation on expand/collapse with AnimatePresence
  - [ ] Instant expand/collapse when reduced-motion is active
  - [ ] Chevron rotates 180° on expand
  - [ ] TypeScript compiles without errors

  **QA Scenarios**:

  ```
  Scenario: Payload viewer expands on click and formats content
    Tool: Bash (jest)
    Preconditions: Component file exists
    Steps:
      1. Render PayloadViewer with defaultExpanded=false and mock payload { stream: 1, function: 13, mdln: "MIX-GEM-DEMO" }
      2. Assert content area is NOT visible (collapsed)
      3. Click toggle button
      4. Assert content area IS visible with formatted key-value pairs
      5. Assert "stream" and "function" values are bold (check for font-bold class)
    Expected Result: Content hidden by default, expands on click, formatted as labeled pairs
    Failure Indicators: Content visible before click, raw JSON shown, no bold formatting
    Evidence: .sisyphus/evidence/task-5-payload-expand.txt

  Scenario: Payload viewer caps at 500 lines with overflow
    Tool: Bash (jest)
    Preconditions: Component file exists
    Steps:
      1. Render PayloadViewer with maxLines=10 and a payload that generates 20+ lines
      2. Expand the viewer
      3. Assert content area has overflow-y: auto style
      4. Assert "Show Full Payload" option is visible
    Expected Result: Scrollable content area with "Show Full Payload" action
    Failure Indicators: Full content shown without scroll, no "Show Full Payload" option
    Evidence: .sisyphus/evidence/task-5-payload-overflow.txt
  ```

  **Commit**: YES (group with none)
  - Message: `feat(secs-sim): add PayloadViewer with expand/collapse`
  - Files: `equipment-monitor/src/components/secs-simulator/PayloadViewer.tsx`

---

- [x] 6. Integrate ScenarioStepCard + Auto-Rollup Logic

  **What to do**:
  - Refactor `equipment-monitor/src/app/mes/secs-gem/page.tsx`:
    - Replace the static scenario step grid (lines 274-302) with ScenarioStepCard components
    - Add auto-rollup state management: track which steps are expanded/collapsed based on active scenario index
    - When `activeScenarioIndex` changes (feed progresses), automatically:
      1. Collapse the previously active step (framer-motion AnimatePresence exit)
      2. Expand the new active step (framer-motion AnimatePresence enter with spring)
    - Add user override: if user clicks to manually expand a completed step, set a 5-second override timer that prevents auto-collapse for that step
    - Pass `message`, `snapshot`, `isActive`, `isComplete` props to each ScenarioStepCard
    - Use `stepExpand` / `stepCollapse` variants from secs-simulator-animation.ts for the accordion behavior
    - Import ScenarioStepCard from `@/components/secs-simulator/ScenarioStepCard`
    - Use AnimatePresence wrapper around the step list for smooth transitions
    - Add `useReducedMotion` check: if reduced-motion, skip AnimatePresence and render static

  **Must NOT do**:
  - Do NOT change the scenario step data structure or data source
  - Do NOT modify secs-gem-demo-data.ts
  - Do NOT remove Play/Pause/Step/Reset controls
  - Do NOT change the page layout outside the scenario console section

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Complex integration with state management, multiple component interactions, auto-rollup timer logic
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO — modifies page.tsx which T7 also modifies
  - **Parallel Group**: Wave 3 (first)
  - **Blocks**: T9
  - **Blocked By**: T2

  **References**:
  **Pattern References**:
  - `equipment-monitor/src/app/mes/secs-gem/page.tsx:274-302` — Current static scenario step grid to replace
  - `equipment-monitor/src/app/mes/spc/page.tsx` — Existing page with framer-motion AnimatePresence pattern

  **API/Type References**:
  - `equipment-monitor/src/components/secs-simulator/ScenarioStepCard.tsx` — Component props (step, isActive, isComplete, message, snapshot, onUserExpand)
  - `equipment-monitor/src/lib/secs-simulator-animation.ts` — stepExpand, stepCollapse variants, USER_OVERRIDE_DURATION
  - `equipment-monitor/src/lib/secs-gem-demo-data.ts` — DemoScenarioStep, DemoSecsMessage, DemoSnapshot types

  **WHY Each Reference Matters**:
  - Current page.tsx lines 274-302 — Exact code being refactored, must preserve functionality
  - SPC page — AnimatePresence pattern for page transitions
  - ScenarioStepCard — Props interface to match

  **Acceptance Criteria**:
  - [ ] Scenario steps use ScenarioStepCard components instead of static divs
  - [ ] Active step auto-expands when feed advances
  - [ ] Previously active step auto-collapses with spring animation
  - [ ] Completed steps show collapsed view
  - [ ] Pending steps show dimmed view
  - [ ] User click on completed step pauses auto-collapse for 5 seconds
  - [ ] AnimatePresence wraps step transitions
  - [ ] Reduced-motion: no animations, instant state changes
  - [ ] TypeScript compiles without errors

  **QA Scenarios**:

  ```
  Scenario: Steps auto-collapse and expand as feed progresses
    Tool: Playwright
    Preconditions: Dev server running at localhost:3000
    Steps:
      1. Navigate to http://localhost:3000/mes/secs-gem
      2. Click Start to begin feed
      3. Wait for first scenario step to become active (visibleMessageCount increases)
      4. Assert: step 0 shows expanded detail panel, step 1 shows pending
      5. Continue feeding until step 1 becomes active
      6. Assert: step 0 shows collapsed (complete) view, step 1 shows expanded detail panel
      7. Take screenshot of transition
    Expected Result: Accordion behavior — active expands, completed collapses
    Failure Indicators: Both steps expanded, no animation, detail panel missing
    Evidence: .sisyphus/evidence/task-6-accordion-behavior.png

  Scenario: User click on completed step pauses auto-collapse
    Tool: Bash (jest)
    Preconditions: Page test file exists
    Steps:
      1. Render page, advance feed to make step 2 active
      2. Click on step 0 (completed) to manually expand it
      3. Assert: step 0 is expanded despite being completed
      4. Wait 6 seconds (beyond 5-second override)
      5. Assert: step 0 has auto-collapsed back to completed view
    Expected Result: Manual expand works, auto-collapse resumes after 5s
    Failure Indicators: Step immediately collapses, or never collapses after override
    Evidence: .sisyphus/evidence/task-6-user-override.txt
  ```

  **Commit**: YES (group with none)
  - Message: `feat(secs-sim): integrate ScenarioStepCard into page with auto-rollup`
  - Files: `equipment-monitor/src/app/mes/secs-gem/page.tsx`

---

- [x] 7. Integrate Enhanced Feed + Trace Table (including TraceRow component)

  **What to do**:
  - Create `equipment-monitor/src/components/secs-simulator/TraceRow.tsx`:
    - Enhanced trace table row component with: direction arrow prefix (→ for H2E, ← for E2H), staggered entrance animation via `packetEnter` variant, exit animation via `packetExit` variant
    - Each row has a clickable summary that toggles a PayloadViewer panel inline (below the row, expanding the row height)
    - PayloadViewer shows the full SECS message payload when expanded, bounded by maxLines=500 with overflow scroll
    - Props: `message: DemoSecsMessage`, `isLatest: boolean`, `index: number`, `defaultExpanded?: boolean`
    - Uses `useReducedMotion()` — if true, renders without AnimatePresence and instantly shows payload
  - Refactor `equipment-monitor/src/app/mes/secs-gem/page.tsx`:
    - Replace the static FeedPacket component (lines 60-86) and data feed section (lines 306-329) with FeedPacketCard components
    - Replace the Live SECS Trace table rows (lines 354-387) with enhanced rows that include:
      - Direction arrow (→ for H2E, ← for E2H) next to direction badge
      - Staggered entrance animation for new rows using AnimatePresence + packetEnter variant
      - Exit animation for rows that scroll out of view using packetExit variant
    - Add AnimatePresence wrapper around the 3-packet feed display for entering/exiting packets
    - Add staggerChildren timing (60ms) to the feed packet container
    - In the data feed section, show the 3 most recent packets with FeedPacketCard (enableTypewriter=true on latest, false on others)
    - Add a "View All Messages" count indicator when messages exceed displayed count
    - Import FeedPacketCard from `@/components/secs-simulator/FeedPacketCard`
    - Implement circular buffer for trace table: if visibleMessageCount > MAX_VISIBLE_PACKETS (50), only render the latest 50 rows
    - All new animations check `useReducedMotion()` — if true, render without AnimatePresence

  **Must NOT do**:
  - Do NOT change data source or message structure
  - Do NOT remove the progress bar or packet count indicator
  - Do NOT change the trace table column structure (still: Time, Dir, SxFy, W, Latency, System bytes, Summary)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Significant page refactoring, AnimatePresence integration, stagger layout logic
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO — modifies same page.tsx as T6 and T8
  - **Parallel Group**: Wave 3 (sequential after T6)
  - **Blocks**: T9
  - **Blocked By**: T3, T5

  **References**:
  **Pattern References**:
  - `equipment-monitor/src/app/mes/secs-gem/page.tsx:60-86` — Current FeedPacket component to replace
  - `equipment-monitor/src/app/mes/secs-gem/page.tsx:306-329` — Current data feed section
  - `equipment-monitor/src/app/mes/secs-gem/page.tsx:341-390` — Current trace table section

  **API/Type References**:
  - `equipment-monitor/src/components/secs-simulator/FeedPacketCard.tsx` — Component props (message, isActive, index, enableTypewriter)
  - `equipment-monitor/src/components/secs-simulator/PayloadViewer.tsx` — Component for payload expansion in trace rows
  - `equipment-monitor/src/lib/secs-simulator-animation.ts` — packetEnter, packetExit, STAGGER_DELAY, MAX_VISIBLE_PACKETS, TYPEWRITER_SPEED

  **WHY Each Reference Matters**:
  - Lines 60-86 — Exact FeedPacket component being replaced
  - Lines 306-329 — Data feed section being enhanced with stagger
  - Lines 341-390 — Trace table being enhanced with direction arrows and animations

  **Acceptance Criteria**:
- [ ] Feed packets use FeedPacketCard component with typewriter on latest
  - [ ] New packets animate in with staggered cascade (60ms between each)
  - [ ] Active packet has glowing border pulse
  - [ ] Previous packets lose glow when new one arrives
  - [ ] TraceRow.tsx component created with direction arrows, stagger animation, inline payload toggle
  - [ ] Trace table rows include direction arrows (→ ←)
  - [ ] Clicking a trace row expands PayloadViewer inline below the row
  - [ ] Expanded payload shows formatted key-value pairs with max 500 lines overflow
  - [ ] New trace rows enter with packetEnter animation via AnimatePresence
  - [ ] Circular buffer: max 50 rows visible in trace table
  - [ ] Reduced-motion: all AnimotePresence removed, instant render
  - [ ] TypeScript compiles without errors

  **QA Scenarios**:

  ```
  Scenario: Feed packets enter with stagger animation
    Tool: Playwright
    Preconditions: Dev server running
    Steps:
      1. Navigate to http://localhost:3000/mes/secs-gem
      2. Click Start
      3. Wait for 3+ packets to appear
      4. Assert: latest packet has glow effect
      5. Assert: packet count indicator shows current/total
      6. Screenshot the feed section
    Expected Result: Packets stagger in, latest glows, count visible
    Failure Indicators: All packets appear instantly, no glow, no count
    Evidence: .sisyphus/evidence/task-7-stagger-feed.png

  Scenario: Trace table shows direction arrows and limits to 50 rows
    Tool: Bash (jest)
    Preconditions: Page test file exists
    Steps:
      1. Render page with > 50 messages (mock data)
      2. Assert: trace table renders at most 50 rows
      3. Assert: each row has direction arrow (→ or ←) alongside direction badge
      4. Assert: newest rows are rendered (not oldest)
    Expected Result: 50 rows max, each with direction arrow, newest visible
    Failure Indicators: > 50 rows, missing arrows, old rows shown
    Evidence: .sisyphus/evidence/task-7-trace-arrows.txt
  ```

  **Commit**: YES (group with none)
  - Message: `feat(secs-sim): integrate enhanced feed and trace table into page`
  - Files: `equipment-monitor/src/app/mes/secs-gem/page.tsx`

---

- [x] 8. Add Recipe Auto-Roll Card to Page

  **What to do**:
  - Add RecipeDetailCard to `equipment-monitor/src/app/mes/secs-gem/page.tsx`:
    - Detect when an S2F49 message appears in the visible message feed (data-driven trigger, not hardcoded step index). Specifically: `visibleMessages.some(m => m.stream === 2 && m.function === 49)` — this checks the currently ingested messages (not all messages, only those with visibleMessageCount)
    - When S2F49 is detected, find the matching recipe from MOCK_RECIPES by extracting PPID from the message payload: `message.payload.params?.[0]?.cpval` (the actual structure is `params: [{ cpname: 'PPID', cpval: recipeId }]`). Match this PPID against `recipe.id`.
    - Also find the corresponding S2F50 response message: `visibleMessages.find(m => m.stream === 2 && m.function === 50)`
    - Show RecipeDetailCard in the right sidebar (below Alarm Context section or between Replay State and Alarm Context)
    - Recipe card auto-rolls in with `recipeRollUp` spring animation when S2F49 appears in visibleMessages
    - **Visibility rule (single clear definition)**: The recipe card is visible if and only if `visibleMessages.some(m => m.stream === 2 && m.function === 49)` is true. This means: card appears when S2F49 enters the visible feed, stays visible as long as S2F49 is still in the visible set, and disappears when the feed resets (visibleMessageCount goes back to 1) causing S2F49 to leave the visible set.
    - If S2F49 is not yet in visibleMessages, or recipe data cannot be matched, card is hidden (AnimatePresence exit)
    - Pass `isVisible` boolean derived from checking visible messages for S2F49
    - Pass `recipe` from MOCK_RECIPES matching the S2F49 PPID
    - Import RecipeDetailCard from `@/components/secs-simulator/RecipeDetailCard`
    - Import `Recipe` type from `@/lib/mes-types` (NOT from mes-mock-data)
    - Import `MOCK_RECIPES` from `@/lib/mes-mock-data`

  **Must NOT do**:
  - Do NOT modify MOCK_RECIPES or mes-mock-data.ts
  - Do NOT add real backend recipe lookup
  - Do NOT show recipe card before S2F49 appears in feed (even if scenario step is pending)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Requires understanding message timing logic, data-driven trigger detection, and integration with existing page state
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO — modifies same page.tsx as T6 and T7
  - **Parallel Group**: Wave 3 (sequential after T7)
  - **Blocks**: None directly (but T9 depends on T8 indirectly)
  - **Blocked By**: T4

  **References**:
  **Pattern References**:
  - `equipment-monitor/src/app/mes/secs-gem/page.tsx:458-472` — Alarm Context section (right sidebar, insertion point for recipe card)

  **API/Type References**:
  - `equipment-monitor/src/components/secs-simulator/RecipeDetailCard.tsx` — Component props (recipe, isVisible, messageS2F49, messageS2F50)
  - `equipment-monitor/src/lib/mes-mock-data.ts:MOCK_RECIPES` — Recipe array with id, name, process, chamber, exposure, focus
  - `equipment-monitor/src/lib/mes-mock-data.ts:Recipe` — Recipe type
  - `equipment-monitor/src/lib/secs-gem-demo-data.ts:DemoSecsMessage` — Message type with sf, payload fields
  - `equipment-monitor/src/lib/secs-simulator-animation.ts` — recipeRollUp variant

  **WHY Each Reference Matters**:
  - Lines 458-472 — Exact insertion point for recipe card in sidebar layout
  - MOCK_RECIPES — Data source for recipe details
  - RecipeDetailCard — Props interface to provide

  **Acceptance Criteria**:
  - [ ] Recipe card appears in right sidebar when S2F49 is in visibleMessages (checked via stream===2 && function===49)
  - [ ] Recipe card auto-rolls in with spring animation on S2F49 detection
  - [ ] Recipe card auto-rolls out when S2F49 leaves visibleMessages (e.g., on feed reset where visibleMessageCount goes back to 1)
  - [ ] Recipe card shows recipe ID, name, process, chamber, exposure, focus
  - [ ] S2F49 message shown with → blue badge
  - [ ] S2F50 message shown with ← teal badge
  - [ ] No recipe card visible before S2F49 appears
  - [ ] Reduced-motion: recipe card appears/disappears instantly
  - [ ] TypeScript compiles without errors

  **QA Scenarios**:

  ```
  Scenario: Recipe card auto-rolls when S2F49 message appears
    Tool: Playwright
    Preconditions: Dev server running
    Steps:
      1. Navigate to http://localhost:3000/mes/secs-gem
      2. Click Start to begin feed
      3. Advance feed until S2F49 message appears (step through or wait)
      4. Assert: RecipeDetailCard is visible in right sidebar
      5. Assert: Card shows recipe name (e.g., "LITHO-193nm-v4")
      6. Assert: S2F49 message badge shown with → arrow
      7. Screenshot the recipe card
    Expected Result: Recipe card appears with animation when recipe push step activates
    Failure Indicators: Card not visible, wrong recipe data, missing message badges
    Evidence: .sisyphus/evidence/task-8-recipe-auto-roll.png

  Scenario: No recipe card before S2F49 appears
    Tool: Playwright
    Preconditions: Dev server running
    Steps:
      1. Navigate to http://localhost:3000/mes/secs-gem
      2. Before starting feed, assert: no RecipeDetailCard in sidebar
      3. Click Step once (first message S1F13 appears)
      4. Assert: still no RecipeDetailCard
    Expected Result: No recipe card before recipe push message
    Failure Indicators: Card visible before S2F49, or card visible at step 0
    Evidence: .sisyphus/evidence/task-8-no-recipe-early.png
  ```

  **Commit**: YES (group with none)
  - Message: `feat(secs-sim): add recipe auto-roll card to page`
  - Files: `equipment-monitor/src/app/mes/secs-gem/page.tsx`

---

- [x] 9. prefers-reduced-motion + Packet Flood Handling

  **What to do**:
  - Add comprehensive `prefers-reduced-motion` support across all new components in `page.tsx`:
    - Replace all `motion.div` with conditional rendering: if `useReducedMotion()` returns true, render plain `<div>` with same classes but no animation
    - Replace `AnimatePresence` with `{children}` when reduced-motion is active (no enter/exit animations)
    - Typewriter effect: if reduced-motion, show full text instantly (already handled by `useTypewriter` hook)
    - Glow pulse: if reduced-motion, use static background color instead of animated box-shadow
    - Accordion expand/collapse: if reduced-motion, render expanded state instantly (no height animation)
    - Recipe card roll-up: if reduced-motion, show/hide instantly (no spring animation)
  - Add packet flood handling:
    - Implement circular buffer logic in page.tsx: if `data.messages.length > MAX_VISIBLE_PACKETS` (50), only render the latest 50 messages in the trace table
    - Use `data.messages.slice(Math.max(0, data.messages.length - MAX_VISIBLE_PACKETS))` for visible messages
    - Add a "Showing N of M messages" indicator above the trace table when total exceeds 50
    - Feed packets display keeps showing only the 3 most recent (existing behavior)
  - Add accessibility improvements:
    - `aria-live="polite"` on the feed progress indicator (already exists, verify)
    - `aria-expanded` on ScenarioStepCard toggle buttons
    - `aria-label` on direction arrows in trace table
    - Focus management: when step auto-expands, do NOT move focus (let user continue reading)

  **Must NOT do**:
  - Do NOT add a virtual scrolling library
  - Do NOT change the existing `aria-live` on the progress counter
  - Do NOT modify framer-motion's internal ReducedMotion config — use our own hook

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Cross-cutting concern touching multiple components, requires careful cohesive changes
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO — depends on T6, T7 being complete
  - **Parallel Group**: Wave 3 (last)
  - **Blocks**: T10
  - **Blocked By**: T6, T7

  **References**:
  **Pattern References**:
  - `equipment-monitor/src/lib/animation.ts:getSafeVariants()` — Existing reduced-motion pattern: returns empty variants when motion is reduced

  **API/Type References**:
  - `equipment-monitor/src/lib/secs-simulator-animation.ts` — useReducedMotion, MAX_VISIBLE_PACKETS constants

  **WHY Each Reference Matters**:
  - getSafeVariants() — Pattern for conditionally disabling animations
  - useReducedMotion — Hook to check in each component

  **Acceptance Criteria**:
  - [ ] All framer-motion animations disabled when prefers-reduced-motion is active
  - [ ] Typewriter shows full text instantly when reduced-motion
  - [ ] Glow pulse replaced with static color when reduced-motion
  - [ ] Accordion renders expanded state instantly when reduced-motion
  - [ ] Recipe card shows/hides instantly when reduced-motion
  - [ ] Trace table shows max 50 rows with "Showing N of M" indicator
  - [ ] All interactive elements have aria-expanded or aria-label
  - [ ] TypeScript compiles without errors

  **QA Scenarios**:

  ```
  Scenario: prefers-reduced-motion disables all animations
    Tool: Playwright
    Preconditions: Dev server running
    Steps:
      1. Set browser to prefer reduced motion: await page.emulateMedia({ reducedMotion: 'reduce' })
      2. Navigate to http://localhost:3000/mes/secs-gem
      3. Click Start to begin feed
      4. Assert: scenario steps appear instantly (no spring animation)
      5. Assert: feed packets appear instantly (no stagger)
      6. Assert: message summaries show full text immediately (no typewriter)
      7. Assert: no glowing pulse on active elements
      8. Screenshot the page
    Expected Result: All content renders instantly, no animations
    Failure Indicators: Step transitions animate, text reveals character by character, glow pulse visible
    Evidence: .sisyphus/evidence/task-9-reduced-motion.png

  Scenario: Feed handles 50+ messages with circular buffer
    Tool: Bash (jest)
    Preconditions: Page test file updated
    Steps:
      1. Render page with mock data containing > 50 messages
      2. Set visibleMessageCount to 60
      3. Assert: trace table renders exactly 50 rows (MAX_VISIBLE_PACKETS)
      4. Assert: "Showing 50 of 60 messages" indicator visible
      5. Assert: rows 11-60 are displayed (newest 50), rows 1-10 not displayed
    Expected Result: Max 50 rows, indicator shows count
    Failure Indicators: All 60 rows rendered, no indicator
    Evidence: .sisyphus/evidence/task-9-packet-flood.txt
  ```

  **Commit**: YES (group with none)
  - Message: `feat(secs-sim): add prefers-reduced-motion and packet flood handling`
  - Files: `equipment-monitor/src/app/mes/secs-gem/page.tsx`, all component files touched

---

- [x] 10. Update Page + Component Tests

  **What to do**:
  - Update `equipment-monitor/src/app/mes/secs-gem/page.test.tsx`:
    - Add tests for ScenarioStepCard rendering in all three states (active, complete, pending)
    - Add test for accordion auto-collapse/expand behavior
    - Add test for user override (manual expand pauses auto-collapse)
  - Create component-level test files for new components if they have non-trivial logic:
    - `equipment-monitor/src/components/secs-simulator/ScenarioStepCard.test.tsx` — Test expand/collapse states, reduced-motion
    - `equipment-monitor/src/components/secs-simulator/FeedPacketCard.test.tsx` — Test typewriter effect, glow conditional, direction arrow
    - `equipment-monitor/src/components/secs-simulator/PayloadViewer.test.tsx` — Test expand/collapse, overflow handling
  - Test strategy: Test component logic (render states, prop-driven behavior), NOT animation frames
  - For framer-motion components: mock `motion.div` as plain `div` and `AnimatePresence` as fragment in test environment
  - Run existing test suite to ensure no regressions

  **Must NOT do**:
  - Do NOT write unit tests for animation timing (framer-motion internal)
  - Do NOT add new testing libraries
  - Do NOT modify existing passing tests (only add new ones)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Multiple test files, jest configuration knowledge, framer-motion mocking
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with T11)
  - **Parallel Group**: Wave 4
  - **Blocks**: F1-F4
  - **Blocked By**: T6, T7, T8, T9

  **References**:
  **Pattern References**:
  - `equipment-monitor/src/app/mes/secs-gem/page.test.tsx` — Existing page test for structure reference
  - `equipment-monitor/src/lib/secs-gem-demo-data.test.ts` — Data source test pattern
  - `equipment-monitor/src/components/spc/KpiGaugeCard.test.tsx` — Component test with framer-motion pattern

  **WHY Each Reference Matters**:
  - page.test.tsx — Extend with new test cases
  - KpiGaugeCard.test.tsx — Reference for mocking framer-motion in tests

  **Acceptance Criteria**:
  - [ ] All new test files created and passing
  - [ ] Existing tests still pass
  - [ ] Test coverage for: ScenarioStepCard states, FeedPacketCard typewriter, PayloadViewer expand
  - [ ] framer-motion mocked as plain div/fragment in tests
  - [ ] No animation timing assertions (only render/prop assertions)

  **QA Scenarios**:

  ```
  Scenario: All tests pass
    Tool: Bash (npm test)
    Preconditions: All implementation complete
    Steps:
      1. Run: cd equipment-monitor && npm test
      2. Assert: all tests pass, 0 failures
      3. Assert: no skipped tests
    Expected Result: Full test suite passes
    Failure Indicators: Any test failures or skips
    Evidence: .sisyphus/evidence/task-10-test-results.txt

  Scenario: Build succeeds
    Tool: Bash (npm run build)
    Preconditions: All code complete
    Steps:
      1. Run: cd equipment-monitor && npm run build
      2. Assert: exit code 0
      3. Assert: no TypeScript errors
    Expected Result: Successful production build
    Failure Indicators: Build errors, type errors, missing imports
    Evidence: .sisyphus/evidence/task-10-build.txt
  ```

  **Commit**: YES (group with none)
  - Message: `test(secs-sim): update page and component tests`
  - Files: `equipment-monitor/src/app/mes/secs-gem/page.test.tsx`, `equipment-monitor/src/components/secs-simulator/*.test.tsx`

---

- [x] 11. Fix ui-ux-pro-max Python 3.12 f-string Bug

  **What to do**:
  - Fix `.agents/skills/ui-ux-pro-max/scripts/design_system.py` line 437:
    - Change: `lines.append(f"- {anti_patterns.replace(' + ', '\n- ')}")`
    - To: `anti_lines = anti_patterns.replace(' + ', '\n- ')` then `lines.append(f"- {anti_lines}")`
  - Python 3.12 no longer allows backslash expressions inside f-strings
  - This bug prevents the design-system CLI from running

  **Must NOT do**:
  - Do NOT change any other logic in the script
  - Do NOT upgrade Python — just fix the compatibility

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single-line fix, well-understood cause
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with T10, independent of everything)
  - **Parallel Group**: Wave 4
  - **Blocks**: None
  - **Blocked By**: None

  **References**:
  **Pattern References**:
  - `.agents/skills/ui-ux-pro-max/scripts/design_system.py:437` — Exact line with the f-string bug

  **WHY Each Reference Matters**:
  - Line 437 — The single line that needs fixing

  **Acceptance Criteria**:
  - [ ] Line 437 uses intermediate variable for f-string expression
  - [ ] `python3 design_system.py` runs without SyntaxError
  - [ ] `python3 search.py "test" --design-system` produces output

  **QA Scenarios**:

  ```
  Scenario: Script runs without SyntaxError
    Tool: Bash (python3)
    Preconditions: Fix applied
    Steps:
      1. Run: python3 .agents/skills/ui-ux-pro-max/scripts/design_system.py --help
      2. Assert: no SyntaxError about f-string
      3. Run: python3 .agents/skills/ui-ux-pro-max/scripts/search.py "dashboard" --design-system
      4. Assert: output produced without errors
    Expected Result: Both scripts run successfully
    Failure Indicators: SyntaxError on f-string line
    Evidence: .sisyphus/evidence/task-11-python-fix.txt
  ```

  **Commit**: YES (group with none)
  - Message: `fix(skills): fix Python 3.12 f-string incompatibility in ui-ux-pro-max`
  - Files: `.agents/skills/ui-ux-pro-max/scripts/design_system.py`

---

## Final Verification Wave

- [x] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `npx next lint` + `npx tsc --noEmit` + `npm test`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names. Verify no new npm packages added (check package.json diff).
  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Tests [N pass/N fail] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill)
  Start dev server. Navigate to `/mes/secs-gem`. Verify: (1) scenario steps auto-collapse/expand as feed progresses, (2) new packets animate with stagger effect, (3) active elements glow, (4) recipe card auto-rolls on S2F49, (5) clicking a packet expands payload, (6) prefers-reduced-motion disables animations, (7) 50+ packets don't freeze UI. Capture screenshots.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff. Verify 1:1 — everything in spec was built, nothing beyond spec was built. Check "Must NOT do" compliance. Detect cross-task contamination. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

- **T1**: `feat(secs-sim): add animation variants and custom hooks`
- **T2**: `feat(secs-sim): add ScenarioStepCard with accordion behavior`
- **T3**: `feat(secs-sim): add FeedPacketCard with glow and typewriter`
- **T4**: `feat(secs-sim): add RecipeDetailCard with auto-roll animation`
- **T5**: `feat(secs-sim): add PayloadViewer with expand/collapse`
- **T6**: `feat(secs-sim): integrate ScenarioStepCard into page with auto-rollup`
- **T7**: `feat(secs-sim): integrate enhanced feed and trace table into page`
- **T8**: `feat(secs-sim): add recipe auto-roll card to page`
- **T9**: `feat(secs-sim): add prefers-reduced-motion and packet flood handling`
- **T10**: `test(secs-sim): update page and component tests`
- **T11**: `fix(skills): fix Python 3.12 f-string incompatibility in ui-ux-pro-max`

---

## Success Criteria

### Verification Commands
```bash
cd equipment-monitor && npx tsc --noEmit    # Expected: 0 errors
cd equipment-monitor && npm test              # Expected: all tests pass
cd equipment-monitor && npm run lint          # Expected: 0 errors
cd equipment-monitor && npm run build         # Expected: successful build
```

### Final Checklist
- [ ] All "Must Have" features present and working
- [ ] All "Must NOT Have" patterns absent from codebase
- [ ] All tests pass
- [ ] prefers-reduced-motion disables animations
- [ ] No new npm packages in package.json
- [ ] Page loads without console errors
- [ ] Feed plays through full scenario without freezing