import { FastifyReply } from 'fastify';
import { referralService } from '../services/referral.service';
import { sendSuccess } from '../utils/apiResponse';
import { AuthRequest } from '../types';

export class ReferralController {
    trackClick = async (request: AuthRequest, reply: FastifyReply) => {
        const { code } = request.body as { code: string };
        await referralService.trackClick(code, request);
        sendSuccess(reply, { tracked: true }, 'Click tracked successfully');
    };

    getStats = async (request: AuthRequest, reply: FastifyReply) => {
        const { eventId } = request.params as { eventId: string };
        const stats = await referralService.getStats(eventId);
        sendSuccess(reply, stats, 'Referral stats fetched');
    };

    generateReferral = async (request: AuthRequest, reply: FastifyReply) => {
        const { eventId } = request.body as { eventId: string };
        const userId = request.user!.userId;
        const result = await referralService.generateReferral(eventId, userId, request.user!.isOrganizer);
        sendSuccess(reply, result, 'Referral code generated');
    };
}

export const referralController = new ReferralController();
