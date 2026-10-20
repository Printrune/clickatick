# Front-page setup backend handoff v1

Brief read: brief/project.json v52. Frontend agreed contract/front-page-setup-v1.md before implementation. PM and Frontend agreed refundPolicy addition in contract/front-page-setup-v2.md before that field was implemented.

## Implemented

- lib/setup.mjs supplies bounded setup validation, location reuse, map provider coordinate links, browser photo stripping, AI patch merging and referral split calculation.
- lib/listing.mjs preserves setup through parse, JSON download and browser draft restore. Legacy drafts default to allocated inventory. Shared mode preserves independent total quantity.
- app/api/chat/route.js strips media defensively and merges only supported AI setup changes. lib/claude-ai.mjs adds nullable setupPatch fields. Null means preserve, so unchanged long policies do not need to repeat in output. Existing 1800 output token cap and spend gates stay unchanged.
- Coordinates and photos cannot be edited by AI. Address changes invalidate old coordinates; existing venue photos remain browser-owned. Disclaimer changes reset organiser review. Existing review persists for unchanged wording.
- Main location reflects selected business/event address. Separate venue details survive reuse toggles.
- Restrictions, disclaimer, refund policy and requested payment preferences remain separate editable draft data. No legal approval is inferred.
- Any extended setup is blocked from existing publication adapters. No database, email, payment, confirmation or payout service was changed.
- Referral preview conserves cents. Rounded reward is capped at the business remainder for tiny prices. Processing fees are excluded.

## Evidence

Command: node --test tests/setup.test.mjs tests/listing.test.mjs tests/claude-ai.test.mjs tests/claude-ai-route.test.mjs

Result: 71 passed, 0 failed. New tests include legacy compatibility, full JSON roundtrip, shared and allocated inventories, pin reuse and invalidation, photo restrictions and stripping, organiser review preservation, nullable refund policy patches, publication guard, 500 cent-rounding combinations and actual chat handler with intercepted provider.

A full default-sandbox suite initially found a test import fixture missing the new setup import. Fixed tests/claude-ai-route.test.mjs and reran it successfully. Two disk PGlite tests aborted in sandbox; PM informed to run final full checks with existing elevated verification workflow. No live paid AI request made. New Claude schema/provider execution remains unverified against live API until integration validation.

## Limits

Browser draft and JSON are the persistence scope. Venue photos can be included in the downloadable draft and must be omitted from chat requests by Frontend using toAIListing. Avatar snapshots remain separate and unchanged. Map links open the chosen exact coordinates; these helpers do not claim bidirectional Google/Bing synchronization or geocoding.

90 percent is a technical economic bound preventing referral rewards exceeding the business share before processing fees; allocation of processing costs remains unresolved. Digital confirmation is a future fixed requirement, not a working delivery service. EPay remains an unknown provider preference.

## Skills read

team/roles/backend.md, team/shared-rules-v1.md, AGENTS.md, .agents/skills/brief-to-site/SKILL.md, .agents/skills/workshop-owner-language/SKILL.md, pstack unslop, boundary discipline and prove-it-works actual skill files. No unrelated integrations or libraries added.
