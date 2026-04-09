import { FastifyReply } from 'fastify';
import { announcementService, faqService } from '../services/announcement.service';
import { sendSuccess, sendCreated } from '../utils/apiResponse';
import { AuthRequest } from '../types';

export class AnnouncementController {
    create = async (request: AuthRequest, reply: FastifyReply) => {
        const ann = await announcementService.create(
            (request.params as any).id as string,
            request.user!.userId,
            request.user!.role,
            request.body as any
        );
        sendCreated(reply, ann, 'Announcement created');
    };

    getByEvent = async (request: AuthRequest, reply: FastifyReply) => {
        const anns = await announcementService.getByEvent((request.params as any).id as string);
        sendSuccess(reply, anns);
    };

    update = async (request: AuthRequest, reply: FastifyReply) => {
        const ann = await announcementService.update(
            (request.params as any).announcementId as string,
            request.user!.userId,
            request.body as any
        );
        sendSuccess(reply, ann, 'Announcement updated');
    };

    delete = async (request: AuthRequest, reply: FastifyReply) => {
        await announcementService.delete(
            (request.params as any).announcementId as string,
            request.user!.userId,
            request.user!.role
        );
        sendSuccess(reply, null, 'Announcement deleted');
    };
}

export class FAQController {
    create = async (request: AuthRequest, reply: FastifyReply) => {
        const faq = await faqService.create(
            (request.params as any).id as string,
            request.user!.userId,
            request.user!.role,
            request.body as any
        );
        sendCreated(reply, faq, 'FAQ created');
    };

    getByEvent = async (request: AuthRequest, reply: FastifyReply) => {
        const faqs = await faqService.getByEvent((request.params as any).id as string);
        sendSuccess(reply, faqs);
    };

    update = async (request: AuthRequest, reply: FastifyReply) => {
        const faq = await faqService.update(
            (request.params as any).faqId as string,
            request.user!.userId,
            request.body as any
        );
        sendSuccess(reply, faq, 'FAQ updated');
    };

    delete = async (request: AuthRequest, reply: FastifyReply) => {
        await faqService.delete((request.params as any).faqId as string, request.user!.userId, request.user!.role);
        sendSuccess(reply, null, 'FAQ deleted');
    };
}

export const announcementController = new AnnouncementController();
export const faqController = new FAQController();

