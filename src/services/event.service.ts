import { Prisma, EventStatus } from '@prisma/client';
import { prisma } from '../config/database';
import { AppError } from '../utils/apiResponse';
import { getPagination, buildPaginatedResult, parseDateRange } from '../utils/helpers';
import { sendEmail, emailTemplates } from '../utils/email';
import { EventFilters } from '../types';

export class EventService {
    async createDraft(
        organizerId: string,
        data: {
            title: string;
            subtitle?: string;
            category: string;
            theme?: string;
            mode: string;
            location?: { venueName?: string; address?: string; mapLink?: string };
            startDate: string;
            endDate: string;
            registrationDeadline: string;
            description: string;
            prizeType?: string;
            prizeAmount?: number;
            isPaid?: boolean;
            ticketPrice?: number;
        }
    ) {
        const { location, ...eventData } = data;

        const event = await prisma.event.create({
            data: {
                ...eventData,
                category: data.category as Prisma.EventUncheckedCreateInput['category'],
                mode: data.mode as Prisma.EventUncheckedCreateInput['mode'],
                prizeType: (data.prizeType || 'NONE') as Prisma.EventUncheckedCreateInput['prizeType'],
                startDate: new Date(data.startDate),
                endDate: new Date(data.endDate),
                registrationDeadline: new Date(data.registrationDeadline),
                organizerId,
                status: 'DRAFT',
                venueName: location?.venueName,
                address: location?.address,
                mapLink: location?.mapLink,
            },
        });

        return event;
    }

    async updateEventDesign(
        eventId: string,
        organizerId: string,
        data: {
            maxParticipants?: number;
            approvalMode?: string;
            designConfig?: {
                primaryColor?: string;
                secondaryColor?: string;
                accentColor?: string;
            };
            customFormFields?: unknown;
        }
    ) {
        await this.verifyOwnership(eventId, organizerId);

        const { designConfig, ...rest } = data;

        return prisma.event.update({
            where: { id: eventId },
            data: {
                ...rest,
                approvalMode: (data.approvalMode || 'AUTO') as Prisma.EventUncheckedUpdateInput['approvalMode'],
                primaryColor: designConfig?.primaryColor,
                secondaryColor: designConfig?.secondaryColor,
                accentColor: designConfig?.accentColor,
                customFormFields: data.customFormFields as Prisma.InputJsonValue,
            },
        });
    }

    async submitForApproval(eventId: string, organizerId: string) {
        await this.verifyOwnership(eventId, organizerId);

        const event = await prisma.event.findUnique({ where: { id: eventId } });
        if (!event) throw new AppError('Event not found.', 404);

        if (!['DRAFT', 'REJECTED'].includes(event.status)) {
            throw new AppError(
                'Event can only be submitted from DRAFT or REJECTED status.',
                400
            );
        }

        return prisma.event.update({
            where: { id: eventId },
            data: { status: 'PENDING_APPROVAL' },
        });
    }

    async updateEvent(eventId: string, organizerId: string, data: Partial<Prisma.EventUpdateInput>) {
        const event = await this.verifyOwnership(eventId, organizerId);

        if (!['DRAFT', 'REJECTED'].includes(event.status)) {
            throw new AppError('You can only edit events in DRAFT or REJECTED status.', 400);
        }

        return prisma.event.update({
            where: { id: eventId },
            data,
        });
    }

    async uploadBanner(eventId: string, organizerId: string, bannerUrl: string) {
        await this.verifyOwnership(eventId, organizerId);
        return prisma.event.update({
            where: { id: eventId },
            data: { bannerImage: bannerUrl },
            select: { id: true, bannerImage: true },
        });
    }

    async uploadPoster(eventId: string, organizerId: string, posterUrl: string) {
        await this.verifyOwnership(eventId, organizerId);
        return prisma.event.update({
            where: { id: eventId },
            data: { eventPoster: posterUrl },
            select: { id: true, eventPoster: true },
        });
    }

