-- Temporary passwords for accounts an admin creates or resets, and when each password last changed
-- (sessions issued before that are signed out). Safe to run more than once. Apply with: npm run migrate
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS password_changed_at  timestamptz;
