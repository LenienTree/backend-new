import { prisma } from '../config/database';
import { AppError } from '../utils/apiResponse';
import { config } from '../config/config';

export class ReferralService {

    // ─── Helpers ──────────────────────────────────────────────────────────────

    // Short, unprefixed code (6 chars) to keep shared links compact, e.g. "9F3KQ2".
    private generateCode(): string {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    // Build the short, shareable link: prefers the event slug over the UUID and
    // uses the compact `?r=` param, e.g. https://lenienttree.com/e/hack-for-good?r=9F3KQ2
    private buildLink(slugOrId: string, code: string, college?: string | null, name?: string | null): string {
        let url = `${config.clientUrl}/e/${slugOrId}?r=${code}`;
        if (college) {
            const cleanCollege = college.trim().toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');
            if (cleanCollege) {
                url += `&utm_source=${encodeURIComponent(cleanCollege)}`;
            }
        }
        if (name) {
            const cleanName = name.trim().toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');
            if (cleanName) {
                url += `&utm_medium=${encodeURIComponent(cleanName)}`;
            }
        }
        return url;
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
     * or an entire college.
     */
    async adminGenerateReferral(eventId: string, refereeUserId?: string | null, college?: string | null) {
        const event = await prisma.event.findUnique({ where: { id: eventId } });
        if (!event) throw new AppError('Event not found', 404);

        if (refereeUserId) {
            const referee = await prisma.user.findUnique({ where: { id: refereeUserId } });
            if (!referee) throw new AppError('Referee user not found', 404);

            // Idempotent: return existing code if already generated
            const existing = await prisma.referral.findFirst({
                where: { eventId, referrerId: refereeUserId },
            });

            if (existing) {
                return {
                    ...existing,
                    link: this.buildLink(event.slug ?? eventId, existing.code, referee.college, referee.name),
                    referee: { id: referee.id, name: referee.name, email: referee.email, college: referee.college },
                };
            }

            const code = this.generateCode();
            const referral = await prisma.referral.create({
                data: { code, eventId, referrerId: refereeUserId },
            });

            return {
                ...referral,
                link: this.buildLink(event.slug ?? eventId, referral.code, referee.college, referee.name),
                referee: { id: referee.id, name: referee.name, email: referee.email, college: referee.college },
            };
        } else if (college) {
            // College-level referral (no student)
            const existing = await prisma.referral.findFirst({
                where: { eventId, college, referrerId: null },
            });

            if (existing) {
                return {
                    ...existing,
                    link: this.buildLink(event.slug ?? eventId, existing.code, college, null),
                    referee: { id: null, name: 'Entire College', email: '', college },
                };
            }

            const code = this.generateCode();
            const referral = await prisma.referral.create({
                data: { code, eventId, referrerId: null, college },
            });

            return {
                ...referral,
                link: this.buildLink(event.slug ?? eventId, referral.code, college, null),
                referee: { id: null, name: 'Entire College', email: '', college },
            };
        } else {
            throw new AppError('Either refereeUserId or college must be provided', 400);
        }
    }

    // ─── Generate referral (ORGANIZER) ────────────────────────────────────────
    /**
     * Organizer creates a referral link only for their own events.
     * They pick a student or an entire college as the referrer.
     */
    async organizerGenerateReferral(
        eventId: string,
        organizerId: string,
        refereeUserId?: string | null,
        college?: string | null
    ) {
        const event = await prisma.event.findUnique({ where: { id: eventId } });
        if (!event) throw new AppError('Event not found', 404);
        if (event.organizerId !== organizerId) {
            throw new AppError('You can only create referral links for your own events', 403);
        }

        if (refereeUserId) {
            const referee = await prisma.user.findUnique({ where: { id: refereeUserId } });
            if (!referee) throw new AppError('Referee user not found', 404);

            // Idempotent
            const existing = await prisma.referral.findFirst({
                where: { eventId, referrerId: refereeUserId },
            });

            if (existing) {
                return {
                    ...existing,
                    link: this.buildLink(event.slug ?? eventId, existing.code, referee.college, referee.name),
                    referee: { id: referee.id, name: referee.name, email: referee.email, college: referee.college },
                };
            }

            const code = this.generateCode();
            const referral = await prisma.referral.create({
                data: { code, eventId, referrerId: refereeUserId },
            });

            return {
                ...referral,
                link: this.buildLink(event.slug ?? eventId, referral.code, referee.college, referee.name),
                referee: { id: referee.id, name: referee.name, email: referee.email, college: referee.college },
            };
        } else if (college) {
            // College-level referral (no student)
            const existing = await prisma.referral.findFirst({
                where: { eventId, college, referrerId: null },
            });

            if (existing) {
                return {
                    ...existing,
                    link: this.buildLink(event.slug ?? eventId, existing.code, college, null),
                    referee: { id: null, name: 'Entire College', email: '', college },
                };
            }

            const code = this.generateCode();
            const referral = await prisma.referral.create({
                data: { code, eventId, referrerId: null, college },
            });

            return {
                ...referral,
                link: this.buildLink(event.slug ?? eventId, referral.code, college, null),
                referee: { id: null, name: 'Entire College', email: '', college },
            };
        } else {
            throw new AppError('Either refereeUserId or college must be provided', 400);
        }
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

        return this._buildStats(eventId, event.slug ?? eventId);
    }

    // ─── Organizer stats: stats only for owned events ──────────────────────────
    async getOrganizerStats(eventId: string, organizerId: string) {
        const event = await prisma.event.findUnique({ where: { id: eventId } });
        if (!event) throw new AppError('Event not found', 404);
        if (event.organizerId !== organizerId) {
            throw new AppError('You do not have access to this event\'s referral stats', 403);
        }

        return this._buildStats(eventId, event.slug ?? eventId);
    }

    // ─── Internal stats builder ───────────────────────────────────────────────
    private async _buildStats(eventId: string, eventSlug: string) {
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
                link: this.buildLink(eventSlug, r.code, r.referrer?.college || r.college, r.referrer?.name),
                clicks: r.clicks,
                conversions: r.conversions,
                createdAt: r.createdAt,
                referrer: r.referrer ? r.referrer : { id: null, name: 'Entire College', email: '', college: r.college },
                recentClicks: r.clicksData,
            })),
        };
    }

    async assignCollege(email: string, college: string, name?: string) {
        let user = await prisma.user.findFirst({
            where: {
                email: email.trim().toLowerCase(),
                deletedAt: null,
            },
        });
        if (!user) {
            if (!name) {
                throw new AppError('User not found. Please ensure the student has registered an account first, or provide their name to register them.', 404);
            }
            user = await prisma.user.create({
                data: {
                    name: name.trim(),
                    email: email.trim().toLowerCase(),
                    college: college.trim(),
                    role: 'USER',
                    status: 'ACTIVE',
                    isEmailVerified: true,
                },
            });
            return user;
        }
        if (user.status !== 'ACTIVE') {
            throw new AppError('User account is blocked or inactive.', 400);
        }

        const updated = await prisma.user.update({
            where: { id: user.id },
            data: {
                college: college.trim(),
                ...(name ? { name: name.trim() } : {}),
            },
            select: {
                id: true,
                name: true,
                email: true,
                college: true,
            },
        });

        return updated;
    }
}

export const referralService = new ReferralService();
