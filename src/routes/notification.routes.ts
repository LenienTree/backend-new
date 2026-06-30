import { FastifyInstance } from 'fastify';
import { notificationController } from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth.middleware';

export default async function notificationRoutes(fastify: FastifyInstance) {
    // All notification routes require authentication
    fastify.addHook('preHandler', authenticate);

    // GET /api/notifications?page=1&limit=20
    fastify.get('/', notificationController.getNotifications);

    // GET /api/notifications/unread-count  (lightweight, for polling every 30s)
    fastify.get('/unread-count', notificationController.getUnreadCount);

    // PUT /api/notifications/mark-read  body: { ids: string[] }
    fastify.put('/mark-read', notificationController.markRead);

    // PUT /api/notifications/mark-all-read
    fastify.put('/mark-all-read', notificationController.markAllRead);

    // DELETE /api/notifications/:id
    fastify.delete('/:id', notificationController.deleteNotification);
}
