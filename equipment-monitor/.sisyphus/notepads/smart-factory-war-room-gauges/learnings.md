## gauge-geometry.ts learnings (task 1)

- clampPercentage: -Infinity needs explicit handling (Math.max(0, -Infinity) returns 0 in JS, but Number.isFinite(-Infinity) is false, so it was falling into the "not finite, not NaN" branch returning 100). Fixed by checking sign: alue > 0 ? 100 : 0.
- computeGaugeValueFontSize: With default width=160 and min=14/max=30, even 9-char strings produce ~30.7 which clamps to 30. Tests need narrower availableWidth or wider min/max range to observe size differences.
- Jest config uses next/jest wrapper with jsdom environment and @/ path alias — pure math tests work fine in jsdom since they don't use DOM.
- ESLint passes clean on the new file; no React/DOM imports detected by purity check.
