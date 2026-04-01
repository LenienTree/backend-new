import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/apiResponse';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';

export const errorHandler = (
    err: unknown,
    req: Request,
    res: Response,
    _next: NextFunction
): void => {
    console.error(`[ERROR] ${req.method} ${req.path}`, err);

    // Operational errors (trusted, our own)
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            success: false,
            message: err.message,
        });
        return;
    }

    // Zod validation errors
    if (err instanceof ZodError) {
        res.status(422).json({
            success: false,
            message: 'Validation failed',
            errors: err.issues.map((e: import('zod').ZodIssue) => ({
                field: e.path.join('.'),
                message: e.message,
            })),
        });
        return;
    }

    // Prisma errors
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        switch (err.code) {
            case 'P2002': {
                const fields = (err.meta?.target as string[])?.join(', ') || 'field';
                res.status(409).json({
                    success: false,
                    message: `A record with this ${fields} already exists.`,
                });
                return;
            }
            case 'P2025':
                res.status(404).json({
                    success: false,
                    message: 'Record not found.',
                });
                return;
            case 'P2003':
                res.status(400).json({
                    success: false,
                    message: 'Related record not found.',
                });
                return;
            default:
                break;
        }
    }

    if (err instanceof Prisma.PrismaClientValidationError) {
        res.status(400).json({
            success: false,
            message: 'Invalid data provided.',
        });
        return;
    }

    // JWT errors
    if (err instanceof Error) {
        if (err.name === 'JsonWebTokenError') {
            res.status(401).json({ success: false, message: 'Invalid token.' });
            return;
        }
        if (err.name === 'TokenExpiredError') {
            res.status(401).json({ success: false, message: 'Token expired.' });
            return;
        }
    }

    // Unknown errors — don't expose internals
    res.status(500).json({
        success: false,
        message:
            process.env.NODE_ENV === 'production'
                ? 'Something went wrong. Please try again later.'
                : (err instanceof Error ? err.message : 'Internal server error'),
    });
};

export const notFound = (req: Request, res: Response): void => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.originalUrl} not found.`,
    });
};
