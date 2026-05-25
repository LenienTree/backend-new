export interface EmailAttachment {
    filename: string;
    content?: string | Buffer;
    path?: string;
    contentType?: string;
    cid?: string;
}

export interface EmailOptions {
    to: string | string[];
    subject: string;
    html?: string;
    text?: string;
    attachments?: EmailAttachment[];
    from?: string;
    replyTo?: string;
}

export interface RetryConfig {
    maxRetries: number;
    initialDelayMs: number;
    backoffFactor: number;
}

export interface TemplateContexts {
    welcome: {
        name: string;
        loginUrl: string;
    };
    verification: {
        name: string;
        verificationUrl: string;
        expiresInHours?: number;
    };
    passwordReset: {
        name: string;
        resetUrl: string;
        expiresInHours?: number;
    };
    passwordChanged: {
        name: string;
        supportEmail?: string;
    };
    suspiciousLogin: {
        name: string;
        device: string;
        location: string;
        ipAddress: string;
        time: string;
    };
    accountDeleted: {
        name: string;
    };
    eventCreated: {
        organizerName: string;
        eventTitle: string;
        dashboardUrl: string;
    };
    eventUpdated: {
        name: string;
        eventTitle: string;
        changeSummary: string;
        eventUrl: string;
    };
    eventReminder: {
        name: string;
        eventTitle: string;
        startDate: string;
        venue: string;
        eventUrl: string;
    };
    eventCancelled: {
        name: string;
        eventTitle: string;
        reason?: string;
    };
    eventCompleted: {
        name: string;
        eventTitle: string;
        certificateUrl?: string;
    };
    attendanceConfirmed: {
        name: string;
        eventTitle: string;
        date: string;
    };
    registrationConfirmed: {
        name: string;
        eventTitle: string;
        dashboardUrl: string;
    };
    eventApproved: {
        organizerName: string;
        eventTitle: string;
        eventUrl: string;
    };
    eventRejected: {
        organizerName: string;
        eventTitle: string;
        reason: string;
        dashboardUrl: string;
    };
    rewardEarned: {
        name: string;
        rewardName: string;
        rewardCode?: string;
    };
    badgeEarned: {
        name: string;
        badgeName: string;
        badgeIconUrl?: string;
        badgeDescription?: string;
    };
    pointsAwarded: {
        name: string;
        points: number;
        reason: string;
        totalPoints: number;
    };
    leaderboardRankImproved: {
        name: string;
        rank: number;
        previousRank: number;
    };
    weeklyLeaderboardSummary: {
        name: string;
        rank: number;
        totalPoints: number;
        topPerformers: Array<{ name: string; rank: number; points: number }>;
    };
    milestoneReached: {
        name: string;
        milestoneName: string;
        description: string;
    };
    streakWarning: {
        name: string;
        streakDays: number;
        daysRemaining: number;
    };
    weeklyAnalyticsReport: {
        name: string;
        totalParticipants: number;
        totalEvents: number;
        totalRevenue: number;
        conversionRate: string;
        topEvents: Array<{ title: string; registrationsCount: number }>;
    };
    monthlyEngagementReport: {
        name: string;
        activeUsers: number;
        engagementRate: string;
    };
    reportExportReady: {
        name: string;
        reportName: string;
        downloadUrl: string;
    };
    scheduledReportDelivery: {
        name: string;
        reportName: string;
        period: string;
    };
    reportGenerationFailed: {
        name: string;
        reportName: string;
        reason: string;
    };
    approvalRequired: {
        adminName: string;
        organizerName: string;
        orgName: string;
        eventName: string;
        approvalUrl: string;
    };
    approvalDecision: {
        organizerName: string;
        orgName: string;
        isApproved: boolean;
        reason?: string;
        dashboardUrl: string;
    };
    largePointAdjustment: {
        adminName: string;
        targetUserName: string;
        pointsAdjusted: number;
        newTotal: number;
        reason: string;
    };
    systemAutomationFailure: {
        adminName: string;
        serviceName: string;
        errorMessage: string;
        severity: string;
    };
    auditNotification: {
        name: string;
        action: string;
        entityType: string;
        time: string;
        ipAddress: string;
    };
}
