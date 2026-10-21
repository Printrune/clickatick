# Integrated ticketing Phase A1 API and schema — prospective

Date: 2026-10-20. Brief `brief/project.json` v93. This narrows `integrated-ticketing-api-v4.md` to verified organizer identity, brand creation/list/switch, and an honest empty dashboard. It requires Frontend/Backend agreement and PM handoff before coding. It is **not** a contract for events, invitations, publishing, checkout or payment.

Approved context: clickatick's full ticketing product is the goal; marketplace `/` and conversational creator `/creator` remain public. Organizer management needs sign-in via Clerk's Google/email methods; new brand data belongs in a fresh Neon database. Multiple brands and staff are approved. Demo checkout and the current Blob public journey remain intact during A1. Clerk/Neon free allowances must be verified at setup; this document does not claim an account or connection exists.

## A1 user journey

1. Visitor chooses organizer dashboard. If signed out, the Clerk sign-in UI offers Google or email as configured. The app collects no password itself.
2. Server verifies Clerk identity. `GET /api/v1/me` returns zero or more organizer brands with effective role/permissions. Zero brands shows “Create your first brand”; it never fabricates a dashboard or event count.
3. Signed-in user creates a brand with a name and unique slug. Server creates the brand and owner membership together. It returns the brand dashboard URL.
4. User switches brands by opening `/dashboard/{organizerId}` (or another Frontend-agreed route). There is no trusted “active brand” cookie or global mutable brand selection. Every private route rechecks membership for that route's organizer ID. A1 dashboard shows brand profile and a truthful “No events yet” state because event CRUD is not connected in A1. It links back to `/creator` without importing/publishing a draft yet.

## Neon migration 001 (A1 only)

`organizers(id UUID PK, slug CITEXT UNIQUE NOT NULL, name TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active', version INTEGER NOT NULL DEFAULT 1, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ)`. Validate normalized slug `[a-z0-9]+(?:-[a-z0-9]+)*`, length 3–48; brand name trimmed 2–100 characters. Reserve prohibited route slugs in application validation before insert. No public brand profile route in A1.

`organizer_members(organizer_id UUID FK organizers ON DELETE CASCADE, clerk_user_id TEXT NOT NULL, role TEXT NOT NULL CHECK IN ('owner','editor','viewer'), status TEXT NOT NULL CHECK IN ('active','disabled'), joined_at TIMESTAMPTZ, PRIMARY KEY (organizer_id,clerk_user_id))`. A1 inserts only `owner`; invitation/member-role writes are deferred. One Clerk subject can have many brand memberships. The last-owner invariant is preserved because A1 has no delete/demote operation.

`request_idempotency(scope TEXT, key UUID, request_hash CHAR(64), response_json JSONB, status_code INTEGER, created_at TIMESTAMPTZ, expires_at TIMESTAMPTZ, PRIMARY KEY(scope,key))`. Scope includes verified Clerk subject and route operation. Store only safe response fields. Create-brand and idempotency record commit in one transaction; uniqueness violation on slug returns 409 rather than a duplicate brand. Propose 24-hour retention, with cleanup operationally planned before activation. Database roles/credentials are server-only; no browser SQL or exposed connection string.

Do not create an `events` table in A1 merely to support a fabricated event count. The dashboard empty state is known from the A1 feature boundary, not a sales metric. Phase A2 introduces events and replaces it with a real query.

## Exact A1 endpoints and models

Envelope for all API responses: success `{data:...,error:null}`; failure `{data:null,error:{code:string,message:string,fields?:[{path,code,message}]}}`. JSON content type, no secrets, request ID in server logs. `Cache-Control: no-store` on all private responses. Route handlers run on the server with Clerk-authenticated subject. Auth errors do not redirect HTML API callers; return JSON.

### `GET /api/v1/me`

Signed-in response 200:

```json
{"data":{"userId":"clerk-subject","brands":[{"id":"uuid","slug":"my-brand","name":"My Brand","role":"owner","permissions":{"viewDashboard":true,"createEvent":false,"editEvent":false,"publishEvent":false,"manageMembers":false},"dashboardUrl":"/dashboard/uuid"}],"nextAction":null},"error":null}
```

