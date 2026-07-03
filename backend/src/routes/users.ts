import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as schema from '../db/schema/schema.js';
import type { App } from '../index.js';

export function register(app: App, fastify: FastifyInstance) {
  fastify.post('/api/users/profile', {
    schema: {
      description: 'Upsert user profile',
      tags: ['users'],
      body: {
        type: 'object',
        required: ['id', 'name'],
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          phone: { type: 'string', nullable: true },
          latitude: { type: 'number', nullable: true },
          longitude: { type: 'number', nullable: true },
        },
      },
      response: {
        200: {
          description: 'User profile created or updated',
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            phone: { type: 'string' },
            latitude: { type: 'number' },
            longitude: { type: 'number' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  }, async (request: FastifyRequest<{ Body: { id: string; name: string; phone?: string; latitude?: number; longitude?: number } }>, reply: FastifyReply) => {
    app.logger.info({ id: request.body.id, name: request.body.name }, 'Upserting user profile');

    const [upserted] = await app.db
      .insert(schema.users)
      .values(request.body)
      .onConflictDoUpdate({
        target: schema.users.id,
        set: {
          name: request.body.name,
          phone: request.body.phone,
          latitude: request.body.latitude,
          longitude: request.body.longitude,
        },
      })
      .returning();

    app.logger.info({ id: upserted.id }, 'User profile upserted');
    return upserted;
  });
}
