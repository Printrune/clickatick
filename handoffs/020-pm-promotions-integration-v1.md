# Gated promotions integration review v1

Date: 2026-10-21. Product Manager. Brief: `brief/project.json` v107. This review follows the prospective `contract/integrated-promotions-referrals-v3.md` and the Frontend and Backend implementation handoffs. It is local integration evidence, not approval to activate the feature in production.

## Verified locally

- `pnpm run check` passed 337 tests, 45 actual PostgreSQL event-system checks, and the mocked route rehearsal. The new tests cover discounted-cent calculation, the shared promotion/referral code namespace, an A6 quote and zero-charge receipt, changed-code recovery, and disabled-code responses.
- `pnpm run build` completed the optimized Next.js production build and enumerated all eight new private offer routes.
- Migration 008 is additive and uses an organizer-scoped unique code namespace. The migration runner expects eight versioned files; the preview wrapper recognizes a previously applied 001–007 ledger with only 008 pending.
- `PROMOTIONS_DEMO_ENABLED` and `REFERRALS_DEMO_ENABLED` default to false and additionally require `PUBLISHED_REVISIONS_ENABLED=true`. The frontend hides the controls when disabled. No payment, admission ticket, redemption count, earned referral reward, or payout is created.

## Connected release boundary

The preceding Vercel preview applied migrations 001–007 and returned an empty event catalog from Neon. Migration 008 has **not** been applied to hosted Neon. No signed-in organizer browser journey has reached brand creation, event publishing, promotion activation, or the new demo checkout. Clerk preview sign-in shows Google and email in development mode; production OAuth/domain readiness is not verified. Public production still serves the earlier creator-first page. Keep all integrated feature gates off until connected ownership, publishing, seat selection, media, quote-to-receipt, mobile, and access checks pass.

Existing demo checkout on a legacy listing produced a $0 charged receipt and remains a separate verified legacy path. It does not prove the new Neon flow. Real payment coverage, processing-fee allocation, customer-owned referral codes, post-event payout, and digital ticket delivery require further product and provider decisions.
