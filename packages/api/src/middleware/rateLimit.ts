import { FastifyRequest, FastifyReply } from 'fastify';
import { redis } from '../db/redis';

// Per-site: 200 events/second
async function checkSiteRate(siteId: string): Promise<boolean> {
  const key = `rl:site:${siteId}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, 1);
  return count <= 200;
}

// Per-IP: 60 events/minute
async function checkIpRate(ip: string): Promise<boolean> {
  const key = `rl:ip:${ip}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, 60);
  return count <= 60;
}

// Heartbeat dedup: max 1 per session per 25s
export async function checkHeartbeatDedup(sessionId: string): Promise<boolean> {
  const key = `hb:${sessionId}`;
  const result = await redis.set(key, '1', 'EX', 25, 'NX');
  return result === 'OK';
}

export async function rateLimitMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const body = request.body as { s?: string } | undefined;
  const siteId = body?.s;
  const ip = request.ip;

  if (siteId) {
    const siteOk = await checkSiteRate(siteId);
    if (!siteOk) {
      return reply.status(429).send({ error: 'Site rate limit exceeded' });
    }
  }

  const ipOk = await checkIpRate(ip);
  if (!ipOk) {
    return reply.status(429).send({ error: 'IP rate limit exceeded' });
  }
}
