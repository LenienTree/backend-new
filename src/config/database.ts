import { PrismaClient } from '@prisma/client';

// In production, DATABASE_URL must point to the Neon pooler endpoint
// (hostname contains "-pooler") for PgBouncer connection pooling.
// Without it, Prisma's default 10-connection pool is the concurrency ceiling.
if (process.env.NODE_ENV === 'production') {
    const dbUrl = process.env.DATABASE_URL ?? '';
    const isNeonPooler = dbUrl.includes('-pooler');
    const isSupabasePooler = dbUrl.includes('pooler.supabase.com') || dbUrl.includes('pgbouncer=true');
    if (!isNeonPooler && !isSupabasePooler) {
        console.warn(
            '⚠️  [DB] DATABASE_URL does not use a connection pooler. ' +
            'Use Neon pooler (-pooler hostname) or Supabase pooler (port 6543, pgbouncer=true) in production.'
        );
    }
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        log: ['error'],
    });

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}
