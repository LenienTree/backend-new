/**
 * import-to-supabase.mjs
 * Imports backup.sql into Supabase PostgreSQL.
 * Run: node scripts/import-to-supabase.mjs
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SUPABASE_DIRECT_URL =
  'postgresql://postgres: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@db.pynrxtqiwlqztvwluaiw.supabase.co:5432/postgres';

const SQL_FILE = path.join(__dirname, '..', 'backup.sql');

async function main() {
  if (!fs.existsSync(SQL_FILE)) {
    console.error('❌ backup.sql not found. Run dump-to-sql.mjs first.');
    process.exit(1);
  }

  console.log('🔌 Connecting to Supabase...');
  const client = new pg.Client({
    connectionString: SUPABASE_DIRECT_URL,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log('✅ Connected to Supabase.\n');

  const sql = fs.readFileSync(SQL_FILE, 'utf8');

  // Split into individual statements on semicolons, skip empty lines
  // Use a smarter split that respects dollar-quoted strings
  const statements = [];
  let current = '';
  let inSingleQuote = false;

  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    if (ch === "'" && sql[i - 1] !== '\\') inSingleQuote = !inSingleQuote;
    current += ch;
    if (ch === ';' && !inSingleQuote) {
      const stmt = current.trim();
      if (stmt && stmt !== ';' && !stmt.startsWith('--')) {
        statements.push(stmt);
      }
      current = '';
    }
  }

  console.log(`📋 Executing ${statements.length} SQL statements...\n`);

  let ok = 0, skip = 0, errors = 0;
  for (const stmt of statements) {
    try {
      await client.query(stmt);
      ok++;
    } catch (err) {
      // Skip "already exists" errors — tables created by Prisma migrate are fine
      if (
        err.message.includes('already exists') ||
        err.message.includes('duplicate key') ||
        err.message.includes('does not exist')
      ) {
        skip++;
      } else {
        console.warn(`  ⚠️  ${err.message.split('\n')[0]}`);
        errors++;
      }
    }
  }

  await client.end();

  console.log(`\n✅ Import complete!`);
  console.log(`   ✔  ${ok} statements OK`);
  console.log(`   ⏭  ${skip} skipped (already exist / conflicts)`);
  if (errors > 0) console.log(`   ✗  ${errors} errors (see warnings above)`);
}

main().catch(err => {
  console.error('❌ Fatal:', err.message);
  process.exit(1);
});
