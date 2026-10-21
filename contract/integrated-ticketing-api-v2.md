# Integrated ticketing API and data contract v2 — prospective

Date: 2026-10-20. Shared brief `brief/project.json` v91. This supersedes v1 where decisions changed. The entire Lovable feature set is the target main product, with clickatick conversational creation retained. The marketplace is `/`, creator is `/creator`, and checkout remains a zero-charge demonstration. Approved: organizer sign-in via Google and email using Clerk free, fresh Neon free Postgres, sign-in before publishing **new marketplace events**, exact seat choice in the demo **without reservation**, and a creator choice of inventory separate per occurrence or shared across dates. No old Supabase data, live payment, admission ticket or confirmation delivery is assumed. This contract is for PM/Frontend review before implementation; it does not provision services or change code.

## Canonical source and transition

Neon is canonical for new organizer, venue, event, occurrence, tier, inventory and seating data. Clerk authenticates an organizer on the server. New marketplace publication requires a verified Clerk session and organizer ownership. The current anonymous Blob demo publishing endpoint is a **legacy migration path only**: stop accepting *new* anonymous publishes at the cutover, but do not disable it until the replacement is tested and the PM schedules the release. Existing Blob listing and receipt reads remain available at their URLs with a visible demo label. Existing 20-slot Blob catalog can be shown as a separate legacy collection during transition; it must never be silently represented as a Neon event. Conversation drafts remain local until an organizer signs in and explicitly imports/reviews them.

Vercel Blob continues to hold images and existing demo records. Neon stores media references, not data URLs. All mutations use Next.js route handlers and server-only DB credentials. No raw Supabase client hook, policy, account or data is reused. Money is integer minor units plus ISO currency, identifiers are UUIDs, timestamps are UTC plus IANA event timezone, and every private write derives organizer ID from the verified Clerk subject rather than a body field.

## Canonical schema and invariants

| Table | Required core fields | Constraint / ownership |
| --- | --- | --- |
| `organizer` | `id`, `slug`, `name`, profile text, media refs, status, version | Unique slug; public profile projection only. |
| `organizer_member` | `organizer_id`, `clerk_user_id`, role | Unique pair. Initially support owner role; staff/multi-brand policy remains undecided. |
| `venue` | `id`, organizer_id, address, latitude, longitude, photo ref, name | Address plus precise pin; organizer-owned. |
| `event` | `id`, organizer_id, slug, title, description, event/activity type, timezone, `venue_id`, same-location flag, optional separate event address/pin/photo, restrictions, disclaimer, ticket format, state, version | Unique `(organizer_id,slug)`; draft/published/cancelled. No public read of drafts. |
| `event_occurrence` | `id`, event_id, start/end UTC, local start, timezone, status | Stable ID; generated from one-time dates or bounded repeat rule. Unique event/local start. |
| `ticket_tier` | `id`, event_id, name, concession note, price_minor, currency, sale window, optional allocation, sort_order | Nonnegative price; tier belongs to event; server computes displayed quote. |
| `inventory_policy` | `event_id`, `date_scope` (`per_occurrence` or `across_dates`), `tier_scope` (`shared` or `allocated`), total capacity, version | Explicit creator selections. Do not infer date scope from repeat rule or tier scope from concessions. |
| `inventory_pool` | `id`, event_id, optional occurrence_id, optional tier_id, capacity, reserved, issued | `occurrence_id` required for per-occurrence; null for across-dates. `tier_id` null for shared tiers; set for allocated. Nonnegative counters and `reserved+issued <= capacity`. Live mutations later require transaction. |
| `venue_section` | `id`, event_id, label, rows, seats_per_row, bounded geometry/style, accessibility metadata | Organizer config; section layout versioned. |
| `event_seat` | `id`, event_id, section_id, row label, number, optional tier_id, accessibility flags | Unique physical section/row/number. Demo selection references this ID; it does not update status. Live per-occurrence assignments/holds are a separate later table. |
| `addon`, `bundle`, `bundle_component`, `season_pass`, `pass_event`, `pricing_rule`, `promo_code` | Organizer/event ownership, eligibility, limits, status | Configuration phase only; no paid redemption claim. |
| `custom_form_field`, `waitlist_entry`, `buyer_message` | Event scope, bounded content, consent/retention metadata | Private buyer data, no public table read. |
| `affiliate_program`, `affiliate_code`, `tracking_link` | Event scope, enabled, reward basis points, code, attribution metadata | Organizer funds percentage from their share; configuration is not payout. |
| `demo_receipt` | zero charged, selected occurrence/tier/seat IDs, illustrative total, demo status, created at | May remain existing Blob receipt initially. No inventory hold, seat claim, admission entitlement or verified sale. |

