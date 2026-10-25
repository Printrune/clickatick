# Event map and activity planner contract v1

Brief: `brief/project.json` v108. Approved context: Ticketmaster events have Clickatick detail pages and provider-only checkout; Clickatick's own published events have separate detail pages. The planner uses a first-party random browser identifier for signed-out visitors and an existing Clerk account when signed in. It does not read hardware IDs or fingerprint devices.

## Map read

`GET /api/event-map?bbox=west,south,east,north&page=0` returns `{events,nextPage,coverage}`. Coordinates are decimal longitude/latitude. The box must be ordered, within valid coordinate ranges, no antimeridian crossing, and fit within a 200-mile search radius. Invalid or oversized boxes return 400 `INVALID_BOUNDS`; the client asks visitors to zoom in. `page` is 0–4. No cookies or login are needed. `events` is at most 50 items, in this shape:

`{id,source,title,url,lat,lng,date,venue,city,imageUrl}` where `source` is `ticketmaster` or `clickatick`, `url` stays on a Clickatick detail route, and coordinates are verified finite numbers inside the box. Missing coordinates are omitted. Ticketmaster search uses Discovery API `geoPoint` with a bounded radius, a 15-minute cache, and no public API key exposure. Its `page` applies to Ticketmaster results only; own published events are included on page 0. `coverage` reports `partial` whenever upstream paging, missing coordinates, provider failure, or the viewport limit prevents completeness. The interface must not say every Ticketmaster event is on the map. If provider search fails, own events may still return with `coverage:partial` and an `unavailable` marker. If both sources fail, return 503. This map is a discovery view, not a venue inventory guarantee.

## Planner

`GET /api/planner` returns `{items:[{id,source,title,url,date,venue,city,imageUrl,addedAt}]}` newest first, maximum 100. On the first planner write, the server sets an opaque random `clickatick_planner` cookie, HttpOnly, Secure in production, SameSite=Lax, path `/`, one-year expiry. The database stores only its SHA-256 hash. `POST /api/planner` accepts `{source,id}` where `source` is `ticketmaster` or `clickatick` and `id` is a bounded provider event ID or Clickatick UUID. It validates the event exists and is public before saving, returns `{item,created}` (201 new, 200 already saved). `DELETE /api/planner/{source}/{id}` removes an entry for the current principal only and returns 204 even if absent. Mutations require same-origin browser requests. JSON body is at most 2 KiB; 100 saved items per principal; 30 writes per principal per minute. Errors use `{error,code}` with 400, 401 only when sign-in is explicitly required, 429, or 503 as appropriate. Anonymous planners remain available without sign-in.

When an existing Clerk login is present, the server merges anonymous entries into that user's planner on the next planner request, without duplicates. Subsequent reads and writes use the account identity. The account can therefore see its saved events on another device after sign-in. A signed-out browser uses only its first-party cookie and cannot recover a cleared cookie. No geolocation, account email, device fingerprint, payment details, or ticket purchase data is stored in the planner. A ticket saved to a planner does not reserve it or change availability. Deleted or cancelled events can remain as saved snapshots, labelled unavailable by the client only after a fresh status check; the planner never implies a ticket is held.

## Database and ownership

Migration `009_event_planner.sql` adds `saved_events` with a unique `(owner_kind,owner_key,source,event_id)` constraint and per-owner index, plus bounded request-rate state. The data owner is a random-cookie hash or Clerk subject. No public listing endpoint exposes planner rows. Server-only `DATABASE_URL`, `TICKETMASTER_API_KEY`, and Clerk credentials remain private. The public map does not require the planner database for Ticketmaster events; own events require Neon. A separate migration must be applied before claiming hosted planner persistence works. Deployment and production migration are separate verification steps.

Ticketmaster Discovery API search supports `geoPoint` plus `radius` and has deep-paging limits. The bounded map is intentionally a nearby selection. True all-events coverage would require an approved full feed or importer, which this contract does not claim.

## Interface ownership

Backend owns map and planner routes, Ticketmaster spatial search normalization, Neon SQL/migration, validation and endpoint tests. Frontend owns map rendering, viewport interaction, save/remove controls and user copy. The agreed field names and response semantics above precede implementation; changes need Frontend and Backend agreement.
