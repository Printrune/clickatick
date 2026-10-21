# Integrated ticketing API v4 — prospective first working slice

Date: 2026-10-20. Brief `brief/project.json` v93. Revises v3 after Frontend review `integration/contract/integrated-frontend-review-v1.md`; **not approved for implementation until Frontend and Backend agree the final fields and PM records the handoff**. Destination remains the full Lovable ticketing product with clickatick conversation, marketplace `/`, creator `/creator`, fresh Neon, Clerk Google/email organizer sign-in, multiple brands/staff, and demo-only buyer checkout. New marketplace events require sign-in. Google Maps is approved for the map prototype, with a free public map-link fallback. No old Supabase data, real payment, admission ticket or email delivery is implied.

## Source and release boundary

Neon is canonical for **new** signed-in organizer events. Existing Blob demo listings/receipts remain readable at `/listing/[id]` and `/receipt/[id]`, explicitly marked legacy demo. The anonymous Blob publish endpoint remains operational until a tested cutover, then becomes read-only; do not disable it merely by creating schema. Canonical public event URLs use immutable UUID `/events/[id]`; organizer and event slugs are display/search metadata, never public API identity. This avoids collisions across brands and protects URLs when names change. The marketplace may show a separately labeled legacy collection, but Neon events enter public `/` and `/discover` **only after** the complete Neon detail → demo quote → exact-seat selection → zero-charge shareable receipt journey passes browser/API/data checks. No information-only interim public listing is assumed.

First delivery is split into private phases A/B, then public phase C. Phase A/B never disrupts the current public Blob journey. Phase C is one release gate, not a page-by-page exposure.

## Canonical schema for the first slice

All IDs are UUID; money is integer minor units + ISO currency; timestamps are UTC with IANA event timezone. Store server-only Neon connection and Blob access. Every private query derives the Clerk subject from the verified request and checks `(organizer_id, clerk_user_id)` membership. Route organizer ID selects a brand, **not authority**.

| Entity | Core fields / invariant |
| --- | --- |
| `organizer` | `id`, unique slug, name, profile, brand media refs, version, status. One Clerk account may own/join many brands. |
| `organizer_member` | unique organizer/Clerk subject, role owner/editor/viewer, joined/disabled state. Every brand retains at least one owner. Role mutation policy awaits owner answer. |
| `organizer_invitation` | organizer, invited verified email, proposed role, hashed single-use token, expiry, revoked/accepted timestamps, inviter. No raw token stored; sending provider not assumed. Invitation behavior is gated by pending role/link decisions. |
| `venue` | organizer, name, address, lat/lng, private photo asset ID. Event may reuse venue or own address/pin/photo. |
| `event` | organizer, UUID, slug, type event/activity, title, description, timezone, venue reference, location mode, restrictions, disclaimer/reviewed flag, ticket format, draft/published/cancelled state, version, cover asset ID. Unique organizer/slug. |
| `event_occurrence` | event, stable ID, local start/end, UTC start/end, timezone, scheduled/cancelled state. One-time or bounded weekly generated dates. |
| `ticket_tier` | event, stable ID, name, description/concession, price minor, currency, sale window, optional allocation, seat selection policy, sort order. Exact seat policy needs owner confirmation before Phase C. |
| `inventory_policy` + `inventory_pool` | Creator chooses date scope `per_occurrence|across_dates` and tier scope `shared|allocated`; pools are `(event, optional occurrence, optional tier)` with nonnegative capacity. Phase C demo never decrements, holds or issues stock. |
| `venue_section` + `event_seat` | section geometry and unique event/section/row/number seat IDs; accessibility flag and optional tier compatibility. Configured seats are selectable in demo, never labelled available/reserved/sold. |
| `media_asset` | private Blob path, owner organizer, MIME, byte length, alt text, creation/retention state. Public routes use IDs and server delivery, never private Blob paths. |
| `demo_quote` + `demo_receipt` | quote ID/expiry, event+occurrence+items+seat IDs, server-calculated illustrative amount; receipt stores selected seat IDs **and** labels, zero charged, `demo=true`, no buyer name/email. Persistence of seat selections in the shareable receipt is proposed and awaits owner confirmation. |

Later catalog modules (add-ons, bundles, passes, promo/pricing, waitlist, custom forms, messages, tracking/affiliate settings, email template drafts, analytics/webhook/scan previews) get separate contracts after this core buyer path. Future live reservation/order/payment/admission/QR/referral payout tables are out of scope. The raw Lovable client checkout, cash option and permissive Supabase policies are rejected.

## Exact private DTOs and route shapes — Phase A/B

All private event routes include `/api/v1/organizers/{organizerId}/events`. `GET /api/v1/me` returns `{userId,brands:[{id,slug,name,role,permissions}]}`; for a zero-brand user `brands:[]` and `nextAction:"create-organizer"`. After `POST /api/v1/organizers` `{name,slug,idempotencyKey}`, return `{organizerId,redirectTo:"/dashboard/{organizerId}"}`. A brand switch changes route context; the server rechecks membership. No global active brand cookie is trusted.

