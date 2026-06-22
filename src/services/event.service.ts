import { Prisma, EventStatus } from '@prisma/client';
import { prisma } from '../config/database';
import { AppError } from '../utils/apiResponse';
import { getPagination, buildPaginatedResult, parseDateRange } from '../utils/helpers';
import { emailEmitter, EmailEvent } from '../modules/email';
import { config } from '../config/config';
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
            registrationType?: string;
            minTeamSize?: number;
            maxTeamSize?: number;
            faqs?: { question: string; answer: string; order?: number }[];
            announcements?: { title: string; content: string; publishDate?: string }[];
        }
    ) {
        const { location, faqs, announcements, ...eventData } = data;

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
                registrationType: (data.registrationType || 'INDIVIDUAL') as any,
                minTeamSize: data.minTeamSize,
                maxTeamSize: data.maxTeamSize,
                faqs: faqs && faqs.length > 0 ? {
                    create: faqs.map((f, i) => ({
                        question: f.question,
                        answer: f.answer,
                        order: f.order ?? (i + 1)
                    }))
                } : undefined,
                announcements: announcements && announcements.length > 0 ? {
                    create: announcements.map(a => ({
                        title: a.title,
                        content: a.content,
                        publishDate: a.publishDate ? new Date(a.publishDate) : new Date(),
                        createdBy: organizerId
                    }))
                } : undefined
            },
        });

        // Query organizer details
        const organizer = await prisma.user.findUnique({
            where: { id: organizerId },
            select: { name: true, email: true }
        });

        // Emit EVENT_CREATED
        emailEmitter.emitAsync(EmailEvent.EVENT_CREATED, {
            email: organizer?.email || '',
            organizerName: organizer?.name || 'Organizer',
            eventTitle: event.title,
            dashboardUrl: `${config.clientUrl}/organizer/dashboard`
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
            paymentType?: string;
            upiId?: string;
        },
        role?: string
    ) {
        await this.verifyOwnership(eventId, organizerId, role);

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
                paymentType: (data.paymentType || 'FREE') as Prisma.EventUncheckedUpdateInput['paymentType'],
                upiId: data.upiId,
            },
        });
    }

    async submitForApproval(eventId: string, organizerId: string, role?: string) {
        await this.verifyOwnership(eventId, organizerId, role);

        const event = await prisma.event.findUnique({ 
            where: { id: eventId },
            include: { organizer: { select: { name: true } } }
        });
        if (!event) throw new AppError('Event not found.', 404);

        if (!['DRAFT', 'REJECTED'].includes(event.status)) {
            throw new AppError(
                'Event can only be submitted from DRAFT or REJECTED status.',
                400
            );
        }

        const updated = await prisma.event.update({
            where: { id: eventId },
            data: { status: 'PENDING_APPROVAL' },
        });

        // Find all admins
        const admins = await prisma.user.findMany({
            where: { role: 'ADMIN', deletedAt: null },
            select: { email: true, name: true }
        });

        for (const admin of admins) {
            emailEmitter.emitAsync(EmailEvent.APPROVAL_REQUIRED, {
                email: admin.email,
                adminName: admin.name,
                organizerName: event.organizer.name,
                orgName: 'N/A',
                eventName: event.title,
                approvalUrl: `${config.clientUrl}/admin`
            });
        }

        return updated;
    }

    async updateEvent(eventId: string, organizerId: string, data: Partial<Prisma.EventUpdateInput>, role?: string) {
        await this.verifyOwnership(eventId, organizerId, role);

        const { isPremium, isFeatured, ...updateData } = data as any;

        const updated = await prisma.event.update({
            where: { id: eventId },
            data: updateData,
            include: {
                registrations: {
                    where: { status: { in: ['APPROVED', 'ATTENDED'] } },
                    include: { user: { select: { email: true } } }
                }
            }
        });

        const emails = updated.registrations.map(r => r.user.email);
        if (emails.length > 0) {
            emailEmitter.emitAsync(EmailEvent.EVENT_UPDATED, {
                emails,
                eventTitle: updated.title,
                changeSummary: 'The event details have been updated. Please visit the portal for updated schedules.',
                eventUrl: `${config.clientUrl}/event/${updated.id}`
            });
        }

        return updated;
    }

    async uploadBanner(eventId: string, organizerId: string, bannerUrl: string, role?: string) {
        await this.verifyOwnership(eventId, organizerId, role);
        return prisma.event.update({
            where: { id: eventId },
            data: { bannerImage: bannerUrl },
            select: { id: true, bannerImage: true },
        });
    }

    async uploadPoster(eventId: string, organizerId: string, posterUrl: string, role?: string) {
        await this.verifyOwnership(eventId, organizerId, role);
        return prisma.event.update({
            where: { id: eventId },
            data: { eventPoster: posterUrl },
            select: { id: true, eventPoster: true },
        });
    }

    async uploadUpiQrCode(eventId: string, organizerId: string, qrCodeUrl: string, role?: string) {
        await this.verifyOwnership(eventId, organizerId, role);
        return prisma.event.update({
            where: { id: eventId },
            data: { upiQrCode: qrCodeUrl },
            select: { id: true, upiQrCode: true },
        });
    }

    async uploadLinkedinPoster(eventId: string, organizerId: string, posterUrl: string, role?: string) {
        await this.verifyOwnership(eventId, organizerId, role);
        return prisma.event.update({
            where: { id: eventId },
            data: { linkedinSharePoster: posterUrl },
            select: { id: true, linkedinSharePoster: true },
        });
    }

    async getEvents(filters: EventFilters) {
        const { page, limit, category, month, status, search, mode, isPaid, organizerId } = filters;
        const { skip, page: p, limit: l } = getPagination(page, limit);
        const dateRange = parseDateRange(month);

        const where: Prisma.EventWhereInput = {
            deletedAt: null,
            ...(category && { category: category as Prisma.EventWhereInput['category'] }),
            ...(status ? { status: status as EventStatus } : {}),
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
                    eventPoster: true,
                    status: true,
                    isPaid: true,
                    ticketPrice: true,
                    prizeType: true,
                    prizeAmount: true,
                    venueName: true,
                    maxParticipants: true,
                    isFeatured: true,
                    isPremium: true,
                    requiresLinkedinShare: true,
                    linkedinShareDescription: true,
                    linkedinSharePoster: true,
                    registrationType: true,
                    minTeamSize: true,
                    maxTeamSize: true,
                    organizer: {
                        select: { id: true, name: true, profileImage: true },
                    },
                    _count: { select: { registrations: true } },
                },
                skip,
                take: l,
                orderBy: [{ displayOrder: 'asc' }, { isFeatured: 'desc' }, { startDate: 'asc' }],
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
                        // Use optional include — creator user may have been soft/hard deleted
                        creator: {
                            select: { id: true, name: true, profileImage: true },
                        },
                    },
                },
                _count: { select: { registrations: true } },
            },
        }).catch((err) => {
            // Surface the real DB error as an AppError so it returns 500 with a message
            // rather than an unhandled rejection with no context
            throw new AppError(`Failed to fetch event: ${err?.message ?? 'Database error'}`, 500);
        });

        if (!event) throw new AppError('Event not found.', 404);
        return event;
    }

    async softDeleteEvent(eventId: string, organizerId: string, role: string) {
        await this.verifyOwnership(eventId, organizerId, role);

        const event = await prisma.event.update({
            where: { id: eventId },
            data: { deletedAt: new Date() },
            include: {
                registrations: {
                    where: { status: { in: ['PENDING', 'APPROVED', 'PAYMENT_PENDING', 'ATTENDED'] } },
                    include: { user: { select: { email: true } } }
                }
            }
        });

        // Collect all participant emails
        const emails = event.registrations.map(r => r.user.email);
        if (emails.length > 0) {
            emailEmitter.emitAsync(EmailEvent.EVENT_CANCELLED, {
                emails,
                eventTitle: event.title,
                reason: 'Event deleted by organizer/admin'
            });
        }
    }

    async approveEvent(eventId: string, isFeatured = false, isPremium = false) {
        const event = await prisma.event.findUnique({ where: { id: eventId } });
        if (!event) throw new AppError('Event not found.', 404);

        if (event.status !== 'PENDING_APPROVAL') {
            throw new AppError('Event is not pending approval.', 400);
        }

        const updated = await prisma.event.update({
            where: { id: eventId },
            data: { status: 'APPROVED', isFeatured, isPremium },
            include: {
                organizer: { select: { name: true, email: true } },
            },
        });

        // Notify organizer
        emailEmitter.emitAsync(EmailEvent.EVENT_APPROVED, {
            email: updated.organizer.email,
            organizerName: updated.organizer.name,
            eventTitle: updated.title,
            eventUrl: `${config.clientUrl}/event/${updated.id}`
        });

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

        // Notify organizer
        emailEmitter.emitAsync(EmailEvent.EVENT_REJECTED, {
            email: updated.organizer.email,
            organizerName: updated.organizer.name,
            eventTitle: updated.title,
            reason,
            dashboardUrl: `${config.clientUrl}/organizer/dashboard`
        });

        return updated;
    }

    async markCompleted(eventId: string) {
        const updated = await prisma.event.update({
            where: { id: eventId },
            data: { status: 'COMPLETED' },
            include: {
                registrations: {
                    where: { status: { in: ['APPROVED', 'ATTENDED'] } },
                    include: { user: { select: { email: true, name: true } } }
                }
            }
        });

        for (const reg of updated.registrations) {
            // Find if there is a certificate
            const cert = await prisma.certificate.findUnique({
                where: { userId_eventId: { userId: reg.userId, eventId } }
            });
            emailEmitter.emitAsync(EmailEvent.EVENT_COMPLETED, {
                email: reg.user.email,
                name: reg.user.name,
                eventTitle: updated.title,
                certificateUrl: cert?.certificateUrl || undefined
            });
        }

        return updated;
    }

    private async verifyOwnership(eventId: string, organizerId: string, role?: string) {
        const event = await prisma.event.findUnique({
            where: { id: eventId, deletedAt: null },
        });

        if (!event) throw new AppError('Event not found.', 404);
        if (role !== 'ADMIN' && event.organizerId !== organizerId) {
            throw new AppError('You are not authorized to modify this event.', 403);
        }

        return event;
    }

    async getEventStats(eventId: string) {
        const event = await prisma.event.findUnique({
            where: { id: eventId, deletedAt: null },
            select: {
                id: true,
                title: true,
                maxParticipants: true,
                ticketPrice: true,
                isPaid: true,
                startDate: true,
                registrationDeadline: true,
            },
        });
        if (!event) throw new AppError('Event not found.', 404);

        const [total, approved, pending, rejected, attended, paid] = await Promise.all([
            prisma.registration.count({ where: { eventId } }),
            prisma.registration.count({ where: { eventId, status: 'APPROVED' } }),
            prisma.registration.count({ where: { eventId, status: 'PENDING' } }),
            prisma.registration.count({ where: { eventId, status: 'REJECTED' } }),
            prisma.registration.count({ where: { eventId, status: 'ATTENDED' } }),
            prisma.registration.count({ where: { eventId, paymentStatus: 'PAID' } }),
        ]);

        const revenue = paid * (event.ticketPrice || 0);
        const capacityPercent = event.maxParticipants
            ? Math.round((approved / event.maxParticipants) * 100)
            : null;
        const deadlineMs = event.registrationDeadline
            ? event.registrationDeadline.getTime() - Date.now()
            : null;
        const isDeadlinePassed = deadlineMs !== null && deadlineMs < 0;

        return {
            eventId,
            title: event.title,
            registrations: { total, approved, pending, rejected, attended },
            payments: { paid, revenue },
            capacity: {
                max: event.maxParticipants,
                filled: approved,
                percent: capacityPercent,
                isFull: event.maxParticipants ? approved >= event.maxParticipants : false,
            },
            deadline: {
                date: event.registrationDeadline,
                isPassed: isDeadlinePassed,
                remainingMs: isDeadlinePassed ? 0 : deadlineMs,
            },
        };
    }

    async getShareData(eventId: string) {
        const event = await prisma.event.findUnique({
            where: { id: eventId, deletedAt: null },
            select: {
                id: true,
                title: true,
                subtitle: true,
                description: true,
                category: true,
                mode: true,
                startDate: true,
                bannerImage: true,
                eventPoster: true,
                organizer: { select: { name: true } },
            },
        });
        if (!event) throw new AppError('Event not found.', 404);

        const baseUrl = config.clientUrl;
        const eventUrl = `${baseUrl}/event/${event.id}`;
        const image = event.bannerImage || event.eventPoster || `${baseUrl}/og-default.png`;
        const title = event.title;
        const description = (event.subtitle || event.description || '').slice(0, 160);

        return {
            url: eventUrl,
            title,
            description,
            image,
            shareLinks: {
                twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out ${title} on LenientTree!`)}&url=${encodeURIComponent(eventUrl)}`,
                linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(eventUrl)}`,
                whatsapp: `https://wa.me/?text=${encodeURIComponent(`${title} - ${eventUrl}`)}`,
                facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(eventUrl)}`,
            },
            og: {
                title,
                description,
                image,
                url: eventUrl,
                type: 'website',
            },
        };
    }
}

export const eventService = new EventService();
