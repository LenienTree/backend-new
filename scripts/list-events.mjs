import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();
const events = await prisma.event.findMany({ 
  select: { id: true, title: true, status: true }, 
  orderBy: { createdAt: 'desc' }, 
  take: 15 
});
events.forEach(e => console.log(e.id, '|', e.status.padEnd(18), '|', e.title));
await prisma.$disconnect();
