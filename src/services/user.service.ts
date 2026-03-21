import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import { AppError } from '../utils/apiResponse';
import { getPagination, buildPaginatedResult } from '../utils/helpers';

export class UserService {
    async getMe(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId, deletedAt: null },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                isOrganizer: true,
                college: true,
                graduationYear: true,
                bio: true,
                profileImage: true,
                status: true,
                isEmailVerified: true,
                createdAt: true,
                socialLinks: true,
                skills: { select: { skill: true } },
                galleryImages: true,
                certificates: {
                    include: { event: { select: { id: true, title: true } } },
                },
                _count: {
                    select: {
                        organizedEvents: true,
                        registrations: true,
                        bookmarks: true,
                    },
                },
            },
        });

        if (!user) throw new AppError('User not found.', 404);
        return user;
    }

    async getUserById(id: string) {
        const user = await prisma.user.findUnique({
            where: { id, deletedAt: null },
            select: {
                id: true,
                name: true,
                bio: true,
                profileImage: true,
                college: true,
                graduationYear: true,
                isOrganizer: true,
                createdAt: true,
                socialLinks: true,
                skills: { select: { skill: true } },
                galleryImages: true,
                certificates: {
                    include: { event: { select: { id: true, title: true } } },
                },
                _count: {
                    select: { organizedEvents: true },
                },
            },
        });

        if (!user) throw new AppError('User not found.', 404);
        return user;
    }

    async updateProfile(
        userId: string,
        data: {
            name?: string;
            phone?: string;
            college?: string;
            graduationYear?: number;
            bio?: string;
            skills?: string[];
            socialLinks?: {
                linkedin?: string;
                github?: string;
                instagram?: string;
                twitter?: string;
                website?: string;
            };
        }
    ) {
        const { skills, socialLinks, ...profileData } = data;

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                ...profileData,
                ...(skills && {
                    skills: {
                        deleteMany: {},
                        create: skills.map((skill) => ({ skill })),
                    },
                }),
                ...(socialLinks && {
                    socialLinks: {
                        upsert: {
                            create: socialLinks,
                            update: socialLinks,
                        },
                    },
                }),
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                bio: true,
                college: true,
                graduationYear: true,
                socialLinks: true,
                skills: { select: { skill: true } },
            },
        });

        return updatedUser;
    }

    async updateProfileImage(userId: string, imageUrl: string) {
        return prisma.user.update({
            where: { id: userId },
            data: { profileImage: imageUrl },
            select: { id: true, profileImage: true },
        });
    }

    async addGalleryImage(userId: string, imageUrl: string, caption?: string) {
        return prisma.galleryImage.create({
            data: { userId, imageUrl, caption },
        });
    }

    async deleteGalleryImage(userId: string, imageId: string) {
        const image = await prisma.galleryImage.findUnique({
            where: { id: imageId },
        });

        if (!image) throw new AppError('Image not found.', 404);
        if (image.userId !== userId)
            throw new AppError('Not authorized to delete this image.', 403);

        await prisma.galleryImage.delete({ where: { id: imageId } });
    }

    async changePassword(
        userId: string,
        currentPassword: string,
        newPassword: string
    ) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { passwordHash: true },
        });

        if (!user?.passwordHash) {
            throw new AppError(
                'Password change not available for social login accounts.',
                400
            );
        }

        const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isValid) throw new AppError('Current password is incorrect.', 400);

        const passwordHash = await bcrypt.hash(newPassword, 12);
        await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    }

    async becomeOrganizer(userId: string, data: { orgName?: string; orgEmail?: string; eventName?: string }) {
        // Check if a request already exists
        const existing = await prisma.auditLog.findFirst({
            where: { userId, action: 'ORGANIZER_REQUEST' },
            orderBy: { createdAt: 'desc' },
        });
        if (existing) {
            throw new AppError('You already have a pending organizer request.', 409);
        }

        // Store the request for admin review — do NOT grant role yet
        await prisma.auditLog.create({
            data: {
                userId,
                action: 'ORGANIZER_REQUEST',
                entity: 'User',
                entityId: userId,
                newValue: data as object,
            },
        });

        return { requested: true };
    }

    async getMyEvents(userId: string, page = '1', limit = '10') {
        const { skip, page: p, limit: l } = getPagination(page, limit);

        const [registered, organized, bookmarked] = await Promise.all([
            prisma.registration.findMany({
                where: { userId },
                include: {
                    event: {
                        select: {
                            id: true,
                            title: true,
                            startDate: true,
                            bannerImage: true,
                            status: true,
                            category: true,
                        },
                    },
                },
                skip,
                take: l,
                orderBy: { registeredAt: 'desc' },
            }),
            prisma.event.findMany({
                where: { organizerId: userId, deletedAt: null },
                select: {
                    id: true,
                    title: true,
                    startDate: true,
                    bannerImage: true,
                    status: true,
                    category: true,
                    _count: { select: { registrations: true } },
                },
                skip,
                take: l,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.bookmark.findMany({
                where: { userId },
                include: {
                    event: {
                        select: {
                            id: true,
                            title: true,
                            startDate: true,
                            bannerImage: true,
                            status: true,
                            category: true,
                        },
                    },
                },
                skip,
                take: l,
                orderBy: { createdAt: 'desc' },
            }),
        ]);

        return { registered, organized, bookmarked };
    }

    async getCertificates(userId: string) {
        return prisma.certificate.findMany({
            where: { userId },
            include: {
                event: { select: { id: true, title: true, startDate: true } },
            },
            orderBy: { issuedAt: 'desc' },
        });
    }

    // Admin use
    async blockUser(userId: string) {
        return prisma.user.update({
            where: { id: userId },
            data: { status: 'BLOCKED' },
            select: { id: true, status: true },
        });
    }

    async unblockUser(userId: string) {
        return prisma.user.update({
            where: { id: userId },
            data: { status: 'ACTIVE' },
            select: { id: true, status: true },
        });
    }

    async softDeleteUser(userId: string) {
        return prisma.user.update({
            where: { id: userId },
            data: { deletedAt: new Date() },
        });
    }
}

export const userService = new UserService();
