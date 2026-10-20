# Demo publishing review v2 — request-context OIDC readiness

Brief: `brief/project.json` v62. Governing addendum: `contract/demo-publishing-v2.md`, PM approved before code. This supplements `backend/demo-publishing-review-v1.md`. Reviewed 2026-10-18.

No remaining blocking source finding in this configuration-only correction. Independently ran `node --test tests/demo-publishing.test.mjs`:16 passed,0 failed. No live service operation was performed by this reviewer.

The earlier readiness guard required BLOB_STORE_ID and VERCEL_OIDC_TOKEN in process.env. That excluded valid request-context authentication. Initial mocked configuration checks did not exercise this deployed credential delivery path; the hosted pre-write503 exposed the gap. PM reports deployment dpl_3rJqzFjg4rjqutGpjmzzSoTv6Krn reached READY but the first seed request stopped before a Blob write. This reviewer did not execute that request.

Inspected the actual installed @vercel/oidc3.8.10 get-vercel-oidc-token-sync.js and get-context.js. The SDK obtains x-vercel-oidc-token from the platform request-context symbol before falling back to the environment variable. Inspected @vercel/blob2.8.2 authentication resolution: it uses the OIDC SDK automatically and pairs the runtime token with BLOB_STORE_ID. The app does not need to obtain, print or forward a token.

`demoStorageConfigured` now returns configuration readiness for a nonempty read/write token or a nonempty store ID. DEMO_PUBLISHING_ENABLED remains mandatory for publishing/checkout. Readiness allows an SDK operation to be attempted; it does not assert that a token exists, authentication succeeds or persistence happened. The SDK remains the authority on the actual operation.

The new regression configures only a store ID and the enable flag, then injects an SDK read that rejects authentication. It proves one SDK read is attempted, no write occurs, and the service returns the existing fixed safe503 without exposing the private error. Existing tests retain the no-configuration gate and immutable write/read-back, idempotency, quota, bounds, pricing and no-charge protections. The test does not mint a real OIDC token or prove real request-context authentication; the installed source establishes that credential-resolution path.

No API shape, quota, storage pathname, public projection, pricing, authentication requirement on the legacy route, or real-payment behavior changes. The prior review's read-only source and security conclusions otherwise remain applicable.

This reviewer wrote only this addendum. No source change, secret read, manual token handling, server, deployment or live storage/paid call. PM must redeploy and retry the already persisted seed intent, inspect actual Blob-backed listing/receipt reads, and verify the browser flow before claiming hosted persistence.
