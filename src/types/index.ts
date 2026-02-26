import { Request } from 'express';

export type Role = 'ADMIN' | 'USER';

declare global {
    namespace Express {
        namespace Multer {
            interface File {
                fieldname: string;
                originalname: string;
                encoding: string;
                mimetype: string;
                size: number;
                destination: string;
                filename: string;
                path: string;
                buffer: Buffer;
            }
        }
    }
}

export interface JwtPayload {
    userId: string;
    email: string;
    role: Role;
    isOrganizer: boolean;
}

export interface AuthRequest extends Request {
    user?: JwtPayload;
    file?: Express.Multer.File;
    files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] };
}

export interface PaginationQuery {
    page?: string;
    limit?: string;
}

export interface PaginatedResult<T> {
    data: T[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}

export interface ApiResponse<T = unknown> {
    success: boolean;
    message: string;
    data?: T;
    errors?: unknown;
}

export interface EventFilters {
    category?: string;
    month?: string;
    status?: string;
    search?: string;
    mode?: string;
    isPaid?: string;
    organizerId?: string;
    page?: string;
    limit?: string;
}

export interface CloudinaryUploadResult {
    public_id: string;
    secure_url: string;
    format: string;
    bytes: number;
    width: number;
    height: number;
}
