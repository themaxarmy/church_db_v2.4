-- Adds contact, guardian, emergency contact, ministry and tracking columns to form_records.
-- Safe to run more than once. Apply with: npm run migrate
ALTER TABLE form_records
  ADD COLUMN IF NOT EXISTS gender        text CHECK (gender IN ('male', 'female')),
  ADD COLUMN IF NOT EXISTS phone         text,
  ADD COLUMN IF NOT EXISTS email         text,
  ADD COLUMN IF NOT EXISTS address       text,
  ADD COLUMN IF NOT EXISTS ministry      text,
  ADD COLUMN IF NOT EXISTS guardian_name                  text,
  ADD COLUMN IF NOT EXISTS guardian_phone                 text,
  ADD COLUMN IF NOT EXISTS emergency_contact_name         text,
  ADD COLUMN IF NOT EXISTS emergency_contact_phone        text,
  ADD COLUMN IF NOT EXISTS emergency_contact_relationship text,
  ADD COLUMN IF NOT EXISTS archived_at   timestamptz,
  ADD COLUMN IF NOT EXISTS submitted_by  uuid REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by    uuid REFERENCES users(id) ON DELETE SET NULL;
