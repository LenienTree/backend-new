import { FastifyReply } from 'fastify';
import { bookmarkService, certificateService } from '../services/bookmark.service';
import { adminService } from '../services/admin.service';
import { sendSuccess } from '../utils/apiResponse';
import { AuthRequest } from '../types';

export class BookmarkController {
    toggle = async (request: AuthRequest, reply: FastifyReply) => {
        const result = await bookmarkService.toggle(
            request.user!.userId,
            (request.params as any).id as string
        );
        sendSuccess(reply, result, result.bookmarked ? 'Bookmarked' : 'Bookmark removed');
    };

    getBookmarks = async (request: AuthRequest, reply: FastifyReply) => {
        const bookmarks = await bookmarkService.getBookmarks(request.user!.userId);
        sendSuccess(reply, bookmarks);
    };
}

export class CertificateController {
    issue = async (request: AuthRequest, reply: FastifyReply) => {
        const { userId, eventId, certificateUrl } = request.body as any;
        const cert = await certificateService.issue(
            userId,
            eventId,
            certificateUrl,
            request.user!.userId,
            request.user!.role
        );
        sendSuccess(reply, cert, 'Certificate issued');
    };

    getByUser = async (request: AuthRequest, reply: FastifyReply) => {
        const certs = await certificateService.getByUser(request.user!.userId);
        sendSuccess(reply, certs);
    };
}

export class OrganizerController {
    getDashboard = async (request: AuthRequest, reply: FastifyReply) => {
        const data = await adminService.getOrganizerDashboard(request.user!.userId);
        sendSuccess(reply, data, 'Organizer dashboard');
    };
}

export const bookmarkController = new BookmarkController();
export const certificateController = new CertificateController();
export const organizerController = new OrganizerController();

