import { z } from 'zod';

export const updateTemplateSchema = z.object({
    subject: z.string().max(500).nullable().optional(),
    bodyHtml: z.string().max(100000).nullable().optional(),
    enabled: z.boolean().optional(),
});

export const previewTemplateSchema = z.object({
    subject: z.string().max(500).optional(),
    bodyHtml: z.string().max(100000).optional(),
    context: z.record(z.string(), z.unknown()).optional(),
});

export const testTemplateSchema = z.object({
    to: z.string().email(),
    subject: z.string().max(500).optional(),
    bodyHtml: z.string().max(100000).optional(),
});

export const sendCustomSchema = z.object({
    mode: z.enum(['manual', 'all', 'event', 'interest']),
    emails: z.array(z.string()).optional(),
    eventId: z.string().optional(),
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'PAYMENT_PENDING', 'ATTENDED']).optional(),
    interest: z.string().optional(),
    subject: z.string().min(1).max(500),
    html: z.string().min(1).max(200000),
});
