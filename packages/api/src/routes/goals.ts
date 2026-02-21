import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { query } from '../db/connection';
import { authMiddleware, verifySiteAccess } from '../middleware/auth';

const createGoalSchema = z.object({
  name: z.string().min(1).max(200),
  match_type: z.enum(['pageview', 'event']),
  match_path: z.string().max(500).optional(),
  match_event: z.string().max(100).optional(),
  match_props: z.record(z.unknown()).optional(),
});

export default async function goalRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authMiddleware);
  fastify.addHook('preHandler', verifySiteAccess);

  // List goals with completion rates
  fastify.get<{ Params: { id: string }; Querystring: Record<string, string> }>('/api/sites/:id/goals', async (request) => {
    const { id } = request.params;
    const from = request.query.from || new Date(Date.now() - 30 * 86400000).toISOString();
    const to = request.query.to || new Date().toISOString();

    const goalsResult = await query('SELECT * FROM goals WHERE site_id = $1 ORDER BY created_at DESC', [id]);
    const totalSessions = await query(
      'SELECT COUNT(DISTINCT session_id) AS total FROM events WHERE site_id = $1 AND time BETWEEN $2 AND $3',
      [id, from, to]
    );
    const total = parseInt(totalSessions.rows[0].total, 10);

    const goals = await Promise.all(
      goalsResult.rows.map(async (goal: Record<string, unknown>) => {
        let condition: string;
        const params: unknown[] = [id, from, to];
        if (goal.match_type === 'pageview') {
          condition = `event = 'pageview' AND path = $4`;
          params.push(goal.match_path);
        } else {
          condition = `event = $4`;
          params.push(goal.match_event);
        }

        const completions = await query(
          `SELECT COUNT(DISTINCT session_id) AS completions
           FROM events WHERE site_id = $1 AND time BETWEEN $2 AND $3 AND ${condition}`,
          params
        );
        const count = parseInt(completions.rows[0].completions, 10);
        return {
          ...goal,
          completions: count,
          conversion_rate: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
        };
      })
    );

    return { goals, total_sessions: total };
  });

  // Create goal
  fastify.post<{ Params: { id: string } }>('/api/sites/:id/goals', async (request, reply) => {
    const parsed = createGoalSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: 'Invalid data', details: parsed.error.issues });

    const result = await query(
      `INSERT INTO goals (site_id, name, match_type, match_path, match_event, match_props)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [request.params.id, parsed.data.name, parsed.data.match_type,
       parsed.data.match_path || null, parsed.data.match_event || null,
       parsed.data.match_props ? JSON.stringify(parsed.data.match_props) : null]
    );
    return reply.status(201).send({ goal: result.rows[0] });
  });

  // Delete goal
  fastify.delete<{ Params: { id: string; gid: string } }>('/api/sites/:id/goals/:gid', async (request, reply) => {
    const result = await query('DELETE FROM goals WHERE id = $1 AND site_id = $2 RETURNING id', [request.params.gid, request.params.id]);
    if (result.rows.length === 0) return reply.status(404).send({ error: 'Goal not found' });
    return { deleted: true };
  });
}
