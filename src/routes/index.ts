import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import eventRoutes from './event.routes';
import adminRoutes from './admin.routes';
import bookmarkRoutes from './bookmark.routes';
import organizerRoutes from './organizer.routes';
import healthRoutes from './health.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/events', eventRoutes);
router.use('/admin', adminRoutes);
router.use('/bookmarks', bookmarkRoutes);
router.use('/organizer', organizerRoutes);
router.use('/health', healthRoutes);

export default router;
