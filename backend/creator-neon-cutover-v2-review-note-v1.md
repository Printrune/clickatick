# Creator-to-Neon v2 Backend review note

Date: 2026-10-21. Source: `brief/project.json` v105, `frontend/creator-neon-cutover-review-v1.md`. No application code or service changed. `contract/creator-neon-cutover-v2.md` is prospective and needs Frontend agreement and a PM handoff before implementation.

The four Frontend points are addressed:

1. Creator-import brand choice selects only active **owner** brands from `/api/v1/me`; editor/viewer brands show an unavailable explanation. A1's `permissions.createEvent:false` projection is stale for A2 and does not override the server's owner-role check. No eligible owner brand offers creation.
2. Legacy `/listing/{id}` and existing `/receipt/{id}` remain readable by direct link but are read-only after cutover. Legacy checkout, artwork and marketing mutations return 410 without writing. Existing authorized marketing GET may remain a read. The old detail UI removes those action controls and shows an earlier-demo disclosure. The old route uses string `error` for cached Workspace clients.
3. `CREATOR_NEON_CUTOVER_ENABLED` is the single server-owned, default-off switch for creator completion mode, Neon catalog source and old mutation closure. The deployment/rolling order is explicit. Home fetches 20 and shows six; discover loads 20 at a time with `nextCursor`, retries and deduplication. Search/filter claims only loaded rows, never a global search.
4. Brief v105 records the owner decision: old Blob demos disappear from new home/discover/search yet shared direct links remain readable. No owner question remains on visibility.

Backend risk to verify before activation: switching the gate on must close every listed old mutation in the same release; an old cached creator client must get 410 and retain its local draft. Turning the gate back off after new Neon events exist would re-open old writes and hide new catalog entries, so rollback must preserve the new-mode boundary. Connected Clerk/Neon/private-media/public-demo evidence is still absent; this document makes no live claim.
