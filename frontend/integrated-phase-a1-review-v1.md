# Frontend review: integrated Phase A1 contract v1

Date: 2026-10-20. Reviewed prospective `contract/integrated-phase-a1-v1.md` against `brief/project.json` v93. **Frontend agrees with the identity, brand and API envelope design, subject to the route and copy clarifications below.** No app code was changed.

## Route and sign-in agreement

- Use `/dashboard` as the organizer entry route. A signed-out visitor goes to a Clerk-hosted or Clerk-rendered `/sign-in` screen with Google and email methods, if configured. Set a fixed, same-origin return path to `/dashboard`; do not accept an arbitrary external return URL.
- After sign-in, `/dashboard` calls `GET /api/v1/me`: zero brands shows the create-brand form; one brand may continue to its dashboard; several brands show a brand chooser instead of silently selecting a global active brand. A new brand creation follows the server-returned `dashboardUrl`.
- Use `/dashboard/[organizerId]` for the private brand dashboard, matching `dashboardUrl:"/dashboard/uuid"`. Brand switching changes that route. Direct signed-out access may return to the same route after sign-in, but the server must recheck membership and show the same 404 for absent/foreign brands.
- Sign-in cancellation should return to the previous public task without deleting local conversation drafts. A missing Clerk configuration shows a connection-unavailable state and leaves `/`, `/discover`, `/creator`, legacy listings and receipts usable.

## Response and ownership agreement

The `{data,error}` response envelope is consistent across `GET /api/v1/me`, `POST /api/v1/organizers` and `GET /api/v1/organizers/{organizerId}`. The zero-brand `nextAction` and `dashboardUrl` fields are sufficient for this slice. Frontend will never infer membership from a URL or trust a browser brand cookie. It will render actions from server permissions, which correctly mark event creation, publication and member management unavailable in A1. Backend owns Clerk/Neon adapters, migration, three handlers and security tests; Frontend owns sign-in entry, create-brand form, brand chooser and dashboard error/empty views.

## Clarifications before implementation handoff

1. Freeze `/sign-in` and `/dashboard` as the entry/callback routes in this contract. If a direct brand URL is preserved through sign-in, only allow a validated same-origin `/dashboard/{UUID}` return. Specify how the page treats the Clerk callback failure and a canceled sign-in.
2. Replace the dashboard copy “No events yet” in A1. There is no events table/query, so that sentence could be false for a later imported data source. Use the server response: **“Event management is being connected.”** An actual no-events state comes in A2 when a real event query exists.
3. Specify whether `POST /api/v1/organizers` replay sends 201 again (the wording implies yes) and whether `GET /api/v1/me` may include a disabled membership. Frontend should only list active accessible brands; disabled-brand direct access uses 403 as written.
4. UI input should visibly enforce name length 2–100 and slug length 3–48 with lowercase hyphens, but server validation remains authoritative. On `SLUG_TAKEN`, preserve both inputs and focus the slug field. Idempotency key stays stable while retrying the same submission and changes only when the user changes the canonical body.

## First frontend build after agreement

Implement a small organizer shell and the create/switch journey without any event rows or sales cards. Show sign-in unavailable, signed-out, zero-brand, one/many-brand, slug conflict, foreign-brand, disabled-member and Neon-unavailable states. Keep creator drafts on the device. Test keyboard and 320/390px layouts and confirm public marketplace/demo routes remain accessible. No A1 screen may imply real events, payment, ticket issuance or invitation delivery.

## Evidence

Read brief v93, shared rules, frontend role, starter AGENTS, prospective A1 and integrated v4 contracts, current route tree, workshop owner-language, TypeScript/type-discipline and Vercel authentication skill material. This is a source review, not Clerk/Neon connection or browser verification.
