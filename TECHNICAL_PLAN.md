# Technical Plan

Internal architecture decisions and implementation notes.

## Design Principles

1. **Simplicity over features** — Ship fewer things that work perfectly.
2. **Privacy by architecture** — Don't collect data you'll need to protect.
3. **Performance matters** — The tracker must be invisible to site performance.
4. **Self-host friendly** — Everything runs with `docker compose up`.

## Tracker Script (`tracker/`)

The tracker is the most important piece. It must be:

- Under 1 KB gzipped (ideally under 800 bytes)
- Zero dependencies
- No cookies, no localStorage, no fingerprinting
- Non-blocking (Beacon API with `defer` loading)
- Works without JavaScript frameworks

### Core behavior

```javascript
(function() {
  var d = document, s = d.currentScript;
  var site = s.getAttribute('data-site');
  var endpoint = s.getAttribute('data-api') || (s.src.split('/oa.js')[0] + '/api/event');

  function send(type, props) {
    var payload = {
      s: site,                          // site ID
      t: type,                          // event type: 'pageview' | custom
      u: location.pathname,             // page path (no query strings)
      r: d.referrer,                    // referrer
      w: window.innerWidth,             // viewport width (for device type)
    };
    if (props) payload.p = props;
    navigator.sendBeacon(endpoint, JSON.stringify(payload));
  }

  // Track page view on load
  send('pageview');

  // Expose custom event API
  window.oa = { track: function(name, props) { send(name, props); } };

  // Track SPA navigation (History API)
  var pushState = history.pushState;
  history.pushState = function() {
    pushState.apply(history, arguments);
    send('pageview');
  };
  window.addEventListener('popstate', function() { send('pageview'); });
})();
```

### What the API extracts server-side

The tracker sends minimal data. The API enriches it:

| Client sends | API extracts |
|-------------|-------------|
| `site` | — |
| `pathname` | — |
| `referrer` | Referrer domain |
| `viewport width` | Device type (mobile/tablet/desktop) |
| — | Country, region (from anonymized IP via MaxMind GeoLite2) |
| — | Browser + OS (from User-Agent header, then discarded) |
| — | UTM params (parsed from referrer) |

The IP address and User-Agent header are **never stored**. They're used for geo-lookup and browser detection during ingestion, then thrown away.

## Ingestion API (`api/`)

### Stack

- **Fastify** — Handles high request volume with low overhead
- **PostgreSQL + TimescaleDB** — Time-series optimized storage
- **Redis** — Real-time counters and rate limiting
- **Zod** — Request validation

### Endpoints

```
POST /api/event              # Tracking endpoint (public, CORS enabled)
GET  /api/sites/:id/stats    # Aggregated analytics (authenticated)
GET  /api/sites/:id/live     # Real-time active visitors (WebSocket)
GET  /api/sites/:id/export   # CSV/JSON export (authenticated)
POST /api/sites              # Create site (authenticated)
```

### Processing pipeline

```
Request → Validate → Rate-limit check → GeoIP lookup → UA parse →
  → Write to PostgreSQL → Update Redis counters → Respond 202
```

The tracking endpoint always returns `202 Accepted` immediately. Processing is synchronous but fast (single INSERT, no heavy computation). At scale, we can add a queue (Redis Streams or similar) between ingestion and storage.

### Rate limiting

- Per-site: 100 events/second
- Per-IP: 30 events/minute (prevents abuse)
- Global: Circuit breaker at ingestion layer

## Database Schema

