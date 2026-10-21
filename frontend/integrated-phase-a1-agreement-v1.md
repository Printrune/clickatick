# Frontend agreement: integrated Phase A1 contract v2

Date: 2026-10-20. Reviewed `contract/integrated-phase-a1-v2.md` against `brief/project.json` v93 and prior `frontend/integrated-phase-a1-review-v1.md`. **Frontend agrees without remaining contract blockers for A1.** No app code was changed during this review.

The contract fixes `/sign-in`, `/dashboard` and `/dashboard/[organizerId]`, uses a validated same-origin return path, and leaves public marketplace, creator and legacy demo routes outside organizer authentication. All three APIs use the same `{data,error}` envelope. The zero-brand, multiple-brand, disabled-member, unavailable-service and slug-collision behaviors are explicit. The dashboard correctly says “Event management is being connected.” It does not imply an events table, sales or tickets exist. Same-body create retry returns the same 201 response, and the client retains its idempotency key until the canonical body changes.

Frontend owns the sign-in entry, brand form, chooser and private dashboard states. Backend owns the migration, Clerk/Neon adapters and three route handlers. First frontend implementation can begin after PM records Frontend and Backend agreement in a versioned handoff. Verification must include signed-out entry, zero/one/multiple brands, direct foreign-brand access, disabled membership, slug collision, 503 states, keyboard/mobile navigation and unchanged public demo routes. Google/email success and Neon persistence must not be claimed until connected and verified.

Evidence: brief version 93, A1 v2 contract, prior A1 v1 review, shared rules, frontend role, starter AGENTS and relevant authentication, owner-language, TypeScript and design skill material. This is prospective agreement, not runtime or service evidence.
