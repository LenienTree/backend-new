import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient({
  datasourceUrl: process.env.DIRECT_URL,
});

const EVENT_ID = 'da24b455-b896-4711-b249-367b02a4385b';
const WHATSAPP_LINK = 'https://chat.whatsapp.com/GPxZW2ZSx5s7iE8QzynHxM?s=sw&p=a&ilr=0&amv=0';

// Check organizer user ID
const event = await prisma.event.findUnique({
  where: { id: EVENT_ID },
  select: { organizerId: true, title: true }
});

if (event) {
  // Check if announcement already exists
  const existingAnn = await prisma.announcement.findFirst({
    where: {
      eventId: EVENT_ID,
      title: { contains: 'WhatsApp' }
    }
  });

  if (!existingAnn) {
    await prisma.announcement.create({
      data: {
        eventId: EVENT_ID,
        title: 'Official WhatsApp Group Link',
        content: `Join the official event WhatsApp group for real-time updates: ${WHATSAPP_LINK}`,
        createdBy: event.organizerId
      }
    });
    console.log('✅ Created announcement in database with WhatsApp link!');
  } else {
    console.log('ℹ️ WhatsApp announcement already exists in DB');
  }
}

await prisma.$disconnect();
