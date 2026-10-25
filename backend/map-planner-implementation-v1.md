# Event map and planner backend implementation v1

Brief `brief/project.json` v108. Contract agreed before code in `backend/map-planner-contract-v1.md`.

Implemented `GET /api/event-map` with validated, bounded viewports, Ticketmaster geohash/radius search, coordinate clipping, 15-minute upstream cache, and published Clickatick pins from Neon. Response reports partial coverage and never exposes the Ticketmaster key. Provider failure does not hide the other source. The API returns at most 25 events per source per page; only page 0 contains the Clickatick slice.

Implemented `GET /api/planner`, `POST /api/planner`, and `DELETE /api/planner/{source}/{id}`. The anonymous identity is a first-party random UUID stored in an HttpOnly cookie; only its SHA-256 hash is stored in Neon. A Clerk session uses the account subject. Signed-in requests merge the current anonymous planner into that account, with duplicate prevention. Saves validate that the provider or published Clickatick event exists. Own events are never saved from a draft or cancelled listing. The database enforces unique items. The API caps planners at 100 entries and new/removal writes at 30 per minute per identity. Saving does not reserve admission or purchase tickets.

Added migration `009_event_planner.sql` and updated the migration runner for nine files. The preview build's conditional runner accepts a fresh database, seven prior migrations, eight prior migrations, or all nine already applied. Production schema changes are not automatic here. A hosted planner remains unavailable until migration 009 is applied and its ledger/hash verified.

Follow-up fix: the per-owner write limit is now checked before a Ticketmaster event lookup. This prevents an over-limit visitor from consuming provider API quota. On the first write in a minute, the server also removes at most 100 rate-limit buckets older than two days. The cleanup is bounded and needs no scheduled task.

Evidence: `node --test tests/event-map-planner.test.mjs` passed 7/7, covering viewport validation, geohash search, partner coordinate clipping and internal URL, Clickatick published pin SQL, planner reference/cookie validation, quota-before-provider order, and migration uniqueness. All three route modules imported in Node. `npm run check` did not start because npm was absent from this shell's PATH; full check/build and live browser journey remain for the Product Manager.

Limit: Ticketmaster Discovery API's bounded search and paging do not constitute every event. The map labels its coverage as partial. No device fingerprinting or precise visitor location is persisted. OSM map tile capacity and geo/SEO editorial review belong to the Frontend/Product Manager handoff.
