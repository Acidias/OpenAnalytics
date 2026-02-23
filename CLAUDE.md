# OpenAnalytics

Privacy-first, cookie-free web analytics platform. npm workspaces monorepo.

## Packages

- **packages/tracker** - Client-side tracking script (< 2KB gzipped). Vanilla JS, esbuild. Tracks pageviews, scroll depth, time on page, engagement, outbound clicks, SPA navigation. Outputs `dist/oa.js`. Uses `text/plain` content type to avoid CORS preflights with sendBeacon.
- **packages/api** - Fastify backend. Event ingestion (`text/plain` JSON), analytics queries, site/funnel/goal CRUD, JWT auth (register/login/me, also accepts `?token=` query param for WebSocket). PostgreSQL + TimescaleDB + Redis pub/sub for live view. Auto-migrates on startup. Serves tracker script at `/oa.js`. Always allows localhost dashboard in CORS regardless of `CORS_ORIGIN` setting. Normalises site domains to bare hostnames on create/update.
- **packages/dashboard** - Next.js 14 web UI. Tailwind + shadcn/ui + Recharts. JWT auth via localStorage (no NextAuth). All analytics pages, funnel builder, session explorer, live view (REST + WebSocket hybrid). Add Site wizard is 5 steps: Details, Deploy, Setup Guide, Script, Done - persists state in sessionStorage to survive Docker restarts. `/setup` page has Cloudflare Tunnel onboarding guide.
- **packages/shared** - Shared TypeScript types, Zod validation schemas, and constants used across api and dashboard.

## Key Files

- `ARCHITECTURE.md` - Detailed technical architecture, database schema, API endpoints, tracker behaviour
- `docker-compose.yml` - PostgreSQL (TimescaleDB), Redis, API, and dashboard services
- `.env.example` - Required environment variables

## Docker

`docker compose up` runs everything. Requires `packages/tracker/dist/oa.js` to be built first (`npm run -w @openanalytics/tracker build`). Env vars: `DB_PASSWORD`, `JWT_SECRET` (optional `API_URL`, `DASHBOARD_URL` for remote). `TRACKER_URL` sets the public-facing URL for the tracking script tag (e.g. a Cloudflare Tunnel URL). `CORS_ORIGIN` supports comma-separated origins - always include `http://localhost:3100` so the dashboard can reach the API. Migrations run automatically on API startup.

## Database

PostgreSQL + TimescaleDB. Migrations in `packages/api/src/db/migrations/`, auto-applied by `packages/api/src/db/migrate.ts` on startup. Unified `events` hypertable - all tracking data in one table, partitioned by time with continuous aggregates for fast dashboard queries.

## Demo Seed

`npm run -w @openanalytics/api seed:demo` creates a demo user (`demo@openanalytics.dev` / `demodemo123`), a demo site, 500 sessions of realistic sample data, 2 funnels, and 3 goals. Safe to re-run - clears existing demo events first.

## Conventions

- TypeScript strict mode everywhere
- British English for user-facing text
- kebab-case filenames
- Zod for all request validation (shared schemas)
- No cookies, no PII stored, IPs discarded after geo lookup
- Tracker script must use raw `<script defer>` tag, not framework components like Next.js `<Script>` (they break `document.currentScript`)
