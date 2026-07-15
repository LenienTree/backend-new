import { FastifyInstance } from 'fastify';
import { userController } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { updateProfileSchema, changePasswordSchema, becomeOrganizerSchema } from '../validators/user.validator';

export default async function userRoutes(fastify: FastifyInstance) {
    // ── Public routes (no auth required) ────────────────────────────────────
    // GET /api/users/:id/public
    fastify.get('/:id/public', userController.getPublicProfile);

    // All other user routes require authentication
    fastify.addHook('preHandler', authenticate);

    // GET /api/users/me
    fastify.get('/me', userController.getMe);

    // GET /api/users/:id
    fastify.get('/:id', userController.getUserById);

    // PATCH /api/users/profile (deprecated, should use PUT /me)
    fastify.patch('/profile', { preHandler: validate(updateProfileSchema) }, userController.updateProfile);

    // PUT /api/users/me
    fastify.put('/me', { preHandler: validate(updateProfileSchema) }, userController.updateProfile);

    // PUT /api/users/me/role-profile — update role-specific profile fields (whitelisted per userType)
    fastify.put('/me/role-profile', userController.updateRoleProfile);

    // POST /api/users/profile-image (Original) & POST /api/users/me/avatar (Frontend alias)
    fastify.post('/profile-image', userController.uploadProfileImage);
    fastify.post('/me/avatar', userController.uploadProfileImage);

    // POST /api/users/me/resume (professionals — PDF/DOC, max 5 MB)
    fastify.post('/me/resume', userController.uploadResume);

    // POST /api/users/gallery (Original) & POST /api/users/me/gallery (Frontend alias)
    fastify.post('/gallery', userController.addGalleryImage);
    fastify.post('/me/gallery', userController.addGalleryImage);

    // DELETE /api/users/gallery/:imageId (Original) & DELETE /api/users/me/gallery/:imageId (Frontend alias)
    fastify.delete('/gallery/:imageId', userController.deleteGalleryImage);
    fastify.delete('/me/gallery/:imageId', userController.deleteGalleryImage);

    // POST /api/users/change-password (Original) & PUT /api/users/me/password (Frontend alias)
    fastify.post('/change-password', { preHandler: validate(changePasswordSchema) }, userController.changePassword);
    fastify.put('/me/password', { preHandler: validate(changePasswordSchema) }, userController.changePassword);

    // POST /api/users/me/become-organizer
    fastify.post('/me/become-organizer', { preHandler: validate(becomeOrganizerSchema) }, userController.becomeOrganizer);

    // GET /api/users/my-events (Original) & GET /api/users/me/events (Frontend alias)
    fastify.get('/my-events', userController.getMyEvents);
    fastify.get('/me/events', userController.getMyEvents);

    // GET /api/users/certificates (Original) & GET /api/users/me/certificates (Frontend alias)
    fastify.get('/certificates', userController.getCertificates);
    fastify.get('/me/certificates', userController.getCertificates);
}
