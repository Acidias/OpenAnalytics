# Technical Implementation Plan

## 🎯 Core Objectives

1. **Ultra-simple integration** - Single line of JavaScript
2. **Privacy-first approach** - No cookies, minimal data collection
3. **Real-time analytics** - Sub-second data processing
4. **Self-hostable + Managed** - Open source core with premium cloud option
5. **Developer-friendly** - Clean APIs, good docs, easy to extend

## 📦 Repository Structure

```
simple-analytics/
├── packages/
│   ├── tracker/          # Client-side tracking script
│   ├── dashboard/        # Next.js dashboard app
│   ├── api/             # Backend API service
│   └── shared/          # Shared utilities and types
├── docs/                # Documentation
├── examples/            # Integration examples
├── docker/              # Containerization
└── scripts/             # Build and deployment scripts
```

## 🔧 Technology Decisions

### Frontend (Dashboard)
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: Zustand (lightweight)
- **Charts**: Recharts or custom D3
- **Auth**: NextAuth.js

### Backend (API)
- **Runtime**: Node.js 20+
- **Framework**: Fastify (faster than Express)
- **Database**: PostgreSQL + TimescaleDB extension
- **ORM**: Prisma (type-safe, great DX)
- **Validation**: Zod
- **Auth**: JWT tokens

### Tracking Script
- **Language**: Vanilla JavaScript (no dependencies)
- **Size Target**: <2KB gzipped
- **Browser Support**: Modern browsers (ES6+)
- **Privacy**: No cookies, no localStorage
- **Method**: Beacon API for reliability

### Infrastructure
- **Containers**: Docker + Docker Compose
- **Database**: PostgreSQL with TimescaleDB
- **Caching**: Redis for session storage
- **CDN**: For tracking script delivery
- **Monitoring**: Built-in health checks

## 🗄 Database Design

### Core Tables

```sql
-- Sites configuration
CREATE TABLE sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    domain VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    tracking_id VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    settings JSONB DEFAULT '{}'
);

-- Visitor sessions
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id),
    session_hash VARCHAR(64) NOT NULL, -- Privacy-friendly session ID
    country CHAR(2),
    region VARCHAR(100),
    city VARCHAR(100),
    browser VARCHAR(50),
    os VARCHAR(50),
    device_type VARCHAR(20),
    referrer TEXT,
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    first_seen TIMESTAMPTZ DEFAULT NOW(),
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    page_views INTEGER DEFAULT 1
);

-- Page views tracking
CREATE TABLE page_views (
    id BIGSERIAL PRIMARY KEY,
    site_id UUID NOT NULL REFERENCES sites(id),
    session_id UUID NOT NULL REFERENCES sessions(id),
    page_path VARCHAR(500) NOT NULL,
    page_title VARCHAR(200),
    load_time INTEGER, -- milliseconds
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Custom events (premium feature)
CREATE TABLE events (
    id BIGSERIAL PRIMARY KEY,
    site_id UUID NOT NULL REFERENCES sites(id),
    session_id UUID NOT NULL REFERENCES sessions(id),
    event_name VARCHAR(100) NOT NULL,
    properties JSONB,
    value DECIMAL(10,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users and billing
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    plan VARCHAR(20) DEFAULT 'free',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Indexes for Performance

```sql
-- Query optimization indexes
CREATE INDEX idx_sessions_site_first_seen ON sessions(site_id, first_seen);
CREATE INDEX idx_page_views_site_created ON page_views(site_id, created_at);
CREATE INDEX idx_events_site_name_created ON events(site_id, event_name, created_at);

-- TimescaleDB hypertables for time-series data
SELECT create_hypertable('page_views', 'created_at');
SELECT create_hypertable('events', 'created_at');
```

## 🔌 API Design

### Core Endpoints

```typescript
// Tracking endpoint (public, no auth)
POST /track
Content-Type: application/json
{
  "site": "abc123",
  "page": "/dashboard",
  "referrer": "https://google.com",
  "screen": "1920x1080",
  "timestamp": 1708445123456
}

// Dashboard data (authenticated)
GET /api/sites/{siteId}/analytics?period=7d&tz=UTC
Response: {
  "visitors": { "current": 1234, "previous": 1100 },
  "pageviews": { "current": 4567, "previous": 4200 },
  "countries": [{"country": "US", "visitors": 500}],
  "pages": [{"path": "/", "views": 1200}],
  "referrers": [{"domain": "google.com", "visits": 300}]
}

