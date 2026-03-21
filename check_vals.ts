import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.count();
    const events = await prisma.event.count();
    const registrations = await prisma.registration.count();
    const bookmarks = await prisma.bookmark.count();
    const certificates = await prisma.certificate.count();

    console.log('--- DATABASE STATS ---');
    console.log(`Users:         ${users}`);
    console.log(`Events:        ${events}`);
    console.log(`Registrations: ${registrations}`);
    console.log(`Bookmarks:     ${bookmarks}`);
    console.log(`Certificates:  ${certificates}`);
}

main().finally(() => prisma.$disconnect());
