import { FastifyInstance } from 'fastify';
import {
    certificateController,
    organizerController,
} from '../controllers/organizer.controller';
import { authenticate, requireOrganizer } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { issueCertificateSchema } from '../validators/user.validator';

export default async function organizerRoutes(fastify: FastifyInstance) {
    // GET /api/organizer/dashboard
    fastify.get('/dashboard', {
        preHandler: [authenticate, requireOrganizer],
        handler: organizerController.getDashboard
    });

    // POST /api/organizer/certificates/issue
    fastify.post('/certificates/issue', {
        preHandler: [authenticate, requireOrganizer, validate(issueCertificateSchema)],
        handler: certificateController.issue
    });

    // GET /api/organizer/certificates (own user's certs)
    fastify.get('/certificates', {
        preHandler: authenticate,
        handler: certificateController.getByUser
    });
}

