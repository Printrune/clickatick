# Integrated ticketing A2 backend implementation v1

Date: 2026-10-20. Brief `brief/project.json` v93. Implemented against agreed `contract/integrated-phase-a2-v2.md` and `handoffs/004-pm-phase-a2-agreement.md`.

## Delivered

- `backend/migrations/002_integrated_phase_a2.sql` adds private brand event snapshots and private media metadata tables. It does not create public catalog, orders, or payment state.
- `lib/integrated-phase-a2.mjs` validates the canonical draft and maps the existing conversation draft. It preserves local schedule text, distinct business/event addresses, blank ticket format, supply settings, restrictions, and field warnings. Inline photos are represented by recovery warnings; no base64 is saved to Neon.
- `lib/integrated-phase-a2-service.mjs` and `lib/integrated-phase-a2-runtime.mjs` enforce Clerk subject, active brand membership, owner-only writes, storage availability, bounded requests, create/import idempotency, versioned PATCH, and private reads. Nonmembers and cross-brand event IDs return 404. Disabled memberships return 403.
- Routes provide list/create/import/get/PATCH at `/api/v1/organizers/{organizerId}/events`. Private media routes are present but return an honest 503 until retention and cleanup are approved. No Blob write path is active.

## Verification

- `node --test tests/integrated-phase-a2.test.mjs`: 5/5 pass using the A1 and A2 migrations in PGlite. Scenarios cover idempotent replay, list/read/patch, version conflict, address pin reconfirmation, brand role isolation, legacy import, and seat bounds.
- `pnpm run build` completed successfully outside the Windows sandbox, which otherwise blocks Next's required junction creation. The build includes every A2 API and dashboard route. Earlier build failures occurred during concurrent Frontend edits; the final build passed after those imports settled.
- No connected Clerk or Neon credentials were supplied to this task. Live auth/database and production migration were **not** tested or activated.

## Limits and decisions

Media uploads and authenticated previews remain unavailable until the owner decides private media retention and orphan cleanup. The browser must retain inline source photos locally; imported Neon drafts show warnings and remain incomplete. A2 has no publish, public Neon listing, checkout, live payment, admission ticket, or email delivery. Staff write/publish rights, accessible seating policy, and published-edit review remain future owner decisions.

The original public Blob demo routes remain untouched. A later cutover needs the complete buyer path and explicit agreement.
