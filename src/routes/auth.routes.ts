import { FastifyInstance } from 'fastify';
import { authController } from '../controllers/auth.controller';
import { validate } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import {
    registerSchema,
    loginSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
} from '../validators/auth.validator';

// Per-route rate limits for abuse-prone auth endpoints (per IP). These stop
// brute-force / credential-stuffing / email-bombing without affecting normal use.
const limit = (max: number, timeWindow: string) => ({ rateLimit: { max, timeWindow } });

export default async function authRoutes(fastify: FastifyInstance) {
    // POST /api/auth/register
    fastify.post(
        '/register',
        { config: limit(10, '15 minutes'), preHandler: validate(registerSchema) },
        authController.register
    );

    // POST /api/auth/login — stricter rate limit to prevent brute-force
    fastify.post(
        '/login',
        { config: limit(10, '15 minutes'), preHandler: validate(loginSchema) },
        authController.login
    );

    // POST /api/auth/google
    fastify.post('/google', { config: limit(20, '15 minutes') }, authController.googleAuth);

    // POST /api/auth/refresh
    fastify.post('/refresh', { config: limit(30, '15 minutes') }, authController.refreshToken);

    // POST /api/auth/forgot-password — tight limit: password-reset email bombing target
    fastify.post(
        '/forgot-password',
        { config: limit(5, '15 minutes'), preHandler: validate(forgotPasswordSchema) },
        authController.forgotPassword
    );

    // POST /api/auth/reset-password
    fastify.post(
        '/reset-password',
        { config: limit(5, '15 minutes'), preHandler: validate(resetPasswordSchema) },
        authController.resetPassword
    );

    // GET /api/auth/verify-email?token=...
    fastify.get('/verify-email', authController.verifyEmail);

    // GET /api/auth/me (protected)
    fastify.get('/me', { preHandler: authenticate }, authController.getMe);

    // POST /api/auth/logout
    fastify.post('/logout', authController.logout);
}

