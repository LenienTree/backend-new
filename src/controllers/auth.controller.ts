import { FastifyRequest, FastifyReply } from 'fastify';
import { authService } from '../services/auth.service';
import { sendSuccess, sendCreated } from '../utils/apiResponse';
import { AuthRequest } from '../types';

const isProduction = process.env.NODE_ENV === 'production';

const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax',
    path: '/',
};

const ACCESS_TOKEN_MAX_AGE  = 7  * 24 * 60 * 60 * 1000; // 7 days
const REFRESH_TOKEN_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days

function setAuthCookies(reply: FastifyReply, accessToken: string, refreshToken: string) {
    reply.setCookie('accessToken', accessToken, { ...cookieOptions, maxAge: ACCESS_TOKEN_MAX_AGE });
    reply.setCookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: REFRESH_TOKEN_MAX_AGE });
}

function clearAuthCookies(reply: FastifyReply) {
    reply.setCookie('accessToken', '', { ...cookieOptions, expires: new Date(0) });
    reply.setCookie('refreshToken', '', { ...cookieOptions, expires: new Date(0) });
}

export class AuthController {
    register = async (request: FastifyRequest, reply: FastifyReply) => {
        const result = await authService.register(request.body as any);
        setAuthCookies(reply, result.accessToken, result.refreshToken);
        sendCreated(reply, result, 'Registration successful! Please verify your email.');
    };

    login = async (request: FastifyRequest, reply: FastifyReply) => {
        const { email, password } = request.body as any;
        const result = await authService.login(email, password);
        setAuthCookies(reply, result.accessToken, result.refreshToken);
        sendSuccess(reply, result, 'Login successful');
    };

    googleAuth = async (request: FastifyRequest, reply: FastifyReply) => {
        const { idToken } = request.body as any;
        const { OAuth2Client } = require('google-auth-library');
        const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();

        const result = await authService.googleAuth(
            payload.sub,
            payload.email,
            payload.name,
            payload.picture
        );

        setAuthCookies(reply, result.accessToken, result.refreshToken);

        const { accessToken, refreshToken, ...responseWithoutTokens } = result;
        sendSuccess(reply, responseWithoutTokens, 'Google login successful');
    };

    refreshToken = async (request: FastifyRequest, reply: FastifyReply) => {
        const refreshToken = request.cookies?.refreshToken || (request.body as any)?.refreshToken;

        if (!refreshToken) {
            throw new Error('No refresh token provided');
        }

        const result = await authService.refreshTokens(refreshToken);
        setAuthCookies(reply, result.accessToken, result.refreshToken);
        sendSuccess(reply, null, 'Token refreshed');
    };

    forgotPassword = async (request: FastifyRequest, reply: FastifyReply) => {
        await authService.forgotPassword((request.body as any).email);
        sendSuccess(
            reply,
            null,
            'If an account exists, a password reset email has been sent.'
        );
    };

    resetPassword = async (request: FastifyRequest, reply: FastifyReply) => {
        const { token, password } = request.body as any;
        await authService.resetPassword(token, password);
        sendSuccess(reply, null, 'Password reset successfully. Please log in.');
    };

    verifyEmail = async (request: FastifyRequest, reply: FastifyReply) => {
        await authService.verifyEmail((request.query as any).token as string);
        sendSuccess(reply, null, 'Email verified successfully!');
    };

    getMe = async (request: AuthRequest, reply: FastifyReply) => {
        sendSuccess(reply, request.user, 'Authenticated user');
    };

    logout = async (request: FastifyRequest, reply: FastifyReply) => {
        clearAuthCookies(reply);
        sendSuccess(reply, null, 'Logout successful');
    };
}

export const authController = new AuthController();

