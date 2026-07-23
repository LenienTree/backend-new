import Handlebars from 'handlebars';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { AppError } from '../utils/apiResponse';
import { getPagination, buildPaginatedResult } from '../utils/helpers';
import {
    EmailService,
    invalidateTemplateCache,
    renderTemplate,
    BASE_LAYOUT,
    templateSources,
    EMAIL_REGISTRY,
    registryByName,
} from '../modules/email';

const UNSUBSCRIBE_URL = 'https://lenienttree.com/unsubscribe';
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export type RecipientMode = 'manual' | 'all' | 'event' | 'interest';
export interface RecipientOpts {
    mode: RecipientMode;
    emails?: string[];
    eventId?: string;
    status?: string;
    interest?: string;
}

export class EmailAdminService {
    /** All templates with their current effective subject + enabled/customized state. */
    async listTemplates() {
        const overrides = await prisma.emailTemplate.findMany();
        const byName = new Map(overrides.map((o) => [o.name, o]));
        return EMAIL_REGISTRY.map((meta) => {
            const o = byName.get(meta.name);
            return {
                name: meta.name,
                event: meta.event,
                category: meta.category,
                description: meta.description,
                variables: meta.variables,
                critical: meta.critical,
                subject: o?.subject ?? meta.defaultSubject,
                enabled: o ? o.enabled : true,
                customized: !!(o && (o.subject || o.bodyHtml)),
                updatedAt: o?.updatedAt ?? null,
            };
        });
    }

    /** Full detail for the editor: default body, current override, effective values. */
    async getTemplate(name: string) {
        const meta = registryByName[name];
        if (!meta) throw new AppError('Unknown email template.', 404);
        const override = await prisma.emailTemplate.findUnique({ where: { name } });
        return {
            name: meta.name,
            event: meta.event,
            category: meta.category,
            description: meta.description,
            variables: meta.variables,
            sampleContext: meta.sampleContext,
            critical: meta.critical,
            defaultSubject: meta.defaultSubject,
            defaultBody: templateSources[name] ?? '',
            enabled: override ? override.enabled : true,
            effectiveSubject: override?.subject ?? meta.defaultSubject,
            effectiveBody: override?.bodyHtml ?? templateSources[name] ?? '',
            override: override
                ? {
                      subject: override.subject,
                      bodyHtml: override.bodyHtml,
                      enabled: override.enabled,
                      updatedAt: override.updatedAt,
                      updatedBy: override.updatedBy,
                  }
                : null,
        };
    }

    async updateTemplate(
        name: string,
        data: { subject?: string | null; bodyHtml?: string | null; enabled?: boolean },
        adminId?: string
    ) {
        const meta = registryByName[name];
        if (!meta) throw new AppError('Unknown email template.', 404);
        if (data.subject) this.assertCompiles(data.subject, 'subject');
        if (data.bodyHtml) this.assertCompiles(data.bodyHtml, 'body');

        // Critical transactional emails can never be paused.
        const enabled = meta.critical ? true : data.enabled;

        const updated = await prisma.emailTemplate.upsert({
            where: { name },
            create: {
                name,
                subject: data.subject ?? null,
                bodyHtml: data.bodyHtml ?? null,
                enabled: enabled ?? true,
                updatedBy: adminId ?? null,
            },
            update: {
                ...(data.subject !== undefined ? { subject: data.subject } : {}),
                ...(data.bodyHtml !== undefined ? { bodyHtml: data.bodyHtml } : {}),
                ...(enabled !== undefined ? { enabled } : {}),
                updatedBy: adminId ?? null,
            },
        });
        invalidateTemplateCache(name);
        return updated;
    }

    /** Remove the override row → the template reverts to the built-in default. */
    async resetTemplate(name: string) {
        const meta = registryByName[name];
        if (!meta) throw new AppError('Unknown email template.', 404);
        await prisma.emailTemplate.deleteMany({ where: { name } });
        invalidateTemplateCache(name);
        return { success: true };
    }

    /** Render a template (with optional unsaved edits) against its sample context. */
    async preview(
        name: string,
        data: { subject?: string; bodyHtml?: string; context?: Record<string, unknown> }
    ): Promise<{ subject: string; html: string }> {
        const meta = registryByName[name];
        if (!meta) throw new AppError('Unknown email template.', 404);
        const override = await prisma.emailTemplate.findUnique({ where: { name } });
        const ctx = { ...meta.sampleContext, ...(data.context || {}) };

        const subjectSrc = data.subject ?? override?.subject ?? meta.defaultSubject;
        let subject = subjectSrc;
        try {
            subject = Handlebars.compile(subjectSrc)(ctx);
        } catch {
            /* fall back to raw subject */
        }

        const bodyOverride = data.bodyHtml ?? override?.bodyHtml ?? undefined;
        const html = renderTemplate(name, ctx, subject, UNSUBSCRIBE_URL, bodyOverride ?? undefined);
        return { subject, html };
    }

