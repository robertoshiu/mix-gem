# NotificationPanel - Learnings

## Component Created
- **File**: `equipment-monitor/src/components/spc/NotificationPanel.tsx`
- **Type declaration update**: `equipment-monitor/src/types/lucide-react.d.ts` (added CheckCheck, BellOff)

## Store Integration
- Uses `useMesSpcStore` with: `notifications`, `markAllNotificationsRead`, `dismissNotification`, `closeAllPanels`
- All required store actions exist and were used as specified

## Type System Quirks
- lucide-react v0.563.0 ships without `.d.ts` files (the `typings` field in package.json points to a non-existent file)
- TypeScript can't resolve some exports because of this
- The project has two declaration files for missing lucide-react types:
  - `lucide-react.d.ts` (root) — declares common icons (Bell, Info, AlertCircle, etc.)
  - `src/types/lucide-react.d.ts` — augments with SPC-specific icons (Droplets, FlaskConical, etc.)
- Any new lucide-react icon exports not in these files will fail type-checking

## CSS Variable Conventions
- Use `var(--smartfactory-*)` CSS variables consistently (no inline hex colors)
- Common variables used:
  - `--smartfactory-surface-panel` - panel backgrounds
  - `--smartfactory-border-default` - borders
  - `--smartfactory-surface-elevated` - elevated/hover surfaces
  - `--smartfactory-text-primary` / `--smartfactory-text-secondary` / `--smartfactory-text-muted`
  - `--smartfactory-status-red` - critical/danger
  - `--smartfactory-status-amber` - warning
  - `--smartfactory-accent-blue` - info/primary accent
