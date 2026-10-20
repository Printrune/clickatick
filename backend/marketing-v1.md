# Listing marketing backend v1

Date: 2026-10-18. Brief baseline71. PM agreed contract/marketing-v1 before implementation, including explicit Claude refinement addendum. Read shared rules, backend role, starter AGENTS/README, brief-to-site, unslop, Next bundled route-handler/cookie docs and relevant AI guidance. Existing direct Claude provider remains; no dependency/provider migration.

## Implementation

- Optional cryptographic creator token on publish is hashed inside the immutable v2 listing record. Public reads omit it. Legacy v1 records remain readable but cannot be claimed. Token-bearing retry requires original token and content. The route mints an HttpOnly, SameSite=Strict cookie, Secure in production, with fixed30-day expiry.
- Every marketing operation authorizes that capability, checks fixed expiry and durable revocation. No ID-only ownership claim. GET is private/no-store with Vary Cookie. Other writes enforce same origin and bounded streamed JSON.
- Immutable saved versions have listing fingerprint, fixed destination and demo flag. Twenty versions maximum per listing, idempotent UUID intent. Exact-version approval is separate and immutable. Editing creates needs-review; prior approvals remain.
- Listing templates preserve local wall time/timezone, actual mixed price minimum, original-photo source, supplied restrictions and demo disclosure. No capacity scarcity claim. Static source tools do not call a provider.
- Explicit refinement uses the configured existing Claude key/model and claudeReady budget gate, max600 output tokens, tiny structured response and no tools. Durable immutable claims permit3 calls/listing and20 calls/global. A same-ID replay never makes a second paid call. Unknown or failed requests consume their claim and require an explicit new attempt. Successful results are cached; candidates do not autosave or autoapprove.
- DELETE permanently revokes access. No legacy recovery or account cross-device recovery. Clearing the browser loses access. Assets still need final frontend inspection and export verification.

## Evidence

`evidence/marketing-backend-tests-v1.txt`:27 passed,0 failed, consisting of18 existing publishing tests plus9 new marketing tests. Checks include creator A/B/visitor isolation, wrong credentials, legacy denial, expiry/revocation, publication race/retry, immutable versions/approval history/caps, real route origin/cookie/cache/body controls, provider-mocked bound requests, unknown-result behavior, concurrent call deduplication and global spending request cap.

All storage tests use in-memory atomic create adapters. Actual route bodies are loaded with only external storage and origin adapters replaced. No live Blob, paid Claude request, social send, real payment or deployment was performed by this specialist.

## Limits

The monetary budget remains the existing prepaid account cap, not a new USD guarantee. Request caps add durable abuse bounds but do not measure historical account spend. Rendering and real provider output still need PM verification. Provider prompts constrain factual edits; organizers must review candidate copy. A storyboard is text, not a rendered video. An ad plan does not launch a campaign. Store reads may fan out to20 version slots; bounded for this demo, not a high-volume database architecture.

## Source ownership

lib/marketing-http.mjs, marketing-service.mjs, marketing-draft.mjs, marketing-claude.mjs; lib/demo-service.mjs; app/api/demo/listings/route.js; app/api/marketing/[id] routes; tests/marketing.test.mjs and updated old route-loader import handling in demo-publishing.test.mjs.

### Content review correction

Removed silent caption truncation. Multi-date summaries now name the first local date and additional-date count, retaining timezone and directing readers to the full listing schedule. All4000characters of valid restrictions, title/location, fixed booking link and demo disclosure remain in each starter kind. Optional description is omitted. Added an extreme valid50-date/4000-restriction test across all four kinds. Video helper third argument, PM-approved before coding, now produces a distinct location-first storyboard for visit. Latest evidence28/28tests passed, including10new marketing tests. No paid calls.
