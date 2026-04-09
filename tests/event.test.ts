import app from '../src/app';
import { prisma } from '../src/config/database';

describe('Event API', () => {
    beforeAll(async () => {
        await app.ready();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('GET /api/events', () => {
        test('should return 200 with events list', async () => {
            (prisma.event.findMany as jest.Mock).mockResolvedValue([
                { id: '1', title: 'Test Event', status: 'APPROVED' },
            ]);
            (prisma.event.count as jest.Mock).mockResolvedValue(1);

            const response = await app.inject({
                method: 'GET',
                url: '/api/events',
            });

            expect(response.statusCode).toBe(200);
            const payload = JSON.parse(response.payload);
            expect(payload.success).toBe(true);
            expect(Array.isArray(payload.data.data)).toBe(true);
        });
    });

    describe('GET /api/events/:id', () => {
        test('should return 404 if event not found', async () => {
            (prisma.event.findUnique as jest.Mock).mockResolvedValue(null);

            const response = await app.inject({
                method: 'GET',
                url: '/api/events/non-existent-id',
            });

            expect(response.statusCode).toBe(404);
        });

        test('should return event details if found', async () => {
            (prisma.event.findUnique as jest.Mock).mockResolvedValue({
                id: '1',
                title: 'Test Event',
                status: 'APPROVED',
                organizer: { id: 'org1', name: 'Organizer' },
                faqs: [],
                announcements: [],
                _count: { registrations: 0 },
            });

            const response = await app.inject({
                method: 'GET',
                url: '/api/events/1',
            });

            expect(response.statusCode).toBe(200);
            const payload = JSON.parse(response.payload);
            expect(payload.data.title).toBe('Test Event');
        });
    });
});
