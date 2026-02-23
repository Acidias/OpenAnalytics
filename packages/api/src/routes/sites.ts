import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { query } from '../db/connection';
import { authMiddleware } from '../middleware/auth';
import crypto from 'crypto';

const createSiteSchema = z.object({
  domain: z.string().min(1).max(255),
  name: z.string().max(100).optional(),
  settings: z.record(z.unknown()).optional(),
});

const updateSiteSchema = z.object({
  domain: z.string().min(1).max(255).optional(),
  name: z.string().max(100).optional(),
  settings: z.record(z.unknown()).optional(),
});

/** Strip protocol, trailing slashes, and paths so the domain is always a bare hostname */
function normaliseDomain(raw: string): string {
  let d = raw.trim();
  // If it looks like a URL, parse out the hostname
  if (d.includes('://')) {
    try { d = new URL(d).hostname; } catch { /* fall through */ }
  }
  // Strip any remaining path, query, or trailing slashes
  d = d.replace(/\/.*$/, '').replace(/^www\./, '');
  return d;
}

export default async function sitesRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authMiddleware);

  // List sites
  fastify.get('/api/sites', async (request) => {
    const result = await query(
      'SELECT id, domain, name, public_id, settings, created_at FROM sites WHERE user_id = $1 ORDER BY created_at DESC',
      [request.user!.id]
    );
    return { sites: result.rows };
  });

  // Get single site
  fastify.get<{ Params: { id: string } }>('/api/sites/:id', async (request, reply) => {
    const result = await query(
      'SELECT id, domain, name, public_id, settings, created_at FROM sites WHERE id = $1 AND user_id = $2',
      [request.params.id, request.user!.id]
    );
    if (result.rows.length === 0) return reply.status(404).send({ error: 'Site not found' });
    return { site: result.rows[0] };
  });

  // Create site
  fastify.post('/api/sites', async (request, reply) => {
    const parsed = createSiteSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: 'Invalid data', details: parsed.error.issues });

    const domain = normaliseDomain(parsed.data.domain);
    const publicId = crypto.randomBytes(6).toString('base64url').slice(0, 12);
    const result = await query(
      `INSERT INTO sites (user_id, domain, name, public_id, settings)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, domain, name, public_id, settings, created_at`,
      [request.user!.id, domain, parsed.data.name || null, publicId, JSON.stringify(parsed.data.settings || {})]
    );
    return reply.status(201).send({ site: result.rows[0] });
  });

  // Update site
  fastify.patch<{ Params: { id: string } }>('/api/sites/:id', async (request, reply) => {
    const parsed = updateSiteSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: 'Invalid data', details: parsed.error.issues });

    const { id } = request.params;
    const sets: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (parsed.data.domain) { sets.push(`domain = $${idx++}`); values.push(normaliseDomain(parsed.data.domain)); }
    if (parsed.data.name !== undefined) { sets.push(`name = $${idx++}`); values.push(parsed.data.name); }
    if (parsed.data.settings) { sets.push(`settings = $${idx++}`); values.push(JSON.stringify(parsed.data.settings)); }

    if (sets.length === 0) return reply.status(400).send({ error: 'No fields to update' });

    values.push(id, request.user!.id);
    const result = await query(
      `UPDATE sites SET ${sets.join(', ')} WHERE id = $${idx++} AND user_id = $${idx} RETURNING *`,
      values
    );
    if (result.rows.length === 0) return reply.status(404).send({ error: 'Site not found' });
    return { site: result.rows[0] };
  });

  // Delete site
  fastify.delete<{ Params: { id: string } }>('/api/sites/:id', async (request, reply) => {
    const result = await query(
      'DELETE FROM sites WHERE id = $1 AND user_id = $2 RETURNING id',
      [request.params.id, request.user!.id]
    );
    if (result.rows.length === 0) return reply.status(404).send({ error: 'Site not found' });
    return { deleted: true };
  });
}
