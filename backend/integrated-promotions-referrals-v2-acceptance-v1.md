# Backend acceptance: integrated promotions and referrals v2

Reviewed against `brief/project.json` v107, `backend/integrated-promotions-referrals-review-v1.md`, and the current A4/A6 quote and checkout boundary. **Backend agrees to prospective contract v2 for the zero-charge demo.** This is interface agreement, not implementation or service verification.

V2 resolves the five Backend amendments: it selects the repaired A6 versioned write path, freezes code terms and versions in immutable quotes, keeps real-redemption limits informational in the demo, defines private DTOs/replay/errors and buyer quote changes, and requires database-enforced brand scope and a shared case-normalized code namespace. Its rounding and 10% fee apply to the discounted ticket subtotal. The demo receipt remains a no-PII, zero-charge illustration with no admission, redemption, earned commission, or payout.

The A6 dispatcher repair is present in `lib/integrated-phase-a4-runtime.mjs` and targeted tests in `tests/integrated-a6-routing.test.mjs`; this only establishes local routing behavior. Migration, connected Clerk/Neon authorization, browser quote-to-receipt verification, and both promotion flags remain pending.

Implementation detail to settle in code with Frontend: a submitted nonempty promo or referral code while its respective feature flag is off should receive an explicit capability error, never be ignored or treated as a valid discount. This does not change the agreed DTO or require an owner decision.
