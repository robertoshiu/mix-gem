# GitHub Pages Deployment — MES SPC Frontend Demo

## TL;DR

> **Quick Summary**: Configure Next.js 16 static export and GitHub Actions workflow to deploy the MES SPC Frontend Demo to GitHub Pages at `<user>.github.io/mix-gem`.
>
> **Deliverables**:
> - Updated `next.config.ts` with static export settings
> - `.nojekyll` file in `equipment-monitor/public/`
> - Updated `package.json` with `build:static` script
> - GitHub Actions workflow at `.github/workflows/deploy.yml`
> - SPA fallback support via `404.html` copy step
>
> **Estimated Effort**: Quick — 4 small tasks, 1 verification wave
> **Parallel Execution**: YES — 2 waves (config tasks parallel, then workflow)
> **Critical Path**: Task 1 → Task 4 → Task 5

---

## Context

### Original Request
Deploy the pure-frontend MES SPC Demo to GitHub Pages so it can be accessed at `<user>.github.io/mix-gem`.

### Interview Summary
**Key Discussions**:
- Repo: `github.com/<user>/mix-gem` — basePath will be `/mix-gem`
- Default GitHub Pages URL — no custom domain
- No git remote currently configured — needs to be added as part of deployment
- All 17 implementation tasks already complete and committed
- Windows environment with broken `.bin` symlinks — CI will be the validation path

**Research Findings**:
- Next.js app lives in `equipment-monitor/` subdirectory (not repo root) — workflow MUST use `working-directory`
- All routes are static client components — safe for static export
- No API routes, no middleware, no dynamic route segments
- No `next/image` usage — `images.unoptimized` is sufficient
- No environment variables — no `.env` handling needed
- Zustand stores don't use `localStorage` persistence — safe for static export
- `usePathname()` in MesNavBar auto-strips `basePath` — nav links will work correctly

### Metis Review
**Identified Gaps** (addressed):
- Subdirectory structure: workflow must use `working-directory: equipment-monitor` — ADDED to all tasks
- `.nojekyll` placement: must be at `equipment-monitor/public/.nojekyll`, NOT repo root — ADDED as explicit task
- SPA 404 fallback: client-side deep links may 404 on GitHub Pages — ADDED `404.html` copy step
- `build:static` vs modifying `build`: separate script preserves `next start` for local dev — ADOPTED
- `trailingSlash: true`: recommended for GitHub Pages — ADOPTED as default

---

## Work Objectives

### Core Objective
Configure the equipment-monitor Next.js app for static export and deploy it to GitHub Pages via GitHub Actions, preserving local dev capability.

### Concrete Deliverables
- `equipment-monitor/next.config.ts` — static export config with basePath, trailingSlash, images
- `equipment-monitor/public/.nojekyll` — prevents Jekyll processing of `_next/` assets
- `equipment-monitor/package.json` — new `build:static` script
- `.github/workflows/deploy.yml` — GitHub Actions workflow for auto-deployment
- Post-build `404.html` copy step in workflow (SPA fallback)

### Definition of Done
- [ ] `npm run build:static` produces `equipment-monitor/out/` with all static pages
- [ ] `out/` contains `index.html`, `mes/spc/index.html`, `mes/lots/index.html`, `mes/recipes/index.html`
- [ ] `out/.nojekyll` exists
- [ ] `out/404.html` exists (SPA fallback)
- [ ] Dev server still works: `npm run dev` starts without errors
- [ ] Pushing to `master` triggers GitHub Actions workflow
- [ ] Deployed site returns HTTP 200 on all 4 routes

### Must Have
- Static export with `output: 'export'`, `basePath: '/mix-gem'`, `trailingSlash: true`, `images: { unoptimized: true }`
- GitHub Actions workflow with `working-directory: equipment-monitor`
- `.nojekyll` at correct location (`equipment-monitor/public/.nojekyll`)
- `build:static` script (preserving `build` for local dev)
- SPA 404 fallback (`out/index.html` copied to `out/404.html`)

### Must NOT Have (Guardrails)
- NO modifications to any source files in `src/` (components, stores, pages, libs)
- NO changes to routing, navigation hrefs, or page logic
- NO API routes, backend code, or Docker configuration added
- NO test/lint/type-check steps added to deployment workflow
- NO custom domain or HTTPS certificate configuration
- NO changes to existing `dev`, `start`, or `build` scripts (preserve local dev)
- NO experimental Next.js flags or webpack modifications

