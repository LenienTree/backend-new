import { prisma } from '../config/database';
import { AppError } from '../utils/apiResponse';
import { getPagination, buildPaginatedResult } from '../utils/helpers';

export class AdminService {
    async getDashboard() {
        const [
            totalUsers,
            totalEvents,
            pendingEvents,
            totalRegistrations,
            approvedRegistrations,
            revenueResult,
            recentEvents,
            recentUsers,
        ] = await Promise.all([
            prisma.user.count({ where: { deletedAt: null } }),
            prisma.event.count({ where: { deletedAt: null } }),
            prisma.event.count({ where: { status: 'PENDING_APPROVAL' } }),
            prisma.registration.count(),
            prisma.registration.count({ where: { status: 'APPROVED' } }),
            prisma.registration.aggregate({
                where: { paymentStatus: 'PAID' },
                _sum: { _all: true },
            }),
            prisma.event.findMany({
                where: { deletedAt: null },
                orderBy: { createdAt: 'desc' },
                take: 5,
                select: {
                    id: true,
                    title: true,
                    status: true,
                    category: true,
                    createdAt: true,
                    organizer: { select: { name: true } },
                },
            }),
            prisma.user.findMany({
                where: { deletedAt: null },
                orderBy: { createdAt: 'desc' },
                take: 5,
                select: { id: true, name: true, email: true, role: true, createdAt: true },
            }),
        ]);

        // Revenue: Count paid registrations and join event ticketPrice
        const paidRegistrations = await prisma.registration.findMany({
            where: { paymentStatus: 'PAID' },
            include: { event: { select: { ticketPrice: true } } },
        });
        const revenue = paidRegistrations.reduce(
            (sum, r) => sum + (r.event.ticketPrice || 0),
            0
        );

        return {
            stats: {
                totalUsers,
                totalEvents,
                pendingEvents,
                totalRegistrations,
                approvedRegistrations,
                revenue,
                conversionRate:
                    totalRegistrations > 0
                        ? ((approvedRegistrations / totalRegistrations) * 100).toFixed(2)
                        : '0.00',
            },
            recentEvents,
            recentUsers,
        };
    }

    async getPendingEvents(page = '1', limit = '10') {
        const { skip, page: p, limit: l } = getPagination(page, limit);

        const [events, total] = await Promise.all([
            prisma.event.findMany({
                where: { status: 'PENDING_APPROVAL', deletedAt: null },
                include: {
                    organizer: {
                        select: { id: true, name: true, email: true, profileImage: true },
                    },
                    _count: { select: { registrations: true } },
                },
                skip,
                take: l,
                orderBy: { createdAt: 'asc' }, // oldest first
            }),
            prisma.event.count({ where: { status: 'PENDING_APPROVAL' } }),
        ]);

        return buildPaginatedResult(events, total, p, l);
    }

    async getAllUsers(page = '1', limit = '10', search?: string) {
        const { skip, page: p, limit: l } = getPagination(page, limit);

        const where = {
            deletedAt: null,
            ...(search && {
                OR: [
                    { name: { contains: search, mode: 'insensitive' as const } },
                    { email: { contains: search, mode: 'insensitive' as const } },
                ],
            }),
        };

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    isOrganizer: true,
                    status: true,
                    createdAt: true,
                    _count: {
                        select: { organizedEvents: true, registrations: true },
                    },
                },
                skip,
                take: l,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.user.count({ where }),
        ]);

        return buildPaginatedResult(users, total, p, l);
    }

    async getAuditLogs(page = '1', limit = '20') {
        const { skip, page: p, limit: l } = getPagination(page, limit);

        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                include: {
                    user: { select: { id: true, name: true, email: true } },
                },
                skip,
                take: l,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.auditLog.count(),
        ]);

        return buildPaginatedResult(logs, total, p, l);
    }

    async toggleFeaturedEvent(eventId: string, isFeatured: boolean) {
        const event = await prisma.event.findUnique({ where: { id: eventId } });
        if (!event) throw new AppError('Event not found.', 404);

        return prisma.event.update({
            where: { id: eventId },
            data: { isFeatured },
            select: { id: true, title: true, isFeatured: true },
        });
    }

    async getOrganizerDashboard(organizerId: string) {
        const events = await prisma.event.findMany({
            where: { organizerId, deletedAt: null },
            include: {
                _count: {
                    select: {
                        registrations: true,
                    },
                },
                registrations: {
                    select: { status: true, paymentStatus: true },
                },
            },
        });

        const summary = events.map((event) => {
            const total = event._count.registrations;
            const approved = event.registrations.filter((r) => r.status === 'APPROVED').length;
            const pending = event.registrations.filter((r) => r.status === 'PENDING').length;
            const paid = event.registrations.filter((r) => r.paymentStatus === 'PAID').length;
            const revenue = paid * (event.ticketPrice || 0);
            const conversionRate = total > 0 ? ((approved / total) * 100).toFixed(2) : '0.00';

            return {
                id: event.id,
                title: event.title,
                status: event.status,
                startDate: event.startDate,
                total,
                approved,
                pending,
                revenue,
                conversionRate,
            };
        });

        const totals = {
            totalEvents: events.length,
            totalParticipants: summary.reduce((s, e) => s + e.total, 0),
            totalRevenue: summary.reduce((s, e) => s + e.revenue, 0),
            approvedParticipants: summary.reduce((s, e) => s + e.approved, 0),
        };

        return { events: summary, totals };
    }
}

export const adminService = new AdminService();
