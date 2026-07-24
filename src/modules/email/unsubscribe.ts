import crypto from 'crypto';
import { config } from '../../config/config';
import { prisma } from '../../config/database';

const SECRET = config.jwt.secret;

const norm = (email: string) => email.trim().toLowerCase();

/** Signed, stateless unsubscribe token: base64url(email).hmac — can't be forged. */
export function makeUnsubToken(email: string): string {
    const e = norm(email);
    const payload = Buffer.from(e).toString('base64url');
    const sig = crypto.createHmac('sha256', SECRET).update(e).digest('base64url');
    return `${payload}.${sig}`;
}

/** Returns the email if the token is valid, else null. */
export function verifyUnsubToken(token: string): string | null {
    try {
        const [payload, sig] = String(token || '').split('.');
        if (!payload || !sig) return null;
        const email = Buffer.from(payload, 'base64url').toString('utf8').toLowerCase();
        const expected = crypto.createHmac('sha256', SECRET).update(email).digest('base64url');
        const a = Buffer.from(sig);
        const b = Buffer.from(expected);
        if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
        return email;
    } catch {
        return null;
    }
}

export function buildUnsubscribeUrl(email: string): string {
    return `${config.clientUrl}/unsubscribe?token=${encodeURIComponent(makeUnsubToken(email))}`;
}

// Short-lived per-worker cache so the send path doesn't hit the DB for every email.
const unsubCache = new Map<string, { v: boolean; at: number }>();
const TTL = 30000;

export async function isUnsubscribed(email: string): Promise<boolean> {
    const key = norm(email);
    const c = unsubCache.get(key);
    if (c && Date.now() - c.at < TTL) return c.v;
    try {
        const row = await prisma.emailUnsubscribe.findUnique({ where: { email: key } });
        const v = !!row;
        unsubCache.set(key, { v, at: Date.now() });
        return v;
    } catch {
        // Resilient: if the table is missing / DB errors, treat as subscribed so mail still flows.
        return false;
    }
}

export function invalidateUnsubCache(email?: string): void {
    if (email) unsubCache.delete(norm(email));
    else unsubCache.clear();
}

export async function recordUnsubscribe(email: string, reason?: string, source = 'link'): Promise<void> {
    const key = norm(email);
    await prisma.emailUnsubscribe.upsert({
        where: { email: key },
        create: { email: key, reason: reason ?? null, source },
        update: { reason: reason ?? null, source },
    });
    invalidateUnsubCache(key);
}

export async function removeUnsubscribe(email: string): Promise<void> {
    const key = norm(email);
    await prisma.emailUnsubscribe.deleteMany({ where: { email: key } });
    invalidateUnsubCache(key);
}
