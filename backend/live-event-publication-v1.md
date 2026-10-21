# Backend handoff: live event projection

Date: 2026-10-22. Brief version 108. Owner wants live creation and published listings with simulated payment.

Prospective API contract: `contract/live-event-publication-v1.md`. Frontend accepted it before backend changes.

Current defect: `eventSummary` and `eventDetail` in `lib/integrated-phase-a4.mjs` hard-code `demo:true` on a genuinely published Neon listing. Quote, checkout, receipt, and seat-choice semantics remain simulated. Those should keep their explicit demo state. The contract removes only the event-level label and keeps checkout capabilities truthful.

Implementation: removed `demo:true` from `eventSummary` and `eventDetail` in `lib/integrated-phase-a4.mjs`. Added direct assertions in `tests/integrated-phase-a4.test.mjs` that both projections omit `demo` while detail retains `paymentConnected:false`, `seatSelectionReserves:false`, configured inventory, and disconnected referral payout. Targeted tests passed: 9 of 9, including PGlite publication and zero-charge checkout. Hosted verification must still read both public API projections after a signed-in Preview publication. No payment route or Production deployment changed.

Connected Blob OIDC: `lib/private-blob-credentials.mjs` recognizes connected `BLOB_STORE_ID` or legacy read-write token for server operations. `lib/integrated-phase-a4-runtime.mjs` now allows server publishing and private public-image reads with the connected store; the SDK must still authenticate the actual request. `lib/integrated-phase-a3-media.mjs` image preview accepts the same. The direct browser client upload remains token-only and cannot use OIDC.

After Frontend accepted `contract/oidc-image-upload-v1.md`, Backend added a bounded 4 MB `server-upload` route for images. It verifies Clerk owner and intent subject, upload ID, MIME, size, origin, reservation, and quota gates. It writes to private Blob with server OIDC, runs the existing normalization and ledger pipeline, and returns a ready asset. `tests/private-image-upload.test.mjs` covers boundary validation; `tests/private-blob-credentials.test.mjs` covers configuration. A connected Blob/Neon upload has not yet been exercised. The old direct client upload still requires a read-write token; video remains gated.

Other backend blockers are recorded in `backend/live-platform-readiness-v1.md`: connected private media, publish journey, and Production database verification.
