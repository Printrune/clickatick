# Preview private Blob reconciliation

Date: 2026-10-22. Brief read: `brief/project.json` v108. This is a backend handoff, not a claim that connected Blob access succeeded.

`scripts/conditional-media-reconcile.mjs` runs only when `CLICKATICK_RECONCILE_MEDIA_STORE=true` during a Vercel **Preview** build. It requires a separate `MEDIA_BLOB_STORE_ID` from the legacy `BLOB_STORE_ID`, no read-write token, a connected database, and `MEDIA_ALL_WRITERS_COORDINATED=true`. It uses the existing complete-store scan and transactional Neon ledger reconciliation. It prints object and byte counts only; credentials and private paths remain out of output. The build fails closed if Preview OIDC, store access, or the ledger is unavailable. The flag remains default-off and is never authorized in Production.

`package.json` calls this script between the existing conditional schema migration and Next build. With the flag off it exits without contacting storage. `tests/conditional-media-reconcile.test.mjs` confirms default-off, Production rejection, and mismatched-store rejection. The targeted media and upload tests passed 10/10.

Vercel build-time OIDC **has not been verified**. Installed `@vercel/blob` uses the OIDC SDK for server operations and can also use a read-write token, but no connected build scan was run in this task. A Preview build with the one-time flag is the proof. If it fails, do not set `MEDIA_V6_CONNECTED_VERIFIED=true` or turn on image upload.

The v6 reservation requires a scan fresher than 60 seconds, so the build result alone cannot sustain live uploads. Authenticated v6 usage now scans the private store when its ledger is stale and image upload is enabled. Image intent reads the fresh usage before reserving. Complete-store object/page bounds and `MEDIA_ALL_WRITERS_COORDINATED` remain enforced. This can be expensive on a growing store and must be observed under real traffic. Outstanding reservations conservatively block reconciliation; the operator recovery path remains necessary for abandoned uploads.

The old `phaseA3.preview` route is a read path and is not disabled by `enabled:false`; that flag gates old writes only. It uses shared asset records and active Clerk membership. It now accepts OIDC-connected Blob configuration. A connected organizer preview still needs browser verification.

Activation sequence: coordinate all store writers, run one-time Preview build scan, inspect count/ledger and confirm no OIDC error, reset build flag, enable Preview media gates, verify authenticated image upload/preview/public image/publish, then consider separate Production verification. No Production flag was changed here.
