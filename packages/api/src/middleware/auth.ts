import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';

export interface AuthUser {
  id: string;
  email: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthUser;
  }
}

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  // Accept token from Authorization header or query param (WebSocket
  // connections from browsers cannot set custom headers, so the dashboard
  // passes the token as ?token=xxx for the live endpoint).
  let token: string | undefined;

  const authHeader = request.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  } else {
    const queryToken = (request.query as Record<string, string>).token;
    if (queryToken) {
      token = queryToken;
    }
  }

  if (!token) {
    return reply.status(401).send({ error: 'Missing or invalid authorization header' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    request.user = decoded;
  } catch {
    return reply.status(401).send({ error: 'Invalid or expired token' });
  }
}

export async function verifySiteAccess(request: FastifyRequest, reply: FastifyReply) {
  // Called after authMiddleware — verifies user owns the site
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
