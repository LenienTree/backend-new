import { FastifyReply } from 'fastify';
import { AuthRequest } from '../types';
import { sendSuccess } from '../utils/apiResponse';
import { emailAdminService, RecipientMode } from '../services/emailAdmin.service';

export class EmailAdminController {
    listTemplates = async (_request: AuthRequest, reply: FastifyReply) => {
        sendSuccess(reply, await emailAdminService.listTemplates());
    };

    getTemplate = async (request: AuthRequest, reply: FastifyReply) => {
        const name = (request.params as any).name as string;
        sendSuccess(reply, await emailAdminService.getTemplate(name));
    };

    updateTemplate = async (request: AuthRequest, reply: FastifyReply) => {
        const name = (request.params as any).name as string;
        const data = request.body as { subject?: string | null; bodyHtml?: string | null; enabled?: boolean };
        const result = await emailAdminService.updateTemplate(name, data, request.user?.userId);
        sendSuccess(reply, result, 'Template updated');
    };

    resetTemplate = async (request: AuthRequest, reply: FastifyReply) => {
        const name = (request.params as any).name as string;
        sendSuccess(reply, await emailAdminService.resetTemplate(name), 'Template reset to default');
    };

    preview = async (request: AuthRequest, reply: FastifyReply) => {
        const name = (request.params as any).name as string;
        const body = request.body as { subject?: string; bodyHtml?: string; context?: Record<string, unknown> };
        sendSuccess(reply, await emailAdminService.preview(name, body));
    };

    test = async (request: AuthRequest, reply: FastifyReply) => {
        const name = (request.params as any).name as string;
        const body = request.body as { to: string; subject?: string; bodyHtml?: string };
        sendSuccess(reply, await emailAdminService.sendTest(name, body.to, body), 'Test email sent');
    };

    recipientCount = async (request: AuthRequest, reply: FastifyReply) => {
        const q = request.query as {
            mode: RecipientMode;
            emails?: string;
            eventId?: string;
            status?: string;
            interest?: string;
        };
        const emails = q.emails ? String(q.emails).split(',') : undefined;
        const count = await emailAdminService.recipientCount({
            mode: q.mode,
            emails,
            eventId: q.eventId,
            status: q.status,
            interest: q.interest,
        });
        sendSuccess(reply, { count });
    };

    sendCustom = async (request: AuthRequest, reply: FastifyReply) => {
        const body = request.body as any;
        const result = await emailAdminService.sendCustom(body, request.user?.userId);
        sendSuccess(reply, result, 'Emails queued for delivery');
    };

    getLogs = async (request: AuthRequest, reply: FastifyReply) => {
        const { page, limit } = request.query as { page?: string; limit?: string };
        sendSuccess(reply, await emailAdminService.getLogs(page, limit));
    };
}

export const emailAdminController = new EmailAdminController();
