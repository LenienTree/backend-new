import { FastifyInstance, FastifyRequest } from 'fastify';
import { eventController } from '../controllers/event.controller';
import { registrationController } from '../controllers/registration.controller';
import { paymentController } from '../controllers/payment.controller';
import { announcementController, faqController } from '../controllers/announcement.controller';
import { authenticate, requireOrganizer, optionalAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
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
    setPaymentStatusSchema,
} from '../validators/registration.validator';

export default async function eventRoutes(fastify: FastifyInstance) {
    // ── Public / Optional Auth ────────────────────────────────────────────────────

    // GET /api/events  (public, filters)
    fastify.get('/', {
        preHandler: [optionalAuth, validate(eventFiltersSchema, 'query')],
        handler: eventController.getEvents
    });

    // GET /api/events/:id  (public)
    fastify.get('/:id', {
        preHandler: optionalAuth,
        handler: eventController.getEventById
    });

    // GET /api/events/:id/stats  (public)
    fastify.get('/:id/stats', eventController.getEventStats);

    // GET /api/events/:id/share  (public)
    fastify.get('/:id/share', eventController.getShareData);

    // GET /api/events/:id/announcements
    fastify.get('/:id/announcements', announcementController.getByEvent);

    // GET /api/events/:id/faqs
    fastify.get('/:id/faqs', faqController.getByEvent);

    // ── Authenticated ─────────────────────────────────────────────────────────────

    // GET /api/events/:id/registration-status
    fastify.get('/:id/registration-status', {
        preHandler: authenticate,
        handler: registrationController.checkStatus
    });

    // POST /api/events/:id/register
    fastify.post('/:id/register', {
        preHandler: [authenticate, auditLog('REGISTER', 'Registration')],
        handler: registrationController.register
    });

    // GET /api/events/:id/participants  (organizer/admin)
    fastify.get('/:id/participants', {
        preHandler: authenticate,
        handler: registrationController.getParticipants
    });

    // POST /api/events/:id/create-razorpay-order
    fastify.post('/:id/create-razorpay-order', {
        preHandler: authenticate,
        handler: paymentController.createRazorpayOrder
    });

    // ── Organizer CRUD ────────────────────────────────────────────────────────────

    // POST /api/events  (Step 1 - create draft)
    fastify.post('/', {
        preHandler: [authenticate, requireOrganizer, validate(createEventStep1Schema), auditLog('CREATE', 'Event')],
        handler: eventController.createDraft
    });

    // PUT /api/events/:id/design  (Step 2 - design & config)
    fastify.put('/:id/design', {
        preHandler: [authenticate, requireOrganizer, validate(updateEventStep2Schema)],
        handler: eventController.updateDesign
    });

    // POST /api/events/:id/submit  (Step 3 - submit for approval)
    fastify.post('/:id/submit', {
        preHandler: [authenticate, requireOrganizer, auditLog('SUBMIT', 'Event')],
        handler: eventController.submitForApproval
    });

    // PUT /api/events/:id  (general update)
    fastify.put('/:id', {
        preHandler: [authenticate, requireOrganizer, validate(updateEventSchema)],
        handler: eventController.updateEvent
    });

    // POST /api/events/:id/banner
    fastify.post('/:id/banner', {
        preHandler: [authenticate, requireOrganizer],
        handler: eventController.uploadBanner
    });

    // POST /api/events/:id/poster
    fastify.post('/:id/poster', {
        preHandler: [authenticate, requireOrganizer],
        handler: eventController.uploadPoster
    });

    // POST /api/events/:id/upi-qr
    fastify.post('/:id/upi-qr', {
        preHandler: [authenticate, requireOrganizer],
        handler: eventController.uploadUpiQrCode
    });

    // POST /api/events/:id/linkedin-poster
    fastify.post('/:id/linkedin-poster', {
        preHandler: [authenticate, requireOrganizer],
        handler: eventController.uploadLinkedinPoster
    });

    // DELETE /api/events/:id
    fastify.delete('/:id', {
        preHandler: [authenticate, auditLog('DELETE', 'Event')],
        handler: eventController.deleteEvent
    });

    // ── Announcements ─────────────────────────────────────────────────────────────

    // POST /api/events/:id/announcements
    fastify.post('/:id/announcements', {
        preHandler: [authenticate, validate(announcementSchema)],
        handler: announcementController.create
    });

    // PUT /api/events/:id/announcements/:announcementId
    fastify.put('/:id/announcements/:announcementId', {
        preHandler: authenticate,
        handler: announcementController.update
    });

    // DELETE /api/events/:id/announcements/:announcementId
    fastify.delete('/:id/announcements/:announcementId', {
        preHandler: authenticate,
        handler: announcementController.delete
    });

    // ── FAQs ──────────────────────────────────────────────────────────────────────

    // POST /api/events/:id/faqs
    fastify.post('/:id/faqs', {
        preHandler: [authenticate, validate(faqSchema)],
        handler: faqController.create
    });

    // PUT /api/events/:id/faqs/:faqId
    fastify.put('/:id/faqs/:faqId', {
        preHandler: authenticate,
        handler: faqController.update
    });

    // DELETE /api/events/:id/faqs/:faqId
    fastify.delete('/:id/faqs/:faqId', {
        preHandler: authenticate,
        handler: faqController.delete
    });

    // ── Registration Management ───────────────────────────────────────────────────

    // PUT /api/events/:id/registrations/:registrationId/approve
    fastify.put('/:id/registrations/:registrationId/approve', {
        preHandler: [authenticate, auditLog('APPROVE_REGISTRATION', 'Registration')],
        handler: registrationController.approveRegistration
    });

    // PUT /api/events/:id/registrations/:registrationId/reject
    fastify.put('/:id/registrations/:registrationId/reject', {
        preHandler: authenticate,
        handler: registrationController.rejectRegistration
    });

    // PUT /api/events/:id/registrations/:registrationId/attend
    fastify.put('/:id/registrations/:registrationId/attend', {
        preHandler: [authenticate, auditLog('MARK_ATTENDED', 'Registration')],
        handler: registrationController.markAttended
    });

    // PUT /api/events/:id/registrations/:registrationId/payment-status
    fastify.put('/:id/registrations/:registrationId/payment-status', {
        preHandler: [authenticate, validate(setPaymentStatusSchema), auditLog('UPDATE_PAYMENT_STATUS', 'Registration')],
        handler: registrationController.setPaymentStatus
    });

    // DELETE /api/events/:id/registrations/:registrationId
    fastify.delete('/:id/registrations/:registrationId', {
        preHandler: [authenticate, auditLog('DELETE_REGISTRATION', 'Registration')],
        handler: registrationController.deleteRegistration
    });
}

