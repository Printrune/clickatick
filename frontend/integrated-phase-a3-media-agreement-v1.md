# Frontend agreement on private media contract v2

21 October 2026. Reviewed `brief/project.json` v97, `contract/integrated-phase-a3-media-v2.md`, the prior frontend v1 review, shared rules, frontend role and relevant boundary/storage skills. No app code changed.

**Agreement:** Frontend accepts the A3 v2 routes, response shapes, device-source linkage and explicit deletion workflow. The v1 recovery gaps are closed. Deleting assets remain in the gallery with version and retry state; a brand-scoped references endpoint identifies every draft and slot that must be detached; upload returns a version; `If-Match` uses a quoted decimal version; failed upload attempts and lost delete responses have defined retries. The current A2 event DTO and versioned PATCH are suitable for attaching and detaching each slot.

**Implementation gate:** The proposed 100-asset, 100 MiB, 10-new-uploads-per-hour and 2-pending-upload caps remain unapproved. The Product Manager must record the owner's answer before enabling POST/DELETE and quota-specific copy. This is the only remaining contract decision that blocks active A3 media behavior. Frontend can prepare the gallery and error states against the agreed shape in the meantime, but must not claim live upload success without configured-service verification.

The owner-approved retention rule is clear: a successful image remains until explicit organizer deletion. Replacement does not delete the old image. Only an incomplete attempt that never returned an asset may be reconciled automatically. Imported conversation photos stay on the device, with source ID and slot digest checked before recovery. Editors remain outside A3 writes until staff invitation and role enforcement are agreed; viewers may list and preview.

Frontend implementation order after PM handoff and quota approval: source-link record and manual file fallback; gallery with ready/deleting and reference navigation; upload with stable key and progress; versioned attach/retry; explicit detach and confirmed delete/retry. Test an actual private Blob and Neon path before any live-service claim. Public publishing, payment and admission tickets remain outside A3.
