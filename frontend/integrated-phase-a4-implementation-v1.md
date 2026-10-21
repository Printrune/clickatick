# Frontend A4 implementation v1

Date: 2026-10-21. Built against `contract/integrated-phase-a4-v2.md` and the Frontend agreement. Work began with brief v98; the shared brief advanced to v102 during implementation. The newer decisions keep the public buyer flow demo-only and preserve shareable no-PII confirmations through cancellation.

## Delivered

- Added owner review/publish control to the saved draft editor. It blocks a publish click while local form changes are unsaved, maps server field errors, reuses the idempotency key after an uncertain result, and opens the owner public-event page after success.
- Added the owner published-event page with public link and owner-only cancellation control. Editors/viewers can inspect the page without seeing a cancel action. Cancellation does not promise an email or refund.
- Added `/events/[id]` public detail with an event image fallback, venue map link, restrictions, disclaimer, refund policy, occurrence choice, ticket quantities, mixed general-admission and numbered-seat choice, and explicit configured-capacity language. Seat selection is section-scoped, paged, keyboard-operable, and accessible seats have no eligibility gate. Selected seats can be removed after changing sections. Duplicate seats across tiers are disabled client-side; the server remains authoritative.
- Added `/events/[id]/demo-checkout` with quote reload and expired/cancelled/stale recovery, illustrative subtotal, and $0 charged. Added `/demo/receipts/[id]` with no-payment, no-reservation, no-admission wording and cancellation status.
- Added a separate new-demo catalog component to `/` and `/discover` behind `NEXT_PUBLIC_NEON_DEMO_CATALOG_ENABLED=false`. Legacy Blob listings, counts, search and URLs remain separate. The new collection displays an honest unavailable state on API failure.

## Verification

- `node scripts/configure.mjs --check`: passed, brief contract valid.
- Final `next build` (Turbopack, elevated for Windows junction creation): passed; new UI and A4 API routes compiled.
- Full `node --test tests/*.test.mjs`: returned exit 1 after many passing tests with a PGlite stack in truncated output. Backend reported focused A2 tests and A4 migration passing; the full-suite failure has not been isolated or claimed resolved here.
- No browser journey or connected Clerk/Neon/Blob test was performed. No deployment was made.

## Limits and next verification

The live A4 quote/checkout route currently returns 503 while anonymous abuse limits remain unresolved. Required publication photos depend on the A3 media gate and available Blob space. The new catalog flag must remain off until an authenticated draft can publish and the catalog, detail, seats, quote, checkout, receipt, cancellation, keyboard and mobile flow pass against connected services. Payment, seat holds, ticket issuance, referral payout and admission remain absent. Brief v102 resolves receipt retention: demo confirmations remain shareable until event deletion; no event-deletion feature is part of A4.
