import { createApplication } from "@specific-dev/framework";
import * as schema from './db/schema/schema.js';
import * as usersRoutes from './routes/users.js';
import * as hazardsRoutes from './routes/hazards.js';
import * as sosRoutes from './routes/sos.js';
import { seedDatabase } from './db/seed.js';

// Create application with schema for full database type support
export const app = await createApplication(schema);

// Export App type for use in route files
export type App = typeof app;

// Register routes
usersRoutes.register(app, app.fastify);
hazardsRoutes.register(app, app.fastify);
sosRoutes.register(app, app.fastify);

// Seed database with demo data
await seedDatabase(app);

await app.run();
app.logger.info('Application running');
