# Preview build migration review v1

Date: 2026-10-21. Brief: `brief/project.json` v107. Scope: `scripts/conditional-neon-migrate.mjs`, `package.json` build command, and the reviewed `backend/migrate-neon.mjs`. The owner approved a fresh Neon database and migrations 001–007. This is a source review, not a hosted run.

The wrapper is fail closed for ordinary builds: it exits without database access unless `CLICKATICK_APPLY_FRESH_SCHEMA` is exactly `true`. With that flag, it requires `VERCEL_ENV=preview` and `DATABASE_URL_UNPOOLED`, runs a read-only inspection, permits only an empty public schema or a complete seven-row ledger, then calls the hash-checking migration runner. Both child calls receive the URL on standard input, not a command argument or printed output. A failed inspection, migration, or child exit fails the build before `next build`. The no-flag command path passed locally.

The migration runner uses a session advisory lock and commits each migration with its ledger row, so two concurrent preview builds converge if they target the same fresh database. The wrapper's inspection happens before the lock, but the runner rechecks hashes and applies only missing files while holding the lock. A partial sequence from a failed build is deliberately rejected by the wrapper on retry; a human must inspect and resume with the lower-level runner. That is a safe failure, not automatic recovery.

## Conditions before setting the preview flag

1. Confirm that preview `DATABASE_URL_UNPOOLED` points to the owner-approved **new** Neon database. `VERCEL_ENV=preview` does not prove database isolation; a preview and production deployment may share the same Neon environment value. The wrapper can mutate the production database if both point to it.
2. Confirm the Vercel build uses Node 22 or newer, ideally Node 24. `package.json` currently permits Node 20.9, but the installed Neon `Pool` needs a WebSocket constructor on Node 21 and earlier. The wrapper does not configure one. A Node 20 build would fail before migration, leaving the database unchanged.
3. Enable the flag only for the intended preview deployment, verify the output says seven migrations applied, then remove the flag. The build hook runs on every flagged preview build, including unrelated branches.
4. Inspect the database after deployment: seven ledger rows and expected organizer, media, public event, version, and demo tables. Verify the public API stays behind its activation gates until Clerk and Blob checks pass.

No implementation edit was made. The high-impact risk is targeting an unintended shared database, not an observed code execution bug. The parent Product Manager must verify target identity before hosted use.
