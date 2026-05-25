import { emailEmitter } from './email.emitter';
import { EmailEvent, TemplateName } from '../constants';
import { EmailService } from '../services/email.service';

export const registerEmailListeners = (): void => {
    // ── Auth Events ──
    emailEmitter.on(EmailEvent.USER_REGISTERED, async (payload: { email: string; name: string; loginUrl: string }) => {
        try {
            await EmailService.sendTemplatedEmail(
                payload.email,
                TemplateName.WELCOME,
                { name: payload.name, loginUrl: payload.loginUrl },
                'Welcome to LenientTree! 🚀'
            );
        } catch (err) {
            console.error('[Email] Failed to process USER_REGISTERED event:', err);
        }
    });

    emailEmitter.on(EmailEvent.USER_VERIFIED, async (payload: { email: string; name: string; verificationUrl: string }) => {
        try {
            await EmailService.sendTemplatedEmail(
                payload.email,
                TemplateName.VERIFICATION,
                { name: payload.name, verificationUrl: payload.verificationUrl },
                'Verify Your LenientTree Email Address ✉️'
            );
        } catch (err) {
            console.error('[Email] Failed to process USER_VERIFIED event:', err);
        }
    });

    emailEmitter.on(EmailEvent.PASSWORD_RESET_REQUESTED, async (payload: { email: string; name: string; resetUrl: string }) => {
        try {
            await EmailService.sendTemplatedEmail(
                payload.email,
                TemplateName.PASSWORD_RESET,
                { name: payload.name, resetUrl: payload.resetUrl },
                'Reset Your LenientTree Password 🔒'
            );
        } catch (err) {
            console.error('[Email] Failed to process PASSWORD_RESET_REQUESTED event:', err);
        }
    });

    emailEmitter.on(EmailEvent.PASSWORD_CHANGED, async (payload: { email: string; name: string }) => {
        try {
            await EmailService.sendTemplatedEmail(
                payload.email,
                TemplateName.PASSWORD_CHANGED,
                { name: payload.name },
                'Password Updated Successfully ✅'
            );
        } catch (err) {
            console.error('[Email] Failed to process PASSWORD_CHANGED event:', err);
        }
    });

    emailEmitter.on(EmailEvent.SUSPICIOUS_LOGIN, async (payload: { email: string; name: string; device: string; location: string; ipAddress: string; time: string }) => {
        try {
            await EmailService.sendTemplatedEmail(
                payload.email,
                TemplateName.SUSPICIOUS_LOGIN,
                payload,
                'Security Alert: New Login Detected ⚠️'
            );
        } catch (err) {
            console.error('[Email] Failed to process SUSPICIOUS_LOGIN event:', err);
        }
    });

    emailEmitter.on(EmailEvent.ACCOUNT_DELETED, async (payload: { email: string; name: string }) => {
        try {
            await EmailService.sendTemplatedEmail(
                payload.email,
                TemplateName.ACCOUNT_DELETED,
                { name: payload.name },
                'LenientTree Account Deleted 😢'
            );
        } catch (err) {
            console.error('[Email] Failed to process ACCOUNT_DELETED event:', err);
        }
    });

    // ── Event Lifecycle Events ──
    emailEmitter.on(EmailEvent.EVENT_CREATED, async (payload: { email: string; organizerName: string; eventTitle: string; dashboardUrl: string }) => {
        try {
            await EmailService.sendTemplatedEmail(
                payload.email,
                TemplateName.EVENT_CREATED,
                payload,
                `Draft Created: "${payload.eventTitle}" 📅`
            );
        } catch (err) {
            console.error('[Email] Failed to process EVENT_CREATED event:', err);
        }
    });

    emailEmitter.on(EmailEvent.EVENT_UPDATED, async (payload: { emails: string[]; eventTitle: string; changeSummary: string; eventUrl: string }) => {
        try {
            for (const email of payload.emails) {
                await EmailService.sendTemplatedEmail(
                    email,
                    TemplateName.EVENT_UPDATED,
                    { name: 'Developer', eventTitle: payload.eventTitle, changeSummary: payload.changeSummary, eventUrl: payload.eventUrl },
                    `Updates to Event: "${payload.eventTitle}" 📢`
                );
            }
        } catch (err) {
            console.error('[Email] Failed to process EVENT_UPDATED event:', err);
        }
    });

    emailEmitter.on(EmailEvent.EVENT_REMINDER, async (payload: { email: string; name: string; eventTitle: string; startDate: string; venue: string; eventUrl: string }) => {
        try {
            await EmailService.sendTemplatedEmail(
                payload.email,
                TemplateName.EVENT_REMINDER,
                payload,
                `Reminder: "${payload.eventTitle}" is Starting Soon! ⏰`
            );
        } catch (err) {
            console.error('[Email] Failed to process EVENT_REMINDER event:', err);
        }
    });

    emailEmitter.on(EmailEvent.EVENT_CANCELLED, async (payload: { emails: string[]; eventTitle: string; reason?: string }) => {
        try {
            for (const email of payload.emails) {
                await EmailService.sendTemplatedEmail(
                    email,
                    TemplateName.EVENT_CANCELLED,
                    { name: 'Developer', eventTitle: payload.eventTitle, reason: payload.reason },
                    `Cancelled: Event "${payload.eventTitle}" 🚫`
                );
            }
        } catch (err) {
            console.error('[Email] Failed to process EVENT_CANCELLED event:', err);
        }
    });

    emailEmitter.on(EmailEvent.EVENT_COMPLETED, async (payload: { email: string; name: string; eventTitle: string; certificateUrl?: string }) => {
        try {
            await EmailService.sendTemplatedEmail(
                payload.email,
                TemplateName.EVENT_COMPLETED,
                payload,
                `Completed: "${payload.eventTitle}"! 🎉`
            );
        } catch (err) {
            console.error('[Email] Failed to process EVENT_COMPLETED event:', err);
        }
    });

    emailEmitter.on(EmailEvent.ATTENDANCE_CONFIRMED, async (payload: { email: string; name: string; eventTitle: string; date: string }) => {
        try {
            await EmailService.sendTemplatedEmail(
                payload.email,
                TemplateName.ATTENDANCE_CONFIRMED,
                payload,
                `Attendance Verified: "${payload.eventTitle}" ✅`
            );
        } catch (err) {
            console.error('[Email] Failed to process ATTENDANCE_CONFIRMED event:', err);
        }
    });

    emailEmitter.on(EmailEvent.REWARD_EARNED, async (payload: { email: string; name: string; rewardName: string; rewardCode?: string }) => {
        try {
            await EmailService.sendTemplatedEmail(
                payload.email,
                TemplateName.REWARD_EARNED,
                payload,
                `You Unlocked a Reward! 🎁`
            );
        } catch (err) {
            console.error('[Email] Failed to process REWARD_EARNED event:', err);
        }
    });

    // ── Gamification Events ──
    emailEmitter.on(EmailEvent.BADGE_EARNED, async (payload: { email: string; name: string; badgeName: string; badgeIconUrl?: string; badgeDescription?: string }) => {
        try {
            await EmailService.sendTemplatedEmail(
                payload.email,
                TemplateName.BADGE_EARNED,
                payload,
                `Badge Unlocked: "${payload.badgeName}"! 🏆`
            );
        } catch (err) {
            console.error('[Email] Failed to process BADGE_EARNED event:', err);
        }
    });

    emailEmitter.on(EmailEvent.POINTS_AWARDED, async (payload: { email: string; name: string; points: number; reason: string; totalPoints: number }) => {
        try {
            await EmailService.sendTemplatedEmail(
                payload.email,
                TemplateName.POINTS_AWARDED,
                payload,
                `Points Credited: +${payload.points} pts 🪙`
            );
        } catch (err) {
            console.error('[Email] Failed to process POINTS_AWARDED event:', err);
        }
    });

    emailEmitter.on(EmailEvent.LEADERBOARD_RANK_IMPROVED, async (payload: { email: string; name: string; rank: number; previousRank: number }) => {
        try {
            await EmailService.sendTemplatedEmail(
                payload.email,
                TemplateName.LEADERBOARD_RANK_IMPROVED,
                payload,
                `Leaderboard Rank Improved! 📈`
            );
        } catch (err) {
            console.error('[Email] Failed to process LEADERBOARD_RANK_IMPROVED event:', err);
        }
    });

    emailEmitter.on(EmailEvent.WEEKLY_LEADERBOARD_SUMMARY, async (payload: { email: string; name: string; rank: number; totalPoints: number; topPerformers: any[] }) => {
        try {
            await EmailService.sendTemplatedEmail(
                payload.email,
                TemplateName.WEEKLY_LEADERBOARD_SUMMARY,
                payload,
                `Weekly Leaderboard Digest 📊`
            );
        } catch (err) {
            console.error('[Email] Failed to process WEEKLY_LEADERBOARD_SUMMARY event:', err);
        }
    });

    emailEmitter.on(EmailEvent.MILESTONE_REACHED, async (payload: { email: string; name: string; milestoneName: string; description: string }) => {
        try {
            await EmailService.sendTemplatedEmail(
                payload.email,
                TemplateName.MILESTONE_REACHED,
                payload,
                `Milestone Achieved: "${payload.milestoneName}" 🎉`
            );
        } catch (err) {
            console.error('[Email] Failed to process MILESTONE_REACHED event:', err);
        }
    });

    emailEmitter.on(EmailEvent.STREAK_WARNING, async (payload: { email: string; name: string; streakDays: number; daysRemaining: number }) => {
        try {
            await EmailService.sendTemplatedEmail(
                payload.email,
                TemplateName.STREAK_WARNING,
                payload,
                `Save Your active streak! 🔥`
            );
        } catch (err) {
            console.error('[Email] Failed to process STREAK_WARNING event:', err);
        }
    });

    // ── Reporting Events ──
    emailEmitter.on(EmailEvent.WEEKLY_ANALYTICS_REPORT, async (payload: { email: string; name: string; totalUsers: number; totalEvents: number; totalParticipants: number; totalRevenue: number; conversionRate: string; topEvents: any[] }) => {
        try {
            await EmailService.sendTemplatedEmail(
                payload.email,
                TemplateName.WEEKLY_ANALYTICS_REPORT,
                payload,
                `Weekly Platform Metrics Report 📈`
            );
        } catch (err) {
            console.error('[Email] Failed to process WEEKLY_ANALYTICS_REPORT event:', err);
        }
    });

    emailEmitter.on(EmailEvent.MONTHLY_ENGAGEMENT_REPORT, async (payload: { email: string; name: string; activeUsers: number; engagementRate: string }) => {
        try {
            await EmailService.sendTemplatedEmail(
                payload.email,
                TemplateName.MONTHLY_ENGAGEMENT_REPORT,
                payload,
                `Monthly Platform Engagement Metrics 📊`
            );
        } catch (err) {
            console.error('[Email] Failed to process MONTHLY_ENGAGEMENT_REPORT event:', err);
        }
    });

    emailEmitter.on(EmailEvent.REPORT_EXPORT_READY, async (payload: { email: string; name: string; reportName: string; downloadUrl: string }) => {
        try {
            await EmailService.sendTemplatedEmail(
                payload.email,
                TemplateName.REPORT_EXPORT_READY,
                payload,
                `Export Ready: "${payload.reportName}" 📁`
            );
        } catch (err) {
            console.error('[Email] Failed to process REPORT_EXPORT_READY event:', err);
        }
    });

    emailEmitter.on(EmailEvent.SCHEDULED_REPORT_DELIVERY, async (payload: { email: string; name: string; reportName: string; period: string }) => {
        try {
            await EmailService.sendTemplatedEmail(
                payload.email,
                TemplateName.SCHEDULED_REPORT_DELIVERY,
                payload,
                `Scheduled Report: "${payload.reportName}" 📅`
            );
        } catch (err) {
            console.error('[Email] Failed to process SCHEDULED_REPORT_DELIVERY event:', err);
        }
    });

    emailEmitter.on(EmailEvent.REPORT_GENERATION_FAILED, async (payload: { email: string; name: string; reportName: string; reason: string }) => {
        try {
            await EmailService.sendTemplatedEmail(
                payload.email,
                TemplateName.REPORT_GENERATION_FAILED,
                payload,
                `Report Compile Failed: "${payload.reportName}" ❌`
            );
        } catch (err) {
            console.error('[Email] Failed to process REPORT_GENERATION_FAILED event:', err);
        }
    });

    // ── Admin Events ──
    emailEmitter.on(EmailEvent.APPROVAL_REQUIRED, async (payload: { email: string; adminName: string; organizerName: string; orgName: string; eventName: string; approvalUrl: string }) => {
        try {
            await EmailService.sendTemplatedEmail(
                payload.email,
                TemplateName.APPROVAL_REQUIRED,
                payload,
                `Review Required: Event Approval Needed 🛡️`
            );
        } catch (err) {
            console.error('[Email] Failed to process APPROVAL_REQUIRED event:', err);
        }
    });

    emailEmitter.on(EmailEvent.APPROVAL_DECISION, async (payload: { email: string; organizerName: string; orgName: string; isApproved: boolean; reason?: string; dashboardUrl: string }) => {
        try {
            const decision = payload.isApproved ? 'Approved' : 'Not Approved';
            await EmailService.sendTemplatedEmail(
                payload.email,
                TemplateName.APPROVAL_DECISION,
                payload,
                `Organizer Studio Request: ${decision} 🛡`
            );
        } catch (err) {
            console.error('[Email] Failed to process APPROVAL_DECISION event:', err);
        }
    });

    emailEmitter.on(EmailEvent.LARGE_POINT_ADJUSTMENT, async (payload: { email: string; adminName: string; targetUserName: string; pointsAdjusted: number; newTotal: number; reason: string }) => {
        try {
            await EmailService.sendTemplatedEmail(
                payload.email,
                TemplateName.LARGE_POINT_ADJUSTMENT,
                payload,
                `Security Alert: Large Point Adjustment 🪙`
            );
        } catch (err) {
            console.error('[Email] Failed to process LARGE_POINT_ADJUSTMENT event:', err);
        }
    });

    emailEmitter.on(EmailEvent.SYSTEM_FAILURE, async (payload: { email: string; adminName: string; serviceName: string; errorMessage: string; severity: string }) => {
        try {
            await EmailService.sendTemplatedEmail(
                payload.email,
                TemplateName.SYSTEM_FAILURE,
                payload,
                `System Failure Alert [${payload.severity}] 🚨`
            );
        } catch (err) {
            console.error('[Email] Failed to process SYSTEM_FAILURE event:', err);
        }
    });

    emailEmitter.on(EmailEvent.AUDIT_NOTIFICATION, async (payload: { email: string; name: string; action: string; entityType: string; time: string; ipAddress: string }) => {
        try {
            await EmailService.sendTemplatedEmail(
                payload.email,
                TemplateName.AUDIT_NOTIFICATION,
                payload,
                `Admin Audit Event: "${payload.action}" 🛡️`
            );
        } catch (err) {
            console.error('[Email] Failed to process AUDIT_NOTIFICATION event:', err);
        }
    });

    emailEmitter.on(EmailEvent.REGISTRATION_CONFIRMED, async (payload: { email: string; name: string; eventTitle: string; dashboardUrl: string }) => {
        try {
            await EmailService.sendTemplatedEmail(
                payload.email,
                TemplateName.REGISTRATION_CONFIRMED,
                payload,
                `Registration Confirmed: "${payload.eventTitle}"! 🎟️`
            );
        } catch (err) {
            console.error('[Email] Failed to process REGISTRATION_CONFIRMED event:', err);
        }
    });

    emailEmitter.on(EmailEvent.EVENT_APPROVED, async (payload: { email: string; organizerName: string; eventTitle: string; eventUrl: string }) => {
        try {
            await EmailService.sendTemplatedEmail(
                payload.email,
                TemplateName.EVENT_APPROVED,
                payload,
                `Approved & Live: "${payload.eventTitle}"! 🟢`
            );
        } catch (err) {
            console.error('[Email] Failed to process EVENT_APPROVED event:', err);
        }
    });

    emailEmitter.on(EmailEvent.EVENT_REJECTED, async (payload: { email: string; organizerName: string; eventTitle: string; reason: string; dashboardUrl: string }) => {
        try {
            await EmailService.sendTemplatedEmail(
                payload.email,
                TemplateName.EVENT_REJECTED,
                payload,
                `Action Required: "${payload.eventTitle}" Update 🔴`
            );
        } catch (err) {
            console.error('[Email] Failed to process EVENT_REJECTED event:', err);
        }
    });
};
export default registerEmailListeners;