```sql
CREATE TABLE sites (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id),
    domain      VARCHAR(255) NOT NULL,
    name        VARCHAR(100),
    public_id   VARCHAR(12) UNIQUE NOT NULL,  -- the data-site value
    settings    JSONB DEFAULT '{}',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE pageviews (
    time        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    site_id     UUID NOT NULL REFERENCES sites(id),
    session_id  VARCHAR(32) NOT NULL,         -- daily rotating hash
    path        VARCHAR(500) NOT NULL,
    referrer    VARCHAR(500),
    country     CHAR(2),
    region      VARCHAR(100),
    device      VARCHAR(10),                  -- mobile | tablet | desktop
    browser     VARCHAR(30),
    os          VARCHAR(30),
    utm_source  VARCHAR(100),
    utm_medium  VARCHAR(100),
    utm_campaign VARCHAR(100),
    load_time   INTEGER                       -- milliseconds
);

-- TimescaleDB hypertable for fast time-range queries
SELECT create_hypertable('pageviews', 'time');

-- Compression policy: compress chunks older than 7 days
SELECT add_compression_policy('pageviews', INTERVAL '7 days');

-- Retention policy: drop raw data after 2 years
SELECT add_retention_policy('pageviews', INTERVAL '2 years');

CREATE TABLE events (
    time        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    site_id     UUID NOT NULL REFERENCES sites(id),
    session_id  VARCHAR(32) NOT NULL,
    name        VARCHAR(100) NOT NULL,
    properties  JSONB,
    value       DECIMAL(10,2)
);

SELECT create_hypertable('events', 'time');

CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       VARCHAR(255) UNIQUE NOT NULL,
    name        VARCHAR(100),
    plan        VARCHAR(20) DEFAULT 'free',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_pv_site_time ON pageviews (site_id, time DESC);
CREATE INDEX idx_pv_site_path ON pageviews (site_id, path);
CREATE INDEX idx_ev_site_time ON events (site_id, time DESC);
CREATE INDEX idx_ev_site_name ON events (site_id, name);
```

### Session handling

Sessions are derived, not stored. A session ID is generated as:

```
sha256(site_id + date + country + device + browser)[:32]
```

This gives us a daily-rotating, privacy-friendly session identifier. No cookies needed. Two visits from the same device type and country on the same day = same session. Not perfect, but good enough for analytics without invading privacy.

## Dashboard (`dashboard/`)

### Stack

- **Next.js 14** (App Router, server components where possible)
- **Tailwind CSS + shadcn/ui** for consistent design
- **Recharts** for charts and graphs
- **NextAuth.js** for authentication (GitHub + email magic link)

### Key pages

```
/                          # Landing page
/login                     # Authentication
/dashboard                 # Site list overview
/dashboard/[siteId]        # Main analytics view
/dashboard/[siteId]/events # Custom event tracking
/dashboard/[siteId]/live   # Real-time view
/settings                  # Account + site management
/settings/sites/new        # Add new site (generates script tag)
```

### Dashboard data flow

1. Dashboard makes authenticated requests to the API
2. API queries TimescaleDB with `time_bucket()` for aggregation
3. Real-time data comes through WebSocket from Redis pub/sub
4. Client renders with Recharts + server components for initial load

### Configurable flows (future)

The dashboard will support user-defined conversion flows:

```json
{
  "name": "Onboarding",
  "steps": [
    { "event": "pageview", "path": "/signup" },
    { "event": "signup_complete" },
    { "event": "pageview", "path": "/onboarding/step-1" },
    { "event": "onboarding_complete" }
  ]
}
```

This allows each user to define their own funnel based on their product's flow — whether it's a 3-step onboarding or a single-click signup. The dashboard visualizes drop-off between each step.

## Self-Hosting vs Hosted

Both use the exact same codebase. The hosted version at `openanalytics.dev` runs the same Docker setup with:

- Managed PostgreSQL (with automated backups)
- CDN for the tracking script
- Automatic updates

Self-hosters get the full experience. The hosted version is for people who don't want to manage infrastructure.

## Development Workflow

```bash
# Start everything locally
docker compose up -d          # PostgreSQL + Redis
npm install                   # Install dependencies
npm run dev                   # Start API + Dashboard in dev mode

# Run tests
npm run test                  # Unit + integration tests

# Build for production
npm run build                 # Build all packages
docker compose -f docker-compose.prod.yml up -d
```

## Implementation Order

1. **Tracker script** — Get the <1KB script working and tested
2. **Ingestion API** — Accept events, store in PostgreSQL
3. **Basic dashboard** — Visitors, pages, referrers over time
4. **Geographic + device data** — GeoIP integration, UA parsing
5. **Real-time view** — WebSocket-powered live visitor count
6. **Custom events** — `oa.track()` API
7. **User auth + site management** — Multi-site support
8. **Configurable funnels** — User-defined conversion flows

---

*Architecture: Claude Opus 4.6 (anthropic/claude-opus-4-6) — February 21, 2026*
