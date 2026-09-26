# Render Deployment

For a Next.js service:
Build: npm ci && npm run build
Start: npm start
Node: 20+

For automated reminders, use a Render Cron Job or worker. Protect the job with CRON_SECRET, use database dedupe keys, and make execution idempotent. Avoid duplicate web runtimes unless there is a concrete operational reason.
