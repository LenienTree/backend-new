import { Request, Response, NextFunction } from 'express';
import { Schema, ZodError } from 'zod';
import { AppError } from '../utils/apiResponse';

type ValidateTarget = 'body' | 'query' | 'params';

export const validate =
    (schema: Schema, target: ValidateTarget = 'body') =>
        async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
            try {
                const parsed = await schema.parseAsync(req[target]);
                req[target] = parsed;
                next();
            } catch (error) {
                if (error instanceof ZodError) {
                    next(error);
                } else {
                    console.error('Validation unexpected error:', error);
                    next(new AppError('Validation error', 422));
                }
            }
        };
