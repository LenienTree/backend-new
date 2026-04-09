import app from '../src/app';

describe('Health API', () => {
    beforeAll(async () => {
        await app.ready();
    });

    afterAll(async () => {
        await app.close();
    });

    test('GET /api/health should return status 200/503', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/api/health',
        });

        // It might be 503 if DB/S3 is down in this environment
        expect([200, 503]).toContain(response.statusCode);
        const payload = JSON.parse(response.payload);
        expect(payload).toHaveProperty('timestamp');
    });

    test('GET /api/health/ping should return status 200 and "pong"', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/api/health/ping',
        });

        expect(response.statusCode).toBe(200);
        const payload = JSON.parse(response.payload);
        expect(payload.message).toBe('pong');
        expect(payload.success).toBe(true);
    });
});
