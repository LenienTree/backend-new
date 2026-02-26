import { Response, NextFunction } from 'express';
import { eventService } from '../services/event.service';
import { sendSuccess, sendCreated } from '../utils/apiResponse';
import { AuthRequest } from '../types';
import { uploadToS3 } from '../utils/upload';
import { EventFilters } from '../types';

export class EventController {
    // Step 1: Create draft
    createDraft = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const event = await eventService.createDraft(req.user!.userId, req.body);
            sendCreated(res, event, 'Event draft created');
        } catch (err) {
            next(err);
        }
    };

    // Step 2: Design / config
    updateDesign = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const event = await eventService.updateEventDesign(
                req.params.id as string,
                req.user!.userId,
                req.body
            );
            sendSuccess(res, event, 'Event design updated');
        } catch (err) {
            next(err);
        }
    };

    // Submit for admin approval
    submitForApproval = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const event = await eventService.submitForApproval(
                req.params.id as string,
                req.user!.userId
            );
            sendSuccess(res, event, 'Event submitted for approval');
        } catch (err) {
            next(err);
        }
    };

    // General update
    updateEvent = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const event = await eventService.updateEvent(
                req.params.id as string,
                req.user!.userId,
                req.body
            );
            sendSuccess(res, event, 'Event updated');
        } catch (err) {
            next(err);
        }
    };

    // Upload banner
    uploadBanner = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.file) return next(new Error('No file uploaded'));
            const result = await uploadToS3(req.file.buffer, 'banners', undefined, req.file.mimetype);
            const event = await eventService.uploadBanner(
                req.params.id as string,
                req.user!.userId,
                result.secure_url
            );
            sendSuccess(res, event, 'Banner uploaded');
        } catch (err) {
            next(err);
        }
    };

    // Upload poster
    uploadPoster = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.file) return next(new Error('No file uploaded'));
            const result = await uploadToS3(req.file.buffer, 'posters', undefined, req.file.mimetype);
            const event = await eventService.uploadPoster(
                req.params.id as string,
                req.user!.userId,
                result.secure_url
            );
            sendSuccess(res, event, 'Poster uploaded');
        } catch (err) {
            next(err);
        }
    };

    // Get all events with filters
    getEvents = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const filters = req.query as EventFilters;

            // Non-admins can only see APPROVED events
            if (req.user?.role !== 'ADMIN') {
                if (!filters.status) filters.status = 'APPROVED';
                if (filters.status !== 'APPROVED') {
                    filters.status = 'APPROVED';
                }
            }

            const result = await eventService.getEvents(filters);
            sendSuccess(res, result);
        } catch (err) {
            next(err);
        }
    };

    // Get single event
    getEventById = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const event = await eventService.getEventById(req.params.id as string);
            sendSuccess(res, event);
        } catch (err) {
            next(err);
        }
    };

    // Soft delete
    deleteEvent = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            await eventService.softDeleteEvent(
                req.params.id as string,
                req.user!.userId,
                req.user!.role
            );
            sendSuccess(res, null, 'Event deleted');
        } catch (err) {
            next(err);
        }
    };

    // Admin: approve
    approveEvent = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const event = await eventService.approveEvent(
                req.params.id as string,
                req.body.isFeatured
            );
            sendSuccess(res, event, 'Event approved');
        } catch (err) {
            next(err);
        }
    };

    // Admin: reject
    rejectEvent = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const event = await eventService.rejectEvent(
                req.params.id as string,
                req.body.reason
            );
            sendSuccess(res, event, 'Event rejected');
        } catch (err) {
            next(err);
        }
    };
}

export const eventController = new EventController();
