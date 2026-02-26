import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validate } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import {
    registerSchema,
    loginSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
} from '../validators/auth.validator';

const router = Router();

// POST /api/auth/register
router.post('/register', validate(registerSchema), authController.register);

// POST /api/auth/login
router.post('/login', validate(loginSchema), authController.login);

// POST /api/auth/google
router.post('/google', authController.googleAuth);

// POST /api/auth/refresh
router.post('/refresh', authController.refreshToken);

// POST /api/auth/forgot-password
router.post(
    '/forgot-password',
    validate(forgotPasswordSchema),
    authController.forgotPassword
);

// POST /api/auth/reset-password
router.post(
    '/reset-password',
    validate(resetPasswordSchema),
    authController.resetPassword
);

// GET /api/auth/verify-email?token=...
router.get('/verify-email', authController.verifyEmail);

// GET /api/auth/me (protected)
router.get('/me', authenticate, authController.getMe);

// POST /api/auth/logout
router.post('/logout', authController.logout);

export default router;
