import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { AppError, sendError } from '../utils/apiResponse';
import { AuthRequest, JwtPayload } from '../types';
import { Role } from '@prisma/client';

export const authenticate = (
    req: AuthRequest,
    _res: Response,
    next: NextFunction
): void => {
    try {
        let token: string | undefined;

        // First try to get token from Authorization header
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
            console.log('Token found in Authorization header');
        }
        // If no header token, try to get from cookies
        else if (req.cookies && req.cookies.accessToken) {
            token = req.cookies.accessToken;
            console.log('Token found in cookies:', req.cookies.accessToken ? 'present' : 'missing');
        } else {
            console.log('No token found in header or cookies');
            console.log('Cookies:', req.cookies);
            console.log('Auth header:', authHeader);
        }

        if (!token) {
            throw new AppError('No token provided. Please log in.', 401);
        }

        const decoded = verifyAccessToken(token);
        req.user = decoded;
        next();
    } catch (error) {
        console.log('Auth error:', error);
        if (error instanceof AppError) {
            next(error);
        } else {
            next(new AppError('Invalid or expired token. Please log in again.', 401));
        }
    }
};

export const authorize = (...roles: Role[]) => {
    return (req: AuthRequest, _res: Response, next: NextFunction): void => {
        if (!req.user) {
            return next(new AppError('Not authenticated.', 401));
        }

        if (!roles.includes(req.user.role)) {
            return next(
                new AppError('You do not have permission to perform this action.', 403)
            );
        }

        next();
    };
};

export const requireOrganizer = (
    req: AuthRequest,
    _res: Response,
    next: NextFunction
): void => {
    if (!req.user) {
        return next(new AppError('Not authenticated.', 401));
    }

    if (!req.user.isOrganizer && req.user.role !== 'ADMIN') {
        return next(
            new AppError(
                'You must be an organizer to perform this action.',
                403
            )
        );
    }

    next();
};

export const optionalAuth = (
    req: AuthRequest,
    _res: Response,
    next: NextFunction
): void => {
    try {
        let token: string | undefined;

        // First try to get token from Authorization header
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        }
        // If no header token, try to get from cookies
        else if (req.cookies && req.cookies.accessToken) {
            token = req.cookies.accessToken;
        }

        if (token) {
            req.user = verifyAccessToken(token);
        }
        next();
    } catch {
        next();
    }
};
