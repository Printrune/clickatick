# Shared inventory release verification v1

2026-10-18. Brief v60 category correction, v61 adds separate anonymous demo publishing scope.

Production release dpl_12ry4CCYpQZWdj2n76kDvmZYK6mc is READY and assigned to https://ticketnest-psi.vercel.app/. Source manifest:60 files. Next production build and brief validation passed. Windows sandbox could not create a required junction; the same build succeeded outside the sandbox with approval.

Backend handoff records105 focused checks, frontend30, independent review89 plus7 final pool migration checks. These sets overlap and are not a combined test count. See backend/ticket-category-review-v1.md and backend/ticket-category-recovery-v1.md.

Ran `node scripts/verify-live-shared-inventory-v1.mjs --confirm-live` against production. Exactly two paid Claude requests, no retries, purchases, top-ups or provider key reads. Evidence: evidence/live-shared-inventory-v1.json.

1. Existing Adult and Child categories, allocated quantities10 each, pending total10. Exact owner answer `it should between them` accepted shared total10, retained both IDs/prices/quantities and cleared the pending fact. Reply: `Got it, 10 spots shared between adults and kids. Anything else you'd like to review or change?`
2. A stale category question followed by `nothing` kept the entire accepted draft identical and cleared only the pending category topic. Reply: `Your ticket categories will stay as they are. Would you like to review your draft?`

This verifies the actual semantic case and production schema. It does not establish physical microphone/audio quality or guarantee every future model interpretation. Earlier price/unknown-category-ID fallback paths are separate recorded gaps.
