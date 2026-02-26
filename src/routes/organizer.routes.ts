import { Router } from 'express';
import {
    certificateController,
    organizerController,
} from '../controllers/organizer.controller';
import { authenticate, requireOrganizer } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { issueCertificateSchema } from '../validators/user.validator';

const router = Router();

// GET /api/organizer/dashboard
router.get(
    '/dashboard',
    authenticate,
    requireOrganizer,
    organizerController.getDashboard
);

// POST /api/organizer/certificates/issue
router.post(
    '/certificates/issue',
    authenticate,
    requireOrganizer,
    validate(issueCertificateSchema),
    certificateController.issue
);

// GET /api/organizer/certificates (own user's certs)
router.get('/certificates', authenticate, certificateController.getByUser);

export default router;
