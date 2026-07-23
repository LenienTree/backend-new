import crypto from 'crypto';
import Handlebars from 'handlebars';
import { getTransporter } from '../providers/smtp.provider';
import { renderTemplate } from '../templates';
import { retryWithBackoff } from '../utils/retry';
import { EmailOptions, TemplateContexts } from '../types';
import { emailConfig } from '../config';
import { CRITICAL_TEMPLATES } from '../registry';
import { prisma } from '../../../config/database';

// In-memory dedup cache — guards against duplicate sends within a single worker process.
// In PM2 cluster mode each worker has its own cache, so cross-worker dedup is NOT guaranteed.
// To fix cross-worker duplicates properly, replace this Map with a shared Redis store.
const sentEmailsCache = new Map<string, number>();
const CACHE_TTL_MS = 10000; // 10 seconds

// ── Admin template overrides ──
// Admins can edit a template's subject/body or pause it entirely; those overrides live
// in the EmailTemplate table. We cache lookups per worker for a short TTL so the send
// path stays fast. Every lookup is resilient: on any error we return null and fall back
// to the built-in default, so email delivery is never blocked by this layer.
interface TemplateOverride {
    subject: string | null;
    bodyHtml: string | null;
    enabled: boolean;
}
const overrideCache = new Map<string, { value: TemplateOverride | null; at: number }>();
const OVERRIDE_TTL_MS = 30000; // 30 seconds

async function getTemplateOverride(name: string): Promise<TemplateOverride | null> {
    const cached = overrideCache.get(name);
    if (cached && Date.now() - cached.at < OVERRIDE_TTL_MS) return cached.value;
    try {
        const row = await prisma.emailTemplate.findUnique({ where: { name } });
        const value: TemplateOverride | null = row
            ? { subject: row.subject, bodyHtml: row.bodyHtml, enabled: row.enabled }
            : null;
        overrideCache.set(name, { value, at: Date.now() });
        return value;
    } catch (err) {
        console.error('[Email] Failed to load template override; using default.', err);
        return null;
    }
}

/** Drop cached overrides so admin edits take effect immediately (same worker). */
export function invalidateTemplateCache(name?: string): void {
    if (name) overrideCache.delete(name);
    else overrideCache.clear();
}

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
            const name = templateName as string;
            const override = await getTemplateOverride(name);

            // Respect an admin "pause" — but never for critical transactional emails
            // (verification, password reset, etc.), which must always be delivered.
            if (override && override.enabled === false && !CRITICAL_TEMPLATES.has(name)) {
                console.log(`[Email] Template "${name}" is disabled by admin. Skipping send.`);
                this.logTemplateSkipped(name, to).catch(() => {});
                return;
            }

            // Subject override rendered with the same context; fall back to the caller's
            // subject on any compile error.
            let finalSubject = subject;
            if (override?.subject) {
                try {
                    finalSubject = Handlebars.compile(override.subject)(context);
                } catch {
                    finalSubject = subject;
                }
            }

            const html = renderTemplate(
                name,
                context,
                finalSubject,
                undefined,
                override?.bodyHtml ?? undefined
            );
            await this.send({
                to,
                subject: finalSubject,
                html,
                attachments,
            });
        } catch (error) {
            console.error('[Email] Failed to compile and send templated email.');
            // Log a system failure in case of template issues
            this.logSystemFailure(templateName, error).catch(console.error);
            throw error;
        }
    }

    /** Records that an automated email was skipped because an admin disabled it. */
    private static async logTemplateSkipped(templateName: string, to: string | string[]): Promise<void> {
        try {
            await prisma.auditLog.create({
                data: {
                    action: 'EMAIL_SKIPPED_DISABLED',
                    entity: 'Email',
                    newValue: {
                        template: templateName,
                        to: Array.isArray(to) ? to.join(', ') : to,
                        timestamp: new Date().toISOString(),
                    },
                },
            });
        } catch (error) {
            console.error('[Email] Failed logging skipped email to AuditLog:', error);
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
