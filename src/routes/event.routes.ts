import { Router } from 'express';
import { eventController } from '../controllers/event.controller';
import { registrationController } from '../controllers/registration.controller';
import { announcementController, faqController } from '../controllers/announcement.controller';
import { authenticate, requireOrganizer, optionalAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { uploadSingle } from '../middleware/upload.middleware';
import { auditLog } from '../middleware/audit.middleware';
import {
    createEventStep1Schema,
    updateEventStep2Schema,
    updateEventSchema,
    eventFiltersSchema,
} from '../validators/event.validator';
import {
    registerEventSchema,
    announcementSchema,
    faqSchema,
    adminApproveEventSchema,
    adminRejectEventSchema,
} from '../validators/registration.validator';

const router = Router();

// ── Public / Optional Auth ────────────────────────────────────────────────────

// GET /api/events  (public, filters)
router.get('/', optionalAuth, validate(eventFiltersSchema, 'query'), eventController.getEvents);

// GET /api/events/:id  (public)
router.get('/:id', optionalAuth, eventController.getEventById);

// GET /api/events/:id/announcements
router.get('/:id/announcements', announcementController.getByEvent);

// GET /api/events/:id/faqs
router.get('/:id/faqs', faqController.getByEvent);

// ── Authenticated ─────────────────────────────────────────────────────────────

// GET /api/events/:id/registration-status
router.get(
    '/:id/registration-status',
    authenticate,
    registrationController.checkStatus
);

// POST /api/events/:id/register
router.post(
    '/:id/register',
    authenticate,
    validate(registerEventSchema),
    auditLog('REGISTER', 'Registration'),
    registrationController.register
);

// GET /api/events/:id/participants  (organizer/admin)
router.get(
    '/:id/participants',
    authenticate,
    registrationController.getParticipants
);

// ── Organizer CRUD ────────────────────────────────────────────────────────────

// POST /api/events  (Step 1 - create draft)
router.post(
    '/',
    authenticate,
    requireOrganizer,
    validate(createEventStep1Schema),
    auditLog('CREATE', 'Event'),
    eventController.createDraft
);

// PUT /api/events/:id/design  (Step 2 - design & config)
router.put(
    '/:id/design',
    authenticate,
    requireOrganizer,
    validate(updateEventStep2Schema),
    eventController.updateDesign
);

// POST /api/events/:id/submit  (Step 3 - submit for approval)
router.post(
    '/:id/submit',
    authenticate,
    requireOrganizer,
    auditLog('SUBMIT', 'Event'),
    eventController.submitForApproval
);

// PUT /api/events/:id  (general update)
router.put(
    '/:id',
    authenticate,
    requireOrganizer,
    validate(updateEventSchema),
    eventController.updateEvent
);

// POST /api/events/:id/banner
router.post(
    '/:id/banner',
    authenticate,
    requireOrganizer,
    uploadSingle('banner'),
    eventController.uploadBanner
);

// POST /api/events/:id/poster
router.post(
    '/:id/poster',
    authenticate,
    requireOrganizer,
    uploadSingle('poster'),
    eventController.uploadPoster
);

// DELETE /api/events/:id
router.delete(
    '/:id',
    authenticate,
    auditLog('DELETE', 'Event'),
    eventController.deleteEvent
);

// ── Announcements ─────────────────────────────────────────────────────────────

// POST /api/events/:id/announcements
router.post(
    '/:id/announcements',
    authenticate,
    validate(announcementSchema),
    announcementController.create
);

// PUT /api/events/:id/announcements/:announcementId
router.put(
    '/:id/announcements/:announcementId',
    authenticate,
    announcementController.update
);

// DELETE /api/events/:id/announcements/:announcementId
router.delete(
    '/:id/announcements/:announcementId',
    authenticate,
    announcementController.delete
);

// ── FAQs ──────────────────────────────────────────────────────────────────────

// POST /api/events/:id/faqs
router.post('/:id/faqs', authenticate, validate(faqSchema), faqController.create);

// PUT /api/events/:id/faqs/:faqId
router.put('/:id/faqs/:faqId', authenticate, faqController.update);

// DELETE /api/events/:id/faqs/:faqId
router.delete('/:id/faqs/:faqId', authenticate, faqController.delete);

// ── Registration Management ───────────────────────────────────────────────────

// PUT /api/events/:id/registrations/:registrationId/approve
router.put(
    '/:id/registrations/:registrationId/approve',
    authenticate,
    auditLog('APPROVE_REGISTRATION', 'Registration'),
    registrationController.approveRegistration
);

// PUT /api/events/:id/registrations/:registrationId/reject
router.put(
    '/:id/registrations/:registrationId/reject',
    authenticate,
    registrationController.rejectRegistration
);

// PUT /api/events/:id/registrations/:registrationId/attend
router.put(
    '/:id/registrations/:registrationId/attend',
    authenticate,
    registrationController.markAttended
);

export default router;
