# Integrated promotions and referrals backend implementation v1

Date: 2026-10-21. Brief: `brief/project.json` v107. Agreed prospective contract: `contract/integrated-promotions-referrals-v3.md`, accepted by Frontend and Backend in their v3 acceptance files. This is a zero-charge demo implementation, not a connected sale, admission ticket, referral earning, or payout. Backend role, shared rules, `AGENTS.md`, and actual local `brief-to-site`, `signup`, `cro`, `workshop-owner-language` and TypeScript discipline skills were read before work.

## Code

- Migration `008_integrated_promotions_referrals.sql` creates one organizer-wide code namespace with database uniqueness across promotions and referrals, exact discount-value checks, event-brand foreign key, version, active state, and optional informational real-redemption cap. No customer identity or payout record is stored. Migration 008 is **not applied** to hosted Neon.
- `lib/integrated-promotions.mjs` implements private list/create/edit/activate/deactivate, owner/editor/viewer permissions, event scope, same-origin bounded JSON, exact idempotency in the write transaction, version conflicts, normalized ASCII codes, and cents/basis-point pricing. `lib/integrated-promotions-http.mjs` adapts these to eight private API route modules. Disabled routes return 503.
- The existing A6 versioned quote path now accepts canonical nullable promo/referral codes, checks feature gates, resolves code terms against server prices and the active published version, freezes `terms` and `pricing`, and calculates the 10% platform fee and referral reward on the discounted subtotal. A4 stays unchanged. Quote reads detect code edits/deactivation/expiry as `code_changed`; a new checkout returns `QUOTE_CHANGED` before expiry checks. Exact-key successful checkout replay still returns its original confirmation. The immutable receipt and event snapshot copy pricing and terms. It explicitly says zero charged, invalid for admission, and payout disconnected.
- `.env.example` keeps `PROMOTIONS_DEMO_ENABLED=false` and `REFERRALS_DEMO_ENABLED=false`. Both require `PUBLISHED_REVISIONS_ENABLED=true` in the server. The migration runner now expects eight files; the preview wrapper accepts a fresh eight-file database, an existing seven-file ledger with only 008 pending, or a complete eight-file ledger. No hosted migration was run.

## Local verification

- `node --test tests/integrated-promotions-referrals.test.mjs`: 3 passed. Checks migration constraints and namespace collision, exact $55.00/20%/10% arithmetic, fixed and full discount math, ASCII normalization, quote/receipt immutable terms, changed-code read and checkout recovery, invalid-code field path, disabled-code 503, and zero-charge flags.
- `node --test tests/integrated-phase-a4.test.mjs tests/integrated-phase-a6.test.mjs tests/integrated-a6-routing.test.mjs`: 11 passed. The dispatcher proof confirms A6 owns versioned writes when enabled, and prior mixed-seat and revision paths still pass.
- All eight new API route modules imported successfully with Node.
- `pnpm build` did not reach source compilation in this Windows sandbox. Turbopack failed to create a `sharp` junction under `.next` with OS error 5. The PM should run build in its permitted environment. This is not evidence of a source failure or a successful build.

## Still needed before any activation

Run migration 008 against the confirmed Neon database and verify its ledger/hash. Test private owner/editor/viewer routes through connected Clerk, same-brand scope, idempotent replay, and code activation. Exercise a browser quote and zero-charge receipt with both flags on in a preview, including mobile field feedback. Keep flags off until those checks pass. The configured maximum real redemptions remains informational in this demo and is never incremented. No real customer referral ownership, payment, refund, email, or payout has been implemented.