    async getEvents(filters: EventFilters) {
        const { page, limit, category, month, status, search, mode, isPaid, organizerId } = filters;
        const { skip, page: p, limit: l } = getPagination(page, limit);
        const dateRange = parseDateRange(month);

        const where: Prisma.EventWhereInput = {
            deletedAt: null,
            ...(category && { category: category as Prisma.EventWhereInput['category'] }),
            ...(status
                ? { status: status as EventStatus }
                : { status: 'APPROVED' }),
            ...(search && {
                OR: [
                    { title: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } },
                    { theme: { contains: search, mode: 'insensitive' } },
                ],
            }),
            ...(mode && { mode: mode as Prisma.EventWhereInput['mode'] }),
            ...(isPaid !== undefined && { isPaid: isPaid === 'true' }),
            ...(organizerId && { organizerId }),
            ...(dateRange.startDate && {
                startDate: { gte: dateRange.startDate, lte: dateRange.endDate },
            }),
        };

        const [events, total] = await Promise.all([
            prisma.event.findMany({
                where,
                select: {
                    id: true,
                    title: true,
                    subtitle: true,
                    category: true,
                    mode: true,
                    startDate: true,
                    endDate: true,
                    bannerImage: true,
                    status: true,
                    isPaid: true,
                    ticketPrice: true,
                    maxParticipants: true,
                    isFeatured: true,
                    organizer: {
                        select: { id: true, name: true, profileImage: true },
                    },
                    _count: { select: { registrations: true } },
                },
                skip,
                take: l,
                orderBy: [{ isFeatured: 'desc' }, { startDate: 'asc' }],
            }),
            prisma.event.count({ where }),
        ]);

        return buildPaginatedResult(events, total, p, l);
    }

    async getEventById(eventId: string) {
        const event = await prisma.event.findUnique({
            where: { id: eventId, deletedAt: null },
            include: {
                organizer: {
                    select: {
                        id: true,
                        name: true,
                        profileImage: true,
                        bio: true,
                        socialLinks: true,
                    },
                },
                faqs: { orderBy: { order: 'asc' } },
                announcements: {
                    orderBy: { publishDate: 'desc' },
                    include: {
                        creator: { select: { id: true, name: true, profileImage: true } },
                    },
                },
                _count: { select: { registrations: true } },
            },
        });

        if (!event) throw new AppError('Event not found.', 404);
        return event;
    }

    async softDeleteEvent(eventId: string, organizerId: string, role: string) {
        if (role !== 'ADMIN') {
            await this.verifyOwnership(eventId, organizerId);
        }

        await prisma.event.update({
            where: { id: eventId },
            data: { deletedAt: new Date() },
        });
    }

    async approveEvent(eventId: string, isFeatured = false) {
        const event = await prisma.event.findUnique({ where: { id: eventId } });
        if (!event) throw new AppError('Event not found.', 404);

        if (event.status !== 'PENDING_APPROVAL') {
            throw new AppError('Event is not pending approval.', 400);
        }

        const updated = await prisma.event.update({
            where: { id: eventId },
            data: { status: 'APPROVED', isFeatured },
            include: {
                organizer: { select: { name: true, email: true } },
            },
        });

        // Notify organizer
        sendEmail({
            to: updated.organizer.email,
            subject: `Your event "${updated.title}" is approved!`,
            html: emailTemplates.eventApproved(updated.organizer.name, updated.title),
        }).catch(console.error);

        return updated;
    }

    async rejectEvent(eventId: string, reason: string) {
        const event = await prisma.event.findUnique({ where: { id: eventId } });
        if (!event) throw new AppError('Event not found.', 404);

        if (event.status !== 'PENDING_APPROVAL') {
            throw new AppError('Event is not pending approval.', 400);
        }

        const updated = await prisma.event.update({
            where: { id: eventId },
            data: { status: 'REJECTED', rejectionReason: reason },
            include: {
                organizer: { select: { name: true, email: true } },
            },
        });

        sendEmail({
            to: updated.organizer.email,
            subject: `Update on your event "${updated.title}"`,
            html: emailTemplates.eventRejected(
                updated.organizer.name,
                updated.title,
                reason
            ),
        }).catch(console.error);

        return updated;
    }

    async markCompleted(eventId: string) {
        return prisma.event.update({
            where: { id: eventId },
            data: { status: 'COMPLETED' },
        });
    }

    private async verifyOwnership(eventId: string, organizerId: string) {
        const event = await prisma.event.findUnique({
            where: { id: eventId, deletedAt: null },
        });

        if (!event) throw new AppError('Event not found.', 404);
        if (event.organizerId !== organizerId) {
            throw new AppError('You are not authorized to modify this event.', 403);
        }

        return event;
    }
}

export const eventService = new EventService();
