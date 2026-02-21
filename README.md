# OpenAnalytics

Lightweight, privacy-friendly web analytics. One script tag, real-time insights, no cookies.

```html
<script defer src="https://openanalytics.dev/oa.js" data-site="YOUR_SITE_ID"></script>
```

That's it. You'll see visitors, pages, referrers, countries, devices — all in a clean dashboard. No cookie banners needed.

## Why OpenAnalytics?

Google Analytics is bloated, privacy-invasive, and banned in several EU countries. Most alternatives are either too expensive or too complex.

OpenAnalytics is different:

- **< 1 KB** — The tracking script is tiny. It won't slow down your site.
- **No cookies** — No consent banners required. GDPR/CCPA friendly out of the box.
- **Real-time** — See who's on your site right now, not yesterday.
- **Open source** — Self-host it, fork it, extend it. Your data stays yours.
- **One line** — Copy a script tag, done. Works with any site or framework.

## What You Get

| Metric | Description |
|--------|-------------|
| **Visitors** | Unique visitors, new vs returning (privacy-safe, no fingerprinting) |
| **Pages** | Top pages, entry pages, exit pages |
| **Referrers** | Where your traffic comes from |
| **Geography** | Country and region (from anonymized IP) |
| **Devices** | Browser, OS, screen size, mobile vs desktop |
| **UTM Tracking** | Campaign source, medium, content |
| **Performance** | Page load times |
| **Live View** | Real-time active visitors |

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
docker compose up -d
```

Then add the script tag pointing to your own instance:

```html
<script defer src="https://your-server.com/oa.js" data-site="YOUR_SITE_ID"></script>
```

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

Track button clicks, sign-ups, purchases — anything you want:

```javascript
// Basic event
oa.track('signup');

// Event with properties
oa.track('purchase', { plan: 'pro', value: 29 });
```

Events show up in your dashboard under the Events tab with counts, breakdowns, and trends.

## Architecture

```
openanalytics/
├── tracker/        # Client-side script (vanilla JS, <1KB gzipped)
├── api/            # Ingestion + query API (Node.js / Fastify)
├── dashboard/      # Web dashboard (Next.js)
├── shared/         # Types and utilities
└── docker/         # Docker Compose setup
```

**Stack**: TypeScript, Next.js 14, Fastify, PostgreSQL + TimescaleDB, Redis

The tracker sends a single POST request per page view using the Beacon API. No cookies, no localStorage, no fingerprinting. The API processes events in real-time and stores them in TimescaleDB for efficient time-series queries. The dashboard pulls data through authenticated API endpoints.

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
- [ ] Core tracking script
- [ ] Ingestion API with real-time processing
- [ ] Dashboard with visitor, page, and referrer views
- [ ] Geographic and device analytics
- [ ] Custom event tracking
- [ ] UTM campaign tracking
- [ ] User-configurable goals and funnels
- [ ] Team access and shared dashboards
- [ ] REST API for programmatic access
- [ ] Mobile SDKs (React Native, Flutter)
- [ ] Configurable conversion flows (onboarding steps, CTAs)

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