---

## Verification Strategy (MANDATORY)

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: NO (local Jest is broken on Windows)
- **Automated tests**: None — deployment config tasks don't need unit tests
- **Framework**: N/A
- **Agent-Executed QA**: ALWAYS — every task includes executable QA scenarios

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Config files**: Use Bash — run build, verify output structure
- **Deployment**: Use Bash (curl) — verify HTTP responses on all 4 routes
- **Local dev**: Use Bash — start dev server, verify no regression

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — all config tasks independent):
├── Task 1: Configure next.config.ts for static export [quick]
├── Task 2: Add .nojekyll and configure html file [quick]
└── Task 3: Add build:static script to package.json [quick]

Wave 2 (After Wave 1 — workflow depends on config):
└── Task 4: Create GitHub Actions deploy workflow [quick]

Wave 3 (After Wave 2 — verification):
└── Task 5: Build verification + local dev regression test [quick]

Wave FINAL (After ALL tasks — 3 parallel reviews):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Config quality review (unspecified-high)
└── Task F3: Scope fidelity check (deep)

Critical Path: Task 1 → Task 4 → Task 5 → F1-F3 → user okay
Parallel Speedup: ~40% faster than sequential
Max Concurrent: 3 (Wave 1)
```

### Dependency Matrix

| Task | Depends On | Blocks | Wave |
|------|-----------|--------|------|
| 1 | — | 4, 5 | 1 |
| 2 | — | 4, 5 | 1 |
| 3 | — | 5 | 1 |
| 4 | 1, 2 | 5 | 2 |
| 5 | 1, 2, 3, 4 | F1-F3 | 3 |

### Agent Dispatch Summary

- **Wave 1**: 3 tasks — T1 `quick`, T2 `quick`, T3 `quick`
- **Wave 2**: 1 task — T4 `quick`
- **Wave 3**: 1 task — T5 `quick`
- **FINAL**: 3 tasks — F1 `oracle`, F2 `unspecified-high`, F3 `deep`

---

## TODOs

- [ ] 1. Configure next.config.ts for static export

  **What to do**:
  - Open `equipment-monitor/next.config.ts`
  - Replace the empty config with static export configuration:
    ```typescript
    import type { NextConfig } from "next";

    const nextConfig: NextConfig = {
      output: 'export',
      basePath: '/mix-gem',
      trailingSlash: true,
      images: {
        unoptimized: true,
      },
    };

    export default nextConfig;
    ```
  - Verify `output: 'export'` — enables static HTML generation in `out/` directory
  - Verify `basePath: '/mix-gem'` — prefixes all asset and link URLs for GitHub Pages project site
  - Verify `trailingSlash: true` — generates `index.html` in subdirectories (critical for GitHub Pages)
  - Verify `images.unoptimized: true` — disables Next.js Image Optimization API (incompatible with static export)

  **Must NOT do**:
  - Do NOT add experimental flags or webpack config
  - Do NOT change any values beyond `output`, `basePath`, `trailingSlash`, `images`
  - Do NOT modify any source files in `src/`

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single config file change, 6 lines of configuration
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `fastapi-patterns`: Not relevant, this is Next.js not FastAPI
    - `docker-compose-generator`: Not relevant, this is static export not Docker

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3)
  - **Blocks**: Tasks 4, 5
  - **Blocked By**: None (can start immediately)

  **References** (CRITICAL):

  **Pattern References**:
  - `equipment-monitor/next.config.ts` — Current empty config to modify (this is the ONLY file to change)
  - `equipment-monitor/src/app/mes/layout.tsx:1-14` — Shows MES routes use `@/components/layout/header` and `@/components/mes/MesNavBar` with `usePathname()` for active state — `basePath` auto-prepends to nav links
  - `equipment-monitor/src/app/page.tsx:1-2` — Root page uses `'use client'` (safe for static export)

  **External References**:
  - Next.js Static Export docs: `https://nextjs.org/docs/app/building-your-application/deploying/static-exports`
  - Next.js `basePath` docs: `https://nextjs.org/docs/app/api-reference/config/nextjs-snippet-middleware#basepath`

  **WHY Each Reference Matters**:
  - `next.config.ts`: This is THE file being modified — no other file changes in this task
  - MES layout/nav: Confirms `basePath` will auto-prepend to `<Link href>` and `usePathname()` strips basePath correctly
  - Root page: Confirms `'use client'` means no SSR-only features that would break static export

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Static build produces output directory
    Tool: Bash
    Preconditions: equipment-monitor directory with updated next.config.ts
    Steps:
      1. cd equipment-monitor
      2. node node_modules/next/dist/bin/next build
      3. ls out/index.html
      4. ls out/mes/spc/index.html
    Expected Result: Build exits 0, both index.html files exist
    Failure Indicators: Build fails with "Static export requires all pages to be statically renderable" or similar
    Evidence: .sisyphus/evidence/task-1-static-build-output.txt

  Scenario: BasePath applied to generated HTML
    Tool: Bash
    Preconditions: equipment-monitor/out/ directory exists from build
    Steps:
      1. cd equipment-monitor
      2. grep -r "mix-gem" out/index.html | head -5
      3. grep -r "mix-gem" out/mes/spc/index.html | head -5
    Expected Result: Both files contain references to "/mix-gem" in script/link tags
    Failure Indicators: No "/mix-gem" references found — basePath not applied
    Evidence: .sisyphus/evidence/task-1-basepath-verification.txt

  Scenario: TrailingSlash generates directory-based HTML
    Tool: Bash
    Preconditions: equipment-monitor/out/ directory exists
    Steps:
      1. ls -la equipment-monitor/out/mes/spc/index.html
      2. ls -la equipment-monitor/out/mes/lots/index.html
      3. ls -la equipment-monitor/out/mes/recipes/index.html
    Expected Result: All three MES route directories contain index.html (not spc.html)
    Failure Indicators: Flat HTML files instead of directory-based (e.g., spc.html instead of spc/index.html)
    Evidence: .sisyphus/evidence/task-1-trailingslash-verification.txt
  ```

  **Commit**: YES (groups with 2, 3)
  - Message: `feat(deploy): configure Next.js static export for GitHub Pages`
  - Files: `equipment-monitor/next.config.ts`, `equipment-monitor/public/.nojekyll`, `equipment-monitor/package.json`
  - Pre-commit: None (config only)

- [ ] 2. Add .nojekyll and 404.html support

  **What to do**:
  - Create `equipment-monitor/public/.nojekyll` — empty file that Next.js copies to `out/` during build, preventing GitHub Pages from processing `_next/` as Jekyll
  - This file MUST be at `equipment-monitor/public/.nojekyll` (NOT at repo root `mix-gem/.nojekyll`)
  - Next.js automatically copies everything from `public/` to `out/` during static export

  **Must NOT do**:
  - Do NOT place `.nojekyll` at the repo root (`E:\repo\mix-gem\.nojekyll`) — it won't be included in the build
  - Do NOT put any content in `.nojekyll` — it must be an empty file
  - Do NOT modify any source files in `src/`

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single empty file creation
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3)
  - **Blocks**: Tasks 4, 5
  - **Blocked By**: None (can start immediately)

  **References** (CRITICAL):

  **Pattern References**:
  - `equipment-monitor/public/` — Target directory for `.nojekyll` (Next.js copies this to `out/` during build)

  **External References**:
  - GitHub Pages `.nojekyll` docs: `https://docs.github.com/en/pages/setting-up-a-github-pages-site-with-jekyll/about-github-pages-and-jekyll`

  **WHY Each Reference Matters**:
  - `equipment-monitor/public/`: This is where the file MUST live — Next.js copies public/ contents to out/ during build. Putting it anywhere else means it won't be in the deploy artifact.

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: .nojekyll exists in public/ directory
    Tool: Bash
    Preconditions: File created
    Steps:
      1. ls -la equipment-monitor/public/.nojekyll
    Expected Result: File exists, empty (0 bytes)
    Failure Indicators: File not found or file contains content
    Evidence: .sisyphus/evidence/task-2-nojekyll-exists.txt

  Scenario: .nojekyll is copied to out/ during build
    Tool: Bash
    Preconditions: next.config.ts configured (Task 1), .nojekyll in public/
    Steps:
      1. cd equipment-monitor
      2. node node_modules/next/dist/bin/next build
      3. ls -la out/.nojekyll
    Expected Result: out/.nojekyll exists (copied from public/)
    Failure Indicators: File missing from out/ — GitHub Pages will Jekyll-process _next/ and assets will 404
    Evidence: .sisyphus/evidence/task-2-nojekyll-in-build.txt
  ```

  **Commit**: YES (groups with 1, 3)
  - Message: `feat(deploy): configure Next.js static export for GitHub Pages`
  - Files: `equipment-monitor/public/.nojekyll`
  - Pre-commit: None

- [ ] 3. Add build:static script to package.json

  **What to do**:
  - Open `equipment-monitor/package.json`
  - Add a `build:static` script that runs `next build` (the `output: 'export'` in next.config.ts makes this produce static files)
  - Keep the existing `build` script unchanged (`next build`) — it still works for development builds
  - Optionally add a `export` script as alias: `"export": "next build"` (Next.js convention for static export)
  - The scripts section should become:
    ```json
    "scripts": {
      "dev": "next dev",
      "build": "next build",
      "build:static": "next build",
      "export": "next build",
      "start": "next start",
      "lint": "eslint",
      "test": "jest",
      "test:watch": "jest --watch"
    }
    ```
  - Note: `build:static` and `export` are semantic aliases — since `output: 'export'` is in next.config.ts, `next build` always produces static output. The aliases exist for documentation clarity and CI readability.

  **Must NOT do**:
  - Do NOT modify existing `dev`, `start`, `build`, `lint`, `test`, `test:watch` scripts
  - Do NOT remove any existing scripts
  - Do NOT add pre/post build hooks or complex shell commands

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Two lines added to scripts section of package.json
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2)
  - **Blocks**: Task 5
  - **Blocked By**: None (can start immediately)

  **References** (CRITICAL):

  **Pattern References**:
  - `equipment-monitor/package.json:5-11` — Current scripts section to modify (add `build:static` and `export` entries)

  **External References**:
  - Next.js scripts convention: `https://nextjs.org/docs/app/building-your-application/deploying#nextjs-build-api`

  **WHY Each Reference Matters**:
  - `package.json` lines 5-11: The exact location where scripts must be added — no other section of package.json changes

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: build:static script exists and runs
    Tool: Bash
    Preconditions: package.json updated with build:static script
    Steps:
      1. cd equipment-monitor
      2. npm run build:static
      3. ls out/index.html
    Expected Result: Script runs, build completes, out/index.html exists
    Failure Indicators: "npm ERR! missing script: build:static" or build failure
    Evidence: .sisyphus/evidence/task-3-build-static-script.txt

  Scenario: Existing scripts are preserved
    Tool: Bash
    Preconditions: package.json updated
    Steps:
      1. cd equipment-monitor
      2. node -e "const p = require('./package.json'); const scripts = Object.keys(p.scripts); console.log(scripts.join(', '))"
    Expected Result: Output includes: dev, build, build:static, export, start, lint, test, test:watch
    Failure Indicators: Any original script name missing from output
    Evidence: .sisyphus/evidence/task-3-scripts-preserved.txt
  ```

  **Commit**: YES (groups with 1, 2)
  - Message: `feat(deploy): configure Next.js static export for GitHub Pages`
  - Files: `equipment-monitor/package.json`
  - Pre-commit: None

- [ ] 4. Create GitHub Actions deploy workflow

  **What to do**:
  - Create `.github/workflows/deploy.yml` at the repo root (NOT in `equipment-monitor/`)
  - The workflow should:
    1. Trigger on push to `master` branch (the current default branch)
    2. Use `actions/checkout@v4`
    3. Set up Node.js 20 LTS with `actions/setup-node@v4`
    4. Run `npm ci` in `equipment-monitor/` directory
    5. Run `npm run build:static` in `equipment-monitor/` directory
    6. Copy `out/index.html` to `out/404.html` for SPA fallback (in `equipment-monitor/`)
    7. Upload `equipment-monitor/out/` as Pages artifact using `actions/upload-pages-artifact@v3`
    8. Deploy using `actions/deploy-pages@v4`
  - Required permissions: `pages: write`, `id-token: write`, `contents: read`
  - Use `working-directory: equipment-monitor` on all npm/build steps
  - Workflow content:

    ```yaml
    name: Deploy to GitHub Pages

    on:
      push:
        branches: [master]

    permissions:
      contents: read
      pages: write
      id-token: write

    concurrency:
      group: "pages"
      cancel-in-progress: true

    jobs:
      build:
        runs-on: ubuntu-latest
        steps:
          - name: Checkout
            uses: actions/checkout@v4

          - name: Setup Node.js
            uses: actions/setup-node@v4
            with:
              node-version: '20'
              cache: 'npm'
              cache-dependency-path: equipment-monitor/package-lock.json

          - name: Install dependencies
            run: npm ci
            working-directory: equipment-monitor

          - name: Build static export
            run: npm run build:static
            working-directory: equipment-monitor

          - name: Add 404.html for SPA fallback
            run: cp out/index.html out/404.html
            working-directory: equipment-monitor

          - name: Upload Pages artifact
            uses: actions/upload-pages-artifact@v3
            with:
              path: equipment-monitor/out

      deploy:
        needs: build
        runs-on: ubuntu-latest
        environment:
          name: github-pages
          url: ${{ steps.deployment.outputs.page_url }}
        steps:
          - name: Deploy to GitHub Pages
            id: deployment
            uses: actions/deploy-pages@v4
    ```

  **Must NOT do**:
  - Do NOT add test/lint/type-check steps to the workflow
  - Do NOT use deprecated `actions/github-pages` or `peaceiris/actions-gh-pages`
  - Do NOT deploy on pull requests (only on push to master)
  - Do NOT add a custom domain or CNAME step
  - Do NOT place the workflow file in `equipment-monitor/.github/` — it MUST be at repo root

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single YAML file creation following a well-defined template
  - **Skills**: [`docker-compose-generator`]
    - `docker-compose-generator`: YAML CI/CD configuration overlaps with workflow authoring

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2 (sequential, depends on Wave 1)
  - **Blocks**: Task 5
  - **Blocked By**: Tasks 1, 2

  **References** (CRITICAL):

  **Pattern References**:
  - `equipment-monitor/next.config.ts` — Must be configured (Task 1) before this workflow can succeed; the `output: 'export'` triggers static build
  - `equipment-monitor/public/.nojekyll` — Must exist (Task 2) so it's included in `out/` during build

  **External References**:
  - GitHub Pages deployment with Actions: `https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site#publishing-with-a-custom-github-actions-workflow`
  - `actions/deploy-pages@v4`: `https://github.com/actions/deploy-pages`
  - `actions/upload-pages-artifact@v3`: `https://github.com/actions/upload-pages-artifact`

  **WHY Each Reference Matters**:
  - `next.config.ts`: The workflow's `build:static` command depends on `output: 'export'` being configured — without it, `next build` produces a server build, not static files
  - `.nojekyll`: Without this file in the artifact, GitHub Pages runs Jekyll processing which breaks `_next/` asset paths
  - GitHub Actions Pages docs: Defines the official `permissions`, `concurrency`, and action versions pattern — must follow exactly

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Workflow file is valid YAML at correct path
    Tool: Bash
    Preconditions: .github/workflows/deploy.yml created
    Steps:
      1. ls .github/workflows/deploy.yml
      2. python -c "import yaml; yaml.safe_load(open('.github/workflows/deploy.yml')); print('VALID YAML')"
      OR (if python unavailable): node -e "const fs=require('fs'); const y=require('yaml'); const f=fs.readFileSync('.github/workflows/deploy.yml','utf8'); console.log(y.parse(f) ? 'VALID YAML' : 'INVALID')"
    Expected Result: File exists and is valid YAML
    Failure Indicators: File not found or YAML parse error
    Evidence: .sisyphus/evidence/task-4-workflow-yaml-valid.txt

  Scenario: Workflow uses working-directory correctly
    Tool: Bash
    Preconditions: Workflow file exists
    Steps:
      1. grep -n "working-directory: equipment-monitor" .github/workflows/deploy.yml
    Expected Result: At least 3 matches (npm ci, npm run build:static, cp out/index.html)
    Failure Indicators: Missing working-directory on build steps — will run commands in wrong directory
    Evidence: .sisyphus/evidence/task-4-working-directory-check.txt

  Scenario: Workflow artifact path points to equipment-monitor/out
    Tool: Bash
    Preconditions: Workflow file exists
    Steps:
      1. grep -A2 "upload-pages-artifact" .github/workflows/deploy.yml | grep "path: equipment-monitor/out"
    Expected Result: Path is "equipment-monitor/out" (not just "out")
    Failure Indicators: Path is just "out" — upload will fail because out/ is in equipment-monitor subdirectory
    Evidence: .sisyphus/evidence/task-4-artifact-path-check.txt
  ```

  **Commit**: YES
  - Message: `feat(deploy): add GitHub Actions workflow for Pages deployment`
  - Files: `.github/workflows/deploy.yml`
  - Pre-commit: None

- [ ] 5. Build verification + local dev regression test

  **What to do**:
  - Run `npm run build:static` in `equipment-monitor/` to produce the `out/` directory
  - Verify the output structure contains all expected files:
    - `out/index.html` (root page)
    - `out/mes/spc/index.html` (SPC Dashboard)
    - `out/mes/lots/index.html` (Lot Tracker)
    - `out/mes/recipes/index.html` (Recipe Manager)
    - `out/.nojekyll` (Jekyll bypass)
    - `out/404.html` (SPA fallback — will be created after build by workflow, verify manually that index.html can be copied)
    - `out/_next/static/` (JS/CSS assets with `/mix-gem` prefix)
  - Verify basePath is applied: grep for `/mix-gem` in generated HTML files
  - Verify local dev server still works: `npm run dev` starts without errors
  - Verify no source files were modified during this task sequence (only config files should have changed)

  **Must NOT do**:
  - Do NOT modify any source files to fix build issues
  - If build fails, report the error and let the orchestrator decide the fix
  - Do NOT add new dependencies or change existing ones

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Verification task — run commands and check outputs
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3 (sequential, depends on all previous tasks)
  - **Blocks**: F1-F3 (Final Verification)
  - **Blocked By**: Tasks 1, 2, 3, 4

  **References** (CRITICAL):

  **Pattern References**:
  - `equipment-monitor/next.config.ts` — Should now have `output: 'export'`, `basePath`, `trailingSlash`, `images` config
  - `equipment-monitor/public/.nojekyll` — Should exist as empty file
  - `equipment-monitor/package.json` — Should have `build:static` and `export` scripts
  - `.github/workflows/deploy.yml` — Should exist at repo root

  **API/Type References**:
  - `equipment-monitor/src/app/page.tsx` — Root page (should generate `out/index.html`)
  - `equipment-monitor/src/app/mes/spc/page.tsx` — SPC Dashboard (should generate `out/mes/spc/index.html`)
  - `equipment-monitor/src/app/mes/lots/page.tsx` — Lot Tracker (should generate `out/mes/lots/index.html`)
  - `equipment-monitor/src/app/mes/recipes/page.tsx` — Recipe Manager (should generate `out/mes/recipes/index.html`)

  **WHY Each Reference Matters**:
  - Config files: This task verifies they're correctly set by running the actual build
  - Page files: These are the source files that should produce the corresponding output HTML files
  - The build must successfully render all 4 routes as static HTML

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Static build produces all expected output files
    Tool: Bash
    Preconditions: Tasks 1-4 complete, config files updated
    Steps:
      1. cd equipment-monitor
      2. npm run build:static
      3. ls -la out/index.html
      4. ls -la out/mes/spc/index.html
      5. ls -la out/mes/lots/index.html
      6. ls -la out/mes/recipes/index.html
      7. ls -la out/.nojekyll
      8. ls -la out/_next/static/
    Expected Result: All files exist, build exits 0
    Failure Indicators: Any file missing, build fails with error
    Evidence: .sisyphus/evidence/task-5-build-output-structure.txt

  Scenario: BasePath /mix-gem is present in generated HTML
    Tool: Bash
    Preconditions: Build output exists
    Steps:
      1. cd equipment-monitor
      2. grep -c "mix-gem" out/index.html
      3. grep -c "mix-gem" out/mes/spc/index.html
      4. grep -o 'href="/mix-gem[^"]*"' out/mes/spc/index.html | head -5
    Expected Result: Grep finds multiple /mix-gem references in both files
    Failure Indicators: Zero matches — basePath not applied, assets will 404 on GitHub Pages
    Evidence: .sisyphus/evidence/task-5-basepath-in-output.txt

  Scenario: Local dev server starts without regression
    Tool: Bash
    Preconditions: Config changes in place
    Steps:
      1. cd equipment-monitor
      2. Start dev server in background: Start-Job { npm run dev }
      3. Wait 10 seconds: Start-Sleep -Seconds 10
      4. Test: curl http://localhost:3000 (or use Invoke-WebRequest if curl unavailable)
      5. Stop dev server
    Expected Result: Dev server starts, HTTP 200 on localhost:3000
    Failure Indicators: Dev server crashes, port binding error, or HTTP error
    Evidence: .sisyphus/evidence/task-5-dev-server-regression.txt

  Scenario: 404.html SPA fallback content matches index.html
    Tool: Bash
    Preconditions: Build output exists
    Steps:
      1. cd equipment-monitor
      2. cp out/index.html out/404.html
      3. diff out/index.html out/404.html
    Expected Result: No differences (files are identical)
    Failure Indicators: Files differ — SPA fallback will not work correctly
    Evidence: .sisyphus/evidence/task-5-404-fallback.txt

  Scenario: No source files in src/ were modified during deployment setup
    Tool: Bash
    Preconditions: All tasks complete
    Steps:
      1. cd equipment-monitor
      2. git diff --name-only HEAD | grep "src/"
    Expected Result: No output (no src/ files modified)
    Failure Indicators: Any src/ files listed — deployment setup accidentally modified source code
    Evidence: .sisyphus/evidence/task-5-source-files-unchanged.txt
  ```

  **Commit**: YES (if any fixes needed from verification)
  - Message: `chore(deploy): fix static build output issues`
  - Files: (only if fixes were needed)
  - Pre-commit: `npm run build:static` must pass

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 3 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in `.sisyphus/evidence/`. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Config Quality Review** — `unspecified-high`
  Review all config files (next.config.ts, deploy.yml, package.json) for: correct YAML syntax, all required workflow permissions, correct working-directory paths, valid GitHub Actions action versions (not deprecated), correct basePath spelling, no typos in URLs. Verify `.nojekyll` is in `equipment-monitor/public/` not repo root. Verify `build:static` script exists and is correct.
  Output: `Config files [N clean/N issues] | Workflow [VALID/INVALID] | Paths [CORRECT/WRONG] | VERDICT`

