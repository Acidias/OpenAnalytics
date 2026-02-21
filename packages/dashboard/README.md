# @openanalytics/dashboard

The web dashboard for viewing analytics.

## Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- Recharts (charts)
- NextAuth.js (authentication)

## Pages

- `/` — Landing page
- `/login` — Sign in
- `/dashboard` — Site overview
- `/dashboard/[siteId]` — Analytics for a site
- `/dashboard/[siteId]/events` — Custom events
- `/dashboard/[siteId]/live` — Real-time visitors
- `/settings` — Account and site management

## Development

```bash
cd packages/dashboard
cp .env.example .env.local
npm run dev       # Start on localhost:3000
npm run build     # Production build
npm run test      # Run tests
```
