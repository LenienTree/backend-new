import crypto from 'crypto';
import { getTransporter } from '../providers/smtp.provider';
import { renderTemplate } from '../templates';
import { retryWithBackoff } from '../utils/retry';
import { EmailOptions, TemplateContexts } from '../types';
import { emailConfig } from '../config';
import { prisma } from '../../../config/database';

// Simple in-memory cache to prevent duplicate email sends within 10 seconds (idempotency key)
const sentEmailsCache = new Map<string, number>();
const CACHE_TTL_MS = 10000; // 10 seconds

export class EmailService {
    /**
     * Sends a raw email using the nodemailer transporter.
     * Retries automatically on failure using exponential backoff.
     */
    static async send(options: EmailOptions): Promise<void> {
        const transporter = getTransporter();
        const from = options.from || emailConfig.smtp.from;
        
        // Generate idempotency key to prevent double sends
        const idempotencyKey = crypto
            .createHash('sha256')
            .update(JSON.stringify({ to: options.to, subject: options.subject, html: options.html }))
            .digest('hex');

        const now = Date.now();
        const lastSent = sentEmailsCache.get(idempotencyKey);
        if (lastSent && (now - lastSent) < CACHE_TTL_MS) {
            console.warn(`[Email] Duplicate email detected for key: ${idempotencyKey}. Skipping send.`);
            return;
        }

        // Add to cache
        sentEmailsCache.set(idempotencyKey, now);

        // Cleanup old cache entries
        for (const [key, timestamp] of sentEmailsCache.entries()) {
            if (now - timestamp > CACHE_TTL_MS) {
                sentEmailsCache.delete(key);
            }
        }

        await retryWithBackoff(async () => {
            await transporter.sendMail({
                from,
                to: options.to,
                subject: options.subject,
                html: options.html,
                text: options.text,
                attachments: options.attachments,
                replyTo: options.replyTo,
            });
        }, `Send email to ${Array.isArray(options.to) ? options.to.join(',') : options.to}`);

        // Async log to database (non-blocking)
        this.logEmailDelivery(options).catch((err) => {
            console.error('[Email] Failed to write delivery log to database:', err);
        });
    }

    /**
     * Renders a Handlebars template and dispatches the email.
     */
    static async sendTemplatedEmail<K extends keyof TemplateContexts>(
        to: string | string[],
        templateName: K,
        context: TemplateContexts[K],
        subject: string,
        attachments?: EmailOptions['attachments']
    ): Promise<void> {
        try {
            const html = renderTemplate(templateName, context, subject);
            await this.send({
                to,
                subject,
                html,
                attachments,
            });
        } catch (error) {
            console.error(`[Email] Failed to compile and send templated email (${templateName}):`, error);
            // Log a system failure in case of template issues
            this.logSystemFailure(templateName, error).catch(console.error);
            throw error;
        }
    }

    /**
     * Logs the email delivery to the database's AuditLog table (non-blocking fallback)
     */
    private static async logEmailDelivery(options: EmailOptions): Promise<void> {
        try {
            const recipients = Array.isArray(options.to) ? options.to.join(', ') : options.to;
            await prisma.auditLog.create({
                data: {
                    action: 'EMAIL_DISPATCHED',
                    entity: 'Email',
                    newValue: {
                        to: recipients,
                        subject: options.subject,
                        timestamp: new Date().toISOString(),
                    },
                },
            });
        } catch (error) {
            // Keep fail-safe: console log only if DB fails
            console.error('[Email] Failed logging to AuditLog table:', error);
        }
    }

    /**
     * Log a template failure into AuditLog
     */
    private static async logSystemFailure(templateName: string, error: any): Promise<void> {
        try {
            await prisma.auditLog.create({
                data: {
                    action: 'EMAIL_TEMPLATE_FAILURE',
                    entity: 'System',
                    newValue: {
                        template: templateName,
                        error: error instanceof Error ? error.message : String(error),
                        timestamp: new Date().toISOString(),
                    },
                },
            });
        } catch (e) {
            console.error('[Email] DB logger error:', e);
        }
    }
}
export default EmailService;
