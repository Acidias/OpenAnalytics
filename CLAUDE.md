# OpenAnalytics

Privacy-first, cookie-free web analytics platform. npm workspaces monorepo.

## Packages

- **packages/tracker** - Client-side tracking script (< 2KB gzipped). Vanilla JS, esbuild. Tracks pageviews, scroll depth, time on page, engagement, outbound clicks, SPA navigation. Outputs `dist/oa.js`.
- **packages/api** - Fastify backend. Event ingestion, analytics queries, site/funnel/goal CRUD, JWT auth (register/login/me). PostgreSQL + TimescaleDB + Redis. Auto-migrates on startup. Serves tracker script at `/oa.js`.
- **packages/dashboard** - Next.js 14 web UI. Tailwind + shadcn/ui + Recharts. JWT auth via localStorage (no NextAuth). All analytics pages, funnel builder, session explorer, live view.
- **packages/shared** - Shared TypeScript types, Zod validation schemas, and constants used across api and dashboard.

## Key Files

- `ARCHITECTURE.md` - Detailed technical architecture, database schema, API endpoints, tracker behaviour
- `docker-compose.yml` - PostgreSQL (TimescaleDB), Redis, API, and dashboard services
- `.env.example` - Required environment variables

## Docker

`docker compose up` runs everything. Requires `packages/tracker/dist/oa.js` to be built first (`npm run -w @openanalytics/tracker build`). Env vars: `DB_PASSWORD`, `JWT_SECRET` (optional `API_URL`, `DASHBOARD_URL` for remote). `TRACKER_URL` sets the public-facing URL for the tracking script tag (e.g. a Cloudflare Tunnel URL). `CORS_ORIGIN` supports comma-separated origins. Migrations run automatically on API startup.

## Database

PostgreSQL + TimescaleDB. Migrations in `packages/api/src/db/migrations/`, auto-applied by `packages/api/src/db/migrate.ts` on startup. Unified `events` hypertable - all tracking data in one table, partitioned by time with continuous aggregates for fast dashboard queries.

## Conventions

- TypeScript strict mode everywhere
- British English for user-facing text
- kebab-case filenames
- Zod for all request validation (shared schemas)
- No cookies, no PII stored, IPs discarded after geo lookup
