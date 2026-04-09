import { FastifyReply } from 'fastify';
import { prisma } from '../config/database';
import { AuthRequest } from '../types';

export const auditLog = (action: string, entity: string) => {
    return async (request: AuthRequest, reply: FastifyReply) => {
        reply.raw.on('finish', async () => {
            if (reply.statusCode < 400) {
                try {
                    await prisma.auditLog.create({
                        data: {
                            userId: request.user?.userId,
                            action,
                            entity,
                            entityId: (request.params as any)?.id as string,
                            ipAddress: request.ip || 'unknown',
                            userAgent: request.headers['user-agent'] || 'unknown',
                        },
                    });
                } catch (err) {
                    request.log.error({ err }, '[AUDIT LOG] Failed to write audit log');
                }
            }
        });
    };
};

