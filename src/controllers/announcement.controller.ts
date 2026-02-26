import { Response, NextFunction } from 'express';
import { announcementService, faqService } from '../services/announcement.service';
import { sendSuccess, sendCreated } from '../utils/apiResponse';
import { AuthRequest } from '../types';

export class AnnouncementController {
    create = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const ann = await announcementService.create(
                req.params.id as string,
                req.user!.userId,
                req.user!.role,
                req.body
            );
            sendCreated(res, ann, 'Announcement created');
        } catch (err) {
            next(err);
        }
    };

    getByEvent = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const anns = await announcementService.getByEvent(req.params.id as string);
            sendSuccess(res, anns);
        } catch (err) {
            next(err);
        }
    };

    update = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const ann = await announcementService.update(
                req.params.announcementId as string,
                req.user!.userId,
                req.body
            );
            sendSuccess(res, ann, 'Announcement updated');
        } catch (err) {
            next(err);
        }
    };

    delete = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            await announcementService.delete(
                req.params.announcementId as string,
                req.user!.userId,
                req.user!.role
            );
            sendSuccess(res, null, 'Announcement deleted');
        } catch (err) {
            next(err);
        }
    };
}

export class FAQController {
    create = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const faq = await faqService.create(
                req.params.id as string,
                req.user!.userId,
                req.user!.role,
                req.body
            );
            sendCreated(res, faq, 'FAQ created');
        } catch (err) {
            next(err);
        }
    };

    getByEvent = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const faqs = await faqService.getByEvent(req.params.id as string);
            sendSuccess(res, faqs);
        } catch (err) {
            next(err);
        }
    };

    update = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const faq = await faqService.update(
                req.params.faqId as string,
                req.user!.userId,
                req.body
            );
            sendSuccess(res, faq, 'FAQ updated');
        } catch (err) {
            next(err);
        }
    };

    delete = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            await faqService.delete(req.params.faqId as string, req.user!.userId, req.user!.role);
            sendSuccess(res, null, 'FAQ deleted');
        } catch (err) {
            next(err);
        }
    };
}

export const announcementController = new AnnouncementController();
export const faqController = new FAQController();
