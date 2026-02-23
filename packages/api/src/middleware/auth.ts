import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config';
import { redis } from '../db/redis';

export interface AuthUser {
  id: string;
  email?: string;
  jti?: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthUser;
  }
}

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  let token: string | undefined;

  const authHeader = request.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  } else {
    // Accept ?token= query param only for WebSocket live endpoint
    const queryToken = (request.query as Record<string, string>).token;
    if (queryToken && request.url.match(/^\/api\/sites\/[^/]+\/live/)) {
      token = queryToken;
    }
  }

  if (!token) {
    return reply.status(401).send({ error: 'Missing or invalid authorisation header' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    // If the token has a jti, verify the session still exists in Redis
    if (decoded.jti) {
      const exists = await redis.exists(`session:${decoded.jti}`);
      if (!exists) {
        return reply.status(401).send({ error: 'Session has been revoked' });
      }
    }
    request.user = decoded;
  } catch {
    return reply.status(401).send({ error: 'Invalid or expired token' });
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
