import { FastifyInstance } from 'fastify';
import { referralController } from '../controllers/referral.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { z } from 'zod';
import { auditLog } from '../middleware/audit.middleware';

const trackClickSchema = z.object({
    code: z.string().min(1, 'Referral code is required'),
});

const generateReferralSchema = z.object({
    eventId: z.string().uuid('Invalid event ID'),
});

export default async function referralRoutes(fastify: FastifyInstance) {
    // POST /api/referral/click
    fastify.post('/click', {
        preHandler: validate(trackClickSchema),
        handler: referralController.trackClick
    });

    // GET /api/referral/stats/:eventId
    fastify.get('/stats/:eventId', {
        preHandler: authenticate, // Admins/Organizers only (checked in service)
        handler: referralController.getStats
    });

    // POST /api/referral/generate
    fastify.post('/generate', {
        preHandler: [authenticate, validate(generateReferralSchema), auditLog('GENERATE_REFERRAL', 'Referral')],
        handler: referralController.generateReferral
    });
}
