import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { query } from '../db/connection';
import { redisSub } from '../db/redis';
import { authMiddleware, verifySiteAccess } from '../middleware/auth';

const dateRangeSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  period: z.enum(['24h', '7d', '30d', '90d', '12m']).optional().default('30d'),
});

function getDateRange(q: Record<string, unknown>): { from: Date; to: Date } {
  const parsed = dateRangeSchema.parse(q);
  const to = parsed.to ? new Date(parsed.to) : new Date();
  let from: Date;
  if (parsed.from) {
    from = new Date(parsed.from);
  } else {
    from = new Date(to);
    const periods: Record<string, number> = { '24h': 1, '7d': 7, '30d': 30, '90d': 90, '12m': 365 };
    from.setDate(from.getDate() - (periods[parsed.period] || 30));
  }
  return { from, to };
}

export default async function analyticsRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authMiddleware);
  fastify.addHook('preHandler', verifySiteAccess);

  // Overview
  fastify.get<{ Params: { id: string }; Querystring: Record<string, unknown> }>('/api/sites/:id/overview', async (request) => {
    const { id } = request.params;
    const { from, to } = getDateRange(request.query as Record<string, unknown>);

    const [stats, topPages, topReferrers, topCountries] = await Promise.all([
      query(
        `SELECT
           COUNT(*) FILTER (WHERE event = 'pageview') AS pageviews,
           COUNT(DISTINCT session_id) AS unique_sessions,
           AVG(duration_ms) FILTER (WHERE event = 'pageleave') AS avg_duration_ms,
           AVG(scroll_max_pct) FILTER (WHERE event = 'pageleave') AS avg_scroll_pct,
           COUNT(*) FILTER (WHERE event = 'pageleave' AND engaged = true)::float /
             NULLIF(COUNT(*) FILTER (WHERE event = 'pageleave'), 0) AS engagement_rate
         FROM events WHERE site_id = $1 AND time BETWEEN $2 AND $3`,
        [id, from, to]
      ),
      query(
        `SELECT path, COUNT(*) AS views, COUNT(DISTINCT session_id) AS visitors
         FROM events WHERE site_id = $1 AND event = 'pageview' AND time BETWEEN $2 AND $3
         GROUP BY path ORDER BY views DESC LIMIT 10`,
        [id, from, to]
      ),
      query(
        `SELECT referrer, COUNT(*) AS count
         FROM events WHERE site_id = $1 AND event = 'pageview' AND referrer IS NOT NULL AND time BETWEEN $2 AND $3
         GROUP BY referrer ORDER BY count DESC LIMIT 10`,
        [id, from, to]
      ),
      query(
        `SELECT country, COUNT(DISTINCT session_id) AS visitors
         FROM events WHERE site_id = $1 AND event = 'pageview' AND country IS NOT NULL AND time BETWEEN $2 AND $3
         GROUP BY country ORDER BY visitors DESC LIMIT 10`,
        [id, from, to]
      ),
    ]);

    return {
      ...stats.rows[0],
      topPages: topPages.rows,
      topReferrers: topReferrers.rows,
      topCountries: topCountries.rows,
    };
  });

  // Pages
  fastify.get<{ Params: { id: string }; Querystring: Record<string, unknown> }>('/api/sites/:id/pages', async (request) => {
    const { id } = request.params;
    const { from, to } = getDateRange(request.query as Record<string, unknown>);

    const result = await query(
      `SELECT path,
              COUNT(*) FILTER (WHERE event = 'pageview') AS views,
              COUNT(DISTINCT session_id) FILTER (WHERE event = 'pageview') AS unique_visitors,
              AVG(duration_ms) FILTER (WHERE event = 'pageleave') AS avg_duration_ms,
              AVG(scroll_max_pct) FILTER (WHERE event = 'pageleave') AS avg_scroll_pct,
              CASE WHEN COUNT(*) FILTER (WHERE event = 'pageleave') > 0
                   THEN COUNT(*) FILTER (WHERE event = 'pageleave' AND engaged = true)::float /
                        COUNT(*) FILTER (WHERE event = 'pageleave')
                   ELSE 0 END AS engagement_rate
       FROM events
       WHERE site_id = $1 AND time BETWEEN $2 AND $3
       GROUP BY path
       ORDER BY views DESC`,
      [id, from, to]
    );
    return { pages: result.rows };
  });

  // Sessions list
  fastify.get<{ Params: { id: string }; Querystring: Record<string, unknown> }>('/api/sites/:id/sessions', async (request) => {
    const { id } = request.params;
    const { from, to } = getDateRange(request.query as Record<string, unknown>);
    const limit = Math.min(parseInt((request.query as Record<string, string>).limit || '50', 10), 200);
    const offset = parseInt((request.query as Record<string, string>).offset || '0', 10);

    const result = await query(
      `SELECT session_id,
              MIN(time) AS started_at,
              MAX(time) AS ended_at,
              COUNT(*) FILTER (WHERE event = 'pageview') AS page_count,
              (ARRAY_AGG(path ORDER BY time ASC) FILTER (WHERE event = 'pageview'))[1] AS entry_page,
              (ARRAY_AGG(path ORDER BY time DESC) FILTER (WHERE event = 'pageview'))[1] AS exit_page,
              (ARRAY_AGG(referrer ORDER BY time ASC) FILTER (WHERE referrer IS NOT NULL))[1] AS referrer,
              (ARRAY_AGG(country ORDER BY time ASC) FILTER (WHERE country IS NOT NULL))[1] AS country,
              (ARRAY_AGG(device ORDER BY time ASC) FILTER (WHERE device IS NOT NULL))[1] AS device,
              BOOL_OR(engaged) AS was_engaged
       FROM events
       WHERE site_id = $1 AND time BETWEEN $2 AND $3
       GROUP BY session_id
       ORDER BY started_at DESC
       LIMIT $4 OFFSET $5`,
      [id, from, to, limit, offset]
    );
    return { sessions: result.rows };
  });

  // Single session timeline
  fastify.get<{ Params: { id: string; sid: string } }>('/api/sites/:id/sessions/:sid', async (request) => {
    const { id, sid } = request.params;
    const result = await query(
      `SELECT time, event, path, referrer, duration_ms, scroll_max_pct, engaged, properties
       FROM events WHERE site_id = $1 AND session_id = $2
       ORDER BY time ASC`,
      [id, sid]
    );
    return { events: result.rows };
  });

  // Referrers
  fastify.get<{ Params: { id: string }; Querystring: Record<string, unknown> }>('/api/sites/:id/referrers', async (request) => {
    const { id } = request.params;
    const { from, to } = getDateRange(request.query as Record<string, unknown>);
    const result = await query(
      `SELECT referrer, COUNT(*) AS visits, COUNT(DISTINCT session_id) AS visitors
       FROM events WHERE site_id = $1 AND event = 'pageview' AND referrer IS NOT NULL AND time BETWEEN $2 AND $3
       GROUP BY referrer ORDER BY visits DESC LIMIT 50`,
      [id, from, to]
    );
    return { referrers: result.rows };
  });

  // Geo
  fastify.get<{ Params: { id: string }; Querystring: Record<string, unknown> }>('/api/sites/:id/geo', async (request) => {
    const { id } = request.params;
    const { from, to } = getDateRange(request.query as Record<string, unknown>);
    const result = await query(
      `SELECT country, region, city, COUNT(DISTINCT session_id) AS visitors, COUNT(*) FILTER (WHERE event = 'pageview') AS pageviews
       FROM events WHERE site_id = $1 AND country IS NOT NULL AND time BETWEEN $2 AND $3
       GROUP BY country, region, city ORDER BY visitors DESC LIMIT 100`,
      [id, from, to]
    );
    return { geo: result.rows };
  });

  // Devices
  fastify.get<{ Params: { id: string }; Querystring: Record<string, unknown> }>('/api/sites/:id/devices', async (request) => {
    const { id } = request.params;
    const { from, to } = getDateRange(request.query as Record<string, unknown>);
    const [devices, browsers, oses] = await Promise.all([
      query(
        `SELECT device, COUNT(DISTINCT session_id) AS visitors FROM events
         WHERE site_id = $1 AND time BETWEEN $2 AND $3 AND device IS NOT NULL
         GROUP BY device ORDER BY visitors DESC`, [id, from, to]),
      query(
        `SELECT browser, COUNT(DISTINCT session_id) AS visitors FROM events
         WHERE site_id = $1 AND time BETWEEN $2 AND $3 AND browser IS NOT NULL
         GROUP BY browser ORDER BY visitors DESC LIMIT 20`, [id, from, to]),
      query(
        `SELECT os, COUNT(DISTINCT session_id) AS visitors FROM events
         WHERE site_id = $1 AND time BETWEEN $2 AND $3 AND os IS NOT NULL
         GROUP BY os ORDER BY visitors DESC LIMIT 20`, [id, from, to]),
    ]);
    return { devices: devices.rows, browsers: browsers.rows, operatingSystems: oses.rows };
  });

  // Custom events list
  fastify.get<{ Params: { id: string }; Querystring: Record<string, unknown> }>('/api/sites/:id/events', async (request) => {
    const { id } = request.params;
    const { from, to } = getDateRange(request.query as Record<string, unknown>);
    const result = await query(
      `SELECT event, COUNT(*) AS count, COUNT(DISTINCT session_id) AS unique_sessions
       FROM events WHERE site_id = $1 AND time BETWEEN $2 AND $3
         AND event NOT IN ('pageview', 'pageleave', 'heartbeat', 'engage')
       GROUP BY event ORDER BY count DESC`,
      [id, from, to]
    );
    return { events: result.rows };
  });

  // Single event details
  fastify.get<{ Params: { id: string; name: string }; Querystring: Record<string, unknown> }>('/api/sites/:id/events/:name', async (request) => {
    const { id, name } = request.params;
    const { from, to } = getDateRange(request.query as Record<string, unknown>);
    const [stats, daily] = await Promise.all([
      query(
        `SELECT COUNT(*) AS total, COUNT(DISTINCT session_id) AS unique_sessions,
                AVG(value) AS avg_value
         FROM events WHERE site_id = $1 AND event = $2 AND time BETWEEN $3 AND $4`,
        [id, name, from, to]
      ),
      query(
        `SELECT time_bucket('1 day', time) AS day, COUNT(*) AS count
         FROM events WHERE site_id = $1 AND event = $2 AND time BETWEEN $3 AND $4
         GROUP BY day ORDER BY day`, [id, name, from, to]
      ),
    ]);
    return { ...stats.rows[0], daily: daily.rows };
  });

  // Recent live events (REST - for initial page load before WebSocket streams)
  fastify.get<{ Params: { id: string } }>('/api/sites/:id/live/recent', async (request) => {
    const { id } = request.params;
    const result = await query(
      `SELECT event, path, session_id, country, device, time
       FROM events
       WHERE site_id = $1 AND time > NOW() - INTERVAL '5 minutes'
       ORDER BY time DESC
       LIMIT 50`,
      [id]
    );
    return { events: result.rows };
  });

  // Live (WebSocket)
  fastify.get<{ Params: { id: string } }>('/api/sites/:id/live', { websocket: true }, (socket, request) => {
    const { id } = request.params;
    const channel = `live:${id}`;

    const handler = (_ch: string, message: string) => {
      socket.send(message);
    };

    redisSub.subscribe(channel);
    redisSub.on('message', handler);

    socket.on('close', () => {
      redisSub.off('message', handler);
      redisSub.unsubscribe(channel);
    });
  });

  // Timeseries (visitors + pageviews with adaptive granularity)
  const ALLOWED_BUCKETS = ['1 minute', '5 minutes', '15 minutes', '1 hour', '1 day', '1 week'];

  fastify.get<{ Params: { id: string }; Querystring: Record<string, unknown> }>('/api/sites/:id/timeseries', async (request) => {
    const { id } = request.params;
    const { from, to } = getDateRange(request.query as Record<string, unknown>);
    const rawBucket = (request.query as Record<string, string>).bucket || '1 day';
    const bucket = ALLOWED_BUCKETS.includes(rawBucket) ? rawBucket : '1 day';

    const result = await query(
      `SELECT time_bucket($4::interval, time) AS date,
              COUNT(*) FILTER (WHERE event = 'pageview') AS pageviews,
              COUNT(DISTINCT session_id) AS visitors
       FROM events WHERE site_id = $1 AND time BETWEEN $2 AND $3
       GROUP BY date ORDER BY date`,
      [id, from, to, bucket]
    );
    return { timeseries: result.rows };
  });

  // Export
  fastify.get<{ Params: { id: string }; Querystring: Record<string, unknown> }>('/api/sites/:id/export', async (request, reply) => {
    const { id } = request.params;
    const { from, to } = getDateRange(request.query as Record<string, unknown>);
    const format = (request.query as Record<string, string>).format || 'json';

    const result = await query(
      `SELECT time, event, session_id, path, referrer, duration_ms, scroll_max_pct, engaged,
              country, device, browser, os, properties
       FROM events WHERE site_id = $1 AND time BETWEEN $2 AND $3
       ORDER BY time DESC LIMIT 10000`,
      [id, from, to]
    );

    if (format === 'csv') {
      const headers = ['time', 'event', 'session_id', 'path', 'referrer', 'duration_ms', 'scroll_max_pct', 'engaged', 'country', 'device', 'browser', 'os'];
      const csv = [headers.join(',')];
      for (const row of result.rows) {
        csv.push(headers.map(h => JSON.stringify(row[h] ?? '')).join(','));
      }
      reply.header('Content-Type', 'text/csv');
      reply.header('Content-Disposition', 'attachment; filename=export.csv');
      return csv.join('\n');
    }

    return { events: result.rows };
  });
}
