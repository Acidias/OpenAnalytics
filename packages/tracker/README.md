# @openanalytics/tracker

The client-side tracking script. Target: **under 2 KB gzipped**.

## What It Tracks (Out of the Box)

| Event | When | Data |
|-------|------|------|
| `pageview` | Page load / SPA navigation | path, referrer, viewport |
| `engage` | After 5s on page or first interaction | time to engage |
| `heartbeat` | Every 30s while tab is visible | duration, scroll %, engaged |
| `pageleave` | Tab hidden / navigate away | total duration, max scroll %, engaged |
| `outbound_click` | External link clicked | URL, link text |

## How It Works

1. Loads with `defer` — never blocks page rendering
2. Generates a session ID via `sessionStorage` (no cookies)
3. Tracks pageviews, scroll depth, time on page, and engagement automatically
4. Sends events via Beacon API (falls back to XHR)
5. Listens for History API changes (SPA support)
6. Fetches site config from dashboard for auto-track rules
7. Exposes `oa.track()` for custom events

## Session Management

- Session ID stored in `sessionStorage` (survives page navigation, dies on tab close)
- No cookies, no localStorage, no fingerprinting
- All events tied to session for full visitor journey reconstruction

## Data Sent Per Event

```json
{
  "s": "site-id",
  "sid": "random-session-id",
  "t": "pageview",
  "u": "/current/page",
  "r": "https://referrer.com",
  "w": 1440,
  "ts": 1708531200000
}
```

Additional fields for behavioral events:

```json
{
  "t": "pageleave",
  "p": {
    "duration_ms": 45000,
    "scroll_max_pct": 78,
    "engaged": true
  }
}
```

## Dashboard-Configured Auto-Tracking

The tracker fetches config from `/api/config/:siteId` on page load. Config contains auto-track rules defined in the dashboard UI:

```json
{
  "autoTrack": [
    { "selector": ".cta-btn", "event": "cta_click", "trigger": "click" },
    { "selector": "#signup-form", "event": "signup_start", "trigger": "submit" }
  ]
}
```

No code changes needed on the user's site — just configure in the dashboard.

## Custom Events

```javascript
oa.track('signup');
oa.track('purchase', { plan: 'pro', value: 29 });
oa.track('onboarding_step', { step: 3, name: 'connect_account' });
```

## Development

```bash
cd packages/tracker
npm run build         # Build and minify with esbuild
npm run build:check   # Check raw and gzipped size
```
