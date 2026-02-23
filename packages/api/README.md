# @openanalytics/api

Event ingestion, analytics queries, and site configuration API.

## Stack

- Fastify (high-throughput HTTP)
- PostgreSQL + TimescaleDB (time-series storage with continuous aggregates)
- Redis (real-time counters, rate limiting, pub/sub for live view)
- Zod (validation)
- MaxMind GeoLite2 (IP → country/region, IP discarded after lookup)
- ua-parser-js (User-Agent → browser/OS, UA discarded after parse)

## Endpoints

### Tracking (public, CORS enabled)

> Production requires `CORS_ORIGIN` with explicit origins only (`https://app.example.com` or comma-separated list). Development auto-allows localhost dashboard origin.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/event` | Ingest tracking events |
| `GET` | `/api/config/:sitePublicId` | Site config for tracker (auto-track rules, CDN cached) |

### Analytics (authenticated)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/sites/:id/overview` | Main dashboard stats |
| `GET` | `/api/sites/:id/pages` | Page-level analytics (views, duration, scroll, engagement) |
| `GET` | `/api/sites/:id/sessions` | Session list with visitor journeys |
| `GET` | `/api/sites/:id/sessions/:sid` | Single session event timeline |
| `GET` | `/api/sites/:id/referrers` | Traffic sources |
| `GET` | `/api/sites/:id/geo` | Geographic breakdown |
| `GET` | `/api/sites/:id/devices` | Browser, OS, device type |
| `GET` | `/api/sites/:id/events` | Custom event analytics |
| `GET` | `/api/sites/:id/events/:name` | Single event details + property breakdowns |
| `GET` | `/api/sites/:id/live` | Real-time visitors (WebSocket) |
| `GET` | `/api/sites/:id/funnels/:fid` | Funnel analysis with conversion rates |
| `GET` | `/api/sites/:id/goals` | Goal completion rates |
| `GET` | `/api/sites/:id/export` | CSV/JSON data export |

### Site Management (authenticated)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/sites` | Create new site |
| `PATCH` | `/api/sites/:id` | Update site settings |
| `DELETE` | `/api/sites/:id` | Delete site and data |

### Auto-Track Rules (authenticated)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/sites/:id/rules` | List auto-track rules |
| `POST` | `/api/sites/:id/rules` | Create rule |
| `PATCH` | `/api/sites/:id/rules/:rid` | Update rule |
| `DELETE` | `/api/sites/:id/rules/:rid` | Delete rule |

### Funnels & Goals (authenticated)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/sites/:id/funnels` | List funnels |
| `POST` | `/api/sites/:id/funnels` | Create funnel with steps |
| `PATCH` | `/api/sites/:id/funnels/:fid` | Update funnel |
| `DELETE` | `/api/sites/:id/funnels/:fid` | Delete funnel |
| `GET` | `/api/sites/:id/goals` | List goals |
| `POST` | `/api/sites/:id/goals` | Create goal |
| `DELETE` | `/api/sites/:id/goals/:gid` | Delete goal |

## Processing Pipeline

```
Event → Validate (Zod) → Rate-limit (Redis)
  → GeoIP lookup (IP discarded) → UA parse (header discarded)
  → INSERT events table → Publish Redis (live view)
  → Update Redis counters → Return 202 Accepted
```

## Rate Limiting

- Per-site: 200 events/second
- Per-IP: 60 events/minute
- Heartbeat dedup: max 1 per session per 25s

## Development

```bash
cd packages/api
npm run dev         # Start with hot reload (tsx watch)
npm run build       # Compile TypeScript
npm run typecheck   # Type-check without emitting
npm run start       # Run compiled output
```
