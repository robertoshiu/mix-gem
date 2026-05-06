# Issues Encountered

## 1. Test timeouts due to React hydration errors
**Error**: "Minified React error #418" during static page rendering
**Root cause**: App uses client-side state (Zustand stores) and dynamic content that doesn't fully hydrate in static export mode
**Impact**: Tests timeout during teardown because browser context doesn't close cleanly
**Status**: App-level issue, not test implementation issue

## 2. Selector issues with header
**Problem**: Original test used `header button` which matched 7 elements (4 header + 3 section zone cards)
**Solution**: Used `page.getByRole('heading', { name: 'WAR ROOM 3D' }).locator('ancestor::header/descendant::button')`
**Note**: Header element does NOT have `aria-label` - cannot use `header[aria-label] button`

## 3. WebGL fallback selector strictness
**Problem**: `[role="alert"]` matched 2 elements - WebGL fallback AND route announcer
**Solution**: Use `page.getByRole('alert', { name: 'WebGL not available' })` which is more specific

## 4. Recharts dimension warnings
**Error**: "The width(-1) and height(-1) of chart should be greater than 0"
**Cause**: ResponsiveContainer needs explicit dimensions, fails in headless browser with small viewport
**Impact**: Console noise but doesn't affect test pass/fail