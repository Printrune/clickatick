# Integrated Phase A5 storefront and staff core API v1 — prospective

Date: 2026-10-21. Source: `brief/project.json` v104 and `frontend/integrated-phase-a5-ux-v1.md`. This is a proposed interface for Frontend review, not implemented service behavior. Scope is a public stable-ID brand storefront, owner-managed presentation, private-link staff invitation and membership controls. It preserves A4 event, quote, checkout and receipt behavior. Email delivery, published revisions, seat-map authoring and demo analytics require separate contracts.

## Fixed decisions and boundaries

- Public URL `/organizers/{organizerId}` uses the existing immutable `organizers.id` UUID. `organizers.slug` remains a private creation field; neither rename nor slug changes redirects the storefront. Public event URLs remain `/events/{eventId}`.
- Brand display name is the existing `organizers.name` canonical value. A storefront profile adds description and optional media references. No verified badge, domain claim, payment claim or admission claim.
- Roles remain `owner|editor|viewer`; only an active owner may mutate profile, invites or memberships in A5. An editor may prepare events under existing draft contract, but cannot publish/cancel. Staff invitation grants `editor` or `viewer`, never `owner`; ownership transfer is later work.
- New storefront exposes only active, published A4 events. Cancelled event details remain directly readable at `/events/{eventId}` under A4, but leave the storefront grid. A disabled brand is not public.
- Private-link invitations are enabled only after Clerk, Neon and a stable server invite signing secret are connected and verified. Email invitation UI may show “Delivery not connected”; no send route or sent status is activated until an email provider and delivery evidence are verified.

## Migration proposal

Use migration `006_integrated_phase_a5.sql` after A3 v3 media migration numbering is settled. Do not change A1 organizer or membership primary keys.

`organizer_storefronts(organizer_id UUID PRIMARY KEY REFERENCES organizers(id), description TEXT NOT NULL DEFAULT '', logo_asset_id UUID NULL, banner_asset_id UUID NULL, version INTEGER NOT NULL DEFAULT 1, updated_at TIMESTAMPTZ NOT NULL)`. Description is trimmed Unicode, 0–2,000 characters. Media references must point to a ready asset owned by this brand and approved for public delivery. Until A3 media activation, both fields remain null and PATCH rejects non-null IDs with `MEDIA_UNAVAILABLE`. Storefront profile row can be lazily created in the same transaction as first PATCH; GET projects an empty description/version 0 when missing. `organizers.name` and `organizers.version` remain authoritative for display-name edits; a PATCH checks both supplied versions.

`organizer_invitations(id UUID PRIMARY KEY, organizer_id UUID FK, role TEXT CHECK IN ('editor','viewer'), channel TEXT CHECK IN ('link','email'), token_hash CHAR(64) UNIQUE NOT NULL, created_by_clerk_user_id TEXT NOT NULL, status TEXT CHECK IN ('created','accepted','revoked'), accepted_by_clerk_user_id TEXT NULL, created_at, expires_at, accepted_at, revoked_at, version INTEGER NOT NULL DEFAULT 1, idempotency_key UUID NOT NULL, request_hash CHAR(64) NOT NULL, UNIQUE(organizer_id,created_by_clerk_user_id,idempotency_key))`. V1 writes only `channel='link'`; no email address is stored. `expired` is a computed presentation status when `now() >= expires_at`; `copied` is client-local state only, never asserted by server. Retain rows for audit while brand exists, never retain raw token. A5 deletion/retention policy for brands remains separate.

Add invite-related audit records with organizer ID, actor Clerk subject, action, invite/member subject when known, timestamp, and request ID; no raw token or email. Existing `organizer_members` is reused. Membership updates must preserve at least one active owner per brand transactionally; A5 has no owner demotion or removal endpoint, so this invariant follows from owner-only creation in A1 and no owner mutation here.

## Shared API rules

Success `{data:...,error:null}` and failure `{data:null,error:{code,message,fields?,currentVersion?}}`, as A1–A4. UUID path validation is 400; unauthorized is 401; nonmember/unknown private brand is indistinguishable 404; disabled membership is 403. Private responses use `Cache-Control: no-store`; public storefront responses may use short revalidation only after publication/cancellation invalidation is tested, otherwise `no-store`. Bounded JSON, schema validation, same-origin checks on mutations, server-side Clerk subject and brand membership are required. No raw SQL, secrets or token hashes enter browser responses.

