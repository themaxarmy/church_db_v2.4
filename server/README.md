# Holy Hill Records API

Express + PostgreSQL API for the frontend in `../src`. Serves `/api` on port 3001 by default.

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

New sign-ups start as `pending`; a super admin approves them on the Users page.

## Access rules

| Route | Who |
| --- | --- |
| `POST /api/records` | Anyone (public form, rate-limited) |
| `GET /api/records`, `GET /api/records/:id` | Approved users |
| `PUT`/`DELETE /api/records/:id` | Approved admins and super admins |
| `PATCH /api/records/:id/archive`, `/restore` | Approved admins and super admins |
| `/api/users/*` | Approved super admins |

Sessions are an httpOnly `token` cookie. When an approved staff member submits the form, the record's `submitted_by` is set to them. Edits and
archiving set `updated_by`. The user is reloaded from the database on every request, so approvals, rejections and role changes apply immediately.
