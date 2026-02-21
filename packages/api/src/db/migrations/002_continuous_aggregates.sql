-- 002_continuous_aggregates.sql — Materialized views for fast dashboard queries

-- Hourly page stats
CREATE MATERIALIZED VIEW page_stats_hourly
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 hour', time) AS bucket,
    site_id,
    path,
    COUNT(*) FILTER (WHERE event = 'pageview') AS views,
    COUNT(DISTINCT session_id) FILTER (WHERE event = 'pageview') AS unique_visitors,
    AVG(duration_ms) FILTER (WHERE event = 'pageleave') AS avg_duration_ms,
    AVG(scroll_max_pct) FILTER (WHERE event = 'pageleave') AS avg_scroll_pct,
    COUNT(*) FILTER (WHERE event = 'pageleave' AND engaged = true) AS engaged_count,
    COUNT(*) FILTER (WHERE event = 'pageleave') AS total_leaves
FROM events
GROUP BY bucket, site_id, path
WITH NO DATA;

SELECT add_continuous_aggregate_policy('page_stats_hourly',
    start_offset => INTERVAL '3 hours',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour');

-- Daily site stats
CREATE MATERIALIZED VIEW site_stats_daily
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 day', time) AS bucket,
    site_id,
    COUNT(*) FILTER (WHERE event = 'pageview') AS pageviews,
    COUNT(DISTINCT session_id) AS unique_sessions,
    AVG(duration_ms) FILTER (WHERE event = 'pageleave') AS avg_session_duration_ms,
    AVG(scroll_max_pct) FILTER (WHERE event = 'pageleave') AS avg_scroll_pct
FROM events
GROUP BY bucket, site_id
WITH NO DATA;

SELECT add_continuous_aggregate_policy('site_stats_daily',
    start_offset => INTERVAL '2 days',
    end_offset => INTERVAL '1 day',
    schedule_interval => INTERVAL '1 day');
