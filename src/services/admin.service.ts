import { Prisma } from '@prisma/client';
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
            usersWithInterests,
            revenueRows,
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
            prisma.user.findMany({
                where: { deletedAt: null },
                select: { interests: true },
            }),
            // Revenue = sum of ticketPrice over all PAID registrations, computed in
            // the DB so we don't stream every paid registration back to Node.
            prisma.$queryRaw<{ revenue: number }[]>`
                SELECT COALESCE(SUM(e."ticketPrice"), 0) AS revenue
                FROM "Registration" r
                JOIN "Event" e ON e.id = r."eventId"
                WHERE r."paymentStatus" = 'PAID'
            `,
        ]);

        const interestCounts = usersWithInterests.reduce<Record<string, number>>((acc, user) => {
            for (const interest of user.interests || []) {
                acc[interest] = (acc[interest] || 0) + 1;
            }
            return acc;
        }, {});

        const interestStats = Object.entries(interestCounts)
            .map(([label, count]) => ({ label, count }))
            .sort((a, b) => b.count - a.count);

        const revenue = Number(revenueRows[0]?.revenue ?? 0);

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
            interestStats,
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
                    interests: true,
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

    async getAuditLogs(
        page = '1',
        limit = '20',
        filters: {
            action?: string;
            entity?: string;
            userId?: string;
            search?: string;
            startDate?: string;
            endDate?: string;
        } = {}
    ) {
        const { skip, page: p, limit: l } = getPagination(page, limit);

        const where: Prisma.AuditLogWhereInput = {};
        if (filters.action) where.action = filters.action;
        if (filters.entity) where.entity = filters.entity;
        if (filters.userId) where.userId = filters.userId;

        if (filters.startDate || filters.endDate) {
            const createdAt: Prisma.DateTimeFilter = {};
            if (filters.startDate) createdAt.gte = new Date(filters.startDate);
            if (filters.endDate) {
                // Treat endDate as inclusive of the whole day.
                const end = new Date(filters.endDate);
                end.setHours(23, 59, 59, 999);
                createdAt.lte = end;
            }
            where.createdAt = createdAt;
        }

        if (filters.search) {
            const s = filters.search.trim();
            where.OR = [
                { entityId: { contains: s, mode: 'insensitive' } },
                { user: { name: { contains: s, mode: 'insensitive' } } },
                { user: { email: { contains: s, mode: 'insensitive' } } },
            ];
        }

        const [logs, total, actionGroups, entityGroups] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                include: {
                    user: { select: { id: true, name: true, email: true } },
                },
                skip,
                take: l,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.auditLog.count({ where }),
            // Distinct action/entity values to populate the UI filter dropdowns
            // (unfiltered, so the dropdowns always show every available option).
            prisma.auditLog.groupBy({ by: ['action'], orderBy: { action: 'asc' } }),
            prisma.auditLog.groupBy({ by: ['entity'], orderBy: { entity: 'asc' } }),
        ]);

        const result = buildPaginatedResult(logs, total, p, l);
        return {
            ...result,
            filters: {
                actions: actionGroups.map((g) => g.action),
                entities: entityGroups.map((g) => g.entity),
            },
        };
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

    async toggleShowOnLandingEvent(eventId: string, showOnLanding: boolean) {
        const event = await prisma.event.findUnique({ where: { id: eventId } });
        if (!event) throw new AppError('Event not found.', 404);

        return prisma.event.update({
            where: { id: eventId },
            data: { showOnLanding },
            select: { id: true, title: true, showOnLanding: true },
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
                category: event.category,
                maxParticipants: event.maxParticipants,
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
            revenueRows,
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
            // Revenue over the last 90 days — summed in the DB (join Event for price)
            // instead of pulling every paid registration into Node.
            prisma.$queryRaw<{ revenue: number }[]>`
                SELECT COALESCE(SUM(e."ticketPrice"), 0) AS revenue
                FROM "Registration" r
                JOIN "Event" e ON e.id = r."eventId"
                WHERE r."paymentStatus" = 'PAID' AND r."registeredAt" >= ${ninetyDaysAgo}
            `,
        ]);

        const totalRevenue = Number(revenueRows[0]?.revenue ?? 0);

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

    /**
     * Lead-generation & growth analytics: acquisition funnel, internship-lead demand,
     * engaged colleges, interest/skill demand signals, referral channel performance,
     * re-engagement segments and revenue mix. Powers the admin "Lead Analytics" tab.
     */
    async getLeadAnalytics() {
        const now = new Date();
        const daysAgo = (n: number) => {
            const d = new Date(now);
            d.setDate(d.getDate() - n);
            return d;
        };
        const week = daysAgo(7);
        const twoWeek = daysAgo(14);
        const month = daysAgo(30);
        const twoMonth = daysAgo(60);

        const [
            totalUsers,
            verifiedUsers,
            internshipInterested,
            regUsersRows,
            attendedUsersRows,
            paidUsersRows,
            collegeGroups,
            gradGroups,
            skillGroups,
            referralSum,
            topReferrersRows,
            referralCollegeGroups,
            suThisWeek,
            suLastWeek,
            suThisMonth,
            suLastMonth,
            paymentPending,
            bookmarkNotRegRows,
            revenueByCatRows,
            paidEvents,
            freeEvents,
            avgTicketAgg,
            internUsers,
            interestUsers,
        ] = await Promise.all([
            prisma.user.count({ where: { deletedAt: null } }),
            prisma.user.count({ where: { deletedAt: null, isEmailVerified: true } }),
            prisma.user.count({ where: { deletedAt: null, internshipInterest: true } }),
            prisma.$queryRaw<{ c: number }[]>`SELECT COUNT(DISTINCT "userId")::int AS c FROM "Registration"`,
            prisma.$queryRaw<{ c: number }[]>`SELECT COUNT(DISTINCT "userId")::int AS c FROM "Registration" WHERE status = 'ATTENDED'`,
            prisma.$queryRaw<{ c: number }[]>`SELECT COUNT(DISTINCT "userId")::int AS c FROM "Registration" WHERE "paymentStatus" = 'PAID'`,
            prisma.user.groupBy({ by: ['college'], where: { deletedAt: null, college: { not: null } }, _count: { _all: true } }),
            prisma.user.groupBy({ by: ['graduationYear'], where: { deletedAt: null, graduationYear: { not: null } }, _count: { _all: true } }),
            prisma.userSkill.groupBy({ by: ['skill'], _count: { _all: true } }),
            prisma.referral.aggregate({ _sum: { clicks: true, conversions: true } }),
            prisma.$queryRaw<{ name: string; college: string | null; conversions: number }[]>`
                SELECT u.name, u.college, SUM(r.conversions)::int AS conversions
                FROM "Referral" r JOIN "User" u ON u.id = r."referrerId"
                WHERE r."referrerId" IS NOT NULL
                GROUP BY u.id, u.name, u.college
                HAVING SUM(r.conversions) > 0
                ORDER BY conversions DESC
                LIMIT 10`,
            prisma.referral.groupBy({ by: ['college'], where: { college: { not: null } }, _sum: { conversions: true, clicks: true } }),
            prisma.user.count({ where: { deletedAt: null, createdAt: { gte: week } } }),
            prisma.user.count({ where: { deletedAt: null, createdAt: { gte: twoWeek, lt: week } } }),
            prisma.user.count({ where: { deletedAt: null, createdAt: { gte: month } } }),
            prisma.user.count({ where: { deletedAt: null, createdAt: { gte: twoMonth, lt: month } } }),
            prisma.registration.count({ where: { status: 'PAYMENT_PENDING' } }),
            prisma.$queryRaw<{ c: number }[]>`SELECT COUNT(DISTINCT b."userId")::int AS c FROM "Bookmark" b WHERE b."userId" NOT IN (SELECT "userId" FROM "Registration")`,
            prisma.$queryRaw<{ category: string; revenue: number; paid: number }[]>`
                SELECT e.category, COALESCE(SUM(e."ticketPrice"), 0)::float AS revenue, COUNT(r.id)::int AS paid
                FROM "Registration" r JOIN "Event" e ON e.id = r."eventId"
                WHERE r."paymentStatus" = 'PAID'
                GROUP BY e.category
                ORDER BY revenue DESC`,
            prisma.event.count({ where: { deletedAt: null, isPaid: true } }),
            prisma.event.count({ where: { deletedAt: null, isPaid: false } }),
            prisma.event.aggregate({ where: { deletedAt: null, isPaid: true }, _avg: { ticketPrice: true } }),
            prisma.user.findMany({
                where: { deletedAt: null, internshipInterest: true },
                select: { internshipDomains: true, college: true, graduationYear: true },
            }),
            prisma.user.findMany({ where: { deletedAt: null }, select: { interests: true } }),
        ]);

        const num = (rows: { c: number }[]) => Number(rows[0]?.c ?? 0);
        const pct = (part: number, whole: number) => (whole > 0 ? Number(((part / whole) * 100).toFixed(1)) : 0);
        const growth = (curr: number, prev: number) => (prev > 0 ? Number((((curr - prev) / prev) * 100).toFixed(1)) : (curr > 0 ? 100 : 0));
        const topN = (obj: Record<string, number>, n: number) =>
            Object.entries(obj).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count).slice(0, n);

        const registeredUsers = num(regUsersRows);
        const attendedUsers = num(attendedUsersRows);
        const paidUsers = num(paidUsersRows);

        // Internship-lead demand breakdowns
        const domainCounts: Record<string, number> = {};
        const internCollegeCounts: Record<string, number> = {};
        const internYearCounts: Record<string, number> = {};
        for (const u of internUsers) {
            for (const d of u.internshipDomains || []) if (d) domainCounts[d] = (domainCounts[d] || 0) + 1;
            if (u.college) internCollegeCounts[u.college] = (internCollegeCounts[u.college] || 0) + 1;
            if (u.graduationYear) internYearCounts[String(u.graduationYear)] = (internYearCounts[String(u.graduationYear)] || 0) + 1;
        }

        // Interest demand across the whole base
        const interestCounts: Record<string, number> = {};
        for (const u of interestUsers) for (const i of u.interests || []) if (i) interestCounts[i] = (interestCounts[i] || 0) + 1;

        const totalConversions = referralSum._sum.conversions ?? 0;
        const totalClicks = referralSum._sum.clicks ?? 0;

        return {
            // Acquisition → activation funnel
            funnel: [
                { stage: 'Signed up', count: totalUsers, pct: 100 },
                { stage: 'Verified email', count: verifiedUsers, pct: pct(verifiedUsers, totalUsers) },
                { stage: 'Registered for event', count: registeredUsers, pct: pct(registeredUsers, totalUsers) },
                { stage: 'Paid', count: paidUsers, pct: pct(paidUsers, totalUsers) },
                { stage: 'Attended', count: attendedUsers, pct: pct(attendedUsers, totalUsers) },
            ],

            // Internship leads (highest-value segment)
            internship: {
                interestedCount: internshipInterested,
                sharePct: pct(internshipInterested, totalUsers),
                byDomain: topN(domainCounts, 10),
                byCollege: topN(internCollegeCounts, 8),
                byGraduationYear: Object.entries(internYearCounts)
                    .map(([year, count]) => ({ year: Number(year), count }))
                    .sort((a, b) => a.year - b.year),
            },

            // Engaged institutions
            topColleges: collegeGroups
                .map((g) => ({ college: g.college as string, users: g._count._all }))
                .sort((a, b) => b.users - a.users)
                .slice(0, 12),

            graduationYears: gradGroups
                .map((g) => ({ year: g.graduationYear as number, count: g._count._all }))
                .sort((a, b) => a.year - b.year),

            // Demand signals
            topInterests: topN(interestCounts, 12),
            topSkills: skillGroups
                .map((g) => ({ label: g.skill, count: g._count._all }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 12),

            // Referral channel performance
            referrals: {
                totalClicks,
                totalConversions,
                conversionRate: pct(totalConversions, totalClicks),
                topReferrers: topReferrersRows.map((r) => ({ name: r.name, college: r.college, conversions: Number(r.conversions) })),
                topColleges: referralCollegeGroups
                    .map((g) => ({ college: g.college as string, conversions: g._sum.conversions ?? 0, clicks: g._sum.clicks ?? 0 }))
                    .filter((c) => c.conversions > 0)
                    .sort((a, b) => b.conversions - a.conversions)
                    .slice(0, 10),
            },

            // Growth momentum
            growth: {
                signupsThisWeek: suThisWeek,
                signupsLastWeek: suLastWeek,
                wowGrowth: growth(suThisWeek, suLastWeek),
                signupsThisMonth: suThisMonth,
                signupsLastMonth: suLastMonth,
                momGrowth: growth(suThisMonth, suLastMonth),
            },

            // Re-engagement / nurture segments (actionable lead lists)
            segments: {
                neverRegistered: Math.max(totalUsers - registeredUsers, 0),
                bookmarkedNotRegistered: num(bookmarkNotRegRows),
                paymentPending,
                unverified: Math.max(totalUsers - verifiedUsers, 0),
            },

            // Monetization mix
            revenue: {
                byCategory: revenueByCatRows.map((r) => ({ category: r.category, revenue: Number(r.revenue), paid: Number(r.paid) })),
                paidEvents,
                freeEvents,
                avgTicketPrice: Number((avgTicketAgg._avg.ticketPrice ?? 0).toFixed(0)),
            },
        };
    }

    /**
     * Exportable internship-lead list (contact details) for outreach, filterable by
     * domain and college. This is the "hand it to the placement/sales team" export.
     */
    async getInternshipLeads(domain?: string, college?: string) {
        const users = await prisma.user.findMany({
            where: {
                deletedAt: null,
                internshipInterest: true,
                ...(domain ? { internshipDomains: { has: domain } } : {}),
                ...(college ? { college: { contains: college, mode: 'insensitive' as const } } : {}),
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                college: true,
                graduationYear: true,
                currentRole: true,
                internshipDomains: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        return users;
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

    async getInterestUsers(interest: string) {
        const users = await prisma.user.findMany({
            where: {
                deletedAt: null,
                interests: { has: interest },
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                college: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        return users;
    }
}

export const adminService = new AdminService();
