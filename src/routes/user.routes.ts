import { FastifyInstance } from 'fastify';
import { userController } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { updateProfileSchema, changePasswordSchema, becomeOrganizerSchema } from '../validators/user.validator';

export default async function userRoutes(fastify: FastifyInstance) {
    // All user routes require authentication
    fastify.addHook('preHandler', authenticate);

    // GET /api/users/me
    fastify.get('/me', userController.getMe);

    // GET /api/users/:id
    fastify.get('/:id', userController.getUserById);

    // PATCH /api/users/profile
    fastify.patch('/profile', { preHandler: validate(updateProfileSchema) }, userController.updateProfile);

    // POST /api/users/profile-image
    fastify.post('/profile-image', userController.uploadProfileImage);

    // POST /api/users/gallery
    fastify.post('/gallery', userController.addGalleryImage);

    // DELETE /api/users/gallery/:imageId
    fastify.delete('/gallery/:imageId', userController.deleteGalleryImage);

    // POST /api/users/change-password
    fastify.post('/change-password', { preHandler: validate(changePasswordSchema) }, userController.changePassword);

    // POST /api/users/become-organizer
    fastify.post('/become-organizer', { preHandler: validate(becomeOrganizerSchema) }, userController.becomeOrganizer);

    // GET /api/users/my-events
    fastify.get('/my-events', userController.getMyEvents);

    // GET /api/users/certificates
    fastify.get('/certificates', userController.getCertificates);
}
