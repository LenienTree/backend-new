/**
 * import-ieee-registrations.mjs
 *
 * Imports "IEEE PELS RDL_ CUSAT (Responses).xlsx" registrations into the DB
 * for event: da24b455-b896-4711-b249-367b02a4385b
 *
 * Strategy:
 *   - For each row, upsert a minimal "ghost" User (email-unverified, no password)
 *     so that the Registration FK is satisfied, WITHOUT creating a full account.
 *   - Then upsert a Registration record linking the ghost user to the event.
 *   - All form data (college, dept, year, IEEE membership, question) is stored
 *     in the Registration.formData JSON field.
 *   - Uses DIRECT_URL (port 5432) to avoid pooler timeouts.
 *   - Retries each row up to 3 times on transient DB errors.
 *
 * Run:
 *   node scripts/import-ieee-registrations.mjs
 */

import xlsx from 'xlsx';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const EVENT_ID = 'da24b455-b896-4711-b249-367b02a4385b';
const XLSX_FILE = path.join(__dirname, '../IEEE PELS RDL_ CUSAT (Responses).xlsx');

// Use DIRECT_URL for bulk scripts — bypasses the pooler (PgBouncer) which has
// a tight connection limit and causes timeouts during sequential bulk inserts.
const prisma = new PrismaClient({
  datasourceUrl: process.env.DIRECT_URL,
});

function excelSerialToDate(serial) {
  const utc_days = Math.floor(serial - 25569);
  return new Date(utc_days * 86400 * 1000);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function withRetry(fn, label, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const isTransient =
        err.message.includes("Can't reach database") ||
        err.message.includes('connection pool') ||
        err.message.includes('Timed out') ||
        err.message.includes('ECONNRESET') ||
        err.message.includes('connection was forcibly closed');
      if (isTransient && attempt < maxRetries) {
        const delay = attempt * 2000;
        console.warn(`  ⏳ ${label}: transient error, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`);
        await sleep(delay);
      } else {
        throw err;
      }
    }
  }
}

async function main() {
  console.log('📂 Reading Excel file...');
  const wb = xlsx.readFile(XLSX_FILE);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(ws, { header: 1 });

  const [header, ...dataRows] = rows;
  console.log(`📋 Columns: ${header.join(' | ')}`);
  console.log(`📊 Total data rows: ${dataRows.length}`);

  // Verify event exists
  const event = await withRetry(
    () => prisma.event.findUnique({ where: { id: EVENT_ID } }),
    'find event'
  );
  if (!event) {
    console.error(`❌ Event ${EVENT_ID} not found in database!`);
    process.exit(1);
  }
  console.log(`✅ Event found: "${event.title}"`);

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const [
      timestampRaw,
      name,
      email,
      whatsapp,
      ieeeMember,
      ieeePelsMember,
      college,
      department,
      departmentOther,
      year,
      question
    ] = row;

    if (!email || !name) {
      console.warn(`⚠️  Row ${i + 2}: Missing name or email — skipping`);
      skipped++;
      continue;
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanName = String(name).trim();
    const cleanPhone = whatsapp ? String(whatsapp).replace(/\D/g, '').slice(-10) : null;
    const registeredAt = typeof timestampRaw === 'number' ? excelSerialToDate(timestampRaw) : new Date();
    const finalDept = departmentOther ? String(departmentOther).trim() : (department ? String(department).trim() : null);

    const formData = {
      college: college ? String(college).trim() : null,
      department: finalDept,
      year: year ? String(year).trim() : null,
      ieeeMember: ieeeMember ? String(ieeeMember).trim() : null,
      ieeePelsMember: ieeePelsMember ? String(ieeePelsMember).trim() : null,
      question: question ? String(question).trim() : null,
      whatsapp: cleanPhone,
      source: 'google_form_import',
    };

    try {
      // Upsert ghost user — only create if not already present
      const user = await withRetry(
        () => prisma.user.upsert({
          where: { email: cleanEmail },
          update: {}, // don't overwrite existing user data
          create: {
            name: cleanName,
            email: cleanEmail,
            phone: cleanPhone,
            college: college ? String(college).trim() : null,
            isEmailVerified: false,
            internshipDomains: [],
            interests: [],
            // No passwordHash — ghost/import-only user
          },
        }),
        `upsert user ${cleanEmail}`
      );

      // Check for existing registration
      const existing = await withRetry(
        () => prisma.registration.findUnique({
          where: { eventId_userId: { eventId: EVENT_ID, userId: user.id } },
        }),
        `check registration ${cleanEmail}`
      );

      if (existing) {
        console.log(`⏭️  Row ${i + 2}: ${cleanEmail} — already registered (id: ${existing.id})`);
        skipped++;
        continue;
      }

      await withRetry(
        () => prisma.registration.create({
          data: {
            eventId: EVENT_ID,
            userId: user.id,
            status: 'APPROVED',
            paymentStatus: 'UNPAID',
            formData: formData,
            registeredAt: registeredAt,
          },
        }),
        `create registration ${cleanEmail}`
      );

      console.log(`✅ Row ${i + 2}: Registered ${cleanName} <${cleanEmail}>`);
      created++;
    } catch (err) {
      console.error(`❌ Row ${i + 2}: ${cleanEmail} — ${err.message.split('\n')[0]}`);
      errors++;
    }

    // Small pause between rows to be gentle on the DB connection
    await sleep(200);
  }

  console.log('\n=== Import Summary ===');
  console.log(`✅ Created:  ${created}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`❌ Errors:  ${errors}`);
  console.log(`📊 Total:   ${dataRows.length}`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
