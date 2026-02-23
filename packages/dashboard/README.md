# @openanalytics/dashboard

The web dashboard for viewing analytics, configuring tracking, and building funnels.

## Stack

- Next.js 14 (App Router, React Server Components)
- TypeScript
- Tailwind CSS + shadcn/ui
- Recharts (charts and visualizations)
- NextAuth.js (GitHub + email magic link auth)

## Pages

### Public
- `/` — Landing page
- `/login` — Sign in

### Dashboard
- `/dashboard` — Site list overview
- `/dashboard/[siteId]` — Main analytics (visitors, pageviews, engagement, scroll depth)
- `/dashboard/[siteId]/pages` — Page-level analytics (views, avg time, scroll depth, bounce rate)
- `/dashboard/[siteId]/pages/[path]` — Single page deep-dive
- `/dashboard/[siteId]/sessions` — Session explorer (browse visitor journeys)
- `/dashboard/[siteId]/sessions/[sid]` — Session timeline (every event in order)
- `/dashboard/[siteId]/events` — Custom events overview
- `/dashboard/[siteId]/events/[name]` — Single event: trends, property breakdown
- `/dashboard/[siteId]/funnels` — Funnel list
- `/dashboard/[siteId]/funnels/new` — Create/edit funnel (visual step builder)
- `/dashboard/[siteId]/funnels/[fid]` — Funnel visualization (conversion bars + drop-off)
- `/dashboard/[siteId]/goals` — Goals overview
- `/dashboard/[siteId]/live` — Real-time visitors
- `/dashboard/[siteId]/sources` — Referrers + UTM breakdown
- `/dashboard/[siteId]/geo` — Map + country/region table
- `/dashboard/[siteId]/devices` — Browser, OS, device charts

### Settings
- `/dashboard/[siteId]/settings` — Site settings
- `/dashboard/[siteId]/settings/tracking` — Auto-track rule builder (CSS selector → event)
- `/settings` — Account settings
- `/settings/sites/new` — Add new site (generates script tag)

## Development

```bash
cd packages/dashboard
npm run dev       # Start on localhost:3000
npm run build     # Production build
npm run lint      # Lint with ESLint
```
