import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../types';

export const auditLog = (action: string, entity: string) => {
    return async (req: AuthRequest, _res: Response, next: NextFunction) => {
        // Attach audit logging to response finish event
        _res.on('finish', async () => {
            if (_res.statusCode < 400) {
                try {
                    await prisma.auditLog.create({
                        data: {
                            userId: req.user?.userId,
                            action,
                            entity,
                            entityId: req.params?.id as string,
                            ipAddress:
                                (req.headers['x-forwarded-for'] as string) ||
                                req.socket.remoteAddress ||
                                'unknown',
                            userAgent: req.headers['user-agent'] || 'unknown',
                        },
                    });
                } catch {
                    // Don't break the request if audit logging fails
                    console.error('[AUDIT LOG] Failed to write audit log');
                }
            }
        });

        next();
    };
};
