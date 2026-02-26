import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import eventRoutes from './event.routes';
import adminRoutes from './admin.routes';
import bookmarkRoutes from './bookmark.routes';
import organizerRoutes from './organizer.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/events', eventRoutes);
router.use('/admin', adminRoutes);
router.use('/bookmarks', bookmarkRoutes);
router.use('/organizer', organizerRoutes);

// Health check
router.get('/health', (_req, res) => {
    res.json({
        success: true,
        message: 'LenientTree API is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
    });
});

export default router;
