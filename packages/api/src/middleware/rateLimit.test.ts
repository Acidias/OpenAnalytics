import Fastify, { type FastifyServerOptions } from 'fastify';
import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { rateLimitMiddleware } from './rateLimit';
import { redis } from '../db/redis';

type TrustProxyValue = FastifyServerOptions['trustProxy'];

const originalIncr = redis.incr;
const originalExpire = redis.expire;

function mockRedisRateLimitStore() {
  const store = new Map<string, number>();

  (redis as unknown as { incr: (key: string) => Promise<number> }).incr = async (key: string) => {
    const nextValue = (store.get(key) ?? 0) + 1;
    store.set(key, nextValue);
    return nextValue;
  };

  (redis as unknown as { expire: (key: string, seconds: number) => Promise<number> }).expire = async () => 1;
}

afterEach(() => {
  (redis as unknown as { incr: typeof originalIncr }).incr = originalIncr;
  (redis as unknown as { expire: typeof originalExpire }).expire = originalExpire;
});

async function runSpoofAttemptScenario({ trustProxy, remoteAddress }: { trustProxy: TrustProxyValue; remoteAddress?: string }) {
  mockRedisRateLimitStore();

  const app = Fastify({ trustProxy });
  app.post('/api/event', { preHandler: rateLimitMiddleware }, async () => ({ ok: true }));

  const statuses: number[] = [];

  for (let i = 0; i < 61; i += 1) {
    const response = await app.inject({
      method: 'POST',
      url: '/api/event',
      payload: { s: 'site_123' },
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': `203.0.113.${i}`,
      },
      remoteAddress,
    });
    statuses.push(response.statusCode);
  }

  await app.close();
  return statuses;
}

describe('rateLimitMiddleware and X-Forwarded-For spoofing', () => {
  it('blocks spoof attempts when trustProxy is disabled', async () => {
    const statuses = await runSpoofAttemptScenario({ trustProxy: false });

    assert.equal(statuses.at(-1), 429);
  });

  it('can be bypassed when trustProxy=true without trusted proxy config', async () => {
    const statuses = await runSpoofAttemptScenario({
      trustProxy: true,
      remoteAddress: '198.51.100.10',
    });

    assert.equal(statuses.at(-1), 200);
  });

  it('blocks spoof attempts when trusted proxy subnets do not include sender', async () => {
    const statuses = await runSpoofAttemptScenario({
      trustProxy: ['127.0.0.1/8'],
      remoteAddress: '198.51.100.10',
    });

    assert.equal(statuses.at(-1), 429);
  });
});
