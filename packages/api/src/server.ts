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

const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';

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

  // Start
  await fastify.listen({ port: PORT, host: HOST });
  fastify.log.info(`OpenAnalytics API running on ${HOST}:${PORT}`);
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
