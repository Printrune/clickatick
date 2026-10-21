# Marketplace home and creator route v1

Date: 2026-10-20. Implemented the frontend route contract `contract/homepage-v1.md` after `handoffs/002-pm-homepage-agreement.md`, with shared brief v88 at task start. No backend, provider, payment or deployment change.

## Changed

- `/` is a marketplace page with approved clickatick straplines, creator and Discover calls to action, and up to six latest public demo listings from the bounded `readDemoCatalog()` projection. It has distinct empty and unavailable states.
- `/creator` renders the existing `Workspace` with the same connection/session props; conversational state and voice implementation were not edited.
- `/start` and inbound `/?start=1` redirect to `/creator` without putting draft details in the URL. Chrome and Discover creation links now point directly to `/creator`. Mobile navigation may wrap to keep all links reachable.
- New `app/marketplace.css` uses the approved purple light/dark tokens, responsive ticket artwork, visible keyboard focus and reduced-motion behavior. Full-size listing artwork and private draft data are not embedded in marketplace cards.

## Checks

- `pnpm run build` passed with elevated Windows junction permission. Build output includes dynamic `/`, `/creator` and `/discover` routes.
- Focused `node --test --test-concurrency=1 tests/demo-catalog.test.mjs tests/demo-publishing.test.mjs` passed 23/23.
- Search of `app`, `components` and `lib` found no remaining hard-coded `/?start=1` or `/#workspace` creation links.
- No browser walkthrough or screenshot was performed in this frontend task; the PM should include that in integrated review. The prior full suite run reported two PGlite disk-restart WASM failures under parallel execution; these routes do not touch that local database path.

## Limits

Checkout remains a demo. The “Pay with anything” strapline was owner-approved; nearby copy explicitly says payment methods are not connected yet. Clerk, Neon, organizer management and numbered seats remain separate later integration slices.
