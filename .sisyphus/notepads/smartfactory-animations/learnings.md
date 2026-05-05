# SmartFactory Animation Implementation

## Pattern Used
Each component follows the same pattern:
1. Import `motion` from `framer-motion` and the specific variant + `useReducedMotion` from `@/lib/animation`
2. In the component body, call `const reduced = useReducedMotion()` and create conditional props object:
   ```ts
   const animProps = reduced ? {} : { variants: someVariant, initial: 'initial' as const, animate: 'animate' as const };
   ```
3. Wrap target elements with `<motion.div {...animProps}>` — when reduced motion is true, `{}` is spread (no animation props).

## Applied Files

| File | Variant | Animation Target |
|------|---------|-----------------|
| `KpiGaugeCard.tsx` | `staggerContainer` + `fadeInUp` | Grid container + each card |
| `ProcessFlow.tsx` | `fadeIn` | Each flow step node |
| `WipDonutChart.tsx` | `scaleIn` | Donut container |
| `AiRecommendations.tsx` | `fadeInUp` | Each recommendation card |
| `FabFloorMap.tsx` | `fadeIn` | Each equipment node button |
| `FooterStatusBar.tsx` | `fadeIn` | Footer element |
| `NotificationPanel.tsx` | `slideInRight` | Panel wrapper |
| `app/mes/spc/page.tsx` | `AnimatePresence mode="wait"` | Main dashboard content |

## Pre-existing Issues (not related to this work)
- `AiRecommendations.tsx` has lucide-react icon name mismatches (`Cpu`, `Sprout`, etc. imported but old names `BrainCircuit`, `Wrench` used in code)
- All `.test.tsx` files have `jest-dom` matcher type errors (`toBeInTheDocument`, `toHaveClass`, etc.) — missing `@testing-library/jest-dom` types
