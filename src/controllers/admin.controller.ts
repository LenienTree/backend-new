import { Response, NextFunction } from 'express';
import { adminService } from '../services/admin.service';
import { userService } from '../services/user.service';
import { sendSuccess } from '../utils/apiResponse';
import { AuthRequest } from '../types';
import { prisma } from '../config/database';

export class AdminController {
    getDashboard = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const data = await adminService.getDashboard();
            sendSuccess(res, data, 'Dashboard data');
        } catch (err) {
            next(err);
        }
    };

    getPendingEvents = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { page, limit } = req.query as { page?: string; limit?: string };
            const data = await adminService.getPendingEvents(page, limit);
            sendSuccess(res, data);
        } catch (err) {
            next(err);
        }
    };

    getAllUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { page, limit, search } = req.query as {
                page?: string;
                limit?: string;
                search?: string;
            };
            const data = await adminService.getAllUsers(page, limit, search);
            sendSuccess(res, data);
        } catch (err) {
            next(err);
        }
    };

    blockUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const user = await userService.blockUser(req.params.id as string);
            sendSuccess(res, user, 'User blocked');
        } catch (err) {
            next(err);
        }
    };

    unblockUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const user = await userService.unblockUser(req.params.id as string);
            sendSuccess(res, user, 'User unblocked');
        } catch (err) {
            next(err);
        }
    };

    deleteUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            await userService.softDeleteUser(req.params.id as string);
            sendSuccess(res, null, 'User deleted');
        } catch (err) {
            next(err);
        }
    };

    getAuditLogs = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { page, limit } = req.query as { page?: string; limit?: string };
            const logs = await adminService.getAuditLogs(page, limit);
            sendSuccess(res, logs);
        } catch (err) {
            next(err);
        }
    };

    getOrganizerRequests = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const requests = await adminService.getOrganizerRequests();
            sendSuccess(res, requests);
        } catch (err) {
            next(err);
        }
    };

    toggleFeatured = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const event = await adminService.toggleFeaturedEvent(
                req.params.id as string,
                req.body.isFeatured
            );
            sendSuccess(res, event);
        } catch (err) {
            next(err);
        }
    };

    approveOrganizer = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const userId = req.params.id as string;
            // Grant the organizer role
            const user = await prisma.user.update({
                where: { id: userId },
                data: { isOrganizer: true },
                select: { id: true, name: true, email: true, isOrganizer: true },
            });
            sendSuccess(res, user, 'Organizer approved successfully.');
        } catch (err) {
            next(err);
        }
    };
}

export const adminController = new AdminController();
