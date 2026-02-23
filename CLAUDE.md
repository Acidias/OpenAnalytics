# OpenAnalytics

Privacy-first, cookie-free web analytics platform. npm workspaces monorepo.

## Packages

- **packages/tracker** - Client-side tracking script (< 2KB gzipped). Vanilla JS, esbuild. Tracks pageviews, scroll depth, time on page, engagement, outbound clicks, SPA navigation. Outputs `dist/oa.js`.
- **packages/api** - Fastify backend. Event ingestion, analytics queries, site/funnel/goal CRUD. PostgreSQL + TimescaleDB + Redis.
- **packages/dashboard** - Next.js 14 web UI. Tailwind + shadcn/ui + Recharts. NextAuth for auth. All analytics pages, funnel builder, session explorer, live view.
- **packages/shared** - Shared TypeScript types, Zod validation schemas, and constants used across api and dashboard.

## Key Files

- `ARCHITECTURE.md` - Detailed technical architecture, database schema, API endpoints, tracker behaviour
- `docker-compose.yml` - PostgreSQL (TimescaleDB), Redis, API, and dashboard services
- `.env.example` - Required environment variables

## Database

PostgreSQL + TimescaleDB. Migrations in `packages/api/src/db/migrations/`. Unified `events` hypertable - all tracking data in one table, partitioned by time with continuous aggregates for fast dashboard queries.

## Conventions

- TypeScript strict mode everywhere
- British English for user-facing text
- kebab-case filenames
- Zod for all request validation (shared schemas)
- No cookies, no PII stored, IPs discarded after geo lookup
