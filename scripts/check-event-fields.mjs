import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient({
  datasourceUrl: process.env.DIRECT_URL,
});

const event = await prisma.event.findUnique({
  where: { id: 'da24b455-b896-4711-b249-367b02a4385b' },
  select: { id: true, title: true, customFormFields: true }
});

console.log('Event:', event.title);
console.log('Custom Form Fields:', JSON.stringify(event.customFormFields, null, 2));

await prisma.$disconnect();
