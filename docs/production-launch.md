# Production launch checklist

## Before deployment
- Confirm Vercel production domain, DNS, TLS, email sender domain, Blob access, and all environment values in the deployment dashboard.
- Rotate `NEXTAUTH_SECRET`, customer-token pepper, database credentials, Blob credentials, error-monitoring DSN, and email credentials; store them only in Vercel/GitHub Secrets.
- Confirm Neon point-in-time recovery and create a timestamped restore branch. Run `SELECT 1` and migration status on that isolated branch before launch; never restore the production branch during a drill.
- Run `npm run db:validate`, `npm run db:generate`, `npm run db:deploy`, and `npm run db:status` in Linux CI only. Review query plans/indexes for customer session, job, analytics, and catalog filters before any large-data launch.

## Release and rollback
- Deploy via Vercel preview, smoke-test `/health/live`, `/health/ready`, public pages, admin login, Doctor/Vision, customer accounts, and analytics.
- If the release is unsafe, promote the previous Vercel deployment, disable Vision/customer/analytics flags as appropriate, pause worker invocations, and preserve logs/audit records.
- For data incidents, open a Neon restore branch at the last known-good point, validate it in isolation, then follow the approved change-control procedure. Do not overwrite production directly.

## Incident response
- Classify incidents: critical (data/security), high (core flow unavailable), normal (degraded noncritical feature).
- Record correlation IDs, impact, mitigation, and follow-up. Never include messages, images, passwords, tokens, cookies, or emails in incident artifacts.
- Escalate database, Blob, Vercel, DNS/TLS, and email-provider failures to their respective provider runbooks.
