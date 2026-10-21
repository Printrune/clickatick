# Backend catalog slice v1

Date: 2026-10-20. Brief v84; agreed contract `contract/api-v3.md` and PM agreement `handoffs/001-pm-api-v3-agreement.md`.

Implemented `readDemoCatalog()` in `lib/demo-service.mjs`. It reads exactly the 20 existing private Blob quota slots, validates each occupied claim, skips empty slots and valid reservations with no completed listing, checks the listing digest against the claim, and fails the whole read for malformed or unavailable storage. It emits only the contract's ten public card fields, without the draft, artwork, capability or buyer data. Results sort newest first and then by ID. No new service, route or write behavior was introduced.

Verification: `node --test tests/demo-catalog.test.mjs tests/demo-publishing.test.mjs` — 23 passed, 0 failed. New tests cover empty/unconfigured, public projection and sorting, orphan claims, malformed/digest mismatch/invalid listings, and storage failure. Existing demo publish/checkout tests passed unchanged. This is local fixture evidence; production Blob access and frontend behavior remain to be checked by PM after integration. No deployment was performed.
