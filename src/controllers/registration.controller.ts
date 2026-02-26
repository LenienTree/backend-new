import { Response, NextFunction } from 'express';
import { registrationService } from '../services/registration.service';
import { sendSuccess, sendCreated } from '../utils/apiResponse';
import { AuthRequest } from '../types';

export class RegistrationController {
    register = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const registration = await registrationService.register(
                req.params.id as string,
                req.user!.userId,
                req.body.formData
            );
            sendCreated(res, registration, 'Registration successful');
        } catch (err) {
            next(err);
        }
    };

    getParticipants = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { page, limit } = req.query as { page?: string; limit?: string };
            const result = await registrationService.getParticipants(
                req.params.id as string,
                req.user!.userId,
                req.user!.role,
                page,
                limit
            );
            sendSuccess(res, result);
        } catch (err) {
            next(err);
        }
    };

    approveRegistration = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const result = await registrationService.approveRegistration(
                req.params.registrationId as string,
                req.user!.userId,
                req.user!.role
            );
            sendSuccess(res, result, 'Registration approved');
        } catch (err) {
            next(err);
        }
    };

    rejectRegistration = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const result = await registrationService.rejectRegistration(
                req.params.registrationId as string,
                req.user!.userId,
                req.user!.role
            );
            sendSuccess(res, result, 'Registration rejected');
        } catch (err) {
            next(err);
        }
    };

    checkStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const status = await registrationService.getUserRegistrationStatus(
                req.params.id as string,
                req.user!.userId
            );
            sendSuccess(res, status);
        } catch (err) {
            next(err);
        }
    };

    markAttended = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const result = await registrationService.markAttended(
                req.params.registrationId as string
            );
            sendSuccess(res, result, 'Marked as attended');
        } catch (err) {
            next(err);
        }
    };
}

export const registrationController = new RegistrationController();
