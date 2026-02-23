/**
 * Demo seed script - creates a demo user, site, and realistic sample data.
 *
 * Usage: npx tsx packages/api/src/db/seed-demo.ts
 */

import crypto from 'crypto';
import { pool, query } from './connection';

// ─── Config ──────────────────────────────────

const DEMO_EMAIL = 'demo@openanalytics.dev';
const DEMO_PASSWORD = 'demodemo123';
const DEMO_DOMAIN = 'demo.openanalytics.dev';
const DEMO_SITE_NAME = 'Demo Site';
const SESSION_COUNT = 500;
const DAYS = 30;

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

function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, (err, key) => {
      if (err) reject(err);
      resolve(`${salt}:${key.toString('hex')}`);
    });
  });
}

// ─── Data pools ──────────────────────────────

const paths = ['/', '/pricing', '/features', '/about', '/contact',
  '/blog/getting-started', '/blog/analytics-tips', '/blog/privacy-first',
  '/docs/api', '/docs/setup', '/docs/tracker', '/signup'];

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

// ─── Main ────────────────────────────────────

async function seed() {
  console.log('Seeding demo data...\n');

  // 1. Create or get demo user
  let userId: string;
  const existingUser = await query('SELECT id FROM users WHERE email = $1', [DEMO_EMAIL]);
  if (existingUser.rows.length > 0) {
    userId = existingUser.rows[0].id;
    console.log(`  User already exists: ${DEMO_EMAIL} (${userId})`);
  } else {
    const hash = await hashPassword(DEMO_PASSWORD);
    const result = await query(
      'INSERT INTO users (email, name, password_hash) VALUES ($1, $2, $3) RETURNING id',
      [DEMO_EMAIL, 'Demo User', hash]
    );
    userId = result.rows[0].id;
    console.log(`  Created user: ${DEMO_EMAIL} (${userId})`);
  }

  // 2. Create or get demo site
  let siteId: string;
  const existingSite = await query('SELECT id FROM sites WHERE user_id = $1 AND domain = $2', [userId, DEMO_DOMAIN]);
  if (existingSite.rows.length > 0) {
    siteId = existingSite.rows[0].id;
    console.log(`  Site already exists: ${DEMO_DOMAIN} (${siteId})`);
    // Clean old demo events
    await query('DELETE FROM events WHERE site_id = $1', [siteId]);
    console.log('  Cleared existing demo events');
  } else {
    const publicId = randomId(12);
    const result = await query(
      'INSERT INTO sites (user_id, domain, name, public_id) VALUES ($1, $2, $3, $4) RETURNING id',
      [userId, DEMO_DOMAIN, DEMO_SITE_NAME, publicId]
    );
    siteId = result.rows[0].id;
    console.log(`  Created site: ${DEMO_SITE_NAME} (${siteId})`);
  }

  // 3. Generate events
  const now = Date.now();
  const startTime = now - DAYS * 24 * 60 * 60 * 1000;
  let totalEvents = 0;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (let s = 0; s < SESSION_COUNT; s++) {
      const sessionId = `demo_${randomId(16)}`;
      const sessionStart = startTime + Math.random() * (now - startTime);
      const pageCount = randInt(1, 8);
      const referrer = pick(referrers, referrerWeights);
      const country = pick(countries, countryWeights);
      const device = pick(deviceTypes, deviceWeights);
      const browser = pick(browsers, browserWeights);
      const os = pick(operatingSystems, osWeights);

      let currentTime = sessionStart;

      for (let p = 0; p < pageCount; p++) {
        const path = p === 0 ? pick(paths.slice(0, 6), [30, 15, 15, 10, 5, 25]) : pick(paths, paths.map(() => 1));
        const dwellMs = randInt(3000, 120000);
        const scrollPct = randInt(10, 100);
        const engaged = dwellMs > 5000;

        // Pageview event
        await client.query(
          `INSERT INTO events (time, site_id, session_id, event, path, referrer, country, device, browser, os)
           VALUES ($1, $2, $3, 'pageview', $4, $5, $6, $7, $8, $9)`,
          [new Date(currentTime), siteId, sessionId, path,
           p === 0 ? referrer : null, country, device, browser, os]
        );
        totalEvents++;

        // Engage event (if dwell > 5s)
        if (engaged) {
          await client.query(
            `INSERT INTO events (time, site_id, session_id, event, path, engaged, country, device, browser, os)
             VALUES ($1, $2, $3, 'engage', $4, true, $5, $6, $7, $8)`,
            [new Date(currentTime + 5000), siteId, sessionId, path, country, device, browser, os]
          );
          totalEvents++;
        }

        // Occasional custom event
        if (Math.random() < 0.15) {
          const customEvent = pick(customEvents, [10, 30, 15, 10, 10]);
          await client.query(
            `INSERT INTO events (time, site_id, session_id, event, path, country, device, browser, os, properties)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [new Date(currentTime + randInt(2000, dwellMs)),
             siteId, sessionId, customEvent, path, country, device, browser, os,
             JSON.stringify({ source: 'demo' })]
          );
          totalEvents++;
        }

        // Pageleave event
        const leaveTime = currentTime + dwellMs;
        await client.query(
          `INSERT INTO events (time, site_id, session_id, event, path, duration_ms, scroll_max_pct, engaged, country, device, browser, os)
           VALUES ($1, $2, $3, 'pageleave', $4, $5, $6, $7, $8, $9, $10, $11)`,
          [new Date(leaveTime), siteId, sessionId, path, dwellMs, scrollPct, engaged,
           country, device, browser, os]
        );
        totalEvents++;

        currentTime = leaveTime + randInt(500, 3000);
      }
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  console.log(`  Generated ${totalEvents} events across ${SESSION_COUNT} sessions\n`);

  // 4. Create funnels
  const existingFunnels = await query('SELECT id FROM funnels WHERE site_id = $1', [siteId]);
  if (existingFunnels.rows.length === 0) {
    // Signup Flow
    const f1 = await query(
      'INSERT INTO funnels (site_id, name, description) VALUES ($1, $2, $3) RETURNING id',
      [siteId, 'Signup Flow', 'Landing to signup completion']
    );
    const steps1 = [
      { position: 1, name: 'Landing Page', match_type: 'pageview', match_path: '/' },
      { position: 2, name: 'Pricing Page', match_type: 'pageview', match_path: '/pricing' },
      { position: 3, name: 'Signup Page', match_type: 'pageview', match_path: '/signup' },
      { position: 4, name: 'Signup Complete', match_type: 'event', match_event: 'signup_complete' },
    ];
    for (const step of steps1) {
      await query(
        `INSERT INTO funnel_steps (funnel_id, position, name, match_type, match_path, match_event)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [f1.rows[0].id, step.position, step.name, step.match_type,
         step.match_path || null, step.match_event || null]
      );
    }

    // Purchase Funnel
    const f2 = await query(
      'INSERT INTO funnels (site_id, name, description) VALUES ($1, $2, $3) RETURNING id',
      [siteId, 'Feature Exploration', 'Features to docs to signup']
    );
    const steps2 = [
      { position: 1, name: 'Features Page', match_type: 'pageview', match_path: '/features' },
      { position: 2, name: 'Docs', match_type: 'pageview', match_path: '/docs/setup' },
      { position: 3, name: 'Signup Complete', match_type: 'event', match_event: 'signup_complete' },
    ];
    for (const step of steps2) {
      await query(
        `INSERT INTO funnel_steps (funnel_id, position, name, match_type, match_path, match_event)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [f2.rows[0].id, step.position, step.name, step.match_type,
         step.match_path || null, step.match_event || null]
      );
    }
    console.log('  Created 2 funnels');
  } else {
    console.log('  Funnels already exist, skipping');
  }

  // 5. Create goals
  const existingGoals = await query('SELECT id FROM goals WHERE site_id = $1', [siteId]);
  if (existingGoals.rows.length === 0) {
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
    console.log('  Created 3 goals');
  } else {
    console.log('  Goals already exist, skipping');
  }

  console.log('\n─── Demo credentials ───────────────');
  console.log(`  Email:    ${DEMO_EMAIL}`);
  console.log(`  Password: ${DEMO_PASSWORD}`);
  console.log(`  Site:     ${DEMO_SITE_NAME} (${DEMO_DOMAIN})`);
  console.log('────────────────────────────────────\n');

  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
