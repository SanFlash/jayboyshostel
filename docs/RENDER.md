# Render Deployment Guide — Jay Boys Hostel

## 1. Runtime

Use Node.js **20.20.2**. The version is pinned by `.node-version`, `package.json` and `render.yaml`.

## 2. Service Configuration

Repository: `https://github.com/SanFlash/jayboyshostel.git`

Branch: `main`

Build command:
```bash
npm install && npm run build
```

Start command:
```bash
npm start
```

### Do not use `npm ci` yet

The repository currently does not contain a genuine `package-lock.json`. `npm ci` requires a valid lockfile. If an existing Render service still runs `npm ci`, change the Build Command in **Render → Service → Settings → Build & Deploy** to `npm install && npm run build`.

## 3. Why render.yaml may not change an existing service

`render.yaml` declares the correct command, but an already-created service can retain its dashboard-level Build Command. If the deployment log still says `npm ci`, update the service setting or re-sync/recreate the Blueprint.

## 4. Environment Variables

Configure these in Render:

```env
NODE_VERSION=20.20.2
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_URL=https://YOUR-RENDER-DOMAIN.onrender.com
```

Never commit real credentials. Keep the service-role key server-side.

## 5. Current Build Error — Fixed

The failed build contained this invalid source:

```ts
import Link from "next/link";\nimport type { LucideIcon } from "lucide-react";
```

The correct source is:

```ts
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
```

This fix is committed to GitHub.

## 6. SWC Lockfile Warning

Next.js can report:

```text
Found lockfile missing swc dependencies, run next locally to automatically patch
```

Without a complete npm lockfile, this is a dependency-resolution warning. It is not the same as the source syntax error. The long-term reproducible-build solution is to generate a real lockfile using the supported Node/npm environment, test it, and commit it. Do not hand-write `package-lock.json`.

## 7. npm Vulnerabilities

If Render reports:

```text
9 vulnerabilities (3 moderate, 6 high)
```

that is an npm audit report. It does not automatically mean the build failed.

Do not run `npm audit fix --force` blindly. Instead:

1. Run `npm audit`.
2. Identify direct and transitive affected packages.
3. Review the available fixed versions.
4. Check compatibility with Next.js 15 and React 19.
5. Upgrade intentionally.
6. Run `npm run typecheck`.
7. Run `npm test`.
8. Run `npm run build`.
9. Test the affected application flows.

## 8. Local Verification

Run from the project root:

```bash
node --version
npm install
npm run typecheck
npm test
npm run build
```

Expected Node version:

```text
v20.20.2
```

## 9. Deployment Checklist

- [ ] Node.js 20.20.2
- [ ] Render Build Command is `npm install && npm run build`
- [ ] Start Command is `npm start`
- [ ] Supabase environment variables configured
- [ ] Latest `main` commit deployed
- [ ] Typecheck passes
- [ ] Unit tests pass
- [ ] Production build passes
- [ ] Public pages load
- [ ] Authentication flow tested
- [ ] Member/admin authorization tested
- [ ] Supabase RLS reviewed

## 10. Reminder Jobs

For future automated reminders, use a protected Render Cron Job or another server-side scheduler. Protect scheduled endpoints with a secret, make processing idempotent, and use database deduplication so retries do not send duplicate notifications.

## 11. Troubleshooting

### Render still runs npm ci

Change the dashboard Build Command and redeploy. The next log should contain:

```text
Running build command 'npm install && npm run build'...
```

### TypeScript/SWC compilation error

Fix the first compiler/source error shown in the deployment log. Do not treat the npm vulnerability count as the compiler failure.

### Build succeeds but application crashes

Inspect Render runtime logs, environment variables, Supabase configuration, server/client boundaries, and database/RLS errors.
