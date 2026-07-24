import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { emailPublicController } from '../controllers/emailPublic.controller';
import { validate } from '../middleware/validate.middleware';

const unsubscribeSchema = z.object({
    token: z.string().min(1),
    reason: z.string().max(500).optional(),
});
const tokenSchema = z.object({ token: z.string().min(1) });

// Public email-preference endpoints (no auth — reached from unsubscribe links).
export default async function emailRoutes(fastify: FastifyInstance) {
    // POST /api/email/unsubscribe  { token, reason? }
    fastify.post('/unsubscribe', {
        preHandler: validate(unsubscribeSchema),
        handler: emailPublicController.unsubscribe,
    });

    // POST /api/email/resubscribe  { token }
    fastify.post('/resubscribe', {
        preHandler: validate(tokenSchema),
        handler: emailPublicController.resubscribe,
    });

    // GET /api/email/unsubscribe-status?token=
    fastify.get('/unsubscribe-status', emailPublicController.status);
}
