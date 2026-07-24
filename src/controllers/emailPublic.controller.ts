import { FastifyRequest, FastifyReply } from 'fastify';
import { sendSuccess, AppError } from '../utils/apiResponse';
import {
    verifyUnsubToken,
    recordUnsubscribe,
    removeUnsubscribe,
    isUnsubscribed,
} from '../modules/email/unsubscribe';

export class EmailPublicController {
    unsubscribe = async (request: FastifyRequest, reply: FastifyReply) => {
        const { token, reason } = request.body as { token: string; reason?: string };
        const email = verifyUnsubToken(token);
        if (!email) throw new AppError('Invalid or expired unsubscribe link.', 400);
        await recordUnsubscribe(email, reason, 'link');
        sendSuccess(reply, { email, unsubscribed: true }, 'You have been unsubscribed.');
    };

    resubscribe = async (request: FastifyRequest, reply: FastifyReply) => {
        const { token } = request.body as { token: string };
        const email = verifyUnsubToken(token);
        if (!email) throw new AppError('Invalid or expired link.', 400);
        await removeUnsubscribe(email);
        sendSuccess(reply, { email, unsubscribed: false }, 'You have been resubscribed.');
    };

    status = async (request: FastifyRequest, reply: FastifyReply) => {
        const { token } = request.query as { token: string };
        const email = verifyUnsubToken(token);
        if (!email) throw new AppError('Invalid or expired link.', 400);
        sendSuccess(reply, { email, unsubscribed: await isUnsubscribed(email) });
    };
}

export const emailPublicController = new EmailPublicController();
