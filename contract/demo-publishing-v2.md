# Anonymous public demo publishing v2 — OIDC readiness correction

Brief: brief/project.json v62.2026-10-18. PM approved this configuration-only correction before code. Public API, immutable storage, quotas and validation remain contract/demo-publishing-v1.md unchanged.

## Root cause and correction

The first hosted publish returned503 before any Blob write because readiness required VERCEL_OIDC_TOKEN in process.env. The installed @vercel/oidc3.8.10 getVercelOidcTokenSync implementation first reads request-context x-vercel-oidc-token and only then falls back to the environment. @vercel/blob uses that SDK authentication path automatically. A connected BLOB_STORE_ID can therefore be usable even when the request token is absent from process.env.

Make demoStorageConfigured configuration-only: true for a nonempty BLOB_READ_WRITE_TOKEN or a nonempty BLOB_STORE_ID. DEMO_PUBLISHING_ENABLED still gates writes. Do not read, print, manually obtain or forward a token. The actual SDK operation remains the authority on authentication and service success; absent/invalid runtime credentials produce the existing fixed safe503 without fake persistence.

Tests must show store-ID-only configuration enables an attempted SDK operation, SDK auth failure becomes safe503 with no successful record, missing store/token remains unconfigured and all previous immutable/idempotent/quota protections remain. PM redeploys and retries the same persisted intent; no paid call or live storage write by specialist.
