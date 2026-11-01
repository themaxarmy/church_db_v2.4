// SQLite stand-in for the pg Pool, for local testing only.
// Selected when DATABASE_URL is `sqlite:<path>` (e.g. sqlite:./local.db, or sqlite::memory:).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const SCHEMA = path.join(path.dirname(fileURLToPath(import.meta.url)), 'schema.sqlite.sql');

// Columns added after the first release (see migrations/), for local.db files created before them.
const ADDED_COLUMNS = {
  users: ['must_change_password integer NOT NULL DEFAULT 0', 'password_changed_at text'],
  form_records: [
    "gender text CHECK (gender IN ('male', 'female'))",
    'phone text',
    'email text',
    'address text',
    'ministry text',
    'guardian_name text',
    'guardian_phone text',
    'emergency_contact_name text',
    'emergency_contact_phone text',
    'emergency_contact_relationship text',
    'archived_at text',
    'submitted_by text REFERENCES users(id) ON DELETE SET NULL',
    'updated_by text REFERENCES users(id) ON DELETE SET NULL',
  ],
};

const addMissingColumns = (db) => {
  for (const [table, columns] of Object.entries(ADDED_COLUMNS)) {
    const existing = new Set(db.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name));
    for (const column of columns) {
      if (!existing.has(column.split(' ')[0])) db.exec(`ALTER TABLE ${table} ADD COLUMN ${column}`);
    }
  }
};

export const createSqlitePool = (databaseUrl) => {
  const file = databaseUrl.slice('sqlite:'.length) || ':memory:';
  const db = new DatabaseSync(file);

  // Postgres functions the queries and schema rely on.
  db.function('now', () => new Date().toISOString());
  db.function('gen_random_uuid', () => crypto.randomUUID());
  db.exec(fs.readFileSync(SCHEMA, 'utf8'));
  addMissingColumns(db);

  const toParam = (value) => {
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'boolean') return value ? 1 : 0;
    return value ?? null;
  };

  return {
    // Same shape as pg's pool.query: rewrites $1..$n to positional `?` (supports reuse).
    async query(text, params = []) {
      const values = [];
      const sql = text.replace(/\$(\d+)/g, (_, n) => {
        values.push(toParam(params[Number(n) - 1]));
        return '?';
      });
      try {
        const statement = db.prepare(sql);
        if (/^\s*select\b|\breturning\b/i.test(sql)) {
          const rows = statement.all(...values);
          return { rows, rowCount: rows.length };
        }
        const { changes } = statement.run(...values);
        return { rows: [], rowCount: Number(changes) };
      } catch (err) {
        // Report unique violations with the Postgres code the routes check for.
        if (err.errcode === 2067 || err.errcode === 1555) err.code = '23505';
        throw err;
      }
    },
    on() {},
    async end() {
      db.close();
    },
  };
};
