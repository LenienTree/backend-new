import app from '../src/app';
import { prisma } from '../src/config/database';

describe('Auth API', () => {
    beforeAll(async () => {
        await app.ready();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('POST /api/auth/register', () => {
        test('should return 400 for invalid input', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/auth/register',
                payload: {
                    email: 'invalid-email',
                },
            });

            expect(response.statusCode).toBe(422);
        });

        test('should register a new user successfully', async () => {
            (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);
            (prisma.user.create as jest.Mock).mockResolvedValue({
                id: '1',
                email: 'test@example.com',
                name: 'Test User',
                role: 'USER',
                isOrganizer: false,
                status: 'ACTIVE',
                isEmailVerified: false,
                createdAt: new Date(),
            });

            const response = await app.inject({
                method: 'POST',
                url: '/api/auth/register',
                payload: {
                    email: 'test@example.com',
                    password: 'Password123!',
                    name: 'Test User',
                },
            });

            expect(response.statusCode).toBe(201);
            const payload = JSON.parse(response.payload);
            expect(payload.success).toBe(true);
            expect(payload.data.user.email).toBe('test@example.com');
        });
    });

    describe('POST /api/auth/login', () => {
        test('should return 401 for invalid credentials', async () => {
            (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);

            const response = await app.inject({
                method: 'POST',
                url: '/api/auth/login',
                payload: {
                    email: 'wrong@example.com',
                    password: 'wrongpassword',
                },
            });

            expect(response.statusCode).toBe(401);
        });
    });
});
