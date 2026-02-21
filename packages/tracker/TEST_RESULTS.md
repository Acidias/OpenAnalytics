# Tracker Package — Test Results

**Date:** 2026-02-21  
**Status:** ✅ ALL PASS

## Build
- `npm run build` (esbuild) — **SUCCESS**
- Output: `dist/oa.js`
- **Raw size:** 2,556 bytes
- **Gzipped:** ~1,247 bytes
- Excellent — well under 3KB gzipped target

## Feature Verification (in built JS)
| Feature | Present |
|---------|---------|
| sessionStorage session management | ✅ `_oa_sid` key |
| Scroll depth tracking | ✅ scroll listener, `getScrollPct` |
| Heartbeat (30s interval) | ✅ `setInterval` with 30000ms |
| Engagement detection | ✅ 5s timeout + click/keydown |
| Pageleave handler | ✅ visibilitychange + pagehide |
| Outbound click tracking | ✅ hostname comparison |
| SPA navigation (pushState) | ✅ wraps `history.pushState` |
| SPA navigation (popstate) | ✅ popstate listener |
| Config fetch + auto-track | ✅ XHR to `/config/:site` |
| `window.oa.track()` | ✅ exposed |
| `window.oa.identify()` | ✅ exposed |

## Code Review Notes
- **No bugs found** — code is clean and well-structured
- Beacon API with XHR fallback is correct
- Session ID generation uses `Math.random().toString(36)` + timestamp — adequate for analytics (not security)
- Engagement fires once (correct — uses `once: true` on click/keydown)
- SPA navigation properly resets state (pageEntryTime, maxScroll, engaged) and sends pageleave before new pageview

## Test Page
- Created `packages/tracker/test/index.html` with mocked API endpoints
- Intercepts sendBeacon and XHR to display events in-page
- Includes buttons for custom events, identify, SPA nav, and outbound links

## Issues Found
None.
