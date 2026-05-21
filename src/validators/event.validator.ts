import { z } from 'zod';

export const createEventStep1Schema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(200),
    subtitle: z.string().max(300).optional(),
    category: z.enum(['Hackathon', 'Ideathon', 'Webinar', 'Conclave', 'Other']),
    theme: z.string().max(200).optional(),
    mode: z.enum(['ONLINE', 'OFFLINE']),
    location: z
        .object({
            venueName: z.string().optional(),
            address: z.string().optional(),
            mapLink: z.string().url().optional(),
        })
        .optional(),
    startDate: z.string().datetime({ message: 'Invalid start date' }),
    endDate: z.string().datetime({ message: 'Invalid end date' }),
    registrationDeadline: z.string().datetime({
        message: 'Invalid registration deadline',
    }),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    prizeType: z.enum(['NONE', 'CASH', 'MERCH', 'POINTS']).default('NONE'),
    prizeAmount: z.number().min(0).optional(),
    isPaid: z.boolean().default(false),
    ticketPrice: z.number().min(0).optional(),
    registrationType: z.enum(['INDIVIDUAL', 'GROUP']).default('INDIVIDUAL'),
    minTeamSize: z.number().int().min(1).optional(),
    maxTeamSize: z.number().int().min(1).optional(),
    faqs: z
        .array(
            z.object({
                question: z.string().min(5, 'Question must be at least 5 characters').max(500),
                answer: z.string().min(5, 'Answer must be at least 5 characters'),
                order: z.number().int().min(0).optional(),
            })
        )
        .optional(),
    announcements: z
        .array(
            z.object({
                title: z.string().min(2, 'Title must be at least 2 characters').max(200),
                content: z.string().min(5, 'Content must be at least 5 characters'),
                publishDate: z.string().datetime().optional(),
            })
        )
        .optional(),
});

export const updateEventStep2Schema = z.object({
    maxParticipants: z.number().int().min(1).optional(),
    approvalMode: z.enum(['AUTO', 'MANUAL']).default('AUTO'),
    designConfig: z
        .object({
            primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
            secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
            accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
        })
        .optional(),
    customFormFields: z
        .array(
            z.object({
                label: z.string(),
                type: z.enum(['text', 'email', 'number', 'select', 'textarea', 'checkbox']),
                required: z.boolean().default(false),
                options: z.array(z.string()).optional(),
            })
        )
        .optional(),
    paymentType: z.enum(['FREE', 'MANUAL_UPI', 'RAZORPAY']).optional(),
    upiId: z.string().nullable().optional(),
});

export const submitEventSchema = z.object({
    // Final submission — validate publishing
    agreedToTerms: z.boolean().refine((v) => v === true, {
        message: 'You must agree to the terms.',
    }),
});

export const updateEventSchema = createEventStep1Schema.partial().merge(
    updateEventStep2Schema.partial()
).extend({
    venueName: z.string().nullable().optional(),
    address: z.string().nullable().optional(),
    mapLink: z.string().nullable().optional(),
    upiQrCode: z.string().nullable().optional(),
});

export const eventFiltersSchema = z.object({
    category: z.enum(['Hackathon', 'Ideathon', 'Webinar', 'Conclave', 'Other']).optional(),
    month: z.string().regex(/^\d{4}-\d{2}$/, 'Format: YYYY-MM').optional(),
    status: z.enum(['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'COMPLETED']).optional(),
    search: z.string().max(100).optional(),
    mode: z.enum(['ONLINE', 'OFFLINE']).optional(),
    isPaid: z.enum(['true', 'false']).optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
});
