# Integrated ticketing API and data contract v3 — prospective

Date: 2026-10-20. Shared brief `brief/project.json` v92. This supersedes v2 where decisions changed. The entire Lovable feature set is the target main product, with clickatick conversational creation retained. The marketplace is `/`, creator is `/creator`, and checkout remains a zero-charge demonstration. Approved: organizer sign-in via Google and email using Clerk free, fresh Neon free Postgres, sign-in before publishing **new marketplace events**, exact seat choice in the demo **without reservation**, a creator choice of inventory separate per occurrence or shared across dates, staff invitations, and multiple brands. No old Supabase data, live payment, admission ticket or confirmation delivery is assumed. This contract is for PM/Frontend review before implementation; it does not provision services or change code.

## Canonical source and transition

Neon is canonical for new organizer, venue, event, occurrence, tier, inventory and seating data. Clerk authenticates an organizer on the server. New marketplace publication requires a verified Clerk session and organizer ownership. The current anonymous Blob demo publishing endpoint is a **legacy migration path only**: stop accepting *new* anonymous publishes at the cutover, but do not disable it until the replacement is tested and the PM schedules the release. Existing Blob listing and receipt reads remain available at their URLs with a visible demo label. Existing 20-slot Blob catalog can be shown as a separate legacy collection during transition; it must never be silently represented as a Neon event. Conversation drafts remain local until an organizer signs in and explicitly imports/reviews them.

Vercel Blob continues to hold images and existing demo records. Neon stores media references, not data URLs. All mutations use Next.js route handlers and server-only DB credentials. No raw Supabase client hook, policy, account or data is reused. Money is integer minor units plus ISO currency, identifiers are UUIDs, timestamps are UTC plus IANA event timezone, and every private write derives organizer ID from the verified Clerk subject rather than a body field.

## Canonical schema and invariants

| Table | Required core fields | Constraint / ownership |
| --- | --- | --- |
| `organizer` | `id`, `slug`, `name`, profile text, media refs, status, version | Unique slug; public profile projection only. |
| `organizer_member` | `organizer_id`, `clerk_user_id`, role (`owner|editor|viewer`), status, joined_at | Unique pair. One Clerk user may belong to many organizer brands. Every brand must retain at least one owner. |
| `organizer_invitation` | `id`, organizer_id, invited_email, role, token_hash, expires_at, accepted_at, revoked_at, invited_by | One-time, expiring invitation. The raw token is never stored or shown after creation. Acceptance requires verified Clerk email matching the invitation. Email sending is not assumed. |
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

`OwnerEvent` returned to a verified owner/editor; a viewer receives the same event facts but no edit capability. The response includes effective permissions rather than trusting the browser to infer them:

