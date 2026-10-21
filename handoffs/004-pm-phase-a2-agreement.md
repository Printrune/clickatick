# PM handoff: integrated ticketing Phase A2

Date: 2026-10-20. Shared brief `brief/project.json` v93.

Backend wrote `contract/integrated-phase-a2-v2.md` before implementation. Frontend explicitly agreed in `frontend/integrated-phase-a2-agreement-v1.md`. PM accepts owner-only, brand-scoped private event draft create/list/read/edit and import from the existing `/creator` draft. Import must preserve local wall times, separate locations, ticket tiers, capacity policy, restrictions and warnings. Creator retains its local source until the organizer explicitly removes it. A2 does not publish or alter the legacy public demo.

Backend owns migration 002, parser/mapper, scoped API and tests. Frontend owns brand draft list/editor, creator handoff, warnings, map-pin controls and unconfigured states. The approved Google map is prototype-only; numeric pin entry remains usable when a key or map tiles are unavailable. Private media upload remains disabled until the owner decides retention and cleanup; inline images remain on the device and are flagged as incomplete. Both sides must agree a new contract version before changing shared DTOs or routes.

Outstanding owner decisions: staff publishing rights, private media retention, seating policy and published-edit review. These do not authorize guessing live payment or admission behavior.
