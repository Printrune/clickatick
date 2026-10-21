# Frontend agreement: A6 contract v2

Date: 2026-10-21. Reviewed against `brief/project.json` v104, `integration/design/integrated-phase-a6-v1.md`, and `frontend/integrated-phase-a6-contract-review-v1.md`.

**Agreed.** A6 v2 resolves all four frontend blockers:

1. Create, save, submit and return now return the same complete `RevisionView` as GET current; no-op and idempotent replay behavior is explicit.
2. Section order is derived from array order, legacy A2 drafts normalize safely, and reordering alone preserves section and seat identities. An explicit geometry reset handles physical remapping.
3. A stale quote remains an immutable display of the old selection, with exact `event_changed` and 409 recovery DTOs. Cancellation is distinct and successful checkout replay remains stable.
4. Active and historical approved images have distinct same-origin routes. An old receipt freezes an image slot and event version, with a truthful fallback if the old asset is unavailable.

The combined v1 and v2 contract supports the approved mixed general-admission/numbered-seat demo, owner-approved in-place revisions, stable public URL and immutable old confirmation context. There is no remaining frontend interface blocker to implementation. Both feature gates stay off until the migration and connected browser/API/data checks pass. This agreement is not evidence of real payment, reservation or admission.
