# Live event publication contract v1 — proposed

Date: 2026-10-22. Brief read: `brief/project.json` v107. Owner decision: event creation, organizer management, and published listings become live; payment remains simulated. This contract is prospective. Frontend and Backend acceptance is required before implementation.

## API projection change

`GET /api/v1/events` and `GET /api/v1/events/{eventId}` continue the existing `{data,error}` envelope, pagination, IDs, event status, prices, dates, locations, media URLs, and ticket-tier fields. A published Neon event is a real public listing. Remove the event-level `demo:true` key from each `EventSummary` and `EventDetail`. Do not replace it with `demo:false`, which could imply that tickets can be purchased.

`EventDetail` retains `paymentConnected:false`, `seatSelectionReserves:false`, `inventory.configuredOnly:true`, and `referral.payoutConnected:false`. Seat projections retain `configuredOnly:true`. These capabilities state the practical limitations. The public event page and catalog may use “Published event” for the listing, while putting “simulated checkout” next to the ticket selection action.

No change to `POST /api/v1/events/{eventId}/demo-quotes`, quote read, demo checkout, or demo receipt shapes or paths. They remain charge-free simulations. Keep receipt `demo:true`, `admissionValid:false`, and `amountChargedMinor:0`. Keep explicit notice that choosing a seat does not reserve it, no admission ticket is issued, and no digital sale confirmation is sent. No promotion redemption or referral payout occurs. Keep `DEMO_CHECKOUT_ENABLED` off until end-to-end verification.

Historical Blob demo listings and `/listing/{id}` retain their existing demo markers and direct-link-only behavior after cutover. This contract changes only Neon published-event API projections. It makes no claim that listings are already live in Production.

## Frontend migration

Frontend can remove any event-level `demo` checks in `CutoverCatalog` and `PublicEventExperience`. Current inspected components already use explicit simulated checkout text and do not branch on `event.demo`. After implementation, a test must assert that a live published event summary/detail omit the key, while checkout and receipt remain marked demo. Do not strip simulated checkout text from the UI.

## Backend implementation and verification

Backend owns `lib/integrated-phase-a4.mjs` and its direct projection tests. Change only `eventSummary` and `eventDetail` after Frontend accepts. Add assertions for the absent event-level key and retained capability flags. Run `pnpm run check` and build; then verify the hosted public API after a real signed-in publish. Default-off service gates remain unchanged. Independent activation of Clerk, Neon, Blob media, marketplace cutover, and checkout requires the PM’s connected verification record.

Status: awaiting Frontend and Backend agreement through the PM. No code is authorized by this draft alone.
