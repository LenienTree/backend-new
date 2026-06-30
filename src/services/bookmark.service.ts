import { prisma } from '../config/database';
import { AppError } from '../utils/apiResponse';
import { notify } from './notification.service';

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

        const cert = await prisma.certificate.upsert({
            where: { userId_eventId: { userId, eventId } },
            create: { userId, eventId, certificateUrl },
            update: { certificateUrl },
        });

        await notify({
            userId,
            type: 'CERTIFICATE_ISSUED',
            title: 'Certificate Issued!',
            message: `You have received a certificate for "${event.title}".`,
            entityId: cert.id,
            entityType: 'Certificate'
        });

        return cert;
    }

    async bulkIssue(
        eventId: string,
        issues: { userId: string; certificateUrl: string }[],
        requesterId: string,
        requesterRole: string
    ) {
        const event = await prisma.event.findUnique({ where: { id: eventId } });
        if (!event) throw new AppError('Event not found.', 404);

        if (requesterRole !== 'ADMIN' && event.organizerId !== requesterId) {
            throw new AppError('Only the organizer or admin can issue certificates.', 403);
        }

        const userIds = issues.map((i) => i.userId);
        const registrations = await prisma.registration.findMany({
            where: {
                eventId,
                userId: { in: userIds },
            },
        });

        const attendedUserIds = new Set(
            registrations.filter((r) => r.status === 'ATTENDED').map((r) => r.userId)
        );

        const results = [];
        for (const issue of issues) {
            if (!attendedUserIds.has(issue.userId)) {
                results.push({ userId: issue.userId, status: 'FAILED', reason: 'User did not attend the event' });
                continue;
            }

            try {
                const cert = await prisma.certificate.upsert({
                    where: { userId_eventId: { userId: issue.userId, eventId } },
                    create: { userId: issue.userId, eventId, certificateUrl: issue.certificateUrl },
                    update: { certificateUrl: issue.certificateUrl },
                });

                await notify({
                    userId: issue.userId,
                    type: 'CERTIFICATE_ISSUED',
                    title: 'Certificate Issued!',
                    message: `You have received a certificate for "${event.title}".`,
                    entityId: cert.id,
                    entityType: 'Certificate'
                });

                results.push({ userId: issue.userId, status: 'SUCCESS', id: cert.id });
            } catch (error: any) {
                results.push({ userId: issue.userId, status: 'FAILED', reason: error.message });
            }
        }

        return results;
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