`EventDraftInput` is the single canonical payload used by manual create and conversation import. It is a JSON object with these required top-level keys (blank values allowed in a draft):

```json
{
 "title":"", "description":"", "type":"event", "timezone":"America/New_York",
 "venue":{"id":null,"name":"","address":"","latitude":null,"longitude":null,"photoAssetId":null},
 "sameLocation":true,
 "eventLocation":null,
 "restrictions":"", "disclaimer":"", "disclaimerReviewed":false, "ticketFormat":"digital",
 "schedule":{"kind":"dates","dates":[],"startDate":null,"endDate":null,"weekdays":[],"localTime":null,"durationMinutes":60},
 "inventory":{"dateScope":"per_occurrence","tierScope":"shared","totalCapacity":null},
 "tiers":[], "sections":[], "coverAssetId":null
}
```

`eventLocation` is null when `sameLocation=true`; otherwise it has the venue address/pin/photo shape without `id`. Tier input: `{id?:UUID,name,description,priceMinor:number|null,currency:"USD",allocation:number|null,seatPolicy:"none|optional|required"}`. Section input: `{id?:UUID,name,rows:1..100,seatsPerRow:1..100,seats:[{id?:UUID,row,number,accessible,tierId:null|UUID}]}`. IDs may be omitted for new child rows; the server returns stable IDs. `schedule.dates` are local `YYYY-MM-DDTHH:mm` strings, at most 50; a weekly rule is bounded to at most one year. Current draft mapper limits title to 200, description 4,000, tier count to 10 and capacity to 1,000,000; final validators must also bound total seat count and image bytes before coding. Unknown keys are rejected. The import mapper preserves title, dates/weekly rule, tiers/prices, venue pin, restrictions, disclaimer, ticket format and inventory choices. A local data-URL cover image is **not** copied into Neon; it yields a field warning until uploaded to private media storage.

| Route | Request | Success response |
| --- | --- | --- |
| `POST /api/v1/organizers/{org}/events` | `{draft:EventDraftInput,idempotencyKey:UUID}` | `{event:OwnerEvent,warnings:[]}` draft state, 201 |
| `POST .../events/import-draft` | `{draft:LegacyClickatickDraft,idempotencyKey:UUID}` | `{event:OwnerEvent,warnings:[{path,code,message}]}` draft state, 201 |
| `GET .../events` | no body, cursor/limit bounded | `{events:OwnerEventSummary[],nextCursor}` |
| `GET .../events/{id}` | no body | `{event:OwnerEvent}` |
| `PATCH .../events/{id}` | `{expectedVersion:number,changes:Partial<EventDraftInput>}` | `{event:OwnerEvent,warnings:[]}` with version increment |
| `POST .../events/{id}/publish` | `{expectedVersion:number,idempotencyKey:UUID}` | `{event:OwnerEvent,publicUrl:"/events/{id}"}` |

PATCH is a **top-level merge**: absent key leaves the stored field unchanged; a supplied nested object or array replaces that whole field after full validation; null clears only optional `eventLocation`, asset IDs and optional tier allocation. Empty strings are permitted while draft but may fail publish validation. Child IDs not present in replacement arrays are removed only within the same database transaction. Frontend must send the latest `expectedVersion`; stale version returns 409 with `{currentVersion}`. Import/create/publish idempotency keys are scoped to organizer+route+Clerk subject and store request hash+response for a bounded retention period (proposed 24 hours). Same key+same body replays original response without another event; same key+different body returns 409. The server stores the draft transactionally and returns it without auto-publishing. Cancelled sign-in or failed import leaves the browser draft intact.

`OwnerEvent` returns event ID, organizer ID, version/state, all canonical draft fields with server-assigned child IDs, occurrence projections, timestamps and an effective `permissions` object. `permissions` is server-computed from membership, but exact publish/cancel rights are **pending owner decision**; Frontend may render gated placeholders, not final active controls, until frozen. Publish validates venue or event address+pin, schedule, tier price/currency, stock policy and capacities, seat geometry, restrictions/disclaimer review where applicable, media ownership and field consistency; returns 422 `{fields:[{path,code,message}]}` with no state change if incomplete. Creation/import/edit routes do not require publish-ready fields.

## Public models and complete Phase C demo buyer path

`GET /api/v1/events?type=&q=&cursor=&limit=` returns published Neon `PublicEventCard[]`; `GET /api/v1/events/{id}` returns `PublicEvent` by immutable UUID. The public model exposes title/description/type, organizer name/slug, timezone, public address+pin, restrictions/disclaimer, published cover/media URL, scheduled occurrences, ticket names/server prices/currency, inventory policy labels, configured seat map and `demoCheckout:true`. It excludes Clerk IDs, membership, raw media paths, drafts, buyer data and stock counters. Cards omit the full seat map. Legacy Blob events remain under `/listing/[id]`, separate from Neon cards. Text search is bounded and case-insensitive; cursor pagination uses a stable published timestamp+UUID pair.

