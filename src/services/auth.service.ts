import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../config/database';
import { AppError } from '../utils/apiResponse';
import {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
} from '../utils/jwt';
import { sendEmail, emailTemplates } from '../utils/email';
import { config } from '../config/config';
import { JwtPayload } from '../types';

export class AuthService {
    async register(data: {
        name: string;
        email: string;
        password: string;
        phone?: string;
        college?: string;
        graduationYear?: number;
    }) {
        const existing = await prisma.user.findFirst({
            where: {
                email: data.email,
                deletedAt: null,
            },
        });

        if (existing) {
            throw new AppError('An account with this email already exists.', 409);
        }

        const passwordHash = await bcrypt.hash(data.password, 12);

        const user = await prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                phone: data.phone,
                college: data.college,
                graduationYear: data.graduationYear,
                passwordHash,
                socialLinks: { create: {} },
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isOrganizer: true,
                status: true,
                isEmailVerified: true,
                profileImage: true,
                createdAt: true,
            },
        });

        // Send verification email (non-blocking)
        this.sendVerificationEmail(user.id, user.email, user.name).catch(
            console.error
        );

        const payload: JwtPayload = {
            userId: user.id,
            email: user.email,
            role: user.role,
            isOrganizer: user.isOrganizer,
        };

        return {
            user,
            accessToken: generateAccessToken(payload),
            refreshToken: generateRefreshToken(payload),
        };
    }

    async login(email: string, password: string) {
        const user = await prisma.user.findFirst({
            where: { email, deletedAt: null },
            select: {
                id: true,
                name: true,
                email: true,
                passwordHash: true,
                role: true,
                isOrganizer: true,
                status: true,
                isEmailVerified: true,
                profileImage: true,
            },
        });

        if (!user || !user.passwordHash) {
            throw new AppError('Invalid email or password.', 401);
        }

        if (user.status === 'BLOCKED') {
            throw new AppError(
                'Your account has been blocked. Contact support.',
                403
            );
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
            throw new AppError('Invalid email or password.', 401);
        }

        const { passwordHash: _, ...safeUser } = user;

        const payload: JwtPayload = {
            userId: user.id,
            email: user.email,
            role: user.role,
            isOrganizer: user.isOrganizer,
        };

        return {
            user: safeUser,
            accessToken: generateAccessToken(payload),
            refreshToken: generateRefreshToken(payload),
        };
    }

    async googleAuth(googleId: string, email: string, name: string, profileImage?: string) {
        let user = await prisma.user.findFirst({
            where: { OR: [{ googleId }, { email }], deletedAt: null },
        });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    googleId,
                    email,
                    name,
                    profileImage,
                    isEmailVerified: true,
                    socialLinks: { create: {} },
                },
            });
        } else if (!user.googleId) {
            user = await prisma.user.update({
                where: { id: user.id },
                data: { googleId, isEmailVerified: true },
            });
        }

        if (user.status === 'BLOCKED') {
            throw new AppError('Your account has been blocked.', 403);
        }

        const payload: JwtPayload = {
            userId: user.id,
            email: user.email,
            role: user.role,
            isOrganizer: user.isOrganizer,
        };

        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                isOrganizer: user.isOrganizer,
                profileImage: user.profileImage,
            },
            accessToken: generateAccessToken(payload),
            refreshToken: generateRefreshToken(payload),
        };
    }

    async refreshTokens(refreshToken: string) {
        const decoded = verifyRefreshToken(refreshToken);

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId, deletedAt: null },
            select: { id: true, email: true, role: true, isOrganizer: true, status: true },
        });

        if (!user) throw new AppError('User not found.', 404);
        if (user.status === 'BLOCKED') throw new AppError('Account blocked.', 403);

        const payload: JwtPayload = {
            userId: user.id,
            email: user.email,
            role: user.role,
            isOrganizer: user.isOrganizer,
        };

        return {
            accessToken: generateAccessToken(payload),
            refreshToken: generateRefreshToken(payload),
        };
    }

    async forgotPassword(email: string) {
        const user = await prisma.user.findUnique({
            where: { email, deletedAt: null },
        });

        // Don't reveal if user exists
        if (!user) return;

        const token = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        // Store token in audit log (could use a separate PasswordReset table)
        await prisma.auditLog.create({
            data: {
                userId: user.id,
                action: 'PASSWORD_RESET_REQUEST',
                entity: 'User',
                entityId: user.id,
                newValue: { tokenHash, expiresAt: expiresAt.toISOString() },
            },
        });

        const resetLink = `${config.clientUrl}/reset-password?token=${token}`;
        await sendEmail({
            to: user.email,
            subject: 'Reset Your Password',
            html: emailTemplates.resetPassword(user.name, resetLink),
        });
    }

    async resetPassword(token: string, newPassword: string) {
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        const resetLog = await prisma.auditLog.findFirst({
            where: {
                action: 'PASSWORD_RESET_REQUEST',
                newValue: { path: ['tokenHash'], equals: tokenHash },
            },
            orderBy: { createdAt: 'desc' },
        });

        if (!resetLog || !resetLog.userId) {
            throw new AppError('Invalid or expired reset token.', 400);
        }

        const expiresAt = new Date(
            (resetLog.newValue as Record<string, string>).expiresAt
        );

        if (new Date() > expiresAt) {
            throw new AppError('Reset token has expired.', 400);
        }

        const passwordHash = await bcrypt.hash(newPassword, 12);

        await prisma.user.update({
            where: { id: resetLog.userId },
            data: { passwordHash },
        });

        // Invalidate the token
        await prisma.auditLog.update({
            where: { id: resetLog.id },
            data: { action: 'PASSWORD_RESET_USED' },
        });
    }

    async verifyEmail(token: string) {
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        const verifyLog = await prisma.auditLog.findFirst({
            where: {
                action: 'EMAIL_VERIFICATION_REQUEST',
                newValue: { path: ['tokenHash'], equals: tokenHash },
            },
            orderBy: { createdAt: 'desc' },
        });

        if (!verifyLog || !verifyLog.userId) {
            throw new AppError('Invalid or expired verification token.', 400);
        }

        await prisma.user.update({
            where: { id: verifyLog.userId },
            data: { isEmailVerified: true },
        });

        await prisma.auditLog.update({
            where: { id: verifyLog.id },
            data: { action: 'EMAIL_VERIFICATION_USED' },
        });
    }

    private async sendVerificationEmail(
        userId: string,
        email: string,
        name: string
    ) {
        const token = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        await prisma.auditLog.create({
            data: {
                userId,
                action: 'EMAIL_VERIFICATION_REQUEST',
                entity: 'User',
                entityId: userId,
                newValue: { tokenHash },
            },
        });

        const verifyLink = `${config.clientUrl}/verify-email?token=${token}`;
        await sendEmail({
            to: email,
            subject: 'Verify your LenientTree email',
            html: emailTemplates.verifyEmail(name, verifyLink),
        });
    }
}

export const authService = new AuthService();