- [ ] F3. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual file changes. Verify 1:1 — everything in spec was done (no missing), nothing beyond spec was done (no creep). Check "Must NOT do" compliance — no source files in `src/` were modified. Detect unaccounted changes.
  Output: `Tasks [N/N compliant] | Source files modified [NONE/FILES] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

- **1**: `feat(deploy): configure Next.js static export for GitHub Pages` — next.config.ts, .nojekyll, package.json scripts
- **2**: `feat(deploy): add GitHub Actions workflow for Pages deployment` — .github/workflows/deploy.yml
- **3**: `chore(deploy): verify static build output` — (if any fixes needed)

---

## Success Criteria

### Verification Commands
```bash
# Local build verification (run in equipment-monitor/)
node node_modules/next/dist/bin/next build
# Expected: exit 0, equipment-monitor/out/ directory created

# Verify output structure
ls equipment-monitor/out/index.html                    # Should exist
ls equipment-monitor/out/mes/spc/index.html             # Should exist
ls equipment-monitor/out/mes/lots/index.html            # Should exist
ls equipment-monitor/out/mes/recipes/index.html         # Should exist
ls equipment-monitor/out/.nojekyll                      # Should exist
ls equipment-monitor/out/404.html                       # Should exist

# Local dev verification (should still work)
npm run dev
# Expected: dev server starts on localhost:3000
```

### Final Checklist
- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
- [ ] Static build produces correct output structure
- [ ] Dev server still works without regression
- [ ] GitHub Actions workflow triggers on push to master
- [ ] Deployed site returns 200 on all 4 routes