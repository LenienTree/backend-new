import { FastifyInstance } from 'fastify';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import eventRoutes from './event.routes';
import adminRoutes from './admin.routes';
import bookmarkRoutes from './bookmark.routes';
import organizerRoutes from './organizer.routes';
import healthRoutes from './health.routes';

export default async function routes(fastify: FastifyInstance) {
    fastify.register(authRoutes, { prefix: '/auth' });
    fastify.register(userRoutes, { prefix: '/users' });
    fastify.register(eventRoutes, { prefix: '/events' });
    fastify.register(adminRoutes, { prefix: '/admin' });
    fastify.register(bookmarkRoutes, { prefix: '/bookmarks' });
    fastify.register(organizerRoutes, { prefix: '/organizer' });
    fastify.register(healthRoutes, { prefix: '/health' });
}
