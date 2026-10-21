# Light mode and publishing flow verification v1

2026-10-18. Brief v66 approved light mode; v67 added optional description, removal of draft downloads and immediate publication navigation. Contract/demo-publishing-v3.md was agreed by PM, Frontend and Backend before validation changes. Specialist handoffs: frontend/light-mode-v1.md, frontend/publish-redirect-v1.md, backend/optional-description-v1.md. Independent reviews: frontend/light-mode-review-v1.md and backend/optional-description-review-v1.md.

## Release checks

Production dpl_7F3Cy4a5Cn5gNuKwMAw7KDPXdQ95 is READY and assigned to https://ticketnest-psi.vercel.app/.74-file manifest excludes development fixtures. Brief validation, Next production build and full sequential suite passed:239 tests,0 failures. Evidence: evidence/light-publish-full-tests-v1.txt. No extra paid AI request, payment, secret read or database migration was needed.

Light mode uses a labelled switch, a saved strict light/dark preference and a static pre-paint bootstrap. Original dark homepage remains the default. Invalid/blocked storage is safe. Design review found and corrected dark setup subpanels, pale scene labels, control border contrast, and a setup-input specificity conflict. Final live/local rendered fields were white rgb255/255/255 with dark text rgb47/25/63 and border rgb151/112/173. Reviewer calculated this border above3:1 on white/inset/read-only surfaces. Images are not inverted.

## Browser checks

Task-owned loopback3035: light selection survived reload, header fit390px, DOM scroll width375px, and setup/review controls were inspected. Manual setup field colors were read from actual computed styles after the specificity fix. Dark selection then survived reload. The actual avatar/camera, voice and service behavior were unchanged; no physical camera/microphone session was used.

Fresh loopback3036: explicitly labelled simulated-publication fixture loaded a complete fictional draft with empty description only on an empty origin. Review showed5 of5 groups and enabled Publish, with no Download draft control. A simulated503 retained the review screen, empty-description draft and durable intent032e2acd-9e72-4991-8660-1b453a9449b6. A successful retry automatically navigated to /listing/032e2acd-9e72-4991-8660-1b453a9449b6. This local target correctly returned404 because publication was mocked; this is navigation evidence only. Hosted persistence was verified separately below. Both task-owned previews were stopped and the fixture removed before build. No existing local/production draft was reset.

Actual production: Light mode switch persisted light after reload and across public-listing navigation.390x844 mobile header/hero and public listing were inspected after reload, with no horizontal overflow. The first immediate resize capture was transiently stale; the final saved mobile capture used the settled responsive layout and DOM media check. Dark receipt mode was independently inspected with a dark panel rgb21/24/39 and light heading rgb243/237/249. Light preference was restored. Viewport override was reset.

Screenshots: evidence/light-mode-desktop-v1.png and evidence/light-mode-mobile-v1.png.

## Description-free public publication

`node scripts/verify-live-optional-description-v1.mjs --confirm-public-demo` passed against Production. It persists a stable fictional UUID before any write, publishes description:'', verifies idempotent replay, independently fetches the public page and rejects any blank-description placeholder in that page. Evidence: evidence/live-optional-description-v1.json.

Public fixture: https://ticketnest-psi.vercel.app/listing/bca3d365-3ab7-4169-a43a-02ca9e6f8f51. The actual browser showed the published event, schedule, location, price and demo checkout without a description placeholder. Existing nonempty listing digests remain compatible. Legacy SQL publication retains its explicit description requirement because its schema still enforces that constraint; the active anonymous Blob path is optional.

Publication navigation validates an exact relative UUIDv4 listing path and happens only after successful persisted response. Failures stay on the draft. All draft download controls and obsolete download advice were removed, including final inactive-service error strings. Receipt confirmation download remains available. Saved drafts and synchronous retry intent storage remain intact.
