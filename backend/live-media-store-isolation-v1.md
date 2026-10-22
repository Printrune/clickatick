# Live-media store isolation

Date: 2026-10-22. Brief read: `brief/project.json` v108. The connected legacy private Blob store already contains 45 objects. Production legacy demo publishing is enabled, so asserting that all writers use the v6 ledger for that store would be false.

Recommendation: provision a **separate private Blob store** for organizer media. Keep the original `BLOB_STORE_ID` bound to legacy demo snapshots and direct links. Set a distinct `MEDIA_BLOB_STORE_ID` for the new store. The new store must be connected to the same Vercel Preview project so OIDC may access it. Do not enable media flags or run reconciliation until the new store is confirmed.

Code fails closed unless both IDs are present and distinct. When Vercel injects a `BLOB_READ_WRITE_TOKEN`, the token must identify the media store; a token for the legacy store is rejected. The installed `@vercel/blob` prefers OIDC with an explicit `storeId` and falls back to the matching token if OIDC is absent. Every v6 server `list`, `head`, `get`, `put`, and `del`, plus organizer preview and published-image reads, passes `{storeId: MEDIA_BLOB_STORE_ID}`. Legacy demo storage code remains on the default `BLOB_STORE_ID` so historical shared links are unchanged. Direct browser Blob upload remains disabled.

The one-time Preview reconciliation script requires distinct store IDs and a matching fallback token. The on-demand v6 inventory scan is scoped to the media store. The v6 ledger records only that store's objects; legacy Production demo writes no longer invalidate the media ledger. A project-connected private store was created as `clickatick-organizer-media` (`store_z2R3u4hf3W2JXwwI`) after the first team-only store lacked a project connection. Production flags have not changed. A connected Preview read/write/scan is still required. The project connection did not replace the legacy `BLOB_STORE_ID` binding.

Targeted isolation tests verify distinct IDs, rejection of mismatched tokens, and Preview-only scan gates. Full hosted proof remains outstanding.
