import { z } from 'zod';

const strongPassword = z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character');

const dobString = z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date format');

// Fields common to every role's signup. The account itself (name/email/password)
// and access control are identical across roles — only the `profile` varies.
const baseSignup = {
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    email: z.string().email('Invalid email address'),
    password: strongPassword,
    phone: z.string().min(1, 'Phone number is required'),
    referralCode: z.string().optional(),
};

// Role-specific signup, discriminated on `userType`. Each branch validates the base
// account fields + that role's profile object.
export const registerSchema = z.discriminatedUnion('userType', [
    z.object({
        userType: z.literal('SCHOOL_STUDENT'),
        ...baseSignup,
        dateOfBirth: dobString,
        profile: z.object({
            className: z.string().min(1, 'Class is required'),
            country: z.string().min(1, 'Country is required'),
            purpose: z.string().min(1, 'Purpose is required'),
            whatsappNumber: z.string().optional(),
            interests: z.array(z.string()).default([]),
            otherInterests: z.string().optional(),
        }),
    }),
    z.object({
        userType: z.literal('COLLEGE_STUDENT'),
        ...baseSignup,
        dateOfBirth: dobString,
        college: z.string().min(1, 'College is required'),
        profile: z.object({
            interests: z.array(z.string()).default([]),
            otherInterests: z.string().optional(),
        }),
    }),
    z.object({
        userType: z.literal('PROFESSIONAL'),
        ...baseSignup,
        profile: z.object({
            jobTitle: z.string().min(1, 'Job title / desired role is required'),
            yearsOfExperience: z.string().min(1, 'Years of experience is required'),
            keySkills: z.array(z.string()).default([]),
            noticePeriod: z.string().min(1, 'Notice period is required'),
            currentCompany: z.string().optional(),
        }),
    }),
    z.object({
        userType: z.literal('HR_RECRUITER'),
        ...baseSignup,
        profile: z.object({
            companyName: z.string().min(1, 'Company name is required'),
            jobTitle: z.string().min(1, 'Job title / designation is required'),
            companySize: z.string().min(1, 'Company size is required'),
            industry: z.string().min(1, 'Industry is required'),
            hiringRequirement: z.string().min(1, 'Hiring requirement is required'),
            companyWebsite: z.string().optional(),
            linkedinProfile: z.string().optional(),
        }),
    }),
    z.object({
        userType: z.literal('FOUNDER'),
        ...baseSignup,
        profile: z.object({
            companyName: z.string().min(1, 'Company name is required'),
            founderRole: z.string().min(1, 'Founder role is required'),
            startupStage: z.string().min(1, 'Startup stage is required'),
            industry: z.string().min(1, 'Industry / sector is required'),
            otherIndustry: z.string().optional(),
            linkedin: z.string().optional(),
            github: z.string().optional(),
            twitter: z.string().optional(),
            portfolio: z.string().optional(),
            startupWebsite: z.string().optional(),
        }),
    }),
]);

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

export const googleAuthSchema = z.object({
    idToken: z.string().min(1, 'Google ID token is required'),
});

export const forgotPasswordSchema = z.object({
    email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
    token: z.string().min(1, 'Reset token is required'),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[a-z]/, 'Must contain a lowercase letter')
        .regex(/[A-Z]/, 'Must contain an uppercase letter')
        .regex(/[0-9]/, 'Must contain a number')
        .regex(/[^a-zA-Z0-9]/, 'Must contain a special character'),
});

export const changePasswordSchema = z
    .object({
        currentPassword: z.string().min(1, 'Current password is required'),
        newPassword: z
            .string()
            .min(8, 'Password must be at least 8 characters')
            .regex(/[a-z]/, 'Must contain a lowercase letter')
            .regex(/[A-Z]/, 'Must contain an uppercase letter')
            .regex(/[0-9]/, 'Must contain a number')
            .regex(/[^a-zA-Z0-9]/, 'Must contain a special character'),
        confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    });
