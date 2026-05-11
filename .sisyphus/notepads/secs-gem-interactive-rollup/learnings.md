# Learnings - SECS/GEM Interactive Rollup

## Conventions
- framer-motion v12.38.0 already installed and used in 9 other components
- animation.ts has spring config: { stiffness: 300, damping: 25, mass: 0.8 }
- SmartFactory design tokens: var(--sf-*) for all colors
- Component pattern: 'use client', cn() for conditional classes, lucide-react icons
- New components go in src/components/secs-simulator/
- Animation utilities go in src/lib/ (new file, don't modify animation.ts)

## Gotchas
- Python 3.12 f-string bug in ui-ux-pro-max script (T11)
- S2F49 payload PPID is in payload.params[0].cpval, not payload.PPID
- Recipe type is in mes-types.ts, MOCK_RECIPES is in mes-mock-data.ts
- framer-motion AnimatePresence requires mode="wait" for sequential transitions
- useReducedMotion hook must check window.matchMedia at runtime
- New SECS animation helper file can safely live in src/lib/ and should import springConfig/transitionConfig from animation.ts instead of redefining timing values.
- useTypewriter should honor reduced-motion once at mount and then drive text growth with setInterval for predictable packet/feed copy reveals.
- ScenarioStepCard works best when the active detail panel is the only motion region; the collapsed/completed summary should stay static so click targets remain stable.
- For payload rendering, top-level key/value cards and dt/dd snapshot grids satisfy the SECS/GEM readability requirement without falling back to raw JSON.
- Reduced-motion mode should bypass AnimatePresence entirely and render the same content with plain divs.
- FeedPacketCard should keep the glow pulse on a separate border overlay so the packet body stays readable while active.
- Typewriter summaries are cleanest when isolated in a tiny child component; that keeps the parent card free to switch between animated and instant text without hook-rule issues.
- RecipeDetailCard should keep the motion wrapper outside the content shell so the same panel can render instantly under reduced motion and still exit cleanly with AnimatePresence.
- Recipe detail content is clearest as a compact definition list with message badges anchored at the bottom for S2F49/S2F50 context.
- PayloadViewer works best as a scrollable key/value list with a measured max-height cap, so oversized payloads stay readable without switching to raw JSON dumps.
- Stream/function fields should keep bold monospace emphasis on both label and value to make protocol metadata stand out.
- The SECS/GEM page can keep active-step rollup state local: pass ScenarioStepCard `isActive` for the current feed index, and temporarily treat a completed step as active while `overrideStepId` matches for the 5000ms USER_OVERRIDE_DURATION.
- Reduced-motion should skip the page-level AnimatePresence wrapper around the scenario cards, while ScenarioStepCard still renders its own static detail panel through its internal reduced-motion path.
## 2026-05-12 — Trace row extraction

- `FeedPacketCard` owns its own reduced-motion behavior; callers can still wrap packet lists in `AnimatePresence` for normal motion while rendering plain lists for reduced motion.
- `PayloadViewer` accepts raw `DemoSecsMessage.payload` and can be embedded in table expansion rows with `defaultExpanded` for one-click trace detail disclosure.

## 2026-05-12 — Recipe detail sidebar wiring

- `page.tsx` can derive recipe sidebar state entirely from `visibleMessages`: S2F49 presence gates visibility, `payload.params[0].cpval` maps to `MOCK_RECIPES`, and S2F50 can be paired from the same visible window.
- Keep `RecipeDetailCard` mounted with `isVisible={false}` before/after S2F49 so its internal `AnimatePresence` can handle roll-in and roll-out animation.

## 2026-05-12 — Reduced motion and packet flood pass

- Import and use `MAX_VISIBLE_PACKETS` in `page.tsx` instead of hard-coding trace buffer limits; it keeps feed flood handling aligned with shared simulator animation constants.
- For reduced-motion support, bypass page-level `AnimatePresence` wrappers and keep active states visually clear with static cyan borders/backgrounds rather than pulsing overlays.
- Targeted lint of changed simulator files can pass even when full-project `npm run lint` is blocked by existing unrelated React Compiler/set-state-in-effect issues in other files.

## 2026-05-12 — Simulator test coverage

- Mock `framer-motion` from Jest setup so `motion.div` and `motion.tr` render as plain elements for all simulator/page tests.
- Scenario step labels can appear both in card headers and active snapshot details, so RTL assertions should use `getAllByText` for labels that may be duplicated by active panels.
- PayloadViewer nested arrays repeat keys such as `parameter` and `value`; assert collection presence with `getAllByText` rather than single-node queries.

## 2026-05-12 — F4 scope audit findings

- Scope fidelity checks should include generated/static-export directories and tool config files, not only source files, because build/serve artifacts can become unaccounted changes outside the plan deliverables.
- `npx tsc --noEmit` may surface repository-wide existing test typing issues even when LSP diagnostics on changed simulator files are clean; record this separately from task-specific source diagnostics.

## 2026-05-12 — Final verification fix pass

- Feed packet stagger timing should reuse `STAGGER_DELAY` so the card animation stays aligned with shared simulator constants.
- Trace payload rows should use a 500-line cap to match the payload viewer expectations from the rollup design.
- `useTypewriter` needs the exhaustive-deps suppression comment directly on the effect boundary to keep the hook lint-clean without adding fake dependencies.
