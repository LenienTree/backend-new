import { FastifyReply } from 'fastify';
import { eventService } from '../services/event.service';
import { sendSuccess, sendCreated } from '../utils/apiResponse';
import { AuthRequest } from '../types';
import { uploadToS3 } from '../utils/upload';
import { EventFilters } from '../types';

export class EventController {
    createDraft = async (request: AuthRequest, reply: FastifyReply) => {
        const event = await eventService.createDraft(request.user!.userId, request.body as any);
        sendCreated(reply, event, 'Event draft created');
    };

    updateDesign = async (request: AuthRequest, reply: FastifyReply) => {
        const event = await eventService.updateEventDesign(
            (request.params as any).id as string,
            request.user!.userId,
            request.body as any
        );
        sendSuccess(reply, event, 'Event design updated');
    };

    submitForApproval = async (request: AuthRequest, reply: FastifyReply) => {
        const event = await eventService.submitForApproval(
            (request.params as any).id as string,
            request.user!.userId
        );
        sendSuccess(reply, event, 'Event submitted for approval');
    };

    updateEvent = async (request: AuthRequest, reply: FastifyReply) => {
        const event = await eventService.updateEvent(
            (request.params as any).id as string,
            request.user!.userId,
            request.body as any
        );
        sendSuccess(reply, event, 'Event updated');
    };

    uploadBanner = async (request: AuthRequest, reply: FastifyReply) => {
        const fileData = await request.file();
        if (!fileData) throw new Error('No file uploaded');
        
        const buffer = await fileData.toBuffer();
        const result = await uploadToS3(buffer, 'banners', undefined, fileData.mimetype);
        const event = await eventService.uploadBanner(
            (request.params as any).id as string,
            request.user!.userId,
            result.secure_url
        );
        sendSuccess(reply, event, 'Banner uploaded');
    };

    uploadPoster = async (request: AuthRequest, reply: FastifyReply) => {
        const fileData = await request.file();
        if (!fileData) throw new Error('No file uploaded');
        
        const buffer = await fileData.toBuffer();
        const result = await uploadToS3(buffer, 'posters', undefined, fileData.mimetype);
        const event = await eventService.uploadPoster(
            (request.params as any).id as string,
            request.user!.userId,
            result.secure_url
        );
        sendSuccess(reply, event, 'Poster uploaded');
    };

    getEvents = async (request: AuthRequest, reply: FastifyReply) => {
        const filters = request.query as EventFilters;

        if (request.user?.role !== 'ADMIN') {
            if (!filters.status) filters.status = 'APPROVED';
            if (filters.status !== 'APPROVED') {
                filters.status = 'APPROVED';
            }
        }

        const result = await eventService.getEvents(filters);
        sendSuccess(reply, result);
    };

    getEventById = async (request: AuthRequest, reply: FastifyReply) => {
        const event = await eventService.getEventById((request.params as any).id as string);
        sendSuccess(reply, event);
    };

    deleteEvent = async (request: AuthRequest, reply: FastifyReply) => {
        await eventService.softDeleteEvent(
            (request.params as any).id as string,
            request.user!.userId,
            request.user!.role
        );
        sendSuccess(reply, null, 'Event deleted');
    };

    approveEvent = async (request: AuthRequest, reply: FastifyReply) => {
        const { isFeatured } = request.body as any;
        const event = await eventService.approveEvent(
            (request.params as any).id as string,
            isFeatured
        );
        sendSuccess(reply, event, 'Event approved');
    };

    rejectEvent = async (request: AuthRequest, reply: FastifyReply) => {
        const { reason } = request.body as any;
        const event = await eventService.rejectEvent(
            (request.params as any).id as string,
            reason
        );
        sendSuccess(reply, event, 'Event rejected');
    };
}

export const eventController = new EventController();

