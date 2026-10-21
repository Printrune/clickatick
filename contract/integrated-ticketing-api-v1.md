# Integrated ticketing API and data contract v1 — proposal

Date: 2026-10-20. Brief `brief/project.json` v88 plus PM handoff: the full Lovable ticketing product becomes clickatick's main product; preserve the voice/chat creator, marketplace `/`, and creator `/creator`. Checkout remains a demo. Organizer sign-in with Google and email through Clerk free and a new Neon free Postgres database are approved. Numbered seating is included. No old Supabase data is imported; no payment or admission-ticket success may be claimed. This is a prospective Backend contract for Frontend/PM review, **not an implemented API or selected production configuration**. Read `team/shared-rules-v1.md`, `team/roles/backend.md`, starter `AGENTS.md`, and the Vercel `create-a-backend`, `auth`, and `vercel-storage` skills. None of those sources authorize provisioning or paid operations by themselves.

## System boundary and canonical ownership

Next.js route handlers own all mutations and public reads. Clerk verifies organizer identity on the server. Neon is the canonical relational store for the integrated catalog, inventory, seating, configuration and eventual transactions. Vercel Blob stores media and the existing isolated anonymous demo listings/receipts. The voice/chat Workspace continues to create a device draft. It imports that draft into Neon only after the organizer signs in and explicitly reviews it. Do not embed the old Vite app, point browser hooks at Neon, import the raw Supabase policies or copy its client-side checkout. The current Blob demo may remain publicly readable during migration but must have an explicit source tag; it must not masquerade as a canonical organizer event.

Identifier policy: opaque UUIDs for internal entities, stable unique slugs for public organizer and event pages, Clerk subject only in `organizer_member.clerk_user_id`. Money uses integer minor units and ISO currency. Local occurrence time is stored with an IANA timezone and resolved UTC instant; repeated activities materialize bounded occurrences before selling. Every write has a server-generated `created_at`/`updated_at`, an `expectedVersion` or idempotency key, and an audit event where relevant. Public response objects are curated projections, never raw database rows.

## Proposed canonical schema (new Neon, no old data)

| Table | Key fields and constraints | Ownership and state |
| --- | --- | --- |
| `organizer` | `id`, unique `slug`, `name`, description, brand colors, media refs, status | Business profile; no buyer/private data in public projection. |
| `organizer_member` | `(organizer_id, clerk_user_id)` unique, role enum owner/editor/viewer | Server maps verified Clerk subject to organizer. Invite and multi-user behavior need owner decision. |
| `venue` | `id`, organizer_id, address text, lat/lng numeric, photo ref, map label | Reusable attraction/business location. Require both address and exact pin before publication if this is the event location. |
| `event` | `id`, organizer_id, slug, title, description, type event/activity/transport/general, `venue_id`, separate event location/pin/photo refs, timezone, restrictions, disclaimer, ticket format, state draft/published/cancelled, `version` | Same-location flag chooses venue or separate location. Published changes need revision and public projection rules. |
| `event_occurrence` | `id`, event_id, starts_at UTC, ends_at UTC, local date/time, timezone, status, capacity pool | One-time and recurring dates. Unique occurrence identity survives schedule edits; cancellation is explicit. |
| `ticket_tier` | `id`, event_id, name, description, price_minor, currency, quantity, sort_order, sale window, eligibility note | Organizer-defined concessions. Shared versus allocated stock is an explicit event setting; no client-supplied checkout price. |
| `inventory_pool` | `id`, occurrence_id, optional tier_id, capacity, reserved, issued; nonnegative constraints | Shared pool has no tier_id. Allocated pools have tier_id. Atomic checkout later; demo reads only. |
| `venue_section` | `id`, event_id, name, rows, seats_per_row, geometry/style JSON, accessible metadata | Numbered seating is configured by organizer; geometry is bounded/validated. |
| `seat` | `id`, occurrence_id, section_id, row_label, seat_number, tier_id, status; unique occurrence/section/row/number | Canonical numbered place; section layout produces seats per occurrence. Reservations/assignments require transaction once live checkout exists. |
| `event_addon`, `ticket_bundle`, `bundle_component`, `season_pass`, `pass_event`, `pricing_rule`, `promo_code` | Organizer/event FKs, explicit eligibility, limits, version/status | Configure the imported Lovable modules. No paid redemption or entitlement until transaction phase. |
| `custom_form_field`, `waitlist_entry`, `buyer_message` | Event/order scope, bounded response types, consent/retention metadata | Guest PII private by default; no broad public read. Delivery/realtime is a later contract. |
| `affiliate_program`, `affiliate_code`, `tracking_link` | Event FK, optional enabled flag, reward basis points, code uniqueness, attribution window | Organizer funds reward from their share. A configured program alone is not an earned payout. |
| `demo_order` or existing Blob `demo_receipt` | `demo=true`, zero charged amount, selected occurrence/tier quantities, synthetic status | First integration may retain Blob receipt only. Do not conflate with live `order`, ticket or sale analytics. Exact cutover is pending. |
| Future `reservation`, `order`, `payment_attempt`, `admission_ticket`, `check_in`, `transfer`, `reward_ledger`, `delivery`, `webhook_delivery` | FKs, idempotency constraints, immutable state transitions | Schema may be reserved/migrated, but handlers remain disabled until provider and operational gates pass. |

