# Technical Plan

Internal architecture decisions and implementation notes.

## Design Principles

1. **Rich by default** — Time on page, scroll depth, engagement all tracked out of the box
2. **Privacy by architecture** — No cookies, no fingerprinting, no PII stored
3. **Session-aware** — Every event tied to a visitor session for full journey tracking
4. **Dashboard-configurable** — Custom events and funnels defined in UI, pushed to tracker via `data-site` config
5. **Self-host friendly** — Everything runs with `docker compose up`

---

## Tracker Script (`tracker/`)

Target: **< 2KB gzipped** (richer than before, still tiny)

### Core behavior

```javascript
(function() {
  var d = document, w = window, s = d.currentScript;
  var site = s.getAttribute('data-site');
  var apiBase = s.getAttribute('data-api') || (s.src.split('/oa.js')[0] + '/api');
  var endpoint = apiBase + '/event';
  var configEndpoint = apiBase + '/config/' + site;

  // --- Session Management ---
  // Session ID: random ID stored in sessionStorage (survives page navigations, dies on tab close)
  // Visitor ID: daily rotating hash (no cookies, privacy-safe)
  var sessionId = sessionStorage.getItem('_oa_sid');
  if (!sessionId) {
    sessionId = Math.random().toString(36).substr(2, 12) + Date.now().toString(36);
    sessionStorage.setItem('_oa_sid', sessionId);
  }

  var pageEntryTime = Date.now();
  var maxScroll = 0;
  var engaged = false;       // true after 5s OR scroll OR click
  var engageTimer = null;
  var heartbeatInterval = null;
  var siteConfig = null;     // loaded from dashboard config

  // --- Helpers ---
  function send(type, props) {
    var payload = {
      s: site,
      sid: sessionId,
      t: type,
      u: location.pathname + location.search,
      r: d.referrer || null,
      w: w.innerWidth,
      ts: Date.now()
    };
    if (props) payload.p = props;
    if (navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, JSON.stringify(payload));
    } else {
      var xhr = new XMLHttpRequest();
      xhr.open('POST', endpoint, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify(payload));
    }
  }

  // --- Default Tracking: Scroll Depth ---
  function getScrollPercent() {
    var h = d.documentElement;
    var body = d.body;
    var scrollTop = w.pageYOffset || h.scrollTop || body.scrollTop;
    var scrollHeight = Math.max(h.scrollHeight, body.scrollHeight);
    var clientHeight = h.clientHeight;
    if (scrollHeight <= clientHeight) return 100;
    return Math.round((scrollTop / (scrollHeight - clientHeight)) * 100);
  }

  w.addEventListener('scroll', function() {
    var pct = getScrollPercent();
    if (pct > maxScroll) maxScroll = pct;
    if (!engaged) { engaged = true; }
  }, { passive: true });

  // --- Default Tracking: Engagement Detection ---
  function markEngaged() {
    if (!engaged) {
      engaged = true;
      send('engage', { after_ms: Date.now() - pageEntryTime });
    }
  }

  // Engaged after 5 seconds on page
  engageTimer = setTimeout(markEngaged, 5000);

  // Or on first click/keypress
  d.addEventListener('click', markEngaged, { once: true });
  d.addEventListener('keydown', markEngaged, { once: true });

  // --- Default Tracking: Time on Page (heartbeat) ---
  // Send heartbeat every 30s while tab is visible
  // This gives us accurate time-on-page even without unload events
  var lastHeartbeat = Date.now();
  heartbeatInterval = setInterval(function() {
    if (!d.hidden) {
      send('heartbeat', { 
        duration_ms: Date.now() - pageEntryTime,
        scroll_pct: maxScroll,
        engaged: engaged
      });
      lastHeartbeat = Date.now();
    }
  }, 30000);

  // --- Default Tracking: Page Leave ---
  function onLeave() {
    var timeOnPage = Date.now() - pageEntryTime;
    send('pageleave', {
      duration_ms: timeOnPage,
      scroll_max_pct: maxScroll,
      engaged: engaged
    });
  }

  // Use both visibilitychange and pagehide for reliability
  d.addEventListener('visibilitychange', function() {
    if (d.visibilityState === 'hidden') onLeave();
  });
  w.addEventListener('pagehide', onLeave);

  // --- Default Tracking: Outbound Link Clicks ---
  d.addEventListener('click', function(e) {
    var link = e.target.closest('a');
    if (!link) return;
    var href = link.href;
    if (!href) return;
    try {
      var url = new URL(href);
      if (url.hostname !== location.hostname) {
        send('outbound_click', { url: href, text: (link.innerText || '').substring(0, 100) });
      }
    } catch(err) {}
  });

  // --- Default Tracking: Page View ---
  send('pageview');

  // --- SPA Navigation ---
  var pushState = history.pushState;
  history.pushState = function() {
    // Send leave for current page
    onLeave();
    pushState.apply(history, arguments);
    // Reset for new page
    pageEntryTime = Date.now();
    maxScroll = 0;
    engaged = false;
    send('pageview');
  };
  w.addEventListener('popstate', function() {
    onLeave();
    pageEntryTime = Date.now();
    maxScroll = 0;
    engaged = false;
    send('pageview');
  });

  // --- Custom Events API ---
  w.oa = {
    track: function(name, props) { send(name, props); },
    identify: function(traits) { send('identify', traits); }  // anonymous traits only
  };

  // --- Dashboard-Configured Auto-Track ---
  // Fetch site config (cached by CDN, ~1 req/hour)
  // Config contains: auto-track selectors, custom event bindings, funnel definitions
  function loadConfig() {
    fetch(configEndpoint)
      .then(function(r) { return r.json(); })
      .then(function(cfg) {
        siteConfig = cfg;
        if (cfg.autoTrack) applyAutoTrack(cfg.autoTrack);
      })
      .catch(function() {}); // fail silently
  }

  function applyAutoTrack(rules) {
    // rules = [{ selector: '.cta-btn', event: 'cta_click', props: { step: '1' } }, ...]
    rules.forEach(function(rule) {
      var els = d.querySelectorAll(rule.selector);
      els.forEach(function(el) {
        el.addEventListener(rule.trigger || 'click', function() {
          var props = Object.assign({}, rule.props || {});
          // Auto-capture element text if configured
          if (rule.captureText) props.text = (el.innerText || '').substring(0, 200);
          if (rule.captureValue) props.value = el.value;
          send(rule.event, props);
        });
      });
    });
  }

  // Load config after page load (non-blocking)
  if (d.readyState === 'complete') loadConfig();
  else w.addEventListener('load', loadConfig);

})();
```

