import { FastifyReply } from 'fastify';
import { adminService } from '../services/admin.service';
import { userService } from '../services/user.service';
import { sendSuccess } from '../utils/apiResponse';
import { AuthRequest } from '../types';
import { prisma } from '../config/database';

export class AdminController {
    getDashboard = async (request: AuthRequest, reply: FastifyReply) => {
        const data = await adminService.getDashboard();
        sendSuccess(reply, data, 'Dashboard data');
    };

    getPendingEvents = async (request: AuthRequest, reply: FastifyReply) => {
        const { page, limit } = request.query as { page?: string; limit?: string };
        const data = await adminService.getPendingEvents(page, limit);
        sendSuccess(reply, data);
    };

    getAllUsers = async (request: AuthRequest, reply: FastifyReply) => {
        const { page, limit, search } = request.query as {
            page?: string;
            limit?: string;
            search?: string;
        };
        const data = await adminService.getAllUsers(page, limit, search);
        sendSuccess(reply, data);
    };

    blockUser = async (request: AuthRequest, reply: FastifyReply) => {
        const user = await userService.blockUser((request.params as any).id as string);
        sendSuccess(reply, user, 'User blocked');
    };

    unblockUser = async (request: AuthRequest, reply: FastifyReply) => {
        const user = await userService.unblockUser((request.params as any).id as string);
        sendSuccess(reply, user, 'User unblocked');
    };

    deleteUser = async (request: AuthRequest, reply: FastifyReply) => {
        await userService.softDeleteUser((request.params as any).id as string);
        sendSuccess(reply, null, 'User deleted');
    };

    getAuditLogs = async (request: AuthRequest, reply: FastifyReply) => {
        const { page, limit } = request.query as { page?: string; limit?: string };
        const logs = await adminService.getAuditLogs(page, limit);
        sendSuccess(reply, logs);
    };

    getOrganizerRequests = async (request: AuthRequest, reply: FastifyReply) => {
        const requests = await adminService.getOrganizerRequests();
        sendSuccess(reply, requests);
    };

    toggleFeatured = async (request: AuthRequest, reply: FastifyReply) => {
        const { isFeatured } = request.body as any;
        const event = await adminService.toggleFeaturedEvent(
            (request.params as any).id as string,
            isFeatured
        );
        sendSuccess(reply, event);
    };

    approveOrganizer = async (request: AuthRequest, reply: FastifyReply) => {
        const userId = (request.params as any).id as string;
        // Grant the organizer role
        const user = await prisma.user.update({
            where: { id: userId },
            data: { isOrganizer: true },
            select: { id: true, name: true, email: true, isOrganizer: true },
        });
        sendSuccess(reply, user, 'Organizer approved successfully.');
    };
}

export const adminController = new AdminController();

