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
            recentEvents,
            recentUsers,
        ] = await Promise.all([
            prisma.user.count({ where: { deletedAt: null } }),
            prisma.event.count({ where: { deletedAt: null } }),
            prisma.event.count({ where: { status: 'PENDING_APPROVAL' } }),
            prisma.registration.count(),
            prisma.registration.count({ where: { status: 'APPROVED' } }),
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
                    phone: true,
                    college: true,
                    graduationYear: true,
                    dateOfBirth: true,
                    bio: true,
                    profileImage: true,
                    isEmailVerified: true,
                    googleId: true,
                    internshipInterest: true,
                    internshipDomains: true,
                    socialLinks: true,
                    skills: {
                        select: {
                            skill: true,
                        },
                    },
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

    async getOrganizerRequests() {
        // Only return ORGANIZER_REQUEST entries for users who are NOT yet organizers
        const requests = await prisma.auditLog.findMany({
            where: { action: 'ORGANIZER_REQUEST' },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        isOrganizer: true,
                        profileImage: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        // Filter out already-approved users
        return requests.filter(r => !r.user?.isOrganizer);
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

    async togglePremiumEvent(eventId: string, isPremium: boolean) {
        const event = await prisma.event.findUnique({ where: { id: eventId } });
        if (!event) throw new AppError('Event not found.', 404);

        return prisma.event.update({
            where: { id: eventId },
            data: { isPremium },
            select: { id: true, title: true, isPremium: true },
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

    async getAnalytics() {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        const [
            dailySignups,
            eventsByStatus,
            eventsByCategory,
            recentRegistrations,
            topEvents,
        ] = await Promise.all([
            // Daily user signups for last 30 days
            prisma.$queryRaw<{ date: string; count: bigint }[]>`
                SELECT DATE("createdAt") as date, COUNT(*) as count
                FROM "User"
                WHERE "createdAt" >= ${thirtyDaysAgo} AND "deletedAt" IS NULL
                GROUP BY DATE("createdAt")
                ORDER BY date ASC
            `,
            // Events grouped by status
            prisma.event.groupBy({
                by: ['status'],
                _count: { _all: true },
                where: { deletedAt: null },
            }),
            // Events grouped by category
            prisma.event.groupBy({
                by: ['category'],
                _count: { _all: true },
                where: { deletedAt: null, status: 'APPROVED' },
            }),
            // Daily registrations for last 30 days
            prisma.$queryRaw<{ date: string; count: bigint }[]>`
                SELECT DATE("registeredAt") as date, COUNT(*) as count
                FROM "Registration"
                WHERE "registeredAt" >= ${thirtyDaysAgo}
                GROUP BY DATE("registeredAt")
                ORDER BY date ASC
            `,
            // Top 5 events by registration count
            prisma.event.findMany({
                where: { deletedAt: null, status: 'APPROVED' },
                select: {
                    id: true,
                    title: true,
                    category: true,
                    _count: { select: { registrations: true } },
                },
                orderBy: { registrations: { _count: 'desc' } },
                take: 5,
            }),
        ]);

        // Revenue last 90 days
        const paidRegs = await prisma.registration.findMany({
            where: {
                paymentStatus: 'PAID',
                registeredAt: { gte: ninetyDaysAgo },
            },
            include: { event: { select: { ticketPrice: true } } },
        });
        const totalRevenue = paidRegs.reduce((sum, r) => sum + (r.event.ticketPrice || 0), 0);

        return {
            dailySignups: dailySignups.map(d => ({
                date: d.date,
                count: Number(d.count),
            })),
            eventsByStatus: eventsByStatus.map(e => ({
                status: e.status,
                count: e._count._all,
            })),
            eventsByCategory: eventsByCategory.map(e => ({
                category: e.category,
                count: e._count._all,
            })),
            recentRegistrations: recentRegistrations.map(d => ({
                date: d.date,
                count: Number(d.count),
            })),
            topEvents: topEvents.map(e => ({
                id: e.id,
                title: e.title,
                category: e.category,
                registrations: e._count.registrations,
            })),
            totalRevenue,
        };
    }

    async getAllEvents(page = '1', limit = '50', status?: string, search?: string) {
        const { skip, page: p, limit: l } = getPagination(page, limit);

        const where: any = { deletedAt: null };
        if (status) where.status = status;
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [events, total] = await Promise.all([
            prisma.event.findMany({
                where,
                include: {
                    organizer: { select: { id: true, name: true, email: true } },
                    _count: { select: { registrations: true } },
                },
                skip,
                take: l,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.event.count({ where }),
        ]);

        return buildPaginatedResult(events, total, p, l);
    }

    async updateEventsOrder(events: { id: string; displayOrder: number }[]) {
        const updates = events.map((ev) =>
            prisma.event.update({
                where: { id: ev.id },
                data: { displayOrder: ev.displayOrder },
            })
        );
        await prisma.$transaction(updates);
        return { success: true };
    }

    async getInternshipSurveyResponses(page = '1', limit = '15', search?: string) {
        const { skip, page: p, limit: l } = getPagination(page, limit);

        const where = {
            deletedAt: null,
            internshipInterest: { not: null },
            ...(search && {
                OR: [
                    { name: { contains: search, mode: 'insensitive' as const } },
                    { email: { contains: search, mode: 'insensitive' as const } },
                ],
            }),
        };

        const [users, total, totalInterested, totalNotInterested, surveySection] = await Promise.all([
            prisma.user.findMany({
                where,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    internshipInterest: true,
                    internshipDomains: true,
                    createdAt: true,
                },
                skip,
                take: l,
                orderBy: { updatedAt: 'desc' },
            }),
            prisma.user.count({ where }),
            prisma.user.count({ where: { deletedAt: null, internshipInterest: true } }),
            prisma.user.count({ where: { deletedAt: null, internshipInterest: false } }),
            prisma.homepageSection.findUnique({ where: { key: 'internship_survey' } }),
        ]);

        // Aggregate domains counts
        const interestedUsers = await prisma.user.findMany({
            where: { deletedAt: null, internshipInterest: true },
            select: { internshipDomains: true }
        });

        const domainCounts: Record<string, number> = {};
        interestedUsers.forEach(u => {
            u.internshipDomains.forEach(domain => {
                domainCounts[domain] = (domainCounts[domain] || 0) + 1;
            });
        });

        const paginatedResult = buildPaginatedResult(users, total, p, l);
        const enabled = surveySection ? surveySection.visible : true;

        return {
            ...paginatedResult,
            enabled,
            stats: {
                total,
                interested: totalInterested,
                notInterested: totalNotInterested,
                domainCounts,
            }
        };
    }

    async toggleInternshipSurvey() {
        let section = await prisma.homepageSection.findUnique({
            where: { key: 'internship_survey' }
        });
        if (!section) {
            section = await prisma.homepageSection.create({
                data: { key: 'internship_survey', title: 'Internship Survey Feature', order: 5, visible: true }
            });
        }
        return prisma.homepageSection.update({
            where: { key: 'internship_survey' },
            data: { visible: !section.visible }
        });
    }
}

export const adminService = new AdminService();
