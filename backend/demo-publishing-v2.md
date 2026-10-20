# Anonymous public demo publishing — Backend v2

Brief: brief/project.json v62.2026-10-18. Contract: contract/demo-publishing-v2.md, written before code under PM's advance approval.

Hosted verification returned503 before a write: the capability check required process.env.VERCEL_OIDC_TOKEN, but the installed OIDC SDK can obtain its token from request context. That configuration gate prevented the real SDK from attempting its documented authentication path.

Changed demoStorageConfigured to accept a nonempty BLOB_STORE_ID or BLOB_READ_WRITE_TOKEN. DEMO_PUBLISHING_ENABLED still gates mutation. The SDK still owns authentication; no token is manually read, obtained, forwarded or logged. SDK failure remains fixed safe503, and no fake storage success is returned.

Files: lib/demo-blob-store.mjs; tests/demo-publishing.test.mjs. Added store-ID-only readiness and attempted-SDK-auth-failure regression, proving one read attempt, no write and no leaked provider detail. Existing immutable records/quotas/idempotency/API unchanged.

Ran demo/listing/setup focused tests:42 passed,0 failed (16demo tests). No live Blob call or paid request by specialist. PM owns redeployment and retry of the same persisted publish intent. This correction establishes configuration readiness only; actual live persistence still needs verification.
