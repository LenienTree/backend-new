import { prisma } from '../config/database';
import { NotificationType } from '@prisma/client';
import { getPagination } from '../utils/helpers';

export class NotificationService {
    /** Create a notification for a single user */
    async create(params: {
        userId: string;
        type: NotificationType;
        title: string;
        message: string;
        entityId?: string;
        entityType?: string;
    }) {
        return prisma.notification.create({ data: params });
    }

    /** Create notifications for multiple users at once */
    async createMany(params: {
        userIds: string[];
        type: NotificationType;
        title: string;
        message: string;
        entityId?: string;
        entityType?: string;
    }) {
        const { userIds, ...rest } = params;
        const data = userIds.map(userId => ({ userId, ...rest }));
        return prisma.notification.createMany({ data });
    }

    /** Get paginated notifications for a user */
    async getUserNotifications(userId: string, page = '1', limit = '20') {
        const { skip, page: p, limit: l } = getPagination(page, limit);

        const [notifications, total, unreadCount] = await Promise.all([
            prisma.notification.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                skip,
                take: l,
            }),
            prisma.notification.count({ where: { userId } }),
            prisma.notification.count({ where: { userId, isRead: false } }),
        ]);

        return {
            notifications,
            unreadCount,
            pagination: {
                page: p,
                limit: l,
                total,
                totalPages: Math.ceil(total / l),
            },
        };
    }

    /** Mark specific notifications as read */
    async markRead(userId: string, notificationIds: string[]) {
        // Guard: with an empty/undefined id list Prisma treats `id: { in: undefined }`
        // as "no id filter", which would silently mark ALL of the user's
        // notifications as read. Only update when a concrete id list is given.
        if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
            return { count: 0 };
        }
        return prisma.notification.updateMany({
            where: { userId, id: { in: notificationIds } },
            data: { isRead: true },
        });
    }

    /** Mark ALL notifications as read for a user */
    async markAllRead(userId: string) {
        return prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });
    }

    /** Get unread count only (lightweight for polling) */
    async getUnreadCount(userId: string) {
        const count = await prisma.notification.count({
            where: { userId, isRead: false },
        });
        return { unreadCount: count };
    }

    /** Delete a notification */
    async deleteNotification(userId: string, notificationId: string) {
        return prisma.notification.deleteMany({
            where: { id: notificationId, userId },
        });
    }
}

export const notificationService = new NotificationService();

// ── Helper: emit notification from other services ─────────────────────────────

export async function notify(params: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    entityId?: string;
    entityType?: string;
}) {
    try {
        await notificationService.create(params);
    } catch (err) {
        // Never let notification failures break the main flow
        console.error('[Notification] Failed to create notification:', err);
    }
}

export async function notifyMany(params: {
    userIds: string[];
    type: NotificationType;
    title: string;
    message: string;
    entityId?: string;
    entityType?: string;
}) {
    if (!params.userIds.length) return;
    try {
        await notificationService.createMany(params);
    } catch (err) {
        console.error('[Notification] Failed to create bulk notifications:', err);
    }
}
