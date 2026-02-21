# Database & Schema Test Results

**Date:** 2026-02-21  
**Database:** PostgreSQL + TimescaleDB on 127.0.0.1:5432/openanalytics

## Migration Results

### 001_initial.sql — ✅ PASS
- All 7 tables created: `users`, `sites`, `events`, `auto_track_rules`, `funnels`, `funnel_steps`, `goals`
- TimescaleDB hypertable created on `events` (1 dimension, `time`)
- Compression policy set (3-day interval, segmentby `site_id`)
- Retention policy set (2 years)
- 5 custom indexes + auto-generated indexes all created
- Warnings about VARCHAR vs TEXT from TimescaleDB (non-blocking, cosmetic)

### 002_continuous_aggregates.sql — ✅ PASS (with fix)
- `page_stats_hourly` continuous aggregate created ✅
- `site_stats_daily` continuous aggregate created ✅
- **BUG FIXED:** `site_stats_daily` policy had `start_offset => INTERVAL '2 days'` which was too small (must cover ≥2 buckets). Changed to `INTERVAL '3 days'`.

## Verification

| Check | Status |
|-------|--------|
| 7 tables exist | ✅ |
| Hypertable on events | ✅ |
| 5 custom indexes on events | ✅ |
| GIN index on properties | ✅ |
| Unique constraints (email, public_id, funnel position) | ✅ |
| page_stats_hourly aggregate | ✅ |
| site_stats_daily aggregate | ✅ |

## INSERT Tests — All ✅

- users: INSERT works, UUID auto-generated
- sites: INSERT works, FK to users enforced
- events: INSERT works, hypertable routing functional
- auto_track_rules: INSERT works
- funnels + funnel_steps: INSERT works, unique position constraint works
- goals: INSERT works

## Funnel Query Test — ✅ PASS

Test data: 2 sessions, 3-step funnel (Landing → Pricing → Signup)
- Step 1 (Landing `/`): 2 sessions (100%)
- Step 2 (Pricing `/pricing`): 2 sessions (100%)
- Step 3 (Signup `/signup`): 1 session (50%)

Funnel drop-off correctly calculated.

## Summary

**All migrations pass. All tables, indexes, hypertables, and continuous aggregates verified. All INSERT operations successful. Funnel query pattern works correctly.**

One bug fixed: `002_continuous_aggregates.sql` daily policy window was too small.
