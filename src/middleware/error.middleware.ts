import { FastifyRequest, FastifyReply } from 'fastify';
import { AppError } from '../utils/apiResponse';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';

export const errorHandler = (
    err: any,
    request: FastifyRequest,
    reply: FastifyReply
): void => {
    request.log.error(err);

    // Operational errors
    if (err instanceof AppError) {
        reply.status(err.statusCode).send({
            success: false,
            message: err.message,
        });
        return;
    }

    // Zod validation errors
    if (err instanceof ZodError) {
        reply.status(422).send({
            success: false,
            message: 'Validation failed',
            errors: err.issues.map((e) => ({
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
                reply.status(409).send({
                    success: false,
                    message: `A record with this ${fields} already exists.`,
                });
                return;
            }
            case 'P2025':
                reply.status(404).send({
                    success: false,
                    message: 'Record not found.',
                });
                return;
            case 'P2003':
                reply.status(400).send({
                    success: false,
                    message: 'Related record not found.',
                });
                return;
            default:
                break;
        }
    }

    if (err instanceof Prisma.PrismaClientValidationError) {
        reply.status(400).send({
            success: false,
            message: 'Invalid data provided.',
        });
        return;
    }

    // JWT/Other Error instances
    if (err instanceof Error) {
        if (err.name === 'JsonWebTokenError') {
            reply.status(401).send({ success: false, message: 'Invalid token.' });
            return;
        }
        if (err.name === 'TokenExpiredError') {
            reply.status(401).send({ success: false, message: 'Token expired.' });
            return;
        }
    }

    // Unknown errors
    const isProd = process.env.NODE_ENV === 'production';
    reply.status(500).send({
        success: false,
        message: isProd
            ? 'Something went wrong. Please try again later.'
            : (err instanceof Error ? err.message : 'Internal server error'),
    });
};

export const notFound = (request: FastifyRequest, reply: FastifyReply): void => {
    reply.status(404).send({
        success: false,
        message: `Route ${request.method} ${request.url} not found.`,
    });
};
