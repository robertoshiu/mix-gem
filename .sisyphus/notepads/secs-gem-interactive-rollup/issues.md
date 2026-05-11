## 2026-05-12 F2 code quality review

- `equipment-monitor/npm run build` fails during Next type checking in `.next/dev/types/validator.ts` with `Type '"/mes/equipment"' does not satisfy the constraint 'never'`.
- `equipment-monitor/npm run lint` reports 3 errors in new SECS simulator code: `react-hooks/set-state-in-effect` in `PayloadViewer.tsx` lines 89 and 94, and `secs-simulator-animation.ts` line 104.
- `npm test` passes: 55 suites, 309 tests.
