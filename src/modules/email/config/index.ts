import { config as globalConfig } from '../../../config/config';
import { RetryConfig } from '../types';

export const emailConfig = {
    smtp: {
        host: globalConfig.smtp.host || 'smtp.gmail.com',
        port: globalConfig.smtp.port || 587,
        secure: globalConfig.smtp.port === 465,
        auth: {
            user: globalConfig.smtp.user || '',
            pass: globalConfig.smtp.pass || '',
        },
        from: globalConfig.smtp.from || 'LenientTree <no-reply@lenienttree.com>',
    },
    retry: {
        maxRetries: 3,
        initialDelayMs: 2000, // 2 seconds
        backoffFactor: 2,     // Exponential
    } as RetryConfig,
    scheduler: {
        weeklyDigestCron: '0 9 * * 1',      // Every Monday at 9:00 AM
        engagementReportCron: '0 10 1 * *', // 1st of every month at 10:00 AM
        streakWarningCron: '0 18 * * *',     // Every day at 6:00 PM
    }
};

export const validateConfig = (): void => {
    const { smtp } = emailConfig;
    if (!smtp.auth.user || smtp.auth.user === 'your_email@gmail.com') {
        console.warn('⚠️ SMTP user is not configured correctly. Emails will fallback to mock logging.');
    }
    if (!smtp.auth.pass || smtp.auth.pass === 'your_app_password') {
        console.warn('⚠️ SMTP password is not configured correctly. Emails will fallback to mock logging.');
    }
};
