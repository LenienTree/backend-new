/**
 * dump-to-sql.mjs
 * Dumps Neon PostgreSQL schema + data to a .sql file for Supabase migration.
 * Run: node scripts/dump-to-sql.mjs
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Config ────────────────────────────────────────────────────────────────
const CONNECTION_STRING =
  process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_C1gRGV9IWyDv@ep-floral-mountain-a14j8ucv.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&connect_timeout=30';

const OUTPUT_FILE = path.join(__dirname, '..', 'backup.sql');

// ─── Helpers ───────────────────────────────────────────────────────────────
function escapeLiteral(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'number') return String(val);
  if (val instanceof Date) return `'${val.toISOString()}'`;
  if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
  return `'${String(val).replace(/'/g, "''")}'`;
}

function escapeIdentifier(name) {
  return `"${name.replace(/"/g, '""')}"`;
}

// ─── Main ──────────────────────────────────────────────────────────────────
async function main() {
  console.log('🔌 Connecting to Neon DB...');

  const client = new pg.Client({
    connectionString: CONNECTION_STRING,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log('✅ Connected.\n');

  const lines = [];

  lines.push('-- ============================================================');
  lines.push('-- Neon DB Backup → Supabase Migration');
  lines.push(`-- Generated: ${new Date().toISOString()}`);
  lines.push('-- ============================================================');
  lines.push('');
  lines.push('SET statement_timeout = 0;');
  lines.push('SET lock_timeout = 0;');
  lines.push('SET client_encoding = \'UTF8\';');
  lines.push('SET standard_conforming_strings = on;');
  lines.push('SET check_function_bodies = false;');
  lines.push('SET xmloption = content;');
  lines.push('SET client_min_messages = warning;');
  lines.push('SET row_security = off;');
  lines.push('');

  // ── 1. Get all enum types ────────────────────────────────────────────────
  console.log('📦 Dumping enum types...');
  const enumsRes = await client.query(`
    SELECT t.typname AS name,
           array_agg(e.enumlabel ORDER BY e.enumsortorder) AS labels
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
    GROUP BY t.typname
    ORDER BY t.typname
  `);

  if (enumsRes.rows.length > 0) {
    lines.push('-- ── Enum Types ─────────────────────────────────────────');
    for (const row of enumsRes.rows) {
      const labelsArr = Array.isArray(row.labels)
      ? row.labels
      : String(row.labels).replace(/^{|}$/g, '').split(',').map(s => s.trim());
    const labels = labelsArr.map(l => `'${l}'`).join(', ');
      lines.push(`CREATE TYPE IF NOT EXISTS ${escapeIdentifier(row.name)} AS ENUM (${labels});`);
    }
    lines.push('');
  }

  // ── 2. Get table DDL via information_schema ──────────────────────────────
  console.log('📋 Dumping table schemas...');

  const tablesRes = await client.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);

  const tables = tablesRes.rows.map(r => r.table_name);
  console.log(`   Found tables: ${tables.join(', ')}\n`);

  // We'll dump CREATE TABLE statements using pg_get_tabledef equivalent
  // by querying columns + constraints directly
  lines.push('-- ── Table Schemas ──────────────────────────────────────────');

  for (const table of tables) {
    // Columns
    const colsRes = await client.query(`
      SELECT
        c.column_name,
        c.data_type,
        c.udt_name,
        c.character_maximum_length,
        c.numeric_precision,
        c.numeric_scale,
        c.is_nullable,
        c.column_default
      FROM information_schema.columns c
      WHERE c.table_schema = 'public'
        AND c.table_name = $1
      ORDER BY c.ordinal_position
    `, [table]);

    const colDefs = colsRes.rows.map(col => {
      let typeDef;
      if (col.data_type === 'USER-DEFINED') {
        typeDef = escapeIdentifier(col.udt_name);
      } else if (col.data_type === 'character varying') {
        typeDef = col.character_maximum_length
          ? `VARCHAR(${col.character_maximum_length})`
          : 'TEXT';
      } else if (col.data_type === 'ARRAY') {
        typeDef = col.udt_name.startsWith('_') ? `${col.udt_name.slice(1).toUpperCase()}[]` : `${col.udt_name}[]`;
      } else {
        typeDef = col.data_type.toUpperCase();
      }

      const nullable = col.is_nullable === 'YES' ? '' : ' NOT NULL';
      const def = col.column_default ? ` DEFAULT ${col.column_default}` : '';

      return `    ${escapeIdentifier(col.column_name)} ${typeDef}${nullable}${def}`;
    });

    // Primary key
    const pkRes = await client.query(`
      SELECT kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
       AND tc.table_schema = kcu.table_schema
      WHERE tc.constraint_type = 'PRIMARY KEY'
        AND tc.table_schema = 'public'
        AND tc.table_name = $1
      ORDER BY kcu.ordinal_position
    `, [table]);

    if (pkRes.rows.length > 0) {
      const pkCols = pkRes.rows.map(r => escapeIdentifier(r.column_name)).join(', ');
      colDefs.push(`    PRIMARY KEY (${pkCols})`);
    }

    lines.push(`CREATE TABLE IF NOT EXISTS ${escapeIdentifier(table)} (`);
    lines.push(colDefs.join(',\n'));
    lines.push(');');
    lines.push('');
  }

  // ── 3. Indexes ───────────────────────────────────────────────────────────
  console.log('🔑 Dumping indexes...');
  const indexRes = await client.query(`
    SELECT indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname NOT LIKE '%_pkey'
    ORDER BY tablename, indexname
  `);

  if (indexRes.rows.length > 0) {
    lines.push('-- ── Indexes ────────────────────────────────────────────────');
    for (const row of indexRes.rows) {
      lines.push(`${row.indexdef};`);
    }
    lines.push('');
  }

  // ── 4. Foreign Keys ──────────────────────────────────────────────────────
  console.log('🔗 Dumping foreign keys...');
  const fkRes = await client.query(`
    SELECT
      tc.constraint_name,
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name,
      rc.update_rule,
      rc.delete_rule
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
     AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
     AND ccu.table_schema = tc.table_schema
    JOIN information_schema.referential_constraints AS rc
      ON rc.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
    ORDER BY tc.table_name, tc.constraint_name
  `);

  if (fkRes.rows.length > 0) {
    lines.push('-- ── Foreign Keys ───────────────────────────────────────────');
    for (const fk of fkRes.rows) {
      lines.push(
        `ALTER TABLE ${escapeIdentifier(fk.table_name)} ` +
        `ADD CONSTRAINT ${escapeIdentifier(fk.constraint_name)} ` +
        `FOREIGN KEY (${escapeIdentifier(fk.column_name)}) ` +
        `REFERENCES ${escapeIdentifier(fk.foreign_table_name)} (${escapeIdentifier(fk.foreign_column_name)}) ` +
        `ON UPDATE ${fk.update_rule} ON DELETE ${fk.delete_rule};`
      );
    }
    lines.push('');
  }

  // ── 5. Data (INSERT statements) ──────────────────────────────────────────
  console.log('📤 Dumping data...\n');
  lines.push('-- ── Data ───────────────────────────────────────────────────');
  lines.push('');

  // Disable triggers during import (useful for FK constraints)
  lines.push('SET session_replication_role = replica;');
  lines.push('');

  for (const table of tables) {
    const dataRes = await client.query(`SELECT * FROM ${escapeIdentifier(table)}`);

    if (dataRes.rows.length === 0) {
      console.log(`   ${table}: 0 rows (skipped)`);
      continue;
    }

    console.log(`   ${table}: ${dataRes.rows.length} rows`);
    const cols = dataRes.fields.map(f => escapeIdentifier(f.name)).join(', ');

    lines.push(`-- ${table} (${dataRes.rows.length} rows)`);

    // Batch into chunks of 500 rows
    const CHUNK = 500;
    for (let i = 0; i < dataRes.rows.length; i += CHUNK) {
      const chunk = dataRes.rows.slice(i, i + CHUNK);
      const values = chunk
        .map(row => `(${dataRes.fields.map(f => escapeLiteral(row[f.name])).join(', ')})`)
        .join(',\n    ');

      lines.push(`INSERT INTO ${escapeIdentifier(table)} (${cols}) VALUES`);
      lines.push(`    ${values}`);
      lines.push(`ON CONFLICT DO NOTHING;`);
      lines.push('');
    }
  }

  lines.push('');
  lines.push('SET session_replication_role = DEFAULT;');
  lines.push('');
  lines.push('-- ✅ Backup complete');

  // ── Write file ────────────────────────────────────────────────────────────
  await client.end();

  const content = lines.join('\n');
  fs.writeFileSync(OUTPUT_FILE, content, 'utf8');

  const sizeMb = (fs.statSync(OUTPUT_FILE).size / 1024 / 1024).toFixed(2);
  console.log(`\n✅ Done! Backup saved to: backup.sql (${sizeMb} MB)`);
  console.log('\nNext steps:');
  console.log('  1. Go to Supabase → SQL Editor');
  console.log('  2. Paste / upload backup.sql and run it');
  console.log('  OR use: psql <supabase_connection_string> -f backup.sql');
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
