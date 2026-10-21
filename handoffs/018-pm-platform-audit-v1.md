# Platform audit handoff v1

Date: 2026-10-21. Product Manager. Source: `brief/project.json` v107. Specialist evidence: `frontend/integrated-platform-ui-audit-v1.md`, `backend/integrated-ticketing-audit-v1.md`, and `research/platform-qa-audit-v1.md`.

## Verified in this pass

- `pnpm run check` passed outside the restricted Windows filesystem: 332 tests, 45 actual PGlite PostgreSQL checks, and the isolated route rehearsal. The rehearsal initially failed because its data-URL module did not rewrite a newer relative import; `backend/verify-v2.mjs` now rewrites that import. Its network requests are mocked.
- `pnpm run build` passed outside the sandbox with Next.js 16.4.2. The restricted sandbox cannot create the `sharp` junction, so the first build attempt there is not a source failure.
- The public `ticketnest-psi.vercel.app` site still serves the old creator-first page. The ready Git preview serves the newer marketplace page, but `/dashboard` reports organizer tools unavailable. The preview does not have integrated feature gates or a migrated database verified.
- The public legacy Blob listing at `/listing/e0b57ae3-bc9a-4228-8aed-5f09a37fa25e` completed one zero-charge demo checkout in the browser. The saved `/receipt/96e3ac97-38c1-48aa-8d46-25518ffeb1e7` reopened and showed the same event, category, illustrative $10 total, $0 charged, and an explicit invalid-for-admission label. This proves this demo path, not real payment or new Neon checkout.
- The Vercel project is named `clickatick`. `DATABASE_URL` and `DATABASE_URL_UNPOOLED` are connected for Preview and Production. After owner action, `CLERK_SECRET_KEY` and `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` are also present for both. Key presence does not prove sign-in or schema readiness.

## Corrections

- New marketplace and event dates now format in each event's time zone. Cover-image failure uses the decorative fallback, and creator seating guidance reflects the integrated workflow.
- Added a guarded, hash-recorded Neon migration runner, `backend/migrate-neon.mjs`. It accepts a URL on standard input, refuses an existing untracked public schema, and applies migrations 001–007 transactionally. It has not been executed against hosted Neon because the Vercel connector withholds integrated secret values.

## Release blockers

1. Inspect and apply the seven migrations to the fresh Neon database; verify read-back. The Vercel connector lists the integration variables but does not return their secret values, so this pass could not connect directly.
2. Redeploy a Git preview after Clerk's new environment variables, then verify Google/email sign-in with a real owner account. Configure production Google OAuth before declaring that route ready.
3. On that connected preview, complete creator → brand draft → owner approval → public event → seated/general-admission quote → zero-charge confirmation. Verify private media, staff invitation, storefront, cancellation and revision flows separately before enabling their gates.
4. Build promotions and referrals on the canonical new event route under the agreed prospective contract. Real payments, admission tickets, digital delivery and payouts remain unconnected by owner decision.
5. Review mobile and keyboard behavior on a browser with a working narrow viewport override. The IAB override did not change `innerWidth` from 1280 in this pass, so no mobile claim is made.

Do not promote the integrated preview or enable all gates as a single change. Keep legacy direct links working; remove them from discovery only after the Neon catalog passes connected checks.
