# Holy Hill Records

A small records app for Holy Hill church. Members submit their details through a public form, and approved
staff view and manage the records.

- **Frontend** (this folder): React + TypeScript + Vite + Tailwind.
- **API server** (`server/`): Node + Express, using Postgres or a local SQLite file.

You run both: the API on port 3001 and the frontend on port 5173. In development the frontend proxies
`/api` to the API.

## Requirements

- Node.js 22.13 or newer (`node -v`). The SQLite option uses Node's built-in SQLite.
- Postgres, only if you aren't using SQLite.

## Quick start (local, with SQLite)

**1. Set up and start the API server** (first terminal):

```sh
cd server
npm install
cp .env.example .env
```

Edit `server/.env`:

```sh
DATABASE_URL=sqlite:./local.db
JWT_SECRET=<a long random value>
```

To generate a secret, run:

```sh
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Then start the server:

```sh
npm run dev
```

It prints `API listening on http://localhost:3001/api`. The database file and its tables are created
automatically.

**2. Start the frontend** (second terminal, in the project root):

```sh
npm install
npm run dev
```

Open http://localhost:5173.

**3. Make yourself an admin.** Sign up at http://localhost:5173/auth/signup. New accounts start as
*pending*. Then, in the `server/` folder, run:

```sh
npm run promote -- you@example.com
```

Refresh the browser and you'll have full access, including **Manage Users**, where you approve other
sign-ups.

To start over with an empty database, stop the server and delete `server/local.db`.

## Using Neon (hosted Postgres)

The `server/` folder is linked to the Neon project (`server/neon.ts`, `server/.neon`). Running
`neon deploy` in `server/` writes the connection strings into `server/.env`:

- `DATABASE_URL`: the pooled connection, which the app uses.
- `DATABASE_URL_UNPOOLED`: the direct connection, for schema changes.

After a fresh `neon deploy`, change `sslmode=require` to `sslmode=verify-full` in both. This keeps strict
certificate checks and silences a `pg` warning.

Create the tables once, with the direct URL. `sslrootcert=system` tells `psql` to trust the system's
certificates, which `verify-full` needs. The app doesn't need it.

```sh
cd server
psql "$(grep '^DATABASE_URL_UNPOOLED=' .env | cut -d= -f2- | tr -d '"')&sslrootcert=system" -f schema.sql
```

**When the schema changes** (new files in `server/migrations/`), apply them to an existing database with:

```sh
cd server
npm run migrate
```

It uses `DATABASE_URL_UNPOOLED` when set, and is safe to run more than once. SQLite databases upgrade
themselves when the server starts.

**Note:** `server/.env` currently points at the Neon `production` branch, so a local `npm run dev` reads and
writes real data. For local testing, switch `DATABASE_URL` back to `sqlite:./local.db` (your SQLite
settings are saved in `server/.env.backup`).

## Deploying to Netlify

Netlify hosts both parts on one domain. It serves the built frontend from `dist/`, and runs the API as a
single Netlify Function (`server/functions/api.mjs`, which wraps the same Express app as `server/index.js`).
The function claims `/api/*` on the site's own domain, so the login cookie stays first-party and no CORS setup
is needed.

**1. Update the database** if it was created before `migrations/002_rate_limits.sql`:

```sh
cd server
npm run migrate
```

**2. Create the site.** In Netlify, choose **Add new site → Import an existing project** and pick this
repository. The build settings come from `netlify.toml`, so leave them as they are.

**3. Set environment variables** under **Site configuration → Environment variables**. The function reads
them at runtime.

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | Neon's **pooled** connection string (the `-pooler` host), with `sslmode=verify-full` |
| `JWT_SECRET` | A long random value, different from your local one |
| `FRONTEND_URL` | Your site's URL, e.g. `https://holy-hill.netlify.app` |

Leave `VITE_API_URL` unset. The frontend calls `/api` on its own domain. Don't set `NODE_ENV`: the function
sets production mode itself, and on Netlify's free plan the variable would also apply to the build.

**4. Deploy**, then sign in at your site. If you signed up somewhere other than this database, sign up
again and run `npm run promote -- you@example.com` with `server/.env` pointing at the same database.

**Limits to know about:**

- Netlify rejects requests over about 6MB. Photos are shrunk in the browser to 1024px JPEGs before
  upload, and the API accepts pictures up to about 1MB.
- Rate limits (sign-in and sign-up: 20 per 15 minutes; public form: 10 per hour, per IP) are counted in
  the `rate_limits` table, because function instances don't share memory.
