# Progress Tracker

> Auto-updated by sub-agents. Each agent updates their section when a task is complete.

## Phase 1: Foundation

### Shared Types (`packages/shared/`)
- [ ] Event types (TrackingEvent, PageviewEvent, PageleaveEvent, HeartbeatEvent, etc.)
- [ ] Session types (Session, SessionTimeline, SessionEvent)
- [ ] Analytics types (PageStats, SiteOverview, ReferrerStats, GeoStats, DeviceStats)
- [ ] Funnel types (Funnel, FunnelStep, FunnelAnalysis)
- [ ] Goal types (Goal, GoalCompletion)
- [ ] Auto-track types (AutoTrackRule, SiteConfig)
- [ ] API types (AnalyticsQuery, DateRange, ApiResponse)
- [ ] Zod validation schemas
- [ ] Package builds and exports correctly

### Database Schema (`packages/api/`)
- [ ] SQL migration files (users, sites, events, funnels, goals, auto_track_rules)
- [ ] TimescaleDB hypertable + compression + retention policies
- [ ] Continuous aggregates (page_stats_hourly, site_stats_daily)
- [ ] All indexes

## Phase 2: Core Packages

### Tracker Script (`packages/tracker/`)
- [ ] Build tooling (esbuild/rollup, minification)
- [ ] Core: pageview tracking with session management (sessionStorage)
- [ ] Core: scroll depth tracking
- [ ] Core: time on page (heartbeat every 30s)
- [ ] Core: engagement detection (5s timer + click/keypress)
- [ ] Core: pageleave with duration + scroll + engaged
- [ ] Core: outbound link click tracking
- [ ] Core: SPA navigation (History API)
- [ ] Dashboard config fetch + auto-track rule application
- [ ] Public API: `oa.track()` and `oa.identify()`
- [ ] Beacon API with XHR fallback
- [ ] Final bundle < 2KB gzipped
- [ ] Tests

### Ingestion API (`packages/api/`)
- [ ] Fastify server setup + CORS
- [ ] POST /api/event — validate, enrich (GeoIP + UA parse), store
- [ ] GET /api/config/:sitePublicId — serve auto-track rules (cached)
- [ ] Rate limiting (per-site + per-IP + heartbeat dedup)
- [ ] GeoIP integration (MaxMind GeoLite2, IP discarded)
- [ ] UA parsing (ua-parser-js, header discarded)
- [ ] Redis real-time counters + pub/sub
- [ ] Tests

### Query API (`packages/api/`)
- [ ] GET /api/sites/:id/overview
- [ ] GET /api/sites/:id/pages
- [ ] GET /api/sites/:id/sessions + /:sid
- [ ] GET /api/sites/:id/referrers
- [ ] GET /api/sites/:id/geo
- [ ] GET /api/sites/:id/devices
- [ ] GET /api/sites/:id/events + /:name
- [ ] GET /api/sites/:id/live (WebSocket)
- [ ] GET /api/sites/:id/funnels/:fid (funnel analysis engine)
- [ ] GET /api/sites/:id/goals
- [ ] GET /api/sites/:id/export (CSV/JSON)
- [ ] CRUD: sites, auto-track rules, funnels, goals
- [ ] Auth middleware (NextAuth.js JWT verification)
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
| — | — | — | — |
