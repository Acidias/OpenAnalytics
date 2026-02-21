-- 001_initial.sql — Full schema for OpenAnalytics
-- Requires: TimescaleDB extension

CREATE EXTENSION IF NOT EXISTS timescaledb;

-- ============================================
-- USERS & SITES
-- ============================================

CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       VARCHAR(255) UNIQUE NOT NULL,
    name        VARCHAR(100),
    plan        VARCHAR(20) DEFAULT 'free',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sites (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    domain      VARCHAR(255) NOT NULL,
    name        VARCHAR(100),
    public_id   VARCHAR(12) UNIQUE NOT NULL,
    settings    JSONB DEFAULT '{}',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CORE: UNIFIED EVENTS TABLE
-- ============================================

CREATE TABLE events (
    time        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    site_id     UUID NOT NULL,
    session_id  VARCHAR(50) NOT NULL,
    event       VARCHAR(100) NOT NULL,
    path        VARCHAR(500),
    referrer    VARCHAR(500),

    -- Behavioral (auto-tracked)
    duration_ms     INTEGER,
    scroll_max_pct  SMALLINT,
    engaged         BOOLEAN,

    -- Context (server-extracted)
    country     CHAR(2),
    region      VARCHAR(100),
    city        VARCHAR(100),
    device      VARCHAR(10),
    browser     VARCHAR(50),
    os          VARCHAR(50),

    -- UTM
    utm_source      VARCHAR(200),
    utm_medium      VARCHAR(200),
    utm_campaign    VARCHAR(200),
    utm_term        VARCHAR(200),
    utm_content     VARCHAR(200),

    -- Custom event data
    properties  JSONB,
    value       DECIMAL(12,4),

    -- Performance
    load_time_ms    INTEGER
);

-- TimescaleDB hypertable
SELECT create_hypertable('events', 'time', chunk_time_interval => INTERVAL '1 day');

-- Compression policy
ALTER TABLE events SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'site_id',
    timescaledb.compress_orderby = 'time DESC'
);
SELECT add_compression_policy('events', INTERVAL '3 days');

-- Retention policy
SELECT add_retention_policy('events', INTERVAL '2 years');

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_events_site_time ON events (site_id, time DESC);
CREATE INDEX idx_events_site_event ON events (site_id, event, time DESC);
CREATE INDEX idx_events_site_session ON events (site_id, session_id, time);
CREATE INDEX idx_events_site_path ON events (site_id, path, time DESC);
CREATE INDEX idx_events_properties ON events USING GIN (properties);

-- ============================================
-- DASHBOARD-CONFIGURED TRACKING
-- ============================================

CREATE TABLE auto_track_rules (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id     UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    name        VARCHAR(100) NOT NULL,
    event       VARCHAR(100) NOT NULL,
    selector    VARCHAR(500) NOT NULL,
    trigger     VARCHAR(20) DEFAULT 'click',
    capture_text    BOOLEAN DEFAULT false,
    capture_value   BOOLEAN DEFAULT false,
    properties  JSONB DEFAULT '{}',
    enabled     BOOLEAN DEFAULT true,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Funnel definitions
CREATE TABLE funnels (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id     UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    name        VARCHAR(200) NOT NULL,
    description TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE funnel_steps (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    funnel_id   UUID NOT NULL REFERENCES funnels(id) ON DELETE CASCADE,
    position    SMALLINT NOT NULL,
    name        VARCHAR(200) NOT NULL,
    match_type  VARCHAR(20) NOT NULL,
    match_path  VARCHAR(500),
    match_event VARCHAR(100),
    match_props JSONB,
    timeout_ms  INTEGER DEFAULT 1800000,
    UNIQUE(funnel_id, position)
);

-- Goal definitions
CREATE TABLE goals (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id     UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    name        VARCHAR(200) NOT NULL,
    match_type  VARCHAR(20) NOT NULL,
    match_path  VARCHAR(500),
    match_event VARCHAR(100),
    match_props JSONB,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
