/**
 * Auto-provision a demo site with realistic analytics data for new users.
 *
 * Called fire-and-forget from register, login, and /me. Idempotent - checks
 * for existing demo site and uses a Redis NX lock to prevent concurrent runs.
 */

import crypto from 'crypto';
import { query, getClient } from '../db/connection';
import { redis } from '../db/redis';

// ─── Config ──────────────────────────────────

const DEMO_DOMAIN = 'demo.example.com';
const DEMO_SITE_NAME = 'Demo Site';
const SESSION_COUNT = 500;
const DAYS = 30;
const BATCH_SIZE = 100;

// ─── Weighted random helpers ─────────────────

function pick<T>(items: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomId(len = 12) {
  return crypto.randomBytes(len).toString('hex').slice(0, len);
}

// ─── Data pools ──────────────────────────────

const paths = [
  '/', '/pricing', '/features', '/about', '/contact',
  '/blog/getting-started', '/blog/analytics-tips', '/blog/privacy-first',
  '/docs/api', '/docs/setup', '/docs/tracker', '/signup',
  '/onboarding', '/onboarding/profile', '/onboarding/integrate', '/onboarding/verify',
  '/docs/api/reference',
];

const referrers = ['google.com', null, 'twitter.com', 'github.com',
  'reddit.com', 'hackernews', 'linkedin.com', 'producthunt.com'];
const referrerWeights = [40, 20, 15, 10, 5, 4, 3, 3];

const countries = ['US', 'GB', 'DE', 'FR', 'CA', 'JP', 'AU', 'NL', 'IN', 'BR'];
const countryWeights = [35, 15, 12, 8, 7, 5, 5, 5, 4, 4];

const deviceTypes = ['Desktop', 'Mobile', 'Tablet'];
const deviceWeights = [65, 28, 7];

const browsers = ['Chrome', 'Safari', 'Firefox', 'Edge', 'Other'];
const browserWeights = [50, 25, 12, 8, 5];

const operatingSystems = ['macOS', 'Windows', 'iOS', 'Android', 'Linux'];
const osWeights = [35, 30, 16, 12, 7];

const customEvents = ['signup_complete', 'button_click', 'form_submit', 'video_play', 'file_download'];

// ─── Funnel path templates ───────────────────

const funnelPaths = {
  signup: ['/', '/pricing', '/signup'],
  onboarding: ['/onboarding', '/onboarding/profile', '/onboarding/integrate', '/onboarding/verify'],
  content: ['/blog/getting-started', '/blog/analytics-tips', '/signup'],
  feature: ['/features', '/docs/setup'],
};

// ─── Batch insert helper ─────────────────────

interface EventRow {
  time: Date;
  site_id: string;
  session_id: string;
  event: string;
  path: string;
  referrer: string | null;
  country: string;
  device: string;
  browser: string;
  os: string;
  duration_ms: number | null;
  scroll_max_pct: number | null;
  engaged: boolean | null;
  properties: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function flushBatch(client: any, batch: EventRow[]) {
  if (batch.length === 0) return;

  const cols = 'time, site_id, session_id, event, path, referrer, country, device, browser, os, duration_ms, scroll_max_pct, engaged, properties';
  const placeholders: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  for (const row of batch) {
    placeholders.push(`($${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++})`);
    values.push(
      row.time, row.site_id, row.session_id, row.event, row.path,
      row.referrer, row.country, row.device, row.browser, row.os,
      row.duration_ms, row.scroll_max_pct, row.engaged, row.properties
    );
  }

  await client.query(
    `INSERT INTO events (${cols}) VALUES ${placeholders.join(', ')}`,
    values
  );
}

// ─── Session generators ──────────────────────

function makeBaseSession() {
  return {
    referrer: pick(referrers, referrerWeights),
    country: pick(countries, countryWeights),
    device: pick(deviceTypes, deviceWeights),
    browser: pick(browsers, browserWeights),
    os: pick(operatingSystems, osWeights),
  };
}

function generatePageEvents(
  siteId: string,
  sessionId: string,
  pagePath: string,
  startTime: number,
  base: ReturnType<typeof makeBaseSession>,
  isFirstPage: boolean,
  emitCustomEvent?: string,
): { events: EventRow[]; endTime: number } {
  const events: EventRow[] = [];
  const dwellMs = randInt(3000, 120000);
  const scrollPct = randInt(10, 100);
  const engaged = dwellMs > 5000;

  // Pageview
  events.push({
    time: new Date(startTime),
    site_id: siteId,
    session_id: sessionId,
    event: 'pageview',
    path: pagePath,
    referrer: isFirstPage ? base.referrer : null,
    country: base.country,
    device: base.device,
    browser: base.browser,
    os: base.os,
    duration_ms: null,
    scroll_max_pct: null,
    engaged: null,
    properties: null,
  });

  // Engage
  if (engaged) {
    events.push({
      time: new Date(startTime + 5000),
      site_id: siteId,
      session_id: sessionId,
      event: 'engage',
      path: pagePath,
      referrer: null,
      country: base.country,
      device: base.device,
      browser: base.browser,
      os: base.os,
      duration_ms: null,
      scroll_max_pct: null,
      engaged: true,
      properties: null,
    });
  }

  // Custom event (forced or random)
  if (emitCustomEvent) {
    events.push({
      time: new Date(startTime + randInt(2000, dwellMs)),
      site_id: siteId,
      session_id: sessionId,
      event: emitCustomEvent,
      path: pagePath,
      referrer: null,
      country: base.country,
      device: base.device,
      browser: base.browser,
      os: base.os,
      duration_ms: null,
      scroll_max_pct: null,
      engaged: null,
      properties: JSON.stringify({ source: 'demo' }),
    });
  } else if (Math.random() < 0.15) {
    const customEvent = pick(customEvents, [10, 30, 15, 10, 10]);
    events.push({
      time: new Date(startTime + randInt(2000, dwellMs)),
      site_id: siteId,
      session_id: sessionId,
      event: customEvent,
      path: pagePath,
      referrer: null,
      country: base.country,
      device: base.device,
      browser: base.browser,
      os: base.os,
      duration_ms: null,
      scroll_max_pct: null,
      engaged: null,
      properties: JSON.stringify({ source: 'demo' }),
    });
  }

  // Pageleave
  const leaveTime = startTime + dwellMs;
  events.push({
    time: new Date(leaveTime),
    site_id: siteId,
    session_id: sessionId,
    event: 'pageleave',
    path: pagePath,
    referrer: null,
    country: base.country,
    device: base.device,
    browser: base.browser,
    os: base.os,
    duration_ms: dwellMs,
    scroll_max_pct: scrollPct,
    engaged,
    properties: null,
  });

  return { events, endTime: leaveTime + randInt(500, 3000) };
}

// ─── Core provisioning ──────────────────────

async function hasDemoSite(userId: string): Promise<boolean> {
  const result = await query(
    `SELECT 1 FROM sites WHERE user_id = $1 AND settings @> '{"is_demo": true}' LIMIT 1`,
    [userId]
  );
  return result.rows.length > 0;
}

async function createDemoSiteRow(userId: string): Promise<string> {
  const publicId = randomId(12);
  const settings = JSON.stringify({ is_demo: true });
  const result = await query(
    `INSERT INTO sites (user_id, domain, name, public_id, settings)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [userId, DEMO_DOMAIN, DEMO_SITE_NAME, publicId, settings]
  );
  return result.rows[0].id;
}

async function populateDemoData(siteId: string): Promise<void> {
  const now = Date.now();
  const startTime = now - DAYS * 24 * 60 * 60 * 1000;

  const client = await getClient();
  try {
    await client.query('BEGIN');

    let batch: EventRow[] = [];

    async function addEvent(event: EventRow) {
      batch.push(event);
      if (batch.length >= BATCH_SIZE) {
        await flushBatch(client, batch);
        batch = [];
      }
    }

    // ~30% of sessions follow funnel paths
    const funnelSessionCount = Math.floor(SESSION_COUNT * 0.3);
    const regularSessionCount = SESSION_COUNT - funnelSessionCount;

    // ── Funnel-aware sessions ──
    for (let s = 0; s < funnelSessionCount; s++) {
      const sessionId = `demo_${randomId(16)}`;
      const sessionStart = startTime + Math.random() * (now - startTime);
      const base = makeBaseSession();

      // Pick a funnel path with drop-off
      const funnelType = pick(
        ['signup', 'onboarding', 'content', 'feature'] as const,
        [35, 25, 20, 20]
      );
      const fullPath = funnelPaths[funnelType];

      // Determine how far through the funnel this session gets (realistic drop-off)
      const dropOffRates: Record<string, number[]> = {
        signup: [1.0, 0.65, 0.40, 0.25],      // 100% -> 65% -> 40% -> complete event
        onboarding: [1.0, 0.80, 0.55, 0.35],   // high initial, drops through steps
        content: [1.0, 0.50, 0.20],             // blog -> blog -> signup
        feature: [1.0, 0.60],                   // features -> docs
      };
      const rates = dropOffRates[funnelType];
      let stepsCompleted = 1;
      for (let i = 1; i < rates.length; i++) {
        if (Math.random() < rates[i]) stepsCompleted = i + 1;
        else break;
      }

      let currentTime = sessionStart;
      const pagesVisited = fullPath.slice(0, stepsCompleted);

      for (let p = 0; p < pagesVisited.length; p++) {
        // Determine custom events for specific funnel stages
        let customEvent: string | undefined;
        if (funnelType === 'signup' && p === pagesVisited.length - 1 && stepsCompleted === fullPath.length) {
          customEvent = 'signup_complete';
        }
        if (funnelType === 'feature' && p === pagesVisited.length - 1 && stepsCompleted === fullPath.length) {
          customEvent = 'file_download';
        }

        const { events, endTime } = generatePageEvents(
          siteId, sessionId, pagesVisited[p], currentTime, base, p === 0, customEvent
        );
        for (const evt of events) await addEvent(evt);
        currentTime = endTime;
      }

      // Some funnel sessions continue browsing after the funnel
      if (Math.random() < 0.3) {
        const extraPages = randInt(1, 3);
        for (let p = 0; p < extraPages; p++) {
          const path = pick(paths, paths.map(() => 1));
          const { events, endTime } = generatePageEvents(
            siteId, sessionId, path, currentTime, base, false
          );
          for (const evt of events) await addEvent(evt);
          currentTime = endTime;
        }
      }
    }

    // ── Regular sessions (same as original seed) ──
    for (let s = 0; s < regularSessionCount; s++) {
      const sessionId = `demo_${randomId(16)}`;
      const sessionStart = startTime + Math.random() * (now - startTime);
      const pageCount = randInt(1, 8);
      const base = makeBaseSession();

      let currentTime = sessionStart;

      for (let p = 0; p < pageCount; p++) {
        const path = p === 0
          ? pick(paths.slice(0, 6), [30, 15, 15, 10, 5, 25])
          : pick(paths, paths.map(() => 1));

        const { events, endTime } = generatePageEvents(
          siteId, sessionId, path, currentTime, base, p === 0
        );
        for (const evt of events) await addEvent(evt);
        currentTime = endTime;
      }
    }

    // Flush remaining
    await flushBatch(client, batch);

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  // ── Funnels ──
  // 1. Signup Flow
  const f1 = await query(
    'INSERT INTO funnels (site_id, name, description) VALUES ($1, $2, $3) RETURNING id',
    [siteId, 'Signup Flow', 'Landing to signup completion']
  );
  const steps1 = [
    { position: 1, name: 'Landing Page', match_type: 'pageview', match_path: '/', match_event: null },
    { position: 2, name: 'Pricing Page', match_type: 'pageview', match_path: '/pricing', match_event: null },
    { position: 3, name: 'Signup Page', match_type: 'pageview', match_path: '/signup', match_event: null },
    { position: 4, name: 'Signup Complete', match_type: 'event', match_path: null, match_event: 'signup_complete' },
  ];
  for (const step of steps1) {
    await query(
      `INSERT INTO funnel_steps (funnel_id, position, name, match_type, match_path, match_event)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [f1.rows[0].id, step.position, step.name, step.match_type, step.match_path, step.match_event]
    );
  }

  // 2. User Onboarding
  const f2 = await query(
    'INSERT INTO funnels (site_id, name, description) VALUES ($1, $2, $3) RETURNING id',
    [siteId, 'User Onboarding', 'Post-signup onboarding flow']
  );
  const steps2 = [
    { position: 1, name: 'Signup Complete', match_type: 'event', match_path: null, match_event: 'signup_complete' },
    { position: 2, name: 'Onboarding Start', match_type: 'pageview', match_path: '/onboarding', match_event: null },
    { position: 3, name: 'Profile Setup', match_type: 'pageview', match_path: '/onboarding/profile', match_event: null },
    { position: 4, name: 'Integration', match_type: 'pageview', match_path: '/onboarding/integrate', match_event: null },
    { position: 5, name: 'Verification', match_type: 'pageview', match_path: '/onboarding/verify', match_event: null },
  ];
  for (const step of steps2) {
    await query(
      `INSERT INTO funnel_steps (funnel_id, position, name, match_type, match_path, match_event)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [f2.rows[0].id, step.position, step.name, step.match_type, step.match_path, step.match_event]
    );
  }

  // 3. Content Engagement
  const f3 = await query(
    'INSERT INTO funnels (site_id, name, description) VALUES ($1, $2, $3) RETURNING id',
    [siteId, 'Content Engagement', 'Blog readers converting to signups']
  );
  const steps3 = [
    { position: 1, name: 'First Blog Post', match_type: 'pageview', match_path: '/blog/getting-started', match_event: null },
    { position: 2, name: 'Second Blog Post', match_type: 'pageview', match_path: '/blog/analytics-tips', match_event: null },
    { position: 3, name: 'Signup Page', match_type: 'pageview', match_path: '/signup', match_event: null },
  ];
  for (const step of steps3) {
    await query(
      `INSERT INTO funnel_steps (funnel_id, position, name, match_type, match_path, match_event)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [f3.rows[0].id, step.position, step.name, step.match_type, step.match_path, step.match_event]
    );
  }

  // 4. Feature Discovery
  const f4 = await query(
    'INSERT INTO funnels (site_id, name, description) VALUES ($1, $2, $3) RETURNING id',
    [siteId, 'Feature Discovery', 'Features page to docs to file download']
  );
  const steps4 = [
    { position: 1, name: 'Features Page', match_type: 'pageview', match_path: '/features', match_event: null },
    { position: 2, name: 'Setup Docs', match_type: 'pageview', match_path: '/docs/setup', match_event: null },
    { position: 3, name: 'File Download', match_type: 'event', match_path: null, match_event: 'file_download' },
    { position: 4, name: 'Signup Complete', match_type: 'event', match_path: null, match_event: 'signup_complete' },
  ];
  for (const step of steps4) {
    await query(
      `INSERT INTO funnel_steps (funnel_id, position, name, match_type, match_path, match_event)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [f4.rows[0].id, step.position, step.name, step.match_type, step.match_path, step.match_event]
    );
  }

  // ── Goals ──
  await query(
    `INSERT INTO goals (site_id, name, match_type, match_event) VALUES ($1, $2, $3, $4)`,
    [siteId, 'Signups', 'event', 'signup_complete']
  );
  await query(
    `INSERT INTO goals (site_id, name, match_type, match_path) VALUES ($1, $2, $3, $4)`,
    [siteId, 'Pricing Page Views', 'pageview', '/pricing']
  );
  await query(
    `INSERT INTO goals (site_id, name, match_type, match_event) VALUES ($1, $2, $3, $4)`,
    [siteId, 'Form Submissions', 'event', 'form_submit']
  );
  await query(
    `INSERT INTO goals (site_id, name, match_type, match_path) VALUES ($1, $2, $3, $4)`,
    [siteId, 'Onboarding Completed', 'pageview', '/onboarding/verify']
  );
}

// ─── Public API ──────────────────────────────

export async function provisionDemoSite(userId: string): Promise<void> {
  // Already has a demo site - nothing to do
  if (await hasDemoSite(userId)) return;

  // Redis lock to prevent concurrent provisioning (NX = set-if-not-exists, 5 min TTL)
  const lockKey = `demo:provision:${userId}`;
  const acquired = await redis.set(lockKey, '1', 'EX', 300, 'NX');
  if (!acquired) return;

  try {
    // Double-check after lock (another request may have completed between check and lock)
    if (await hasDemoSite(userId)) return;

    // Phase 1: Create site row synchronously (instant, shows in UI immediately)
    const siteId = await createDemoSiteRow(userId);

    // Phase 2: Populate data (events, funnels, goals)
    await populateDemoData(siteId);
  } finally {
    await redis.del(lockKey);
  }
}
