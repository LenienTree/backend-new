import { FastifyInstance } from 'fastify';
import { referralController } from '../controllers/referral.controller';
import { authenticate, authorize, requireOrganizer, optionalAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { auditLog } from '../middleware/audit.middleware';
import { z } from 'zod';

// ─── Validation Schemas ───────────────────────────────────────────────────────

const trackClickSchema = z.object({
    code: z.string().min(1, 'Referral code is required'),
});

const adminGenerateSchema = z.object({
    eventId: z.string().uuid('Invalid event ID'),
    refereeUserId: z.string().uuid('Invalid referee user ID'),
});

const organizerGenerateSchema = z.object({
    eventId: z.string().uuid('Invalid event ID'),
    refereeUserId: z.string().uuid('Invalid referee user ID'),
});

// ─── Routes ───────────────────────────────────────────────────────────────────

export default async function referralRoutes(fastify: FastifyInstance) {

    // ── Public: track a referral link click ──────────────────────────────────
    // POST /api/referral/click  (optionalAuth so logged-in users are also tracked)
    fastify.post('/click', {
        preHandler: [optionalAuth, validate(trackClickSchema)],
        handler: referralController.trackClick,
    });

    // ─────────────────────────────────────────────────────────────────────────
    // ADMIN routes  (require ADMIN role)
    // ─────────────────────────────────────────────────────────────────────────

    // GET /api/referral/admin/colleges
    fastify.get('/admin/colleges', {
        preHandler: [authenticate, authorize('ADMIN')],
        handler: referralController.adminListColleges,
    });

    // GET /api/referral/admin/colleges/:college/students
    fastify.get('/admin/colleges/:college/students', {
        preHandler: [authenticate, authorize('ADMIN')],
        handler: referralController.adminListStudents,
    });

    // POST /api/referral/admin/generate
    fastify.post('/admin/generate', {
        preHandler: [
            authenticate,
            authorize('ADMIN'),
            validate(adminGenerateSchema),
            auditLog('ADMIN_GENERATE_REFERRAL', 'Referral'),
        ],
        handler: referralController.adminGenerateReferral,
    });

    // GET /api/referral/admin/stats/:eventId
    fastify.get('/admin/stats/:eventId', {
        preHandler: [authenticate, authorize('ADMIN')],
        handler: referralController.adminGetStats,
    });

    // ─────────────────────────────────────────────────────────────────────────
    // ORGANIZER routes  (require isOrganizer flag)
    // ─────────────────────────────────────────────────────────────────────────

    // STEP 1: GET /api/referral/organizer/events
    // List the organizer's own events to choose from
    fastify.get('/organizer/events', {
        preHandler: [authenticate, requireOrganizer],
        handler: referralController.organizerListEvents,
    });

    // STEP 2: GET /api/referral/organizer/colleges
    // All colleges in the DB (same list as admin sees)
    fastify.get('/organizer/colleges', {
        preHandler: [authenticate, requireOrganizer],
        handler: referralController.organizerListColleges,
    });

    // STEP 3: GET /api/referral/organizer/colleges/:college/students
    // All students from that college in the DB
    fastify.get('/organizer/colleges/:college/students', {
        preHandler: [authenticate, requireOrganizer],
        handler: referralController.organizerListStudentsByCollege,
    });

    // GENERATE: POST /api/referral/organizer/generate
    // Create the referral link for chosen event + student
    fastify.post('/organizer/generate', {
        preHandler: [
            authenticate,
            requireOrganizer,
            validate(organizerGenerateSchema),
            auditLog('ORGANIZER_GENERATE_REFERRAL', 'Referral'),
        ],
        handler: referralController.organizerGenerateReferral,
    });

    // TRACK: GET /api/referral/organizer/stats/:eventId
    fastify.get('/organizer/stats/:eventId', {
        preHandler: [authenticate, requireOrganizer],
        handler: referralController.organizerGetStats,
    });
}