### What the tracker sends by default (zero config)

| Event | When | Data |
|-------|------|------|
| `pageview` | Page load / SPA nav | path, referrer, viewport |
| `engage` | After 5s or first interaction | time to engage |
| `heartbeat` | Every 30s while visible | duration, scroll %, engaged |
| `pageleave` | Tab hidden / navigate away | total duration, max scroll %, engaged |
| `outbound_click` | External link clicked | URL, link text |

### What the API extracts server-side

| Client sends | API extracts |
|-------------|-------------|
| Session ID | → ties all events to one visit |
| Pathname + search | → page path |
| Referrer | → referrer domain, UTM params |
| Viewport width | → device type |
| Timestamp | → timezone estimation |
| — | Country, region (anonymized IP → GeoLite2, IP discarded) |
| — | Browser + OS (User-Agent parsed, UA discarded) |

---

## Database Schema

```sql
-- ============================================
-- USERS & SITES
-- ============================================

CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       VARCHAR(255) UNIQUE NOT NULL,
    name        VARCHAR(100),
    plan        VARCHAR(20) DEFAULT 'free',   -- free | pro | enterprise
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sites (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    domain      VARCHAR(255) NOT NULL,
    name        VARCHAR(100),
    public_id   VARCHAR(12) UNIQUE NOT NULL,  -- the data-site value
    settings    JSONB DEFAULT '{}',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CORE: UNIFIED EVENTS TABLE
-- ============================================
-- All tracking data goes into ONE hypertable.
-- Event types: pageview, pageleave, engage, heartbeat, outbound_click, + custom events
-- This is simpler to query and scale than separate tables.

CREATE TABLE events (
    time        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    site_id     UUID NOT NULL,
    session_id  VARCHAR(50) NOT NULL,
    event       VARCHAR(100) NOT NULL,          -- 'pageview', 'pageleave', 'signup', etc
    path        VARCHAR(500),
    referrer    VARCHAR(500),
    
    -- Behavioral (auto-tracked)
    duration_ms     INTEGER,                    -- time on page
    scroll_max_pct  SMALLINT,                   -- max scroll depth (0-100)
    engaged         BOOLEAN,                    -- was visitor engaged?
    
    -- Context (server-extracted)
    country     CHAR(2),
    region      VARCHAR(100),
    city        VARCHAR(100),
    device      VARCHAR(10),                    -- mobile | tablet | desktop
    browser     VARCHAR(50),
    os          VARCHAR(50),
    
    -- UTM
    utm_source      VARCHAR(200),
    utm_medium      VARCHAR(200),
    utm_campaign    VARCHAR(200),
    utm_term        VARCHAR(200),
    utm_content     VARCHAR(200),
    
    -- Custom event data
    properties  JSONB,                          -- arbitrary key-value pairs
    value       DECIMAL(12,4),                  -- numeric value (revenue, score, etc)
    
    -- Performance
    load_time_ms    INTEGER                     -- page load time (Performance API)
);

-- TimescaleDB hypertable partitioned by time
SELECT create_hypertable('events', 'time', chunk_time_interval => INTERVAL '1 day');

-- Compression: compress after 3 days (keeps recent data fast, old data small)
ALTER TABLE events SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'site_id',
    timescaledb.compress_orderby = 'time DESC'
);
SELECT add_compression_policy('events', INTERVAL '3 days');

-- Retention: drop raw data after 2 years
SELECT add_retention_policy('events', INTERVAL '2 years');

-- ============================================
-- MATERIALIZED VIEWS (Continuous Aggregates)
-- ============================================
-- Pre-computed rollups for fast dashboard queries

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

-- ============================================
-- SESSIONS (derived, not stored by tracker)
-- ============================================
-- Materialized view that reconstructs sessions from events

CREATE MATERIALIZED VIEW sessions_derived AS
SELECT
    site_id,
    session_id,
    MIN(time) AS started_at,
    MAX(time) AS ended_at,
    EXTRACT(EPOCH FROM (MAX(time) - MIN(time))) * 1000 AS duration_ms,
    COUNT(*) FILTER (WHERE event = 'pageview') AS page_count,
    ARRAY_AGG(DISTINCT path ORDER BY path) FILTER (WHERE event = 'pageview') AS pages_visited,
    (ARRAY_AGG(path ORDER BY time ASC) FILTER (WHERE event = 'pageview'))[1] AS entry_page,
    (ARRAY_AGG(path ORDER BY time DESC) FILTER (WHERE event = 'pageview'))[1] AS exit_page,
    (ARRAY_AGG(referrer ORDER BY time ASC) FILTER (WHERE referrer IS NOT NULL))[1] AS referrer,
    (ARRAY_AGG(country ORDER BY time ASC) FILTER (WHERE country IS NOT NULL))[1] AS country,
    (ARRAY_AGG(device ORDER BY time ASC) FILTER (WHERE device IS NOT NULL))[1] AS device,
    (ARRAY_AGG(browser ORDER BY time ASC) FILTER (WHERE browser IS NOT NULL))[1] AS browser,
    (ARRAY_AGG(utm_source ORDER BY time ASC) FILTER (WHERE utm_source IS NOT NULL))[1] AS utm_source,
    BOOL_OR(engaged) AS was_engaged,
    MAX(scroll_max_pct) AS max_scroll_pct
FROM events
GROUP BY site_id, session_id;

-- Refresh periodically (every 5 minutes via cron or TimescaleDB job)

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_events_site_time ON events (site_id, time DESC);
CREATE INDEX idx_events_site_event ON events (site_id, event, time DESC);
CREATE INDEX idx_events_site_session ON events (site_id, session_id, time);
CREATE INDEX idx_events_site_path ON events (site_id, path, time DESC);
CREATE INDEX idx_events_properties ON events USING GIN (properties);  -- for custom event queries

-- ============================================
-- DASHBOARD-CONFIGURED TRACKING
-- ============================================

-- Auto-track rules (pushed to tracker via config endpoint)
CREATE TABLE auto_track_rules (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id     UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    name        VARCHAR(100) NOT NULL,          -- human label
    event       VARCHAR(100) NOT NULL,          -- event name to fire
    selector    VARCHAR(500) NOT NULL,          -- CSS selector
    trigger     VARCHAR(20) DEFAULT 'click',    -- click | submit | change | focus
    capture_text    BOOLEAN DEFAULT false,
    capture_value   BOOLEAN DEFAULT false,
    properties  JSONB DEFAULT '{}',             -- static props to include
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
    position    SMALLINT NOT NULL,              -- step order (1, 2, 3...)
    name        VARCHAR(200) NOT NULL,          -- "Sign Up Page", "Complete Profile"
    match_type  VARCHAR(20) NOT NULL,           -- 'pageview' | 'event'
    match_path  VARCHAR(500),                   -- for pageview: /signup
    match_event VARCHAR(100),                   -- for event: signup_complete
    match_props JSONB,                          -- optional: { "step": "2" }
    timeout_ms  INTEGER DEFAULT 1800000,        -- max time to next step (default 30min)
    UNIQUE(funnel_id, position)
);

-- Goal definitions (simpler than funnels — single conversion event)
CREATE TABLE goals (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id     UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    name        VARCHAR(200) NOT NULL,
    match_type  VARCHAR(20) NOT NULL,           -- 'pageview' | 'event'
    match_path  VARCHAR(500),
    match_event VARCHAR(100),
    match_props JSONB,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Ingestion API (`api/`)

### Stack

- **Fastify** — High throughput, low overhead
- **PostgreSQL + TimescaleDB** — Time-series optimized
- **Redis** — Real-time counters, rate limiting, pub/sub for live view
- **Zod** — Request validation
- **MaxMind GeoLite2** — IP → country/region (IP never stored)
- **ua-parser-js** — User-Agent → browser/OS (UA never stored)

### Endpoints

```
# Tracking (public, CORS)
POST   /api/event                       # Ingest tracking event
GET    /api/config/:sitePublicId        # Site config for tracker (auto-track rules, cached)