### Public storefront

`GET /api/v1/storefronts/{organizerId}` returns 200:

```json
{"data":{"brand":{"id":"uuid","name":"Example Tours","description":"Guided city walks","logoUrl":null,"bannerUrl":null,"status":"active","publicUrl":"/organizers/uuid"}},"error":null}
```

No private slug, staff, draft or contact data. For disabled/nonexistent brands return 404 `STOREFRONT_NOT_FOUND`; for database outage return 503 `DATABASE_UNAVAILABLE`, distinct in UI. Media URLs are server-controlled public delivery URLs only after A3 verification; missing/unavailable media yields null without hiding text.

`GET /api/v1/storefronts/{organizerId}/events?limit=12&cursor=...` returns `{data:{events:PublicEventSummary[],nextCursor:string|null},error:null}`. Reuse the exact A4 `PublicEventSummary` DTO, with immutable event UUID and public URL. Limit 1–24, default 12. Sort by next upcoming active occurrence UTC, then event UUID; events with no future occurrence sort after upcoming events by event UUID. Signed opaque cursor binds organizer ID and sort position; invalid cursor 400. Filter `published` and active organizer; exclude cancelled and draft events. Do not fabricate zero on DB failure. An active brand with no qualifying events returns `events:[]` truthfully. Brand name should be read from current `organizers.name`, not copied into an immutable event snapshot.

### Owner storefront edit

`GET /api/v1/organizers/{organizerId}/storefront` returns `{data:{brand:{id,name,brandVersion,status},profile:{description,logoAssetId,bannerAssetId,version},publicUrl},error:null}`. Active member may read; owner-only edit controls are server-projected.

`PATCH /api/v1/organizers/{organizerId}/storefront` body:

```json
{"name":"Example Tours","description":"Guided city walks","logoAssetId":null,"bannerAssetId":null,"expectedBrandVersion":3,"expectedProfileVersion":0,"idempotencyKey":"uuid"}
```

Fields are complete replacement values. Name trims to 2–100 chars; description 0–2,000. Null media allowed; non-null asset requires an A3 ready public-capable asset of same brand, otherwise 422 or `MEDIA_UNAVAILABLE` 503 while gate is closed. Transaction checks owner membership, both versions, updates organizer/profile and returns the same GET projection. Version mismatch returns 409 `VERSION_CONFLICT` with current version pair; repeat same key/body returns saved 200 result, changed body 409 `IDEMPOTENCY_CONFLICT`. The idempotency scope includes verified subject and organizer ID. Name changes do not change public URL.

### Staff list and private link

`GET /api/v1/organizers/{organizerId}/team` is member-readable: `{data:{members:[{userId,role,status,joinedAt}],invitations:[{id,role,channel,status,createdAt,expiresAt,acceptedAt,version}]},error:null}`. For editors/viewers, omit invitation list and member Clerk IDs they do not need; use a `members` count or own membership only. For owners, return bounded pages (limit 1–50; cursor) and no raw invite tokens. No email fields in v1. `status` of pending link may be `created` or computed `expired`; `copied` remains local UI state. Disabled members are visible to owners, absent from `/api/v1/me` per A1.

`POST /api/v1/organizers/{organizerId}/invitations` owner-only body `{role:"editor"|"viewer",channel:"link",idempotencyKey:"uuid"}`. Server creates one 256-bit unguessable URL-safe token, valid 7 days, with one successful acceptance. Created 201 returns `{data:{invitation:{id,role,channel:"link",status:"created",expiresAt,version:1},inviteUrl:"/invite/{token}"},error:null}`. Same key and body replays 201 and same link; different body 409. To support safe retry without storing raw token, derive token with HMAC-SHA256 over immutable random invite UUID plus organizer ID and creation key using dedicated `INVITE_TOKEN_SECRET` (at least 32 random bytes); store only SHA-256 token hash. Secret rotation must preserve old verifier keys until all links expire; missing secret returns 503 `INVITATIONS_UNAVAILABLE`. Invitation ID, creator and idempotency row commit together. Limit proposed 20 creates per owner per day and 50 outstanding per brand; 429 `INVITE_RATE_LIMITED` with Retry-After. These are operational defaults, not paid-service allowances.

