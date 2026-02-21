# @openanalytics/tracker

The client-side tracking script. Target: **under 1 KB gzipped**.

## How It Works

1. Loads with `defer` — never blocks page rendering
2. Sends a single POST via Beacon API on page load
3. Listens for History API changes (SPA support)
4. Exposes `oa.track()` for custom events

## Data Sent Per Request

```json
{
  "s": "site-id",
  "t": "pageview",
  "u": "/current/page",
  "r": "https://referrer.com",
  "w": 1440
}
```

That's it. No cookies. No localStorage. No fingerprinting.

## Custom Events

```javascript
oa.track('signup');
oa.track('purchase', { plan: 'pro', value: 29 });
```

## Development

```bash
cd packages/tracker
npm run build     # Build and minify
npm run size      # Check gzipped size
npm run test      # Run tests
```
