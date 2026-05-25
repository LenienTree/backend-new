import { validateConfig } from './config';
import { verifyConnection } from './providers/smtp.provider';
import { registerEmailListeners } from './events/email.listeners';
import { startSchedulers } from './schedulers';

export { emailEmitter } from './events/email.emitter';
export { EmailService } from './services/email.service';
export { EmailEvent, TemplateName } from './constants';

/**
 * Bootstraps the complete email notification system.
 * Validates configuration settings, verifies SMTP health, binds listeners, and runs schedulers.
 */
export const initEmailSystem = async (): Promise<void> => {
    console.log('🌳 [Email] Initializing Automated Email System...');
    
    // 1. Validate environment configuration
    validateConfig();
    
    // 2. Register event listeners for internal emitter triggers
    registerEmailListeners();
    
    // 3. Verify SMTP provider connection (non-blocking connection verify)
    verifyConnection().then((ok) => {
        if (!ok) {
            console.warn('⚠️ [Email] SMTP server is unreachable. System running in degraded mode.');
        }
    });

    // 4. Start background cron jobs/schedulers
    startSchedulers();

    console.log('✅ [Email] Centralized Email Module initialized successfully');
};
