# Connected preview handoff v1

Date: 2026-10-21. Product Manager. Brief: `brief/project.json` v107. Owner approved a fresh Neon database, Clerk free-plan Google and email sign-in, and a zero-charge demo checkout. This handoff records connected evidence; it does not approve the integrated production cutover.

## Verified

- Vercel project `clickatick` has `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `CLERK_SECRET_KEY`, and `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` connected for Preview and Production. Secret values were not read or printed.
- A branch-scoped Preview variable `CLICKATICK_APPLY_FRESH_SCHEMA=true` activated the reviewed migration wrapper for one Git build. Build `dpl_AbqLHKc4Du4AHFYXrDe39tvxaytE` logged an empty public schema, applied migrations 001–007, recorded `appliedCount:7`, compiled, and completed READY.
- The one-time Preview variable was immediately changed to `false` and read back as false. It was never configured for Production.
- The deployed `/api/v1/events` returned `{"data":{"events":[],"nextCursor":null},"error":null}` in the browser. This is a real read through the connected Neon app path and confirms the migrated public catalog can be queried, though no new event exists yet.
- The preceding fresh Preview showed a Clerk development sign-in screen with Google and email options, and anonymous `/api/v1/me` returned `SIGN_IN_REQUIRED`. A real signed-in owner session is still pending.

## Still required before cutover

1. Owner signs in on the same Preview deployment. Verify brand creation, draft import, owner review, publication and public catalog read-back against Neon.
2. Verify new zero-charge quote and receipt with one numbered seat and one general-admission ticket. Verify private media and staff separately before their gates are enabled.
3. Configure and verify Clerk production domain/OAuth before production organizer login is claimed. Preview uses Clerk development mode.
4. Keep the old Blob listing URLs reachable but hide them from marketplace discovery only after the new marketplace has a published Neon event.
5. Real payment, admission tickets, digital delivery and referral payouts remain outside the demo and require their own connected providers and checks.

The public production URL still serves the earlier creator-first site. No production alias was moved in this pass.
