# Integrated ticketing Phase A2 — organizer event drafts and conversation import

Date: 2026-10-20. Prospective contract under `brief/project.json` v93, for Frontend/Backend review **before code**. A1's Clerk identity, Neon brand ownership, `{data,error}` envelope and `/dashboard/{organizerId}` route remain the base. Approved destination is the complete ticketing system; clickatick's voice/chat creator remains `/creator`. New marketplace publication requires sign-in, but **A2 does not publish**. The current public Blob demo and zero-charge checkout remain unchanged until a complete Neon buyer path is ready. Multiple brands/staff, creator-chosen per-occurrence/across-dates inventory, numbered seating, required organizer venue address/photo/pin, optional separate event location with its own photo/pin, ticket tiers, restrictions and disclaimer are in the data model. No real payment or admission ticket is added.

## A2 user flow and ownership

Organizer selects a brand, then creates an empty draft manually or imports their current local conversation draft after sign-in. Both paths return the **same** `OwnerDraft` and editor. An import never publishes; review and later Publish are separate. If sign-in, upload or import fails, the browser keeps the original conversation draft. Each private route includes `/api/v1/organizers/{organizerId}`; the server verifies an active Clerk membership for that organizer. A route ID selects brand context, not authority. A1 has only owner memberships; editor/viewer draft rights and invitation behavior remain gated until the PM records the role decision. No browser-supplied organizer ID is trusted.

## Neon migration 002

Use the existing fresh A1 `organizers`, `organizer_members` and `request_idempotency` tables. Add:

```sql
CREATE TABLE organizer_event_drafts (
  id uuid PRIMARY KEY,
  organizer_id uuid NOT NULL REFERENCES organizers(id) ON DELETE CASCADE,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  draft jsonb NOT NULL,
  source text NOT NULL CHECK (source IN ('manual','conversation')),
  created_by_clerk_user_id text NOT NULL,
  updated_by_clerk_user_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT draft_object CHECK (jsonb_typeof(draft) = 'object')
);
CREATE INDEX organizer_event_drafts_brand_updated
  ON organizer_event_drafts (organizer_id, updated_at DESC, id);

CREATE TABLE organizer_media_assets (
  id uuid PRIMARY KEY,
  organizer_id uuid NOT NULL REFERENCES organizers(id) ON DELETE CASCADE,
  private_blob_path text NOT NULL UNIQUE,
  mime text NOT NULL CHECK (mime IN ('image/jpeg','image/png','image/webp')),
  byte_length integer NOT NULL CHECK (byte_length BETWEEN 1 AND 2097152),
  alt_text text NOT NULL DEFAULT '',
  state text NOT NULL DEFAULT 'ready' CHECK (state IN ('ready','deleted')),
  created_by_clerk_user_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX organizer_media_assets_brand ON organizer_media_assets(organizer_id, id);
```

This is a **private draft snapshot**, not the final live-order schema. The server validates every snapshot on create/read/update, generates stable child UUIDs, and keeps the API shape independent of JSONB storage. Later catalog migration normalizes events, tiers, occurrences, seat layouts and stock in a separate agreed contract; A2 does not silently turn draft JSON into public inventory. No Lovable/Supabase table or data is imported. A2's list is a real query over `organizer_event_drafts`, replacing A1's “Event management is being connected” setup state with an actual draft-empty/list state for that brand.

## Exact canonical `EventDraftInput`

All keys below are required on **create**; incomplete values are allowed while a draft. Unknown keys are rejected. Money is integer USD cents, not browser-provided checkout price. Lat/lng are numbers or null. Asset IDs refer only to media owned by this brand. Child IDs are optional on create/import and returned stable by the server. An optional separate event location uses the same location shape as the business venue but no reusable `id`.

```json
{
 "title":"", "description":"", "type":"event", "timezone":"America/New_York",
 "businessLocation":{"name":"","address":"","latitude":null,"longitude":null,"photoAssetId":null},
 "sameLocation":true,
 "eventLocation":null,
 "coverAssetId":null,
 "schedule":{"kind":"dates","dates":[],"startDate":null,"endDate":null,"weekdays":[],"localTime":null,"durationMinutes":60},
 "inventory":{"dateScope":null,"tierScope":"shared","totalCapacity":null},
 "tiers":[],
 "seating":{"enabled":false,"sections":[]},
 "ticketFormat":"digital",
 "restrictions":"","disclaimer":"","disclaimerReviewed":false,"refundPolicy":"",
 "supportiveMessage":false,
 "referrals":{"enabled":false,"percentageBasisPoints":null},
 "paymentPreferences":[]
}
```

