-- Rate-limit counters, kept in the database so they work across serverless function instances.
-- Safe to run more than once. Apply with: npm run migrate
CREATE TABLE IF NOT EXISTS rate_limits (
  key          text PRIMARY KEY,
  window_start timestamptz NOT NULL,
  hits         integer NOT NULL
);