`GET /api/v1/invitations/{token}` is public, no sign-in and never consumes token. Valid active link returns `{data:{brand:{id,name},role,expiresAt,signInUrl:"/sign-in?returnTo=/invite/{token}"},error:null}`. Sign-in return path is constructed server-side with the token validated and URL encoded; only same-origin `/invite/{token}` permitted. Expired, revoked, used and unknown return generic 404 `INVITATION_UNAVAILABLE`; rate-limit previews and return no member data. It is acceptable for anyone holding the private link to see brand name/role.

`POST /api/v1/invitations/{token}/accept` requires Clerk sign-in, same-origin and `{idempotencyKey:"uuid"}`. In one transaction lock invitation, check active brand, unexpired/unrevoked/unaccepted link, and insert active `organizer_members` role. Success 200 returns `{data:{brand:{id,name},membership:{role,status:"active"},dashboardUrl:"/dashboard/{id}"},error:null}`. Same subject/key replays 200; a token accepted by another subject returns 409 `INVITATION_ALREADY_USED` without revealing identity. Existing active/disabled membership returns 409 `MEMBERSHIP_EXISTS` and does not silently elevate/reactivate. A revoked/expired link returns 410 `INVITATION_UNAVAILABLE`; public preview may use generic 404. Concurrent accepts use DB row lock/unique membership constraint. No client-supplied role/brand authority.

`POST /api/v1/organizers/{organizerId}/invitations/{invitationId}/revoke` owner-only body `{expectedVersion,idempotencyKey}`; 200 returns updated invitation `revoked`, 409 on version race or already accepted, idempotent replay stable. Expiry needs no mutation.

### Membership controls

`PATCH /api/v1/organizers/{organizerId}/members/{clerkUserId}` owner-only body `{role:"editor"|"viewer",status:"active"|"disabled",expectedVersion,idempotencyKey}`. Add `version INTEGER NOT NULL DEFAULT 1` to `organizer_members` in migration. It cannot address an owner membership or promote someone to owner. Changes commit atomically with audit and idempotency. Existing member role/status changes take effect immediately for all private requests; disabled members are excluded from `/me`. For a disabled member receiving reactivation, owner must confirm in UI. Return 200 `{data:{member:{userId,role,status,version}},error:null}`; conflict returns 409. No member hard delete in A5. The route encoding of `clerkUserId` is validated and length-bounded; if Frontend prefers opaque membership UUID, this must be amended before code.

## Email delivery gate and truthful status

No A5 email send endpoint is active. `POST /api/v1/organizers/{id}/email-invitations`, if present as a capability probe, always returns 503 `EMAIL_NOT_CONNECTED` and creates no invite. UI may show an email form only as disabled with that explanation. Future provider integration must define target verified email binding, PII retention, delivery evidence, bounce/failure handling, retries, and provider webhook authentication. Only provider-acknowledged handoff may be called `accepted-for-delivery`; only authenticated delivery callback may be called `delivered`. Neither status means the invitation was accepted by a person. Copying a private link is never recorded as sending.

## Rollout and tests

Feature gates `STOREFRONT_ENABLED` and `STAFF_INVITES_ENABLED` default off until schema deployed and connected-service verification succeeds. Public A4 catalog/event/quote/checkout/receipt routes remain unchanged, including legacy Blob behavior. No guest or buyer authentication is introduced. On A5 failure the existing `/events/{id}` route must still function; do not change its event IDs or media semantics. Profile cache invalidation must follow name/profile changes; publication/cancellation must update storefront grid without a new event URL.

Backend tests: UUID stable through display-name edit, disabled brand 404 vs DB 503, published-only cursor order, cancel exclusion/direct A4 detail preserved, cross-brand member denial, owner-only writes, media gate, same-key retry/conflict, link one-use concurrency, expiry/revoke/accept, existing membership conflict, disabled member access and `/me` omission, no token leakage, missing secret/Clerk/Neon 503, bounded rate limits, no email send. Frontend tests: sign-in return preservation, preview before sign-in, copied versus sent wording, owner/member controls, empty storefront, mobile/accessibility and failure states. Verify browser→API→DB in staging before enabling; no live-service claim follows from tests alone.

## Required agreement before implementation

Frontend should confirm the exact public event summary reuse, profile version pair, team pagination/projection, Clerk subject route identifier, and invite accept error states. PM must settle any product choices beyond recorded approvals: whether an invitation may reactivate an existing disabled member (v1 says no), and whether branding images remain gated until A3 v3. No A5 code, migration, deployment or external message was changed by this contract.
