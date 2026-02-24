# OpenAnalytics

Lightweight, privacy-friendly web analytics. One script tag, real-time insights, no cookies.

```html
<script defer src="https://openanalytics.dev/oa.js" data-site="YOUR_SITE_ID"></script>
```

That's it. You'll see visitors, pages, referrers, countries, devices — all in a clean dashboard. No cookie banners needed.

## Why OpenAnalytics?

Google Analytics is bloated, privacy-invasive, and banned in several EU countries. Most alternatives are either too expensive or too complex.

OpenAnalytics is different:

- **< 2 KB** — The tracking script is tiny. Rich behavioral tracking in under 2 KB gzipped.
- **No cookies** — No consent banners required. GDPR/CCPA friendly out of the box.
- **Real-time** — See who's on your site right now, not yesterday.
- **Open source** — Self-host it, fork it, extend it. Your data stays yours.
- **One line** — Copy a script tag, done. Works with any site or framework.

## What You Get (Out of the Box)

| Metric | Description |
|--------|-------------|
| **Visitors** | Unique visitors per session (privacy-safe, no cookies) |
| **Pages** | Views, avg time on page, scroll depth, engagement rate |
| **Sessions** | Full visitor journeys — entry page → pages visited → exit page |
| **Scroll Depth** | How far visitors scroll on each page (%, distribution) |
| **Time on Page** | Accurate dwell time via heartbeat tracking |
| **Engagement** | Did they actually read/interact, or just bounce? |
| **Outbound Clicks** | Which external links visitors click |
| **Referrers** | Where your traffic comes from + UTM breakdown |
| **Geography** | Country and region (from anonymized IP) |
| **Devices** | Browser, OS, screen size, mobile vs desktop |
| **Live View** | Real-time active visitors and current pages |

### Dashboard-Configurable Tracking (No Code)

Set up custom tracking from the dashboard — no code changes needed:

- **Auto-Track Rules** — Point-and-click: pick a CSS selector, name the event, done
- **Funnels** — Define multi-step flows (onboarding, checkout, signup) and see conversion at each step
- **Goals** — Track single conversion events with completion rates
- **Session Explorer** — Browse individual visitor journeys event-by-event

## Quick Start

### Use the hosted dashboard

1. Sign up at [openanalytics.dev](https://openanalytics.dev)
2. Add your site and get a site ID
3. Drop the script tag into your HTML
4. Open your dashboard — data appears in seconds

### Self-host with Docker

```bash
git clone https://github.com/Acidias/OpenAnalytics.git
cd OpenAnalytics
cp .env.example .env    # Edit with your database credentials
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

By default, `docker-compose.yml` keeps Postgres and Redis on the internal Docker network only.
Use the `docker-compose.dev.yml` override above when you want local host access to those ports.

### Compose modes

- **Local dev (with Postgres/Redis host ports):**

  ```bash
  docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
  ```

- **Production profile (least-privilege defaults):**

  ```bash
  OA_ENV=prod docker compose \
    -f docker-compose.yml \
    -f docker-compose.prod.yml \
    --profile prod up -d
  ```

Production mode enables fail-fast credential checks. Change `DB_USER`, `DB_PASSWORD`, and `REDIS_PASSWORD`
from defaults before starting containers.

Then add the script tag pointing to your own instance:

```html
<script defer src="https://your-server.com/oa.js" data-site="YOUR_SITE_ID"></script>
```

For self-hosted production deployments, set a strict CORS allowlist for the API:

```bash
# .env
CORS_ORIGIN=https://analytics.yourdomain.com
# or multiple explicit origins:
# CORS_ORIGIN=https://app.yourdomain.com,https://admin.yourdomain.com
```

Use full origins only (scheme + host + optional port). Avoid wildcard or catch-all values.

### Framework Examples

**Next.js** — add to `app/layout.tsx`:
```tsx
<Script defer src="https://openanalytics.dev/oa.js" data-site="YOUR_SITE_ID" />
```

**Astro** — add to your layout's `<head>`:
```html
<script defer src="https://openanalytics.dev/oa.js" data-site="YOUR_SITE_ID"></script>
```

**WordPress** — paste the script tag in your theme's header or use the plugin (coming soon).

## Custom Events

Track anything with one line of code:

```javascript
// Basic event
oa.track('signup');

// Event with properties
oa.track('purchase', { plan: 'pro', value: 29 });

// Onboarding steps
oa.track('onboarding_step', { step: 3, name: 'connect_account' });
```

Or skip the code entirely — configure auto-tracking from the dashboard using CSS selectors. Events show up with counts, property breakdowns, trends, and funnel analysis.

## Funnels & Conversion Tracking

Define multi-step flows in the dashboard and track conversion:

```
/signup → signup_complete → /onboarding/step-1 → onboarding_done
  1,000      720 (72%)          650 (90%)           480 (74%)
```

See drop-off at each step, average time between steps, and which segments convert best. Works with pageviews, custom events, or both.

## Architecture

```
openanalytics/
├── packages/
│   ├── tracker/    # Client-side script (vanilla JS, <2KB gzipped)
│   ├── api/        # Ingestion + query API (Fastify)
│   ├── dashboard/  # Web dashboard (Next.js 14)
│   └── shared/     # Types, schemas, utilities
├── docker-compose.yml
└── package.json    # npm workspaces monorepo
```

**Stack**: TypeScript, Next.js 14, Fastify, PostgreSQL + TimescaleDB, Redis

The tracker sends lightweight events via Beacon API — pageviews, scroll depth, time on page, engagement, and outbound clicks are all tracked automatically. Custom events and dashboard-configured auto-track rules extend tracking without code changes. The API ingests events, enriches them with geo/device data (IP and UA are discarded after processing), and stores everything in a unified TimescaleDB hypertable with continuous aggregates for fast queries.

## Privacy

OpenAnalytics is built for a world where privacy matters:

- **No cookies** — We don't set any cookies, ever
- **No personal data** — We don't collect names, emails, or IP addresses
- **IP anonymization** — IPs are used for country lookup only, then discarded
- **No cross-site tracking** — Each site is isolated
- **No fingerprinting** — We don't build device profiles
- **GDPR compliant** — No consent banner needed since we don't track personal data
- **Data ownership** — Self-host and your data never leaves your server

## Roadmap

- [x] Project architecture and planning
- [x] Core tracking script (< 2KB gzipped)
- [x] Ingestion API with real-time processing
- [x] Dashboard with visitor, page, and referrer views
- [x] Geographic and device analytics
- [x] Custom event tracking
- [x] UTM campaign tracking
- [x] Session explorer (browse visitor journeys)
- [x] Dashboard-configurable auto-track rules
- [x] Visual funnel builder with conversion analysis
- [x] Goal tracking
- [ ] Team access and shared dashboards
- [ ] REST API for programmatic access
- [ ] Weekly email reports
- [ ] Mobile SDKs (React Native, Flutter)

## Contributing

OpenAnalytics is open source under the MIT license. Contributions welcome — whether it's bug fixes, features, documentation, or feedback.

```bash
# Development setup
git clone https://github.com/Acidias/OpenAnalytics.git
cd OpenAnalytics
npm install
npm run dev
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT — use it however you want.

---

Built by [Mihaly Dani](https://github.com/Acidias)
