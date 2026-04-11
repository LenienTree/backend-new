import { prisma } from '../config/database';
import { AppError } from '../utils/apiResponse';
import { AuthRequest } from '../types';
import { config } from '../config/config';

export class ReferralService {
    async trackClick(code: string, req: AuthRequest) {
        const referral = await prisma.referral.findUnique({ where: { code } });

        if (!referral) {
            // fail silently or throw? throw for now to let frontend know it's invalid
            throw new AppError('Invalid referral code', 404);
        }

        // Ideally, check if ip previously clicked to prevent abuse.
        // For now, record every click.
        
        await prisma.$transaction([
            prisma.referral.update({
                where: { id: referral.id },
                data: { clicks: { increment: 1 } },
            }),
            prisma.referralClick.create({
                data: {
                    referralId: referral.id,
                    ip: req.ip || null,
                    userAgent: req.headers['user-agent'] || null,
                    // If user is logged in and clicks their own link, it tracks it, 
                    // though usually clicks are from anonymous users
                    userId: req.user?.userId || null, 
                },
            }),
        ]);

        return true;
    }

    async getStats(eventId: string) {
        // Requires checking permissions -> handled in controller/service
        const stats = await prisma.referral.findMany({
            where: { eventId },
            include: {
                referrer: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: {
                conversions: 'desc'
            }
        });

        const totalClicks = stats.reduce((sum, curr) => sum + curr.clicks, 0);
        const totalConversions = stats.reduce((sum, curr) => sum + curr.conversions, 0);

        return {
            totalClicks,
            totalConversions,
            topReferrers: stats.map(s => ({
                id: s.id,
                code: s.code,
                clicks: s.clicks,
                conversions: s.conversions,
                referrer: s.referrer
            }))
        };
    }

    async generateReferral(eventId: string, userId: string, isOrganizer: boolean) {
        // Verify event exists
        const event = await prisma.event.findUnique({
            where: { id: eventId }
        });

        if (!event) {
            throw new AppError('Event not found', 404);
        }

        // Check RBAC - currently allowing organizers of the event OR admins
        // In a real scenario, you might want a specific role or just ANY user to be an 'ambassador'
        // For now, let's say only organizers can create them (or as per your instruction ONLY ADMIN / EVENT ORGANIZER)
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (user?.role !== 'ADMIN' && event.organizerId !== userId) {
             throw new AppError('Only Admins or the Event Organizer can generate referrals', 403);
        }

        // Check if referral already exists for this user-event combo
        const existing = await prisma.referral.findFirst({
            where: {
                eventId,
                referrerId: userId
            }
        });

        if (existing) {
            return {
                ...existing,
                link: `${config.clientUrl}/event/${eventId}?ref=${existing.code}`,
            };
        }

        // Generate short code
        // e.g., EVT-12345
        const code = `REF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

        const referral = await prisma.referral.create({
            data: {
                code,
                eventId,
                referrerId: userId
            }
        });

        return {
            ...referral,
            link: `${config.clientUrl}/event/${eventId}?ref=${referral.code}`,
        };
    }
}

export const referralService = new ReferralService();