# Analytics (authenticated)
GET    /api/sites/:id/overview          # Main dashboard stats
GET    /api/sites/:id/pages             # Page-level analytics (views, duration, scroll, engagement)
GET    /api/sites/:id/sessions          # Session list with journey details
GET    /api/sites/:id/sessions/:sid     # Single session replay (event timeline)
GET    /api/sites/:id/referrers         # Traffic sources
GET    /api/sites/:id/geo               # Geographic breakdown
GET    /api/sites/:id/devices           # Browser, OS, device type
GET    /api/sites/:id/events            # Custom event analytics
GET    /api/sites/:id/events/:name      # Single event details + property breakdowns
GET    /api/sites/:id/live              # Real-time (WebSocket)
GET    /api/sites/:id/funnels/:fid      # Funnel analysis with conversion rates
GET    /api/sites/:id/goals             # Goal completion rates
GET    /api/sites/:id/export            # CSV/JSON export

# Site Management (authenticated)
POST   /api/sites                       # Create site
PATCH  /api/sites/:id                   # Update site settings
DELETE /api/sites/:id                   # Delete site

# Auto-Track Rules (authenticated) 
GET    /api/sites/:id/rules             # List auto-track rules
POST   /api/sites/:id/rules             # Create rule
PATCH  /api/sites/:id/rules/:rid        # Update rule
DELETE /api/sites/:id/rules/:rid        # Delete rule

