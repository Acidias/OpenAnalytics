# OpenAnalytics

Privacy-first, cookie-free web analytics platform. npm workspaces monorepo.

## Packages

- **packages/tracker** - Client-side tracking script (< 2KB gzipped). Vanilla JS, esbuild. Tracks pageviews, scroll depth, time on page, engagement, outbound clicks, SPA navigation. Outputs `dist/oa.js`. Uses `text/plain` content type to avoid CORS preflights with sendBeacon.
- **packages/api** - Fastify backend. Event ingestion (`text/plain` JSON), analytics queries, site/funnel/goal CRUD, JWT auth (register/login/me/logout, `?token=` query param restricted to WebSocket live endpoint only). 7-day tokens with Redis-backed session revocation (JTI). Rate-limited auth endpoints. `REGISTRATION_ENABLED` env var toggle. Password policy requires letter + number, blocks common passwords. `JWT_SECRET` is required (no fallback). PostgreSQL + TimescaleDB + Redis pub/sub for live view. Auto-migrates on startup. Serves tracker script at `/oa.js`. Always allows localhost dashboard in CORS regardless of `CORS_ORIGIN` setting. Normalises site domains to bare hostnames on create/update.
- **packages/dashboard** - Next.js 14 web UI. Tailwind + shadcn/ui + Recharts. JWT auth via localStorage (no NextAuth). All analytics pages, funnel builder, session explorer, live view (REST + WebSocket hybrid). Add Site wizard is 5 steps: Details, Deploy, Setup Guide, Script, Done - persists state in sessionStorage to survive Docker restarts. `/setup` page has Cloudflare Tunnel onboarding guide.
- **packages/shared** - Shared TypeScript types, Zod validation schemas, and constants used across api and dashboard.

## Key Files

- `ARCHITECTURE.md` - Detailed technical architecture, database schema, API endpoints, tracker behaviour
- `docker-compose.yml` - PostgreSQL (TimescaleDB), Redis, API, and dashboard services
- `.env.example` - Required environment variables

## Docker

`docker compose up` runs everything. Requires `packages/tracker/dist/oa.js` to be built first (`npm run -w @openanalytics/tracker build`). Env vars: `DB_PASSWORD`, `JWT_SECRET` (required - no default, compose will error without it), `REGISTRATION_ENABLED` (default `true`). Optional: `API_URL`, `DASHBOARD_URL` for remote. `TRACKER_URL` sets the public-facing URL for the tracking script tag (e.g. a Cloudflare Tunnel URL). `CORS_ORIGIN` supports comma-separated origins - always include `http://localhost:3100` so the dashboard can reach the API. Migrations run automatically on API startup.

## Database

PostgreSQL + TimescaleDB. Migrations in `packages/api/src/db/migrations/`, auto-applied by `packages/api/src/db/migrate.ts` on startup. Unified `events` hypertable - all tracking data in one table, partitioned by time with continuous aggregates for fast dashboard queries.

## Demo Seed

`npm run -w @openanalytics/api seed:demo` creates a demo user (`demo@openanalytics.dev` / `demodemo123`), a demo site, 500 sessions of realistic sample data, 2 funnels, and 3 goals. Safe to re-run - clears existing demo events first.

## Auto-Provisioned Demo Site

Every user automatically gets a "Demo Site" (`demo.example.com`) with 30 days of realistic analytics on register/login. Identified by `settings @> '{"is_demo": true}'` on the sites table (no migration needed). Site row created synchronously, events/funnels/goals populated in the background. Redis NX lock prevents concurrent provisioning. Includes 500 sessions with funnel-aware paths (~30% follow funnel flows with realistic drop-off), 4 funnels, and 4 goals. Dashboard shows amber "Demo" badge on demo site cards. Code in `packages/api/src/services/provision-demo.ts`, triggered from auth routes.

## AI Setup Assistant

`ANTHROPIC_API_KEY` env var enables the AI setup feature. `POST /api/sites/:id/ai/suggest` gathers analytics context (top pages, flows, events, referrers, existing config with full details and IDs), crawls the top 5 visited pages extracting interactive elements (buttons, forms, CTA links) with real CSS selectors, and calls Claude to suggest funnels, goals, and auto-track rules. Strict prompt constraints: funnels/goals can ONLY use pages and events that exist in the analytics data; auto-track rules must use actual CSS selectors from the crawl. AI can suggest new items or replacements for existing ones (action: "create" | "replace"). Dashboard page at `/dashboard/:siteId/ai-setup` uses a 3-phase wizard: Describe (input), Review (step through each suggestion with editable fields), Done (summary with links). Replacements delete the old item then create the new one. Hard limit of 10 AI queries per user (stored in `users.ai_queries_used`), only incremented on successful responses. Dashboard shows contact links when limit reached.

## Conventions

- TypeScript strict mode everywhere
- British English for user-facing text
- kebab-case filenames
- Zod for all request validation (shared schemas)
- No cookies, no PII stored, IPs discarded after geo lookup
- Tracker script must use raw `<script defer>` tag, not framework components like Next.js `<Script>` (they break `document.currentScript`)
