import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, sql, desc } from 'drizzle-orm';
import * as schema from '../db/schema/schema.js';
import type { App } from '../index.js';
import { v4 as uuidv4 } from 'uuid';

const EARTH_RADIUS_KM = 6371;

export function register(app: App, fastify: FastifyInstance) {
  fastify.get('/api/hazard-reports', {
    schema: {
      description: 'List hazard reports with optional geolocation filtering',
      tags: ['hazards'],
      querystring: {
        type: 'object',
        properties: {
          lat: { type: 'number', description: 'Latitude for radius filter' },
          lng: { type: 'number', description: 'Longitude for radius filter' },
          radius_km: { type: 'number', description: 'Radius in kilometers' },
        },
      },
      response: {
        200: {
          description: 'List of hazard reports',
          type: 'object',
          properties: {
            reports: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  userId: { type: 'string' },
                  category: { type: 'string', enum: ['Flooding', 'Open Pothole', 'Power Grid Down', 'Fallen Tree'] },
                  severityLevel: { type: 'integer' },
                  description: { type: 'string' },
                  imageUrl: { type: 'string' },
                  latitude: { type: 'number' },
                  longitude: { type: 'number' },
                  upvotesCount: { type: 'integer' },
                  timestamp: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
      },
    },
  }, async (request: FastifyRequest<{ Querystring: { lat?: string; lng?: string; radius_km?: string } }>, reply: FastifyReply) => {
    const lat = request.query.lat ? parseFloat(request.query.lat) : undefined;
    const lng = request.query.lng ? parseFloat(request.query.lng) : undefined;
    const radiusKm = request.query.radius_km ? parseFloat(request.query.radius_km) : undefined;

    app.logger.info({ lat, lng, radius_km: radiusKm }, 'Fetching hazard reports');

    let reports;

    if (lat !== undefined && lng !== undefined && radiusKm !== undefined) {
      const haversineSql = sql`
        2 * ${EARTH_RADIUS_KM} * asin(sqrt(
          pow(sin(radians((${schema.hazardReports.latitude} - ${lat}) / 2)), 2) +
          cos(radians(${lat})) * cos(radians(${schema.hazardReports.latitude})) *
          pow(sin(radians((${schema.hazardReports.longitude} - ${lng}) / 2)), 2)
        ))
      `;
      reports = await app.db
        .select()
        .from(schema.hazardReports)
        .where(sql`${haversineSql} <= ${radiusKm}`)
        .orderBy(desc(schema.hazardReports.timestamp));
    } else {
      reports = await app.db
        .select()
        .from(schema.hazardReports)
        .orderBy(desc(schema.hazardReports.timestamp));
    }

    app.logger.info({ count: reports.length }, 'Hazard reports retrieved');
    return { reports };
  });

  fastify.post('/api/hazard-reports', {
    schema: {
      description: 'Create a new hazard report',
      tags: ['hazards'],
      body: {
        type: 'object',
        required: ['userId', 'category', 'severityLevel', 'latitude', 'longitude'],
        properties: {
          userId: { type: 'string' },
          category: { type: 'string', enum: ['Flooding', 'Open Pothole', 'Power Grid Down', 'Fallen Tree'] },
          severityLevel: { type: 'integer', minimum: 1, maximum: 5 },
          description: { type: 'string', nullable: true },
          imageUrl: { type: 'string', nullable: true },
          latitude: { type: 'number' },
          longitude: { type: 'number' },
        },
      },
      response: {
        201: {
          description: 'Hazard report created',
          type: 'object',
          properties: {
            id: { type: 'string' },
            userId: { type: 'string' },
            category: { type: 'string' },
            severityLevel: { type: 'integer' },
            description: { type: 'string' },
            imageUrl: { type: 'string' },
            latitude: { type: 'number' },
            longitude: { type: 'number' },
            upvotesCount: { type: 'integer' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  }, async (request: FastifyRequest<{ Body: { userId: string; category: string; severityLevel: number; description?: string; imageUrl?: string; latitude: number; longitude: number } }>, reply: FastifyReply) => {
    app.logger.info({ userId: request.body.userId, category: request.body.category }, 'Creating hazard report');

    const [created] = await app.db.insert(schema.hazardReports).values({
      id: uuidv4(),
      userId: request.body.userId,
      category: request.body.category as any,
      severityLevel: request.body.severityLevel,
      description: request.body.description,
      imageUrl: request.body.imageUrl,
      latitude: request.body.latitude,
      longitude: request.body.longitude,
    }).returning();

    await reply.status(201);
    app.logger.info({ id: created.id }, 'Hazard report created');
    return created;
  });

  fastify.post('/api/hazard-reports/:id/upvote', {
    schema: {
      description: 'Upvote a hazard report',
      tags: ['hazards'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
      response: {
        200: {
          description: 'Upvote recorded',
          type: 'object',
          properties: {
            id: { type: 'string' },
            upvotesCount: { type: 'integer' },
          },
        },
        404: {
          description: 'Hazard report not found',
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    app.logger.info({ id: request.params.id }, 'Processing upvote');

    const updated = await app.db
      .update(schema.hazardReports)
      .set({ upvotesCount: sql`upvotes_count + 1` })
      .where(eq(schema.hazardReports.id, request.params.id))
      .returning();

    if (updated.length === 0) {
      app.logger.warn({ id: request.params.id }, 'Hazard report not found for upvote');
      await reply.status(404).send({ error: 'Hazard report not found' });
      return;
    }

    const [updatedReport] = updated;
    app.logger.info({ id: updatedReport.id, upvotes: updatedReport.upvotesCount }, 'Hazard upvoted');
    return { id: updatedReport.id, upvotesCount: updatedReport.upvotesCount };
  });
}
