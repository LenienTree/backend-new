import { prisma } from '../config/database';
import { Prisma } from '@prisma/client';
import { AppError } from '../utils/apiResponse';
import { getPagination, buildPaginatedResult } from '../utils/helpers';
import { sendEmail, emailTemplates } from '../utils/email';

export class RegistrationService {
    async register(eventId: string, userId: string, formData?: Record<string, unknown>) {
        const event = await prisma.event.findUnique({
            where: { id: eventId, deletedAt: null },
        });

        if (!event) throw new AppError('Event not found.', 404);
        if (event.status !== 'APPROVED') throw new AppError('Event is not open for registration.', 400);

        const now = new Date();
        if (now > event.registrationDeadline) {
            throw new AppError('Registration deadline has passed.', 400);
        }

        const existingReg = await prisma.registration.findUnique({
            where: { eventId_userId: { eventId, userId } },
        });

        if (existingReg) throw new AppError('You are already registered for this event.', 409);

        // Check capacity
        if (event.maxParticipants) {
            const approvedCount = await prisma.registration.count({
                where: { eventId, status: 'APPROVED' },
            });
            if (approvedCount >= event.maxParticipants) {
                throw new AppError('Event is at full capacity.', 400);
            }
        }

        const isPaid = event.isPaid;
        const isAutoApproval = event.approvalMode === 'AUTO';

        let status: 'PENDING' | 'APPROVED' | 'PAYMENT_PENDING' = 'PENDING';
        let paymentStatus: 'UNPAID' | 'PAID' = 'UNPAID';

        if (isPaid) {
            status = 'PAYMENT_PENDING';
        } else if (isAutoApproval) {
            status = 'APPROVED';
        }

        const registration = await prisma.registration.create({
            data: {
                eventId,
                userId,
                status,
                paymentStatus,
                formData: (formData ?? Prisma.JsonNull) as Prisma.InputJsonValue,
            },
            include: {
                event: { select: { title: true } },
                user: { select: { name: true, email: true } },
            },
        });

        if (status === 'APPROVED') {
            sendEmail({
                to: registration.user.email,
                subject: `Registered for ${registration.event.title}!`,
                html: emailTemplates.registrationConfirmed(
                    registration.user.name,
                    registration.event.title
                ),
            }).catch(console.error);
        }

        return registration;
    }

    async getParticipants(
        eventId: string,
        requesterId: string,
        requesterRole: string,
        page = '1',
        limit = '10'
    ) {
        const event = await prisma.event.findUnique({ where: { id: eventId } });
        if (!event) throw new AppError('Event not found.', 404);

        if (requesterRole !== 'ADMIN' && event.organizerId !== requesterId) {
            throw new AppError('Not authorized to view participants.', 403);
        }

        const { skip, page: p, limit: l } = getPagination(page, limit);

        const [registrations, total] = await Promise.all([
            prisma.registration.findMany({
                where: { eventId },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            phone: true,
                            profileImage: true,
                            college: true,
                        },
                    },
                },
                skip,
                take: l,
                orderBy: { registeredAt: 'desc' },
            }),
            prisma.registration.count({ where: { eventId } }),
        ]);

        return buildPaginatedResult(registrations, total, p, l);
    }

    async approveRegistration(registrationId: string, requesterId: string, requesterRole: string) {
        const reg = await prisma.registration.findUnique({
            where: { id: registrationId },
            include: {
                event: { select: { organizerId: true, title: true } },
                user: { select: { name: true, email: true } },
            },
        });

        if (!reg) throw new AppError('Registration not found.', 404);
        if (requesterRole !== 'ADMIN' && reg.event.organizerId !== requesterId) {
            throw new AppError('Not authorized.', 403);
        }

        if (reg.status !== 'PENDING') {
            throw new AppError('Only PENDING registrations can be approved.', 400);
        }

        const updated = await prisma.registration.update({
            where: { id: registrationId },
            data: { status: 'APPROVED' },
        });

        sendEmail({
            to: reg.user.email,
            subject: `Registration approved for ${reg.event.title}!`,
            html: emailTemplates.registrationConfirmed(reg.user.name, reg.event.title),
        }).catch(console.error);

        return updated;
    }

    async rejectRegistration(registrationId: string, requesterId: string, requesterRole: string) {
        const reg = await prisma.registration.findUnique({
            where: { id: registrationId },
            include: {
                event: { select: { organizerId: true } },
            },
        });

        if (!reg) throw new AppError('Registration not found.', 404);
        if (requesterRole !== 'ADMIN' && reg.event.organizerId !== requesterId) {
            throw new AppError('Not authorized.', 403);
        }

        return prisma.registration.update({
            where: { id: registrationId },
            data: { status: 'REJECTED' },
        });
    }

    async confirmPayment(registrationId: string, paymentRef: string) {
        const reg = await prisma.registration.findUnique({
            where: { id: registrationId },
            include: {
                event: { select: { approvalMode: true, title: true } },
                user: { select: { name: true, email: true } },
            },
        });

        if (!reg) throw new AppError('Registration not found.', 404);
        if (reg.status !== 'PAYMENT_PENDING') {
            throw new AppError('Payment already processed.', 400);
        }

        const newStatus =
            reg.event.approvalMode === 'AUTO' ? 'APPROVED' : 'PENDING';

        const updated = await prisma.registration.update({
            where: { id: registrationId },
            data: { paymentStatus: 'PAID', paymentRef, status: newStatus },
        });

        if (newStatus === 'APPROVED') {
            sendEmail({
                to: reg.user.email,
                subject: `Payment confirmed for ${reg.event.title}!`,
                html: emailTemplates.registrationConfirmed(reg.user.name, reg.event.title),
            }).catch(console.error);
        }

        return updated;
    }

    async getUserRegistrationStatus(eventId: string, userId: string) {
        return prisma.registration.findUnique({
            where: { eventId_userId: { eventId, userId } },
            select: { id: true, status: true, paymentStatus: true, registeredAt: true },
        });
    }

    async markAttended(registrationId: string) {
        return prisma.registration.update({
            where: { id: registrationId },
            data: { status: 'ATTENDED' },
        });
    }
}

export const registrationService = new RegistrationService();
