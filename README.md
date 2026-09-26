# Jay Boys Hostel — Hostel Management Platform

A production-oriented hostel management platform for **Jay Boys Hostel, Vinoba Nagar, Indore, Madhya Pradesh**.

The project is built with **Next.js, React, TypeScript, Tailwind CSS and Supabase** and is designed to support public hostel information, resident/member workflows, administration, rooms and beds, admissions, documents, billing, payments, complaints, announcements, notifications, reports, audit logging and PWA capabilities.

> **Deployment status:** The repository is configured for Node.js **20.20.2**. The committed Render Blueprint uses `npm install && npm run build`. If an existing Render service still runs `npm ci && npm run build`, change the Build Command in the Render Dashboard because an existing service can retain its dashboard-level command.

---

## 1. Technology Stack

### Frontend
- Next.js 15
- React 19
- TypeScript
- Tailwind CSS v4
- Framer Motion
- Lucide React
- Recharts

### Backend / Data
- Supabase PostgreSQL
- Supabase Auth
- Supabase Storage
- Row Level Security (RLS)

### Testing
- Vitest
- Playwright

### Deployment
- Vercel
- Render
- Node.js 20.20.2

---

## 2. Repository Structure

```text
jayboyshostel/
├── app/
│   ├── admin/                 # Admin command center
│   ├── apply/                 # Public application flow
│   ├── login/                 # Authentication UI
│   ├── member/                # Resident/member portal
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx               # Public website
│
├── lib/
│   ├── billing.ts             # Billing calculations
│   └── utils.ts
│
├── public/
│   └── manifest.webmanifest   # PWA manifest
│
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   ├── seed.sql
│   └── storage-policies.md
│
├── tests/
│   └── billing.test.ts
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── FEATURES.md
│   ├── RENDER.md
│   ├── SECURITY.md
│   ├── SUPABASE.md
│   └── VERCEL.md
│
├── scripts/
│   └── prepare-build.js
│
├── .env.example
├── .node-version
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── render.yaml
├── tailwind configuration
└── README.md
```

---

# 3. Requirements

Install the following before running locally:

- Node.js **20.20.2**
- npm
- Git
- A Supabase project for database/auth/storage functionality

Verify:

```bash
node --version
npm --version
git --version
```

Expected Node version:

```text
v20.20.2
```

The repository also contains:

```text
.node-version
```

so compatible deployment providers can detect the intended Node runtime.

---

# 4. Clone the Repository

```bash
git clone https://github.com/SanFlash/jayboyshostel.git
cd jayboyshostel
```

Install dependencies:

```bash
npm install
```

> Do **not** run `npm ci` unless a genuine `package-lock.json` is committed to the repository.

---

# 5. Environment Variables

Create:

```text
.env.local
```

Copy the example file:

### Windows PowerShell

```powershell
Copy-Item .env.example .env.local
```

### macOS / Linux

```bash
cp .env.example .env.local
```

Configure the required Supabase values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Security

**Never expose the Supabase service-role key to the browser.**

Never commit:

```text
.env
.env.local
.env.production
.env.*.local
```

The service-role key is intended only for trusted server-side operations.

---

# 6. Supabase Setup

Create a project in Supabase.

Then open:

**Supabase Dashboard → SQL Editor**

Run the migration:

```text
supabase/migrations/001_initial_schema.sql
```

Then optionally run:

```text
supabase/seed.sql
```

The schema covers the foundation for:

- Profiles
- Roles
- Hostels
- Buildings
- Floors
- Rooms
- Beds
- Members
- Guardians
- Applications
- Application status history
- Document types
- Documents
- Tenancies
- Pricing plans
- Invoices
- Invoice items
- Payments
- Announcements
- Notifications
- Complaints
- Complaint comments
- Audit logs
- Settings
- Feature flags

Review:

```text
docs/SUPABASE.md
docs/SECURITY.md
supabase/storage-policies.md
```

before using the system with real resident data.

---

# 7. Run Locally

Start development mode:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Production-style local build:

```bash
npm run build
npm start
```

---

# 8. Validation Commands

Run type checking:

```bash
npm run typecheck
```

Run unit tests:

```bash
npm test
```

Run production build:

```bash
npm run build
```

Run Playwright:

```bash
npm run test:e2e
```

---

# 9. Render Deployment

## Recommended Render configuration

Create a **Web Service** using:

```text
Repository:
https://github.com/SanFlash/jayboyshostel.git

Branch:
main

Runtime:
Node

Node:
20.20.2
```

### Build Command

Use exactly:

```bash
npm install && npm run build
```

### Start Command

Use:

```bash
npm start
```

### Do NOT use this currently

```bash
npm ci && npm run build
```

The current repository does not depend on a committed npm lockfile. `npm ci` requires a valid `package-lock.json` or npm shrinkwrap file.

---

## 9.1 Render Environment Variables

In:

**Render → Service → Environment**

add:

```env
NODE_VERSION=20.20.2
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_URL=https://YOUR-RENDER-DOMAIN.onrender.com
```

Do not put secrets in `render.yaml` as plaintext.

The committed `render.yaml` intentionally uses:

