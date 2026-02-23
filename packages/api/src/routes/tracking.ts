import { FastifyInstance } from 'fastify';
import geoip from 'geoip-lite';
import crypto from 'crypto';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const UAParser = require('ua-parser-js') as (ua: string) => { browser: { name?: string }; os: { name?: string } };
import { query } from '../db/connection';
import { redis } from '../db/redis';
import { rateLimitMiddleware, checkHeartbeatDedup } from '../middleware/rateLimit';
import { trackerPayloadSchema, classifyDevice } from '@openanalytics/shared';

interface SiteIngestionToken {
  publicId?: string;
  secret?: string;
}

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

function normalizeHost(raw: string): string {
  let normalized = raw.replace(/^www\./, '');
  if (normalized.includes('://')) {
    normalized = new URL(normalized).hostname.replace(/^www\./, '');
  }
  return normalized.replace(/\/.*$/, '');
}

function validateTrustedOrigin(originHeader: string | string[] | undefined, siteDomain: string): { trusted: boolean; malformed: boolean } {
  if (!originHeader) return { trusted: false, malformed: false };
  const origin = Array.isArray(originHeader) ? originHeader[0] : originHeader;
  if (!origin) return { trusted: false, malformed: false };

  try {
    const originHost = new URL(origin).hostname.replace(/^www\./, '');
    const registered = normalizeHost(siteDomain);
    return { trusted: originHost === registered, malformed: false };
  } catch {
    return { trusted: false, malformed: true };
  }
}

function signIngestionProof(secret: string, data: { s: string; sid: string; t: string; u: string; ts: number; tk: string }): string {
  const content = [data.s, data.sid, data.t, data.u || '', String(data.ts), data.tk].join('.');
  return crypto.createHmac('sha256', secret).update(content).digest('hex');
}

function validateSignedToken(
  token: SiteIngestionToken,
  data: { s: string; sid: string; t: string; u: string; ts: number; tk?: string; tsg?: string }
): boolean {
  if (!token.publicId || !token.secret || !data.tk || !data.tsg) return false;
  if (data.tk !== token.publicId) return false;
  const expected = signIngestionProof(token.secret, {
    s: data.s,
    sid: data.sid,
    t: data.t,
    u: data.u || '',
    ts: data.ts,
    tk: data.tk,
  });
  if (expected.length !== data.tsg.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(data.tsg));
}

export default async function trackingRoutes(fastify: FastifyInstance) {
  // The tracker sends events as text/plain to avoid CORS preflights.
  // Parse text/plain bodies as JSON so Fastify can handle them.
  fastify.addContentTypeParser('text/plain', { parseAs: 'string' }, (_req, body, done) => {
    try {
      done(null, JSON.parse(body as string));
    } catch (err) {
      done(err as Error, undefined);
    }
  });

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

    // Resolve site_id from public_id and load authenticity config
    const siteResult = await query('SELECT id, domain, settings FROM sites WHERE public_id = $1', [data.s]);
    if (siteResult.rows.length === 0) {
      return reply.status(404).send({ error: 'Site not found' });
    }
    const siteId = siteResult.rows[0].id;
    const siteDomain = siteResult.rows[0].domain;
    const siteSettings = siteResult.rows[0].settings && typeof siteResult.rows[0].settings === 'object'
      ? siteResult.rows[0].settings as Record<string, unknown>
      : {};
    const token = (siteSettings.ingestion_token && typeof siteSettings.ingestion_token === 'object'
      ? siteSettings.ingestion_token
      : {}) as SiteIngestionToken;

    const originCheck = validateTrustedOrigin(request.headers.origin || request.headers.referer, siteDomain);
    if (originCheck.malformed) {
      return reply.status(403).send({ error: 'Invalid origin' });
    }

    const signedTokenValid = validateSignedToken(token, data);
    if (!originCheck.trusted && !signedTokenValid) {
      const hasSignedAttempt = Boolean(data.tk || data.tsg);
      return reply.status(403).send({
        error: hasSignedAttempt
          ? 'Invalid authenticity token'
          : 'Missing authenticity proof',
      });
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

    // Strip self-referrals (same-domain referrers are internal navigation, not sources)
    let referrer = data.r || null;
    if (referrer) {
      try {
        const refHost = new URL(referrer).hostname.replace(/^www\./, '');
        const siteHost = siteDomain.replace(/^www\./, '');
        if (refHost === siteHost) referrer = null;
      } catch { referrer = null; }
    }

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
        siteId, data.sid, data.t, data.u || null, referrer,
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
