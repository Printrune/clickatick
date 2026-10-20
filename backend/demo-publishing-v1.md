# Anonymous public demo publishing — Backend v1

Brief: brief/project.json v62.2026-10-18. Contract: contract/demo-publishing-v1.md, read and explicitly approved by PM and Frontend before implementation. Source scope is separate from the completed shared-category correction.

## Implementation

POST /api/demo/listings creates an immutable public demo snapshot with no login. The caller retains a UUID per canonical reviewed content; same-id/same-digest replays return the existing URL, changed content409. Publication validation preserves full venue photos, exact pins, policies, restrictions, referrals and requested payment preferences. It validates completeness and US calendar/timezone/DST rules. A nonempty disclaimer needs organiser review. The existing authenticated/local publication path and its unsupported-extended-setup gate remain unchanged.

POST /api/demo/listings/[id]/checkout validates a selected occurrence and up to10 distinct category rows/20total tickets. It uses the stored listing's category IDs, names, prices and stated inventory limits. Shared10 means10 across all rows, not10 per category. No client-supplied prices or purchaser/payment fields are accepted. A persisted receipt contains public-safe demo metadata, exact server totals and chargedCents0. No real stock is decremented, payment processed, admission issued, confirmation emailed or payout made.

readDemoListing/readDemoReceipt provide server read adapters for public pages. Private storage credentials/URLs and internal digests are not returned as listing props. Receipts are immutable demo confirmations, not tickets valid for entry. The UI-owned local draft is never reset by the API.

## Storage, bounds and recovery

The actual installed @vercel/blob2.8.2 declarations confirm private get/put, useCache and abortSignal options. The wrapper lazily imports the SDK, uses private access, addRandomSuffix:false, allowOverwrite:false, application/json and20second abort deadlines. Read-back uses useCache:false. A failed or unknown-outcome put is reconciled by a bounded read; only verified existing content can become replay success. All SDK failures use fixed safe503 messages.

The namespace clickatick-demo/v1 holds listing UUID snapshots, receipt UUID snapshots and fixed global quota reservations. Canonical validated digests protect replay meaning and are checked on read. No update/delete endpoint or client-controlled storage path exists.

20listing/100receipt hard global slot caps are enforced with create-only writes across instances. Colliding claimants read the winner and probe the next slot; a failed storage read/write stops with503 instead of looping as busy. Retry adopts its own reservation even after every slot fills. A crash can conservatively consume a slot. There is no daily reset, automatic deletion or background routine. A process-local30POST/minute guard is supplemental, not called distributed protection.

Streaming request/storage reads cap listing bodies at2MiB and receipts at16KiB. A body without Content-Length is still bounded before JSON parsing. Strict top-level checkout fields reject PII/card/payment-price additions. Same-origin checks precede mutations. Capability is configured only by DEMO_PUBLISHING_ENABLED plus BLOB_READ_WRITE_TOKEN or BLOB_STORE_ID/VERCEL_OIDC_TOKEN. No disk/RAM production fallback exists. Configuration readiness is not a claim that hosted storage was tested.

## Source ownership

- lib/demo-validation.mjs: shared client/server completeness, occurrence and category projection helpers.
- lib/listing.mjs: extracted listingRequiredErrors; legacy publication gate preserved.
- lib/demo-http.mjs: bounded JSON streams, safe errors, IDs and supplemental rate limit.
- lib/demo-blob-store.mjs: actual private SDK boundary and unknown-outcome read-back.
- lib/demo-service.mjs: immutable snapshots, receipt quote/validation, quota slots and public reads.
- app/api/demo/listings/route.js and app/api/demo/listings/[id]/checkout/route.js: anonymous routes.
- lib/services.js: optional demoPublishing capability; legacy publishing/auth untouched.
- backend/verify-v2.mjs: source-loader import migration.
- tests/demo-publishing.test.mjs: SDK-injected domain/actual-route evidence.

## Verification

15new demo tests passed. Combined demo/listing/setup run41passed,0failed. Legacy backend/verify-v2.mjs passed its activation/session/origin/ownerRPC/storage-rejection rehearsal. All provider and Blob SDK operations in these tests are intercepted; no live Blob operation or paid AI request by this agent.

Tests cover private SDK options/deadlines; immutable same/different content; concurrent same/different IDs;20listing/100receipt quota races; unknown successful write read-back; failed intent reservation adoption after quota fills; venue-photo/pin/policy roundtrip; server-priced shared10 basket; receipt persistence through fresh fixture adapters; no real stock change; no PII/client-price acceptance; canonical receipt digest tampering; body/origin/JSON/unconfigured errors; actual anonymous create/checkout route success and replay; and legacy publication behavior.

A fresh fixture adapter proves application state is read from the injected SDK store instead of service memory. It does not prove live Vercel persistence. PM owns deployed API seeding, real private Blob write/read, public listing/receipt reload, full suite/build and desktop/mobile checks. Frontend owns the reviewed pages and client path. Independent reviewer inspecting final source.

Official docs and package declarations read: https://vercel.com/docs/vercel-blob/using-blob-sdk ; node_modules/@vercel/blob/dist/index.d.ts and package.json(2.8.2). Skills: actual Vercel storage, architect, boundary discipline, root-cause, idempotence, model-domain and proof guidance already loaded for this work. Decisions needed:none within agreed bounded demo scope.
