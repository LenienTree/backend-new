import { z } from 'zod';

export const registerEventSchema = z.object({
    formData: z.record(z.string(), z.unknown()).optional(),
    paymentProof: z.string().optional(), // This will store the link
    referralCode: z.string().optional(),
});

export const announcementSchema = z.object({
    title: z.string().min(2).max(200),
    content: z.string().min(5),
    publishDate: z.string().datetime().optional(),
});

export const faqSchema = z.object({
    question: z.string().min(5).max(500),
    answer: z.string().min(5),
    order: z.number().int().min(0).optional(),
});

export const approveRejectRegistrationSchema = z.object({
    reason: z.string().optional(),
});

export const adminApproveEventSchema = z.object({
    isFeatured: z.boolean().optional(),
});

export const adminRejectEventSchema = z.object({
    reason: z.string().min(10, 'Please provide a reason for rejection'),
});

export const blockUserSchema = z.object({
    reason: z.string().optional(),
});
