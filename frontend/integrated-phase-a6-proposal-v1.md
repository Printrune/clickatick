# A6 frontend proposal: seat authoring and published revisions

Date: 2026-10-21. Prospective only. Source: `brief/project.json` v104, `integration/design/integrated-phase-a6-v1.md`, existing A2/A4 routes and DTOs. No application code or connected service changed.

## Routes and tasks

Keep `/creator` and `/events/{eventId}`. Add a seat editor within `/dashboard/{brandId}/events/{draftId}`, after ticket types. The existing A2 section DTO (`id,name,rows,seatsPerRow,seatTierId,accessibleSeats`) is the starting shape. The screen shows sections, configured seat counts, a visual map and a complete keyboard-operable row/seat list. Seat detail changes its accessible flag and compatible tier. A section's ticket price remains on the tier, never on a seat. General-admission places are counted separately from configured numbered seats. Neither count is called available or sold.

Add `/dashboard/{brandId}/published-events/{eventId}/edit` for a private proposal and `.../review` for owner approval. The published-event page links to the edit screen and always shows the stable public URL and active version. Editors may save and submit a proposal. Only an owner may approve or cancel. An owner may return a proposal for changes without modifying the public event. Use field-by-field current/proposed comparison; do not make color the only indication. On phones, stack the two values with explicit labels.

The public event page, seat picker and new quote use the latest **approved** version. A completed demo confirmation renders its captured title, occurrence, timezone, venue, ticket and seat labels, prices and zero-charge notice from its own immutable snapshot. It can link to the current listing, but current data must not replace historical facts. Cancellation adds a notice without changing that snapshot. Existing A4 confirmations with missing fields must show only data actually captured, with a plain legacy note where needed.

## Proposed DTOs for Backend review

Recommend `public_events.id` remain the stable route identity and `activeVersion` point to immutable version rows. A private proposal has its own `revisionId`, `basePublicVersion`, `revisionVersion`, `status:draft|pending_review|returned|approved|withdrawn`, `updatedAt`, `updatedByLabel`, `submittedAt`, and `reviewedAt`. The browser receives safe role permissions (`editRevision,submitRevision,reviewRevision,cancelEvent`) rather than inferring them from a role label.

Proposed `GET /api/v1/organizers/{brandId}/published-events/{eventId}/revisions/current`:

```json
{"data":{"event":{"id":"uuid","status":"published","activeVersion":3,"publicUrl":"/events/uuid"},"revision":{"id":"uuid","basePublicVersion":3,"version":2,"status":"draft","draft":{},"updatedAt":"ISO"},"permissions":{"editRevision":true,"submitRevision":true,"reviewRevision":false},"changes":[{"path":"schedule.dates[0]","label":"Date and time","kind":"material","before":"October 30, 7:00 PM","after":"October 31, 7:00 PM"}]},"error":null}
```

`revision` may be null. A complete validated proposed A2-like draft and stable machine-readable `changes` are needed; display strings alone cannot drive accessible comparison or recovery. If multiple proposals can coexist, this route needs an explicit list/selection contract instead.

Proposed write family, all brand-scoped, same-origin, bounded JSON with idempotency keys:

| Action | Request | Expected result |
| --- | --- | --- |
| Create working copy | `POST .../revisions` with `basePublicVersion,idempotencyKey` | Private revision ID and draft snapshot. |
| Save | `PATCH .../revisions/{revisionId}` with `expectedRevisionVersion,changes` | New revision version and server validation/warnings; public page unchanged. |
| Submit | `POST .../revisions/{revisionId}/submit` with `expectedRevisionVersion,idempotencyKey` | `pending_review`; no public mutation. |
| Return | `POST .../revisions/{revisionId}/return` with owner note, expected version and key | `returned`; proposal remains editable. |
| Approve | `POST .../revisions/{revisionId}/approve` with `expectedRevisionVersion,expectedPublicVersion,idempotencyKey` | Atomic active-version swap, new version number, same `publicUrl`. |

The owner review screen must receive server-generated validation and changed-field classification before enabling Approve. Until a path taxonomy is agreed, treat **every** change as requiring owner approval. The server must enforce owner permission; hiding a button is insufficient. An identical retry returns the original result; a changed body under the same key conflicts. A stale edit or approval returns current versions and safe refetch URLs without losing the browser's proposed inputs.

For seat authoring, preserve A2 `seating.sections` when possible. Suggest a new `seatMapVersion` only if the 256 KiB A2 draft request cannot hold the 10,000-seat representation. A section remains compact geometry plus sparse accessible-seat coordinates. For irregular gaps or per-seat tier compatibility, add a bounded override list rather than materializing every seat in the draft JSON. Public expansion assigns stable seat IDs and labels. The browser needs `GET .../seat-map?sectionId=&row=&cursor=` or an equivalent paginated projection so a 10,000-seat map does not render 10,000 interactive DOM nodes. The map is an overview; the list must reach every seat with keyboard and screen reader. Return field-path errors for section count, seat count, duplicate labels and incompatible tiers.

## Exact contract questions to settle

1. Are revision rows unique per public event, or can concurrent proposals coexist? Define lock, status transitions, author/reviewer projections and recovery from a returned proposal.
2. Does a pure formatting/spelling edit still require owner approval? Frontend recommends **yes for A6** to keep one clear public cutover rule.
3. How do section and seat IDs survive a revision? Define when moving a seat changes its physical meaning and forces a new ID. Old receipt seat labels and version links must stay immutable.
4. Are irregular missing seats supported now? If so, specify row/seat coordinate overrides, ordering, sparse accessible flags and compatible-tier overrides. If not, state grid-only A6 and reject unsupported geometry clearly.
5. How do `dateScope=per_occurrence|across_dates`, `tierScope=shared|allocated`, GA tiers and optional/required seated tiers validate together? Seat count must not silently overwrite creator-selected capacity.
6. Does quote creation bind `eventVersion` and reject a stale quote after approval? Define `EVENT_VERSION_CHANGED` with current event URL, affected tier/seat IDs and safe retained intent. Never remap a changed seat or price automatically.
7. What exact immutable, no-PII receipt snapshot is written at demo checkout? Include event version, title, venue/pin text, occurrence/timezone, ticket names/prices, selected seat labels, amount and disclaimer notice. How are older A4 receipts rendered when those fields were not saved?
8. Which media refs stay after a revision replaces an image? Retain any Blob used by an old approved version or immutable receipt; A3 delete must report references before removal.
9. Does cancellation freeze or close pending proposals? Recommend approval returns `EVENT_CANCELLED` and no new quote/checkouts, while existing receipts and version history remain readable.
10. Agree error codes and recovery DTOs for `REVISION_VERSION_CONFLICT`, `PUBLIC_VERSION_CONFLICT`, `SEAT_GEOMETRY_INVALID`, `TIER_COMPATIBILITY_INVALID`, `EVENT_CANCELLED`, `EVENT_VERSION_CHANGED`, `MEDIA_UNAVAILABLE`, permission failure and database outage. Include field paths and current versions where safe.

Backend should resolve version/receipt semantics first. Frontend can then implement the seat editor, revision comparison and review, followed by stale-quote recovery. Keep new navigation hidden until browser→API→database checks prove the complete demo path. This proposal does not authorize real payments, reservation or admission.
