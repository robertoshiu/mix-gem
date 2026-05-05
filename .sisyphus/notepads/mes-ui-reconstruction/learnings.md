# Learnings - MES UI Reconstruction

## Conventions
- Working directory: `equipment-monitor/`
- Next.js 15 with static export (`output: 'export'`)
- `basePath: '/mix-gem'` required for all asset references
- `images: { unoptimized: true }` — use standard `<img>` not Next `<Image>`
- SmartFactory CSS tokens in `globals.css` — no hardcoded hex colors
- Tailwind CSS v4 with OKLCH color tokens
- Zustand store in `mes-spc-store.ts` — add optional fields only, no breaking changes
- All new components use `data-testid` attributes for QA

## Patterns
- Gauge components use SVG with calculated arcs/paths
- Mock data generators follow `generateXxx()` naming in `mes-mock-data.ts`
- Types follow `export interface` pattern in `mes-types.ts`
- Status colors: green (`--smartfactory-status-green`), amber (`--smartfactory-status-amber`), red (`--smartfactory-status-red`)

## Gotchas
- 7.3MB logo must be optimized to <50KB before use
- Gauge text overflow occurs with values like "+1205.0" (6+ chars at text-2xl)
- Static export requires all assets in `public/` directory
- `basePath` prefix needed on all static asset URLs
