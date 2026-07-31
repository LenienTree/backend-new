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

const updatedFields = [
  {
    type: "text",
    label: "name",
    required: true
  },
  {
    type: "text",
    label: "phone",
    required: true
  },
  {
    type: "text",
    label: "email",
    required: true
  },
  {
    type: "text",
    label: "college",
    required: true
  },
  {
    type: "checkbox",
    label: "Are you an IEEE member?",
    required: false
  },
  {
    type: "checkbox",
    label: "Are you an IEEE PELS Member?",
    required: false
  },
  {
    type: "select",
    label: "Department?",
    required: true,
    options: [
      "EEE",
      "ECE",
      "SFE",
      "IT",
      "CSE",
      "ME",
      "CE",
      "AI",
      "Others"
    ]
  },
  {
    type: "text",
    label: "If others, mention (optional)",
    required: false
  },
  {
    type: "select",
    label: "Which year?",
    required: true,
    options: [
      "1st year",
      "2nd year",
      "3rd year",
      "4th year",
      "5th year"
    ]
  },
  {
    type: "text",
    label: "A question you would like to ask to the speaker?",
    required: false
  }
];

const event = await prisma.event.update({
  where: { id: EVENT_ID },
  data: {
    customFormFields: updatedFields
  },
  select: { id: true, title: true, customFormFields: true }
});

console.log('✅ Successfully updated customFormFields for event:', event.title);
console.log('New Custom Form Fields:\n', JSON.stringify(event.customFormFields, null, 2));

await prisma.$disconnect();
