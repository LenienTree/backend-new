import { FastifyReply } from 'fastify';
import { userService } from '../services/user.service';
import { sendSuccess } from '../utils/apiResponse';
import { AuthRequest } from '../types';
import { uploadToS3 } from '../utils/upload';

export class UserController {
    getMe = async (request: AuthRequest, reply: FastifyReply) => {
        const user = await userService.getMe(request.user!.userId);
        sendSuccess(reply, user);
    };

    getUserById = async (request: AuthRequest, reply: FastifyReply) => {
        const user = await userService.getUserById((request.params as any).id as string);
        sendSuccess(reply, user);
    };

    updateProfile = async (request: AuthRequest, reply: FastifyReply) => {
        const user = await userService.updateProfile(request.user!.userId, request.body as any);
        sendSuccess(reply, user, 'Profile updated successfully');
    };

    uploadProfileImage = async (request: AuthRequest, reply: FastifyReply) => {
        const fileData = await request.file();
        if (!fileData) {
            throw new Error('No file uploaded');
        }
        
        const buffer = await fileData.toBuffer();
        const result = await uploadToS3(
            buffer,
            'avatars',
            `user_${request.user!.userId}`,
            fileData.mimetype
        );
        
        const user = await userService.updateProfileImage(
            request.user!.userId,
            result.secure_url
        );
        sendSuccess(reply, user, 'Profile image updated');
    };

    addGalleryImage = async (request: AuthRequest, reply: FastifyReply) => {
        const fileData = await request.file();
        if (!fileData) throw new Error('No file uploaded');
        
        const buffer = await fileData.toBuffer();
        const result = await uploadToS3(buffer, 'gallery', undefined, fileData.mimetype);
        
        // request.body might be empty when using multipart/form-data with file coming first
        // Fastify multipart handles fields as well
        const fields: any = {};
        for (const [key, value] of Object.entries((fileData as any).fields || {})) {
            fields[key] = (value as any).value;
        }

        const image = await userService.addGalleryImage(
            request.user!.userId,
            result.secure_url,
            fields.caption
        );
        sendSuccess(reply, image, 'Gallery image added');
    };

    deleteGalleryImage = async (request: AuthRequest, reply: FastifyReply) => {
        await userService.deleteGalleryImage(request.user!.userId, (request.params as any).imageId as string);
        sendSuccess(reply, null, 'Gallery image deleted');
    };

    changePassword = async (request: AuthRequest, reply: FastifyReply) => {
        const { currentPassword, newPassword } = request.body as any;
        await userService.changePassword(
            request.user!.userId,
            currentPassword,
            newPassword
        );
        sendSuccess(reply, null, 'Password changed successfully');
    };

    becomeOrganizer = async (request: AuthRequest, reply: FastifyReply) => {
        const result = await userService.becomeOrganizer(request.user!.userId, request.body as any);
        sendSuccess(reply, result, 'Your organizer request has been submitted for review.');
    };

    getMyEvents = async (request: AuthRequest, reply: FastifyReply) => {
        const { page, limit } = request.query as { page?: string; limit?: string };
        const result = await userService.getMyEvents(request.user!.userId, page, limit);
        sendSuccess(reply, result);
    };

    getCertificates = async (request: AuthRequest, reply: FastifyReply) => {
        const certs = await userService.getCertificates(request.user!.userId);
        sendSuccess(reply, certs);
    };
}

export const userController = new UserController();

