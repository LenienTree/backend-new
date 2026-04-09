import { FastifyInstance } from 'fastify';
import { adminController } from '../controllers/admin.controller';
import { eventController } from '../controllers/event.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { auditLog } from '../middleware/audit.middleware';
import { adminApproveEventSchema, adminRejectEventSchema } from '../validators/registration.validator';
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
    fastify.put('/events/:id/featured', adminController.toggleFeatured);

    // GET /api/admin/users
    fastify.get('/users', adminController.getAllUsers);

    // PUT /api/admin/users/:id/block
    fastify.put('/users/:id/block', {
        preHandler: auditLog('BLOCK_USER', 'User'),
        handler: adminController.blockUser
    });

    // PUT /api/admin/users/:id/unblock
    fastify.put('/users/:id/unblock', adminController.unblockUser);

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
}

