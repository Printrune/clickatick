# Frontend review of private media contract v1

21 October 2026. Reviewed `brief/project.json` v97, shared rules, frontend role, `contract/integrated-phase-a3-media-v1.md`, current A2 editor/import behavior, and relevant boundary and storage skill guidance. The contract header cites brief v96; its owner retention rule matches current v97. No app code changed.

## Verdict

The private upload, same-brand references, preview boundary and explicit deletion model fit the owner decision. I agree that successful uploads remain until an organizer deletes them. **Amend the API before Frontend or Backend codes A3**, because three recovery paths are underspecified and one proposed quota still needs approval.

1. **A failed explicit delete becomes invisible.** `GET /assets` returns only `ready`, while a Blob deletion failure leaves the row `deleting` and still charged to quota. After reload the organizer cannot find or retry that deletion. Include the owner's `deleting` assets in the list with `state`, `version`, and a retry action, or provide a separate pending-deletions endpoint. The editor must say the image is still being deleted, not that it vanished. Specify whether `GET /assets/{id}` returns 404 or 503 during `deleting`.

2. **The organizer cannot find all places using a photo.** `referenceCount` tells them that Delete will fail, but not which event draft and slot to open. Add a brand-scoped references endpoint or bounded `references:[{eventId,title,slot}]` to a detail response. The UI can then link to each draft, detach or replace it with versioned PATCH, and return to the gallery to confirm Delete. Do not silently detach across events as part of replacement.

3. **Upload/delete version and retry protocol need one exact shape.** POST returns an asset without `version`, but DELETE requires `If-Match` from upload or list. Add `version` to POST, define whether `If-Match` contains a quoted ETag or decimal version, and define the error code and current version on stale requests. Say whether a repeated DELETE of an already deleted own asset returns 204 even with an old `If-Match`. If a pending upload expires or fails, define whether retrying unchanged bytes with the same `uploadId` eventually returns 201, returns a terminal failure that calls for a new key, or remains `UPLOAD_IN_PROGRESS`. The client cannot choose a safe retry otherwise.

4. **Approve or adjust the safety caps before implementation.** The 100-asset, 100 MiB, 10-per-hour and 2-concurrent caps are marked proposed. They affect gallery copy and 429/413 handling. Only the PM should ask the owner, one question at a time. These are product caps, not evidence of Vercel free-plan allowance.

## Frontend behavior once amended

- Keep the A2 event and media slot IDs. After import, record the destination brand/event ID with the original local conversation draft ID on this device. Before converting an inline photo to a File, check that the local source ID still matches. If the device draft changed, ask for a new file rather than attaching an unrelated image. Import 201 and upload 201 never clear the device draft.
- Show three independent image slots: business location, optional separate event location, and cover. File input accepts JPEG/PNG/WebP up to 2 MiB before upload, with server validation authoritative. Show upload progress and a retry that reuses `uploadId` only for the same bytes, kind and alt text. Make the gallery available for reusing ready same-brand assets; previews use only the authenticated `previewUrl`.
- Attaching or replacing an image is a versioned event PATCH. The old image remains in the gallery and is not deleted. Detach clears just that slot, then Delete needs a separate explicit confirmation. Show quota and temporary-service errors without claiming the source image or saved event was lost.
- Once an image is attached, refresh draft warnings from the A2 PATCH response. Keep an unresolved local-image warning distinct from a missing photo if upload succeeded but attachment failed; allow retrying attachment by asset ID without uploading and charging quota again.
- A viewer may list/preview but should not see enabled upload, attach or delete actions. Current A2 editor is owner-only; editor preparation rights await the invitation and role contract.

No live Clerk, Neon or Blob connection was verified by this read-only review. A3 remains private media work, not public publication or ticket delivery.
