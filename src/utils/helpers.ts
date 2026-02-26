import { config } from '../config/config';
import { PaginatedResult } from '../types';

export const getPagination = (page?: string, limit?: string) => {
    const pageNum = Math.max(1, parseInt(page || '1', 10));
    const limitNum = Math.min(
        config.pagination.maxPageSize,
        Math.max(1, parseInt(limit || String(config.pagination.defaultPageSize), 10))
    );
    const skip = (pageNum - 1) * limitNum;
    return { page: pageNum, limit: limitNum, skip };
};

export const buildPaginatedResult = <T>(
    data: T[],
    total: number,
    page: number,
    limit: number
): PaginatedResult<T> => {
    const totalPages = Math.ceil(total / limit);
    return {
        data,
        meta: {
            total,
            page,
            limit,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
        },
    };
};

export const parseDateRange = (month?: string) => {
    if (!month) return {};
    const [year, m] = month.split('-').map(Number);
    if (!year || !m) return {};
    const startDate = new Date(year, m - 1, 1);
    const endDate = new Date(year, m, 0, 23, 59, 59, 999);
    return { startDate, endDate };
};

export const sanitizeUser = (user: Record<string, unknown>) => {
    const { passwordHash, ...safeUser } = user;
    return safeUser;
};
