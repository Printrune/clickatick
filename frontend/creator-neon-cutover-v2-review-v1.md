# Creator-to-Neon cutover v2, Frontend agreement

Date: 2026-10-21. Source of truth: `brief/project.json` v105. Reviewed `contract/creator-neon-cutover-v2.md` against the four amendments in `frontend/creator-neon-cutover-review-v1.md`, current creator/dashboard callers, and the A4 catalog route. This is prospective agreement; no cutover code or service changed.

**Frontend agrees to v2.** It resolves all four requested points:

1. Creator import lists only owner brands as selectable. Editor and viewer brands cannot lead to an expected A2 403, and brand creation remains available when no eligible owner brand exists.
2. Legacy Blob listings are clearly historical, direct-link snapshots. Existing listings and receipts remain readable. New checkout, artwork and marketing mutations close with the specified 410 string-error response; the old detail page loses those controls.
3. `CREATOR_NEON_CUTOVER_ENABLED` is a server-owned, default-off gate for creator mode, catalog source and legacy write closure. The 20-row catalog and cursor-based “Load more” flow use honest loaded-only search labels and retry behavior. The current A4 route returns `events` and `nextCursor` in its standard envelope.
4. Brief v105 records the owner decision: old Blob demos leave marketplace and discover, while shared direct links remain readable.

Local “Review tickets” and “Save to brand draft” remain separate. The new client removes the anonymous publish and old login controls in the same release as the tested brand handoff. It keeps the device draft through sign-in, import, media and publication failures. The server gate stays off until connected Clerk, Neon, private media, publication and buyer-demo checks pass. An old cached client receives the explicit 410 recovery message rather than a new Blob write.

No further interface amendment is requested. Frontend can implement after the PM issues the v2 handoff and Backend confirms ownership and gate ordering. Acceptance of the contract is not evidence that the hosted services or cutover are working.
