// Usage: npm run migrate
// Applies every file in migrations/ in name order. Each file must be safe to re-run.
// Uses DATABASE_URL_UNPOOLED when set (Neon's direct connection), otherwise DATABASE_URL.
// SQLite databases upgrade themselves on startup and don't need this.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { config } from '../config.js';

if (config.databaseUrl.startsWith('sqlite:')) {
  console.log('SQLite databases are upgraded automatically when the server starts.');
  process.exit(0);
}

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'migrations');
const client = new pg.Client({ connectionString: process.env.DATABASE_URL_UNPOOLED || config.databaseUrl });
await client.connect();
try {
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()) {
    await client.query(fs.readFileSync(path.join(dir, file), 'utf8'));
    console.log(`Applied ${file}`);
  }
} finally {
  await client.end();
}
