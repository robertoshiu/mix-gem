# Decisions — github-pages-deploy

## 2026-05-04 Session Start

### Architecture Decisions
- Use `output: 'export'` in next.config.ts (static HTML generation in out/)
- basePath: '/mix-gem' (GitHub Pages project site at <user>.github.io/mix-gem)
- trailingSlash: true (generates index.html in subdirectories — required for GitHub Pages)
- images.unoptimized: true (disables Image Optimization API incompatible with static export)
- build:static is a semantic alias for `next build` — since output:'export' is in config, this always produces static output
- SPA fallback: copy out/index.html to out/404.html in CI step (NOT a permanent file)

### Wave Execution Strategy
- Wave 1 (parallel): T1 (next.config.ts), T2 (.nojekyll), T3 (package.json scripts) — all independent
- Wave 2 (sequential after Wave 1): T4 (deploy.yml)
- Wave 3 (sequential after Wave 2): T5 (build verification)
- Final Wave (parallel after T5): F1 (oracle), F2 (unspecified-high), F3 (deep)