- The first request after a quiet spell can take a second or two while the function and Neon wake up.

## Using your own Postgres

```sh
createdb holy_hill_records
psql holy_hill_records -f server/schema.sql
```

(`schema.sql` always has the latest tables. Use `npm run migrate` only to upgrade a database created earlier.)

Then set `DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/holy_hill_records` in `server/.env`.

## What a record holds

**Required** fields are marked ✱. The API enforces the same rules as the form.

| Group | Fields |
| --- | --- |
| Person | First name ✱, last name ✱, other names; date of birth ✱; gender ✱ (male or female); photo |
| Contact | Phone, email, address |
| Emergency contact | Name ✱, phone ✱, relationship |
| Parent or guardian | Name, phone (optional at any age) |
| Church | Ministry, picked from a fixed list |
| Tracking (set by the server) | Who added it (blank for the public form), who last updated it, when it was archived |

**Ministries** come from [shared/ministries.json](shared/ministries.json). Both the form and the API read that file, so
add, rename or remove a ministry there and redeploy. A record whose ministry is no longer on the list keeps it and
can still be edited.

Archived records stay in the database but are hidden from the Records page unless you turn on **Show archived**.

## Pages

| URL | Who | What |
| --- | --- | --- |
| `/collect` | Anyone | Public form for submitting a record |
| `/auth/login`, `/auth/signup` | Anyone | Staff sign in and sign up |
| `/` | Approved users | Records: search, filter by ministry, open a person's details and export CSV. Admins can also edit, archive, restore and delete. |
| `/records/new` | Approved users | Add a record as staff (recorded as added by you) |
| `/records/:id/edit` | Admins and super admins | Edit a record |
| `/users` | Super admins | Approve sign-ups (choosing their role), reject them, change roles and remove access |

The look is set by colour tokens in [src/index.css](src/index.css) (light and dark) and
[tailwind.config.js](tailwind.config.js); shared pieces like buttons, fields and dialogs are in
[src/components/ui.tsx](src/components/ui.tsx).

**Roles**

- **user**: views records.
- **admin**: also edits, archives and deletes records.
- **super_admin**: also manages users.

The API enforces all of these. The UI only hides what you can't use.

## Scripts

| Where | Command | Does |
| --- | --- | --- |
| root | `npm run dev` | Frontend dev server |
| root | `npm run build` | Type-check and build to `dist/` |
| root | `npm run lint` | ESLint |
| `server/` | `npm run dev` | API with auto-restart on file changes |
| `server/` | `npm start` | API without auto-restart |
| `server/` | `npm run promote -- <email>` | Make an account an approved super admin |
| `server/` | `npm run migrate` | Apply `server/migrations/` to a Postgres database |

## Troubleshooting

**Where to look.** The API terminal prints one line per request:

```
POST /api/auth/signin 401 9ms — Incorrect email or password (no account for you@example.com)
POST /api/auth/signin 401 426ms — Incorrect email or password (wrong password)
POST /api/auth/signin 200 444ms
```

In the browser, open dev tools and check the Network tab, filtered to `/api`, to see each request and its
response.

- **Sign-in says "Incorrect email or password".**
  The page shows one message for both causes on purpose. The API terminal says which it was:
  - *No account for …*: sign up first. A new or deleted `local.db` starts with no users, and sign-ups made
    while the server was misconfigured were never saved.
  - *Wrong password*: there's no password reset yet. For local testing, delete `server/local.db` and sign
    up again.

  The "which part was wrong" detail is only logged when `NODE_ENV` is not `production`.
- **The server exits with "DATABASE_URL must start with postgresql:// or sqlite:".**
  The value in `server/.env` is malformed. For local testing, use `DATABASE_URL=sqlite:./local.db`.
- **The server exits with "Missing required env vars" or "JWT_SECRET is still a placeholder".**
  `server/.env` is missing a value, or still has a placeholder. See step 1.
- **`server/.env` changes don't take effect.**
  `npm run dev` only restarts when code changes, not when `.env` changes. Stop it with Ctrl+C and start it
  again.
- **The frontend shows "Unable to reach the server".**
  The API isn't running. Start it with `cd server && npm run dev`.
- **The server prints an "ExperimentalWarning: SQLite" message.**
  It's harmless. To hide it, set `NODE_NO_WARNINGS=1`.
- **Password reset doesn't work.**
  It isn't implemented yet. An admin can help instead.

See [server/README.md](server/README.md) for API details.
