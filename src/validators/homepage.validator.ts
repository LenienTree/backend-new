import { z } from 'zod';

export const testimonialSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    role: z.string().min(2, 'Role must be at least 2 characters').max(100),
    quote: z.string().min(5, 'Quote must be at least 5 characters').max(1000),
    avatarUrl: z.string().url().optional().nullable(),
    badge: z.string().max(10).optional().nullable(),
    link: z.string().url().optional().nullable(),
    order: z.number().int().optional(),
});

export const updateOrderSchema = z.object({
    order: z.number().int(),
});

export const updateSectionsOrderSchema = z.object({
    sections: z.array(
        z.object({
            id: z.string().uuid(),
            order: z.number().int(),
        })
    ),
});
