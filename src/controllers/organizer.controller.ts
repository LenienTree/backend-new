import { Response, NextFunction } from 'express';
import { bookmarkService, certificateService } from '../services/bookmark.service';
import { adminService } from '../services/admin.service';
import { sendSuccess } from '../utils/apiResponse';
import { AuthRequest } from '../types';
import { uploadToS3 } from '../utils/upload';

export class BookmarkController {
    toggle = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const result = await bookmarkService.toggle(
                req.user!.userId,
                req.params.id as string
            );
            sendSuccess(res, result, result.bookmarked ? 'Bookmarked' : 'Bookmark removed');
        } catch (err) {
            next(err);
        }
    };

    getBookmarks = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const bookmarks = await bookmarkService.getBookmarks(req.user!.userId);
            sendSuccess(res, bookmarks);
        } catch (err) {
            next(err);
        }
    };
}

export class CertificateController {
    issue = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const cert = await certificateService.issue(
                req.body.userId,
                req.body.eventId,
                req.body.certificateUrl,
                req.user!.userId,
                req.user!.role
            );
            sendSuccess(res, cert, 'Certificate issued');
        } catch (err) {
            next(err);
        }
    };

    getByUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const certs = await certificateService.getByUser(req.user!.userId);
            sendSuccess(res, certs);
        } catch (err) {
            next(err);
        }
    };
}

export class OrganizerController {
    getDashboard = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const data = await adminService.getOrganizerDashboard(req.user!.userId);
            sendSuccess(res, data, 'Organizer dashboard');
        } catch (err) {
            next(err);
        }
    };
}

export const bookmarkController = new BookmarkController();
export const certificateController = new CertificateController();
export const organizerController = new OrganizerController();
