# Event system API v2

2026-10-17. PM and Backend agreement before implementation. Fresh database only. Owner confirmed event listings and ticket types, without admission issuance or payment.

POST /api/listings retains `{id,draft}` and `{url:'/listing/<id>'}`. Existing origin, activation and authenticated-session gates remain. The server parses the draft and ignores client owner fields. It calls service-only `publish_event_draft(event_id uuid,event_draft jsonb,event_owner uuid)` using the verified account ID.

Root owns the shared optional `ticketTiers` parser extension. Entries contain UUIDv4 id, name, description, decimal price string and integer quantity string. Empty tiers generate a stable General admission tier from legacy price/capacity. USD is fixed. Backend owns the SQL bootstrap, event-system adapter, publication route and public listing reader. Frontend keeps the HTTP interface.

Fresh schema contains organizers, events, ticket_tiers, event_occurrences and the existing AI allowance. Event ID remains listing ID. Full canonical draft is stored for public reconstruction. Public view exposes id, content and timestamps only for published events. Authenticated owners can read their records, but only trusted service functions write. Owner mismatch, invalid tiers or invalid dates roll back all changes. Repeat publication replaces the same event and stable tier/occurrence records atomically. Sold tiers cannot be removed or reduced below sold.

Occurrences expand individual dates or bounded weekly ranges, at most 366 dates. US IANA zones only. Each occurrence stores local date/time, timezone, UTC start and end with supplied duration. Reject daylight-saving gaps and folds rather than selecting an offset. Database validates shape, sizes, numeric ranges and date bounds in addition to server parsing.

No admission credentials, buyer data, checkout, original project credentials, Lovable runtime or original unsafe migration history is adopted. Connections stay disabled. Local PGlite tests verify SQL transactions, owner isolation, stable records, timezone behavior, permissions and public reads. Hosted authentication and deployment remain unverified.
