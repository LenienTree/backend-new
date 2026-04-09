import { z } from 'zod';

export const updateProfileSchema = z.object({
    name: z.string().min(2).max(100).optional(),
    phone: z.coerce.string().nullable().optional(),
    college: z.coerce.string().nullable().optional(),
    graduationYear: z.coerce.number().int().min(2000).max(2035).nullable().optional(),
    bio: z.string().max(500).nullable().optional(),
    skills: z.array(z.string()).optional(),
    socialLinks: z
        .object({
            linkedin: z.preprocess((val) => (val === '' || val === null ? undefined : val), z.string().url().optional()),
            github: z.preprocess((val) => (val === '' || val === null ? undefined : val), z.string().url().optional()),
            instagram: z.preprocess((val) => (val === '' || val === null ? undefined : val), z.string().url().optional()),
            twitter: z.preprocess((val) => (val === '' || val === null ? undefined : val), z.string().url().optional()),
            website: z.preprocess((val) => (val === '' || val === null ? undefined : val), z.string().url().optional()),
        })
        .nullable()
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

export const changePasswordSchema = z
    .object({
        currentPassword: z.string().min(1, 'Current password is required'),
        newPassword: z.string().min(8, 'New password must be at least 8 characters'),
        confirmPassword: z.string().min(8, 'Confirm password must be at least 8 characters'),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: "Passwords don't match",
        path: ['confirmPassword'],
    });

export const becomeOrganizerSchema = z.object({
    orgName: z.string().min(2, 'Organization name is required').max(200),
    orgEmail: z.string().email('Invalid organization email'),
    eventName: z.string().min(2, 'Platform/Event name is required').max(200),
});
