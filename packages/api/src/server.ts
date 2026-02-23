import './config'; // validate env vars before anything else
import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import fs from 'fs';
import path from 'path';
import { runMigrations } from './db/migrate';
import trackingRoutes from './routes/tracking';
import configRoutes from './routes/config';
import analyticsRoutes from './routes/analytics';
import funnelRoutes from './routes/funnels';
import goalRoutes from './routes/goals';
import sitesRoutes from './routes/sites';
import autotrackRoutes from './routes/autotrack';
import aiSuggestRoutes from './routes/ai-suggest';
import authRoutes from './routes/auth';
import { connectRedis } from './db/redis';

const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';

function parseAndValidateCorsOrigin(origin: string): string {
  let parsed: URL;
  try {
    parsed = new URL(origin);
  } catch {
    throw new Error(`Invalid CORS_ORIGIN entry "${origin}". Expected format: https://example.com[:port]`);
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error(`Invalid CORS_ORIGIN entry "${origin}". Only http:// or https:// origins are allowed.`);
  }

  if (!parsed.hostname) {
    throw new Error(`Invalid CORS_ORIGIN entry "${origin}". Missing hostname.`);
  }

  if (parsed.pathname !== '/' || parsed.search || parsed.hash || parsed.username || parsed.password) {
    throw new Error(
      `Invalid CORS_ORIGIN entry "${origin}". Use origin only (scheme + host + optional port), no path/query/hash/credentials.`
    );
  }

  return parsed.origin;
}

function getCorsAllowedOrigins(isProduction: boolean, dashboardPort: string, logger: ReturnType<typeof Fastify>['log']) {
  const corsOrigin = process.env.CORS_ORIGIN;
  const localOrigin = `http://localhost:${dashboardPort}`;

  if (isProduction && !corsOrigin?.trim()) {
    throw new Error('CORS_ORIGIN must be set in production. Example: CORS_ORIGIN=https://app.yourdomain.com');
  }

  const configuredOrigins = (corsOrigin || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  for (const origin of configuredOrigins) {
    if (origin === '*' || origin.includes('*')) {
      logger.warn(
        `CORS_ORIGIN entry "${origin}" is a wildcard pattern. This is overly broad and should be replaced with explicit origins.`
      );
    }
    if (origin === 'http://0.0.0.0' || origin === 'http://[::]' || origin === 'https://0.0.0.0' || origin === 'https://[::]') {
      logger.warn(`CORS_ORIGIN entry "${origin}" is overly broad. Use a concrete hostname instead.`);
    }
  }

  const validatedOrigins = configuredOrigins.map(parseAndValidateCorsOrigin);

  if (!isProduction && !validatedOrigins.includes(localOrigin)) {
    validatedOrigins.push(localOrigin);
  }

  if (!isProduction && validatedOrigins.length === 0) {
    logger.info(`CORS_ORIGIN not set; allowing local dashboard origin ${localOrigin} for development.`);
    return [localOrigin];
  }

  return [...new Set(validatedOrigins)];
}

// Pre-load tracker script so we don't read from disk on every request
const TRACKER_PATH = path.resolve(__dirname, '../public/oa.js');
let trackerScript: string | null = null;
try {
  trackerScript = fs.readFileSync(TRACKER_PATH, 'utf-8');
} catch {
  // Will be null if tracker isn't built/mounted yet
}

async function main() {
  // Run database migrations before starting the server
  try {
    await runMigrations();
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }

  const fastify = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
    },
    trustProxy: true,
  });

  const isProduction = process.env.NODE_ENV === 'production';
  const dashboardPort = process.env.DASHBOARD_PORT || '3100';
  const allowedOrigins = getCorsAllowedOrigins(isProduction, dashboardPort, fastify.log);

  await fastify.register(cors, {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  });
  await fastify.register(websocket);

  // Routes
  await fastify.register(authRoutes);
  await fastify.register(trackingRoutes);
  await fastify.register(configRoutes);
  await fastify.register(analyticsRoutes);
  await fastify.register(funnelRoutes);
  await fastify.register(goalRoutes);
  await fastify.register(sitesRoutes);
  await fastify.register(autotrackRoutes);
  await fastify.register(aiSuggestRoutes);

  // Serve tracker script
  fastify.get('/oa.js', async (_request, reply) => {
    // Re-read on each request in dev, use cached in prod
    let script = trackerScript;
    if (!script || process.env.NODE_ENV !== 'production') {
      try {
        script = fs.readFileSync(TRACKER_PATH, 'utf-8');
        trackerScript = script;
      } catch {
        return reply.status(404).send('Tracker script not found');
      }
    }
    return reply
      .header('Content-Type', 'application/javascript')
      .header('Cache-Control', 'public, max-age=3600')
      .header('Access-Control-Allow-Origin', '*')
      .send(script);
  });

  // Health check
  fastify.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  // Root - return basic info so visitors don't get a bare 404
  fastify.get('/', async () => ({
    name: 'OpenAnalytics API',
    status: 'ok',
    health: '/health',
    tracker: '/oa.js',
  }));

  // Connect Redis
  try {
    await connectRedis();
    fastify.log.info('Redis connected');
  } catch (err) {
    fastify.log.warn('Redis connection failed, continuing without real-time features');
  }

  // Suppress Fastify's per-interface "Server listening at" lines (e.g. 172.x.x.x)
  // by temporarily raising the log level during listen, then restoring it
  const originalLevel = fastify.log.level;
  fastify.log.level = 'warn';
  await fastify.listen({ port: PORT, host: HOST });
  fastify.log.level = originalLevel;
  console.log('');
  console.log('  OpenAnalytics API ready');
  console.log(`  -> http://localhost:${PORT}`);
  console.log(`  -> Health:  http://localhost:${PORT}/health`);
  console.log(`  -> Tracker: http://localhost:${PORT}/oa.js`);
  console.log('');
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
