import app from '../src/app';
import { prisma } from '../src/config/database';
import jwt from 'jsonwebtoken';

// ─── Shared fixtures ──────────────────────────────────────────────────────────

const ADMIN_PAYLOAD  = { userId: 'admin-1', email: 'admin@test.com', role: 'ADMIN', isOrganizer: true };
const ORG_PAYLOAD    = { userId: 'org-1',   email: 'org@test.com',   role: 'USER',  isOrganizer: true };

const MOCK_EVENT = {
    id: 'event-uuid-1',
    title: 'Test Hackathon',
    status: 'APPROVED',
    startDate: new Date(),
    endDate: new Date(),
    organizerId: 'org-1',      // matches ORG_PAYLOAD.userId
    bannerImage: null,
    deletedAt: null,
};

const MOCK_STUDENT = {
    id: 'student-uuid-1',
    name: 'Alice',
    email: 'alice@college.com',
    college: 'MIT',
    graduationYear: 2025,
};

const MOCK_REFERRAL = {
    id: 'ref-id-1',
    code: 'REF-ABCDEF',
    eventId: 'event-uuid-1',
    referrerId: 'student-uuid-1',
    clicks: 3,
    conversions: 1,
    createdAt: new Date(),
};

// RFC 4122 v4 UUIDs — Zod v4 requires version digit [1-8]
const UUID_EVENT   = 'dfbdf556-80f6-485a-b977-0c0157c68da6';
const UUID_REFEREE = '2ec771ad-0157-4103-b8f9-93e854614c93';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Make jwt.verify return a specific payload for the NEXT call only, then revert to USER default. */
function mockNextTokenAs(payload: object) {
    (jwt.verify as jest.Mock).mockReturnValueOnce(payload);
}

/** POST inject with proper JSON serialization – fixes body parsing in Fastify test mode. */
async function postJson(url: string, body: object, headers: Record<string, string> = {}) {
    return app.inject({
        method: 'POST',
        url,
        headers: { 'content-type': 'application/json', ...headers },
        payload: JSON.stringify(body),
    });
}

// ─── Test suite ───────────────────────────────────────────────────────────────