Future `reservation`, `order`, `payment_attempt`, `admission_ticket`, `seat_hold`, `check_in`, `transfer`, `reward_ledger`, `email_delivery`, and `webhook_delivery` belong to a separately approved live-commerce contract. Do not activate from this schema. The old raw RLS `USING (true)` ticket and buyer reads are explicitly rejected.

## Exact first-slice owner and public models

The first implementable slice is Clerk authentication, Neon organizer profile, conversation draft import, event/venue/tier/occurrence/inventory/seating configuration, explicit publish, and public Neon catalog read. Payment and demo checkout migration are later slices. These JSON objects are **contract proposals**. Frontend and Backend must sign a revised numbered contract before coding.

`OwnerEvent` returned only to a verified member of its organizer:

```json
{
  "id":"uuid", "organizerId":"uuid", "slug":"string", "state":"draft|published|cancelled", "version":1,
  "title":"string", "description":"string", "type":"event|activity", "timezone":"IANA zone",
  "venue":{"id":"uuid", "name":"string", "address":"string", "latitude":0, "longitude":0, "photoUrl":null},
  "sameLocation":true,
  "eventLocation":null,
  "restrictions":"string", "disclaimer":"string", "disclaimerReviewed":false, "ticketFormat":"digital|paper|both",
  "schedule":{"kind":"dates|weekly", "dates":["local ISO"], "weekdays":[], "startDate":null, "endDate":null, "localTime":null},
  "inventory":{"dateScope":"per_occurrence|across_dates", "tierScope":"shared|allocated", "totalCapacity":10},
  "tiers":[{"id":"uuid", "name":"Adult", "description":"", "priceMinor":2000, "currency":"USD", "allocation":null}],
  "sections":[{"id":"uuid", "name":"Main", "rows":10, "seatsPerRow":10, "seats":[{"id":"uuid", "row":"A", "number":1, "accessible":false}]}],
  "occurrences":[{"id":"uuid", "startsAt":"UTC ISO", "localStart":"local ISO", "status":"scheduled"}],
  "coverImageUrl":null, "createdAt":"UTC ISO", "updatedAt":"UTC ISO"
}
```

`PublicEvent` omits organizer membership, private notes, versions, drafts and any buyer data:

```json
{
  "id":"uuid", "slug":"string", "organizer":{"slug":"string", "name":"string"},
  "title":"string", "description":"string", "type":"event|activity", "timezone":"IANA zone",
  "location":{"address":"string", "latitude":0, "longitude":0, "photoUrl":null},
  "restrictions":"string", "disclaimer":"string", "ticketFormat":"digital|paper|both",
  "coverImageUrl":null,
  "occurrences":[{"id":"uuid", "startsAt":"UTC ISO", "status":"scheduled"}],
  "tiers":[{"id":"uuid", "name":"Adult", "description":"", "priceMinor":2000, "currency":"USD", "availableDisplay":null}],
  "seatMap":{"sections":[{"id":"uuid", "name":"Main", "seats":[{"id":"uuid", "row":"A", "number":1, "accessible":false}]}]},
  "inventory":{"dateScope":"per_occurrence|across_dates", "tierScope":"shared|allocated"},
  "demoCheckout":true
}
```

`PublicEvent` seat map shows configured seats, **not availability**. `availableDisplay:null` avoids implying stock reservation or real purchases. Public catalog cards are a smaller projection (`id`, organizer slug/name, title, type, description excerpt, location label, next occurrence, starting price, image ref, `demoCheckout:true`) and do not include the full seat layout. Input string/image/geometry limits must be specified in final engineering contract before writing validators; existing clickatick draft bounds are a starting point, not automatic database constraints.

## Route phases and shapes

All writes: same-origin/CSRF protection, bounded body, server validation, role scope, idempotency key for create/import/demo checkout, expectedVersion for update. Standard result `{data,error:null}` or `{data:null,error:{code,message,fields?}}`. 400 invalid input, 401 signed out, 403 wrong member, 404 inaccessible, 409 stale version/conflict, 422 publish rule, 429 rate limit, 503 unavailable integration. Private routes must not leak whether another organizer's ID exists.

