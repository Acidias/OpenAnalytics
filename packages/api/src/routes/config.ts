import { FastifyInstance } from 'fastify';
import { query } from '../db/connection';

export default async function configRoutes(fastify: FastifyInstance) {
  fastify.get<{ Params: { sitePublicId: string } }>('/api/config/:sitePublicId', async (request, reply) => {
    const { sitePublicId } = request.params;

    const siteResult = await query('SELECT id FROM sites WHERE public_id = $1', [sitePublicId]);
    if (siteResult.rows.length === 0) {
      return reply.status(404).send({ error: 'Site not found' });
    }
    const siteId = siteResult.rows[0].id;

    const rulesResult = await query(
      `SELECT event, selector, trigger, capture_text AS "captureText",
              capture_value AS "captureValue", properties AS props
       FROM auto_track_rules
       WHERE site_id = $1 AND enabled = true
       ORDER BY created_at`,
      [siteId]
    );

    // Cache for 5 minutes
    reply.header('Cache-Control', 'public, max-age=300');
    return { autoTrack: rulesResult.rows };
  });
}
