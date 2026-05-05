# FooterStatusBar Implementation Learnings

## Component Details
- **Path**: `src/components/spc/FooterStatusBar.tsx`
- **Features**:
  - Dark strip background using `var(--smartfactory-bg-canvas)`
  - 4 segments separated by dividers
  - Live clock using `setInterval` and `Fira Code` font
  - `use client` directive for client-side state
  - Design tokens for colors and borders

## Verification Results
- **Unit Test**: `src/components/spc/FooterStatusBar.test.tsx` passed with 3 tests.
- **Type Check**: Component `FooterStatusBar.tsx` passes type checking when compiled with project `tsconfig.json`. (Note: many pre-existing test file errors exist in the repo related to `jest-dom` matchers).

## Decisions
- Used `tabular-nums` for the clock to prevent horizontal jitter during time updates.
- Implemented `flex` with `ml-auto` to push the clock to the far right.
- Selected `px-4` padding for consistent horizontal spacing.
