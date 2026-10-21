# Eight-migration connected preview v1

Date: 2026-10-22. Product Manager. Brief: `brief/project.json` v107. This adds connected evidence to handoffs 019 and 020; it does not authorize production cutover.

Vercel Preview deployment `dpl_4qGQ2F22YU7Z7sH6JXew3yar87Ru` built commit `3e7ea2a` from `feature/integrated-ticketing-foundation` and reached READY. Its build log verified migrations 001–007 against the existing Neon ledger, applied `008_integrated_promotions_referrals.sql`, and reported `{"mode":"apply","appliedCount":8}`. The one-time branch-scoped Preview variable `CLICKATICK_APPLY_FRESH_SCHEMA` was changed back to `false` and read back as false. It was never applied to Production.

The deployment's anonymous `/api/v1/events` returned an empty successful catalog from the connected database. Anonymous `/dashboard` showed the sign-in requirement, and a disabled private promotions route returned `PROMOTIONS_UNAVAILABLE`. The homepage still displays legacy Blob demos because marketplace cutover remains off. Clerk Google/email sign-in is visible on the prior migrated preview, but no owner session or organizer-owned event was verified. The local full check passed 337 tests and 45 PostgreSQL checks, and the local and Vercel production builds compiled.

Next connected proof: owner sign-in, brand creation, creator draft transfer, required media and map pins, owner publication, public Neon listing, mixed GA/seat demo quote, zero-charge receipt, then separate promotion/referral code activation and invalid-code recovery. Mobile viewport override in the in-app browser did not change the effective 1280px width, so mobile remains unverified.
