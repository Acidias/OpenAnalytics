# @openanalytics/api

Event ingestion and analytics query API.

## Stack

- Fastify (high-throughput HTTP)
- PostgreSQL + TimescaleDB (time-series storage)
- Redis (real-time counters, rate limiting)
- Zod (validation)
- Prisma (database access)

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/event` | No | Tracking endpoint (CORS enabled) |
| `GET` | `/api/sites/:id/stats` | Yes | Aggregated analytics data |
| `GET` | `/api/sites/:id/live` | Yes | WebSocket real-time visitors |
| `GET` | `/api/sites/:id/export` | Yes | CSV/JSON data export |
| `POST` | `/api/sites` | Yes | Create new site |
| `PATCH` | `/api/sites/:id` | Yes | Update site settings |
| `DELETE` | `/api/sites/:id` | Yes | Delete site and data |

## Development

```bash
cd packages/api
cp .env.example .env
npm run dev       # Start with hot reload
npm run test      # Run tests
npm run migrate   # Run database migrations
```
