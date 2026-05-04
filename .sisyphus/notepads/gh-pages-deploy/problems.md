# Problems

## Pre-existing: lucide-react missing TypeScript declarations (2026-05-04)
- `lucide-react` v0.563.0 has `typings: "dist/lucide-react.d.ts"` in its package.json but no `.d.ts` file ships in the installed package
- This causes a build failure in `src/app/mes/recipes/page.tsx` (imports `Upload` from `lucide-react`)
- TypeScript error: "Could not find a declaration file for module 'lucide-react'"
- Fix options:
  a) Install `@types/lucide-react` dev dependency (if available)
  b) Add a manual declaration file: `declare module 'lucide-react';`
  c) Set `"noImplicitAny": false` in tsconfig
- NOT caused by the static export config changes in this task
