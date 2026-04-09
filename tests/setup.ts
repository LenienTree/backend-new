// ============================================================
// IMPORTANT: All jest.mock() calls MUST come before any imports.
// Jest hoists these to the top at compile time.
// ============================================================

// Mock the underlying jsonwebtoken library so auth.middleware.ts
// always gets a valid decoded payload when verifying any token.
jest.mock('jsonwebtoken', () => ({
    verify: jest.fn(() => ({
        userId: '1',
        email: 'test@example.com',
        role: 'USER',
        isOrganizer: false,
    })),
    sign: jest.fn(() => 'mock-token'),
    decode: jest.fn(() => ({
        userId: '1',
        email: 'test@example.com',
        role: 'USER',
        isOrganizer: false,
    })),
}));

// Mock Prisma so no real DB connection is needed
jest.mock('../src/config/database', () => ({
    prisma: {
        $connect: jest.fn().mockResolvedValue(undefined),
        $disconnect: jest.fn().mockResolvedValue(undefined),
        $queryRaw: jest.fn().mockResolvedValue([{ 1: 1 }]),
        user: {
            findUnique: jest.fn(),
            findFirst: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
        },
        event: {
            findUnique: jest.fn(),
            findFirst: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
        },
        registration: {
            findUnique: jest.fn(),
            findFirst: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            count: jest.fn(),
        },
        announcement: {
            findMany: jest.fn(),
            create: jest.fn(),
        },
        faq: {
            findMany: jest.fn(),
        },
        galleryImage: {
            create: jest.fn(),
            delete: jest.fn(),
        },
        certificate: {
            findMany: jest.fn(),
        },
    },
}));

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
    compare: jest.fn().mockResolvedValue(true),
    hash: jest.fn().mockResolvedValue('hashed_password'),
}));

// Now it's safe to import modules
import { prisma } from '../src/config/database';

beforeAll(() => {
    process.env.NODE_ENV = 'test';
});
