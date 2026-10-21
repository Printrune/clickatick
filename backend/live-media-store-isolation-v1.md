# Live-media store isolation

Date: 2026-10-22. Brief read: `brief/project.json` v108. The connected legacy private Blob store already contains 45 objects. Production legacy demo publishing is enabled, so asserting that all writers use the v6 ledger for that store would be false.

Recommendation: provision a **separate private Blob store** for organizer media. Keep the original `BLOB_STORE_ID` bound to legacy demo snapshots and direct links. Set a distinct `MEDIA_BLOB_STORE_ID` for the new store. The new store must be connected to the same Vercel Preview project so OIDC may access it. Do not enable media flags or run reconciliation until the new store is confirmed.

Code now fails closed unless both IDs are present and distinct and no `BLOB_READ_WRITE_TOKEN` is configured. Installed `@vercel/blob` prefers OIDC with an explicit `storeId`; if OIDC were missing, its token fallback could silently target the legacy token's store. Disallowing that token is essential to preserve isolation. Every v6 server `list`, `head`, `get`, `put`, and `del`, plus organizer preview and published-image reads, passes `{storeId: MEDIA_BLOB_STORE_ID}`. Legacy demo storage code remains on the default `BLOB_STORE_ID` so historical shared links are unchanged. Direct browser Blob upload remains disabled; the bounded server image upload uses OIDC.

The one-time Preview reconciliation script now requires distinct store IDs. The on-demand v6 inventory scan is scoped to the media store. The v6 ledger records only that store's objects; legacy Production demo writes no longer invalidate the media ledger. This code has not created or connected a second store, and no Production flag changed. A connected Preview read/write/scan is still required to prove OIDC access to the new store. The first store connection must not replace the legacy `BLOB_STORE_ID` environment binding; otherwise historical direct links could stop resolving.

Targeted isolation tests verify distinct IDs, token rejection, and Preview-only scan gates. Full hosted proof remains outstanding.
