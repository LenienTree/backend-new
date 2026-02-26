import { Router } from 'express';
import {
    bookmarkController,
    certificateController,
    organizerController,
} from '../controllers/organizer.controller';
import { authenticate, requireOrganizer } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { issueCertificateSchema } from '../validators/user.validator';

const router = Router();

// ── Bookmarks ─────────────────────────────────────────────────────────────────

// POST /api/bookmarks/:id/toggle
router.post(
    '/:id/toggle',
    authenticate,
    bookmarkController.toggle
);

// GET /api/bookmarks
router.get('/', authenticate, bookmarkController.getBookmarks);

export default router;
