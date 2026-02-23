import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { query, getClient } from '../db/connection';
import { authMiddleware, verifySiteAccess } from '../middleware/auth';

const stepSchema = z.object({
  position: z.number().int().positive(),
  name: z.string().min(1).max(200),
  match_type: z.enum(['pageview', 'event']),
  match_path: z.string().max(500).optional(),
  match_event: z.string().max(100).optional(),
  match_props: z.record(z.unknown()).optional(),
  timeout_ms: z.number().int().positive().optional().default(1800000),
});

const createFunnelSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  steps: z.array(stepSchema).min(2),
});

export default async function funnelRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authMiddleware);
  fastify.addHook('preHandler', verifySiteAccess);

  // List funnels
  fastify.get<{ Params: { id: string } }>('/api/sites/:id/funnels', async (request) => {
    const result = await query(
      `SELECT f.*, json_agg(fs ORDER BY fs.position) AS steps
       FROM funnels f
       LEFT JOIN funnel_steps fs ON fs.funnel_id = f.id
       WHERE f.site_id = $1
       GROUP BY f.id ORDER BY f.created_at DESC`,
      [request.params.id]
    );
    return { funnels: result.rows };
  });

  // Create funnel
  fastify.post<{ Params: { id: string } }>('/api/sites/:id/funnels', async (request, reply) => {
    const parsed = createFunnelSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: 'Invalid data', details: parsed.error.issues });

    const client = await getClient();
    try {
      await client.query('BEGIN');
      const funnel = await client.query(
        'INSERT INTO funnels (site_id, name, description) VALUES ($1, $2, $3) RETURNING *',
        [request.params.id, parsed.data.name, parsed.data.description || null]
      );
      const funnelId = funnel.rows[0].id;

      for (const step of parsed.data.steps) {
        await client.query(
          `INSERT INTO funnel_steps (funnel_id, position, name, match_type, match_path, match_event, match_props, timeout_ms)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [funnelId, step.position, step.name, step.match_type, step.match_path || null,
           step.match_event || null, step.match_props ? JSON.stringify(step.match_props) : null, step.timeout_ms]
        );
      }
      await client.query('COMMIT');
      return reply.status(201).send({ funnel: funnel.rows[0] });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  });

  // Update funnel
  fastify.patch<{ Params: { id: string; fid: string } }>('/api/sites/:id/funnels/:fid', async (request, reply) => {
    const body = request.body as { name?: string; description?: string };
    const result = await query(
      'UPDATE funnels SET name = COALESCE($1, name), description = COALESCE($2, description) WHERE id = $3 AND site_id = $4 RETURNING *',
      [body.name || null, body.description || null, request.params.fid, request.params.id]
    );
    if (result.rows.length === 0) return reply.status(404).send({ error: 'Funnel not found' });
    return { funnel: result.rows[0] };
  });

  // Delete funnel
  fastify.delete<{ Params: { id: string; fid: string } }>('/api/sites/:id/funnels/:fid', async (request, reply) => {
    const result = await query('DELETE FROM funnels WHERE id = $1 AND site_id = $2 RETURNING id', [request.params.fid, request.params.id]);
    if (result.rows.length === 0) return reply.status(404).send({ error: 'Funnel not found' });
    return { deleted: true };
  });

  // Funnel analysis
  fastify.get<{ Params: { id: string; fid: string }; Querystring: Record<string, string> }>('/api/sites/:id/funnels/:fid', async (request, reply) => {
    const { id, fid } = request.params;
    const from = request.query.from || new Date(Date.now() - 30 * 86400000).toISOString();
    const to = request.query.to || new Date().toISOString();

    // Get funnel name (also serves as 404 check)
    const funnelResult = await query(
      'SELECT name FROM funnels WHERE id = $1 AND site_id = $2', [fid, id]
    );
    if (funnelResult.rows.length === 0) return reply.status(404).send({ error: 'Funnel not found' });
    const funnelName = funnelResult.rows[0].name;

    // Get funnel steps
    const stepsResult = await query(
      'SELECT * FROM funnel_steps WHERE funnel_id = $1 ORDER BY position', [fid]
    );
    const steps = stepsResult.rows;
    if (steps.length < 2) return reply.status(400).send({ error: 'Funnel needs at least 2 steps' });

    // Build dynamic CTE query
    const ctes: string[] = [];
    const params: unknown[] = [id, from, to];
    let paramIdx = 4;

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const stepName = `step${i + 1}`;

      if (i === 0) {
        // First step: find matching events
        let condition: string;
        if (step.match_type === 'pageview') {
          condition = `event = 'pageview' AND path = $${paramIdx++}`;
          params.push(step.match_path);
        } else {
          condition = `event = $${paramIdx++}`;
          params.push(step.match_event);
        }
        ctes.push(
          `${stepName} AS (
            SELECT DISTINCT session_id, MIN(time) AS step_time
            FROM events
            WHERE site_id = $1 AND ${condition} AND time BETWEEN $2 AND $3
            GROUP BY session_id
          )`
        );
      } else {
        const prevStep = `step${i}`;
        const timeoutInterval = `${step.timeout_ms || 1800000} milliseconds`;
        let condition: string;
        if (step.match_type === 'pageview') {
          condition = `e.event = 'pageview' AND e.path = $${paramIdx++}`;
          params.push(step.match_path);
        } else {
          condition = `e.event = $${paramIdx++}`;
          params.push(step.match_event);
        }
        ctes.push(
          `${stepName} AS (
            SELECT DISTINCT prev.session_id, MIN(e.time) AS step_time
            FROM ${prevStep} prev
            JOIN events e ON e.session_id = prev.session_id
              AND e.site_id = $1
              AND ${condition}
              AND e.time > prev.step_time
              AND e.time < prev.step_time + INTERVAL '${timeoutInterval}'
            GROUP BY prev.session_id
          )`
        );
      }
    }

    // Build final SELECT
    const countSelects = steps.map((_: unknown, i: number) => `(SELECT COUNT(*) FROM step${i + 1}) AS step${i + 1}_count`);
    const conversionSelects: string[] = [];
    for (let i = 1; i < steps.length; i++) {
      conversionSelects.push(
        `ROUND((SELECT COUNT(*) FROM step${i + 1})::numeric / NULLIF((SELECT COUNT(*) FROM step${i}), 0) * 100, 1) AS step${i}_to_${i + 1}_pct`
      );
    }
    conversionSelects.push(
      `ROUND((SELECT COUNT(*) FROM step${steps.length})::numeric / NULLIF((SELECT COUNT(*) FROM step1), 0) * 100, 1) AS overall_conversion_pct`
    );

    // Compute average time between consecutive steps
    const avgTimeSelects: string[] = [];
    for (let i = 1; i < steps.length; i++) {
      avgTimeSelects.push(
        `(SELECT ROUND(AVG(EXTRACT(EPOCH FROM (s${i + 1}.step_time - s${i}.step_time)) * 1000)) FROM step${i} s${i} JOIN step${i + 1} s${i + 1} ON s${i}.session_id = s${i + 1}.session_id) AS step${i + 1}_avg_time_ms`
      );
    }

    const allSelects = [...countSelects, ...conversionSelects, ...avgTimeSelects];
    const sql = `WITH ${ctes.join(',\n')} SELECT ${allSelects.join(', ')}`;
    const result = await query(sql, params);

    return {
      funnel_id: fid,
      funnel_name: funnelName,
      steps: steps.map((s: Record<string, unknown>, i: number) => ({
        position: s.position,
        name: s.name,
        count: parseInt(result.rows[0][`step${i + 1}_count`], 10),
        avg_time_ms: i === 0 ? null : (result.rows[0][`step${i + 1}_avg_time_ms`] != null ? Number(result.rows[0][`step${i + 1}_avg_time_ms`]) : null),
      })),
      conversions: result.rows[0],
    };
  });
}
