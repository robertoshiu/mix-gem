# Decisions

## 1. Test file locations
**Decision**: Created `equipment-monitor/tests/e2e/*.spec.ts` matching existing `tests/integration/` structure
**Rationale**: Keeps E2E tests separate from unit/integration, follows Playwright convention of `testDir` config

## 2. CI quality gates placement
**Decision**: Added quality gates (lint, test, playwright) AFTER build step
**Rationale**: 
- Build artifact (`out/`) is needed for Playwright static server
- Allows artifact upload to still happen even if tests fail (for debugging)
- Lint/test failures fail the job before Playwright install (saves CI minutes)

## 3. Test assertions using semantic queries
**Decision**: Used `getByRole`, `getByText`, `getByLabel` over CSS selectors
**Rationale**: More accessible, matches how users interact with page, less brittle to CSS changes

## 4. XPath for header button navigation
**Decision**: Used XPath `ancestor::header/descendant::button` when CSS selectors proved ambiguous
**Rationale**: More reliable than complex CSS when multiple similar elements exist
**Note**: Could also use `page.locator('h1:has-text("WAR ROOM 3D") ~ div button')` but XPath is explicit about relationship