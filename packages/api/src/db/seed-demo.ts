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

const referrers = [
  'https://www.google.com/', null, 'https://twitter.com/', 'https://github.com/',
  'https://www.reddit.com/', 'https://news.ycombinator.com/', 'https://www.linkedin.com/',
  'https://www.producthunt.com/',
];
const referrerWeights = [40, 20, 15, 10, 5, 4, 3, 3];

// ─── City-level geo data ─────────────────────

interface CityData {
  country: string;
  region: string;
  city: string;
  lat: number;
  lon: number;
}

const cities: CityData[] = [
  { country: 'US', region: 'NY', city: 'New York', lat: 40.7128, lon: -74.0060 },
  { country: 'US', region: 'CA', city: 'Los Angeles', lat: 34.0522, lon: -118.2437 },
  { country: 'US', region: 'CA', city: 'San Francisco', lat: 37.7749, lon: -122.4194 },
  { country: 'US', region: 'TX', city: 'Austin', lat: 30.2672, lon: -97.7431 },
  { country: 'US', region: 'WA', city: 'Seattle', lat: 47.6062, lon: -122.3321 },
  { country: 'US', region: 'CO', city: 'Denver', lat: 39.7392, lon: -104.9903 },
  { country: 'US', region: 'MA', city: 'Boston', lat: 42.3601, lon: -71.0589 },
  { country: 'US', region: 'FL', city: 'Miami', lat: 25.7617, lon: -80.1918 },
  { country: 'GB', region: 'ENG', city: 'London', lat: 51.5074, lon: -0.1278 },
  { country: 'GB', region: 'ENG', city: 'Manchester', lat: 53.4808, lon: -2.2426 },
  { country: 'GB', region: 'SCT', city: 'Edinburgh', lat: 55.9533, lon: -3.1883 },
  { country: 'DE', region: 'BE', city: 'Berlin', lat: 52.5200, lon: 13.4050 },
  { country: 'DE', region: 'BY', city: 'Munich', lat: 48.1351, lon: 11.5820 },
  { country: 'DE', region: 'HH', city: 'Hamburg', lat: 53.5511, lon: 9.9937 },
  { country: 'FR', region: 'IDF', city: 'Paris', lat: 48.8566, lon: 2.3522 },
  { country: 'FR', region: 'PAC', city: 'Marseille', lat: 43.2965, lon: 5.3698 },
  { country: 'FR', region: 'ARA', city: 'Lyon', lat: 45.7640, lon: 4.8357 },
  { country: 'CA', region: 'ON', city: 'Toronto', lat: 43.6532, lon: -79.3832 },
  { country: 'CA', region: 'BC', city: 'Vancouver', lat: 49.2827, lon: -123.1207 },
  { country: 'CA', region: 'QC', city: 'Montreal', lat: 45.5017, lon: -73.5673 },
  { country: 'JP', region: '13', city: 'Tokyo', lat: 35.6762, lon: 139.6503 },
  { country: 'JP', region: '27', city: 'Osaka', lat: 34.6937, lon: 135.5023 },
  { country: 'AU', region: 'NSW', city: 'Sydney', lat: -33.8688, lon: 151.2093 },
  { country: 'AU', region: 'VIC', city: 'Melbourne', lat: -37.8136, lon: 144.9631 },
  { country: 'NL', region: 'NH', city: 'Amsterdam', lat: 52.3676, lon: 4.9041 },
  { country: 'NL', region: 'ZH', city: 'Rotterdam', lat: 51.9244, lon: 4.4777 },
  { country: 'IN', region: 'MH', city: 'Mumbai', lat: 19.0760, lon: 72.8777 },
  { country: 'IN', region: 'KA', city: 'Bangalore', lat: 12.9716, lon: 77.5946 },
  { country: 'IN', region: 'DL', city: 'Delhi', lat: 28.7041, lon: 77.1025 },
  { country: 'BR', region: 'SP', city: 'Sao Paulo', lat: -23.5505, lon: -46.6333 },
  { country: 'BR', region: 'RJ', city: 'Rio de Janeiro', lat: -22.9068, lon: -43.1729 },
];

const countryWeights: Record<string, number> = {
  US: 35, GB: 15, DE: 12, FR: 8, CA: 7, JP: 5, AU: 5, NL: 5, IN: 4, BR: 4,
};

const citiesByCountry: Record<string, CityData[]> = {};
for (const c of cities) {
  if (!citiesByCountry[c.country]) citiesByCountry[c.country] = [];
  citiesByCountry[c.country].push(c);
}

const countryList = Object.keys(countryWeights);
const countryWeightList = countryList.map((c) => countryWeights[c]);

function pickCity(): CityData {
  const country = pick(countryList, countryWeightList);
  const countryCities = citiesByCountry[country];
  return countryCities[Math.floor(Math.random() * countryCities.length)];
}

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
      const cityData = pickCity();
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
          `INSERT INTO events (time, site_id, session_id, event, path, referrer, country, region, city, latitude, longitude, device, browser, os)
           VALUES ($1, $2, $3, 'pageview', $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [new Date(currentTime), siteId, sessionId, path,
           p === 0 ? referrer : null, cityData.country, cityData.region, cityData.city, cityData.lat, cityData.lon,
           device, browser, os]
        );
        totalEvents++;

        // Engage event (if dwell > 5s)
        if (engaged) {
          await client.query(
            `INSERT INTO events (time, site_id, session_id, event, path, engaged, country, region, city, latitude, longitude, device, browser, os)
             VALUES ($1, $2, $3, 'engage', $4, true, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [new Date(currentTime + 5000), siteId, sessionId, path,
             cityData.country, cityData.region, cityData.city, cityData.lat, cityData.lon,
             device, browser, os]
          );
          totalEvents++;
        }

        // Occasional custom event
        if (Math.random() < 0.15) {
          const customEvent = pick(customEvents, [10, 30, 15, 10, 10]);
          await client.query(
            `INSERT INTO events (time, site_id, session_id, event, path, country, region, city, latitude, longitude, device, browser, os, properties)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
            [new Date(currentTime + randInt(2000, dwellMs)),
             siteId, sessionId, customEvent, path,
             cityData.country, cityData.region, cityData.city, cityData.lat, cityData.lon,
             device, browser, os,
             JSON.stringify({ source: 'demo' })]
          );
          totalEvents++;
        }

        // Pageleave event
        const leaveTime = currentTime + dwellMs;
        await client.query(
          `INSERT INTO events (time, site_id, session_id, event, path, duration_ms, scroll_max_pct, engaged, country, region, city, latitude, longitude, device, browser, os)
           VALUES ($1, $2, $3, 'pageleave', $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
          [new Date(leaveTime), siteId, sessionId, path, dwellMs, scrollPct, engaged,
           cityData.country, cityData.region, cityData.city, cityData.lat, cityData.lon,
           device, browser, os]
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

  console.log('\n--- Demo credentials -------------------');
  console.log(`  Email:    ${DEMO_EMAIL}`);
  console.log(`  Password: ${DEMO_PASSWORD}`);
  console.log(`  Site:     ${DEMO_SITE_NAME} (${DEMO_DOMAIN})`);
  console.log('----------------------------------------\n');

  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
