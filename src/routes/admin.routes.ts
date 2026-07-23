import { FastifyInstance } from 'fastify';
import { adminController } from '../controllers/admin.controller';
import { eventController } from '../controllers/event.controller';
import { emailAdminController } from '../controllers/emailAdmin.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { auditLog } from '../middleware/audit.middleware';
import { adminApproveEventSchema, adminRejectEventSchema } from '../validators/registration.validator';
import {
    updateTemplateSchema,
    previewTemplateSchema,
    testTemplateSchema,
    sendCustomSchema,
} from '../validators/emailAdmin.validator';
import { validate } from '../middleware/validate.middleware';

export default async function adminRoutes(fastify: FastifyInstance) {
    // All admin routes require ADMIN role
    fastify.addHook('preHandler', authenticate);
    fastify.addHook('preHandler', authorize('ADMIN'));

    // GET /api/admin/dashboard
    fastify.get('/dashboard', adminController.getDashboard);

    // GET /api/admin/pending-events
    fastify.get('/pending-events', adminController.getPendingEvents);

    // PUT /api/admin/events/:id/approve
    fastify.put('/events/:id/approve', {
        preHandler: [validate(adminApproveEventSchema), auditLog('APPROVE_EVENT', 'Event')],
        handler: eventController.approveEvent
    });

    // PUT /api/admin/events/:id/reject
    fastify.put('/events/:id/reject', {
        preHandler: [validate(adminRejectEventSchema), auditLog('REJECT_EVENT', 'Event')],
        handler: eventController.rejectEvent
    });

    // PUT /api/admin/events/:id/featured
    fastify.put('/events/:id/featured', {
        preHandler: auditLog('TOGGLE_FEATURED', 'Event'),
        handler: adminController.toggleFeatured
    });

    // PUT /api/admin/events/:id/premium
    fastify.put('/events/:id/premium', {
        preHandler: auditLog('TOGGLE_PREMIUM', 'Event'),
        handler: adminController.togglePremium
    });

    // PUT /api/admin/events/:id/landing  (toggle visibility on the landing page)
    fastify.put('/events/:id/landing', {
        preHandler: auditLog('TOGGLE_LANDING', 'Event'),
        handler: adminController.toggleShowOnLanding
    });

    // GET /api/admin/users
    fastify.get('/users', adminController.getAllUsers);

    // PUT /api/admin/users/:id/block
    fastify.put('/users/:id/block', {
        preHandler: auditLog('BLOCK_USER', 'User'),
        handler: adminController.blockUser
    });

    // PUT /api/admin/users/:id/unblock
    fastify.put('/users/:id/unblock', {
        preHandler: auditLog('UNBLOCK_USER', 'User'),
        handler: adminController.unblockUser
    });

    // PUT /api/admin/users/:id/approve-organizer
    fastify.put('/users/:id/approve-organizer', {
        preHandler: auditLog('APPROVE_ORGANIZER', 'User'),
        handler: adminController.approveOrganizer
    });

    // DELETE /api/admin/users/:id
    fastify.delete('/users/:id', {
        preHandler: auditLog('DELETE_USER', 'User'),
        handler: adminController.deleteUser
    });

    // GET /api/admin/organizer-requests
    fastify.get('/organizer-requests', adminController.getOrganizerRequests);

    // GET /api/admin/audit-logs
    fastify.get('/audit-logs', adminController.getAuditLogs);

    // GET /api/admin/analytics
    fastify.get('/analytics', adminController.getAnalytics);

    // GET /api/admin/events  (all events, any status)
    fastify.get('/events', adminController.getAllEvents);

    // PUT /api/admin/events/order
    fastify.put('/events/order', {
        preHandler: auditLog('REORDER_EVENTS', 'Event'),
        handler: adminController.updateEventsOrder
    });

    // GET /api/admin/interest-users?interest=<interest label>
    fastify.get('/interest-users', adminController.getInterestUsers);

    // ── Email Automation ──────────────────────────────────────────────────────

    // GET /api/admin/email/templates
    fastify.get('/email/templates', emailAdminController.listTemplates);

    // GET /api/admin/email/templates/:name
    fastify.get('/email/templates/:name', emailAdminController.getTemplate);

    // PUT /api/admin/email/templates/:name  (edit subject/body/enabled)
    fastify.put('/email/templates/:name', {
        preHandler: [validate(updateTemplateSchema), auditLog('EMAIL_TEMPLATE_UPDATED', 'EmailTemplate')],
        handler: emailAdminController.updateTemplate,
    });

    // POST /api/admin/email/templates/:name/reset  (revert to default)
    fastify.post('/email/templates/:name/reset', {
        preHandler: auditLog('EMAIL_TEMPLATE_RESET', 'EmailTemplate'),
        handler: emailAdminController.resetTemplate,
    });

    // POST /api/admin/email/templates/:name/preview  (render with sample/provided context)
    fastify.post('/email/templates/:name/preview', {
        preHandler: validate(previewTemplateSchema),
        handler: emailAdminController.preview,
    });

    // POST /api/admin/email/templates/:name/test  (send a test to an address)
    fastify.post('/email/templates/:name/test', {
        preHandler: validate(testTemplateSchema),
        handler: emailAdminController.test,
    });

    // GET /api/admin/email/recipient-count?mode=&eventId=&status=&interest=
    fastify.get('/email/recipient-count', emailAdminController.recipientCount);

    // POST /api/admin/email/send  (custom broadcast; audit logged inside the service)
    fastify.post('/email/send', {
        preHandler: validate(sendCustomSchema),
        handler: emailAdminController.sendCustom,
    });

    // GET /api/admin/email/logs
    fastify.get('/email/logs', emailAdminController.getLogs);
}