`eventLocation` must be null when `sameLocation=true`; otherwise `{name,address,latitude,longitude,photoAssetId}`. `inventory.dateScope` is `null|per_occurrence|across_dates`: null is allowed for a draft imported from an older source that never asked the creator this choice, and later publication requires a non-null selection. A tier is `{id?:UUID,name,description,priceMinor:null|integer,currency:"USD",allocation:null|integer,seatPolicy:"none|optional|required"}`. A section is `{id?:UUID,name,rows:1..100,seatsPerRow:1..100,seatTierId:null|UUID,accessibleSeats:[{row:number,number:number}]}`; it describes a configured map, not reserved or sold seats. At most 10 tiers and 50 individual dates. Weekly schedules have `startDate`, `endDate`, `weekdays` 0–6, `localTime`, and a maximum one-year expansion. Title ≤200 characters, description/restrictions/disclaimer/refundPolicy ≤4,000 each, address ≤200, capacity 1–1,000,000 when present, price 0–10,000,000 cents. The total seat count and JSON body have explicit bounds before implementation (proposed ≤10,000 configured seats and ≤256 KiB body). A2 can save blank title/location/tier values; later publication cannot.

The business location's address **and exact pin and photo** are required before later publication. If `sameLocation=false`, the separate event location also needs address, pin and photo before publication. A2 may save an incomplete venue and return field warnings. `dateScope` always stores the creator's explicit `per_occurrence|across_dates` choice; `tierScope` stores `shared|allocated` separately. A2 changes no stock counters. Google Maps prototype links can use the stored pin; a free public map-link fallback remains available. Do not claim an embedded map or geocoding synchronized an address unless verified.

## Conversation import mapping

`POST .../events/import-draft` accepts the **existing** `parseListing`-compatible clickatick draft as `sourceDraft`, validates it at the boundary, and maps it to `EventDraftInput`:

- `title,type,description,timezone,duration,schedule` map directly, preserving individually entered dates and weekly rule.
- `setup.business` maps address/lat/lng to `businessLocation`; `setup.sameLocation` selects the effective location; `setup.eventLocation` maps the separate location when selected.
- `ticketTiers` map IDs, names, descriptions, decimal price strings to exact integer cents, and quantity to tier allocation. `capacity` maps to `inventory.totalCapacity`. If no tiers exist, create one stable General admission tier from legacy `price`/`capacity` and return its assigned ID. Shared-tier mode keeps each tier allocation null while retaining the total capacity.
- `setup.inventoryMode` maps to `tierScope`; new `dateScope` is **not inferred** from schedule. Import uses `null` for `dateScope` until the organizer chooses it, and returns a warning at `inventory.dateScope`. A2 may save this incomplete draft; later publication requires the choice.
- `setup.restrictions`, `disclaimer`, `disclaimerReviewed`, `refundPolicy`, `supportiveMessage`, `referrals`, `paymentPreferences`, and `ticketFormat` are preserved as draft configuration. Convert the referral percentage string exactly to integer basis points; blank remains null. Payment preferences do not activate methods; referral settings do not accrue rewards.
- Legacy inline venue photos and scene cover data URLs are **never written to Neon JSONB**. The mapper sets corresponding asset IDs null and returns field warnings telling the organizer to upload them. The device source draft stays available until the import and required uploads are confirmed. If a location address changes, imported pin is kept only if it still belongs to that address under existing clickatick merge rules; the server does not invent coordinates.

Import output `warnings` is an array of `{path,code,message}` with paths such as `businessLocation.photoAssetId`, `eventLocation.photoAssetId`, `coverAssetId`, `inventory.dateScope`. Warnings are information about incomplete draft fields, not a publish verdict. A2 never silently discards a source field; if it cannot represent one, return `UNMAPPED_FIELD` with its path and keep it in the browser draft rather than claiming successful full import.

## Endpoints and response models

All private paths use `/api/v1/organizers/{organizerId}/events`. All responses use A1's `{data,error}` envelope and `Cache-Control: no-store`. `OwnerDraft` is `{id,organizerId,version,source,draft:EventDraftInput,createdAt,updatedAt,permissions:{read,edit,publish:false}}`; permissions are server-derived, and `publish:false` is literal for all A2 users. List items are `{id,title,type,updatedAt,version,source,completeness:{missingCount}}`; missingCount is calculated from draft validation and never implies publication. A2 does not return public event URLs.

