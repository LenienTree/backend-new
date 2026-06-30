import { FastifyRequest, FastifyReply } from 'fastify';
import { notificationService } from '../services/notification.service';
import { sendSuccess } from '../utils/apiResponse';
import { AuthRequest } from '../types';

export class NotificationController {
    /** GET /api/notifications */
    getNotifications = async (request: AuthRequest, reply: FastifyReply) => {
        const { page, limit } = request.query as { page?: string; limit?: string };
        const result = await notificationService.getUserNotifications(
            request.user!.userId,
            page,
            limit,
        );
        sendSuccess(reply, result);
    };

    /** GET /api/notifications/unread-count */
    getUnreadCount = async (request: AuthRequest, reply: FastifyReply) => {
        const result = await notificationService.getUnreadCount(request.user!.userId);
        sendSuccess(reply, result);
    };

    /** PUT /api/notifications/mark-read */
    markRead = async (request: AuthRequest, reply: FastifyReply) => {
        const { ids } = request.body as { ids: string[] };
        await notificationService.markRead(request.user!.userId, ids);
        sendSuccess(reply, null, 'Marked as read');
    };

    /** PUT /api/notifications/mark-all-read */
    markAllRead = async (request: AuthRequest, reply: FastifyReply) => {
        await notificationService.markAllRead(request.user!.userId);
        sendSuccess(reply, null, 'All notifications marked as read');
    };

    /** DELETE /api/notifications/:id */
    deleteNotification = async (request: AuthRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        await notificationService.deleteNotification(request.user!.userId, id);
        sendSuccess(reply, null, 'Notification deleted');
    };
}

export const notificationController = new NotificationController();
