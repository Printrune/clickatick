# Imported system integration proposal v1

2026-10-17. Shared brief version 11. Proposal for PM and Frontend agreement. This is not an agreed API contract and authorizes no service activation.

## Recommended minimum

Keep Next.js, current conversation state, AI budget reservation, login adapter and /listing/:id route. Add a pure draft-to-event transform and transactional publication storage behind the existing POST /api/listings boundary. Preserve the current {id,draft} request and {url} response. Do not create a second browser Supabase write path.

Map approved AI/manual draft into normalized event and ticket tier records. Event ID equals existing listing ID. Organizer is derived from verified authenticated user on the server. A default General admission tier uses draft price and capacity, currency USD and sold zero. Tier identity must remain stable on edits. Never delete tiers with issued tickets.

Retain the complete validated TicketNest draft as the source for public rendering, either in the current listing table or an event source_content column. This preserves individual dates, recurrence and timezone that the imported model cannot fully express. Map one-time starts/ends to event timestamps and recurring schedule to recurring_rule, but do not collapse multiple individual dates into one misleading date. Keep canonical schedule in source_content until explicit occurrence-based booking is designed.

## Storage interface

Proposed service-only RPC publish_event_listing(listing_id UUID, listing_owner UUID, listing_content JSONB). It resolves or creates organizer for verified owner, inserts or updates event, upserts stable General admission tier and published listing snapshot in one transaction, and returns UUID. Existing owner mismatch must roll back the entire transaction. Retry same listing ID produces one event and one tier. Server validates draft and publication requirements before RPC. Database adds nonnegative price/capacity constraints and identity consistency.

Restrict function execution to service_role. No anonymous or authenticated direct writes to events, tiers or publication snapshot. Owner reads and public published projections contain only required columns. No orders, tickets, buyer PII, transfer tokens or private auth identifiers are exposed. New installation uses a clean reviewed additive migration rather than the original migration set or original project credentials.

## Frontend agreement required

No new endpoint or response shape is needed for listing publication. Frontend keeps login and explicit Publish, and explains publication creates a listing with ticket details. Display admission sales as unavailable while payment and issuance remain out of scope. If multiple tier editing is desired, agree an extended draft shape with PM and Frontend before implementing it.

## Verification

Run pure mapping checks for single event, individual dates and weekly recurrence. Rehearse route authentication, owner derivation and unchanged response contract. Integration-test actual transaction atomicity, duplicate publication retries, competing owners and policy isolation in a disposable database before activation. No fake service success when disconnected.

## Deferred admission issuance

If PM confirms admission tickets, add a separately agreed reservation/issuance operation that validates event/tier ownership, computes prices from server records, locks occurrence inventory, creates order and tickets atomically, and handles idempotency. Free registration can issue after explicit confirmation. Paid admission must wait for verified third-party payment fulfillment. Never copy the archive's browser-confirmed payment branch. AI prepares listing content and never certifies payment or directly issues credentials.

## PM scope decision and interface agreement

PM relayed owner clarification on 2026-10-17. Create event listings and ticket types only. Admission issuance is excluded. This section supersedes the earlier optional issuance decision.

Agreed implementation boundary: replace old listings storage with canonical organizers, events, ticket_tiers and dated event_occurrences. Use service-only atomic RPC publish_event_draft, with the existing POST /api/listings {id,draft} and {url} contract unchanged. No checkout, orders, tickets or original migration history will be imported.

Root owns the shared parser extension. Optional ticketTiers defaults to [] for old drafts. Each tier has {id:UUID,name,description,price:string,quantity:string}. Empty tiers map to one stable General admission tier from legacy price/capacity. USD is authoritative for this demonstration. Top summary values are derived from tiers when present. Backend must validate the new parser output before constructing the persistence payload, never trust a separately supplied organizer.

Store full canonical draft on events for public rendering and retain existing event UUID. Organizer user ownership derives from verified auth user. Dated occurrences preserve local date/time and IANA timezone plus resolved UTC timestamp. Individual-date lists create one occurrence per supplied date; weekly schedules expand only across the stored bounded date range and selected weekdays. Deterministic occurrence IDs or uniqueness on event/date/time permit safe retries. Reject nonexistent local daylight-saving times rather than silently moving an event. Agree ambiguous-time handling in implementation contract before SQL adapter work.

Atomic write updates organizer-owned event, stable tier rows and occurrence set together. Public reads expose only published event projection, tier details and occurrences. Owner mismatch changes nothing. Root will install PGlite as a development dependency for local SQL verification. Emulate auth schema/roles explicitly for the test; report that this validates SQL transactions locally, not hosted Supabase auth or deployed RLS configuration.