```yaml
sync: false
```

for secret/configuration values.

---

# 10. Important Render Troubleshooting

## Error: npm ci requires package-lock.json

If the log says:

```text
npm error code EUSAGE

The npm ci command can only install with an existing package-lock.json
```

then the Render service is still configured with:

```bash
npm ci && npm run build
```

Change the Render Dashboard Build Command to:

```bash
npm install && npm run build
```

Then select:

**Manual Deploy → Deploy latest commit**

The deployment should show:

```text
Checking out commit <latest-main-commit> in branch main
```

followed by:

```text
Running build command 'npm install && npm run build'...
```

If the log still says:

```text
Running build command 'npm ci && npm run build'...
```

the problem is the Render service configuration, not the GitHub `render.yaml`.

---

# 11. Render Blueprint

The repository contains:

```text
render.yaml
```

Current configuration:

```yaml
services:
  - type: web
    name: jay-boys-hostel
    runtime: node
    plan: free
    buildCommand: npm install && npm run build
    startCommand: npm start
```

The Node runtime is pinned through:

```text
.node-version
package.json engines
render.yaml
```

with:

```text
20.20.2
```

---

# 12. Vercel Deployment

Vercel is recommended for the Next.js application.

Import:

```text
https://github.com/SanFlash/jayboyshostel
```

from:

**Vercel Dashboard → Add New → Project**

Select the `main` branch.

Vercel should detect Next.js automatically.

### Build

Use the default Next.js build configuration.

If a custom command is required:

```bash
npm run build
```

### Start

For Vercel, do **not** normally configure:

```bash
npm start
```

Vercel manages the Next.js deployment runtime.

---

# 13. Vercel Environment Variables

Open:

**Vercel → Project → Settings → Environment Variables**

Add:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_URL=https://YOUR-VERCEL-DOMAIN.vercel.app
```

Apply the variables to:

- Production
- Preview
- Development

as appropriate.

After changing environment variables, create a new deployment.

---

# 14. Custom Domain

After deployment:

### Vercel

Open:

**Project → Settings → Domains**

Add the desired domain and follow the DNS instructions supplied by Vercel.

### Render

Open:

**Service → Settings → Custom Domains**

Add the domain and configure DNS using the values provided by Render.

Do not hard-code a production domain into application code.

---

# 15. Recommended Deployment Flow

Use this workflow for future changes:

```text
Local development
      ↓
npm install
      ↓
npm run typecheck
      ↓
npm test
      ↓
npm run build
      ↓
git add .
      ↓
git commit
      ↓
git push origin main
      ↓
GitHub
      ↓
Vercel / Render deployment
      ↓
Smoke test
```

---

# 16. Git Commands

Check status:

```bash
git status
```

Create a branch:

```bash
git checkout -b feature/my-change
```

Stage:

```bash
git add .
```

Commit:

```bash
git commit -m "feat: describe the change"
```

Push:

```bash
git push origin feature/my-change
```

For the main branch:

```bash
git checkout main
git pull origin main
git push origin main
```

---

# 17. Production Security Checklist

Before accepting real resident information:

- [ ] Supabase RLS enabled
- [ ] Staff roles restricted
- [ ] Admin routes protected
- [ ] Service-role key server-side only
- [ ] Storage policies reviewed
- [ ] Document access restricted
- [ ] Audit logging enabled
- [ ] Payment records protected
- [ ] Application data protected
- [ ] No secrets committed
- [ ] Production environment variables configured
- [ ] HTTPS enabled
- [ ] Authentication flows tested
- [ ] Authorization tested
- [ ] Database backups configured
- [ ] Error handling reviewed
- [ ] Rate limiting considered
- [ ] File upload validation enabled

See:

```text
docs/SECURITY.md
```

---

# 18. Core Functional Areas

The application foundation includes the following product areas:

### Public Website
- Hostel overview
- Facilities
- Room/bed presentation
- Application entry point
- Contact/information sections
- Responsive design

### Member Portal
- Member profile
- Hostel information
- Room/bed information
- Billing information
- Notifications
- Announcements
- Complaint workflows

### Admin
- Dashboard
- Member management
- Application management
- Document verification
- Building/floor/room/bed management
- Tenancy management
- Billing
- Payments
- Announcements
- Notifications
- Complaints
- Reports
- Audit logs
- Settings

### Database
- PostgreSQL through Supabase
- RLS
- Relational data model
- Audit foundation
- Configurable settings

---

# 19. Billing

Billing calculation utilities are located at:

```text
lib/billing.ts
```

Tests:

```text
tests/billing.test.ts
```

Run:

```bash
npm test
```

Billing logic should be treated as server-side business logic before production payment collection.

Do not trust client-submitted totals.

---

# 20. Notifications and Reminders

The production architecture should use protected server-side jobs for reminders.

Examples:

- Upcoming check-in
- Upcoming checkout
- Invoice due
- Payment reminder
- Application status
- Complaint updates
- Announcements

Reminder processing should be **idempotent**, so the same reminder cannot accidentally be sent repeatedly.

See:

```text
docs/RENDER.md
```

for deployment considerations.

---

# 21. Storage and Documents

Resident documents should use private Supabase Storage buckets and authorization policies.

Potential documents include:

- Identity documents
- Address proof
- Admission documents
- Agreements
- Receipts
- Other hostel records

Never make private resident documents publicly readable.

Review:

```text
supabase/storage-policies.md
```

---

# 22. Database Changes

When changing the database:

1. Create a new migration.
2. Do not modify an already-applied production migration destructively.
3. Test the migration in a development Supabase project.
4. Review RLS policies.
5. Test affected workflows.
6. Deploy the migration.
7. Verify production data.

Example:

```text
supabase/migrations/002_add_example_feature.sql
```

---

# 23. PWA

The project includes:

```text
public/manifest.webmanifest
```

The PWA layer is intended to support installable/mobile-friendly usage.

Before production PWA rollout, verify:

- Manifest metadata
- Icons
- HTTPS
- Service-worker strategy
- Offline behavior
- Cache invalidation
- Authentication behavior
- Private data caching rules

Do not cache sensitive resident information in a publicly accessible browser cache.

---

# 24. Responsive Testing

Test at minimum:

### Desktop
- 1920 × 1080
- 1440 × 900
- 1366 × 768

### Tablet
- 1024 × 768
- 820 × 1180

### Mobile
- 430 × 932
- 390 × 844
- 375 × 667

Check:

- Navigation
- Forms
- Tables
- Dashboard cards
- Modals
- Drawers
- Billing screens
- Application flow
- Document upload
- Room/bed views
- Member portal
- Admin portal

---

# 25. Accessibility

Production UI should target WCAG 2.1 AA practices.

Check:

- Keyboard navigation
- Visible focus states
- Color contrast
- Semantic headings
- Labels for inputs
- Accessible buttons
- Dialog focus management
- Screen-reader names
- Error messages
- Reduced motion
- Touch target sizes

---

# 26. Troubleshooting

## Port already in use

Windows:

```powershell
netstat -ano | findstr :3000
```

Then stop the process if necessary.

---

## Node version mismatch

Check:

```bash
node -v
```

Use Node:

```text
20.20.2
```

---

## npm ci failure

If there is no genuine lockfile, use:

```bash
npm install
```

not:

```bash
npm ci
```

---

## Build failure

Run locally:

```bash
npm install
npm run typecheck
npm test
npm run build
```

Fix the first actual compiler error before addressing secondary errors.

---

## Supabase connection failure

Verify:

```env
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

