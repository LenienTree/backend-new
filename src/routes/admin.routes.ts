import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { eventController } from '../controllers/event.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { auditLog } from '../middleware/audit.middleware';
import { adminApproveEventSchema, adminRejectEventSchema } from '../validators/registration.validator';
import { validate } from '../middleware/validate.middleware';

const router = Router();

// All admin routes require ADMIN role
router.use(authenticate, authorize('ADMIN'));

// GET /api/admin/dashboard
router.get('/dashboard', adminController.getDashboard);

// GET /api/admin/pending-events
router.get('/pending-events', adminController.getPendingEvents);

// PUT /api/admin/events/:id/approve
router.put(
    '/events/:id/approve',
    validate(adminApproveEventSchema),
    auditLog('APPROVE_EVENT', 'Event'),
    eventController.approveEvent
);

// PUT /api/admin/events/:id/reject
router.put(
    '/events/:id/reject',
    validate(adminRejectEventSchema),
    auditLog('REJECT_EVENT', 'Event'),
    eventController.rejectEvent
);

// PUT /api/admin/events/:id/featured
router.put('/events/:id/featured', adminController.toggleFeatured);

// GET /api/admin/users
router.get('/users', adminController.getAllUsers);

// PUT /api/admin/users/:id/block
router.put(
    '/users/:id/block',
    auditLog('BLOCK_USER', 'User'),
    adminController.blockUser
);

// PUT /api/admin/users/:id/unblock
router.put('/users/:id/unblock', adminController.unblockUser);

// PUT /api/admin/users/:id/approve-organizer
router.put('/users/:id/approve-organizer', auditLog('APPROVE_ORGANIZER', 'User'), adminController.approveOrganizer);

// DELETE /api/admin/users/:id
router.delete(
    '/users/:id',
    auditLog('DELETE_USER', 'User'),
    adminController.deleteUser
);

// GET /api/admin/organizer-requests
router.get('/organizer-requests', adminController.getOrganizerRequests);

// GET /api/admin/audit-logs
router.get('/audit-logs', adminController.getAuditLogs);

export default router;