# Funnels (authenticated)
GET    /api/sites/:id/funnels           # List funnels
POST   /api/sites/:id/funnels           # Create funnel with steps
PATCH  /api/sites/:id/funnels/:fid      # Update funnel
DELETE /api/sites/:id/funnels/:fid      # Delete funnel

# Goals (authenticated)
GET    /api/sites/:id/goals             # List goals
POST   /api/sites/:id/goals             # Create goal
DELETE /api/sites/:id/goals/:gid        # Delete goal
```

### Config endpoint (serves tracker configuration)

```json
// GET /api/config/abc123xyz
// Cached by CDN for 5 minutes
{
  "autoTrack": [
    {
      "selector": ".onboarding-next",
      "event": "onboarding_step",
      "trigger": "click",
      "captureText": true,
      "props": { "flow": "signup" }
    },
    {
      "selector": "#purchase-btn",
      "event": "purchase_click",
      "trigger": "click"
    }
  ]
}
```

### Processing pipeline

```
Request → Validate (Zod) → Rate-limit (Redis) 
  → GeoIP lookup (MaxMind, IP discarded)
  → UA parse (ua-parser, header discarded)
  → INSERT events table
  → Publish to Redis (live view subscribers)
  → Update Redis counters (real-time stats)
  → Return 202 Accepted
