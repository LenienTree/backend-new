import { FastifyReply } from 'fastify';
import { ApiResponse } from '../types';

export class AppError extends Error {
    statusCode: number;
    isOperational: boolean;

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

export const sendSuccess = <T>(
    reply: FastifyReply,
    data: T,
    message = 'Success',
    statusCode = 200
) => {
    return reply.status(statusCode).send({
        success: true,
        message,
        data,
    });
};

export const sendError = (
    reply: FastifyReply,
    message: string,
    statusCode = 400,
    errors?: unknown
) => {
    return reply.status(statusCode).send({
        success: false,
        message,
        ...(errors !== undefined && errors !== null ? { errors: errors as object } : {}),
    });
};

export const sendCreated = <T>(
    reply: FastifyReply,
    data: T,
    message = 'Created successfully'
) => {
    return sendSuccess(reply, data, message, 201);
};

