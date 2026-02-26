import { z } from 'zod';

export const updateProfileSchema = z.object({
    name: z.string().min(2).max(100).optional(),
    phone: z.string().optional(),
    college: z.string().optional(),
    graduationYear: z.number().int().min(2000).max(2035).optional(),
    bio: z.string().max(500).optional(),
    skills: z.array(z.string()).optional(),
    socialLinks: z
        .object({
            linkedin: z.string().url().optional().or(z.literal('')),
            github: z.string().url().optional().or(z.literal('')),
            instagram: z.string().url().optional().or(z.literal('')),
            twitter: z.string().url().optional().or(z.literal('')),
            website: z.string().url().optional().or(z.literal('')),
        })
        .optional(),
});

export const addGalleryImageSchema = z.object({
    caption: z.string().max(200).optional(),
});

export const issueCertificateSchema = z.object({
    userId: z.string().uuid(),
    eventId: z.string().uuid(),
    certificateUrl: z.string().url(),
});
