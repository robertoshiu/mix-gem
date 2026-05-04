# Learnings — github-pages-deploy

## 2026-05-04 Session Start

### Environment Facts
- Windows environment with PowerShell
- Next.js app is in `equipment-monitor/` subdirectory (NOT repo root)
- Current next.config.ts is empty (just `{}` config object)
- package.json has scripts: dev, build, start, lint, test, test:watch — NO build:static yet
- equipment-monitor/public/ directory exists (Next.js copies contents to out/ during build)
- Node modules appear to be installed in equipment-monitor/

### Key Constraints
- ALL workflow steps must use `working-directory: equipment-monitor`
- .nojekyll MUST be in `equipment-monitor/public/` NOT repo root
- basePath is `/mix-gem`
- Deploy artifact path is `equipment-monitor/out` (relative to repo root)
- Trigger: push to `master` branch
- Build command: `npm run build:static` (semantic alias for `next build` with output:'export' in config)

### Files to Modify (Task 1-4)
- T1: `equipment-monitor/next.config.ts` — add output:'export', basePath, trailingSlash, images config
- T2: CREATE `equipment-monitor/public/.nojekyll` — empty file
- T3: `equipment-monitor/package.json` — add build:static and export scripts
- T4: CREATE `.github/workflows/deploy.yml` — GitHub Actions workflow at REPO ROOT

### Build Verification Notes
- The plan specifies running: `node node_modules/next/dist/bin/next build` OR `npm run build:static`
- Windows path: use PowerShell-compatible commands
- Dev server regression test uses PowerShell `Start-Job` for background processes
