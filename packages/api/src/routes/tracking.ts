import { FastifyInstance } from 'fastify';
import geoip from 'geoip-lite';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const UAParser = require('ua-parser-js') as (ua: string) => { browser: { name?: string }; os: { name?: string } };
import { query } from '../db/connection';
import { redis } from '../db/redis';
import { rateLimitMiddleware, checkHeartbeatDedup } from '../middleware/rateLimit';
import { trackerPayloadSchema, classifyDevice } from '@openanalytics/shared';

function extractUtm(pagePath?: string | null): Record<string, string | null> {
  const result: Record<string, string | null> = {
    utm_source: null, utm_medium: null, utm_campaign: null,
    utm_term: null, utm_content: null,
  };
  if (!pagePath) return result;
  try {
    const url = new URL(pagePath, 'http://d');
    for (const key of Object.keys(result)) {
      result[key] = url.searchParams.get(key);
    }
  } catch { /* not a valid path */ }
  return result;
}

export default async function trackingRoutes(fastify: FastifyInstance) {
  fastify.post('/api/event', {
    preHandler: rateLimitMiddleware,
  }, async (request, reply) => {
    const parseResult = trackerPayloadSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: 'Invalid event data', details: parseResult.error.issues });
    }

    const data = parseResult.data;

    // Heartbeat dedup
    if (data.t === 'heartbeat') {
      const allowed = await checkHeartbeatDedup(data.sid);
      if (!allowed) {
        return reply.status(202).send({ ok: true, deduped: true });
      }
    }

    // Resolve site_id from public_id and validate origin
    const siteResult = await query('SELECT id, domain FROM sites WHERE public_id = $1', [data.s]);
    if (siteResult.rows.length === 0) {
      return reply.status(404).send({ error: 'Site not found' });
    }
    const siteId = siteResult.rows[0].id;
    const siteDomain = siteResult.rows[0].domain;

    // Verify the request comes from the registered domain
    const origin = request.headers['origin'] || request.headers['referer'];
    if (origin) {
      try {
        const originHost = new URL(origin).hostname.replace(/^www\./, '');
        const registered = siteDomain.replace(/^www\./, '');
        if (originHost !== registered) {
          return reply.status(403).send({ error: 'Origin not allowed for this site' });
        }
      } catch {
        // Malformed origin header - reject
        return reply.status(403).send({ error: 'Invalid origin' });
      }
    }

    // GeoIP lookup (IP discarded after lookup)
    const ip = request.ip;
    const geo = geoip.lookup(ip);
    const country = geo?.country || null;
    const region = geo?.region || null;
    const city = geo?.city || null;

    // UA parse (header discarded after parse)
    const ua = UAParser(request.headers['user-agent'] || '');
    const browser = ua.browser.name || null;
    const os = ua.os.name || null;

    const device = classifyDevice(data.w);
    const utm = extractUtm(data.u);

    // Extract behavioral fields from properties
    const props = data.p || {};
    const durationMs = typeof props.duration_ms === 'number' ? props.duration_ms : null;
    const scrollMaxPct = typeof props.scroll_max_pct === 'number' ? props.scroll_max_pct
      : typeof props.scroll_pct === 'number' ? props.scroll_pct : null;
    const engaged = typeof props.engaged === 'boolean' ? props.engaged : null;

    // Clean properties (remove fields already extracted)
    const cleanProps = { ...props };
    delete cleanProps.duration_ms;
    delete cleanProps.scroll_max_pct;
    delete cleanProps.scroll_pct;
    delete cleanProps.engaged;
    const propsJson = Object.keys(cleanProps).length > 0 ? JSON.stringify(cleanProps) : null;

    await query(
      `INSERT INTO events (
        time, site_id, session_id, event, path, referrer,
        duration_ms, scroll_max_pct, engaged,
        country, region, city, device, browser, os,
        utm_source, utm_medium, utm_campaign, utm_term, utm_content,
        properties
      ) VALUES (
        NOW(), $1, $2, $3, $4, $5,
        $6, $7, $8,
        $9, $10, $11, $12, $13, $14,
        $15, $16, $17, $18, $19,
        $20
      )`,
      [
        siteId, data.sid, data.t, data.u || null, data.r || null,
        durationMs, scrollMaxPct, engaged,
        country, region, city, device, browser, os,
        utm.utm_source, utm.utm_medium, utm.utm_campaign, utm.utm_term, utm.utm_content,
        propsJson,
      ]
    );

    // Publish to Redis for live view
    await redis.publish(`live:${siteId}`, JSON.stringify({
      event: data.t,
      path: data.u,
      session_id: data.sid,
      country,
      device,
      time: new Date().toISOString(),
    }));

    return reply.status(202).send({ ok: true });
  });
}