Indexes: unique `(organizer_id, slug)` on event; unique `(event_id, occurrence local start)` for generated schedule instances; unique seat identity; unique promo/affiliate code within configured scope; FK and status indexes for public catalog. Use constraints and transactions for ownership, inventory and state changes, not only application checks. No Supabase RLS is carried forward. Neon credentials are server-only; every route derives organizer scope from Clerk, never a trusted body `organizerId`.

## Draft import and event lifecycle

1. Conversation continues to produce the existing validated clickatick draft locally. Camera snapshot never uploads; only the permitted avatar rendering persists locally. Existing optional event artwork rules remain distinct.
2. After organizer sign-in, `POST /api/v1/organizer/events/import-draft` accepts the current draft schema, a client-generated idempotency key and optional source demo listing ID. The server validates it, resolves or creates a *draft* organizer event, returns `{eventId,version,fieldWarnings}`. No automatic public publish and no old Supabase data import. The draft can be edited in dashboard without restarting voice/chat.
3. Organizer edits event, venue/pin, schedule/occurrences, tiers, shared/allocated inventory, seating, restrictions/disclaimer, and marketing settings. `PATCH` requires `expectedVersion`; stale updates return 409 with current version. Cross-record changes occur transactionally.
4. `POST .../publish` performs a complete server review, returns specific missing fields, and changes visibility only after organizer's explicit Publish action. Public event is read by slug. Existing anonymous Blob demos remain marked `demo` until any deliberate migration. No silent overwrite of a published demo or canonical record.
5. Cancellation/rescheduling creates state changes and audit records. Payment/referral consequences are deferred until live transaction policy is approved.

## Proposed HTTP surface by phase

All endpoints are proposals. Success envelope: `{data, error:null}`. Failure envelope: `{data:null,error:{code,message,fields?}}`. 400 malformed input, 401 signed-out organizer, 403 wrong organizer/role, 404 inaccessible object, 409 stale version/conflict, 422 failed publish rule, 429 bounded abuse, 503 unconfigured dependency. Never reveal whether a private ID exists across organizer boundaries. Public GETs cache only curated published fields. Mutations require same-origin/CSRF protection, bounded bodies and rate limits. Exact schema for each route must be frozen with Frontend before coding.

