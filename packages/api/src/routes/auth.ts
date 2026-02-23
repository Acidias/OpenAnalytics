import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { query } from '../db/connection';
import { redis } from '../db/redis';
import { authMiddleware } from '../middleware/auth';
import { checkLoginRate, checkRegisterRate } from '../middleware/rateLimit';
import {
  ACCESS_TOKEN_EXPIRY,
  ACCESS_TOKEN_EXPIRY_SECONDS,
  AUTH_COOKIE_NAME,
  COMMON_PASSWORDS,
  CSRF_COOKIE_NAME,
  JWT_SECRET,
  REFRESH_COOKIE_NAME,
  REFRESH_TOKEN_EXPIRY_SECONDS,
  REGISTRATION_ENABLED,
  getDummyHash,
} from '../config';
import { provisionDemoSite } from '../services/provision-demo';

const passwordSchema = z
  .string()
  .min(8)
  .max(128)
  .refine((p) => /[a-zA-Z]/.test(p), {
    message: 'Password must contain at least one letter',
  })
  .refine((p) => /[0-9]/.test(p), {
    message: 'Password must contain at least one number',
  })
  .refine((p) => !COMMON_PASSWORDS.has(p.toLowerCase()), {
    message: 'This password is too common - please choose a stronger one',
  });

const registerSchema = z.object({
  email: z.string().email().max(255),
  password: passwordSchema,
  name: z.string().max(100).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const refreshSchema = z.object({
  refreshToken: z.string().optional(),
});

function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

function verifyPassword(password: string, hash: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const [salt, key] = hash.split(':');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(crypto.timingSafeEqual(Buffer.from(key, 'hex'), derivedKey));
    });
  });
}

function signAccessToken(userId: string): { token: string; jti: string } {
  const jti = crypto.randomUUID();
  const token = jwt.sign({ id: userId, jti, type: 'access' }, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
  return { token, jti };
}

function signRefreshToken(userId: string): { token: string; jti: string } {
  const jti = crypto.randomUUID();
  const token = jwt.sign({ id: userId, jti, type: 'refresh' }, JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY_SECONDS,
  });
  return { token, jti };
}

async function storeSession(jti: string): Promise<void> {
  await redis.set(`session:${jti}`, '1', 'EX', ACCESS_TOKEN_EXPIRY_SECONDS);
}

async function storeRefreshSession(jti: string, userId: string): Promise<void> {
  await redis.set(`refresh:${jti}`, userId, 'EX', REFRESH_TOKEN_EXPIRY_SECONDS);
}

function buildCookie(name: string, value: string, maxAge: number): string {
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
}

function buildCsrfCookie(value: string): string {
  return `${CSRF_COOKIE_NAME}=${encodeURIComponent(value)}; Path=/; Secure; SameSite=Strict; Max-Age=${REFRESH_TOKEN_EXPIRY_SECONDS}`;
}

function clearCookie(name: string, httpOnly = true): string {
  return `${name}=; Path=/; Max-Age=0; ${httpOnly ? 'HttpOnly; ' : ''}Secure; SameSite=Strict`;
}

