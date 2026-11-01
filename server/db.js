import pg from 'pg';
import { config } from './config.js';

const useSqlite = config.databaseUrl.startsWith('sqlite:');
// A variable path keeps the Netlify bundler from pulling in node:sqlite, which is only for local testing.
const sqliteModule = './sqlite.js';

export const pool = useSqlite
  ? (await import(sqliteModule)).createSqlitePool(config.databaseUrl)
  : new pg.Pool({
      // SSL comes from the URL (Neon's includes sslmode=require). Use Neon's pooled URL here.
      connectionString: config.databaseUrl,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

pool.on('error', (err) => {
  console.error('Unexpected error on idle Postgres client:', err.message);
});

const iso = (value) => (value instanceof Date ? value.toISOString() : value ?? null);

const toUser = (row) =>
  row && {
    id: row.id,
    email: row.email,
    status: row.status,
    role: row.role,
    approvedBy: row.approved_by,
    approvedAt: iso(row.approved_at),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };

const toRecord = (row) =>
  row && {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    otherNames: row.other_names ?? '',
    dateOfBirth: row.date_of_birth,
    picture: row.picture,
    gender: row.gender ?? null,
    phone: row.phone ?? '',
    email: row.email ?? '',
    address: row.address ?? '',
    ministry: row.ministry ?? '',
    guardianName: row.guardian_name ?? '',
    guardianPhone: row.guardian_phone ?? '',
    emergencyContactName: row.emergency_contact_name ?? '',
    emergencyContactPhone: row.emergency_contact_phone ?? '',
    emergencyContactRelationship: row.emergency_contact_relationship ?? '',
    archivedAt: iso(row.archived_at),
    submittedBy: row.submitted_by ?? null,
    submittedByEmail: row.submitted_by_email ?? null,
    updatedBy: row.updated_by ?? null,
    updatedByEmail: row.updated_by_email ?? null,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };

// Return DATE columns as 'YYYY-MM-DD' strings instead of local-midnight Date objects.
pg.types.setTypeParser(1082, (value) => value);

const USER_COLUMNS = 'id, email, status, role, approved_by, approved_at, created_at, updated_at';

export const users = {
  async create(email, passwordHash) {
    const { rows } = await pool.query(
      `INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING ${USER_COLUMNS}`,
      [email, passwordHash],
    );
    return toUser(rows[0]);
  },

  // Only place password_hash leaves the database; callers must not send it to clients.
  async findCredentialsByEmail(email) {
    const { rows } = await pool.query('SELECT id, password_hash FROM users WHERE email = $1', [email]);
    return rows[0] || null;
  },

  async findById(id) {
    const { rows } = await pool.query(`SELECT ${USER_COLUMNS} FROM users WHERE id = $1`, [id]);
    return toUser(rows[0]) || null;
  },

  async findAll() {
    const { rows } = await pool.query(`SELECT ${USER_COLUMNS} FROM users ORDER BY created_at DESC`);
    return rows.map(toUser);
  },

  async setStatus(id, status, actorId) {
    const approved = status === 'approved';
    const { rows } = await pool.query(
      `UPDATE users
          SET status = $1, approved_by = $2, approved_at = $3, updated_at = now()
        WHERE id = $4
        RETURNING ${USER_COLUMNS}`,
      [status, approved ? actorId : null, approved ? new Date() : null, id],
    );
    return toUser(rows[0]) || null;
  },

  async setRole(id, role) {
    const { rows } = await pool.query(
      `UPDATE users SET role = $1, updated_at = now() WHERE id = $2 RETURNING ${USER_COLUMNS}`,
      [role, id],
    );
    return toUser(rows[0]) || null;
  },

  async promoteByEmail(email) {
    const { rows } = await pool.query(
      `UPDATE users
          SET status = 'approved', role = 'super_admin', approved_at = COALESCE(approved_at, now()), updated_at = now()
        WHERE email = $1
        RETURNING ${USER_COLUMNS}`,
      [email],
    );
    return toUser(rows[0]) || null;
  },
};

// API field -> column. Creates and updates only ever touch these columns.
const RECORD_FIELDS = {
  firstName: 'first_name',
  lastName: 'last_name',
  otherNames: 'other_names',
  dateOfBirth: 'date_of_birth',
  picture: 'picture',
  gender: 'gender',
  phone: 'phone',
  email: 'email',
  address: 'address',
  ministry: 'ministry',
  guardianName: 'guardian_name',
  guardianPhone: 'guardian_phone',
  emergencyContactName: 'emergency_contact_name',
  emergencyContactPhone: 'emergency_contact_phone',
  emergencyContactRelationship: 'emergency_contact_relationship',
};

// Includes the emails of the staff who submitted and last updated each record.
const RECORD_SELECT = `
  SELECT r.*, s.email AS submitted_by_email, u.email AS updated_by_email
    FROM form_records r
    LEFT JOIN users s ON s.id = r.submitted_by
    LEFT JOIN users u ON u.id = r.updated_by`;

export const records = {
  // submittedBy is the signed-in staff member, or null for the public form.
  async create(record, submittedBy) {
    const fields = Object.keys(RECORD_FIELDS).filter((field) => record[field] != null);
    const columns = [...fields.map((field) => RECORD_FIELDS[field]), 'submitted_by'];
    const { rows } = await pool.query(
      `INSERT INTO form_records (${columns.join(', ')})
       VALUES (${columns.map((_, i) => `$${i + 1}`).join(', ')})
       RETURNING id`,
      [...fields.map((field) => record[field]), submittedBy],
    );
    return this.findById(rows[0].id);
  },

  async findById(id) {
    const { rows } = await pool.query(`${RECORD_SELECT} WHERE r.id = $1`, [id]);
    return toRecord(rows[0]) || null;
  },

  async findAll() {
    const { rows } = await pool.query(`${RECORD_SELECT} ORDER BY r.created_at DESC`);
    return rows.map(toRecord);
  },

  async update(id, updates, actorId) {
    const fields = Object.keys(RECORD_FIELDS).filter((field) => updates[field] !== undefined);
    if (fields.length === 0) return this.findById(id);
    const setClause = fields.map((field, i) => `${RECORD_FIELDS[field]} = $${i + 1}`).join(', ');
    const { rowCount } = await pool.query(
      `UPDATE form_records SET ${setClause}, updated_by = $${fields.length + 1}, updated_at = now()
        WHERE id = $${fields.length + 2}`,
      [...fields.map((field) => updates[field]), actorId, id],
    );
    return rowCount > 0 ? this.findById(id) : null;
  },

  async setArchived(id, archived, actorId) {
    const { rowCount } = await pool.query(
      'UPDATE form_records SET archived_at = $1, updated_by = $2, updated_at = now() WHERE id = $3',
      [archived ? new Date() : null, actorId, id],
    );
    return rowCount > 0 ? this.findById(id) : null;
  },

  async remove(id) {
    const { rowCount } = await pool.query('DELETE FROM form_records WHERE id = $1', [id]);
    return rowCount > 0;
  },
};

const RATE_LIMIT_RETENTION_MS = 24 * 60 * 60 * 1000;

export const rateLimits = {
  // Counts one hit for key in a fixed window of windowMs. Returns the hits so far and when the window resets.
  async hit(key, windowMs) {
    const now = new Date();
    const windowCutoff = new Date(now.getTime() - windowMs);
    const { rows } = await pool.query(
      `INSERT INTO rate_limits (key, window_start, hits) VALUES ($1, $2, 1)
       ON CONFLICT (key) DO UPDATE SET
         hits = CASE WHEN rate_limits.window_start <= $3 THEN 1 ELSE rate_limits.hits + 1 END,
         window_start = CASE WHEN rate_limits.window_start <= $3 THEN $2 ELSE rate_limits.window_start END
       RETURNING hits, window_start`,
      [key, now, windowCutoff],
    );
    // Now and then, drop counters nobody has used for a day so the table stays small.
    if (Math.random() < 0.01) {
      await pool.query('DELETE FROM rate_limits WHERE window_start < $1', [
        new Date(now.getTime() - RATE_LIMIT_RETENTION_MS),
      ]);
    }
    return { hits: Number(rows[0].hits), resetAt: new Date(rows[0].window_start).getTime() + windowMs };
  },
};
