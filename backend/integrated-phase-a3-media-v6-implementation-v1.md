# A3 media v6 backend implementation v1

Date: 2026-10-21. Source: `brief/project.json` v104, PM handoff 010, agreed `contract/integrated-phase-a3-media-v4.md` plus v5/v6 amendments. **Code is prepared but connected upload, Blob behavior, and public playback are not verified or enabled.** No external Blob object, database, account, deployment, or email was changed.

## Implemented backend slice

Migration `005_integrated_phase_a3_media_v6.sql` applies after A4 migration 004 and before A5 migration 006. It preserves legacy ready images and adds media type/state, direct-upload source metadata, raw cleanup state, shared-store usage/inventory and reservation tables. The migration sequence 001→006 passed in PGlite.

`lib/integrated-phase-a3-media-v6-core.mjs` scans **all Blob prefixes** with bounded pagination, rejects incomplete/duplicate inventories, projects private asset/usage/capability DTOs, validates source+output budget under the 950,000,000-byte admission ceiling, and decodes/normalizes bounded images to metadata-stripped WebP <=5 MB. `-ledger.mjs` persists a complete scan and counts untracked legacy objects; it refuses uncoordinated writers or unresolved reservations. `-write.mjs` validates image/video intent DTOs, serializes brand/global reservations, reserves the exact image source size plus 5 MB output allowance, and issues exact declared-byte token constraints. `-process.mjs` contains the private-image callback path: verify source, normalize, verify deterministic output, commit ready+physical accounting, then idempotently delete the temporary raw Blob. A failed raw cleanup leaves the normalized image ready and both physical byte counts charged until confirmed cleanup. Reference-safe explicit delete removes normalized and any residual raw object only after draft/public reference checks and physical absence confirmation.

The server runtime and routes expose authenticated `GET /assets/usage`, bounded all-state `GET /assets`, `GET /assets/{id}/status`, image upload intent and SDK client-upload callback, plus guarded delete. The old multipart POST is disabled. Existing private preview and public A4 image delivery continue to use the normalized `private_blob_path`. Server flags `MEDIA_V6_CONNECTED_VERIFIED`, `MEDIA_V6_IMAGE_UPLOAD_ENABLED`, `MEDIA_ALL_WRITERS_COORDINATED` and the Blob store ID default absent/false; direct writes therefore return honest 503. The actual SDK callback is wired but **has not been exercised against a connected private store**. Video intent parsing/reservation primitives exist, but the runtime rejects video with `VIDEO_UNAVAILABLE` until reliable H.264/AAC validation and private range playback are proven. No public video module or payment/admission claim is enabled.

## Verification

- `node --test tests/integrated-phase-a3-media-v6*.test.mjs` covers schema sequencing, full-prefix/legacy inventory, unknown-usage fail-close, 10 MB image normalization and EXIF removal, source+5 MB reservation across brands, exact token max, unchanged-ID retry, image callback with a fake private Blob, ready image during failed raw cleanup, confirmed byte release, and explicit deletion.
- Combined A3 legacy/A3 v6/A4/A5 focused tests: **30 passed, 0 failed**. This includes the older gated media and event-publication regressions.
- `node --check` passed A3 v6 modules and route files. PM is coordinating the integrated production build, so this report does not claim one.

## Activation gaps and risks

The owner-selected private Vercel Blob store, Neon and Clerk are not connected in this checkout. `MEDIA_ALL_WRITERS_COORDINATED=true` is an operational assertion, not proof by itself: existing anonymous demo Blob writes or any other writer must use the same ledger or be paused/moved before activation. A complete, fresh connected-store scan, SDK token issuance/completion, exact `head/get/put/del` behavior, browser upload >4.5 MB, end-to-end source cleanup, and public media delivery have not been verified. An orphaned reservation/reconciling asset needs a bounded recovery worker and operator visibility before a live upload gate can be lifted. Video codec inspection and private Range 206/416 delivery remain unimplemented. The old single-path delete remains disabled; v6 delete is gated.

The v4 `UsageSummary` described numeric observed bytes, while this implementation returns `null` when there is no trustworthy scan, with `storageStatus:'unknown'`. This avoids displaying a fabricated zero; Frontend and Backend should ratify this small DTO refinement before enabling the library. All public media DTOs omit the temporary source path. No connected service success is claimed from fixtures.

Backend files: migration 005; five `lib/integrated-phase-a3-media-v6-*.mjs` modules; A3 routes under `app/api/v1/organizers/[organizerId]/assets/`; `.env.example`; and focused tests. Frontend-owned files were not edited. All upload/playback gates remain off.
