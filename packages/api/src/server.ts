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

const BASE_PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';
const MAX_PORT_RETRIES = 10;

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

  // Plugins
  await fastify.register(cors, {
    origin: process.env.CORS_ORIGIN || true,
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

  // Start with auto-increment on port conflict
  let port = BASE_PORT;
  for (let attempt = 0; attempt < MAX_PORT_RETRIES; attempt++) {
    try {
      await fastify.listen({ port, host: HOST });
      console.log('');
      console.log('  OpenAnalytics API ready');
      console.log(`  -> http://localhost:${port}`);
      console.log(`  -> Health:  http://localhost:${port}/health`);
      console.log(`  -> Tracker: http://localhost:${port}/oa.js`);
      console.log('');
      return;
    } catch (err: any) {
      if (err.code === 'EADDRINUSE') {
        fastify.log.warn(`Port ${port} in use, trying ${port + 1}...`);
        port++;
      } else {
        throw err;
      }
    }
  }
  throw new Error(`Could not find an available port (tried ${BASE_PORT}-${port - 1})`);
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
