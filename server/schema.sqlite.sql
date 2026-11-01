-- SQLite mirror of schema.sql for local testing. Applied automatically on startup.
-- now() and gen_random_uuid() are registered as functions in sqlite.js.

CREATE TABLE IF NOT EXISTS users (
  id            text PRIMARY KEY DEFAULT (gen_random_uuid()),
  email         text UNIQUE NOT NULL COLLATE NOCASE,
  password_hash text NOT NULL,
  status        text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  role          text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
  approved_by   text REFERENCES users(id) ON DELETE SET NULL,
  approved_at   text,
  created_at    text NOT NULL DEFAULT (now()),
  updated_at    text NOT NULL DEFAULT (now())
);

CREATE TABLE IF NOT EXISTS form_records (
  id            text PRIMARY KEY DEFAULT (gen_random_uuid()),
  first_name    text NOT NULL,
  last_name     text NOT NULL,
  other_names   text,
  date_of_birth text NOT NULL,
  picture       text,
  gender        text CHECK (gender IN ('male', 'female')),
  phone         text,
  email         text,
  address       text,
  ministry      text,
  guardian_name                  text,
  guardian_phone                 text,
  emergency_contact_name         text,
  emergency_contact_phone        text,
  emergency_contact_relationship text,
  archived_at   text,
  submitted_by  text REFERENCES users(id) ON DELETE SET NULL,
  updated_by    text REFERENCES users(id) ON DELETE SET NULL,
  created_at    text NOT NULL DEFAULT (now()),
  updated_at    text NOT NULL DEFAULT (now())
);

CREATE INDEX IF NOT EXISTS form_records_created_at_idx ON form_records (created_at DESC);

CREATE TABLE IF NOT EXISTS rate_limits (
  key          text PRIMARY KEY,
  window_start text NOT NULL,
  hits         integer NOT NULL
);
