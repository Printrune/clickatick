# Frontend Phase A1 implementation v1

Date: 2026-10-20. Implemented the frontend-owned parts of `contract/integrated-phase-a1-v2.md` after `handoffs/003-pm-phase-a1-agreement.md`, brief v93. No backend contract or API response changed. No deployment.

## Delivered

- Added `@clerk/nextjs` 7.9.17 and `@neondatabase/serverless` 1.2.0 to the existing pnpm package/lock for the shared A1 work. `app/layout.jsx` conditionally wraps the app in `ClerkProvider` only when both Clerk keys exist; public routes remain renderable without those keys.
- `/sign-in` uses Clerk's own sign-in component with fixed `/dashboard` redirect when configured. Without keys, it shows a truthful connection-unavailable message. A route error state offers retry and a public home link.
- `/dashboard` reads the frozen `GET /api/v1/me` envelope. It handles loading, signed out, unavailable, error, zero brands, one or many brands. A brand form validates name and slug, keeps its idempotency key on same-body retry, preserves inputs on errors, focuses slug on collision, and follows only a validated dashboard URL.
- `/dashboard/[organizerId]` validates a UUID, reads the brand-scoped endpoint, supports signed-out/404/disabled/503/error states, and shows the exact A1 setup message. It links to the existing `/creator` without claiming import or publishing works.
- `app/organizer.css` uses the approved purple light/dark tokens, responsive layout, visible focus and 44px-plus controls. No fake event rows, revenue or membership actions are shown.

## Verification

- `pnpm run build` passed under elevated Windows junction permission. Build output lists dynamic `/sign-in/[[...sign-in]]`, `/dashboard` and `/dashboard/[organizerId]` alongside the existing public routes.
- Focused `node --test --test-concurrency=1 tests/demo-catalog.test.mjs tests/theme.test.mjs tests/demo-publishing.test.mjs` passed 27/27, covering public demo and theme behavior after the root provider change.
- No Clerk or Neon credentials were available to this frontend task. Google/email sign-in, database persistence, brand creation/switching, and cross-brand access were not verified against live services. Backend adapter/routes were being implemented in parallel; integrated browser checks remain for PM after both sides are ready.

## Limits

Clerk sign-in options depend on the configured Clerk instance; the app does not itself assert Google/email are enabled. The dashboard API states will stay unavailable until the backend and services are connected. This slice does not add organizer event CRUD, invitation delivery, checkout, payment, or admission tickets. Existing anonymous Blob publishing was not changed.

Official implementation reference checked: [Clerk Next.js SignIn component](https://clerk.com/docs/nextjs/reference/components/authentication/sign-in) and [Clerk Next.js quickstart](https://clerk.com/docs/nextjs/getting-started/quickstart).
