# Holy Hill Records API

Express + PostgreSQL API for the frontend in `../src`. Serves `/api` on port 3001 by default.

The app itself is in `app.js`. `index.js` runs it as a local server, and `functions/api.mjs` runs it as a
Netlify Function (see "Deploying to Netlify" in the main README).

## Setup

```sh
createdb holy_hill_records
psql holy_hill_records -f schema.sql

cp .env.example .env    # set DATABASE_URL and a long random JWT_SECRET
                        # e.g. node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
npm install
npm run dev
```

To upgrade an existing database after a schema change, run `npm run migrate` (applies `migrations/`).

### Local testing with SQLite

No Postgres needed: set `DATABASE_URL=sqlite:./local.db` in `.env` and run `npm run dev`. The file and
its tables (`schema.sqlite.sql`) are created on startup; delete `local.db` to start fresh. Uses Node's
built-in `node:sqlite` (Node 22.13+), which prints an experimental-feature warning. For local testing only.

## First admin

Sign up in the app, then promote your account:

```sh
npm run promote -- you@example.com
```

New sign-ups start as `pending`; a super admin approves them on the Users page. A super admin can also create
accounts there: those are approved immediately with a temporary password, and must change it before using the API.

## Passwords

- `POST /api/auth/change-password` `{ currentPassword, newPassword }`: any signed-in account. Issues a fresh session.
- `POST /api/users` `{ email, role }`: super admins. Returns `{ user, temporaryPassword }`; the password is not stored
  or shown again.
- `POST /api/users/:id/reset-password`: super admins, not for their own account. Returns a new temporary password.

While `must_change_password` is set, every route behind approval returns 403 until the password is changed.
Sessions issued before `password_changed_at` are rejected, so a change or reset signs out other devices.

## Access rules

| Route | Who |
| --- | --- |
| `POST /api/records` | Anyone (public form, rate-limited: 10 per hour per IP) |
| `GET /api/records`, `GET /api/records/:id` | Approved users |
| `PUT`/`DELETE /api/records/:id` | Approved admins and super admins |
| `PATCH /api/records/:id/archive`, `/restore` | Approved admins and super admins |
| `/api/users/*` | Approved super admins |
| `POST /api/auth/change-password` | Any signed-in account |

Sessions are an httpOnly `token` cookie. When an approved staff member submits the form, the record's `submitted_by` is set to them. Edits and
archiving set `updated_by`. The user is reloaded from the database on every request, so approvals, rejections and role changes apply immediately.
