import app from '../src/app';
import { prisma } from '../src/config/database';

describe('User API', () => {
    beforeAll(async () => {
        await app.ready();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('GET /api/users/me', () => {
        test('should return 401 if no token provided', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/users/me',
            });
            expect(response.statusCode).toBe(401);
        });

        test('should return profile if valid token provided', async () => {
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({
                id: '1',
                email: 'test@example.com',
                name: 'Test User',
                role: 'USER',
                socialLinks: {},
                skills: [],
                galleryImages: [],
                certificates: [],
                _count: { organizedEvents: 0, registrations: 0, bookmarks: 0 }
            });

            const response = await app.inject({
                method: 'GET',
                url: '/api/users/me',
                headers: { authorization: 'Bearer valid-token' },
            });

            expect(response.statusCode).toBe(200);
            const payload = JSON.parse(response.payload);
            expect(payload.success).toBe(true);
            expect(payload.data.email).toBe('test@example.com');
        });
    });

    describe('PATCH /api/users/profile', () => {
        test('should update profile successfully', async () => {
            (prisma.user.update as jest.Mock).mockResolvedValue({
                id: '1',
                email: 'test@example.com',
                name: 'Updated Name',
                socialLinks: {},
                skills: []
            });

            const response = await app.inject({
                method: 'PATCH',
                url: '/api/users/profile',
                headers: { authorization: 'Bearer valid-token' },
                payload: { name: 'Updated Name' },
            });

            expect(response.statusCode).toBe(200);
            const payload = JSON.parse(response.payload);
            expect(payload.success).toBe(true);
            expect(payload.data.name).toBe('Updated Name');
        });
    });
});
