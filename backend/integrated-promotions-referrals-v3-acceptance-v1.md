# Backend acceptance: integrated promotions and referrals v3

Reviewed against `brief/project.json` v107, Backend's v1 review and v2 acceptance, and the current A4/A6 quote boundary. **Backend accepts prospective contract v3 for the zero-charge demo.** No code or service is activated by this acceptance.

V3 retains the resolved money, ownership, schema, idempotency, versioned quote, and immutable receipt rules. It now defines the previously open disabled-code behavior exactly: a nonempty promo/referral code receives the corresponding HTTP 503 capability error while its flag is off; null, missing and blank inputs canonicalize to no code; promo error takes priority if both disabled code types are submitted. Invalid active-code input returns HTTP 422 with `fields[].path` pointing to `promoCode` or `referralCode`, without revealing a foreign brand code. A code that changes after quote issue uses `code_changed` on read and `QUOTE_CHANGED` on checkout. These are implementable without changing the agreed public route shapes.

Implementation and activation remain gated by migration-backed tests, connected Clerk/Neon verification, A6 quote-to-receipt flow, and browser/mobile checks. The demo must never record payment, admission, real redemption, commission liability, or payout.
