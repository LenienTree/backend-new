import { Response } from 'express';
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
    res: Response,
    data: T,
    message = 'Success',
    statusCode = 200
): Response<ApiResponse<T>> => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
    });
};

export const sendError = (
    res: Response,
    message: string,
    statusCode = 400,
    errors?: unknown
): Response<ApiResponse> => {
    return res.status(statusCode).json({
        success: false,
        message,
        ...(errors !== undefined && errors !== null ? { errors: errors as object } : {}),
    });
};

export const sendCreated = <T>(
    res: Response,
    data: T,
    message = 'Created successfully'
): Response<ApiResponse<T>> => {
    return sendSuccess(res, data, message, 201);
};
