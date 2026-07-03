import { pgTable, text, integer, real, timestamp, pgEnum } from 'drizzle-orm/pg-core';

export const hazardCategoryEnum = pgEnum('hazard_category', ['Flooding', 'Open Pothole', 'Power Grid Down', 'Fallen Tree']);
export const sosStatusEnum = pgEnum('sos_status', ['Open', 'Resolved']);

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone'),
  latitude: real('latitude'),
  longitude: real('longitude'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const hazardReports = pgTable('hazard_reports', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  category: hazardCategoryEnum('category').notNull(),
  severityLevel: integer('severity_level').notNull(),
  description: text('description'),
  imageUrl: text('image_url'),
  latitude: real('latitude').notNull(),
  longitude: real('longitude').notNull(),
  upvotesCount: integer('upvotes_count').default(0).notNull(),
  timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
});

export const sosRequests = pgTable('sos_requests', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  requestType: text('request_type').notNull(),
  message: text('message').notNull(),
  status: sosStatusEnum('status').default('Open').notNull(),
  timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
});
