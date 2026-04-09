import { FastifyReply } from 'fastify';
import { verifyAccessToken } from '../utils/jwt';
import { AppError } from '../utils/apiResponse';
import { AuthRequest } from '../types';
import { Role } from '@prisma/client';

export const authenticate = async (
    request: AuthRequest,
    _reply: FastifyReply
): Promise<void> => {
    try {
        let token: string | undefined;

        // First try to get token from Authorization header
        const authHeader = request.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        }
        // If no header token, try to get from cookies
        else if (request.cookies && request.cookies.accessToken) {
            token = request.cookies.accessToken;
        }

        if (!token) {
            throw new AppError('No token provided. Please log in.', 401);
        }

        const decoded = verifyAccessToken(token);
        request.user = decoded;
    } catch (error) {
        request.log.debug({ err: error }, 'Auth error');
        if (error instanceof AppError) {
            throw error;
        } else {
            throw new AppError('Invalid or expired token. Please log in again.', 401);
        }
    }
};

export const authorize = (...roles: Role[]) => {
    return async (request: AuthRequest, _reply: FastifyReply): Promise<void> => {
        if (!request.user) {
            throw new AppError('Not authenticated.', 401);
        }

        if (!roles.includes(request.user.role)) {
            throw new AppError('You do not have permission to perform this action.', 403);
        }
    };
};

export const requireOrganizer = async (
    request: AuthRequest,
    _reply: FastifyReply
): Promise<void> => {
    if (!request.user) {
        throw new AppError('Not authenticated.', 401);
    }

    if (!request.user.isOrganizer && request.user.role !== 'ADMIN') {
        throw new AppError(
            'You must be an organizer to perform this action.',
            403
        );
    }
};

export const optionalAuth = async (
    request: AuthRequest,
    _reply: FastifyReply
): Promise<void> => {
    try {
        let token: string | undefined;

        const authHeader = request.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        }
        else if (request.cookies && request.cookies.accessToken) {
            token = request.cookies.accessToken;
        }

        if (token) {
            request.user = verifyAccessToken(token);
        }
    } catch {
        // Continue even if auth fails as it's optional
    }
};

