import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { query } from '../db/connection';
import { redis } from '../db/redis';
import { authMiddleware } from '../middleware/auth';
import { checkLoginRate, checkRegisterRate } from '../middleware/rateLimit';
import {
  JWT_SECRET,
  TOKEN_EXPIRY,
  TOKEN_EXPIRY_SECONDS,
  REGISTRATION_ENABLED,
  COMMON_PASSWORDS,
  getDummyHash,
} from '../config';

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

function signToken(userId: string): { token: string; jti: string } {
  const jti = crypto.randomUUID();
  const token = jwt.sign({ id: userId, jti }, JWT_SECRET, {
    expiresIn: TOKEN_EXPIRY,
  });
  return { token, jti };
}

async function storeSession(jti: string): Promise<void> {
  await redis.set(`session:${jti}`, '1', 'EX', TOKEN_EXPIRY_SECONDS);
}

export default async function authRoutes(fastify: FastifyInstance) {
  // Register
  fastify.post('/api/auth/register', async (request, reply) => {
    // Rate limit
    const allowed = await checkRegisterRate(request.ip);
    if (!allowed) {
      return reply.status(429).send({ error: 'Too many registration attempts - please try again later' });
    }

    if (!REGISTRATION_ENABLED) {
      return reply.status(403).send({ error: 'Registration is currently disabled' });
    }

    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) {
      // Hide detailed Zod issues in production
      const isProd = process.env.NODE_ENV === 'production';
      return reply.status(400).send({
        error: 'Invalid data',
        ...(isProd ? {} : { details: parsed.error.issues }),
      });
    }

    const { password, name } = parsed.data;
    const email = parsed.data.email.toLowerCase();

    // Check if user already exists
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
    const { token, jti } = signToken(user.id);
    await storeSession(jti);

    return reply.status(201).send({ user, token });
  });

  // Login
  fastify.post('/api/auth/login', async (request, reply) => {
    // Rate limit
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
      // Timing equalisation - run scrypt against dummy hash so response time
      // is the same whether the user exists or not
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

    const { token, jti } = signToken(user.id);
    await storeSession(jti);
    const { password_hash: _, ...safeUser } = user;

    return { user: safeUser, token };
  });

  // Logout - revoke current session
  fastify.post('/api/auth/logout', { preHandler: authMiddleware }, async (request) => {
    if (request.user?.jti) {
      await redis.del(`session:${request.user.jti}`);
    }
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
    return { user: result.rows[0] };
  });
}
