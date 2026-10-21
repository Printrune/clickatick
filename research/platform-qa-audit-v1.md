# clickatick platform QA audit v1

Date: 2026-10-21. Reviewer: independent QA specialist. Source of truth: `brief/project.json` version 107. Shared rules: `team/shared-rules-v1.md`; role: `team/roles/research.md`. Scope: local source and configuration, existing implementation handoffs, and a partial local test run. This is not production acceptance.

## Approved behavior checked

The approved integrated product has a marketplace at `/`, conversational ticket creation at `/creator`, owner sign-in before publishing, multiple brands and staff with owner approval, private business/event photos and exact map pins, event and ticket capacities including numbered seats, public listing pages, zero-charge demo checkout, and optional business-funded referrals. Existing Blob demos become direct-link-only after cutover. Real payments, ticket issuance, email confirmations, and referral payouts are not connected in this demo. The 10% platform fee and referral reward use discounted ticket price; actual processing fee allocation is unresolved.

## Verified findings

| Severity | Finding | Evidence and implication |
| --- | --- | --- |
| P0 activation | The integrated marketplace is not the default public path. `app/page.jsx` renders `CutoverCatalog` only when server flag `CREATOR_NEON_CUTOVER_ENABLED=true`; `.env.example` keeps it false. The default homepage reads legacy Blob demos. This gate is intentional, but the integrated platform is not ready to claim live until connected verification and activation. | `app/page.jsx`, `.env.example`, `handoffs/017-pm-vercel-git-preview.md` (READY preview showed legacy cards, production remained older). |
| P0 activation | Organizer login and data cannot yet be accepted as live. The organizer API requires Clerk keys and `DATABASE_URL`; preview dashboard showed “Organizer tools are unavailable.” Neon environment names are connected per PM report, but this does not prove migration, query success, or Clerk sign-in. | `lib/integrated-phase-a4-runtime.mjs`, `components/DashboardEntry.jsx`, `handoffs/017-pm-vercel-git-preview.md`. |
| P1 journey | Demo checkout, private media, seat authoring, storefronts, staff invites, and published revisions all have separate default-off gates. The code and local tests cover pieces, but no browser-to-API-to-Neon-to-Blob journey is documented for the connected production service. | `.env.example`, `backend/integrated-phase-a4-implementation-v1.md`, `backend/integrated-phase-a6-implementation-v1.md`. |
| P1 journey | The new event path does not yet show the existing legacy marketing dashboard. Promotion controls found in `CreatorPromotionPanel` and `/listing/{id}/marketing` attach to legacy Blob listings; new public events use `/events/{id}` and its own experience. Integrating marketing after event publication remains incomplete. | `components/CreatorPromotionPanel.jsx`, `app/events/[id]/page.jsx`, `components/HistoricalMarketing.jsx`. |
| P1 scope | Referrals on the new creator draft are configuration only; public code does not provide tracked referral codes or rewards. Demo payment preferences are also selection only. This is truthful in the interface, but it falls short of the owner's eventual launch-scope requirements. | `components/FrontPageSetup.jsx`, `components/OwnerEventEditor.jsx`; prospective contract `contract/integrated-promotions-referrals-v3.md`. |
| P1 data | Public generated marketing copy says “Pay with anything” and “Your guests pay the ticket price. Not a penny more,” while checkout is simulated and provider coverage/processing fee allocation remain unverified. Keep the approved straplines, but require a truth-in-pricing review before real checkout launches. | `app/page.jsx`, `components/CutoverCatalog.jsx`, brief v107. |
| P2 maintainability | The legacy `lib/services.js` still contains Supabase publishing logic despite the chosen Neon/Clerk architecture. It is gated off in hosted mode, but removing or isolating it after cutover will reduce ambiguous configuration and migration risk. | `lib/services.js`, `.env.example`. |

## Checks and limits

`pnpm check` began and passed brief validation and many local tests, including conversation recovery, legacy demo routes, cutover gate checks, and several integrated route checks. The PM asked me to stop the concurrent process because a separate full check was already running; I stopped my session before completion. The PM reported 329 passes and two PGlite Abort failures in that separate run and is rerunning them in isolation. I have not counted my interrupted run as a pass. No local build was started by this reviewer.

I attempted to inspect the public site with the browser and web fetch. The browser tab could not be claimed or attached in this subagent session, and the web fetch returned inaccessible. Thus the live-site findings above are based on the PM's prior recorded preview evidence, not my own current browser observation. Production visual, mobile, voice, publication, checkout, seat selection, and accessibility behavior remain unverified here.

## Acceptance sequence

1. Complete the fresh Neon schema migration and read-back. Verify Clerk Google/email sign-in and owner/staff permissions on the connected preview.
2. Exercise creator conversation → draft import → required photos and pinned locations → owner publish → public event → quote → demo seat choice → demo receipt, recording API and database evidence. Check normal, error, retry, mobile, and keyboard paths.
3. Verify one legacy Blob listing/receipt remains accessible by direct link but disappears from search after cutover. Activate each server/client gate as a coordinated change, then recheck the public site.
4. Implement and test promotional/referral functionality on the canonical new event route before calling the broader platform complete. Defer real payment and payout claims until the chosen provider and fee rules are verified.
