# Backend A6 implementation v1

Date: 2026-10-21. Source: `brief/project.json` v104; prospective `contract/integrated-phase-a6-v1.md` plus authoritative v2 amendments, accepted in `frontend/integrated-phase-a6-agreement-v1.md`; PM handoff 012. This is local code and database-test evidence, not a connected service result.

## Implemented

- Migration `backend/migrations/007_integrated_phase_a6.sql` backfills approved version 1, stores immutable numbered versions and version-keyed occurrences, tiers, sections, seats, pools and media refs, adds one-open-revision storage/audit, moves demo quotes to version-keyed occurrence references, and adds immutable receipt snapshot columns. Historical version and open revision media references block asset deletion.
- A2 parser accepts compact sparse `removedSeats`, `seatOverrides` and `geometryReset`, normalizes pre-A6 sections, validates coordinates, uniqueness, tier compatibility and the existing 10,000-seat cap. The original A2 draft PATCH route uses this parser.
- New private revision routes provide current/create/save/submit/return/approve, optimistic versions, owner approval, active membership checks, one-open-revision rule and exact idempotent replay. Approval writes a full immutable version and its normalized children before atomically switching `public_events.active_version`. The saved public URL remains `/events/{eventId}`. Section reordering preserves IDs; explicit geometry reset regenerates them.
- Private draft/revision seat-map endpoints page compact geometry in batches of at most 200. A private approved-version endpoint exposes historical snapshots to active brand members. Owner and editor roles follow the agreed state machine.
- With the revision gate enabled, public catalog/detail/seat/media reads use the active content version, including a historical approved-image route. New demo quotes store `active_version`, stale quote GET retains original prices/seats with `event_changed` recovery, stale checkout returns `EVENT_VERSION_CHANGED`, and a successful checkout stores a no-PII immutable event snapshot. Old A4 receipts show a truthful history notice rather than copying current listing details. Cancellation adds a current status notice without changing the captured snapshot. Exact-key checkout replay returns the original confirmation after an edit or cancellation.
- A4 initial publishing after migration 007 dual-writes the same occurrence, seat and pool identities to v1 tables. Existing A4 behavior remains when A6 flags are off. `.env.example` sets `SEAT_AUTHORING_ENABLED=false` and `PUBLISHED_REVISIONS_ENABLED=false`; authenticated A6 routes enforce them independently for draft seat authoring and published revisions.

## Evidence

- `node --test tests/integrated-phase-a2.test.mjs tests/integrated-phase-a4.test.mjs tests/integrated-phase-a6.test.mjs`: 14/14 passed after the main implementation. Subsequent migration/seat override changes were checked with `node --test tests/integrated-phase-a4.test.mjs tests/integrated-phase-a6.test.mjs`: 9/9 passed, and final migration FK was checked with `node --test tests/integrated-phase-a6.test.mjs`: 3/3 passed.
- A6 test uses PGlite migrations 001–007, then exercises old section normalization, initial dual-write identities, private editor/owner revision workflow, version conflict, idempotent approval, seat ID preservation, seat-map pagination, stale and current quote paths, immutable old/new receipt facts, exact-key checkout replay after approval/cancellation, and legacy A4 receipt fallback.
- All new API route modules imported successfully. PM should run the combined build after concurrent A3/Frontend writes settle.

## Remaining limits and gates

- No hosted migration, Clerk sign-in, private Blob retrieval, browser checkout, Vercel deployment or real payment has been verified. Keep both A6 flags off until browser→API→Neon and media checks pass. `DEMO_CHECKOUT_ENABLED` remains its own off-by-default gate. No ticket is sold, reserved, issued or emailed.
- A6 approval uses transactional row locks and bounded/idempotent writes, but the 10,000-seat path uses one INSERT per seat. Benchmark against connected Neon before enabling a large arena map; an unverified performance claim would be misleading.
- The historical receipt image endpoint returns 503 when a Blob is unavailable. Receipt read clears `imageUrl` when the referenced asset is missing or not ready in SQL; it cannot prove Blob bytes exist without fetching them. The frontend needs an image-load fallback.
- Approval of a revision containing dates that have already passed is accepted by expanding from epoch; this preserves old activity dates but needs a separate product rule for edits to completed occurrences before production.
- The public active-version reader is selected by `PUBLISHED_REVISIONS_ENABLED`. After any approved edit, turning that flag back off without a coordinated rollback could pair the new snapshot with legacy A4 child rows. Keep the flag on after activation or migrate all public readers permanently to versioned storage.
- Direct media A3 remains independently gated and requires its own connected verification. A6 private seat-map route reads normalized draft geometry but does not persist a save; the A2 PATCH and A6 revision PATCH routes do that.

No new owner decision is required for this implementation slice. The production payment provider, actual admission issuance, deletion policy and irregular arena map still require separate work and decisions.
# Follow-up routing and demo-write repair (2026-10-21)

- Moved the draft seat-map route into the existing `[eventId]` dynamic segment and alias its parameter to `draftId` inside the handler. The external URL remains `/api/v1/organizers/{organizerId}/events/{draftId}/seat-map`; this removes the sibling `[draftId]` versus `[eventId]` route collision reported by the PM.
- `demoQuote` and `demoCheckout` now choose A6 versioned write handlers when `PUBLISHED_REVISIONS_ENABLED=true`, matching the existing versioned quote and receipt reads. With the flag off, A4 handlers remain active. This keeps new quotes tied to current `active_version` and versioned seat/tier rows.
- Focused evidence: `node --test tests/integrated-a6-routing.test.mjs tests/integrated-phase-a6.test.mjs` passed 5/5. No connected Neon/Clerk run or production activation is claimed here.

