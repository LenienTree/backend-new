import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { AppError } from '../utils/apiResponse';

type ValidateTarget = 'body' | 'query' | 'params';

export const validate =
    (schema: AnyZodObject, target: ValidateTarget = 'body') =>
        async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
            try {
                const parsed = await schema.parseAsync(req[target]);
                req[target] = parsed;
                next();
            } catch (error) {
                if (error instanceof ZodError) {
                    next(error);
                } else {
                    next(new AppError('Validation error', 422));
                }
            }
        };