    /** Send a single rendered template to a test address. */
    async sendTest(name: string, to: string, data: { subject?: string; bodyHtml?: string }) {
        if (!EMAIL_RE.test(to)) throw new AppError('Invalid test recipient email.', 400);
        const { subject, html } = await this.preview(name, { subject: data.subject, bodyHtml: data.bodyHtml });
        await EmailService.send({ to, subject: `[TEST] ${subject}`, html });
        return { success: true, to };
    }

    private assertCompiles(src: string, label: string) {
        try {
            Handlebars.compile(src);
        } catch (e) {
            throw new AppError(`Invalid Handlebars in ${label}: ${(e as Error).message}`, 400);
        }
    }

    // ── Custom broadcast ──────────────────────────────────────────────────────

    async resolveRecipients(opts: RecipientOpts): Promise<string[]> {
        let list: string[] = [];
        switch (opts.mode) {
            case 'manual':
                list = opts.emails || [];
                break;
            case 'all': {
                const users = await prisma.user.findMany({
                    where: { deletedAt: null, isEmailVerified: true },
                    select: { email: true },
                });
                list = users.map((u) => u.email);
                break;
            }
            case 'event': {
                if (!opts.eventId) throw new AppError('eventId is required for event recipients.', 400);
                const regs = await prisma.registration.findMany({
                    where: {
                        eventId: opts.eventId,
                        ...(opts.status ? { status: opts.status as Prisma.RegistrationWhereInput['status'] } : {}),
                    },
                    select: { user: { select: { email: true } } },
                });
                list = regs.map((r) => r.user?.email).filter((e): e is string => !!e);
                break;
            }
            case 'interest': {
                if (!opts.interest) throw new AppError('interest is required.', 400);
                const users = await prisma.user.findMany({
                    where: { deletedAt: null, interests: { has: opts.interest } },
                    select: { email: true },
                });
                list = users.map((u) => u.email);
                break;
            }
            default:
                throw new AppError('Invalid recipient mode.', 400);
        }

        // Normalize, validate, dedupe.
        const seen = new Set<string>();
        const out: string[] = [];
        for (const raw of list) {
            const email = (raw || '').trim().toLowerCase();
            if (EMAIL_RE.test(email) && !seen.has(email)) {
                seen.add(email);
                out.push(email);
            }
        }
        return out;
    }

    async recipientCount(opts: RecipientOpts): Promise<number> {
        return (await this.resolveRecipients(opts)).length;
    }

    async sendCustom(
        opts: RecipientOpts & { subject: string; html: string },
        adminId?: string
    ): Promise<{ queued: number }> {
        const recipients = await this.resolveRecipients(opts);
        if (recipients.length === 0) throw new AppError('No valid recipients resolved for this audience.', 400);
        const MAX = 10000;
        if (recipients.length > MAX) {
            throw new AppError(`Too many recipients (${recipients.length}). Maximum is ${MAX} per send.`, 400);
        }

        // Wrap the admin's body in the branded base layout so custom mails match the brand.
        const layout = Handlebars.compile(BASE_LAYOUT);
        const html = layout({ subject: opts.subject, body: opts.html, unsubscribeUrl: UNSUBSCRIBE_URL });

        // Record the broadcast intent up-front.
        await prisma.auditLog
            .create({
                data: {
                    userId: adminId ?? undefined,
                    action: 'EMAIL_CUSTOM_SENT',
                    entity: 'Email',
                    newValue: {
                        mode: opts.mode,
                        subject: opts.subject,
                        recipients: recipients.length,
                        timestamp: new Date().toISOString(),
                    },
                },
            })
            .catch(() => {});

        // Dispatch in the background so the HTTP request isn't held open for a large batch.
        setImmediate(async () => {
            let sent = 0;
            let failed = 0;
            for (const to of recipients) {
                try {
                    await EmailService.send({ to, subject: opts.subject, html });
                    sent++;
                } catch (err) {
                    failed++;
                    console.error(`[Email] Custom send failed for ${to}:`, err);
                }
            }
            console.log(`[Email] Custom broadcast complete — sent ${sent}, failed ${failed} of ${recipients.length}`);
        });

        return { queued: recipients.length };
    }

    /** Email-related audit rows (dispatched / skipped / custom / template failures). */
    async getLogs(page = '1', limit = '20') {
        const { skip, page: p, limit: l } = getPagination(page, limit);
        const where: Prisma.AuditLogWhereInput = { entity: { in: ['Email', 'System'] } };
        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                include: { user: { select: { name: true, email: true } } },
                skip,
                take: l,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.auditLog.count({ where }),
        ]);
        return buildPaginatedResult(logs, total, p, l);
    }
}

export const emailAdminService = new EmailAdminService();
