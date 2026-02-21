import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { query } from '../db/connection';
import { authMiddleware, verifySiteAccess } from '../middleware/auth';

const createRuleSchema = z.object({
  name: z.string().min(1).max(100),
  event: z.string().min(1).max(100),
  selector: z.string().min(1).max(500),
  trigger: z.enum(['click', 'submit', 'change', 'focus']).optional().default('click'),
  capture_text: z.boolean().optional().default(false),
  capture_value: z.boolean().optional().default(false),
  properties: z.record(z.unknown()).optional(),
  enabled: z.boolean().optional().default(true),
});

const updateRuleSchema = createRuleSchema.partial();

export default async function autotrackRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authMiddleware);
  fastify.addHook('preHandler', verifySiteAccess);

  // List rules
  fastify.get<{ Params: { id: string } }>('/api/sites/:id/rules', async (request) => {
    const result = await query(
      'SELECT * FROM auto_track_rules WHERE site_id = $1 ORDER BY created_at DESC',
      [request.params.id]
    );
    return { rules: result.rows };
  });

  // Create rule
  fastify.post<{ Params: { id: string } }>('/api/sites/:id/rules', async (request, reply) => {
    const parsed = createRuleSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: 'Invalid data', details: parsed.error.issues });

    const d = parsed.data;
    const result = await query(
      `INSERT INTO auto_track_rules (site_id, name, event, selector, trigger, capture_text, capture_value, properties, enabled)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [request.params.id, d.name, d.event, d.selector, d.trigger, d.capture_text, d.capture_value,
       JSON.stringify(d.properties || {}), d.enabled]
    );
    return reply.status(201).send({ rule: result.rows[0] });
  });

  // Update rule
  fastify.patch<{ Params: { id: string; rid: string } }>('/api/sites/:id/rules/:rid', async (request, reply) => {
    const parsed = updateRuleSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: 'Invalid data', details: parsed.error.issues });

    const d = parsed.data;
    const sets: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    for (const [key, val] of Object.entries(d)) {
      if (val !== undefined) {
        const col = key === 'capture_text' ? 'capture_text' : key === 'capture_value' ? 'capture_value' : key;
        sets.push(`${col} = $${idx++}`);
        values.push(key === 'properties' ? JSON.stringify(val) : val);
      }
    }
    if (sets.length === 0) return reply.status(400).send({ error: 'No fields to update' });

    values.push(request.params.rid, request.params.id);
    const result = await query(
      `UPDATE auto_track_rules SET ${sets.join(', ')} WHERE id = $${idx++} AND site_id = $${idx} RETURNING *`,
      values
    );
    if (result.rows.length === 0) return reply.status(404).send({ error: 'Rule not found' });
    return { rule: result.rows[0] };
  });

  // Delete rule
  fastify.delete<{ Params: { id: string; rid: string } }>('/api/sites/:id/rules/:rid', async (request, reply) => {
    const result = await query(
      'DELETE FROM auto_track_rules WHERE id = $1 AND site_id = $2 RETURNING id',
      [request.params.rid, request.params.id]
    );
    if (result.rows.length === 0) return reply.status(404).send({ error: 'Rule not found' });
    return { deleted: true };
  });
}
