import { FastifyRequest, FastifyReply } from 'fastify';
import { Schema, ZodError } from 'zod';
import { AppError } from '../utils/apiResponse';

type ValidateTarget = 'body' | 'query' | 'params';

export const validate =
    (schema: Schema, target: ValidateTarget = 'body') =>
        async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
            try {
                if (target === 'body' && (!request.body || typeof request.body !== 'object')) {
                    throw new AppError('Request body is missing or not valid JSON', 422);
                }
                const parsed = await schema.parseAsync(request[target]);
                request[target] = parsed as any;
            } catch (error) {
                if (error instanceof AppError) {
                    throw error; // already shaped
                } else if (error instanceof ZodError) {
                    throw error; // Let errorHandler handle it
                } else {
                    console.error('Validation unexpected error:', error);
                    throw new AppError('Validation error', 422);
                }
            }
        };

