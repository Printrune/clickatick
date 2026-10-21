# Connected private image upload over OIDC — proposed

Date: 2026-10-22. Brief read: `brief/project.json` v108. Owner wants published listings live; payments alone stay simulated. This contract is prospective and requires Frontend and Backend acceptance before implementation.

Later storage-isolation decision: `MEDIA_BLOB_STORE_ID` must identify a separate private store from legacy `BLOB_STORE_ID`. All server image operations pass that explicit store ID under OIDC. A legacy read-write token is disallowed for this path. See `backend/live-media-store-isolation-v1.md`. This does not change the browser request or response contract.

## Why this path

The connected Vercel private Blob store exposes `BLOB_STORE_ID` and short-lived OIDC credentials. Installed `@vercel/blob` server operations accept this automatically. Installed `@vercel/blob/client` token generation explicitly requires `BLOB_READ_WRITE_TOKEN`; its direct browser upload cannot use OIDC alone. Keep videos disabled. Add a bounded, server-mediated image transfer that uses the existing v6 reservation, normalization, quota ledger, and recovery logic.

## Request and response

New authenticated `POST /api/v1/organizers/{organizerId}/assets/{assetId}/server-upload` accepts one raw image body, not multipart. Required headers: `Content-Type` matching the image upload intent (`image/jpeg`, `image/png`, or `image/webp`), `X-Upload-Id` equal to the UUID from intent creation, and same-origin browser request. Browsers may omit `Content-Length`; when present, it must be between 1 and 4,000,000 bytes. A streaming read always enforces the 4,000,000-byte ceiling and exact reserved size. Reject mismatch or oversize with 400/413. The authenticated active brand owner and the intent's original Clerk subject must match. Server verifies the reserved asset is an image, pending, unexpired, matches upload ID and MIME, and declared source size equals received bytes. Unknown or foreign asset returns 404.

Success responds `200 {data:{asset:MediaAssetSummary},error:null}` only when image processing completes and the asset is ready. Same-request retries with the same upload ID return ready asset when processing already completed; while in progress return 409 `UPLOAD_IN_PROGRESS`. Existing v6 error envelope, quota, retry and recovery codes apply. No Blob token, OIDC credential or private path is returned.

Backend writes bytes to the reserved private source path with server `put(...,{access:'private',contentType,addRandomSuffix:false,allowOverwrite:false})`, then invokes the existing `processCompletedImage` pipeline. That pipeline verifies source size/type, normalizes image, tracks private Blob usage, and cleans the source. Failed or uncertain writes leave the existing reservation for recovery; never mark an asset ready without Blob and ledger verification. This route is enabled only after `MEDIA_V6_CONNECTED_VERIFIED`, `MEDIA_ALL_WRITERS_COORDINATED`, `MEDIA_V6_IMAGE_UPLOAD_ENABLED`, the configured store ID, and a fresh reconciled usage ledger. OIDC or read-write token must actually authenticate the Blob operation; a store ID alone does not prove access.

Frontend creates an existing v6 image upload intent, then posts its original `File` to `server-upload` instead of calling `@vercel/blob/client.upload` for images. Show a 4 MB file limit. Keep the v6 status/poll endpoint for interrupted requests. The `handleUploadUrl` field remains in the existing intent response for compatibility and video; no existing response key is removed. Do not route video through this endpoint. Organizer UI must use the v6 asset preview/status path. Direct client video remains disabled unless separately connected.

## Verification

Backend tests: owner, editor, foreign brand, expired reservation, wrong upload ID, wrong MIME, length mismatch, stream overrun, storage failure, same-key ready replay, and successful v6 ready ledger transition. Frontend tests: file limit and route selection for image versus video. Connected Preview check: owner uploads a real image to the private store, attaches it to a draft, publishes, and public image fetch succeeds. Production gate remains closed until its own connected check.

Status: awaiting Frontend and Backend acceptance through PM. No runtime code may implement this contract before agreement.
