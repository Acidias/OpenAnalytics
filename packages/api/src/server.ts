import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import trackingRoutes from './routes/tracking';
import configRoutes from './routes/config';
import analyticsRoutes from './routes/analytics';
import funnelRoutes from './routes/funnels';
import goalRoutes from './routes/goals';
import sitesRoutes from './routes/sites';
import autotrackRoutes from './routes/autotrack';
import { connectRedis } from './db/redis';

const BASE_PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';
const MAX_PORT_RETRIES = 10;

async function main() {
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
  await fastify.register(trackingRoutes);
  await fastify.register(configRoutes);
  await fastify.register(analyticsRoutes);
  await fastify.register(funnelRoutes);
  await fastify.register(goalRoutes);
  await fastify.register(sitesRoutes);
  await fastify.register(autotrackRoutes);

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
      fastify.log.info(`OpenAnalytics API running on ${HOST}:${port}`);
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
