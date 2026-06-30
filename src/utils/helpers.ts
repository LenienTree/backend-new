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

/**
 * Turn arbitrary text into a URL-safe slug, e.g. "Hack For Good 2026!" → "hack-for-good-2026".
 * Falls back to "event" when the input has no slug-able characters.
 */
export const slugify = (text: string): string => {
    const base = (text || '')
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    return base || 'event';
};

/**
 * Generate a slug for an event that is unique against the given existence check.
 * Tries the bare slug first, then appends a short random suffix until it is free.
 */
export const generateUniqueSlug = async (
    title: string,
    exists: (slug: string) => Promise<boolean>
): Promise<string> => {
    const base = slugify(title);
    let candidate = base;
    // A handful of attempts is plenty; suffix entropy makes collisions vanishingly rare.
    for (let i = 0; i < 6; i++) {
        if (!(await exists(candidate))) return candidate;
        candidate = `${base}-${Math.random().toString(36).slice(2, 6)}`;
    }
    // Last resort: timestamp-based suffix is effectively unique.
    return `${base}-${Date.now().toString(36)}`;
};
