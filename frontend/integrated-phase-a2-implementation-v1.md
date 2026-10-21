# Frontend Phase A2 implementation

21 October 2026. Implemented against `brief/project.json` v93 and agreed `contract/integrated-phase-a2-v2.md` / `handoffs/004-pm-phase-a2-agreement.md`. The brief advanced to v94 during this work with editor preparation rights; the A2 implementation remains owner-only until the staff invitation and role contract is agreed.

## Delivered

- Brand dashboard now queries the real brand-scoped draft list. It shows a true empty state, draft summaries, pagination, and distinct sign-in, unavailable, denied and error states. It never calls a draft a published event or shows fabricated sales.
- Added `/dashboard/{organizerId}/events/new` and `/dashboard/{organizerId}/events/{eventId}` with one private editor. It covers event basics, business and optional separate event locations, exact numeric pins, individual or weekly local-time schedules, explicit date/tier inventory choices, ticket types and prices, numbered section configuration, restrictions, disclaimer review, refund text, optional referrals and payment preferences. Save uses server IDs, 201 responses, versioned PATCH, conflict reload, idempotency keys, input bounds and the agreed `{data,error}` envelope.
- A separate “Save to brand draft” action in `/creator` preserves the existing “Publish demo listing” action. Sign-in and brand selection lead to a private import route; the source draft stays in device storage after success, error or cancellation. Import warnings are displayed. Photos and generated cover remain on the device while upload is gated.
- Added an Organizer dashboard header link. An optional Google Maps prototype picker loads only when `NEXT_PUBLIC_GOOGLE_MAPS_DEMO_KEY` is configured. It allows map click and drag, separately for business and event pins. Manual coordinates and a public map-check link remain available when the picker is absent or fails. Changing an existing address clears its pin and requires an address save before pin replacement. The picker does not claim address geocoding or verified synchronization.

## Checks

- Elevated `pnpm run build` passed after the final frontend changes; all new dashboard and event editor routes compiled.
- `node --test tests/integrated-phase-a2.test.mjs` passed 5/5 after Backend repaired its permissions reference.
- An earlier full `pnpm run check` passed 275/279. Two A2 failures were the backend permissions reference, now fixed by Backend and covered by the focused passing rerun. Two legacy PGlite disk-restart tests aborted in the sandbox; they are unrelated to frontend. A full clean rerun is still needed for project-wide green status.
- No live Clerk, Neon, Google Maps key/quota, or private Blob upload was available for a signed-in browser walkthrough. The UI shows unavailable/error states rather than claiming those services work.

## Deliberate limits and next contract

- Private photo/cover upload is disabled pending an owner-approved media retention and cleanup rule. Imported image warnings do not count as successful transfer; the local source remains recoverable.
- The Google prototype is conditional and untested with a real key. [Google's Maps JavaScript loader](https://developers.google.com/maps/documentation/javascript/load-maps-js-api) and [draggable advanced-marker guidance](https://developers.google.com/maps/documentation/javascript/advanced-markers/draggable-markers) informed the integration. A production key needs domain restrictions and quota verification.
- The A2 seat editor configures sections but does not mark accessible seats, reserve seats, issue admission tickets or collect payment. Owner policy for seated/accessible tickets remains pending.
- A2 has no Publish action for these new drafts. Public Blob demo publishing and zero-charge demo checkout remain separate. The later publish/stock/buyer contract must precede any live event or checkout claim.
- Editor preparation rights approved in brief v94 should be implemented with the staff invitation/role API, not inferred from the current owner-only A2 responses.