```

### Rate limiting

- Per-site: 200 events/second (higher because of heartbeats)
- Per-IP: 60 events/minute
- Heartbeat deduplication: max 1 heartbeat per session per 25s

### Scale path

1. **Phase 1** (< 1M events/day): Single Fastify + PostgreSQL
2. **Phase 2** (1-10M/day): Add Redis Streams as buffer, batch inserts
3. **Phase 3** (10M+/day): Kafka/Redpanda → batch writer → TimescaleDB
4. **Phase 4** (100M+/day): ClickHouse instead of TimescaleDB

---

## Funnel Analysis Engine

The funnel query is the most complex part. Here's how it works:

```sql
-- Example: 3-step onboarding funnel
-- Step 1: Visit /signup
-- Step 2: Event 'signup_complete'  
-- Step 3: Visit /onboarding/step-1
-- Step 4: Event 'onboarding_done'

WITH step1 AS (
    SELECT DISTINCT session_id, MIN(time) AS step_time
    FROM events
    WHERE site_id = $1 AND event = 'pageview' AND path = '/signup'
      AND time BETWEEN $2 AND $3
    GROUP BY session_id
),
step2 AS (
    SELECT DISTINCT s1.session_id, MIN(e.time) AS step_time
    FROM step1 s1
    JOIN events e ON e.session_id = s1.session_id
        AND e.site_id = $1
        AND e.event = 'signup_complete'
        AND e.time > s1.step_time
        AND e.time < s1.step_time + INTERVAL '30 minutes'  -- timeout
    GROUP BY s1.session_id
),
step3 AS (
    SELECT DISTINCT s2.session_id, MIN(e.time) AS step_time
    FROM step2 s2
    JOIN events e ON e.session_id = s2.session_id
        AND e.site_id = $1
        AND e.event = 'pageview'
        AND e.path = '/onboarding/step-1'
        AND e.time > s2.step_time
        AND e.time < s2.step_time + INTERVAL '30 minutes'
    GROUP BY s2.session_id
)
SELECT
    (SELECT COUNT(*) FROM step1) AS step1_count,
    (SELECT COUNT(*) FROM step2) AS step2_count,
    (SELECT COUNT(*) FROM step3) AS step3_count,
    -- Conversion rates
    ROUND((SELECT COUNT(*) FROM step2)::numeric / NULLIF((SELECT COUNT(*) FROM step1), 0) * 100, 1) AS step1_to_2_pct,
    ROUND((SELECT COUNT(*) FROM step3)::numeric / NULLIF((SELECT COUNT(*) FROM step2), 0) * 100, 1) AS step2_to_3_pct,
    -- Overall
    ROUND((SELECT COUNT(*) FROM step3)::numeric / NULLIF((SELECT COUNT(*) FROM step1), 0) * 100, 1) AS overall_conversion_pct,
    -- Avg time between steps
    (SELECT AVG(EXTRACT(EPOCH FROM (s2.step_time - s1.step_time))) FROM step1 s1 JOIN step2 s2 ON s1.session_id = s2.session_id) AS avg_step1_to_2_seconds,
    (SELECT AVG(EXTRACT(EPOCH FROM (s3.step_time - s2.step_time))) FROM step2 s2 JOIN step3 s3 ON s2.session_id = s3.session_id) AS avg_step2_to_3_seconds;
