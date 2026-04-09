import { FastifyInstance } from 'fastify';
import { bookmarkController } from '../controllers/organizer.controller';
import { authenticate } from '../middleware/auth.middleware';

export default async function bookmarkRoutes(fastify: FastifyInstance) {
    // ── Bookmarks ─────────────────────────────────────────────────────────────────

    // POST /api/bookmarks/:id/toggle
    fastify.post('/:id/toggle', {
        preHandler: authenticate,
        handler: bookmarkController.toggle
    });

    // GET /api/bookmarks
    fastify.get('/', {
        preHandler: authenticate,
        handler: bookmarkController.getBookmarks
    });
}

