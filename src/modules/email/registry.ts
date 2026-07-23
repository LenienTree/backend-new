/**
 * Static metadata for every automated email the platform sends. Drives the admin
 * "Email Automation" UI: what triggers each mail, which template variables are
 * available, a sample context for previews, and whether it is a critical
 * transactional email that must never be paused.
 *
 * `defaultSubject` mirrors the subject the listener passes today (in Handlebars
 * form) — it is what the editor pre-fills and what preview/test use when no
 * override subject is saved.
 */
export type EmailCategory = 'Auth' | 'Events' | 'Gamification' | 'Reports' | 'Admin';

export interface EmailTemplateMeta {
    name: string;            // matches a TemplateName value, e.g. 'welcome'
    event: string | null;    // EmailEvent that fires it (null = defined but not wired to a trigger)
    category: EmailCategory;
    description: string;     // human-readable trigger description
    defaultSubject: string;  // Handlebars form of the current subject
    variables: string[];     // template variables available in subject/body
    sampleContext: Record<string, unknown>;
    critical: boolean;       // transactional — cannot be disabled
}

export const EMAIL_REGISTRY: EmailTemplateMeta[] = [
    // ── Auth ──
    {
        name: 'welcome', event: 'USER_REGISTERED', category: 'Auth', critical: false,
        description: 'Sent to a user right after they sign up.',
        defaultSubject: 'Welcome to LenientTree! 🚀',
        variables: ['name', 'loginUrl'],
        sampleContext: { name: 'Rahul', loginUrl: 'https://lenienttree.com/dashboard' },
    },
    {
        name: 'verification', event: 'USER_VERIFIED', category: 'Auth', critical: true,
        description: 'Email-address verification link sent on signup.',
        defaultSubject: 'Verify Your LenientTree Email Address ✉️',
        variables: ['name', 'verificationUrl', 'expiresInHours'],
        sampleContext: { name: 'Rahul', verificationUrl: 'https://lenienttree.com/verify?token=abc', expiresInHours: 24 },
    },
    {
        name: 'passwordReset', event: 'PASSWORD_RESET_REQUESTED', category: 'Auth', critical: true,
        description: 'Password-reset link when a user requests one.',
        defaultSubject: 'Reset Your LenientTree Password 🔒',
        variables: ['name', 'resetUrl', 'expiresInHours'],
        sampleContext: { name: 'Rahul', resetUrl: 'https://lenienttree.com/reset?token=abc', expiresInHours: 1 },
    },
    {
        name: 'passwordChanged', event: 'PASSWORD_CHANGED', category: 'Auth', critical: true,
        description: 'Confirmation after a password is changed.',
        defaultSubject: 'Password Updated Successfully ✅',
        variables: ['name', 'supportEmail'],
        sampleContext: { name: 'Rahul', supportEmail: 'security@lenienttree.com' },
    },
    {
        name: 'suspiciousLogin', event: 'SUSPICIOUS_LOGIN', category: 'Auth', critical: true,
        description: 'Security alert on a login from a new device/location.',
        defaultSubject: 'Security Alert: New Login Detected ⚠️',
        variables: ['name', 'device', 'location', 'ipAddress', 'time'],
        sampleContext: { name: 'Rahul', device: 'Chrome on Windows', location: 'Kochi, IN', ipAddress: '103.10.20.30', time: new Date().toLocaleString() },
    },
    {
        name: 'accountDeleted', event: 'ACCOUNT_DELETED', category: 'Auth', critical: false,
        description: 'Confirmation after an account is deleted.',
        defaultSubject: 'LenientTree Account Deleted 😢',
        variables: ['name'],
        sampleContext: { name: 'Rahul' },
    },

    // ── Events ──
    {
        name: 'eventCreated', event: 'EVENT_CREATED', category: 'Events', critical: false,
        description: 'Sent to an organizer when they create a draft event.',
        defaultSubject: 'Draft Created: "{{eventTitle}}" 📅',
        variables: ['organizerName', 'eventTitle', 'dashboardUrl'],
        sampleContext: { organizerName: 'Alpha Tech', eventTitle: 'HackLabs 2026', dashboardUrl: 'https://lenienttree.com/organize' },
    },
    {
        name: 'eventUpdated', event: 'EVENT_UPDATED', category: 'Events', critical: false,
        description: 'Sent to registrants when an event they joined is updated.',
        defaultSubject: 'Updates to Event: "{{eventTitle}}" 📢',
        variables: ['name', 'eventTitle', 'changeSummary', 'eventUrl'],
        sampleContext: { name: 'Rahul', eventTitle: 'HackLabs 2026', changeSummary: 'Venue changed to Hall B.', eventUrl: 'https://lenienttree.com/event/123' },
    },
    {
        name: 'eventReminder', event: 'EVENT_REMINDER', category: 'Events', critical: false,
        description: 'Reminder sent to registrants before an event starts.',
        defaultSubject: 'Reminder: "{{eventTitle}}" is Starting Soon! ⏰',
        variables: ['name', 'eventTitle', 'startDate', 'venue', 'eventUrl'],
        sampleContext: { name: 'Rahul', eventTitle: 'HackLabs 2026', startDate: '25 Jul 2026, 09:00', venue: 'Hall B / Online', eventUrl: 'https://lenienttree.com/event/123' },
    },
    {
        name: 'eventCancelled', event: 'EVENT_CANCELLED', category: 'Events', critical: false,
        description: 'Sent to registrants when an event is cancelled.',
        defaultSubject: 'Cancelled: Event "{{eventTitle}}" 🚫',
        variables: ['name', 'eventTitle', 'reason'],
        sampleContext: { name: 'Rahul', eventTitle: 'HackLabs 2026', reason: 'Insufficient registrations.' },
    },
    {
        name: 'eventCompleted', event: 'EVENT_COMPLETED', category: 'Events', critical: false,
        description: 'Sent to participants after an event completes.',
        defaultSubject: 'Completed: "{{eventTitle}}"! 🎉',
        variables: ['name', 'eventTitle', 'certificateUrl'],
        sampleContext: { name: 'Rahul', eventTitle: 'HackLabs 2026', certificateUrl: 'https://lenienttree.com/cert/123' },
    },
    {
        name: 'registrationConfirmed', event: 'REGISTRATION_CONFIRMED', category: 'Events', critical: false,
        description: 'Sent to a user when their registration is confirmed/approved.',
        defaultSubject: 'Registration Confirmed: "{{eventTitle}}"! 🎟️',
        variables: ['name', 'eventTitle', 'dashboardUrl'],
        sampleContext: { name: 'Rahul', eventTitle: 'HackLabs 2026', dashboardUrl: 'https://lenienttree.com/dashboard' },
    },
    {
        name: 'eventApproved', event: 'EVENT_APPROVED', category: 'Events', critical: false,
        description: 'Sent to an organizer when an admin approves their event.',
        defaultSubject: 'Approved & Live: "{{eventTitle}}"! 🟢',
        variables: ['organizerName', 'eventTitle', 'eventUrl'],
        sampleContext: { organizerName: 'Alpha Tech', eventTitle: 'HackLabs 2026', eventUrl: 'https://lenienttree.com/event/123' },
    },
    {
        name: 'eventRejected', event: 'EVENT_REJECTED', category: 'Events', critical: false,
        description: 'Sent to an organizer when an admin rejects their event.',
        defaultSubject: 'Action Required: "{{eventTitle}}" Update 🔴',
        variables: ['organizerName', 'eventTitle', 'reason', 'dashboardUrl'],
        sampleContext: { organizerName: 'Alpha Tech', eventTitle: 'HackLabs 2026', reason: 'Please add a clearer agenda.', dashboardUrl: 'https://lenienttree.com/organize' },
    },
    {
        name: 'attendanceConfirmed', event: 'ATTENDANCE_CONFIRMED', category: 'Events', critical: false,
        description: 'Sent when a participant is checked in / marked attended.',
        defaultSubject: 'Attendance Verified: "{{eventTitle}}" ✅',
        variables: ['name', 'eventTitle', 'date'],
        sampleContext: { name: 'Rahul', eventTitle: 'HackLabs 2026', date: new Date().toLocaleDateString() },
    },
    {
        name: 'rewardEarned', event: 'REWARD_EARNED', category: 'Events', critical: false,
        description: 'Sent when a participant earns a reward.',
        defaultSubject: 'You Unlocked a Reward! 🎁',
        variables: ['name', 'rewardName', 'rewardCode'],
        sampleContext: { name: 'Rahul', rewardName: 'Amazon Voucher ₹500', rewardCode: 'LT-XYZ-123' },
    },

    // ── Gamification ──
    {
        name: 'badgeEarned', event: 'BADGE_EARNED', category: 'Gamification', critical: false,
        description: 'Sent when a user earns a new badge.',
        defaultSubject: 'Badge Unlocked: "{{badgeName}}"! 🏆',
        variables: ['name', 'badgeName', 'badgeIconUrl', 'badgeDescription'],
        sampleContext: { name: 'Rahul', badgeName: 'First Hackathon', badgeIconUrl: '', badgeDescription: 'Completed your first hackathon.' },
    },
    {
        name: 'pointsAwarded', event: 'POINTS_AWARDED', category: 'Gamification', critical: false,
        description: 'Sent when points are awarded to a user.',
        defaultSubject: 'Points Credited: +{{points}} pts 🪙',
        variables: ['name', 'points', 'reason', 'totalPoints'],
        sampleContext: { name: 'Rahul', points: 50, reason: 'Event participation', totalPoints: 350 },
    },
    {
        name: 'leaderboardRankImproved', event: 'LEADERBOARD_RANK_IMPROVED', category: 'Gamification', critical: false,
        description: "Sent when a user's leaderboard rank improves.",
        defaultSubject: 'Leaderboard Rank Improved! 📈',
        variables: ['name', 'rank', 'previousRank'],
        sampleContext: { name: 'Rahul', rank: 12, previousRank: 20 },
    },
    {
        name: 'weeklyLeaderboardSummary', event: 'WEEKLY_LEADERBOARD_SUMMARY', category: 'Gamification', critical: false,
        description: 'Weekly leaderboard digest (Monday cron).',
        defaultSubject: 'Weekly Leaderboard Digest 📊',
        variables: ['name', 'rank', 'totalPoints', 'topPerformers'],
        sampleContext: { name: 'Rahul', rank: 12, totalPoints: 350, topPerformers: [{ rank: 1, name: 'Asha', points: 900 }, { rank: 2, name: 'Vik', points: 820 }] },
    },
    {
        name: 'milestoneReached', event: 'MILESTONE_REACHED', category: 'Gamification', critical: false,
        description: 'Sent when a user reaches a milestone.',
        defaultSubject: 'Milestone Achieved: "{{milestoneName}}" 🎉',
        variables: ['name', 'milestoneName', 'description'],
        sampleContext: { name: 'Rahul', milestoneName: '10 Events', description: 'You have joined 10 events!' },
    },
    {
        name: 'streakWarning', event: 'STREAK_WARNING', category: 'Gamification', critical: false,
        description: 'Daily nudge to keep an activity streak alive (cron).',
        defaultSubject: 'Save Your active streak! 🔥',
        variables: ['name', 'streakDays', 'daysRemaining'],
        sampleContext: { name: 'Rahul', streakDays: 5, daysRemaining: 1 },
    },

    // ── Reports ──
    {
        name: 'weeklyAnalyticsReport', event: 'WEEKLY_ANALYTICS_REPORT', category: 'Reports', critical: false,
        description: 'Weekly platform analytics digest to admins (Monday cron).',
        defaultSubject: 'Weekly Platform Metrics Report 📈',
        variables: ['name', 'totalUsers', 'totalEvents', 'totalParticipants', 'totalRevenue', 'conversionRate', 'topEvents'],
        sampleContext: { name: 'Admin', totalUsers: 1200, totalEvents: 48, totalParticipants: 5400, totalRevenue: 82000, conversionRate: '61.20', topEvents: [{ title: 'HackLabs 2026', registrationsCount: 320 }] },
    },
    {
        name: 'monthlyEngagementReport', event: 'MONTHLY_ENGAGEMENT_REPORT', category: 'Reports', critical: false,
        description: 'Monthly engagement metrics to admins.',
        defaultSubject: 'Monthly Platform Engagement Metrics 📊',
        variables: ['name', 'activeUsers', 'engagementRate'],
        sampleContext: { name: 'Admin', activeUsers: 860, engagementRate: '72%' },
    },
    {
        name: 'reportExportReady', event: 'REPORT_EXPORT_READY', category: 'Reports', critical: false,
        description: 'Sent when a requested report export is ready.',
        defaultSubject: 'Export Ready: "{{reportName}}" 📁',
        variables: ['name', 'reportName', 'downloadUrl'],
        sampleContext: { name: 'Admin', reportName: 'July Registrations', downloadUrl: 'https://lenienttree.com/exports/july.csv' },
    },
    {
        name: 'scheduledReportDelivery', event: 'SCHEDULED_REPORT_DELIVERY', category: 'Reports', critical: false,
        description: 'Scheduled recurring report delivery.',
        defaultSubject: 'Scheduled Report: "{{reportName}}" 📅',
        variables: ['name', 'reportName', 'period'],
        sampleContext: { name: 'Admin', reportName: 'Weekly Summary', period: 'weekly' },
    },
    {
        name: 'reportGenerationFailed', event: 'REPORT_GENERATION_FAILED', category: 'Reports', critical: false,
        description: 'Sent when a report fails to generate.',
        defaultSubject: 'Report Compile Failed: "{{reportName}}" ❌',
        variables: ['name', 'reportName', 'reason'],
        sampleContext: { name: 'Admin', reportName: 'July Registrations', reason: 'Timeout while aggregating.' },
    },

    // ── Admin ──
    {
        name: 'approvalRequired', event: 'APPROVAL_REQUIRED', category: 'Admin', critical: false,
        description: 'Sent to admins when an event needs approval.',
        defaultSubject: 'Review Required: Event Approval Needed 🛡️',
        variables: ['adminName', 'organizerName', 'orgName', 'eventName', 'approvalUrl'],
        sampleContext: { adminName: 'Admin', organizerName: 'Alpha Tech', orgName: 'Alpha', eventName: 'HackLabs 2026', approvalUrl: 'https://lenienttree.com/admin' },
    },
    {
        name: 'approvalDecision', event: 'APPROVAL_DECISION', category: 'Admin', critical: false,
        description: 'Sent to an organizer with the decision on their access request.',
        defaultSubject: 'Organizer Studio Request Update 🛡',
        variables: ['organizerName', 'orgName', 'isApproved', 'reason', 'dashboardUrl'],
        sampleContext: { organizerName: 'Alpha Tech', orgName: 'Alpha', isApproved: true, reason: '', dashboardUrl: 'https://lenienttree.com/organize' },
    },
    {
        name: 'ruleConfigChanged', event: null, category: 'Admin', critical: false,
        description: 'Audit notice when a global rule config changes. (Template defined; not currently wired to a trigger.)',
        defaultSubject: 'Security Audit: Config Settings Changed 🛡️',
        variables: [],
        sampleContext: {},
    },
    {
        name: 'largePointAdjustment', event: 'LARGE_POINT_ADJUSTMENT', category: 'Admin', critical: false,
        description: 'Alert to admins on a large manual point adjustment.',
        defaultSubject: 'Security Alert: Large Point Adjustment 🪙',
        variables: ['adminName', 'targetUserName', 'pointsAdjusted', 'newTotal', 'reason'],
        sampleContext: { adminName: 'Admin', targetUserName: 'Rahul', pointsAdjusted: 500, newTotal: 850, reason: 'Manual correction' },
    },
    {
        name: 'systemAutomationFailure', event: 'SYSTEM_FAILURE', category: 'Admin', critical: false,
        description: 'Alert to admins when a background job/automation fails.',
        defaultSubject: 'System Failure Alert [{{severity}}] 🚨',
        variables: ['adminName', 'serviceName', 'errorMessage', 'severity'],
        sampleContext: { adminName: 'Admin', serviceName: 'Weekly digest cron', errorMessage: 'SMTP timeout', severity: 'HIGH' },
    },
    {
        name: 'auditNotification', event: 'AUDIT_NOTIFICATION', category: 'Admin', critical: false,
        description: 'Notifies an admin of an audit action on their profile.',
        defaultSubject: 'Admin Audit Event: "{{action}}" 🛡️',
        variables: ['name', 'action', 'entityType', 'time', 'ipAddress'],
        sampleContext: { name: 'Admin', action: 'BLOCK_USER', entityType: 'User', time: new Date().toLocaleString(), ipAddress: '103.10.20.30' },
    },
];

export const registryByName: Record<string, EmailTemplateMeta> = EMAIL_REGISTRY.reduce(
    (acc, t) => { acc[t.name] = t; return acc; },
    {} as Record<string, EmailTemplateMeta>
);

export const CRITICAL_TEMPLATES = new Set(
    EMAIL_REGISTRY.filter((t) => t.critical).map((t) => t.name)
);
