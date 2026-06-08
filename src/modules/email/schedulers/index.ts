import cron from 'node-cron';
import { emailConfig } from '../config';
import { emailEmitter } from '../events/email.emitter';
import { EmailEvent } from '../constants';
import { prisma } from '../../../config/database';

export const startSchedulers = (): void => {
    // 1. Weekly platform analytics digest (emails admins every Monday morning)
    cron.schedule(emailConfig.scheduler.weeklyDigestCron, async () => {
        console.log('[Scheduler] Compiling weekly platform analytics report...');
        try {
            const [totalUsers, totalEvents, totalParticipants, paidRegistrations] = await Promise.all([
                prisma.user.count({ where: { deletedAt: null } }),
                prisma.event.count({ where: { status: 'APPROVED', deletedAt: null } }),
                prisma.registration.count(),
                prisma.registration.findMany({
                    where: { paymentStatus: 'PAID' },
                    include: { event: { select: { ticketPrice: true } } },
                }),
            ]);

            const totalRevenue = paidRegistrations.reduce((s, r) => s + (r.event.ticketPrice || 0), 0);
            const approved = await prisma.registration.count({ where: { status: 'APPROVED' } });
            const conversionRate = totalParticipants > 0 ? ((approved / totalParticipants) * 100).toFixed(2) : '0.00';

            // Top events by registrations count
            const events = await prisma.event.findMany({
                where: { status: 'APPROVED', deletedAt: null },
                include: { _count: { select: { registrations: true } } },
                orderBy: { registrations: { _count: 'desc' } },
                take: 3,
            });
            const topEvents = events.map(e => ({ title: e.title, registrationsCount: e._count.registrations }));

            // Find all administrators to send the report to
            const admins = await prisma.user.findMany({
                where: { role: 'ADMIN', deletedAt: null },
                select: { email: true, name: true },
            });

            for (const admin of admins) {
                emailEmitter.emitAsync(EmailEvent.WEEKLY_ANALYTICS_REPORT, {
                    email: admin.email,
                    name: admin.name,
                    totalUsers,
                    totalEvents,
                    totalParticipants,
                    totalRevenue,
                    conversionRate,
                    topEvents,
                });
            }
        } catch (err) {
            console.error('[Scheduler] Error running weekly analytics report:', err);
        }
    });

    // 2. Daily streak warning (checks daily at 6:00 PM for users with expiring streaks)
    cron.schedule(emailConfig.scheduler.streakWarningCron, async () => {
        console.log('[Scheduler] Executing daily streak protection check...');
        try {
            // Note: Since streak columns do not exist in the basic schema, we check user's registrations.
            // If they registered in the past 6 days but not past 24 hours, we nudge them to maintain the activity streak.
            const sixDaysAgo = new Date();
            sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);
            const oneDayAgo = new Date();
            oneDayAgo.setDate(oneDayAgo.getDate() - 1);

            // Find users who registered for an event in the last 6 days, but have no registration in the last 24h
            const activeUsers = await prisma.user.findMany({
                where: {
                    deletedAt: null,
                    registrations: {
                        some: {
                            registeredAt: { gte: sixDaysAgo, lte: oneDayAgo },
                        },
                    },
                },
                select: { id: true, email: true, name: true },
            });

            // Limit to 500 per run to avoid SMTP storm — re-runs daily so remainder is caught next day
            const capped = activeUsers.slice(0, 500);
            for (const user of capped) {
                emailEmitter.emitAsync(EmailEvent.STREAK_WARNING, {
                    email: user.email,
                    name: user.name,
                    streakDays: 5,
                    daysRemaining: 1,
                });
            }
        } catch (err) {
            console.error('[Scheduler] Error running streak warning scheduler:', err);
        }
    });

    // 3. Weekly Leaderboard Summary (emails every Monday morning)
    cron.schedule(emailConfig.scheduler.weeklyDigestCron, async () => {
        console.log('[Scheduler] Distributing global leaderboard digests...');
        try {
            // Find top 3 users based on registered events count as proxy for points
            const topUsers = await prisma.user.findMany({
                where: { deletedAt: null },
                include: { _count: { select: { registrations: true } } },
                orderBy: { registrations: { _count: 'desc' } },
                take: 3,
            });

            const topPerformers = topUsers.map((u, i) => ({
                name: u.name || 'Anonymous Developer',
                rank: i + 1,
                points: u._count.registrations * 100, // Proxy points
            }));

            // Paginate users in batches to avoid loading all records into memory at once
            const BATCH_SIZE = 100;
            let cursor: string | undefined;
            let globalRank = 1;
            while (true) {
                const batch = await prisma.user.findMany({
                    where: { deletedAt: null },
                    select: { id: true, email: true, name: true, _count: { select: { registrations: true } } },
                    orderBy: { id: 'asc' },
                    take: BATCH_SIZE,
                    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
                });
                if (batch.length === 0) break;
                for (const user of batch) {
                    emailEmitter.emitAsync(EmailEvent.WEEKLY_LEADERBOARD_SUMMARY, {
                        email: user.email,
                        name: user.name,
                        rank: globalRank++,
                        totalPoints: user._count.registrations * 100,
                        topPerformers,
                    });
                }
                cursor = batch[batch.length - 1].id;
                if (batch.length < BATCH_SIZE) break;
            }
        } catch (err) {
            console.error('[Scheduler] Error running global leaderboard digest:', err);
        }
    });

    console.log('✅ [Email] Node-Cron schedulers initialized successfully');
};
export default startSchedulers;
