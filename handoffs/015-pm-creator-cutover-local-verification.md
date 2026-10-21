# PM local verification 015: creator cutover

Date: 2026-10-21. Brief `brief/project.json` v107. Contract `contract/creator-neon-cutover-v2.md` and PM handoff 014. This is local verification with `CREATOR_NEON_CUTOVER_ENABLED=true`, not hosted activation.

- Combined focused tests for creator cutover, catalog, existing demo routes and integrated A1/A2/A4/A5/A6 passed 72/72 before the A6 routing repair. Repair-focused tests then passed 10/10.
- Production `pnpm run build` passed after correcting dashboard JSX and the dynamic route collision.
- A task-owned `next start -p 3039` launched with the cutover gate on. GET `/`, `/discover`, `/creator` returned 200. The creator HTML contained “Save to brand draft” and omitted “Publish demo listing.” Discover rendered “Search loaded events.” POST `/api/demo/listings` returned 410 with `LEGACY_PUBLISHING_CLOSED` and the brand-draft recovery URL. The task-owned preview was stopped.
- First runtime attempt exposed a Next dynamic route collision between `[draftId]` and `[eventId]`; Backend unified the segment while preserving the URL and added a regression test. A6 quote/checkout writes were also routed to versioned handlers under its flag.

Not verified here: connected Clerk/Neon/Blob, published event/media, old real direct-link data, a browser sign-in, buyer checkout, Vercel team access, or public activation. All cutover and integrated service flags remain off in configuration. The owner is being guided through Vercel team OAuth permissions.
