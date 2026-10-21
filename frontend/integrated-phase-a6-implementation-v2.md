# A6 frontend implementation v2

Date: 2026-10-21. Brief: `brief/project.json` v104. Contract: `contract/integrated-phase-a6-v1.md` as amended by v2. This report supersedes the A6 v1 implementation report for the revision form.

The private published-event editor now exposes the full A2 event draft fields needed for a revision. It retains the existing title, description, restrictions, disclaimer, refund policy and compact seat editor, and adds event type, ticket format, business and event locations, exact pins, dates or weekly schedule, time zone, duration, shared or allocated inventory, ticket type names, prices, allocations and seating policy. Saving sends a complete canonical draft to the A6 partial-change route. The server remains the authority for validation and publication. A changed address clears its coordinates; the editor requires the address to be saved before a new pin can be placed, matching the A2 patch rule. Google picking stays conditional on its configured client key; coordinates remain editable manually.

The revision form can select a ready, previewable image from the brand media library for cover and location slots. A missing media service leaves existing references untouched and labels selection unavailable. It does not upload, claim that an image is ready, or offer private video as public event media. New uploads belong in the brand media library when its server capability is enabled.

The revision feature stays behind `NEXT_PUBLIC_PUBLISHED_REVISIONS_ENABLED=false` by default. The compact seat editor separately stays behind `NEXT_PUBLIC_SEAT_AUTHORING_ENABLED=false`. No backend, migration, hosted service or deployment was changed here. The public event remains on its old approved version until owner approval.

Checks: the Next-bundled Babel ESLint parser parsed `RevisionDraftFields.jsx` and `PublishedRevisionWorkspace.jsx`; `node --test tests/a6-seat-editor.test.mjs tests/route-uuid.test.mjs` passed 5/5. The combined production build and browser/API/Neon/Blob checks remain pending under PM coordination while backend work settles. These syntax and helper checks do not prove connected revision save or media selection.

Remaining gaps: The revision editor includes referral percentage, payment preferences, supportive note and disclaimer review. It resets disclaimer review when its text changes. It does not upload media directly. It shows one page of ready brand images; a larger gallery needs pagination or search. A connected test must verify the complete PATCH, address-then-pin save sequence, draft conflict recovery, image reference validity, owner approval and active public version before either feature gate is enabled.

