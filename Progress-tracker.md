# Progress Tracker

> Auto-updated by sub-agents. Each agent updates their section when a task is complete.

## Phase 1: Foundation

### Shared Types (`packages/shared/`)
- [x] Event types (TrackingEvent, PageviewEvent, PageleaveEvent, HeartbeatEvent, etc.)
- [x] Session types (Session, SessionTimeline, SessionEvent)
- [x] Analytics types (PageStats, SiteOverview, ReferrerStats, GeoStats, DeviceStats)
- [x] Funnel types (Funnel, FunnelStep, FunnelAnalysis)
- [x] Goal types (Goal, GoalCompletion)
- [x] Auto-track types (AutoTrackRule, SiteConfig)
- [x] API types (AnalyticsQuery, DateRange, ApiResponse)
- [x] Zod validation schemas
- [x] Package builds and exports correctly

### Database Schema (`packages/api/`)
- [x] SQL migration files (users, sites, events, funnels, goals, auto_track_rules)
- [x] TimescaleDB hypertable + compression + retention policies
- [x] Continuous aggregates (page_stats_hourly, site_stats_daily)
- [x] All indexes

## Phase 2: Core Packages

### Tracker Script (`packages/tracker/`)
- [x] Build tooling (esbuild/rollup, minification)
- [x] Core: pageview tracking with session management (sessionStorage)
- [x] Core: scroll depth tracking
- [x] Core: time on page (heartbeat every 30s)
- [x] Core: engagement detection (5s timer + click/keypress)
- [x] Core: pageleave with duration + scroll + engaged
- [x] Core: outbound link click tracking
- [x] Core: SPA navigation (History API)
- [x] Dashboard config fetch + auto-track rule application
- [x] Public API: `oa.track()` and `oa.identify()`
- [x] Beacon API with XHR fallback
- [x] Final bundle < 2KB gzipped (1247 bytes)
- [ ] Tests

### Ingestion API (`packages/api/`)
- [x] Fastify server setup + CORS
- [x] POST /api/event — validate, enrich (GeoIP + UA parse), store
- [x] GET /api/config/:sitePublicId — serve auto-track rules (cached)
- [x] Rate limiting (per-site + per-IP + heartbeat dedup)
- [x] GeoIP integration (geoip-lite, IP discarded)
- [x] UA parsing (ua-parser-js, header discarded)
- [x] Redis real-time counters + pub/sub
- [ ] Tests

### Query API (`packages/api/`)
- [x] GET /api/sites/:id/overview
- [x] GET /api/sites/:id/pages
- [x] GET /api/sites/:id/sessions + /:sid
- [x] GET /api/sites/:id/referrers
- [x] GET /api/sites/:id/geo
- [x] GET /api/sites/:id/devices
- [x] GET /api/sites/:id/events + /:name
- [x] GET /api/sites/:id/live (WebSocket)
- [x] GET /api/sites/:id/funnels/:fid (funnel analysis engine)
- [x] GET /api/sites/:id/goals
- [x] GET /api/sites/:id/export (CSV/JSON)
- [x] CRUD: sites, auto-track rules, funnels, goals
- [x] Auth middleware (JWT verification)
- [ ] Tests

## Phase 3: Dashboard

### Dashboard (`packages/dashboard/`)
- [ ] Next.js 14 project setup + Tailwind + shadcn/ui
- [ ] Auth (NextAuth.js — GitHub + email magic link)
- [ ] Landing page
- [ ] Site list + add site flow (generates script tag)
- [ ] Overview page (visitors, pageviews, engagement, scroll depth, trends)
- [ ] Pages analytics (per-page: views, duration, scroll, bounce)
- [ ] Session explorer (list + single session timeline)
- [ ] Custom events (overview + single event property breakdown)
- [ ] Funnel builder (visual step builder + conversion visualization)
- [ ] Goals page
- [ ] Live real-time view (WebSocket)
- [ ] Sources (referrers + UTM breakdown)
- [ ] Geo (map + country/region)
- [ ] Devices (browser, OS, device charts)
- [ ] Settings (site settings + auto-track rule builder)
- [ ] Account settings

## Agent Log

| Time | Agent | Action | Commit |
|------|-------|--------|--------|
| 2026-02-21 04:54 | tracker | Built full tracker script: all features from TECHNICAL_PLAN.md. 2556 bytes raw, 1247 bytes gzipped. | (see below) |
| 2026-02-21 04:55 | shared-types | Built @openanalytics/shared: all types, Zod schemas, constants. tsc passes. | (see below) |
| 2026-02-21 05:00 | api | Built @openanalytics/api: full DB schema, migrations, ingestion API, query API, funnels, goals, auto-track, auth, WebSocket live view. tsc passes. | (see below) |