Public media route: `GET /api/v1/media/events/{eventId}/{kind}` where kind is `cover|venue|location`. The server loads a **published** event and its approved image asset, verifies MIME/size and serves only the image bytes with safe content type and cache policy. Missing/unapproved asset returns a branded placeholder or 404; public objects never receive a private Blob pathname or data URL. Owner preview uses a separate authenticated endpoint. Alt text derives from organizer-supplied asset alt text or a neutral event/location description. Google Maps prototype uses stored lat/lng and address; provide an external Google Maps link and a free public map-link fallback when an embedded map or quota is unavailable. Map provider keys are server/config scoped, never embedded as secret client credentials.

`POST /api/v1/events/{id}/demo-quote` request:

```json
{"occurrenceId":"uuid","items":[{"tierId":"uuid","quantity":2}],"seatIds":["uuid","uuid"]}
```

Response: `{quoteId,expiresAt,currency,illustrativeTotalMinor,items:[{tierId,name,quantity,unitPriceMinor,lineTotalMinor}],seats:[{id,section,row,number}],notice:"Demo only. Seats are not reserved. No payment is taken."}`. Server rejects duplicate/foreign seats, seats incompatible with the selected tier, and selected-seat count that violates the tier's seat policy. It recalculates price and confirms occurrence belongs to published event. **Configured** means a seat exists in the organizer map; **selected** means this browser included it in the quote. Neither state means available, held, sold or guaranteed. The same configured seat can be selected by another demo guest. Inventory scope labels are shown, but demo checkout does not decrement either per-occurrence or across-dates pools.

`POST /api/v1/events/{id}/demo-checkout` request `{quoteId,acknowledged:true,idempotencyKey:UUID}` returns `{receiptId,publicUrl,demo:true,chargedMinor:0}`. Receipt shows selected tier/occurrence and, **if owner approves persistence**, selected seat IDs/labels, plus an explicit no-reservation/no-admission notice. No name, email, card, wallet, address or other guest PII is collected. The route creates no admission ticket, no payment attempt, no confirmation email and no affiliate reward. It may return a shareable receipt only after the seat-persistence decision is recorded; otherwise retain selections in the current browser and do not promise a shareable seat detail.

## Error, security and release contract

Responses use `{data,error:null}` or `{data:null,error:{code,message,fields?}}`. Status: 400 invalid JSON/fields, 401 signed out, 403 role denied, 404 inaccessible object (same response for another brand's ID), 409 version/idempotency conflict, 422 publish/quote rule, 429 abuse limit, 503 unconfigured Clerk/Neon/Blob. Never trust body-supplied organizer ID, price, fee, discount, stock or sale state. POST/PATCH require same-origin/CSRF protection, bounded bodies and rate limits. Neon transactions guard child replacement and publication; idempotency rows have unique scoped keys. Private media upload validates type, bytes, owner and path. Public routes use curated fields. All guest actions remain demo-only.

Release sequence: A) connect and verify Clerk/Neon plus brand-aware drafts privately; B) add complete event/venue/tier/schedule/inventory/seating editor and explicit publish behind signed-in dashboard; C) add public event detail, configured-seat demo quote/checkout/receipt and media delivery; browser-test desktop/mobile/keyboard, then switch marketplace catalog to Neon with separate legacy demos and disable new anonymous Blob writes. Keep rollback and legacy reads. Subsequent modules (promo/affiliate configuration, add-ons/passes, waitlist/forms, messaging/email drafts, analytics and scanning previews) require separate scoped contracts. Live sales require a new provider/transaction/privacy contract and owner approval.

## Decisions still needed, asked by PM one at a time

1. **Role rights/invitations:** may editors publish/cancel, or owner only? How are invitation links shared and how long do they last? Until answered, membership schema is prospective and final publish/invite UI is gated.
2. **Demo receipt seats:** persist chosen seat IDs/labels on a shareable receipt or show them only in this browser? No reservation in either case.
3. **Seat policy:** may an event mix seated and unseated tiers, and can accessible seats be selected by any guest or only on explicit request? This determines quote validation and publish rules.
4. **Published edits/media:** immediate change or reviewable revision, upload size/retention, and whether venue photo can be reused across brands.
5. **Legacy cutover timing:** exact release when new anonymous Blob publishing stops and legacy catalog presentation after Neon launch.
6. Later live-sales choices: processor fees, first provider/method/country, EPay identity, email delivery, cancellation/refunds, recurring reward timing and affiliate fraud rules. No real charge is authorized.

## Evidence and status

Source basis: raw Lovable schema/hooks, existing clickatick demo routes and validation, integrated v3 proposal, Frontend v1 review and brief v93. Loaded backend role/shared rules and relevant Vercel backend/auth/storage skills in this workstream. This is prospective architecture only. No app code, DB migration, external service, secret or deployment changed.
