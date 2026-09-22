import { Client } from 'pg';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('Missing DATABASE_URL (Postgres connection string).');
  console.error('Get it from Supabase Dashboard > Project Settings > Database > Connection string (URI).');
  process.exit(1);
}

const client = new Client({ connectionString });
await client.connect();

await client.query(`
  create table if not exists public.schema_migrations (
    name text primary key,
    applied_at timestamptz not null default now()
  )
`);

const migrationsDir = join(process.cwd(), 'database', 'migrations');
const files = readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

for (const file of files) {
  const { rowCount } = await client.query('select 1 from public.schema_migrations where name = $1', [file]);
  if (rowCount) {
    console.log(`SKIP (applied): ${file}`);
    continue;
  }
  const sql = readFileSync(join(migrationsDir, file), 'utf-8');
  console.log(`Applying ${file}...`);
  try {
    await client.query('begin');
    await client.query(sql);
    await client.query('insert into public.schema_migrations (name) values ($1)', [file]);
    await client.query('commit');
    console.log(`OK: ${file}`);
  } catch (e) {
    await client.query('rollback').catch(() => undefined);
    console.error(`FAIL: ${file}: ${e.message}`);
    await client.end();
    process.exit(1);
  }
}

await client.end();
console.log('Done.');
