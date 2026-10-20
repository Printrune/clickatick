# Event backend integration review v2

2026-10-17. Based on shared brief v11 and owner clarification relayed by PM. Owner selected a new database and listing plus ticket types, without admission issuance. No hosted services activated.

## Implemented

Contract/import-api-v2.md was written before implementation. The existing publication HTTP request and response remain unchanged. The authenticated server calls publish_event_draft using verified user ownership. Public pages read published_events. The original generic listings table is replaced in the fresh bootstrap by organizers, events, ticket_tiers and event_occurrences. Complete validated drafts remain on events so public rendering preserves the agreed schedule and ticket types.

Publication creates an event and General admission fallback, or the explicit stable ticket types. Organizer uses a private default name and owner UUID slug. Repeat writes are atomic and idempotent by event and tier ID. Existing sold tiers cannot be removed or reduced below sold. Occurrences expand dates or a maximum 366-day repeating range, with UTC instants resolved from United States IANA zones and supplied duration. Inventory quantity is series-wide, not per occurrence. No booking behavior is claimed.

User-facing preflight errors explain unsupported zones and nonexistent or ambiguous daylight-saving times. SQL independently rejects those times and rolls back the write. Public projection exposes only published event ID, canonical content and timestamps. Owner IDs and organizer records are absent from the public view. Direct anonymous writes and RPC execution are denied. The service-only AI reservation ledger remains capped at USD 10.

No Lovable gateway, tagger, original project ID or source archive credentials were adopted. Existing TicketNest AI adapter remains separate. No checkout, payment, order, admission credential, email sender or marketing feature was added.

## Actual verification

Ran `node backend/verify-import-v2.mjs` against PGlite 0.5.10, a real local PostgreSQL engine with explicit auth.users and role fixtures. Output: `PASS: 45 actual PostgreSQL event-system checks. No hosted database or provider requests.`

Verified initial and repeated publication, General admission fallback, exact USD prices and quantities, stable explicit tier IDs, cross-owner denial, duplicate-tier rollback, sold-tier protections, weekly expansion, range limits, UTC offset change across spring daylight saving, rejected spring gap and fall fold, rollback including a newly created organizer, denied anonymous table access and writes, denied anonymous RPC/budget execution, authenticated owner isolation, owner reads, published projection fields, hidden unpublished rows and exhausted AI allowance.

Ran `node backend/verify-v2.mjs`. Output: `PASS: activation gates, publication origin/session/validation, verified-owner RPC payload, service credentials, storage rejection. All fetches mocked.` Updated this rehearsal for the new event RPC.

## Limits and release checks

PGlite verifies actual SQL behavior locally. Hosted Supabase authentication, REST exposure, production grants, cross-connection transaction races and hosted timezone versions still need release verification. The default installation script is for a fresh database only, and is not a migration for an existing installation. Root handles final project checks and production build. No provider request, email, live publication, deployment or AI spend occurred.

Service activation flags remain off. Existing live AI and anonymous abuse/cost verification blockers remain. Provider usage prices are not proven by this ledger test. Request bytes are bounded after reading the request; host-level request-size protection remains a deployment requirement. SQL source content is limited separately to 32000 UTF-8 bytes.

## Reproduction

From starter, run `node backend/verify-import-v2.mjs` and `node backend/verify-v2.mjs`. Both avoid live endpoints. The first closes its disposable database; the second intercepts every fetch. Existing historical review artifacts remain unchanged.
