# @openanalytics/shared

Shared TypeScript types, validation schemas, and utilities used across all packages.

## Contents

- **Event types** — TrackingEvent, PageviewEvent, PageleaveEvent, HeartbeatEvent, CustomEvent
- **Session types** — Session, SessionTimeline, SessionEvent
- **Analytics types** — PageStats, SiteOverview, ReferrerStats, GeoStats, DeviceStats
- **Funnel types** — Funnel, FunnelStep, FunnelAnalysis, FunnelConversion
- **Goal types** — Goal, GoalCompletion
- **Auto-track types** — AutoTrackRule, SiteConfig
- **API types** — AnalyticsQuery, DateRange, ApiResponse, PaginatedResponse
- **Zod schemas** — Request/response validation for all endpoints
- **Constants** — Device breakpoints, country codes, event name limits

## Usage

```typescript
import { TrackingEvent, Session, Funnel, AutoTrackRule } from '@openanalytics/shared';
import { trackingEventSchema, funnelSchema } from '@openanalytics/shared/schemas';
```
