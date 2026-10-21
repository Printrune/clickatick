# A5 public brand route guard fix

Date: 2026-10-21. Brief `brief/project.json` v104.

The public organizer route and several dashboard brand routes rejected valid UUIDs before rendering. Their local regular expressions expected three hex digits in the third group rather than four. Added one shared `lib/route-uuid.mjs` validator and migrated the public organizer, brand dashboard, draft, published-event, storefront, team and media page guards to it. The validator accepts the project's versioned UUID shape and rejects malformed IDs.

Focused test `node --test tests/route-uuid.test.mjs`: 2 passed. Elevated `pnpm run build`: passed, including `/organizers/[organizerId]` and dashboard routes. This fixes the route-level 404; a valid brand page can still show a truthful unavailable state while the A5 backend gate and services remain off. No service was enabled or deployed.