| Method/path | Exact request | Success |
| --- | --- | --- |
| `GET /api/v1/organizers/{org}/events?cursor=&limit=` | No body. Limit 1–50, default 20; cursor is opaque stable `(updatedAt,id)` pair. | 200 `{drafts:OwnerDraftSummary[],nextCursor:null|string}`. Empty array is real. |
| `POST /api/v1/organizers/{org}/events` | `{draft:EventDraftInput,idempotencyKey:UUID}` | 201 `{event:OwnerDraft,warnings:[...]}`. Same key+same canonical body replays **201 and same ID/body**. |
| `POST /api/v1/organizers/{org}/events/import-draft` | `{sourceDraft:LegacyClickatickDraft,idempotencyKey:UUID}` | 201 `{event:OwnerDraft,warnings:[...]}`. No public side effect. |
| `GET /api/v1/organizers/{org}/events/{eventId}` | No body. | 200 `{event:OwnerDraft}`. Other brand ID is 404. |
| `PATCH /api/v1/organizers/{org}/events/{eventId}` | `{expectedVersion:integer,changes:Partial<EventDraftInput>}` | 200 `{event:OwnerDraft,warnings:[...]}` with version +1. |

PATCH is a **top-level merge**: absent keys stay unchanged; provided nested object/array replaces the entire nested value; `null` clears only optional location/media/allocation fields as specified. Unknown keys reject 400. Validate the entire merged draft and media ownership in one transaction. A stale `expectedVersion` returns 409 `VERSION_CONFLICT` with `currentVersion` in the error (no write). If `changes` does not alter the canonical draft, return the current event/version without a write. Updating a section/tier list preserves provided stable IDs, assigns IDs to new rows, and removes omitted children from the draft snapshot only. There is no public stock or admission effect.

Idempotency scopes include Clerk subject, organizer ID and operation (`create` or `import`); request hash covers the normalized body. The existing A1 `request_idempotency` table stores safe response JSON and a unique `(scope,key)`. A replay with a different body returns 409 `IDEMPOTENCY_CONFLICT`. Retries reuse the same key until the canonical body changes. A create/import transaction stores the snapshot and idempotency response atomically. Do not trust the `organizerId` route alone: require active membership and write permission. Role details remain pending; A2 can initially allow only owner writes and mark editor/viewer controls unavailable until approved.

Status: 400 malformed body/field/oversize, 401 signed out, 403 inactive member or insufficient role, 404 nonmember/missing event with indistinguishable response, 409 idempotency/version conflict, 413 media too large, 429 rate limit, 503 Clerk/Neon/Blob unconfigured or unavailable. Error shape `{data:null,error:{code,message,fields?:[{path,code,message}],currentVersion?}}`. No private draft or media path appears in a public response.

## Private media boundary (A2)

`POST /api/v1/organizers/{org}/assets` accepts one image as multipart binary with `altText` and `kind=venue|event-location|cover`; maximum 2 MiB input; JPEG/PNG/WebP only, verify signature and dimensions, normalize orientation and re-encode to a safe image. It writes a **private** Vercel Blob object and `organizer_media_assets` metadata with the same owner. On storage/DB partial failure, clean up the orphan when safe and report 503; do not return an asset ID until both persist. Response 201 `{asset:{id,mime,byteLength,altText,previewUrl}}`, where `previewUrl` is an authenticated route, never a Blob path. `GET /api/v1/organizers/{org}/assets/{assetId}` checks active membership and serves bounded image bytes with no-store. Events can reference only ready assets belonging to their organizer. The later public media route requires a separate publish contract and must not expose draft images by accident. The A2 form may upload photos before event save; abandoned private assets need a retention/cleanup policy before broad rollout.

## Security, tests and transition

Backend owns migration 002, server draft mapper/validator, A2 routes, media ownership/storage adapter and tests. Frontend owns dashboard list/editor, import action and retry/field-warning handling. Before coding, both sides agree exact DTO, route and file ownership in a versioned handoff. Tests must cover zero/multiple brands, cross-brand 404, disabled member 403, import preservation, money conversion, missing photo/pin warnings, explicit date scope, stable tier IDs, create replay/race, PATCH conflict/no-op, oversized body, malicious media MIME, other-brand asset, partial upload failure, and old public Blob journey unchanged. Browser tests cover canceled sign-in retaining the local draft and safe import retry. No real Clerk/Neon/Blob result may be claimed from mocked tests.

Open decisions for PM, asked one at a time: editor draft rights and publish rights; media retention/maximum size; whether a venue photo can be reused across brands; exact seat/tier policy; published-edit review. **Publish, public Neon events, buyer checkout, invitations, payments and admission tickets remain outside A2.**
