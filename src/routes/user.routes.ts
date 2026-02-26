import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { uploadSingle } from '../middleware/upload.middleware';
import { updateProfileSchema, changePasswordSchema } from '../validators/user.validator';

const router = Router();

// All user routes require authentication
router.use(authenticate);

// GET /api/users/me
router.get('/me', userController.getMe);

// PUT /api/users/me
router.put('/me', validate(updateProfileSchema), userController.updateProfile);

// GET /api/users/me/events
router.get('/me/events', userController.getMyEvents);

// GET /api/users/me/certificates
router.get('/me/certificates', userController.getCertificates);

// POST /api/users/me/avatar
router.post('/me/avatar', uploadSingle('avatar'), userController.uploadProfileImage);

// POST /api/users/me/gallery
router.post('/me/gallery', uploadSingle('image'), userController.addGalleryImage);

// DELETE /api/users/me/gallery/:imageId
router.delete('/me/gallery/:imageId', userController.deleteGalleryImage);

// PUT /api/users/me/password
router.put('/me/password', validate(changePasswordSchema), userController.changePassword);

// POST /api/users/me/become-organizer
router.post('/me/become-organizer', userController.becomeOrganizer);

// GET /api/users/:id  (public profile)
router.get('/:id', userController.getUserById);

export default router;
