# Creator-to-Neon cutover frontend v1

Date: 2026-10-21. Brief: `brief/project.json` v106. Agreement: `contract/creator-neon-cutover-v2.md` and PM handoff 014. No gate was enabled and no deployment or external service changed.

The server-rendered `/creator` route now passes the default-off `CREATOR_NEON_CUTOVER_ENABLED` mode to `Workspace`. With the gate on, voice and text conversation, device draft and local review remain; review and the footer offer “Save to brand draft.” Anonymous Blob publication and the obsolete local login dialog are absent. Saving marks the existing import handoff and opens `/dashboard?source=creator`; it does not claim a public event. With the gate off, the existing demo publishing UI remains available for comparison until the coordinated cutover.

In creator-import mode, the dashboard offers import links only for owner brands. Editor/viewer brands are shown as unavailable for this action, while the ordinary dashboard still links all accessible brands. Brand creation remains available when there is no owner brand. The A2 editor retains the device source and import warnings.

The gate-on homepage and discover page now read only `GET /api/v1/events?limit=20`. Discover pages through `nextCursor`, deduplicates event IDs, keeps earlier rows on a failed next-page fetch and retries the same cursor. Its search and type filters explicitly cover loaded rows only. The old Blob catalog and dual `NewDemoCatalog` display are absent in this mode. New cards link to `/events/{id}`.

The old `/listing/{id}` URL displays a read-only snapshot under the gate, without checkout, artwork or promotion controls. The old `/listing/{id}/marketing` URL can show previously saved authorized promotion versions, without editing or mutation actions. Existing receipt URLs remain handled by their existing read route. Backend owns the matching 410 mutation responses.

Changed frontend files: `app/creator/page.jsx`, `components/Workspace.jsx`, `components/DashboardEntry.jsx`, `components/CutoverCatalog.jsx`, `lib/catalog-pages.mjs`, `app/page.jsx`, `app/discover/page.jsx`, `app/listing/[id]/page.jsx`, `app/listing/[id]/marketing/page.jsx`, `components/HistoricalMarketing.jsx`, `app/organizer.css`, and `tests/catalog-pages.test.mjs`.

Focused checks: four Node tests passed across catalog paging/filtering and UUID guards. The earlier Babel wrapper check missed a malformed closing tag in `DashboardEntry.jsx`. I corrected `</Link>)}/div>` to `</Link>)}</div>` and verified the component with the actual Next SWC transform. The PM combined build remains the authoritative integration check. PM owns the combined production build and connected browser review. These checks do not prove Clerk, Neon, Blob, images, publication or demo checkout work on the deployed site.

Remaining activation gates: keep `CREATOR_NEON_CUTOVER_ENABLED` off until the PM verifies both gate modes, old cached-client 410 recovery, owner-only import, photo and pin validation, A4 owner publish, `/events/{id}` detail, cursor paging, old direct links and the zero-charge buyer demo through connected services. The historical marketing page intentionally shows saved content only; it does not generate new artwork or approvals.

