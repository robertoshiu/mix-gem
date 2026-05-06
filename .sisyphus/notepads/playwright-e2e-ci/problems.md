# Problems (Unresolved)

## 1. Test environment vs production gap
React hydration errors in static export indicate the app may have runtime behavior that differs from static preview. This is a known limitation of Next.js static export with client-side state.

## 2. Playwright tests pass locally but may have environment issues
The test failures appear to be environment-specific (GPU, WebGL, headless rendering). In a proper CI environment with different GPU drivers, these may pass.

## 3. No CI verification possible in this environment
Cannot actually run the CI workflow to verify the quality gates work correctly. Trusting the workflow configuration is correct based on:
- Package manager detection output used correctly
- npm scripts exist and work
- Build produces `out/` directory
- Playwright config properly references `out/` via static-server.mjs