# Map, planner and search review v1

Brief: `brief/project.json` v109. Owner requested event locations on a map, an activity planner usable anonymously or after sign-in, and strong search visibility. Research: `research/map-planner-seo-v1.md`. Agreed interface: `backend/map-planner-contract-v1.md`.

## Implemented

- The public map searches a bounded viewport and labels its results as a selection. Ticketmaster Discovery API depth, coordinates and quotas do not permit an exhaustive map. The page offers city shortcuts, arbitrary coordinates, panning, zooming, keyboard movement, a list view and event links. It uses attributed OpenStreetMap tiles, not the Google prototype key.
- The planner saves event snapshots in Neon under a random first-party, HttpOnly browser cookie or an existing Clerk user ID. A signed-in request merges saved browser entries. No hardware/device fingerprint is collected. The planner is private and noindexed.
- Production uses `https://clickatick.com` for canonical URLs. Preview and local builds remain noindex. Public home, discovery, creator, privacy and published Clickatick event URLs enter the production sitemap. Thin client-only map pages remain noindex until useful server-rendered local content exists.
- Partner and Clickatick event pages have server-side titles, descriptions and canonical URLs. Eligible dated/located events emit Event JSON-LD with visible details. No paid ticket offer or availability is invented while Clickatick checkout remains simulated.
- Dashboard, sign-in, invitations, old shared-link listings, receipts and demo checkout are noindexed. The privacy page explains planner storage, location use and third-party map/provider requests.

## Verification and limits

- Brief validation, focused map/planner tests, Ticketmaster tests and event SEO tests pass. The full test run encounters two PGlite disk-restart failures in the restricted Windows environment. Local Next builds fail with EPERM while creating `.next` directories; a hosted Preview build and browser test are required.
- Migration `009_event_planner.sql` must apply before planner persistence can work in Preview or Production. Do not report hosted save/merge as working until verified through the browser and database.
- The first hosted map rendered Ticketmaster pins, but saving returned a missing-table error (`42P01`). Clerk middleware now covers the planner API. The branch-scoped Preview migration switch was temporarily enabled for a guarded build that accepts only an eight-migration ledger followed by `009_event_planner.sql`; switch it off after the build and verify saving again.
- Search visibility and AI citations are not guaranteed. Google says its AI search features follow ordinary SEO foundations and do not require GEO-specific markup or `llms.txt` tricks. Unique, accurate event information and an indexable production domain matter more than mass-generating duplicate partner pages.
- A production-scale map should move to a supported tile provider or self-hosting if OpenStreetMap public tile traffic grows beyond its fair-use policy. Google Maps Demo Key is prototype-only.
- Ticketmaster API terms, quota and event-content usage must be respected. Do not claim affiliate commission or checkout on Clickatick for partner events without separate agreements.

## Next measurements

After production release, verify robots and sitemap on `clickatick.com`, submit the sitemap in Search Console, inspect indexed event pages and structured-data reports, and measure impressions, organic visits and map-to-event clicks. Add server-rendered city pages only when they offer useful, original local information and the feed rights support the intended indexing.
