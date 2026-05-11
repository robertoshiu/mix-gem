# Decisions - SECS/GEM Interactive Rollup

## Animation Timing
- Stagger delay: 60ms between packets
- Typewriter speed: 25ms per character
- Glow cycle: 2000ms pulse duration
- Max visible packets: 50 (circular buffer)
- User override duration: 5000ms (5 seconds)

## Component Architecture
- ScenarioStepCard: Accordion with expand/collapse, detail panel for active step
- FeedPacketCard: Glow pulse + typewriter + direction arrow (NO click handlers)
- RecipeDetailCard: Auto-roll on S2F49 detection, spring animation
- PayloadViewer: Expandable SECS payload, max 500 lines overflow
- TraceRow: Animated table row with inline PayloadViewer toggle

## Recipe Visibility Rule
- Recipe card visible iff S2F49 is in visibleMessages (stream===2 && function===49)
- Card disappears when S2F49 leaves visibleMessages (feed reset)
- PPID extracted from payload.params[0].cpval

## Import Rules
- Recipe type: import from @/lib/mes-types
- MOCK_RECIPES: import from @/lib/mes-mock-data
- Spring config: import from @/lib/animation (reuse, don't redefine)
## 2026-05-12 — Live trace circular buffer

- Limited the live trace table rendering to the newest 50 visible messages via a local `traceMessages` derived value, preserving the full feed state while preventing unbounded table growth.
- Kept the SECS/GEM page refactor scoped to the dynamic feed and trace table, leaving scenario console, HSMS sidebar, replay state, and alarm context untouched.

## 2026-05-12 — F4 verdict rationale

- Rejecting the scope-fidelity check because multiple task-level acceptance criteria are incomplete and there are numerous unaccounted changes outside the plan’s expected files.

## 2026-05-12 — Final verification fixes

- Kept `FeedPacketCard` stagger math tied to `STAGGER_DELAY` instead of a literal so motion stays centralized.
- Standardized trace payload expansion to `maxLines={500}` for both payload viewers in `TraceRow`.
