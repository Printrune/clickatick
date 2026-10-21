# Live platform frontend UI v1

Date: 2026-10-22. Brief read: `brief/project.json` v107. Role read: `team/roles/frontend.md`; `AGENTS.md`; `.agents/skills/workshop-owner-language/SKILL.md`; `.agents/skills/copy-editing/SKILL.md`; Next.js bundled layouts/pages guide. No new visual direction or API contract was introduced.

## Change

- The new Neon marketplace catalog labels its cards “Demo checkout,” not “Demo event.” Its homepage says organizers can create and publish a real event listing. The nearby text explicitly says checkout is simulated and creates no payment, reservation, or admission ticket.
- The discovery page identifies published events and keeps the simulated-checkout notice. The brand storefront uses “Demo checkout” on event cards.
- The public Neon event detail identifies a published event, while its ticket panel continues to label prices illustrative, amount charged $0, seat choices unreserved, and confirmation simulated. Referral payouts and payment methods remain unavailable while checkout is simulated.
- The legacy Blob demo listing routes retain their old demo labels because they are historical direct-link-only artifacts.

## Interface agreement

Frontend accepts `contract/live-event-publication-v1.md` as written before Backend changes its projection. These components do not branch on the event-level `demo` key. No frontend request or response shape changed in this patch.

## Evidence and limits

`pnpm run check` passed brief validation and many tests, then exited 1 after a PGlite WebAssembly abort in this concurrent local run. This is not a verified source failure; rerun the complete check once other builds/tests stop. No browser test or production deployment is claimed. The brief and default-off service gates still mark this release as not yet activated. The owner-approved “Pay with anything” strapline remains, but the homepage immediately clarifies that no payment occurs. This phrase remains a potential overclaim until payment integration is available; the PM should resolve it with the owner or add a more prominent qualifier. The site should not be called fully live until marketplace cutover, organizer publish, and public listing are verified in the hosted environment.