function readCookie(requestCookieHeader: string | undefined, name: string): string | undefined {
  if (!requestCookieHeader) return undefined;
  const cookies = requestCookieHeader.split(';').map((item) => item.trim());
  for (const cookie of cookies) {
    const [key, ...rest] = cookie.split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return undefined;
}

async function issueSession(reply: { header: (name: string, value: string | string[]) => void }, userId: string) {
  const { token: accessToken, jti: accessJti } = signAccessToken(userId);
  const { token: refreshToken, jti: refreshJti } = signRefreshToken(userId);
  const csrfToken = crypto.randomBytes(32).toString('hex');

  await storeSession(accessJti);
  await storeRefreshSession(refreshJti, userId);

  reply.header('Set-Cookie', [
    buildCookie(AUTH_COOKIE_NAME, accessToken, ACCESS_TOKEN_EXPIRY_SECONDS),
    buildCookie(REFRESH_COOKIE_NAME, refreshToken, REFRESH_TOKEN_EXPIRY_SECONDS),
    buildCsrfCookie(csrfToken),
  ]);

  return { csrfToken };
}

export default async function authRoutes(fastify: FastifyInstance) {
  // Register
  fastify.post('/api/auth/register', async (request, reply) => {
    const allowed = await checkRegisterRate(request.ip);
    if (!allowed) {
      return reply.status(429).send({ error: 'Too many registration attempts - please try again later' });
    }

    if (!REGISTRATION_ENABLED) {
      return reply.status(403).send({ error: 'Registration is currently disabled' });
    }

    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) {
      const isProd = process.env.NODE_ENV === 'production';
      return reply.status(400).send({
        error: 'Invalid data',
        ...(isProd ? {} : { details: parsed.error.issues }),
      });
    }

    const { password, name } = parsed.data;
    const email = parsed.data.email.toLowerCase();

    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return reply.status(409).send({ error: 'An account with this email already exists' });
    }

    const passwordHash = await hashPassword(password);
    const result = await query(
      `INSERT INTO users (email, name, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, email, name, created_at`,
      [email, name || null, passwordHash]
    );

    const user = result.rows[0];
    const { csrfToken } = await issueSession(reply, user.id);

    provisionDemoSite(user.id).catch(() => {});

    return reply.status(201).send({ user, csrfToken });
  });

  // Login
  fastify.post('/api/auth/login', async (request, reply) => {
    const allowed = await checkLoginRate(request.ip);
    if (!allowed) {
      return reply.status(429).send({ error: 'Too many login attempts - please try again later' });
    }

    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid credentials' });
    }

    const email = parsed.data.email.toLowerCase();
    const { password } = parsed.data;

    const result = await query(
      'SELECT id, email, name, password_hash, created_at FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      await verifyPassword(password, getDummyHash());
      return reply.status(401).send({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    if (!user.password_hash) {
      await verifyPassword(password, getDummyHash());
      return reply.status(401).send({ error: 'Invalid email or password' });
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return reply.status(401).send({ error: 'Invalid email or password' });
    }

    const { password_hash: _, ...safeUser } = user;
    const { csrfToken } = await issueSession(reply, user.id);

    provisionDemoSite(user.id).catch(() => {});

    return { user: safeUser, csrfToken };
  });

  // Refresh access token with refresh rotation
  fastify.post('/api/auth/refresh', async (request, reply) => {
    const parsed = refreshSchema.safeParse(request.body || {});
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid refresh payload' });
    }

    const cookieHeader = request.headers.cookie;
    const refreshToken = parsed.data.refreshToken || readCookie(cookieHeader, REFRESH_COOKIE_NAME);

    if (!refreshToken) {
      return reply.status(401).send({ error: 'Missing refresh token' });
    }

    try {
      const decoded = jwt.verify(refreshToken, JWT_SECRET) as { id: string; jti: string; type?: string };
      if (decoded.type !== 'refresh') {
        return reply.status(401).send({ error: 'Invalid token type' });
      }

      const refreshKey = `refresh:${decoded.jti}`;
      const existingUserId = await redis.get(refreshKey);
      if (!existingUserId || existingUserId !== decoded.id) {
        return reply.status(401).send({ error: 'Refresh session has been revoked' });
      }

      // Rotate refresh session: revoke old and issue new access/refresh pair.
      await redis.del(refreshKey);
      const { csrfToken } = await issueSession(reply, decoded.id);
      return { ok: true, csrfToken };
    } catch {
      return reply.status(401).send({ error: 'Invalid or expired refresh token' });
    }
  });

  // Logout - revoke current session
  fastify.post('/api/auth/logout', { preHandler: authMiddleware }, async (request, reply) => {
    if (request.user?.jti) {
      await redis.del(`session:${request.user.jti}`);
    }

    const refreshToken = readCookie(request.headers.cookie, REFRESH_COOKIE_NAME);
    if (refreshToken) {
      try {
        const decoded = jwt.verify(refreshToken, JWT_SECRET) as { jti?: string; type?: string };
        if (decoded.type === 'refresh' && decoded.jti) {
          await redis.del(`refresh:${decoded.jti}`);
        }
      } catch {
        // Ignore invalid refresh token on logout
      }
    }

    reply.header('Set-Cookie', [
      clearCookie(AUTH_COOKIE_NAME),
      clearCookie(REFRESH_COOKIE_NAME),
      clearCookie(CSRF_COOKIE_NAME, false),
    ]);

    return { success: true };
  });

  // Get current user
  fastify.get('/api/auth/me', { preHandler: authMiddleware }, async (request) => {
    const result = await query(
      'SELECT id, email, name, plan, created_at FROM users WHERE id = $1',
      [request.user!.id]
    );
    if (result.rows.length === 0) {
      return { user: null };
    }

    provisionDemoSite(request.user!.id).catch(() => {});

    return { user: result.rows[0] };
  });
}
