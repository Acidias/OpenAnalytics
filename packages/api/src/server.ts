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
import authRoutes from './routes/auth';
import { connectRedis } from './db/redis';

const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';

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

  // Plugins - CORS_ORIGIN supports comma-separated origins (e.g. "https://yourdomain.com,https://www.yourdomain.com")
  // The localhost dashboard origin is always allowed so admin access works
  // regardless of what external origins are configured.
  const corsOrigin = process.env.CORS_ORIGIN;
  let allowedOrigins: string[] | true = true;
  if (corsOrigin) {
    const dashboardPort = process.env.DASHBOARD_PORT || '3100';
    const localOrigin = `http://localhost:${dashboardPort}`;
    const origins = corsOrigin.split(',').map((o) => o.trim()).filter(Boolean);
    if (!origins.includes(localOrigin)) {
      origins.push(localOrigin);
    }
    allowedOrigins = origins;
  }
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
