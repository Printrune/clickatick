# Integrated ticketing A3 private media implementation v1

Date: 2026-10-21. Implemented against `contract/integrated-phase-a3-media-v2.md` and `handoffs/005-pm-phase-a3-media-agreement.md`, brief v97 at assignment. The brief later advanced to v98 for seating policy; that decision does not change A3 media. The proposed media quotas still await owner approval.

## Delivered

- `backend/migrations/003_integrated_phase_a3_media.sql` extends private asset state, adds upload IDs, versions and same-brand reference rows. A trigger synchronizes draft photo/cover references in the same Neon write, locking ready assets. The delete function locks the asset before checking references, preventing a concurrent attach/delete race. The migration backfills any existing A2 references or fails on invalid IDs rather than silently losing them.
- `lib/integrated-phase-a3-media.mjs` validates bounded multipart image input, normalizes JPEG/PNG/WebP to metadata-free WebP, and implements brand-scoped gallery, references, private preview, upload and explicit delete behavior. Previews stream through the authenticated same-origin route with no-store, no-sniff and same-origin headers; no Blob URL is returned.
- `lib/integrated-phase-a3-media-runtime.mjs` supplies Neon and private Vercel Blob adapters. Upload attempts reserve brand quota and idempotency keys in Neon; incomplete attempts remain identifiable. Successful uploaded photos are never age-purged. Failed delete remains visible in `deleting` state, counts against quota and can be retried with the returned version. A2 maps an asset race to `ASSET_NOT_FOUND` rather than a generic storage failure.
- Routes: `GET/POST /api/v1/organizers/{organizerId}/assets`, `GET/DELETE /api/v1/organizers/{organizerId}/assets/{assetId}`, and `GET /api/v1/organizers/{organizerId}/assets/{assetId}/references`. Upload/delete are **hard-disabled in the production service instance** with `enabled:false`; an environment variable cannot turn them on. The Frontend switch also remains off.
- `.env.example` documents the server-only `BLOB_READ_WRITE_TOKEN` without enabling uploads.

## Verification

- `node --test tests/integrated-phase-a3-media.test.mjs`: 8/8 pass. Uses PGlite migrations and injected fake Blob to cover the disabled gate, private reads, upload/replay, explicit delete, retry after provider failure, same-brand references, trigger attachment synchronization, quotas and pending reconciliation.
- Combined A1/A2/A3 focused run before the final reconciliation adjustment: 18/18 passed. A3 rerun after that adjustment: 8/8 passed.
- `pnpm run build`: passed outside the Windows sandbox, which blocks Next's junction creation. It includes all A3 routes.
- No live Clerk, Neon or Blob credentials were used. Migration 003 was not applied to a connected database. No real private upload, preview or deletion was claimed.

## Remaining gate and operational limit

The owner must approve or adjust 100 assets, 100 MiB, 10 uploads/hour and two pending uploads per brand before Backend changes the hard gate. Frontend must keep controls disabled until a connected test verifies private Blob and Neon together. A timed reconciliation job is not installed: an uncertain pending attempt is reconciled on retry after expiry; failed Blob cleanup retains its reservation for a future retry. This preserves any upload whose Neon finalization might already have succeeded. No successful ready asset is deleted automatically.

This phase does not change public listings, payment, tickets or admission. Invited-editor rights await the staff invitation contract; A3 writes remain owner-only.
