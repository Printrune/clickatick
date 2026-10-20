# TicketNest API contract v2

Date: 2026-10-17. Shared brief version: 9.

PM agreed this contract before the v2 implementation. It supersedes v1 only where specified below. V1 remains a retrospective record.

## Publication write boundary

POST /api/listings keeps the existing request `{id:UUIDv4,draft}` and success `{url:"/listing/<id>"}`. Error shapes and status classes remain unchanged.

The server validates the authenticated Supabase user, listing identifier, parseListing output, and publicationErrors before writing. Client-supplied owner identifiers are ignored.

The server calls `publish_listing(listing_id uuid, listing_content jsonb, listing_owner uuid)` with its service-role credential. The owner comes only from the verified session user. The function inserts a published listing or updates an existing listing only when its owner matches listing_owner. It returns the UUID. Ownership mismatch raises an error and leaves the existing listing unchanged.

Only service_role can execute this function. Anonymous and authenticated roles cannot insert or update the table directly. Authenticated owners retain read access. Anonymous public reads remain through the published view. The server remains responsible for listing schema and publication validation. Database constraints still enforce identity, ownership reference, and content size.

## Explicit activation

AI_ENABLED must equal `true` in addition to existing AI credentials and allowance configuration. PUBLISHING_ENABLED must equal `true` in addition to SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY. Both default off.

These flags control whether services are available; setting credentials alone enables no external operations. Activation follows owner approval and release checks. No provider, database, or email setup occurs in this change. The mandatory AI allowance reservation remains unchanged.

## Ownership and verification

Backend owns services, publication route, SQL, environment example, connection handoff, and review-v2. No client or listing parser changes are included.

Run local configuration/unit checks and build. Rehearse route gating, owner derivation, validated RPC payloads, and storage failures without external calls. Inspect SQL grants and conflict ownership conditions. Real SQL grants, transaction races, view access, and RPC behavior require a later disposable-database integration test.

Anonymous AI abuse prevention and verified maximum model request costs remain activation blockers. This change does not claim a measured or proven $10 actual-cost guarantee.
