import { Response, NextFunction } from 'express';
import { userService } from '../services/user.service';
import { sendSuccess } from '../utils/apiResponse';
import { AuthRequest } from '../types';
import { uploadToS3 } from '../utils/upload';

export class UserController {
    getMe = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const user = await userService.getMe(req.user!.userId);
            sendSuccess(res, user);
        } catch (err) {
            next(err);
        }
    };

    getUserById = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const user = await userService.getUserById(req.params.id as string);
            sendSuccess(res, user);
        } catch (err) {
            next(err);
        }
    };

    updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const user = await userService.updateProfile(req.user!.userId, req.body);
            sendSuccess(res, user, 'Profile updated successfully');
        } catch (err) {
            next(err);
        }
    };

    uploadProfileImage = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.file) {
                return next(new Error('No file uploaded'));
            }
            const result = await uploadToS3(
                req.file.buffer,
                'avatars',
                `user_${req.user!.userId}`,
                req.file.mimetype
            );
            const user = await userService.updateProfileImage(
                req.user!.userId,
                result.secure_url
            );
            sendSuccess(res, user, 'Profile image updated');
        } catch (err) {
            next(err);
        }
    };

    addGalleryImage = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.file) return next(new Error('No file uploaded'));
            const result = await uploadToS3(req.file.buffer, 'gallery', undefined, req.file.mimetype);
            const image = await userService.addGalleryImage(
                req.user!.userId,
                result.secure_url,
                req.body.caption
            );
            sendSuccess(res, image, 'Gallery image added');
        } catch (err) {
            next(err);
        }
    };

    deleteGalleryImage = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            await userService.deleteGalleryImage(req.user!.userId, req.params.imageId as string);
            sendSuccess(res, null, 'Gallery image deleted');
        } catch (err) {
            next(err);
        }
    };

    changePassword = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            await userService.changePassword(
                req.user!.userId,
                req.body.currentPassword,
                req.body.newPassword
            );
            sendSuccess(res, null, 'Password changed successfully');
        } catch (err) {
            next(err);
        }
    };

    becomeOrganizer = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const user = await userService.becomeOrganizer(req.user!.userId);
            sendSuccess(res, user, 'You are now an organizer!');
        } catch (err) {
            next(err);
        }
    };

    getMyEvents = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { page, limit } = req.query as { page?: string; limit?: string };
            const result = await userService.getMyEvents(req.user!.userId, page, limit);
            sendSuccess(res, result);
        } catch (err) {
            next(err);
        }
    };

    getCertificates = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const certs = await userService.getCertificates(req.user!.userId);
            sendSuccess(res, certs);
        } catch (err) {
            next(err);
        }
    };
}

export const userController = new UserController();
