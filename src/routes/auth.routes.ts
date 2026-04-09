import { FastifyInstance } from 'fastify';
import { authController } from '../controllers/auth.controller';
import { validate } from '../middleware/validate.middleware';
import {
    registerSchema,
    loginSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
} from '../validators/auth.validator';

export default async function authRoutes(fastify: FastifyInstance) {
    // POST /api/auth/register
    fastify.post('/register', { preHandler: validate(registerSchema) }, authController.register);

    // POST /api/auth/login
    fastify.post('/login', { preHandler: validate(loginSchema) }, authController.login);

    // POST /api/auth/google
    fastify.post('/google', authController.googleAuth);

    // POST /api/auth/refresh
    fastify.post('/refresh', authController.refreshToken);

    // POST /api/auth/forgot-password
    fastify.post(
        '/forgot-password',
        { preHandler: validate(forgotPasswordSchema) },
        authController.forgotPassword
    );

    // POST /api/auth/reset-password
    fastify.post(
        '/reset-password',
        { preHandler: validate(resetPasswordSchema) },
        authController.resetPassword
    );

    // GET /api/auth/verify-email?token=...
    fastify.get('/verify-email', authController.verifyEmail);

    // GET /api/auth/me (protected)
    // Note: authenticate middleware needs to be converted too
    fastify.get('/me', authController.getMe);

    // POST /api/auth/logout
    fastify.post('/logout', authController.logout);
}

