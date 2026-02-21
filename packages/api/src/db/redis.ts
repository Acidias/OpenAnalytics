import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 200, 5000);
    return delay;
  },
  lazyConnect: true,
});

// Separate connection for pub/sub (Redis requires dedicated connections for subscribers)
export const redisSub = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    return Math.min(times * 200, 5000);
  },
  lazyConnect: true,
});

redis.on('error', (err) => {
  console.error('Redis error:', err.message);
});

redisSub.on('error', (err) => {
  console.error('Redis sub error:', err.message);
});

export async function connectRedis() {
  await redis.connect();
  await redisSub.connect();
}
