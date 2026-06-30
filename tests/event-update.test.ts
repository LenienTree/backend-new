import { eventService } from '../src/services/event.service';
import { prisma } from '../src/config/database';

// Regression tests for the partial-update NULL-overwrite fix in updateEvent().
// We call the service directly and inspect the `data` handed to prisma.event.update.
describe('EventService.updateEvent — sanitization', () => {
    const eventId = 'evt1';
    const organizerId = 'org1';

    const getUpdateData = () => {
        const mock = prisma.event.update as jest.Mock;
        return mock.mock.calls[0][0].data as Record<string, any>;
    };

    beforeEach(() => {
        jest.clearAllMocks();
        // verifyOwnership() lookup
        (prisma.event.findUnique as jest.Mock).mockResolvedValue({
            id: eventId,
            organizerId,
            deletedAt: null,
        });
        // update() return shape (updateEvent reads .registrations)
        (prisma.event.update as jest.Mock).mockResolvedValue({
            id: eventId,
            title: 'Existing',
            registrations: [],
        });
    });

    test('drops relation/computed keys that cannot be set on a flat update', async () => {
        await eventService.updateEvent(eventId, organizerId, {
            title: 'New Title',
            faqs: [{ question: 'q', answer: 'a' }],
            announcements: [{ title: 't', content: 'c' }],
            organizer: { id: 'x' },
            _count: { registrations: 5 },
            status: 'DRAFT',
            id: 'should-not-leak',
        } as any, 'ADMIN');

        const data = getUpdateData();
        expect(data.title).toBe('New Title');
        expect(data.faqs).toBeUndefined();
        expect(data.announcements).toBeUndefined();
        expect(data.organizer).toBeUndefined();
        expect(data._count).toBeUndefined();
        expect(data.status).toBeUndefined();
        expect(data.id).toBeUndefined();
    });

    test('refuses to null or blank out required scalars', async () => {
        await eventService.updateEvent(eventId, organizerId, {
            title: null,
            description: '   ',
            category: '',
            subtitle: null, // optional → null IS allowed (clearing)
        } as any, 'ADMIN');

        const data = getUpdateData();
        expect('title' in data).toBe(false);
        expect('description' in data).toBe(false);
        expect('category' in data).toBe(false);
        // optional/nullable field can still be cleared
        expect(data.subtitle).toBeNull();
    });

    test('skips undefined values so missing fields stay unchanged', async () => {
        await eventService.updateEvent(eventId, organizerId, {
            title: 'Only this changes',
            subtitle: undefined,
            theme: undefined,
        } as any, 'ADMIN');

        const data = getUpdateData();
        expect(Object.keys(data)).toEqual(['title']);
    });

    test('flattens nested location into scalar columns', async () => {
        await eventService.updateEvent(eventId, organizerId, {
            location: { venueName: 'Hall A', address: '123 St', mapLink: 'https://maps.example/x' },
        } as any, 'ADMIN');

        const data = getUpdateData();
        expect(data.location).toBeUndefined();
        expect(data.venueName).toBe('Hall A');
        expect(data.address).toBe('123 St');
        expect(data.mapLink).toBe('https://maps.example/x');
    });

    test('coerces ISO date strings into Date objects', async () => {
        await eventService.updateEvent(eventId, organizerId, {
            startDate: '2026-07-01T10:00:00.000Z',
        } as any, 'ADMIN');

        const data = getUpdateData();
        expect(data.startDate).toBeInstanceOf(Date);
        expect((data.startDate as Date).toISOString()).toBe('2026-07-01T10:00:00.000Z');
    });

    test('allows clearing venue fields (mode switched to ONLINE)', async () => {
        await eventService.updateEvent(eventId, organizerId, {
            venueName: null,
            address: null,
            mapLink: null,
        } as any, 'ADMIN');

        const data = getUpdateData();
        expect(data.venueName).toBeNull();
        expect(data.address).toBeNull();
        expect(data.mapLink).toBeNull();
    });
});