| Phase | Routes and request/response sketch | Status |
| --- | --- | --- |
| A — identity and organizer | `GET /api/v1/me` → memberships; `POST /api/v1/organizers` `{name,slug,idempotencyKey}` → organizer; `GET/PATCH /api/v1/organizers/:id` with expectedVersion | Clerk+Neon configuration required. Google/email sign-in approved; dashboard role model provisional. |
| B — catalog core | `POST /api/v1/organizer/events/import-draft`; `GET/POST /api/v1/organizer/events`; `GET/PATCH /api/v1/organizer/events/:id`; child routes for `venue`, `occurrences`, `tiers`, `inventory`, `sections`, `seats`; `POST .../publish`; public `GET /api/v1/events` and `GET /api/v1/events/:slug` | Full event/ticket creation, public marketplace, seating maps. Read-only public responses omit private organizer settings. |
| C — catalog extensions | child routes for add-ons, bundles, passes, promo codes, pricing rules, forms, waitlist settings, affiliates, tracking, storefront appearance and email template drafts | UI can configure without claiming redemption/delivery. Each object is organizer-scoped and versioned. |
| D — demo purchase | `POST /api/v1/events/:id/demo-quote` `{occurrenceId,items,seatIds?}` → server-calculated illustrative amount; `POST .../demo-checkout` `{quoteId,acknowledged,idempotencyKey}` → zero-charge demo receipt | No payment, inventory reservation, admission ticket, QR or delivery. Seat selection is illustrative only and clearly labeled. Existing Blob checkout remains until explicit cutover. |
| E — operations preview | `GET /api/v1/organizer/events/:id/demo-activity` and preview analytics from demo data; configuration for webhooks/email/transfer/check-in can render disabled pending capability | Never mix demo counts with sales or payouts. No external sends. |
| F — future live transactions | quote/reserve/payment initiation; signed provider webhook; order/ticket/confirmation; check-in/transfer; referral accrual/payout and outbound webhooks | **Not authorized by demo checkout decision.** Requires new owner decisions, transactional tests, provider credentials and operational review. |

The current `readDemoCatalog()` (Blob, 20 bounded slots, small public projection) is a bridge for `/` and `/discover`. A Neon public catalog cannot silently replace it; route consumers and card shapes need an agreed migration contract. During overlap, de-duplicate by explicit source/id mapping and label legacy demos. Do not display a combined “tickets sold” number.

## Security and service gates

- Clerk verifies the request on the server. Google/email methods are approved, but exact Clerk configuration and free-plan availability must be verified before calling sign-in connected. Auth callback and environment secrets are server-only.
- Neon is approved as the *new* database. Provisioning, connection pooling, migration and backup limits need verification. No raw Supabase service role, URL, data or RLS policy is reused.
- The raw Lovable `useCheckout.ts` trusts client price/discount and confirms non-cash orders without processor evidence. Its multi-call order/ticket/inventory sequence is non-atomic. Its broad anonymous inserts and `USING (true)` reads on tickets and buyer-linked tables are rejected.
- Later paid checkout requires server-computed quote, atomic stock/seat hold, short reservation expiry, signed payment webhook, idempotent fulfillment, accurate refund/chargeback handling, and anti-self-referral controls. A “Pay” button alone never means payment occurred.
- Buyer PII, chat, forms, transfers and tickets need minimum-field read contracts, retention and abuse controls. Public QR lookup must not expose a raw ticket row. Digital confirmation needs a delivery provider and monitored retry path.
- Lovable translation gateway and key are removed; optional translation goes through a separately approved AI adapter with the USD 10 total test cap and no automatic top-ups.

## Owner decisions still needed (PM asks one at a time)

1. **Immediate:** should the new Neon catalog replace anonymous Blob publishing on day one after sign-in, or should anonymous demo publishing remain available alongside the signed-in organizer catalog? The owner approved organizer sign-in but has not explicitly resolved the old anonymous publishing path.
2. For numbered seating, should customers be allowed to select exact seats in the *demo*, or should only organizers configure and preview the map until paid checkout is real? No seat may be represented as reserved without a transactional hold.
3. Is ticket inventory per event occurrence or shared across all dates for recurring activities? The current draft supports shared versus allocated *tier* pools but not a cross-date stock rule.
4. Does one organizer account support multiple staff roles/invites and multiple brands? Proposed `organizer_member` permits it, but UI and permissions need approval.
5. Which map provider and expected pin-sync behavior? Which business/venue photo storage and public retention rules? Exact third-party processing fee allocation and any guest surcharge remain unresolved.
6. Later live-sales decisions: first payment provider/method/country, exact EPay identity, buyer email provider, cancellation/refund/legal text, affiliate attribution window and payout timing for repeated occurrences. None blocks demo-only catalog work.

## Review and evidence

This contract reflects source-level audit of raw Lovable `src/pages`, dashboard/storefront components and hooks, Supabase migrations and translate function, and current clickatick `lib/demo-service.mjs`, `lib/listing.mjs`, `app/api/demo/...` routes. Read-only proposal. No code, schema, secrets, external services or live customer data changed. Frontend and Backend must explicitly agree final route shapes, field schemas and file ownership in a versioned handoff before implementation.
