import { prisma } from '../config/database';
import { AppError } from '../utils/apiResponse';
import { config } from '../config/config';

export class ReferralService {

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private generateCode(): string {
        return `REF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    }

    // ─── Admin: list distinct colleges ────────────────────────────────────────
    async listColleges(): Promise<string[]> {
        const result = await prisma.user.findMany({
            where: { college: { not: null }, status: 'ACTIVE', deletedAt: null },
            select: { college: true },
            distinct: ['college'],
            orderBy: { college: 'asc' },
        });
        // college is guaranteed non-null by the where clause
        return result.map((r) => r.college as string);
    }

    // ─── Admin: list students by college ──────────────────────────────────────
    async listStudentsByCollege(college: string) {
        return prisma.user.findMany({
            where: {
                college,
                status: 'ACTIVE',
                deletedAt: null,
            },
            select: {
                id: true,
                name: true,
                email: true,
                college: true,
                graduationYear: true,
            },
            orderBy: { name: 'asc' },
        });
    }

    // ─── Organizer: list their own events ────────────────────────────────────
    async listOrganizerEvents(organizerId: string) {
        return prisma.event.findMany({
            where: { organizerId, deletedAt: null },
            select: {
                id: true,
                title: true,
                status: true,
                startDate: true,
                endDate: true,
                bannerImage: true,
            },
            orderBy: { startDate: 'desc' },
        });
    }

    // NOTE: Both admin and organizer use the global listColleges() and
    // listStudentsByCollege() above — college/student selection is platform-wide.
    // Only the event chosen for generation is restricted by role.

    // ─── Generate referral (ADMIN) ─────────────────────────────────────────────
    /**
     * Admin creates a referral link for ANY event, pointing to a specific student
     * as the referrer.
     */
    async adminGenerateReferral(eventId: string, refereeUserId: string) {
        const event = await prisma.event.findUnique({ where: { id: eventId } });
        if (!event) throw new AppError('Event not found', 404);

        const referee = await prisma.user.findUnique({ where: { id: refereeUserId } });
        if (!referee) throw new AppError('Referee user not found', 404);

        // Idempotent: return existing code if already generated
        const existing = await prisma.referral.findFirst({
            where: { eventId, referrerId: refereeUserId },
        });

        if (existing) {
            return {
                ...existing,
                link: `${config.clientUrl}/event/${eventId}?ref=${existing.code}`,
                referee: { id: referee.id, name: referee.name, email: referee.email },
            };
        }

        const code = this.generateCode();
        const referral = await prisma.referral.create({
            data: { code, eventId, referrerId: refereeUserId },
        });

        return {
            ...referral,
            link: `${config.clientUrl}/event/${eventId}?ref=${referral.code}`,
            referee: { id: referee.id, name: referee.name, email: referee.email },
        };
    }

    // ─── Generate referral (ORGANIZER) ────────────────────────────────────────
    /**
     * Organizer creates a referral link only for their own events.
     * They pick a student (refereeUserId) who will be tracked as the referrer.
     */
    async organizerGenerateReferral(
        eventId: string,
        organizerId: string,
        refereeUserId: string
    ) {
        const event = await prisma.event.findUnique({ where: { id: eventId } });
        if (!event) throw new AppError('Event not found', 404);
        if (event.organizerId !== organizerId) {
            throw new AppError('You can only create referral links for your own events', 403);
        }

        const referee = await prisma.user.findUnique({ where: { id: refereeUserId } });
        if (!referee) throw new AppError('Referee user not found', 404);

        // Idempotent
        const existing = await prisma.referral.findFirst({
            where: { eventId, referrerId: refereeUserId },
        });

        if (existing) {
            return {
                ...existing,
                link: `${config.clientUrl}/event/${eventId}?ref=${existing.code}`,
                referee: { id: referee.id, name: referee.name, email: referee.email },
            };
        }

        const code = this.generateCode();
        const referral = await prisma.referral.create({
            data: { code, eventId, referrerId: refereeUserId },
        });

        return {
            ...referral,
            link: `${config.clientUrl}/event/${eventId}?ref=${referral.code}`,
            referee: { id: referee.id, name: referee.name, email: referee.email },
        };
    }

    // ─── Track click ──────────────────────────────────────────────────────────
    async trackClick(code: string, ip: string | null, userAgent: string | null, userId?: string) {
        const referral = await prisma.referral.findUnique({ where: { code } });
        if (!referral) throw new AppError('Invalid referral code', 404);

        await prisma.$transaction([
            prisma.referral.update({
                where: { id: referral.id },
                data: { clicks: { increment: 1 } },
            }),
            prisma.referralClick.create({
                data: {
                    referralId: referral.id,
                    ip,
                    userAgent,
                    userId: userId ?? null,
                },
            }),
        ]);

        return true;
    }

    // ─── Admin stats: stats for any event ─────────────────────────────────────
    async getAdminStats(eventId: string) {
        const event = await prisma.event.findUnique({ where: { id: eventId } });
        if (!event) throw new AppError('Event not found', 404);

        return this._buildStats(eventId);
    }

    // ─── Organizer stats: stats only for owned events ──────────────────────────
    async getOrganizerStats(eventId: string, organizerId: string) {
        const event = await prisma.event.findUnique({ where: { id: eventId } });
        if (!event) throw new AppError('Event not found', 404);
        if (event.organizerId !== organizerId) {
            throw new AppError('You do not have access to this event\'s referral stats', 403);
        }

        return this._buildStats(eventId);
    }

    // ─── Internal stats builder ───────────────────────────────────────────────
    private async _buildStats(eventId: string) {
        const referrals = await prisma.referral.findMany({
            where: { eventId },
            include: {
                referrer: {
                    select: { id: true, name: true, email: true, college: true },
                },
                clicksData: {
                    select: { id: true, createdAt: true, ip: true, userId: true },
                    orderBy: { createdAt: 'desc' },
                    take: 20, // last 20 clicks per referral
                },
            },
            orderBy: { conversions: 'desc' },
        });

        const totalClicks = referrals.reduce((s, r) => s + r.clicks, 0);
        const totalConversions = referrals.reduce((s, r) => s + r.conversions, 0);

        return {
            eventId,
            totalClicks,
            totalConversions,
            referrals: referrals.map((r) => ({
                id: r.id,
                code: r.code,
                link: `${config.clientUrl}/event/${eventId}?ref=${r.code}`,
                clicks: r.clicks,
                conversions: r.conversions,
                createdAt: r.createdAt,
                referrer: r.referrer,
                recentClicks: r.clicksData,
            })),
        };
    }
}

export const referralService = new ReferralService();