| Phase | Proposed Next.js routes | Behavior |
| --- | --- | --- |
| 1A identity | `GET /api/v1/me`, `POST /api/v1/organizers`, `GET/PATCH /api/v1/organizers/:id` | Clerk subject maps to organizer membership. Google/email provider config is an integration gate. |
| 1B create | `POST /api/v1/organizer/events/import-draft` `{draft,idempotencyKey}` → `OwnerEvent` + field warnings; `GET/POST /api/v1/organizer/events`; `GET/PATCH /api/v1/organizer/events/:id` with version | Explicit signed-in import from voice/chat. Never publish on import. |
| 1C details | child routes for venue, occurrences/schedule, tiers, inventory policy, sections/seat map, restrictions/disclaimer and media refs; `POST /api/v1/organizer/events/:id/publish` `{expectedVersion}` | Server validates location pin, schedule, quantities, tier math, seat geometry and disclaimer review. Transactional publish. |
| 1D public | `GET /api/v1/events` search/filter/page; `GET /api/v1/events/:slug` → `PublicEvent` | Published Neon events only. Legacy Blob cards/read URLs remain separately labeled. `/` and `/discover` migrate by explicit Frontend contract. |
| 2 configurations | event child routes for add-ons, bundles, passes, pricing, promos, forms, waitlist, affiliate settings, tracking, storefront style, email template drafts, analytics preview | Configuration is real and scoped; paid redemption, email sends, transfer and payout remain off. |
| 3 demo seat checkout | `POST /api/v1/events/:id/demo-quote` `{occurrenceId,items:[{tierId,quantity}],seatIds:[]}` → `{illustrativeTotalMinor,currency,seatLabels,expiresAt,demo:true}`; `POST .../demo-checkout` `{quoteId,acknowledged,idempotencyKey}` → zero-charge demo receipt | Guest chooses exact seats, server checks seat IDs belong to event and selected count, but **no hold or reservation**. Two guests may choose the same demo seat. UI/receipt must say this. No payment/admission/confirmation. |
| 4 future commerce | quote/reserve, payment provider initiation + signed webhook, order/admission ticket, digital delivery, QR check-in, transfer, affiliate accrual and payout | Disabled until new owner/provider decisions and end-to-end verification. |

## Transition and safety gates

Cutover is a release step, not a schema side effect: configure Clerk and Neon, migrate application routes, test draft import/publish/public read, then disable *new* anonymous Blob writes while keeping old URLs readable. Preserve rollback. Do not interpret Blob receipts as paid orders or upload old Supabase data. Server recalculates demo quote from persisted tiers; client prices/discounts never decide totals. Demo seat choice never changes `inventory_pool` or `event_seat`, and no button may say a seat was booked. Paid sales later require atomic per-occurrence/pooled stock and seat holds, signed payment event, idempotent fulfillment and payout ledgers.

Privacy: public projections exclude Clerk subject, organizer member IDs, buyer PII, creator hashes and private Blob paths. Guest messages/forms/waitlist need scoped access and retention before activation. Email, webhooks, translation and image generation remain separate configured services; Lovable gateway is not imported. The raw Lovable cash selector conflicts with the owner's digital-only decision and is omitted.

## Decisions still needed (PM asks one at a time)

1. Staff roles/invitations and whether one account manages multiple brands. First slice can support one owner and one organizer without prejudging a later expansion.
2. Whether demo seat selection should be persisted in a receipt or only shown in the current browser; the approved choice is exact-seat demo selection **without reservation**, but receipt persistence detail is unconfirmed.
3. Map provider and precise pin synchronization behavior; media size/retention policy; whether published event edits require immediate replacement or a reviewable revision.
4. Timing and method of legacy Blob catalog presentation/cutover. New marketplace events require sign-in; old public demo URLs remain readable.
5. Later live-sales gates: processing-fee allocation, first payment method/provider/country, EPay identity, confirmation email provider, recurring occurrence payout timing, refund/chargeback rules, affiliate attribution and fraud handling. None authorizes a live charge now.

## Evidence and review status

Prepared from the raw Lovable schema/hooks and current clickatick demo service, agreed catalog and homepage contracts, brief v91 and loaded skills. No app code, database, credentials, deployment or payment service changed. Frontend must review the exact first-slice JSON and route shapes, then PM records an agreement handoff before implementation.
