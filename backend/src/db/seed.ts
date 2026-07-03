import * as schema from './schema/schema.js';
import type { App } from '../index.js';

export async function seedDatabase(app: App) {
  const users = [
    { id: 'user-001', name: 'Arjun Sharma', phone: '+91-9876543210', latitude: 19.076, longitude: 72.8777 },
    { id: 'user-002', name: 'Priya Patel', phone: '+91-9823456789', latitude: 19.0896, longitude: 72.8656 },
    { id: 'user-003', name: 'Rahul Desai', phone: '+91-9712345678', latitude: 19.0544, longitude: 72.8322 },
    { id: 'user-004', name: 'Sneha Kulkarni', phone: '+91-9654321098', latitude: 19.1136, longitude: 72.8697 },
    { id: 'user-005', name: 'Vikram Nair', phone: '+91-9587654321', latitude: 19.033, longitude: 72.8478 },
  ];

  const hazards = [
    { id: 'hazard-001', userId: 'user-001', category: 'Flooding' as const, severityLevel: 5, description: 'Severe flooding on SV Road near Andheri station. Water level above knee height, traffic completely blocked.', imageUrl: 'https://picsum.photos/seed/hazard1/400/300', latitude: 19.1197, longitude: 72.8464, upvotesCount: 24 },
    { id: 'hazard-002', userId: 'user-002', category: 'Open Pothole' as const, severityLevel: 3, description: 'Large pothole on Western Express Highway near Bandra. Caused two accidents this morning.', imageUrl: 'https://picsum.photos/seed/hazard2/400/300', latitude: 19.0544, longitude: 72.8402, upvotesCount: 11 },
    { id: 'hazard-003', userId: 'user-003', category: 'Power Grid Down' as const, severityLevel: 4, description: 'Complete power outage in Dharavi area. Transformer blown due to waterlogging.', imageUrl: 'https://picsum.photos/seed/hazard3/400/300', latitude: 19.0422, longitude: 72.8553, upvotesCount: 18 },
    { id: 'hazard-004', userId: 'user-004', category: 'Fallen Tree' as const, severityLevel: 2, description: 'Medium-sized tree fallen on footpath near Juhu Beach. Blocking pedestrian path.', imageUrl: 'https://picsum.photos/seed/hazard4/400/300', latitude: 19.0989, longitude: 72.8262, upvotesCount: 5 },
    { id: 'hazard-005', userId: 'user-005', category: 'Flooding' as const, severityLevel: 4, description: 'Underpass at Hindmata completely submerged. Vehicles stranded, rescue teams needed.', imageUrl: 'https://picsum.photos/seed/hazard5/400/300', latitude: 19.0176, longitude: 72.831, upvotesCount: 31 },
    { id: 'hazard-006', userId: 'user-001', category: 'Open Pothole' as const, severityLevel: 1, description: 'Small pothole near Dadar TT circle. Minor but needs attention before it worsens.', imageUrl: 'https://picsum.photos/seed/hazard6/400/300', latitude: 19.0178, longitude: 72.8478, upvotesCount: 3 },
    { id: 'hazard-007', userId: 'user-002', category: 'Power Grid Down' as const, severityLevel: 5, description: 'Major substation failure in Kurla. Entire sector without power for 6+ hours.', imageUrl: 'https://picsum.photos/seed/hazard7/400/300', latitude: 19.0728, longitude: 72.8826, upvotesCount: 42 },
    { id: 'hazard-008', userId: 'user-003', category: 'Fallen Tree' as const, severityLevel: 4, description: 'Large banyan tree uprooted on LBS Marg blocking two lanes. Emergency services on site.', imageUrl: 'https://picsum.photos/seed/hazard8/400/300', latitude: 19.0825, longitude: 72.8714, upvotesCount: 15 },
    { id: 'hazard-009', userId: 'user-004', category: 'Flooding' as const, severityLevel: 3, description: 'Moderate flooding in Sion area. Water entering ground floor shops.', imageUrl: 'https://picsum.photos/seed/hazard9/400/300', latitude: 19.039, longitude: 72.8619, upvotesCount: 9 },
    { id: 'hazard-010', userId: 'user-005', category: 'Open Pothole' as const, severityLevel: 5, description: 'Massive crater on Eastern Express Highway near Ghatkopar. Extremely dangerous, multiple accidents.', imageUrl: 'https://picsum.photos/seed/hazard10/400/300', latitude: 19.086, longitude: 72.9081, upvotesCount: 37 },
    { id: 'hazard-011', userId: 'user-001', category: 'Fallen Tree' as const, severityLevel: 1, description: 'Small branch fallen near Aarey Colony entrance. Minor obstruction on side road.', imageUrl: 'https://picsum.photos/seed/hazard11/400/300', latitude: 19.1526, longitude: 72.8697, upvotesCount: 2 },
    { id: 'hazard-012', userId: 'user-002', category: 'Power Grid Down' as const, severityLevel: 2, description: 'Street lights out on Linking Road, Bandra. Safety concern for pedestrians at night.', imageUrl: 'https://picsum.photos/seed/hazard12/400/300', latitude: 19.0607, longitude: 72.8362, upvotesCount: 7 },
  ];

  const sos = [
    { id: 'sos-001', userId: 'user-001', requestType: 'Rescue', message: 'Family of 4 stranded on rooftop in Kurla West. Water level rising rapidly. Need immediate rescue.', status: 'Open' as const },
    { id: 'sos-002', userId: 'user-002', requestType: 'Medical', message: 'Elderly woman with heart condition needs urgent medical help. Roads flooded, ambulance cannot reach.', status: 'Open' as const },
    { id: 'sos-003', userId: 'user-003', requestType: 'Food & Water', message: 'Community of 30 people in Dharavi shelter without food and clean water for 2 days.', status: 'Resolved' as const },
    { id: 'sos-004', userId: 'user-004', requestType: 'Shelter', message: 'Lost home due to flooding. Single mother with 2 children needs emergency shelter in Andheri area.', status: 'Open' as const },
    { id: 'sos-005', userId: 'user-005', requestType: 'Medical', message: 'Diabetic patient ran out of insulin. Cannot reach pharmacy due to waterlogged roads.', status: 'Resolved' as const },
    { id: 'sos-006', userId: 'user-001', requestType: 'Food & Water', message: 'Elderly couple in Sion unable to leave house for 3 days. Need food and water supplies.', status: 'Open' as const },
  ];

  try {
    // Check if seed data already exists
    const existingUsers = await app.db.select().from(schema.users).limit(1);

    if (existingUsers.length === 0) {
      for (const u of users) {
        await app.db.insert(schema.users).values(u).onConflictDoNothing();
      }
      app.logger.info({ count: users.length }, 'Seeded users');

      for (const h of hazards) {
        await app.db.insert(schema.hazardReports).values(h).onConflictDoNothing();
      }
      app.logger.info({ count: hazards.length }, 'Seeded hazard reports');

      for (const s of sos) {
        await app.db.insert(schema.sosRequests).values(s).onConflictDoNothing();
      }
      app.logger.info({ count: sos.length }, 'Seeded SOS requests');
    } else {
      app.logger.debug({}, 'Seed data already exists, skipping');
    }
  } catch (error) {
    app.logger.warn({ err: error }, 'Error during seed process');
  }
}