// Site management (authenticated)
GET    /api/sites              # List user sites
POST   /api/sites              # Create new site
GET    /api/sites/{id}         # Get site details
PATCH  /api/sites/{id}         # Update site settings
DELETE /api/sites/{id}         # Delete site
```

### Authentication Flow

```typescript
// JWT-based authentication
interface UserToken {
  userId: string;
  email: string;
  plan: 'free' | 'premium' | 'enterprise';
  exp: number;
}

// Middleware validation
function requireAuth(request: FastifyRequest) {
  const token = request.headers.authorization?.split(' ')[1];
  const user = jwt.verify(token, process.env.JWT_SECRET);
  request.user = user;
}
```

## 📊 Real-time Processing

### Data Pipeline

```typescript
// Tracking data processor
class AnalyticsProcessor {
  async processPageView(data: TrackingData) {
    // 1. Validate and sanitize input
    const validated = trackingSchema.parse(data);
    
    // 2. Extract session info (privacy-friendly hash)
    const sessionHash = this.createSessionHash(validated);
    
    // 3. Upsert session record
    const session = await this.upsertSession(sessionHash, validated);
    
    // 4. Record page view
    await this.recordPageView(session.id, validated);
    
    // 5. Update real-time counters (Redis)
    await this.updateRealtimeStats(validated.site);
  }

  private createSessionHash(data: TrackingData): string {
    // Create privacy-friendly session identifier
    // No IP addresses or personal data
    const sessionData = `${data.screen}:${data.browser}:${data.timestamp}`;
    return crypto.createHash('sha256').update(sessionData).digest('hex');
  }
}
```

### Real-time Updates

```typescript
// WebSocket for live dashboard updates
class LiveAnalytics {
  private connections = new Map<string, WebSocket[]>();

  broadcastUpdate(siteId: string, update: AnalyticsUpdate) {
    const sockets = this.connections.get(siteId) || [];
    sockets.forEach(ws => {
      ws.send(JSON.stringify(update));
    });
  }
}
```

## 🚦 Privacy Implementation

### GDPR Compliance

```typescript
interface PrivacyConfig {
  ipAnonymization: boolean;     // Always true
  cookieConsent: boolean;       // Not needed (no cookies)
  dataRetention: number;        // Days to keep data
  rightToDelete: boolean;       // User data deletion
  dataExport: boolean;          // User data export
}

class PrivacyManager {
  anonymizeIP(ip: string): string {
    // Zero out last octet: 192.168.1.123 -> 192.168.1.0
    return ip.replace(/\.\d+$/, '.0');
  }

  async deleteUserData(siteId: string, sessionHash: string) {
    // Complete data removal on request
    await this.db.transaction(async (tx) => {
      await tx.events.deleteMany({ where: { sessionId: sessionHash } });
      await tx.pageViews.deleteMany({ where: { sessionId: sessionHash } });
      await tx.sessions.delete({ where: { sessionHash } });
    });
  }
}
```

### Minimal Data Collection

```javascript
// Client-side: Only collect essential data
const collectData = () => ({
  site: getSiteId(),
  page: location.pathname,
  referrer: document.referrer,
  screen: `${screen.width}x${screen.height}`,
  // NO: IP address, user agent, cookies, localStorage
  // NO: Fingerprinting, cross-site tracking
});
```

## 🎨 Dashboard Features

### Core Analytics Views

```typescript
// Dashboard components
interface DashboardData {
  overview: {
    visitors: { current: number; previous: number; change: number };
    pageviews: { current: number; previous: number; change: number };
    sessions: { current: number; previous: number; change: number };
    bounceRate: { current: number; previous: number; change: number };
  };
  
  charts: {
    visitorsOverTime: Array<{ date: string; visitors: number }>;
    topPages: Array<{ path: string; views: number; change: number }>;
    topCountries: Array<{ country: string; visitors: number }>;
    referrers: Array<{ source: string; visits: number }>;
  };
  
  realtime: {
    activeVisitors: number;
    activePages: Array<{ path: string; visitors: number }>;
  };
}
```

### Premium Features

```typescript
// Advanced segmentation (premium only)
interface AdvancedAnalytics {
  funnels: Array<{
    name: string;
    steps: Array<{ page: string; conversions: number }>;
  }>;
  
  cohorts: Array<{
    period: string;
    retention: Array<{ week: number; percentage: number }>;
  }>;
  
  customEvents: Array<{
    event: string;
    count: number;
    value: number;
  }>;
}
```

---

*Technical plan created by Claude Sonnet 4 on February 20, 2026*
*Implementation ready for development team*