import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { AUTH_COOKIE_NAME, CSRF_COOKIE_NAME, JWT_SECRET } from '../config';
import { redis } from '../db/redis';
import { query } from '../db/connection';

export interface AuthUser {
  id: string;
  email?: string;
  jti?: string;
  type?: 'access' | 'refresh';
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthUser;
  }
}

function getCookieValue(request: FastifyRequest, name: string): string | undefined {
  const cookieHeader = request.headers.cookie;
  if (!cookieHeader) return undefined;

  const cookies = cookieHeader.split(';').map((item) => item.trim());
  for (const cookie of cookies) {
    const [key, ...rest] = cookie.split('=');
    if (key === name) {
      return decodeURIComponent(rest.join('='));
    }
  }

  return undefined;
}

export function readAuthToken(request: FastifyRequest): string | undefined {
  const authHeader = request.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  const cookieToken = getCookieValue(request, AUTH_COOKIE_NAME);
  if (cookieToken) {
    return cookieToken;
  }

  // Accept ?token= query param only for WebSocket live endpoint
  const queryToken = (request.query as Record<string, string>)?.token;
  if (queryToken && request.url.match(/^\/api\/sites\/[^/]+\/live/)) {
    return queryToken;
  }

  return undefined;
}

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  // One-time WebSocket ticket auth for live endpoints
  if (request.url.match(/^\/api\/sites\/[^/]+\/live/)) {
    const ticket = (request.query as Record<string, string> | undefined)?.ticket;
    if (ticket) {
      const payloadRaw = await redis.getdel(`ws_ticket:${ticket}`);
      if (!payloadRaw) {
        return reply.status(401).send({ error: 'Invalid or expired websocket ticket' });
      }
      try {
        const payload = JSON.parse(payloadRaw) as { userId?: string; siteId?: string };
        const requestSiteId = (request.params as { id?: string }).id;
        if (!payload.userId || !payload.siteId || !requestSiteId || payload.siteId !== requestSiteId) {
          return reply.status(401).send({ error: 'Invalid websocket ticket' });
        }
        request.user = { id: payload.userId };
        return;
      } catch {
        return reply.status(401).send({ error: 'Invalid websocket ticket' });
      }
    }
  }

  const token = readAuthToken(request);

  if (!token) {
    return reply.status(401).send({ error: 'Missing authentication token' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;

    if (decoded.type && decoded.type !== 'access') {
      return reply.status(401).send({ error: 'Invalid token type' });
    }

    // If the token has a jti, verify the session still exists in Redis
    if (decoded.jti) {
      const exists = await redis.exists(`session:${decoded.jti}`);
      if (!exists) {
        return reply.status(401).send({ error: 'Session has expired or been revoked' });
      }
    }

    request.user = decoded;
  } catch {
    return reply.status(401).send({ error: 'Invalid or expired token' });
  }
}

export async function csrfProtection(request: FastifyRequest, reply: FastifyReply) {
  const method = request.method.toUpperCase();
  const stateChanging = method === 'POST' || method === 'PATCH' || method === 'PUT' || method === 'DELETE';

  if (!stateChanging) return;

  // Public/bootstrapping endpoints are exempt from CSRF checks.
  if (
    request.url.startsWith('/api/event') ||
    request.url.startsWith('/api/auth/login') ||
    request.url.startsWith('/api/auth/register') ||
    request.url.startsWith('/api/auth/refresh') ||
    request.url.startsWith('/api/public/')
  ) {
    return;
  }

  const csrfCookie = getCookieValue(request, CSRF_COOKIE_NAME);
  const csrfHeader = request.headers['x-csrf-token'];

  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    return reply.status(403).send({ error: 'Invalid CSRF token' });
  }
}

export async function verifySiteAccess(request: FastifyRequest, reply: FastifyReply) {
  // Called after authMiddleware - verifies user owns the site
  const { pool } = await import('../db/connection');
  const siteId = (request.params as { id?: string }).id;
  if (!siteId || !request.user) {
    return reply.status(400).send({ error: 'Missing site ID' });
  }

  const result = await pool.query(
    'SELECT id FROM sites WHERE id = $1 AND user_id = $2',
    [siteId, request.user.id]
  );

  if (result.rows.length === 0) {
    return reply.status(404).send({ error: 'Site not found' });
  }
}

/**
 * Combined auth middleware for routes that should allow unauthenticated
 * read-only access to demo sites. For GET requests targeting a demo site
 * it bypasses auth entirely; for everything else it falls through to
 * the standard authMiddleware + verifySiteAccess flow.
 */
export async function publicDemoAccess(request: FastifyRequest, reply: FastifyReply) {
  const siteId = (request.params as { id?: string }).id;

  if (siteId && request.method === 'GET') {
    const result = await query(
      "SELECT id FROM sites WHERE id = $1 AND settings @> $2",
      [siteId, '{"is_demo": true}']
    );
    if (result.rows.length > 0) {
      request.user = { id: '__public_demo__' };
      return;
    }
  }

  // Normal auth flow for non-demo or non-GET requests
  await authMiddleware(request, reply);
  if (reply.sent) return;
  await verifySiteAccess(request, reply);
}
