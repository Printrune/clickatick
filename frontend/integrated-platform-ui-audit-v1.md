# Integrated platform frontend audit v1

Date: 2026-10-21. Role: Frontend Engineer. Shared brief: `brief/project.json` version 107. Read `team/shared-rules-v1.md`, `team/roles/frontend.md`, `AGENTS.md`, and the actual frontend-design, intentional-ui-design, YC Interface Craft, workshop-owner-language, and Next.js page documentation files. This is a code and local-check audit; a production browser walkthrough is not claimed.

## Approved decisions applied

The marketplace belongs at `/`, conversation creator at `/creator`, and organizer management behind sign-in. Published events use stable URLs and demo checkout until verified payments exist. Guests may select numbered demo seats without a reservation. Occurrences have an event time zone. Existing approved purple brand and creator design remain in place. No API contract changed.

## Corrections made

1. New marketplace cards, transitional catalog cards, and the event's occurrence selector displayed UTC timestamps in each visitor's local time zone. An October 31 UTC occurrence could appear as October 30 in the western United States even when the event was in another zone. These now use the occurrence's `timeZone` returned by the existing API. `tests/event-date-display.test.mjs` checks a date crossing the international date boundary and the event's time-zone abbreviation.
2. New marketplace cards showed a broken-image icon when a cover image failed. They now show the existing decorative fallback.
3. The creator setup said numbered seating was excluded even during the new platform handoff. In cutover mode, it now directs organizers to choose the date-capacity rule and numbered seats after saving to a brand draft. The older demo keeps its old limitation copy.

## Remaining high-impact findings

1. **Current public deployment is not evidence of the integrated journey.** The new marketplace, owner draft, media, public event, and checkout routes are gated. The current production route can still show legacy Blob demos. Verify a real deployment after the database migrations, Clerk keys, feature gates, and release checks are complete.
2. **The creator-to-brand transfer needs an end-to-end browser test.** Source conversation and local photos stay in the browser, while published drafts are owned by an authenticated brand. Test a signed-out return, import, media attachment, date-capacity choice, owner review, publish, event URL, and a demo confirmation on the same event. Code inspection alone cannot prove this workflow.
3. **The new discover search covers only loaded event pages.** The UI says so. A user can miss an event on a later page until clicking Load more. A server search/filter contract would be needed for a complete marketplace search; no such contract was changed here.
4. **Promotions and referral decisions are not a live purchase journey.** Checkout remains zero-charge and the new event page explicitly says referral rewards and payments are inactive. The prospective promotion/referral contract needs backend and frontend implementation and verification before related controls promise savings or payouts.
5. **The page-level document has nested `<main>` landmarks.** `Chrome` wraps routes in `<main id="main">`; several new route components also render `<main>`. This is an accessibility structure defect to resolve in a coordinated route-shell pass, then check with a browser accessibility tree.
6. **Mobile and keyboard verification remain open.** No new local preview server was started by this audit. Test at narrow widths with long event titles, ten ticket types, a large seat grid, date/seat selection, error and loading states, and keyboard focus before public cutover.

## Verification

- `node --test tests/event-date-display.test.mjs`: 1 passed.
- `git diff --check`: passed; line-ending conversion warnings only.
- `next build` (Turbopack): failed before compilation because Windows denied a junction for `sharp` under `.next`.
- `next build --webpack`: failed with Windows `EPERM` creating `.next/types/app/api/marketing/[id]`. This is not evidence of a source compile error. A clean build on the deployment host is still required.

## Boundaries

No credentials, payments, email delivery, posting, payouts, or production release were activated. The date fix only uses fields already in the approved A4 event contract. Do not infer that the whole platform works from this audit.
