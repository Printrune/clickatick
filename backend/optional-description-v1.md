# Optional description backend handoff

Brief: brief/project.json v67. Contract/demo-publishing-v3.md was written and approved by PM and Frontend before implementation on 2026-10-18.

Public demo publication now accepts event and activity descriptions as empty strings. The canonical Listing shape, parser, 4,000-character bound and content digest calculation remain unchanged. Shared listingRequiredErrors no longer requires description by default; title, location, price, capacity, schedule and ticket-category checks remain. The Claude system prompt explicitly treats description as optional and forbids inventing skipped description content.

Legacy publicationErrors explicitly requires description because database/setup.sql still enforces a nonempty description in both its table constraint and publish RPC. No SQL migration or false legacy support was introduced. Removed obsolete draft-download advice from the legacy limitation and oversized-chat error. Receipt confirmation downloads are unaffected.

Verification: node --test tests/demo-publishing.test.mjs tests/listing.test.mjs tests/claude-ai-route.test.mjs passed 45 tests. New actual-route tests publish event and weekly activity drafts with description:'', read through a fresh storage adapter, and replay without overwriting. They reject missing title/location/price/capacity/schedule and oversized descriptions, retain the legacy requirement, and verify unchanged canonical digests for existing nonempty descriptions. The actual private Blob SDK wrapper is exercised with an injected mock SDK; no real storage call was made.

node backend/verify-v2.mjs passed the legacy activation, origin/session/validation, RPC payload and storage rejection rehearsal. All fetches were mocked. No paid model requests, preview server, deployment or secret reads were performed. Frontend owns draft-download removal, five-group progress, optional labels, blank public-description rendering and navigation after successful persistence.