Also verify that the variables are configured in the correct Vercel/Render environment.

---

# 27. Deployment Checklist

## Before deployment

- [ ] Pull latest `main`
- [ ] Install dependencies
- [ ] Typecheck
- [ ] Run unit tests
- [ ] Build locally
- [ ] Check environment variables
- [ ] Review database migrations
- [ ] Review RLS
- [ ] Review Storage policies
- [ ] Check responsive UI
- [ ] Check authentication
- [ ] Check authorization

## Render

- [ ] Branch = `main`
- [ ] Node = 20.20.2
- [ ] Build = `npm install && npm run build`
- [ ] Start = `npm start`
- [ ] Supabase variables configured
- [ ] Manual deploy latest commit

## Vercel

- [ ] Repository connected
- [ ] Framework = Next.js
- [ ] Build = `npm run build`
- [ ] Supabase variables configured
- [ ] Production domain configured
- [ ] Deployment tested

---

# 28. Current Render Issue — Quick Fix

If Render displays:

```text
Running build command 'npm ci && npm run build'...
```

then open:

**Render Dashboard → Jay Boys Hostel → Settings → Build & Deploy**

Change:

```text
npm ci && npm run build
```

to:

```text
npm install && npm run build
```

Save the change and deploy the latest `main` commit.

The repository's `render.yaml` is already configured with:

```yaml
buildCommand: npm install && npm run build
startCommand: npm start
```

If the dashboard continues to show `npm ci`, the existing Render service has retained its dashboard-level build command. Update the service setting or recreate/sync the service from the Blueprint.

---

# 29. Important Production Note

This repository contains the application foundation and deployment configuration, but production readiness requires completing and validating the real Supabase-backed workflows before using the system for actual hostel operations.

In particular, verify that the following are connected to real server-side Supabase operations before production use:

- Authentication
- Registration
- Member records
- Application persistence
- Document uploads
- Admin verification
- Room/bed allocation
- Check-in/check-out
- Invoice generation
- Payment recording
- Reminder processing
- Notifications
- Announcements
- Complaints
- Audit logging
- Reports
- Settings
- Role-based access

Avoid treating illustrative UI values as operational hostel data.

---

# 30. Documentation

Additional technical documentation:

```text
docs/ARCHITECTURE.md
docs/FEATURES.md
docs/SUPABASE.md
docs/SECURITY.md
docs/RENDER.md
docs/VERCEL.md
supabase/storage-policies.md
```

---

# 31. Project Repository

GitHub:

**https://github.com/SanFlash/jayboyshostel**

Default branch:

```text
main
```

---

## License

Private project for Jay Boys Hostel.

```text
Jay Boys Hostel
Vinoba Nagar, Indore, Madhya Pradesh
```
