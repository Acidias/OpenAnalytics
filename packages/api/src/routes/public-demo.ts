import { FastifyInstance } from 'fastify';
import { query } from '../db/connection';

export default async function publicDemoRoutes(fastify: FastifyInstance) {
  // Return the oldest demo site - no auth required
  fastify.get('/api/public/demo', async (_request, reply) => {
    const result = await query(
      "SELECT id, domain, name FROM sites WHERE settings @> $1 ORDER BY created_at ASC LIMIT 1",
      ['{"is_demo": true}']
    );
    if (result.rows.length === 0) {
      return reply.status(404).send({ error: 'No demo site available' });
    }
    return { site: result.rows[0] };
  });
}
