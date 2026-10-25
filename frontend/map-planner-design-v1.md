# Event map and activity planner design v1

Brief: `brief/project.json` v108. Frontend owner: Frontend Engineer. This is a proposed extension of the existing purple Clickatick marketplace, not a new visual direction.

Sources read before implementation: `team/roles/frontend.md`, `team/shared-rules-v1.md`, `AGENTS.md`, `README.md`, `.agents/product-marketing.md`, `.agents/skills/workshop-owner-language/SKILL.md`, `.agents/skills/frontend-design/SKILL.md`, `.agents/skills/yc-interface-craft/SKILL.md` and its research reference, `.agents/skills/intentional-ui-design/SKILL.md`, `.agents/skills/emil-design-eng/SKILL.md`, `.agents/skills/animation-performance/SKILL.md`, `.agents/skills/brief-to-site/SKILL.md`, `.agents/skills/site-architecture/SKILL.md`, `.agents/skills/schema/SKILL.md`, `.agents/skills/seo-audit/SKILL.md`, `.agents/skills/programmatic-seo/SKILL.md`, `.agents/skills/copywriting/SKILL.md`, `.agents/skills/copy-editing/SKILL.md`, `.agents/skills/cro/SKILL.md`, `.agents/skills/signup/SKILL.md`, and Next.js 16.4.2 bundled `page.md`/`route.md` docs. Applicable instructions were used to extend the approved interface and keep private planner data out of search indexing.

## Journey

- Home navigation links to `/map` and `/planner`. The map is discovery, and the planner is the place to compare saved events.
- `/map` opens with an accessible list and map side by side on wide screens. On narrow screens, a list/map switch uses the same results. Neither geolocation nor sign-in is required.
- A visitor may request their location through an explicit “Near me” button. If they decline, the map starts over the United States and the list remains usable.
- The map starts at a bounded city scale. Pointer dragging moves to arbitrary nearby areas; arrow keys or labeled movement controls do the same. Zoom is bounded to levels 9–13 so the API never receives a continent-sized viewport. A labeled latitude/longitude form reaches arbitrary U.S. areas without a geocoding service.
- Map pins correspond to loaded events that have verified coordinates. The list includes events lacking coordinates under “Location not mapped.” The page never claims every Ticketmaster event worldwide is loaded; coverage depends on upstream search and pagination.
- A pin selects a list result; the list result links to the existing Clickatick event detail page. Tickets leave for the provider only when the visitor chooses its Buy action.
- `/planner` saves selected partner or Clickatick events. Anonymous visitors use a first-party random browser identifier in an HttpOnly cookie, never a device fingerprint. Sign-in merges saved items into the account through the backend.
- The planner shows date order, source, venue, event link, remove action, loading and empty states. Purchases and reservations are not inferred from saved items.

## Visual and interaction direction

Keep the established lavender/purple accent, panel color tokens and rounded cards. Give the map generous width and keep controls outside its bounds. Use a restrained purple selected pin and neutral unselected pins. Pins and corresponding list items share a visible selected state. No hover-only functionality. Keep all map actions available from the list for keyboard and screen-reader users. A reduced-motion setting removes animated pan and pin movement.

The first map uses standard OpenStreetMap raster tiles for bounded interactive viewports, with visible attribution and no bulk tile download. Its public tile server has limited capacity and may block heavy commercial use, so a production traffic scale-up needs a dedicated map-tile provider. No Google prototype key appears on the public site.

## Search and indexing

The interactive map and personal planner are utility pages. The planner must be `noindex`. The map should only be indexed if it has server-rendered, unique event data and stable geographic context. Do not create city pages from empty or duplicated feed data. Event detail pages retain canonical URLs and provider attribution. Treat “GEO” as clear, factual event and location content that search engines and AI assistants can parse; do not promise ranking gains.

## Contract request

Frontend and Backend agreed `backend/map-planner-contract-v1.md` before implementation. The viewport read is `GET /api/event-map?bbox=west,south,east,north&page=0`, with at most 50 mapped events per page and explicit partial coverage. Planner reads return `items`, and writes use `POST /api/planner` plus `DELETE /api/planner/{source}/{id}`. The backend owns anonymous cookies and account merge.

## Acceptance checks

1. Map and list agree on all returned mapped events; coordinate-free events remain discoverable in the list.
2. The map works from 320 px up, without horizontal overflow or overlapping controls.
3. Keyboard users can select and open every event from the list and manage planner entries.
4. Anonymous saves survive reloads. Account merge is idempotent and does not leak another visitor's saved events.
5. No partner checkout opens until the visitor chooses Buy on its event page.
