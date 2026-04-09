import { FastifyReply } from 'fastify';
import { registrationService } from '../services/registration.service';
import { sendSuccess, sendCreated } from '../utils/apiResponse';
import { AuthRequest } from '../types';

export class RegistrationController {
    register = async (request: AuthRequest, reply: FastifyReply) => {
        const registration = await registrationService.register(
            (request.params as any).id as string,
            request.user!.userId,
            (request.body as any).formData
        );
        sendCreated(reply, registration, 'Registration successful');
    };

    getParticipants = async (request: AuthRequest, reply: FastifyReply) => {
        const { page, limit } = request.query as { page?: string; limit?: string };
        const result = await registrationService.getParticipants(
            (request.params as any).id as string,
            request.user!.userId,
            request.user!.role,
            page,
            limit
        );
        sendSuccess(reply, result);
    };

    approveRegistration = async (request: AuthRequest, reply: FastifyReply) => {
        const result = await registrationService.approveRegistration(
            (request.params as any).registrationId as string,
            request.user!.userId,
            request.user!.role
        );
        sendSuccess(reply, result, 'Registration approved');
    };

    rejectRegistration = async (request: AuthRequest, reply: FastifyReply) => {
        const result = await registrationService.rejectRegistration(
            (request.params as any).registrationId as string,
            request.user!.userId,
            request.user!.role
        );
        sendSuccess(reply, result, 'Registration rejected');
    };

    checkStatus = async (request: AuthRequest, reply: FastifyReply) => {
        const status = await registrationService.getUserRegistrationStatus(
            (request.params as any).id as string,
            request.user!.userId
        );
        sendSuccess(reply, status);
    };

    markAttended = async (request: AuthRequest, reply: FastifyReply) => {
        const result = await registrationService.markAttended(
            (request.params as any).registrationId as string
        );
        sendSuccess(reply, result, 'Marked as attended');
    };
}

export const registrationController = new RegistrationController();