```

This query is dynamically generated based on the funnel definition. The API builds the CTEs from `funnel_steps` rows.

---

## Dashboard (`dashboard/`)

### Stack

- **Next.js 14** (App Router, RSC for initial load)
- **Tailwind CSS + shadcn/ui**
- **Recharts** for charts
- **NextAuth.js** (GitHub + email magic link)

### Pages

```
/                                       # Landing page
/login                                  # Auth
/dashboard                              # Site list
/dashboard/[siteId]                     # Overview (visitors, pageviews, engagement)
/dashboard/[siteId]/pages               # Page analytics (views, avg time, scroll depth, bounce)
/dashboard/[siteId]/pages/[path]        # Single page deep-dive
/dashboard/[siteId]/sessions            # Session explorer (list of visitor journeys)
/dashboard/[siteId]/sessions/[sid]      # Session timeline (every event in order)
/dashboard/[siteId]/events              # Custom events overview
/dashboard/[siteId]/events/[name]       # Single event: trends, property breakdown
/dashboard/[siteId]/funnels             # Funnel list
/dashboard/[siteId]/funnels/new         # Create/edit funnel (visual step builder)
/dashboard/[siteId]/funnels/[fid]       # Funnel visualization (conversion bars)
/dashboard/[siteId]/goals               # Goals overview
/dashboard/[siteId]/live                # Real-time view
/dashboard/[siteId]/sources             # Referrers + UTM breakdown
/dashboard/[siteId]/geo                 # Map + country/region table
/dashboard/[siteId]/devices             # Browser, OS, device charts
/dashboard/[siteId]/settings            # Site settings
/dashboard/[siteId]/settings/tracking   # Auto-track rule builder (CSS selector → event)
/settings                               # Account settings
/settings/sites/new                     # Add site
```

### Key Dashboard Features

**Overview Page** — At a glance:
- Visitors (unique sessions), Pageviews, Avg time on page, Bounce rate, Avg scroll depth
- Engagement rate (% of sessions with >5s or interaction)
- Top pages, top referrers, top countries
- Trend charts (selectable: 24h / 7d / 30d / custom range)

**Page Analytics** — Per-page drill-down:
- Views, unique visitors, avg duration, avg scroll %, engagement rate
- Entry/exit rate for each page
- Heatmap of scroll depth distribution (10%, 25%, 50%, 75%, 100%)

**Session Explorer** — Browse individual visitor journeys:
- List: entry page → page count → duration → country → device
- Click into a session: full event timeline
  - `10:32:01` Pageview `/` (referrer: google.com)
  - `10:32:06` Engaged (after 5s)
  - `10:32:45` Pageleave `/` (duration: 44s, scroll: 78%)
  - `10:32:45` Pageview `/pricing`
  - `10:33:12` Custom event `pricing_toggle` { plan: "pro" }
  - `10:33:30` Pageleave `/pricing` (duration: 45s, scroll: 100%)
  - `10:33:31` Pageview `/signup`
  - `10:34:02` Custom event `signup_complete`

**Auto-Track Rule Builder** — No code needed:
- User enters CSS selector (e.g., `.cta-button`, `#checkout-form`)
- Picks trigger: click / submit / change / focus
- Names the event (e.g., `cta_click`, `checkout_start`)
- Optionally adds static properties
- Rule saved → pushed to tracker via config endpoint
- Preview: "This selector matches 3 elements on your-site.com/pricing"

