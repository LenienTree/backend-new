import { prisma } from '../config/database';
import { AppError } from '../utils/apiResponse';

export class BookmarkService {
    async toggle(userId: string, eventId: string) {
        const event = await prisma.event.findUnique({ where: { id: eventId } });
        if (!event) throw new AppError('Event not found.', 404);

        const existing = await prisma.bookmark.findUnique({
            where: { userId_eventId: { userId, eventId } },
        });

        if (existing) {
            await prisma.bookmark.delete({
                where: { userId_eventId: { userId, eventId } },
            });
            return { bookmarked: false };
        } else {
            await prisma.bookmark.create({ data: { userId, eventId } });
            return { bookmarked: true };
        }
    }

    async getBookmarks(userId: string) {
        return prisma.bookmark.findMany({
            where: { userId },
            include: {
                event: {
                    select: {
                        id: true,
                        title: true,
                        startDate: true,
                        bannerImage: true,
                        status: true,
                        category: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
}

export class CertificateService {
    async issue(userId: string, eventId: string, certificateUrl: string, requesterId: string, requesterRole: string) {
        const event = await prisma.event.findUnique({ where: { id: eventId } });
        if (!event) throw new AppError('Event not found.', 404);

        if (requesterRole !== 'ADMIN' && event.organizerId !== requesterId) {
            throw new AppError('Only the organizer or admin can issue certificates.', 403);
        }

        // Must be a registered & attended participant
        const registration = await prisma.registration.findUnique({
            where: { eventId_userId: { eventId, userId } },
        });

        if (!registration || registration.status !== 'ATTENDED') {
            throw new AppError('User must have attended the event to receive a certificate.', 400);
        }

        return prisma.certificate.upsert({
            where: { userId_eventId: { userId, eventId } },
            create: { userId, eventId, certificateUrl },
            update: { certificateUrl },
        });
    }

    async getByUser(userId: string) {
        return prisma.certificate.findMany({
            where: { userId },
            include: {
                event: { select: { id: true, title: true, startDate: true, category: true } },
            },
            orderBy: { issuedAt: 'desc' },
        });
    }
}

export const bookmarkService = new BookmarkService();
export const certificateService = new CertificateService();
