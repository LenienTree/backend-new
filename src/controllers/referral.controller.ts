import { FastifyReply } from 'fastify';
import { referralService } from '../services/referral.service';
import { sendSuccess } from '../utils/apiResponse';
import { AuthRequest } from '../types';

export class ReferralController {

    // ─── Admin endpoints ──────────────────────────────────────────────────────

    /** GET /api/referral/admin/colleges — list distinct colleges */
    adminListColleges = async (request: AuthRequest, reply: FastifyReply) => {
        const colleges = await referralService.listColleges();
        sendSuccess(reply, colleges, 'Colleges fetched');
    };

    /** GET /api/referral/admin/colleges/:college/students — students by college */
    adminListStudents = async (request: AuthRequest, reply: FastifyReply) => {
        const { college } = request.params as { college: string };
        const students = await referralService.listStudentsByCollege(decodeURIComponent(college));
        sendSuccess(reply, students, 'Students fetched');
    };

    /**
     * POST /api/referral/admin/generate
     * Body: { eventId, refereeUserId }
     */
    adminGenerateReferral = async (request: AuthRequest, reply: FastifyReply) => {
        const { eventId, refereeUserId } = request.body as {
            eventId: string;
            refereeUserId: string;
        };
        const result = await referralService.adminGenerateReferral(eventId, refereeUserId);
        sendSuccess(reply, result, 'Referral link generated');
    };

    /** GET /api/referral/admin/stats/:eventId — stats for any event */
    adminGetStats = async (request: AuthRequest, reply: FastifyReply) => {
        const { eventId } = request.params as { eventId: string };
        const stats = await referralService.getAdminStats(eventId);
        sendSuccess(reply, stats, 'Referral stats fetched');
    };

    // ─── Organizer endpoints ──────────────────────────────────────────────────

    /** GET /api/referral/organizer/events — list own events */
    organizerListEvents = async (request: AuthRequest, reply: FastifyReply) => {
        const organizerId = request.user!.userId;
        const events = await referralService.listOrganizerEvents(organizerId);
        sendSuccess(reply, events, 'Your events fetched');
    };

    /** GET /api/referral/organizer/colleges — all colleges in DB (same as admin) */
    organizerListColleges = async (request: AuthRequest, reply: FastifyReply) => {
        const colleges = await referralService.listColleges();
        sendSuccess(reply, colleges, 'Colleges fetched');
    };

    /** GET /api/referral/organizer/colleges/:college/students — all students from that college in DB */
    organizerListStudentsByCollege = async (request: AuthRequest, reply: FastifyReply) => {
        const { college } = request.params as { college: string };
        const students = await referralService.listStudentsByCollege(decodeURIComponent(college));
        sendSuccess(reply, students, 'Students fetched');
    };

    /**
     * POST /api/referral/organizer/generate
     * Body: { eventId, refereeUserId }
     */
    organizerGenerateReferral = async (request: AuthRequest, reply: FastifyReply) => {
        const { eventId, refereeUserId } = request.body as {
            eventId: string;
            refereeUserId: string;
        };
        const organizerId = request.user!.userId;
        const result = await referralService.organizerGenerateReferral(
            eventId,
            organizerId,
            refereeUserId
        );
        sendSuccess(reply, result, 'Referral link generated');
    };

    /** GET /api/referral/organizer/stats/:eventId — stats for organizer's own event */
    organizerGetStats = async (request: AuthRequest, reply: FastifyReply) => {
        const { eventId } = request.params as { eventId: string };
        const organizerId = request.user!.userId;
        const stats = await referralService.getOrganizerStats(eventId, organizerId);
        sendSuccess(reply, stats, 'Referral stats fetched');
    };

    // ─── Public endpoint (no auth required) ──────────────────────────────────

    /**
     * POST /api/referral/click
     * Body: { code }
     * Called when a user clicks a referral link.
     */
    trackClick = async (request: AuthRequest, reply: FastifyReply) => {
        const { code } = request.body as { code: string };
        await referralService.trackClick(
            code,
            request.ip ?? null,
            request.headers['user-agent'] ?? null,
            request.user?.userId
        );
        sendSuccess(reply, { tracked: true }, 'Click tracked successfully');
    };
}

export const referralController = new ReferralController();