**Funnel Builder** — Visual drag-and-drop:
- Add steps: pageview (path match) or custom event (name + optional props)
- Set timeout between steps (default 30min)
- See conversion visualization: horizontal bars showing drop-off
- Per-step metrics: count, conversion rate, avg time to next step

---

## Session Handling — Privacy-First

**How it works (no cookies, no fingerprinting):**

1. Tracker generates random `session_id` on first pageview, stores in `sessionStorage`
2. `sessionStorage` persists across page navigations within the same tab
3. New tab / new browser = new session (that's fine for analytics)
4. Sessions automatically expire when tab closes

**Why this is better than cookie-based:**
- No cookie banner needed
- No cross-site tracking possible
- Sessions are accurate within a single visit
- "Returning visitors" tracked via daily aggregates, not individual re-identification

**Session reconstruction on server:**
- All events with same `session_id` + `site_id` = one session
- Entry page = first pageview event
- Exit page = last pageview event
- Duration = last event time - first event time
- Pages visited = distinct paths from pageview events
- Engaged = any `pageleave` event with `engaged = true`

---

## Implementation Order

### Phase 1: Core (MVP)
1. **Tracker script** — pageview, pageleave, scroll depth, time on page, engagement
2. **Ingestion API** — validate, enrich (geo, device), store in events table
3. **Basic dashboard** — overview, pages, sources, geo, devices
4. **Auth + site management** — create site, get script tag

### Phase 2: Sessions & Events
5. **Session explorer** — list sessions, session timeline view
6. **Custom events** — `oa.track()` in dashboard with property breakdowns
7. **Real-time view** — WebSocket-powered live visitors + current pages

### Phase 3: Funnels & Intelligence
8. **Auto-track rules** — dashboard rule builder → config endpoint → tracker
9. **Funnel builder** — visual funnel creation + conversion analysis
10. **Goals** — simple conversion tracking with alerts
11. **Export** — CSV/JSON for all data views

### Phase 4: Scale & Polish
12. **Continuous aggregates** — materialized views for fast queries at scale
13. **Email reports** — weekly digest sent to site owner
14. **Team access** — invite team members to view dashboard
15. **REST API** — programmatic access to all analytics data
16. **Mobile SDKs** — React Native, Flutter

---

## Cost Estimation (Hosted)

| Scale | Events/month | Storage | Infra cost | Price point |
|-------|-------------|---------|------------|-------------|
| Free | < 10K | ~50MB | Negligible | Free |
| Starter | 10K - 100K | ~500MB | ~$5/mo | $9/mo |
| Pro | 100K - 1M | ~5GB | ~$20/mo | $19/mo |
| Business | 1M - 10M | ~50GB | ~$80/mo | $49/mo |

Events per pageview are higher now (~3-4 events per page: view, heartbeats, leave) — pricing based on pageview equivalents, not raw events.

---

*Architecture: Claude Opus 4.6 (anthropic/claude-opus-4-6) — February 21, 2026*
*Updated: Enhanced with behavioral tracking, session management, dashboard-configurable funnels*