describe('Referral API', () => {
    beforeAll(async () => {
        await app.ready();
    });

    afterAll(async () => {
        await app.close();
    });

    beforeEach(() => {
        jest.clearAllMocks();
        // Re-apply defaults wiped by clearAllMocks
        (prisma as any).auditLog = { create: jest.fn().mockResolvedValue({}) };
        (prisma.$transaction as jest.Mock).mockResolvedValue([undefined, undefined]);
    });

    // ── Public: /api/referral/click ───────────────────────────────────────────

    describe('POST /api/referral/click  (public)', () => {
        test('422 when code field is missing', async () => {
            const res = await postJson('/api/referral/click', {});
            expect(res.statusCode).toBe(422);
            expect(JSON.parse(res.payload).success).toBe(false);
        });

        test('404 when referral code does not exist', async () => {
            (prisma.referral.findUnique as jest.Mock).mockResolvedValue(null);

            const res = await postJson('/api/referral/click', { code: 'REF-INVALID' });
            expect(res.statusCode).toBe(404);
        });

        test('200 tracked=true for valid code', async () => {
            (prisma.referral.findUnique as jest.Mock).mockResolvedValue(MOCK_REFERRAL);
            (prisma.$transaction as jest.Mock).mockResolvedValue([undefined, undefined]);

            const res = await postJson('/api/referral/click', { code: 'REF-ABCDEF' });
            expect(res.statusCode).toBe(200);
            const body = JSON.parse(res.payload);
            expect(body.success).toBe(true);
            expect(body.data.tracked).toBe(true);
        });
    });

    // ── Admin: /api/referral/admin/* ──────────────────────────────────────────

    describe('GET /api/referral/admin/colleges', () => {
        test('401 with no token', async () => {
            const res = await app.inject({ method: 'GET', url: '/api/referral/admin/colleges' });
            expect(res.statusCode).toBe(401);
        });

        test('403 when role is USER (not ADMIN)', async () => {
            // default jwt.verify mock returns USER role
            const res = await app.inject({
                method: 'GET',
                url: '/api/referral/admin/colleges',
                headers: { authorization: 'Bearer user-token' },
            });
            expect(res.statusCode).toBe(403);
        });

        test('200 returns sorted array of college strings', async () => {
            mockNextTokenAs(ADMIN_PAYLOAD);
            (prisma.user.findMany as jest.Mock).mockResolvedValue([
                { college: 'MIT' },
                { college: 'Stanford' },
            ]);

            const res = await app.inject({
                method: 'GET',
                url: '/api/referral/admin/colleges',
                headers: { authorization: 'Bearer admin-token' },
            });
            expect(res.statusCode).toBe(200);
            const body = JSON.parse(res.payload);
            expect(body.success).toBe(true);
            expect(body.data).toEqual(['MIT', 'Stanford']);
        });
    });

    describe('GET /api/referral/admin/colleges/:college/students', () => {
        test('401 with no token', async () => {
            const res = await app.inject({ method: 'GET', url: '/api/referral/admin/colleges/MIT/students' });
            expect(res.statusCode).toBe(401);
        });

        test('200 returns students with correct fields', async () => {
            mockNextTokenAs(ADMIN_PAYLOAD);
            (prisma.user.findMany as jest.Mock).mockResolvedValue([MOCK_STUDENT]);

            const res = await app.inject({
                method: 'GET',
                url: '/api/referral/admin/colleges/MIT/students',
                headers: { authorization: 'Bearer admin-token' },
            });
            expect(res.statusCode).toBe(200);
            const body = JSON.parse(res.payload);
            expect(body.data).toHaveLength(1);
            expect(body.data[0]).toMatchObject({ name: 'Alice', college: 'MIT' });
        });
    });

    describe('POST /api/referral/admin/generate', () => {
        test('401 with no token', async () => {
            const res = await postJson('/api/referral/admin/generate', { eventId: UUID_EVENT, refereeUserId: UUID_REFEREE });
            expect(res.statusCode).toBe(401);
        });

        test('403 when role is USER (not ADMIN)', async () => {
            // default jwt mock = USER
            const res = await postJson('/api/referral/admin/generate',
                { eventId: UUID_EVENT, refereeUserId: UUID_REFEREE },
                { authorization: 'Bearer user-token' }
            );
            expect(res.statusCode).toBe(403);
        });

        test('422 when eventId is missing', async () => {
            mockNextTokenAs(ADMIN_PAYLOAD);
            const res = await postJson('/api/referral/admin/generate',
                { refereeUserId: UUID_REFEREE },
                { authorization: 'Bearer admin-token' }
            );
            expect(res.statusCode).toBe(422);
        });

        test('422 when refereeUserId is not a valid UUID', async () => {
            mockNextTokenAs(ADMIN_PAYLOAD);
            const res = await postJson('/api/referral/admin/generate',
                { eventId: UUID_EVENT, refereeUserId: 'not-a-uuid' },
                { authorization: 'Bearer admin-token' }
            );
            expect(res.statusCode).toBe(422);
        });

        test('404 when event does not exist', async () => {
            mockNextTokenAs(ADMIN_PAYLOAD);
            (prisma.event.findUnique as jest.Mock).mockResolvedValue(null);

            const res = await postJson('/api/referral/admin/generate',
                { eventId: UUID_EVENT, refereeUserId: UUID_REFEREE },
                { authorization: 'Bearer admin-token' }
            );
            expect(res.statusCode).toBe(404);
        });

        test('200 creates new referral link with code, link, referee', async () => {
            mockNextTokenAs(ADMIN_PAYLOAD);
            (prisma.event.findUnique as jest.Mock).mockResolvedValue(MOCK_EVENT);
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(MOCK_STUDENT);
            (prisma.referral.findFirst as jest.Mock).mockResolvedValue(null);
            (prisma.referral.create as jest.Mock).mockResolvedValue(MOCK_REFERRAL);

            const res = await postJson('/api/referral/admin/generate',
                { eventId: UUID_EVENT, refereeUserId: UUID_REFEREE },
                { authorization: 'Bearer admin-token' }
            );
            expect(res.statusCode).toBe(200);
            const body = JSON.parse(res.payload);
            expect(body.success).toBe(true);
            expect(body.data.code).toBe('REF-ABCDEF');
            expect(body.data.link).toContain('?ref=REF-ABCDEF');
            expect(body.data.referee).toHaveProperty('id');
        });

        test('200 returns same code when referral already exists (idempotent)', async () => {
            mockNextTokenAs(ADMIN_PAYLOAD);
            (prisma.event.findUnique as jest.Mock).mockResolvedValue(MOCK_EVENT);
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(MOCK_STUDENT);
            (prisma.referral.findFirst as jest.Mock).mockResolvedValue(MOCK_REFERRAL); // already exists

            const res = await postJson('/api/referral/admin/generate',
                { eventId: UUID_EVENT, refereeUserId: UUID_REFEREE },
                { authorization: 'Bearer admin-token' }
            );
            expect(res.statusCode).toBe(200);
            expect(JSON.parse(res.payload).data.code).toBe('REF-ABCDEF');
            expect(prisma.referral.create).not.toHaveBeenCalled();
        });
    });

    describe('GET /api/referral/admin/stats/:eventId', () => {
        test('401 with no token', async () => {
            const res = await app.inject({ method: 'GET', url: '/api/referral/admin/stats/event-uuid-1' });
            expect(res.statusCode).toBe(401);
        });

        test('200 returns correct stats shape', async () => {
            mockNextTokenAs(ADMIN_PAYLOAD);
            (prisma.event.findUnique as jest.Mock).mockResolvedValue(MOCK_EVENT);
            (prisma.referral.findMany as jest.Mock).mockResolvedValue([
                { ...MOCK_REFERRAL, referrer: MOCK_STUDENT, clicksData: [] },
            ]);

            const res = await app.inject({
                method: 'GET',
                url: '/api/referral/admin/stats/event-uuid-1',
                headers: { authorization: 'Bearer admin-token' },
            });
            expect(res.statusCode).toBe(200);
            const { data } = JSON.parse(res.payload);
            expect(data.totalClicks).toBe(3);
            expect(data.totalConversions).toBe(1);
            expect(data.referrals).toHaveLength(1);
            expect(data.referrals[0]).toMatchObject({ code: 'REF-ABCDEF' });
            expect(data.referrals[0]).toHaveProperty('link');
            expect(data.referrals[0].referrer.name).toBe('Alice');
        });
    });

    // ── Organizer: /api/referral/organizer/* ──────────────────────────────────

    describe('GET /api/referral/organizer/events', () => {
        test('401 with no token', async () => {
            const res = await app.inject({ method: 'GET', url: '/api/referral/organizer/events' });
            expect(res.statusCode).toBe(401);
        });

        test('403 when isOrganizer=false', async () => {
            // default jwt mock returns isOrganizer: false
            const res = await app.inject({
                method: 'GET',
                url: '/api/referral/organizer/events',
                headers: { authorization: 'Bearer user-token' },
            });
            expect(res.statusCode).toBe(403);
        });

        test('200 returns organizer events with id and title', async () => {
            mockNextTokenAs(ORG_PAYLOAD);
            (prisma.event.findMany as jest.Mock).mockResolvedValue([MOCK_EVENT]);

            const res = await app.inject({
                method: 'GET',
                url: '/api/referral/organizer/events',
                headers: { authorization: 'Bearer org-token' },
            });
            expect(res.statusCode).toBe(200);
            const body = JSON.parse(res.payload);
            expect(body.data).toHaveLength(1);
            expect(body.data[0]).toMatchObject({ title: 'Test Hackathon' });
        });
    });

    describe('GET /api/referral/organizer/colleges', () => {
        test('200 returns platform-wide colleges (same as admin)', async () => {
            mockNextTokenAs(ORG_PAYLOAD);
            (prisma.user.findMany as jest.Mock).mockResolvedValue([
                { college: 'IIT Bombay' },
                { college: 'MIT' },
            ]);

            const res = await app.inject({
                method: 'GET',
                url: '/api/referral/organizer/colleges',
                headers: { authorization: 'Bearer org-token' },
            });
            expect(res.statusCode).toBe(200);
            expect(JSON.parse(res.payload).data).toEqual(['IIT Bombay', 'MIT']);
        });
    });

    describe('GET /api/referral/organizer/colleges/:college/students', () => {
        test('200 returns students from that college', async () => {
            mockNextTokenAs(ORG_PAYLOAD);
            (prisma.user.findMany as jest.Mock).mockResolvedValue([MOCK_STUDENT]);

            const res = await app.inject({
                method: 'GET',
                url: '/api/referral/organizer/colleges/MIT/students',
                headers: { authorization: 'Bearer org-token' },
            });
            expect(res.statusCode).toBe(200);
            const body = JSON.parse(res.payload);
            expect(body.data[0]).toMatchObject({ id: 'student-uuid-1', college: 'MIT' });
        });
    });

    describe('POST /api/referral/organizer/generate', () => {
        test('401 with no token', async () => {
            const res = await postJson('/api/referral/organizer/generate', { eventId: UUID_EVENT, refereeUserId: UUID_REFEREE });
            expect(res.statusCode).toBe(401);
        });

        test('403 when isOrganizer=false', async () => {
            // default jwt mock = isOrganizer: false
            const res = await postJson('/api/referral/organizer/generate',
                { eventId: UUID_EVENT, refereeUserId: UUID_REFEREE },
                { authorization: 'Bearer user-token' }
            );
            expect(res.statusCode).toBe(403);
        });

        test('403 when organizer does not own the event', async () => {
            mockNextTokenAs(ORG_PAYLOAD);
            (prisma.event.findUnique as jest.Mock).mockResolvedValue({
                ...MOCK_EVENT,
                organizerId: 'some-other-org',   // different from ORG_PAYLOAD.userId
            });

            const res = await postJson('/api/referral/organizer/generate',
                { eventId: UUID_EVENT, refereeUserId: UUID_REFEREE },
                { authorization: 'Bearer org-token' }
            );
            expect(res.statusCode).toBe(403);
            expect(JSON.parse(res.payload).message).toContain('own events');
        });

        test('200 generates referral for own event', async () => {
            mockNextTokenAs(ORG_PAYLOAD);
            (prisma.event.findUnique as jest.Mock).mockResolvedValue(MOCK_EVENT); // organizerId: 'org-1'
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(MOCK_STUDENT);
            (prisma.referral.findFirst as jest.Mock).mockResolvedValue(null);
            (prisma.referral.create as jest.Mock).mockResolvedValue(MOCK_REFERRAL);

            const res = await postJson('/api/referral/organizer/generate',
                { eventId: UUID_EVENT, refereeUserId: UUID_REFEREE },
                { authorization: 'Bearer org-token' }
            );
            expect(res.statusCode).toBe(200);
            const body = JSON.parse(res.payload);
            expect(body.data.code).toBe('REF-ABCDEF');
            expect(body.data.link).toContain('?ref=REF-ABCDEF');
            expect(body.data.referee).toHaveProperty('id', 'student-uuid-1');
        });

        test('200 returns same code when referral exists (idempotent)', async () => {
            mockNextTokenAs(ORG_PAYLOAD);
            (prisma.event.findUnique as jest.Mock).mockResolvedValue(MOCK_EVENT);
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(MOCK_STUDENT);
            (prisma.referral.findFirst as jest.Mock).mockResolvedValue(MOCK_REFERRAL); // already exists

            const res = await postJson('/api/referral/organizer/generate',
                { eventId: UUID_EVENT, refereeUserId: UUID_REFEREE },
                { authorization: 'Bearer org-token' }
            );
            expect(res.statusCode).toBe(200);
            expect(JSON.parse(res.payload).data.code).toBe('REF-ABCDEF');
            expect(prisma.referral.create).not.toHaveBeenCalled();
        });
    });

    describe('GET /api/referral/organizer/stats/:eventId', () => {
        test('403 when organizer does not own the event', async () => {
            mockNextTokenAs(ORG_PAYLOAD);
            (prisma.event.findUnique as jest.Mock).mockResolvedValue({
                ...MOCK_EVENT,
                organizerId: 'another-org',
            });

            const res = await app.inject({
                method: 'GET',
                url: '/api/referral/organizer/stats/event-uuid-1',
                headers: { authorization: 'Bearer org-token' },
            });
            expect(res.statusCode).toBe(403);
        });

        test('200 returns stats for own event', async () => {
            mockNextTokenAs(ORG_PAYLOAD);
            (prisma.event.findUnique as jest.Mock).mockResolvedValue(MOCK_EVENT);
            (prisma.referral.findMany as jest.Mock).mockResolvedValue([
                { ...MOCK_REFERRAL, referrer: MOCK_STUDENT, clicksData: [] },
            ]);

            const res = await app.inject({
                method: 'GET',
                url: '/api/referral/organizer/stats/event-uuid-1',
                headers: { authorization: 'Bearer org-token' },
            });
            expect(res.statusCode).toBe(200);
            const { data } = JSON.parse(res.payload);
            expect(data.totalClicks).toBe(3);
            expect(data.totalConversions).toBe(1);
            expect(data.referrals[0].code).toBe('REF-ABCDEF');
        });
    });
});