```json
{
  "id":"uuid", "organizerId":"uuid", "slug":"string", "state":"draft|published|cancelled", "version":1,
  "permissions":{"read":true,"edit":true,"publish":false,"manageMembers":false},
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

`PublicEvent` omits organizer membership, invitations, private notes, versions, drafts and any buyer data:

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
| 1A identity/brands | `GET /api/v1/me` → `{userId,brands:[{id,slug,name,role,permissions}]}`; `POST /api/v1/organizers` `{name,slug,idempotencyKey}` → brand+owner membership; `GET/PATCH /api/v1/organizers/:id` | Clerk subject maps to one or more organizer memberships. Brand context is an explicit organizer ID in route, checked on every request. |
| 1A invitations | `GET/POST /api/v1/organizers/:id/invitations` (owner only) `{email,role,idempotencyKey}` → metadata + one-time invitation URL; `DELETE .../invitations/:inviteId` (owner); `POST /api/v1/invitations/accept` `{token}` after sign-in | Store token hash, expiry and single-use state; verified Clerk email must match. No automatic email delivery until configured. Avoid revealing membership or email to public endpoints. |
| 1B create | `POST /api/v1/organizer/events/import-draft` `{draft,idempotencyKey}` → `OwnerEvent` + field warnings; `GET/POST /api/v1/organizer/events`; `GET/PATCH /api/v1/organizer/events/:id` with version | Explicit signed-in import from voice/chat. Never publish on import. |
| 1C details | child routes for venue, occurrences/schedule, tiers, inventory policy, sections/seat map, restrictions/disclaimer and media refs; `POST /api/v1/organizer/events/:id/publish` `{expectedVersion}` | Server validates location pin, schedule, quantities, tier math, seat geometry and disclaimer review. Transactional publish. |
| 1D public | `GET /api/v1/events` search/filter/page; `GET /api/v1/events/:slug` → `PublicEvent` | Published Neon events only. Legacy Blob cards/read URLs remain separately labeled. `/` and `/discover` migrate by explicit Frontend contract. |
| 2 configurations | event child routes for add-ons, bundles, passes, pricing, promos, forms, waitlist, affiliate settings, tracking, storefront style, email template drafts, analytics preview | Configuration is real and scoped; paid redemption, email sends, transfer and payout remain off. |
| 3 demo seat checkout | `POST /api/v1/events/:id/demo-quote` `{occurrenceId,items:[{tierId,quantity}],seatIds:[]}` → `{illustrativeTotalMinor,currency,seatLabels,expiresAt,demo:true}`; `POST .../demo-checkout` `{quoteId,acknowledged,idempotencyKey}` → zero-charge demo receipt | Guest chooses exact seats, server checks seat IDs belong to event and selected count, but **no hold or reservation**. Two guests may choose the same demo seat. UI/receipt must say this. No payment/admission/confirmation. |
| 4 future commerce | quote/reserve, payment provider initiation + signed webhook, order/admission ticket, digital delivery, QR check-in, transfer, affiliate accrual and payout | Disabled until new owner/provider decisions and end-to-end verification. |

## Membership and brand authorization

Each brand is one `organizer` row, not a color variant of a shared organization. A user may be owner of one brand and editor/viewer of another. The server resolves `(Clerk subject, organizer ID)` for **every** private read and write; the current brand selected in UI is presentation state only. `owner` may update brand profile, create/publish/cancel events, invite/revoke members and assign roles. `editor` may draft and edit events, tiers, locations, seating and marketing settings, but cannot publish/cancel or change members. `viewer` may read the organizer dashboard only. Public event reads require published state and no membership. The last owner cannot leave, be removed or demoted. Brand slugs and public event slugs must remain unique in their stated scopes.

Invitation creation returns a one-time URL for the owner to share manually; sending email requires a separately configured provider. Store only token hash, bind the invite to normalized verified email and intended brand/role, expire after a bounded time (proposed seven days), revoke on demand, and consume atomically with membership insertion. Reinvitation and role changes are idempotent/audited. No unauthenticated acceptance can create a membership. The PM should confirm the proposed editor publish restriction, invitation expiry, and whether manual sharing is acceptable before this contract is frozen.

## Transition and safety gates

Cutover is a release step, not a schema side effect: configure Clerk and Neon, migrate application routes, test draft import/publish/public read, then disable *new* anonymous Blob writes while keeping old URLs readable. Preserve rollback. Do not interpret Blob receipts as paid orders or upload old Supabase data. Server recalculates demo quote from persisted tiers; client prices/discounts never decide totals. Demo seat choice never changes `inventory_pool` or `event_seat`, and no button may say a seat was booked. Paid sales later require atomic per-occurrence/pooled stock and seat holds, signed payment event, idempotent fulfillment and payout ledgers.

Privacy: public projections exclude Clerk subject, organizer member IDs, buyer PII, creator hashes and private Blob paths. Guest messages/forms/waitlist need scoped access and retention before activation. Email, webhooks, translation and image generation remain separate configured services; Lovable gateway is not imported. The raw Lovable cash selector conflicts with the owner's digital-only decision and is omitted.

## Decisions still needed (PM asks one at a time)

1. **Map provider and precise pin synchronization behavior** (PM's current question); media size/retention policy; whether published event edits require immediate replacement or a reviewable revision.
2. Role details: may editors publish/cancel, or is that owner-only as proposed? Is manually shared invitation link acceptable until email delivery is configured? Confirm invitation expiry (proposed seven days).
3. Whether demo seat selection should be persisted in a receipt or only shown in the current browser; the approved choice is exact-seat demo selection **without reservation**, but receipt persistence detail is unconfirmed.
4. Timing and method of legacy Blob catalog presentation/cutover. New marketplace events require sign-in; old public demo URLs remain readable.
5. Later live-sales gates: processing-fee allocation, first payment method/provider/country, EPay identity, confirmation email provider, recurring occurrence payout timing, refund/chargeback rules, affiliate attribution and fraud handling. None authorizes a live charge now.

## Evidence and review status

Prepared from the raw Lovable schema/hooks and current clickatick demo service, agreed catalog and homepage contracts, brief v92 and loaded skills. No app code, database, credentials, deployment or payment service changed. Frontend must review the exact first-slice JSON and route shapes, then PM records an agreement handoff before implementation.
