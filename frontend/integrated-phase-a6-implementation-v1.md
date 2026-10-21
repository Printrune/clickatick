# A6 frontend implementation v1

Date: 2026-10-21. Sources: `brief/project.json` v104, `contract/integrated-phase-a6-v1.md` amended by v2, `frontend/integrated-phase-a6-agreement-v1.md`, and PM handoff 012.

Implemented a compact seat editor behind `NEXT_PUBLIC_SEAT_AUTHORING_ENABLED`. It extends the existing private draft editor and uses sparse removed, accessible and tier-override coordinates. The screen separates configured numbered seats from ticket capacity, renders one row at a time, offers a keyboard-operable seat list and an optional visual row map, and marks an explicit geometry reset. Accessible seats have text labels and no eligibility check. The old A4 seat form remains when the gate is off.

Added private `/dashboard/{brandId}/published-events/{eventId}/edit` and `.../review` routes behind `NEXT_PUBLIC_PUBLISHED_REVISIONS_ENABLED`. They consume the agreed RevisionView, create a working copy, save selected fields, submit, compare server changes, return with a note and approve only when the server grants review permission. A version conflict keeps local input and offers an explicit recovery choice. The published-event page links to the editor only when the flag is enabled. Approval reloads the stable event route's latest version; private save and submit copy never claim publication.

Updated demo quote review to show a stale selection as historical information and require a return to the current event; a stale quote cannot invoke checkout. Cancellation has a distinct state. Updated demo confirmation to render captured eventSnapshot facts and versioned image when supplied, while legacy A4 confirmations show only previously captured facts and a clear note. Existing no-payment/no-reservation language remains.

Focused checks: `node --test tests/a6-seat-editor.test.mjs tests/route-uuid.test.mjs` passed 5/5. A Babel JSX parse of all modified A6 components and pages passed. The production build is **pending** because PM asked Frontend to hold it while A3/A6 Backend edits continue; PM will run one combined build after files settle.

Gaps: the first revision editor exposes title, description, restrictions, disclaimer, refund policy and seat layout. Schedule, venue/pin, images, ticket prices and capacity changes still need controls before this can be called a complete published-event editor; the server comparison can display their changes from another writer but Frontend cannot author them yet. No connected Clerk/Neon/Blob/browser end-to-end path was verified. Keep both A6 gates off, and do not advertise published revisions or seat changes as active.
