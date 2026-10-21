# Backend ticketing audit v1

Date: 2026-10-21. Brief: `brief/project.json` v107. Role: `team/roles/backend.md`. Read `team/shared-rules-v1.md`, `AGENTS.md`, and the local `brief-to-site`, `signup`, `cro`, and `workshop-owner-language` skills. This is a source and local database audit, not a claim that hosted services work.

## Decisions checked

The owner chose a new Neon database, Clerk Google and email sign-in, owner approval of staff publishing, numbered and general-admission seats, a zero-charge demo checkout, stable published URLs, immutable demo confirmations, and a 10% platform fee. Discounts and referrals use the discounted ticket price. Real payment collection, admission issuance, email delivery, and referral payouts are not connected. The previously approved promotional contract v3 has not been implemented.

## What passed locally

- `node --test tests/integrated-phase-a4.test.mjs`: 6 passed, 0 failed. This exercises migration 001–004 plus publish, seat-aware quote, zero-charge confirmation, cancellation, and public projection using PGlite.
- `node --test tests/integrated-phase-a6.test.mjs`: 3 passed, 0 failed. This exercises migration 007, initial-version backfill and dual-write, private revision approval, seat identity stability, and versioned demo paths using PGlite.
- The database queries in `lib/integrated-phase-a1-runtime.mjs`, `lib/integrated-phase-a2-runtime.mjs`, and `lib/integrated-phase-a4-runtime.mjs` use parameters for visitor and organizer input. Private organizer actions check Clerk subject and active membership. Publishing and cancellation check owner role. Demo confirmation remains zero-charge and explicitly invalid for admission.
- Default environment settings keep catalog cutover, demo checkout, staff invitations, media uploads, seat authoring, and published revisions off. The API returns unavailable responses rather than inventing connected behavior.

## Blocking integration gaps

1. **Connected database state is unverified.** The seven committed SQL migrations have local PGlite coverage. This audit did not apply or inspect them in the owner's Neon database. A Vercel environment variable alone does not prove schema readiness. Verify the actual schema and apply migrations in order before any integrated flag is enabled.
2. **Organizer authentication is unverified.** No completed Clerk browser sign-in or owner/staff authorization test is recorded for the hosted app. The private API needs `CLERK_SECRET_KEY` and `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`; absent values produce a 503. Owner invitations and publication cannot be called working until a signed-in browser reaches the connected database.
3. **Checkout remains a demo.** The receipt stores `amountChargedMinor: 0`, `demo: true`, and `admissionValid: false`. No payment provider, sale, reservation, digital delivery, refund, or payout service exists. The owner-approved 10% fee is a calculation in the quote; it is not money collected.
4. **Media needs a connected Blob check.** Local tests cover refs and projections but cannot prove private Blob upload and historical-image retrieval in production. The 1 GB shared store allowance also needs an operational stop before enabling the owner's image/video counts.
5. **Revision-flag rollback is unsafe after an edit.** `lib/integrated-phase-a4-runtime.mjs` selects versioned or legacy A4 child tables by `PUBLISHED_REVISIONS_ENABLED`. Once an approved revision advances `active_version`, switching that flag off can combine the newer event snapshot with old occurrence, tier, seat, and image rows. Keep it on after activation or migrate all readers before any rollback. This is already noted in `backend/integrated-phase-a6-implementation-v1.md`; it remains unresolved.
6. **Promotion and referral features are prospective.** `contract/integrated-promotions-referrals-v3.md` records the discounted-price basis and referral terms, but no migration or endpoint implements those rules. Do not expose a functional referral or discount claim in the marketplace yet.

## Code risks before broad use

- The default demo throttles are shared across all visitors: 1,000 quotes/hour and 300 confirmations/day globally, plus 240 quotes/hour and 80 confirmations/day per event. They may block legitimate traffic for a real platform and can be exhausted by one abusive source. They are suitable only for a bounded demo. Revisit limits and per-client abuse controls before public scale.
- The 10,000-seat revision approval path writes one row per seat. Benchmark it against connected Neon before enabling large maps.
- Earlier demo receipts deliberately lack the new immutable event snapshot and show a history notice. Historical images can still return 503 if Blob bytes are unavailable even when SQL metadata says ready; the frontend needs its existing image-load fallback.

## Change made

No backend interface or implementation was changed. The checks found activation and connected-service gaps, not a safe isolated code correction. Changing an API response or gate without a prospective Frontend agreement would violate the project workflow. The PM can sequence connected migration, Clerk, Blob, browser/API checks, and flag activation, then commission a new versioned contract for any interface changes.
