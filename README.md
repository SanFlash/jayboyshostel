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

Vercel confirms Node 24 is available for builds and functions, and its Node 20 deprecation notice recommends upgrading projects to `24.x`.

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

Run these migrations in Supabase SQL Editor, in order:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_site_content.sql`
3. `supabase/migrations/003_operations.sql`

Migration 003 adds the operational modules used by the admin console: visitors, maintenance, inventory, expenses, attendance, staff tasks and resident leave requests.

After migrations are applied, sign in as the super administrator and use **Initialize workspace** on the admin dashboard. It safely creates the initial Jay Boys Hostel structure (hostel, building, floor, sample rooms/beds, pricing and document types) without deleting existing records.

The admin console uses server-side service-role access for its operational CRUD API. The service-role key must never be exposed to browser code.

## Fixed administrator login

The staff login is configured for the Jay Boys Hostel administrator:

```text
Email: jayboys@gmail.com
```

Set the password as the server-only environment variable:

```text
ADMIN_EMAIL=jayboys@gmail.com
ADMIN_PASSWORD=SET_A_NEW_SERVER_ONLY_PASSWORD
```

Do **not** commit `ADMIN_PASSWORD` to GitHub. On the first valid staff login with that configured email/password, `/api/admin/bootstrap` creates or repairs the Supabase Auth user and best-effort profile/role records, then issues the signed admin session. A missing role migration no longer blocks a valid configured administrator from entering the console.

If the deployed application still reports invalid credentials, verify `ADMIN_PASSWORD` is present in the deployed service environment variables and redeploy.
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

## Admin console — V4

The admin console is now an operations workspace rather than a generic JSON dashboard. The V4 framework adds a command-center layout, live analytics, a shared operations calendar, a production health center, safer bootstrap behavior, guided CRUD forms, related-record selectors and mobile-first layouts.

Available areas include:

- Website content
- Residents and guardians
- Admissions
- Documents
- Stay and room allocation
- Leave requests
- Rooms and beds
- Visitors
- Maintenance
- Inventory
- Invoices and invoice items
- Payments and expenses
- Complaints
- Announcements and notifications
- Attendance
- Staff tasks
- Hostel/building/floor/pricing setup
- Roles, profiles, settings, feature flags and audit log

Each module supports database-backed list/search/create/update/delete operations. Related records use selectors instead of requiring users to type foreign-key UUIDs manually.

Additional admin pages:

- `/admin/analytics` — live operational metrics
- `/admin/calendar` — leave, visitors, tasks and maintenance timeline
- `/admin/health` — environment + required-table diagnostics

If the health page reports missing tables, apply migrations 001 → 002 → 003 and run the check again.

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

## CI quality gate

GitHub Actions now runs both TypeScript validation and the production build on every push/PR. The workflow intentionally uses `npm install` because this repository does not rely on a committed lockfile.

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

## Production Demo Dataset

The project includes an editable production-style demo dataset in:

`supabase/migrations/005_demo_data.sql`

It seeds a realistic Jay Boys Hostel workspace with:

- 3 buildings / wings
- 5 floors
- 30 rooms across multiple room types
- Beds with mixed occupancy
- 18 resident/student records
- Parent/guardian records
- Admission applications in multiple workflow states
- Government-ID verification examples
- Active tenancies
- Pricing plans
- Monthly invoices and sample payments
- Announcements
- Complaints
- Visitor logs
- Maintenance requests
- Inventory and reorder levels
- Expenses
- Attendance
- Staff tasks
- Leave requests
- Public site demo content

All demo records use recognizable `JBY-DEMO-`, `APP-DEMO-`, `INV-DEMO-` and `PAY-DEMO-` identifiers where applicable, so administrators can identify, edit or delete them from the Admin Console.

### Load the demo data

After applying migrations `001` through `004`, run:

`005_demo_data.sql`

in the Supabase SQL Editor.

The seed is designed to be safe to re-run for the demo identifiers and does not create fake authentication accounts. Admin users remain controlled by the existing authentication/bootstrap flow.

**Important:** Demo government-ID values are synthetic/masked examples. Do not place real Aadhaar numbers or real identity documents into the demo dataset.


## Owner-provided room inventory

Migration **007_real_room_configuration.sql** is the authoritative room configuration supplied by the hostel owner. It normalizes Jay Boys Hostel to **one building**, five floors (Floor 0 through Floor 4), **14 rooms and 31 beds**, and uses the supplied monthly room costs:

| Floor | Room | Sharing | Monthly cost |
|---|---|---:|---:|
| 0 | 0-1 | 4 | ₹5,000 |
| 1 | F1-0 | 2 | ₹7,500 |
| 1 | F1-1 | 1 | ₹8,500 |
| 1 | F1-2 | 2 | ₹7,500 |
| 1 | F1-3 | 3 | ₹7,000 |
| 2 | F2-4 | 2 | ₹7,500 |
| 2 | F2-5 | 1 | ₹8,500 |
| 2 | F2-6 | 2 | ₹7,500 |
| 2 | F2-7 | 3 | ₹7,000 |
| 3 | F3-8 | 2 | ₹7,500 |
| 3 | F3-9 | 1 | ₹8,500 |
| 3 | F3-10 | 2 | ₹7,500 |
| 3 | F3-11 | 3 | ₹7,000 |
| 4 | F4-12 | 3 | ₹7,000 |

No daily rate or security deposit is invented because those values were not present in the supplied sheet. Apply migrations in order through **007**. Migration 007 removes synthetic demo residents/operational records, but it stops rather than deleting data if real active room allocations, room-linked complaints, or room-linked maintenance records already exist.

The primary admin navigation is intentionally reduced to: **Overview, Floor Occupancy, Residents, Admissions, Billing, Complaints, Website, Settings**. Lower-level tables remain available to the backend for future expansion but are no longer presented as separate primary modules.
