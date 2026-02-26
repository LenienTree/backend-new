import { prisma } from '../config/database';
import { AppError } from '../utils/apiResponse';

export class AnnouncementService {
    async create(
        eventId: string,
        createdBy: string,
        requesterRole: string,
        data: { title: string; content: string; publishDate?: string }
    ) {
        const event = await prisma.event.findUnique({ where: { id: eventId } });
        if (!event) throw new AppError('Event not found.', 404);

        if (requesterRole !== 'ADMIN' && event.organizerId !== createdBy) {
            throw new AppError('Only the organizer can post announcements.', 403);
        }

        return prisma.announcement.create({
            data: {
                eventId,
                createdBy,
                title: data.title,
                content: data.content,
                publishDate: data.publishDate ? new Date(data.publishDate) : new Date(),
            },
            include: {
                creator: { select: { id: true, name: true, profileImage: true } },
            },
        });
    }

    async getByEvent(eventId: string) {
        return prisma.announcement.findMany({
            where: { eventId },
            include: {
                creator: { select: { id: true, name: true, profileImage: true } },
            },
            orderBy: { publishDate: 'desc' },
        });
    }

    async update(id: string, requesterId: string, data: { title?: string; content?: string }) {
        const ann = await prisma.announcement.findUnique({ where: { id } });
        if (!ann) throw new AppError('Announcement not found.', 404);
        if (ann.createdBy !== requesterId) {
            throw new AppError('Not authorized to edit this announcement.', 403);
        }
        return prisma.announcement.update({ where: { id }, data });
    }

    async delete(id: string, requesterId: string, requesterRole: string) {
        const ann = await prisma.announcement.findUnique({
            where: { id },
            include: { event: { select: { organizerId: true } } },
        });
        if (!ann) throw new AppError('Announcement not found.', 404);

        const isOwner = ann.createdBy === requesterId || ann.event.organizerId === requesterId;
        if (!isOwner && requesterRole !== 'ADMIN') {
            throw new AppError('Not authorized.', 403);
        }

        await prisma.announcement.delete({ where: { id } });
    }
}

export class FAQService {
    async create(
        eventId: string,
        requesterId: string,
        requesterRole: string,
        data: { question: string; answer: string; order?: number }
    ) {
        const event = await prisma.event.findUnique({ where: { id: eventId } });
        if (!event) throw new AppError('Event not found.', 404);
        if (requesterRole !== 'ADMIN' && event.organizerId !== requesterId) {
            throw new AppError('Only the organizer can manage FAQs.', 403);
        }

        return prisma.fAQ.create({ data: { eventId, ...data } });
    }

    async getByEvent(eventId: string) {
        return prisma.fAQ.findMany({
            where: { eventId },
            orderBy: { order: 'asc' },
        });
    }

    async update(id: string, requesterId: string, data: { question?: string; answer?: string }) {
        const faq = await prisma.fAQ.findUnique({
            where: { id },
            include: { event: { select: { organizerId: true } } },
        });
        if (!faq) throw new AppError('FAQ not found.', 404);
        if (faq.event.organizerId !== requesterId) {
            throw new AppError('Not authorized.', 403);
        }
        return prisma.fAQ.update({ where: { id }, data });
    }

    async delete(id: string, requesterId: string, requesterRole: string) {
        const faq = await prisma.fAQ.findUnique({
            where: { id },
            include: { event: { select: { organizerId: true } } },
        });
        if (!faq) throw new AppError('FAQ not found.', 404);
        if (faq.event.organizerId !== requesterId && requesterRole !== 'ADMIN') {
            throw new AppError('Not authorized.', 403);
        }
        await prisma.fAQ.delete({ where: { id } });
    }
}

export const announcementService = new AnnouncementService();
export const faqService = new FAQService();
