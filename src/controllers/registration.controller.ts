import { FastifyReply } from 'fastify';
import { registrationService } from '../services/registration.service';
import { sendSuccess, sendCreated } from '../utils/apiResponse';
import { AuthRequest } from '../types';
import { uploadToS3 } from '../utils/upload';

export class RegistrationController {
    register = async (request: AuthRequest, reply: FastifyReply) => {
        let formData: any;
        let paymentProof: string | undefined;
        let referralId: string | undefined;

        if (request.isMultipart()) {
            const part = await request.file();
            if (part) {
                const buffer = await part.toBuffer();
                const uploadResult = await uploadToS3(buffer, 'registrations', undefined, part.mimetype);
                paymentProof = uploadResult.secure_url;

                if (part.fields.formData) {
                    try {
                        formData = JSON.parse((part.fields.formData as any).value);
                    } catch (e) {
                        formData = (part.fields.formData as any).value;
                    }
                }
                
                if (part.fields.referralId) {
                    referralId = (part.fields.referralId as any).value;
                }
            }
        } else {
            formData = (request.body as any)?.formData;
            paymentProof = (request.body as any)?.paymentProof;
            referralId = (request.body as any)?.referralId;
        }

        const registration = await registrationService.register(
            (request.params as any).id as string,
            request.user!.userId,
            formData,
            paymentProof,
            referralId
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

