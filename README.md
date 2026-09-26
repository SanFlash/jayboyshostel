# Jay Boys Hostel — Rebuilt Hostel Management Platform

A rebuilt Next.js + Supabase application for Jay Boys Hostel, Vinoba Nagar, Indore.

## Current deployment fix

The previous Vercel deployment had two independent problems:

1. Node 20 was deprecated for new Vercel builds. The project now targets Node 24.x.
2. Vercel was configured to run `npm start` as its Install Command. That is incorrect and caused `next: command not found` because dependencies had not been installed.

Vercel must use:

- Node.js: `24.x`
- Install Command: `npm install` or automatic
- Build Command: `npm run build`
- Start Command: leave unset for a normal Next.js Vercel deployment

Vercel confirms Node 24 is available for builds and functions, and its Node 20 deprecation notice recommends upgrading projects to `24.x`. citeturn0search1turn0search0

## What was rebuilt

- New responsive public product website
- New authentication screen using Supabase Auth
- Real server-side admission submission API
- Resident dashboard backed by Supabase
- Staff dashboard backed by Supabase
- Admin resource modules for applications, rooms, billing and complaints
- Resident modules for documents and complaints
- Supabase browser/server clients
- Protected server-side staff role checks
- Database-backed metrics instead of fake dashboard numbers
- Health endpoint at `/api/health`
- Node 24 deployment configuration
- TypeScript `@/*` path alias
- New responsive visual system with CSS 3D-style hostel artwork and motion

## Stack

- Next.js 15 App Router
- React 19
- TypeScript
- Tailwind CSS v4
- Framer Motion
- Lucide React
- Supabase Auth
- Supabase PostgreSQL
- Supabase Storage
- PostgreSQL Row Level Security
- Vitest
- Playwright
- Node.js 24.x
- npm 11

## Project structure

```text
app/
  admin/              Staff console + resource modules
  api/                Server endpoints
  apply/              Admission submission
  login/              Supabase authentication
  member/             Resident portal + modules
  globals.css         Product visual system
  page.tsx            Public website
lib/supabase/         Browser/server Supabase clients
supabase/migrations/  PostgreSQL schema and RLS
tests/                Automated tests
docs/                 Deployment/security architecture
render.yaml           Render Node 24 configuration
.node-version         Node 24
```

## Local setup

Install Node 24 and Git.

```bash
git clone https://github.com/SanFlash/jayboyshostel.git
cd jayboyshostel
npm install
```

Create `.env.local` from `.env.example`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=CHANGE_ME
```

Never expose `SUPABASE_SERVICE_ROLE_KEY` to browser code.

Run:

```bash
npm run dev
npm run typecheck
npm test
npm run build
npm start
```

## Supabase setup

Run the migration in:

`supabase/migrations/001_initial_schema.sql`

The schema covers profiles, roles, hostels, buildings, floors, rooms, beds, members, guardians, applications, documents, tenancies, pricing plans, invoices, payments, announcements, notifications, complaints, audit logs, settings and feature flags.

Review the RLS and storage policies before using real resident documents or financial information.

## Authentication

The application uses:

```text
Browser
  ↓
Supabase Auth
  ↓
Session cookies
  ↓
Next.js server components / APIs
  ↓
Supabase PostgreSQL + RLS
```

Browser client: `lib/supabase/browser.ts`

Server client: `lib/supabase/server.ts`

Staff roles are checked before the admin console is rendered.

## Admission flow

`/apply` sends the application to `POST /api/applications`.

The server validates required fields, creates a member record, creates an application record and returns an application code.

Sensitive Supabase operations use the server-only service-role key.

## Resident portal

The member dashboard queries the authenticated user's:

- profile
- member record
- active tenancy
- room
- bed
- rent
- notifications

If records are missing, the UI shows a real setup/empty state instead of fake values.

## Staff console

The admin dashboard queries live Supabase counts for:

- members
- rooms
- available beds
- applications
- complaints

Admin modules are available under:

- `/admin/applications`
- `/admin/rooms`
- `/admin/billing`
- `/admin/complaints`

## Render

`render.yaml` uses Node 24 and:

```bash
npm install && npm run build
npm start
```

Do not change the Render build command to `npm ci` until a genuine matching `package-lock.json` is committed.

## Vercel — exact settings

Open Vercel → Project → Settings → Build and Deployment.

Set:

```text
Node.js Version: 24.x
Install Command: npm install
Build Command: npm run build
```

Do not set:

```text
Install Command: npm start
```

`npm start` is the production server command, not the dependency installation command.

If Vercel still reports Node 20, select 24.x in Project Settings and redeploy.

## Environment variables

Vercel and Render need:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_URL
```

After changing environment variables, redeploy.

## Health check

After deployment open:

```text
https://YOUR-DOMAIN/api/health
```

The endpoint returns the service name, Node version and timestamp.

## Testing

Before every production push:

```bash
npm install
npm run typecheck
npm test
npm run build
```

Then smoke-test:

- `/`
- `/apply`
- `/login`
- `/api/health`
- `/member` after authentication
- `/admin` with a staff account

## Security checklist

- [ ] RLS enabled
- [ ] Staff roles restricted
- [ ] Service-role key server-only
- [ ] Private document storage
- [ ] Authentication tested
- [ ] Authorization tested
- [ ] Financial calculations server-side
- [ ] Upload size/MIME validation added before production document intake
- [ ] API rate limiting added before public-scale deployment
- [ ] Audit logging enabled for staff mutations
- [ ] Database backups configured
- [ ] Production HTTPS enabled

## Important production note

The repository now avoids fake operational metrics, but a deployment is only operational after Supabase is configured and real hostel records are loaded.

Do not interpret an empty dashboard as an error. Zero records means the connected database has no matching records.

## GitHub

https://github.com/SanFlash/jayboyshostel

Default branch: `main`