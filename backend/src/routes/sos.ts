import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, desc } from 'drizzle-orm';
import * as schema from '../db/schema/schema.js';
import type { App } from '../index.js';
import { v4 as uuidv4 } from 'uuid';

export function register(app: App, fastify: FastifyInstance) {
  fastify.get('/api/sos-requests', {
    schema: {
      description: 'List all SOS requests',
      tags: ['sos'],
      response: {
        200: {
          description: 'List of SOS requests',
          type: 'object',
          properties: {
            requests: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  userId: { type: 'string' },
                  requestType: { type: 'string' },
                  message: { type: 'string' },
                  status: { type: 'string', enum: ['Open', 'Resolved'] },
                  timestamp: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    app.logger.info({}, 'Fetching SOS requests');

    const requests = await app.db
      .select()
      .from(schema.sosRequests)
      .orderBy(desc(schema.sosRequests.timestamp));

    app.logger.info({ count: requests.length }, 'SOS requests retrieved');
    return { requests };
  });

  fastify.post('/api/sos-requests', {
    schema: {
      description: 'Create a new SOS request',
      tags: ['sos'],
      body: {
        type: 'object',
        required: ['user_id', 'request_type', 'message'],
        properties: {
          user_id: { type: 'string' },
          request_type: { type: 'string' },
          message: { type: 'string' },
        },
      },
      response: {
        201: {
          description: 'SOS request created',
          type: 'object',
          properties: {
            id: { type: 'string' },
            userId: { type: 'string' },
            requestType: { type: 'string' },
            message: { type: 'string' },
            status: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  }, async (request: FastifyRequest<{ Body: { user_id: string; request_type: string; message: string } }>, reply: FastifyReply) => {
    app.logger.info({ user_id: request.body.user_id, type: request.body.request_type }, 'Creating SOS request');

    const [created] = await app.db.insert(schema.sosRequests).values({
      id: uuidv4(),
      userId: request.body.user_id,
      requestType: request.body.request_type,
      message: request.body.message,
      status: 'Open',
    }).returning();

    await reply.status(201);
    app.logger.info({ id: created.id }, 'SOS request created');
    return created;
  });

  fastify.patch('/api/sos-requests/:id/resolve', {
    schema: {
      description: 'Resolve an SOS request',
      tags: ['sos'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
      response: {
        200: {
          description: 'SOS request resolved',
          type: 'object',
          properties: {
            id: { type: 'string' },
            userId: { type: 'string' },
            requestType: { type: 'string' },
            message: { type: 'string' },
            status: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
        404: {
          description: 'SOS request not found',
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    app.logger.info({ id: request.params.id }, 'Resolving SOS request');

    const updated = await app.db
      .update(schema.sosRequests)
      .set({ status: 'Resolved' })
      .where(eq(schema.sosRequests.id, request.params.id))
      .returning();

    if (updated.length === 0) {
      app.logger.warn({ id: request.params.id }, 'SOS request not found for resolve');
      await reply.status(404).send({ error: 'SOS request not found' });
      return;
    }

    const [updatedRequest] = updated;
    app.logger.info({ id: updatedRequest.id, status: updatedRequest.status }, 'SOS request resolved');
    return updatedRequest;
  });
}
