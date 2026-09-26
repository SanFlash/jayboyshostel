# Vercel Deployment — Jay Boys Hostel

## Required project settings

Use Node.js `24.x`.

Vercel's current Node 24 runtime is supported for builds/functions. Node 20 is being deprecated for new builds, so this repository now targets Node 24.

Set:

```text
Node.js Version: 24.x
Install Command: npm install
Build Command: npm run build
```

For a normal Next.js deployment, do not configure `npm start` as the Install Command.

## Why the previous deployment failed

The deployment log showed:

```text
Running "install" command: npm start
> next start
sh: line 1: next: command not found
```

`npm start` executes the production server. It does not install dependencies.

Because Vercel executed it during the install phase, the `next` binary was unavailable.

Correct sequence:

```text
npm install
    ↓
npm run build
    ↓
Vercel deploys the Next.js application
```

## Repository configuration

`package.json` now contains:

```json
"engines": {
  "node": "24.x"
}
```

` .node-version` targets Node 24 and `render.yaml` targets Node 24 for Render.

## Environment variables

Configure:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_URL=https://YOUR_PROJECT.vercel.app
```

Never expose `SUPABASE_SERVICE_ROLE_KEY` in client code.

## Deployment checklist

- [ ] Connect `SanFlash/jayboyshostel`
- [ ] Production branch = `main`
- [ ] Node.js = `24.x`
- [ ] Install = `npm install` or automatic
- [ ] Build = `npm run build`
- [ ] Supabase environment variables configured
- [ ] Redeploy latest main commit
- [ ] Open `/api/health`
- [ ] Test `/`
- [ ] Test `/apply`
- [ ] Test `/login`

## If `next: command not found` returns

Check Vercel Project Settings first.

If the log contains:

```text
Running "install" command: npm start
```

the Install Command is still wrong.

Change it to:

```bash
npm install
```

Then redeploy.