For a signed-in user with no brands, `brands:[]`, `nextAction:"create-organizer"`. Sort brands by normalized name then UUID for stable switching. Permissions are a *server-calculated capability projection*, false for unavailable A1 actions even if the user will later have owner rights. Only owner role is created in A1. If Clerk is unconfigured return 503 `AUTH_UNAVAILABLE`; signed out returns 401 `SIGN_IN_REQUIRED`. If Neon unavailable return 503 `DATABASE_UNAVAILABLE`, not a fabricated zero-brand list.

### `POST /api/v1/organizers`

Request:

```json
{"name":"My Brand","slug":"my-brand","idempotencyKey":"uuid"}
```

Created 201:

```json
{"data":{"brand":{"id":"uuid","slug":"my-brand","name":"My Brand","role":"owner"},"dashboardUrl":"/dashboard/uuid"},"error":null}
```

Same subject+key+same canonical body replays the original response and status; same key with different body returns 409 `IDEMPOTENCY_CONFLICT`. Slug collision with a different brand returns 409 `SLUG_TAKEN` (without disclosing private membership). Unknown keys, invalid UUID key or invalid bounds return 400 `INVALID_INPUT` with field paths. Only a verified Clerk subject can create. No first-brand assumption; repeat creation supports multiple brands. No email or external message is sent.

### `GET /api/v1/organizers/{organizerId}`

Member-only 200:

```json
{"data":{"brand":{"id":"uuid","slug":"my-brand","name":"My Brand","version":1,"role":"owner","status":"active"},"dashboard":{"state":"events-not-connected","message":"Event management is being connected.","createEventUrl":"/creator"}},"error":null}
```

This is an A1 empty shell, not a claim that no events exist in a future store. It cannot expose another brand's data. Invalid UUID returns 400; nonexistent or nonmember returns the same 404 `BRAND_NOT_FOUND`. Disabled membership returns 403. The Frontend may show a “No events yet” message only while the dashboard state is `events-not-connected`; once A2 connects real event data, this contract must change to a real empty/list state. If Clerk or Neon is unavailable, return 503 and display a setup-unavailable state rather than a pretend dashboard.

## Security and integration gate

The selected brand ID is a route parameter and cannot grant access on its own. All DB queries join `organizer_members` on server-verified Clerk subject and require active status. The public site, legacy `/listing/[id]`, `/receipt/[id]`, and conversation are not wrapped in organizer auth. POST uses same-origin/CSRF checks, bounded JSON body (proposed 8 KiB), rate limits and transactionally enforced idempotency. No PII from Clerk beyond the stable subject is stored in A1. Do not place Clerk secret or Neon URL in `NEXT_PUBLIC_*`. Verify Google/email sign-in and Neon connection in local/staging before enabling dashboard links; if absent, render a clear connection/setup state and leave the public marketplace working.

## Frontend/backend file ownership and tests before A1 completion

Backend owns SQL migration, server auth/database adapters, these three route handlers and tests. Frontend owns sign-in entry, brand create form, brand switcher and dashboard empty/error states. Both agree response shapes and URLs before implementation. Backend tests: signed out, Clerk missing, Neon missing, zero/one/many brands, deterministic sort, create/replay/conflict, slug uniqueness race, cross-brand access denial, disabled member and bounded input. Browser checks: Google/email configuration when available, cancel sign-in returns safely, brand switch never displays another brand's data, public marketplace and legacy demo still work. Test fixtures must not be described as real service success.

## Decisions and limits

Role grants for editors, invitation channel/expiry and member management are **outside A1** and pending owner detail. Mapping, seating, catalog and draft import are later phases. The exact sign-in callback/redirect path and dashboard path should be checked with Frontend before freezing the A1 contract; `/dashboard/{organizerId}` is the proposal here. No app code, database, account, secret, deployment or live purchase was changed by this document.
